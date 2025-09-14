import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Tone from "tone";

export default function RecordingPage() {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingStopped, setRecordingStopped] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [motionModal, setMotionModal] = useState(false);
  const [motionType, setMotionType] = useState(null); // "high" | "low"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const navigate = useNavigate();
  const synthRef = useRef(null);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    console.log("Tone started");
  }, []);

  const enableCamera = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws/camera");

    wsRef.current.onopen = () => console.log("WS open");

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "frame" && data.b64) {
          const img = new Image();
          img.src = "data:image/jpeg;base64," + data.b64;
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    wsRef.current.onclose = () => console.log("WebSocket camera closed");

    const canvasStream = canvas.captureStream(30);

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const combined = new MediaStream([
        ...canvasStream.getTracks(),
        ...mic.getTracks(),
      ]);
      setStream(combined);
    } catch (err) {
      console.error("Mic access failed:", err);
      setStream(canvasStream);
    }
  };

  const startRecording = () => {
    if (!stream) {
      alert("Enable the camera first!");
      return;
    }
    // Show motion selection modal
    setMotionModal(true);
  };

  const confirmMotion = (type) => {
    setMotionType(type);
    setMotionModal(false);

    if (type === "high") {
      startHighMotionRecording();
    } else if (type === "low") {
      startLowMotionRecording();
    }
  };

  const startHighMotionRecording = () => {
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;
    setRecordedChunks([]);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) setRecordedChunks((prev) => [...prev, event.data]);
    };

    recorder.onstop = () => setRecordingStopped(true);

    recorder.start();
    setIsRecording(true);

    // Start Tone.js music generation (existing high motion logic)
    console.log("High motion music started");
  };

  const startLowMotionRecording = () => {
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = recorder;
    setRecordedChunks([]);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) setRecordedChunks((prev) => [...prev, event.data]);
    };

    recorder.onstop = () => setRecordingStopped(true);

    recorder.start();
    setIsRecording(true);

    // Low motion music generation
    console.log("Low motion music started (use pentatonic/blink/head tilt logic)");
    // Here you would call your Python backend or WebAssembly logic for low-motion
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
        alert("Uploaded successfully!");
        setShowUploadModal(false);
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

  const goToGallery = () => navigate("/gallery");

  return (
    <div style={{ textAlign: "center", padding: "20px", color: "#eaeaea" }}>
      <h1>Recording Page</h1>

      <canvas
        ref={canvasRef}
        style={{
          width: "60%",
          border: "2px solid #9bf0ff",
          borderRadius: "8px",
          transform: "scaleX(1)",
        }}
      />

      <div style={{ marginTop: "20px" }}>
        {!stream && (
          <button onClick={enableCamera} style={btnStyle}>
            Enable Camera
          </button>
        )}
        {!isRecording && stream && (
          <button onClick={startRecording} style={btnStyle}>
            Start Recording
          </button>
        )}
        {isRecording && (
          <button
            onClick={stopRecording}
            style={{ ...btnStyle, background: "#ff2fb3" }}
          >
            Stop Recording
          </button>
        )}
        {recordedChunks.length > 0 && (
          <>
            <button
              onClick={downloadVideo}
              style={{ ...btnStyle, background: "#79e0f2" }}
            >
              Download Recording
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{ ...btnStyle, background: "#28a745" }}
            >
              Add to Gallery
            </button>
          </>
        )}
        {recordingStopped && (
          <button
            onClick={goToGallery}
            style={{ ...btnStyle, background: "#ffa500" }}
          >
            View Gallery
          </button>
        )}
      </div>

      {/* Motion Selection Modal */}
      {motionModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2>Choose Motion Type</h2>
            <p>Do you want Low Motion or High Motion music generation?</p>
            <button
              style={{ ...btnStyle, background: "#79e0f2" }}
              onClick={() => confirmMotion("high")}
            >
              High Motion
            </button>
            <button
              style={{ ...btnStyle, background: "#79e0f2" }}
              onClick={() => confirmMotion("low")}
            >
              Low Motion
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginTop: 0 }}>Submit to Gallery</h2>
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
              <button
                onClick={confirmUpload}
                style={{ ...btnStyle, background: "#28a745" }}
              >
                Upload
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ ...btnStyle, background: "#ff2f2f" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
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