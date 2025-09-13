import cv2
import mediapipe as mp
import numpy as np
import sounddevice as sd
import time

# --- MediaPipe setup ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose()
mp_draw = mp.solutions.drawing_utils

# --- Audio setup ---
SAMPLE_RATE = 44100

def generate_tone(freq, duration=0.1):
    """Generate a sine wave tone at a given frequency."""
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    wave = 0.5 * np.sin(2 * np.pi * freq * t)
    return wave.astype(np.float32)

def play_tone(freq):
    tone = generate_tone(freq)
    sd.play(tone, samplerate=SAMPLE_RATE, blocking=False)

# --- Webcam ---
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Flip for natural movement
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Pose detection
    results = pose.process(rgb)

    if results.pose_landmarks:
        mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

        # Right wrist landmark (16)
        h, w, _ = frame.shape
        right_wrist = results.pose_landmarks.landmark[16]
        wrist_x, wrist_y = int(right_wrist.x * w), int(right_wrist.y * h)
        wrist_z = right_wrist.z  # relative depth

        # Map z to pitch: closer (more negative) = higher pitch
        # Clamp values so it doesn't go crazy
        freq = np.interp(wrist_z, [-0.5, 0.5], [1000, 200])  # closer = high, farther = low

        # Print and play
        print(f"Wrist Z: {wrist_z:.3f}  ->  Pitch (Hz): {freq:.2f}")
        play_tone(freq)

        # Draw wrist + label
        cv2.circle(frame, (wrist_x, wrist_y), 12, (0, 0, 255), -1)
        cv2.putText(frame, f"{freq:.1f} Hz", (wrist_x - 50, wrist_y - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    time.sleep(0.1)
    cv2.imshow("Hand Distance to Pitch", frame)

    if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit
        break

cap.release()
cv2.destroyAllWindows()
