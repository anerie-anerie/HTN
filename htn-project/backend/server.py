import cv2
import mediapipe as mp
import numpy as np
import base64
import asyncio
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
import sounddevice as sd
import threading, time, math, random
import json

# ---------------- CONFIG ---------------- #
SAMPLE_RATE = 44100
NOTE_NAMES = {
    0: "C", 1: "C# / Db", 2: "D", 3: "D# / Eb",
    4: "E", 5: "F", 6: "F# / Gb", 7: "G",
    8: "G# / Ab", 9: "A", 10: "A# / Bb", 11: "B"
}
MAJOR = [0, 2, 4, 5, 7, 9, 11, 12]

FINGER_ORDER = [
    ("Left", 20), ("Left", 16), ("Left", 12), ("Left", 8),
    ("Right", 8), ("Right", 12), ("Right", 16), ("Right", 20)
]

# ---------------- FASTAPI APP ---------------- #
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_mode = "high"  # default: high motion

@app.post("/set-mode")
async def set_mode(request: Request):
    """Switch between low and high motion modes"""
    global current_mode
    data = await request.json()
    mode = data.get("mode")
    if mode in ["high", "low"]:
        current_mode = mode
        print(f"Mode switched to {mode}")
        return {"status": "ok", "mode": mode}
    return {"status": "error", "message": "Invalid mode"}

# ---------------- SCALE & SYNTH ---------------- #
def midi_to_freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def build_scale(root, intervals=MAJOR):
    return [midi_to_freq(root + i) for i in intervals]

# Synth waveforms
def synth_waveform(freq, t, instr, vel):
    if instr == "sine":
        return np.sin(2*np.pi*freq*t) * vel
    elif instr == "saw":
        return (2 * (t*freq - np.floor(0.5 + t*freq))) * vel
    elif instr == "square":
        return np.sign(np.sin(2*np.pi*freq*t)) * vel
    elif instr == "pluck":
        return np.sin(2*np.pi*freq*t) * vel * np.exp(-3*t)
    return np.sin(2*np.pi*freq*t) * vel

# Global synth state (high motion)
phase = 0.0
active_notes = []   # [(freq, start_time, velocity)]
root_midi = 60
current_scale = build_scale(root_midi)
instruments = ["sine","saw","square","pluck"]
instrument_idx = 0

def audio_callback(outdata, frames, time_info, status):
    global phase, active_notes, instrument_idx
    t = (np.arange(frames) + phase) / SAMPLE_RATE
    wave = np.zeros(frames)
    now = time.time()
    keep = []
    for (f, st, vel) in active_notes:
        age = now - st
        if age < 1.5:
            env = vel * np.exp(-3 * age)
            wave += synth_waveform(f, t, instruments[instrument_idx], env)
            keep.append((f, st, vel))
    active_notes = keep
    outdata[:] = (wave * 0.3).reshape(-1,1)
    phase = (phase + frames) % SAMPLE_RATE

# Start audio stream
stream = sd.OutputStream(channels=1, samplerate=SAMPLE_RATE, callback=audio_callback)
stream.start()

# ---------------- HAND DETECTION (high motion) ---------------- #
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=2,min_detection_confidence=0.7,min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils
cap = cv2.VideoCapture(0)

# Gesture state
prev_pos, prev_state = {}, {}
pinch_prev = {"Left": False, "Right": False}
last_trigger = {"Left": 0, "Right": 0}
COOLDOWN = 0.8
last_tap = 0
TAP_COOLDOWN = 1.0
prev_edge_dist = None

# Visual splats
splats = []  # [(x,y,color,start_time)]
SPLAT_DURATION = 1.2

# ---------------- LOW MOTION (face mesh) ---------------- #
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
LEFT_EYE = [159, 145]
RIGHT_EYE = [386, 374]

PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]

low_current_note = 440
low_note_duration = 0.5
low_note_volume = 0.5
low_lock = threading.Lock()

