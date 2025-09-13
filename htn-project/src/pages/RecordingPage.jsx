// src/pages/RecordingPage.jsx
import React, { useRef, useState } from "react";

export default function RecordingPage() {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Please allow camera and microphone access!");
        }
    };

    const startRecording = () => {
        if (!stream) {
            alert("Start the camera first!");
            return;
        }
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        setRecordedChunks([]);

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        recorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const downloadVideo = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "recording.webm";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ textAlign: "center", padding: "20px", color: "#eaeaea" }}>
            <h1>Recording Page</h1>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: "60%",
                    height: "px",
                    border: "2px solid #9bf0ff",
                    borderRadius: "8px",
                    transform: "scaleX(-1)"
                }}
            />

            <div style={{ marginTop: "20px" }}>
                {!stream && (
                    <button onClick={startCamera} style={btnStyle}>
                        Enable Camera
                    </button>
                )}
                {!isRecording && stream && (
                    <button onClick={startRecording} style={btnStyle}>
                        Start Recording
                    </button>
                )}
                {isRecording && (
                    <button onClick={stopRecording} style={{ ...btnStyle, background: "#ff2fb3" }}>
                        Stop Recording
                    </button>
                )}
                {recordedChunks.length > 0 && (
                    <button onClick={downloadVideo} style={{ ...btnStyle, background: "#79e0f2" }}>
                        Download Recording
                    </button>
                )}
            </div>
        </div>
    );
}

const btnStyle = {
    margin: "10px",
    padding: "10px 20px",
    background: "#9bf0ff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
};
