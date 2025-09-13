#MVP
#two hands with different sounds with futher away is quieter for volume control and higher is pitch control
#fist is BEEP (--> make it sound cooler)
#next steps: more hand movments and smoother sounds
import cv2
import mediapipe as mp
import numpy as np
import sounddevice as sd
import time

# --- MediaPipe setup ---
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
mp_draw = mp.solutions.drawing_utils

# --- Audio setup ---
SAMPLE_RATE = 44100
SMOOTHING = 0.1
phase = 0.0
current_pitch = {"Left": 440.0, "Right": 440.0}
current_volume = {"Left": 0.4, "Right": 0.4}
hand_visible = {"Left": False, "Right": False}

# --- Fist detection ---
prev_fist_state = {"Left": False, "Right": False}
fist_threshold = 0.2  # average distance from wrist to fingertips

def play_ting():
    """Simple bell-like TING sound."""
    duration = 0.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
    freqs = [800, 1200, 1600, 2000]
    wave = sum(np.sin(2 * np.pi * f * t) for f in freqs)
    envelope = np.exp(-6 * t)  # fast decay
    sd.play(0.5 * wave * envelope, samplerate=SAMPLE_RATE)

def audio_callback(outdata, frames, time_info, status):
    global phase
    t = (np.arange(frames) + phase) / SAMPLE_RATE
    wave = np.zeros(frames)

    # --- Right hand: electronic sign wave, softened ---
    if hand_visible.get("Right", False):
        raw_wave = np.sign(np.sin(2 * np.pi * current_pitch["Right"] * t))
        # smooth using simple envelope
        envelope = np.linspace(0.9, 1.0, frames)
        wave += current_volume["Right"] * raw_wave * envelope

    # --- Left hand: ring modulation, softened ---
    if hand_visible.get("Left", False):
        mod_freq = current_pitch["Left"] * 2.5
        raw_wave = np.sin(2 * np.pi * current_pitch["Left"] * t) * np.sin(2 * np.pi * mod_freq * t)
        envelope = np.linspace(0.9, 1.0, frames)
        wave += current_volume["Left"] * raw_wave * envelope
    
    outdata[:] = wave.reshape(-1, 1)
    phase = (phase + frames) % SAMPLE_RATE

# --- Webcam ---
cap = cv2.VideoCapture(0)
stream = sd.OutputStream(channels=1, samplerate=SAMPLE_RATE, callback=audio_callback)
stream.start()

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb)
    h, w, _ = frame.shape

    # Reset visibility
    hand_visible["Left"] = False
    hand_visible["Right"] = False

    if results.multi_hand_landmarks and results.multi_handedness:
        for hand_landmarks, hand_handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            label = hand_handedness.classification[0].label  # "Left" or "Right"

            # --- Print all coordinates ---
            coords = [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]
            print(f"{label} hand coordinates:")
            for i, (x, y, z) in enumerate(coords):
                print(f"  Landmark {i}: x={x:.3f}, y={y:.3f}, z={z:.3f}")

            # --- Check if hand is present ---
            if all(x == 0 and y == 0 and z == 0 for x, y, z in coords):
                hand_visible[label] = False
                continue
            else:
                hand_visible[label] = True

            # --- Update pitch & volume ---
            wrist = hand_landmarks.landmark[0]
            target_pitch = np.interp(1 - wrist.y, [0, 1], [200, 1000])
            current_pitch[label] = (1 - SMOOTHING) * current_pitch[label] + SMOOTHING * target_pitch

            x_coords = [lm.x for lm in hand_landmarks.landmark]
            y_coords = [lm.y for lm in hand_landmarks.landmark]
            hand_size = max(max(x_coords) - min(x_coords), max(y_coords) - min(y_coords))
            target_volume = np.interp(hand_size, [0.05, 0.35], [0.0, 1.0])

            if label == "Right":
                target_volume *= 0.1  # 40% of original volume
            current_volume[label] = (1 - SMOOTHING) * current_volume[label] + SMOOTHING * target_volume

            # --- Print pitch & volume ---
            print(f"{label} Hand | Pitch: {current_pitch[label]:.1f} Hz | Volume: {current_volume[label]:.2f}")

            # --- Fist detection ---
            finger_tips = [hand_landmarks.landmark[i] for i in [8, 12, 16, 20]]
            avg_dist = np.mean([abs(f.y - wrist.y) for f in finger_tips])
            is_fist = avg_dist < fist_threshold

            # Trigger TING when hand quickly closes & opens
            if prev_fist_state[label] and not is_fist:
                play_ting()
                print("TING!")
            prev_fist_state[label] = is_fist

            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    cv2.imshow("Hands Audio + Fist Trigger", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
stream.stop()
stream.close()
