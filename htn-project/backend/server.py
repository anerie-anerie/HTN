import cv2
import mediapipe as mp
import numpy as np
import base64
import asyncio
from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
import sounddevice as sd
import threading, time, math, random

# ---------------- CONFIG ---------------- #
SAMPLE_RATE = 44100

# High motion notes
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

# Low motion pentatonic scale
PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]  # C D E G A C

# ---------------- FASTAPI APP ---------------- #
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Synth Functions ---------------- #
def midi_to_freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def build_scale(root, intervals=MAJOR):
    return [midi_to_freq(root + i) for i in intervals]

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

# ---------------- Global High Motion State ---------------- #
phase = 0.0
active_notes = []   # [(freq, start_time, velocity)]
root_midi = 60
current_scale = build_scale(root_midi)
instruments = ["sine","saw","square","pluck"]
instrument_idx = 0

# ---------------- Audio Callback ---------------- #
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
    active_notes[:] = keep
    outdata[:] = (wave * 0.3).reshape(-1,1)
    phase = (phase + frames) % SAMPLE_RATE

# Start audio stream
stream = sd.OutputStream(channels=1, samplerate=SAMPLE_RATE, callback=audio_callback)
stream.start()

# ---------------- Mediapipe Setup ---------------- #
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

mp_draw = mp.solutions.drawing_utils
cap = cv2.VideoCapture(0)

# ---------------- Helpers ---------------- #
def midi_note_from_tilt(tilt):
    idx = int(np.interp(tilt, [-0.1, 0.1], [0, len(PENTATONIC_SCALE)-1]))
    idx = max(0, min(len(PENTATONIC_SCALE)-1, idx))
    return PENTATONIC_SCALE[idx]

def eye_distance(landmarks, eye_idx, img_h):
    return abs(landmarks[eye_idx[0]].y - landmarks[eye_idx[1]].y) * img_h

# ---------------- WebSocket ---------------- #
@app.websocket("/ws/camera")
async def camera_ws(websocket: WebSocket, motion: str = Query("high")):
    """
    motion=high -> High motion hand/finger synth
    motion=low -> Low motion face/blink synth
    """
    global root_midi, current_scale, instrument_idx
    await websocket.accept()

    # High motion globals
    prev_pos, prev_state = {}, {}
    pinch_prev = {"Left": False, "Right": False}
    last_trigger = {"Left": 0, "Right": 0}
    COOLDOWN = 0.8
    last_tap = 0
    prev_edge_dist = None
    splats = []  # visual effects
    SPLAT_DURATION = 1.2

    # Low motion globals
    LEFT_EYE = [159, 145]
    RIGHT_EYE = [386, 374]
    current_note = 440
    note_duration = 0.5
    note_volume = 0.5
    prev_left_blink = False
    prev_right_blink = False

    while True:
        ret, frame = cap.read()
        if not ret: continue
        frame = cv2.flip(frame, 1)
        h,w,_ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if motion == "high":
            results = hands.process(rgb)
            now = time.time()
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
                        prev_state[(hand, tip)] = extended

                    # Pinch = scale shift
                    thumb = hl.landmark[4]; index = hl.landmark[8]
                    dist = math.dist((thumb.x,thumb.y),(index.x,index.y))
                    is_pinch = dist < 0.05
                    if not pinch_prev[label] and is_pinch and (now - last_trigger[label]) > COOLDOWN:
                        if label=="Right": root_midi+=1
                        else: root_midi-=1
                        current_scale = build_scale(root_midi)
                        last_trigger[label]=now
                    pinch_prev[label]=is_pinch
                    mp_draw.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS)

        else:  # low motion
            results = face_mesh.process(rgb)
            if results.multi_face_landmarks:
                face = results.multi_face_landmarks[0]

                left_dist = eye_distance(face.landmark, LEFT_EYE, h)
                right_dist = eye_distance(face.landmark, RIGHT_EYE, h)
                left_blink = left_dist < 5
                right_blink = right_dist < 5

                if left_blink and not prev_left_blink:
                    current_note = PENTATONIC_SCALE[0]  # trigger note
                if right_blink and not prev_right_blink:
                    current_note = PENTATONIC_SCALE[2]  # trigger note

                prev_left_blink = left_blink
                prev_right_blink = right_blink

                # Head tilt → note
                left_ear = face.landmark[234]; right_ear = face.landmark[454]
                tilt = left_ear.y - right_ear.y
                current_note = midi_note_from_tilt(tilt)

                # Face distance → duration
                chin = face.landmark[152]; forehead = face.landmark[10]
                face_height = abs(forehead.y - chin.y)
                note_duration = np.interp(face_height, [0.05,0.25], [1.0,0.2])

                # Draw landmarks
                for lm in face.landmark:
                    x, y = int(lm.x*w), int(lm.y*h)
                    cv2.circle(frame,(x,y),1,(0,255,0),-1)

        # HUD
        cv2.putText(frame,f"Motion: {motion}",(50,50),
                    cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,0),2)

        # Encode + send frame
        _, buffer = cv2.imencode(".jpg", frame)
        jpg_as_text = base64.b64encode(buffer).decode("utf-8")
        try:
            await websocket.send_text(jpg_as_text)
            await asyncio.sleep(0.03)
        except:
            break

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)