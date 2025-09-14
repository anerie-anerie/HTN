import React, { useEffect, useState } from "react";

export default function GalleryPage() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Light mode flag (dark is default)
  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  useEffect(() => {
    fetch("http://localhost:5000/get-videos")
      .then((res) => res.json())
      .then((data) => setVideos(data))
      .catch((err) => console.error("Error fetching videos:", err));
  }, []);

  // Dark mode defaults
  const cardStyle = {
    border: "1px solid #2f2f2f",
    borderRadius: 12,
    padding: 12,
    background: "#101010",
    cursor: "pointer",
  };

  const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  };

  const modalContent = {
    display: "flex",
    position: "relative",
    background: "#101010",
    borderRadius: 12,
    overflow: "hidden",
    maxWidth: "95%",
    maxHeight: "90%",
    width: "95%",
    height: "90%",
    boxShadow: "0 0 20px rgba(0,0,0,0.7)",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    cursor: "pointer",
    zIndex: 10000,
    background: "transparent",
    border: "none",
  };

  const videoStyle = {
    width: "70%",
    height: "100%",
    objectFit: "contain",
  };

  const textContainer = {
    padding: 20,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    overflowY: "auto",
    width: "30%",
    maxHeight: "100%",
  };

  // Light-mode overrides
  const lightCardStyle = {
    border: "1px solid rgba(0,0,0,.15)",
    background: "#ffffff",
    color: "#111",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  };

  const lightModalContent = {
    background: "#ffffff",
    color: "#111",
    boxShadow: "0 12px 32px rgba(0,0,0,.22)",
    border: "1px solid rgba(0,0,0,.12)",
  };

  const lightCloseButtonStyle = {
    color: "#111",
    background: "rgba(0,0,0,0.04)",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,.12)",
  };

  return (
    <div
      className="page"
      style={{ padding: 20, color: "#eaeaea", ...(isLight ? { color: "#111" } : null) }}
    >
      <h1>Community Stage</h1>
      <p style={{ color: "#a8a8a8", ...(isLight ? { color: "#444" } : null) }}>
        User creations will appear here.
      </p>

      {/* Video grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {videos.map((video, i) => (
          <div
            key={i}
            style={isLight ? { ...cardStyle, ...lightCardStyle } : cardStyle}
            onClick={() => setSelectedVideo(video)}
          >
            <strong>{video.title}</strong>
            <p
              style={{
                fontSize: 12,
                color: "#aaa",
                marginTop: 4,
                ...(isLight ? { color: "#666" } : null),
              }}
            >
              {video.description}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div style={modalOverlay} onClick={() => setSelectedVideo(null)}>
          <div
            style={isLight ? { ...modalContent, ...lightModalContent } : modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              style={
                isLight
                  ? { ...closeButtonStyle, ...lightCloseButtonStyle }
                  : closeButtonStyle
              }
              onClick={() => setSelectedVideo(null)}
            >
              ×
            </button>

            <video controls autoPlay style={videoStyle}>
              <source src={selectedVideo.url} type="video/webm" />
            </video>
            <div
              style={isLight ? { ...textContainer, color: "#111" } : textContainer}
            >
              <h2 style={{ margin: 0 }}>{selectedVideo.title}</h2>
              <p
                style={{
                  marginTop: 10,
                  color: isLight ? "#444" : "#ccc",
                }}
              >
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
