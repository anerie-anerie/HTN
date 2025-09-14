# server.py
import cv2
import mediapipe as mp
import numpy as np
import base64
import asyncio
import json
import time
import math
import random
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

# MediaPipe hands instance
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7, min_tracking_confidence=0.7)

cap = cv2.VideoCapture(0)

# musical helpers (we'll send MIDI/freq, not play locally)
NOTE_NAMES = {
    0: "C", 1: "C# / Db", 2: "D", 3: "D# / Eb",
    4: "E", 5: "F", 6: "F# / Gb", 7: "G",
    8: "G# / Ab", 9: "A", 10: "A# / Bb", 11: "B"
}
MAJOR = [0, 2, 4, 5, 7, 9, 11, 12]

def midi_to_freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)

def build_scale(root, intervals=MAJOR):
    return [root + i for i in intervals]   # return MIDI numbers

FINGER_ORDER = [
    ("Left", 20), ("Left", 16), ("Left", 12), ("Left", 8),
    ("Right", 8), ("Right", 12), ("Right", 16), ("Right", 20)
]

# runtime state
root_midi = 60
current_scale = build_scale(root_midi)
prev_pos = {}     # (hand, tip) -> y
prev_state = {}   # (hand, tip) -> extended boolean
pinch_prev = {"Left": False, "Right": False}
last_trigger = {"Left": 0, "Right": 0}
COOLDOWN = 0.8
last_tap = 0
TAP_COOLDOWN = 1.0
prev_edge_dist = None

@app.websocket("/ws/camera")
async def camera_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.01)
                continue

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)
            now = time.time()

            # We'll collect events and send them as JSON messages
            events = []

            hand_edges = {}

            if results.multi_hand_landmarks and results.multi_handedness:
                for hl, hh in zip(results.multi_hand_landmarks, results.multi_handedness):
                    label = hh.classification[0].label  # "Left" or "Right"

                    # record pinky base for tap detection
                    hand_edges[label] = (hl.landmark[17].x, hl.landmark[17].y)

                    # Fingers -> notes
                    for i, (hand, tip) in enumerate(FINGER_ORDER):
                        if hand != label: 
                            continue
                        if i >= len(current_scale):
                            continue

                        tip_y = hl.landmark[tip].y
                        pip_y = hl.landmark[tip-2].y
                        mcp_y = hl.landmark[tip-3].y
                        extended = tip_y < pip_y < mcp_y

                        vel = 0.7
                        key = (hand, tip)
                        if key in prev_pos:
                            dy = prev_pos[key] - tip_y
                            vel = min(1.0, max(0.2, abs(dy * 10)))
                        prev_pos[key] = tip_y

                        if extended and not prev_state.get(key, False):
                            midi_note = current_scale[i]
                            freq = midi_to_freq(midi_note)
                            events.append({
                                "type": "note",
                                "hand": hand,
                                "finger_tip": tip,
                                "midi": midi_note,
                                "freq": freq,
                                "velocity": vel,
                                "timestamp": now
                            })

                            # splat drawing info (client will render)
                            tx = int(w * hl.landmark[tip].x)
                            ty = int(h * hl.landmark[tip].y)
                            color = [random.randint(100,255), random.randint(100,255), random.randint(100,255)]
                            events.append({
                                "type": "splat",
                                "x": tx, "y": ty, "color": color, "timestamp": now
                            })

                        prev_state[key] = extended

                    # Pinch detection to shift scale root
                    thumb = hl.landmark[4]
                    index = hl.landmark[8]
                    dist = math.dist((thumb.x, thumb.y), (index.x, index.y))
                    is_pinch = dist < 0.05
                    if not pinch_prev[label] and is_pinch:
                        if (now - last_trigger[label]) > COOLDOWN:
                            if label == "Right":
                                root_midi += 1
                            else:
                                root_midi -= 1
                            current_scale = build_scale(root_midi)
                            events.append({
                                "type": "root_shift",
                                "root_midi": root_midi,
                                "root_name": NOTE_NAMES[root_midi % 12],
                                "timestamp": now
                            })
                            last_trigger[label] = now
                    pinch_prev[label] = is_pinch

                    # draw hand landmarks on frame for visual stream
                    mp_draw.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS)

            # Tap detection (edges)
            if "Left" in hand_edges and "Right" in hand_edges:
                lx,ly = hand_edges["Left"]; rx,ry = hand_edges["Right"]
                dist = math.dist((lx,ly),(rx,ry))
                if prev_edge_dist is not None:
                    speed = prev_edge_dist - dist
                    if dist < 0.07 and speed > 0.01 and (now - last_tap) > TAP_COOLDOWN:
                        # instrument change
                        events.append({"type":"instrument_change","timestamp":now})
                        last_tap = now
                prev_edge_dist = dist

            # Encode frame as JPEG
            _, buffer = cv2.imencode(".jpg", frame)
            jpg_as_text = base64.b64encode(buffer).decode("utf-8")

            # 1) send frame message
            try:
                msg = {"type":"frame","b64": jpg_as_text}
                await websocket.send_text(json.dumps(msg))
            except:
                break

            # 2) send event messages (if any)
            for ev in events:
                try:
                    await websocket.send_text(json.dumps(ev))
                except:
                    break

            await asyncio.sleep(0.03)  # ~30fps
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)