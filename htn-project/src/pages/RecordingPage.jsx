// RecordingPage.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecordingPage() {
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [recordingStopped, setRecordingStopped] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const navigate = useNavigate();

    // ---- Recording Functions ----
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

        recorder.onstop = () => {
            setRecordingStopped(true);
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

    // ---- Upload with Metadata ----
    const confirmUpload = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "recording.webm");
        formData.append("title", title);
        formData.append("description", description);

        try {
            const response = await fetch("http://127.0.0.1:5000/upload-video", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                alert("Uploaded successfully! 🎉");
                setShowModal(false);
                setTitle("");
                setDescription("");
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed. Check console for details.");
        }
    };

    const goToGallery = () => {
        navigate("/gallery");
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
                    border: "2px solid #9bf0ff",
                    borderRadius: "8px",
                    transform: "scaleX(-1)"
                }}
            />

            <div style={{ marginTop: "20px" }}>
                {!stream && (
                    <button onClick={startCamera} style={btnStyle}>Enable Camera</button>
                )}
                {!isRecording && stream && (
                    <button onClick={startRecording} style={btnStyle}>Start Recording</button>
                )}
                {isRecording && (
                    <button onClick={stopRecording} style={{ ...btnStyle, background: "#ff2fb3" }}>Stop Recording</button>
                )}
                {recordedChunks.length > 0 && (
                    <>
                        <button onClick={downloadVideo} style={{ ...btnStyle, background: "#79e0f2" }}>Download Recording</button>
                        <button onClick={() => setShowModal(true)} style={{ ...btnStyle, background: "#28a745" }}>Add to Gallery</button>
                    </>
                )}
                {recordingStopped && (
                    <button onClick={goToGallery} style={{ ...btnStyle, background: "#ffa500" }}>View Gallery</button>
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <h2>Submit to Gallery</h2>
                        <input
                            type="text"
                            placeholder="Enter a title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={inputStyle}
                        />
                        <textarea
                            placeholder="Enter a description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ ...inputStyle, height: 80 }}
                        />
                        <div>
                            <button onClick={confirmUpload} style={{ ...btnStyle, background: "#28a745" }}>Upload</button>
                            <button onClick={() => setShowModal(false)} style={{ ...btnStyle, background: "#ff2f2f" }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
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

const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
};

const modalContent = {
    background: "#1a1a1a",
    padding: "20px",
    borderRadius: "10px",
    width: "400px",
    textAlign: "center",
};

const inputStyle = {
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #555",
    background: "#101010",
    color: "#fff",
};