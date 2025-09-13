import React from "react";

export default function RecordingPage() {
  return (
    <div className="page" style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0 }}>Record</h1>
      <p style={{ color: "#a8a8a8", margin: 0 }}>
        Camera + motion-to-sound coming soon.
      </p>

      <div
        style={{
          height: 360,
          border: "1px dashed #3a3a3a",
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "#0f0f0f",
        }}
      >
        <span style={{ opacity: 0.6 }}>Recording Placeholder</span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button disabled style={btnDisabled}>Start</button>
        <button disabled style={btnDisabled}>Stop</button>
        <button disabled style={btnDisabled}>Save to Gallery</button>
      </div>
    </div>
  );
}

const btnDisabled = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #2a2a2a",
  background: "#141414",
  color: "#777",
  cursor: "not-allowed",
};