def play_ting():
    duration = 0.3
    t = np.linspace(0, duration, int(SAMPLE_RATE*duration), False)
    freqs = [800, 1200, 1600]
    wave = sum(np.sin(2*np.pi*f*t) for f in freqs)
    envelope = np.exp(-4*t)
    wave = 0.5 * wave * envelope
    sd.play(wave, samplerate=SAMPLE_RATE)

def synth_wave(pitch, volume, duration):
    t = np.linspace(0, duration, int(SAMPLE_RATE*duration), endpoint=False)
    wave = (0.6*np.sin(2*np.pi*pitch*t) +
            0.3*np.sin(2*np.pi*2*pitch*t) +
            0.1*np.sin(2*np.pi*0.5*pitch*t))
    wave /= np.max(np.abs(wave))
    return volume * wave

def low_audio_loop():
    global low_current_note, low_note_duration, low_note_volume
    while True:
        with low_lock:
            note = low_current_note
            dur = low_note_duration
            vol = low_note_volume
        wave = synth_wave(note, vol, dur)
        sd.play(wave, samplerate=SAMPLE_RATE)
        sd.wait()

threading.Thread(target=low_audio_loop, daemon=True).start()

def eye_distance(landmarks, eye_idx, img_h):
    return abs(landmarks[eye_idx[0]].y - landmarks[eye_idx[1]].y) * img_h

