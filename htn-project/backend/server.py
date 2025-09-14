import cv2
import mediapipe as mp
import numpy as np
import base64
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import sounddevice as sd
import threading, time, math, random

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

# Global synth state
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

# ---------------- HAND DETECTION ---------------- #
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

@app.websocket("/ws/camera")
async def camera_ws(websocket: WebSocket):
    global root_midi, current_scale, instrument_idx
    await websocket.accept()

    while True:
        ret, frame = cap.read()
        if not ret: continue
        frame = cv2.flip(frame, 1)
        h,w,_ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb)
        now = time.time()

        hand_edges = {}

        if results.multi_hand_landmarks and results.multi_handedness:
            for hl, hh in zip(results.multi_hand_landmarks, results.multi_handedness):
                label = hh.classification[0].label

                # Save pinky edge for tap detection
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

                        # Add splat
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
        global prev_edge_dist, last_tap
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
        cv2.putText(frame,f"Root: {NOTE_NAMES[root_midi%12]}",(50,50),
                    cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,0),2)
        cv2.putText(frame,f"Instrument: {instruments[instrument_idx]}",(50,100),
                    cv2.FONT_HERSHEY_SIMPLEX,1,(0,200,255),2)

        # Encode + send frame
        _, buffer = cv2.imencode(".jpg", frame)
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")
        try:
            await websocket.send_text(jpg_as_text)
            await asyncio.sleep(0.03)  # ~30fps
        except:
            break

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)