# ---------------- WEBSOCKET ---------------- #
@app.websocket("/ws/camera")
async def camera_ws(websocket: WebSocket):
    global root_midi, current_scale, instrument_idx
    global prev_edge_dist, last_tap, low_current_note, low_note_duration
    await websocket.accept()

    prev_left_blink = False
    prev_right_blink = False

    while True:
        ret, frame = cap.read()
        if not ret: 
            continue
        frame = cv2.flip(frame, 1)
        h,w,_ = frame.shape
        now = time.time()

        if current_mode == "high":
            # ---------- HIGH MOTION HAND LOGIC ----------
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)
            hand_edges = {}

            if results.multi_hand_landmarks and results.multi_handedness:
                for hl, hh in zip(results.multi_hand_landmarks, results.multi_handedness):
                    label = hh.classification[0].label
                    hand_edges[label] = (hl.landmark[17].x, hl.landmark[17].y)

                    # Fingers → notes
                    for i, (hand, tip) in enumerate(FINGER_ORDER):
                        if hand != label: continue
                        if i >= len(current_scale): continue

                        tip_y = hl.landmark[tip].y
                        pip_y = hl.landmark[tip-2].y
                        mcp_y = hl.landmark[tip-3].y
                        extended = tip_y < pip_y < mcp_y

                        vel = 0.7
                        if (hand, tip) in prev_pos:
                            dy = prev_pos[(hand, tip)] - tip_y
                            vel = min(1.0, max(0.2, abs(dy*10)))
                        prev_pos[(hand, tip)] = tip_y

                        if extended and not prev_state.get((hand, tip), False):
                            f = current_scale[i]
                            active_notes.append((f, now, vel))
                            tx,ty = int(w*hl.landmark[tip].x), int(h*hl.landmark[tip].y)
                            color = (random.randint(100,255),random.randint(100,255),random.randint(100,255))
                            splats.append((tx,ty,color,now))
                            print(f"{hand} finger {tip} → {NOTE_NAMES[root_midi % 12]} note {i}")
                        prev_state[(hand, tip)] = extended

                    # Pinch = scale shift
                    thumb = hl.landmark[4]; index = hl.landmark[8]
                    dist = math.dist((thumb.x,thumb.y),(index.x,index.y))
                    is_pinch = dist < 0.05
                    if not pinch_prev[label] and is_pinch and (now - last_trigger[label]) > COOLDOWN:
                        if label == "Right": root_midi += 1
                        else: root_midi -= 1
                        current_scale = build_scale(root_midi)
                        print(f"Scale root → {NOTE_NAMES[root_midi % 12]}")
                        last_trigger[label] = now
                    pinch_prev[label] = is_pinch

                    mp_draw.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS)

            # Tap detection
            if "Left" in hand_edges and "Right" in hand_edges:
                lx,ly = hand_edges["Left"]; rx,ry = hand_edges["Right"]
                dist = math.dist((lx,ly),(rx,ry))
                if prev_edge_dist is not None:
                    speed = prev_edge_dist - dist
                    if dist < 0.07 and speed > 0.01 and (now-last_tap)>TAP_COOLDOWN:
                        instrument_idx = (instrument_idx + 1) % len(instruments)
                        print(f"Instrument → {instruments[instrument_idx]}")
                        last_tap = now
                prev_edge_dist = dist

            # Draw splats
            new_splats = []
            for (x,y,color,st) in splats:
                age = now - st
                if age < SPLAT_DURATION:
                    overlay = frame.copy()
                    for _ in range(15):
                        ox = random.randint(-50,50); oy = random.randint(-50,50)
                        radius = random.randint(15,45)
                        cv2.circle(overlay,(x+ox,y+oy),radius,color,-1)
                    alpha = max(0.1,1-age/SPLAT_DURATION)
                    frame = cv2.addWeighted(overlay,alpha,frame,1-alpha,0)
                    new_splats.append((x,y,color,st))
            splats[:] = new_splats

            # HUD
            cv2.putText(frame,f"Mode: HIGH",(50,30),cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,255),2)
            cv2.putText(frame,f"Root: {NOTE_NAMES[root_midi%12]}",(50,70),cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,0),2)
            cv2.putText(frame,f"Instrument: {instruments[instrument_idx]}",(50,110),cv2.FONT_HERSHEY_SIMPLEX,1,(0,200,255),2)

        else:
            # ---------- LOW MOTION FACE LOGIC ----------
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if results.multi_face_landmarks:
                face = results.multi_face_landmarks[0]

                # Eyes blink detection
                left_dist = eye_distance(face.landmark, LEFT_EYE, h)
                right_dist = eye_distance(face.landmark, RIGHT_EYE, h)
                left_blink = left_dist < 5
                right_blink = right_dist < 5

                if left_blink and not prev_left_blink:
                    print("Left eye blink → Ting!")
                    play_ting()
                if right_blink and not prev_right_blink:
                    print("Right eye blink → Ting!")
                    play_ting()

                prev_left_blink = left_blink
                prev_right_blink = right_blink

                # Head tilt → pentatonic note
                left_ear = face.landmark[234]
                right_ear = face.landmark[454]
                tilt = left_ear.y - right_ear.y
                idx = int(np.interp(tilt, [-0.1, 0.1], [0, len(PENTATONIC_SCALE)-1]))
                idx = max(0, min(len(PENTATONIC_SCALE)-1, idx))
                with low_lock:
                    low_current_note = PENTATONIC_SCALE[idx]

                # Face distance → tempo
                chin = face.landmark[152]
                forehead = face.landmark[10]
                face_height = abs(forehead.y - chin.y)
                with low_lock:
                    low_note_duration = np.interp(face_height, [0.05, 0.25], [1.0, 0.2])

                # Draw landmarks
                for lm in face.landmark:
                    x, y = int(lm.x*w), int(lm.y*h)
                    cv2.circle(frame, (x, y), 1, (0,255,0), -1)

                cv2.putText(frame,f"Mode: LOW",(50,30),cv2.FONT_HERSHEY_SIMPLEX,1,(255,0,0),2)
                cv2.putText(frame,f"Note={low_current_note:.1f}Hz Dur={low_note_duration:.2f}s",(50,70),
                            cv2.FONT_HERSHEY_SIMPLEX,0.8,(0,255,255),2)

        # Encode + send frame
        _, buffer = cv2.imencode(".jpg", frame)
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")
        try:
            await websocket.send_text(json.dumps({
                "type": "frame",
                "b64": jpg_as_text
            }))
            await asyncio.sleep(0.03)
        except:
            break

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)