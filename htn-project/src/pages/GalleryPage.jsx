import React, { useEffect, useState, useRef } from "react";

export default function GalleryPage() {
    const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLight, setIsLight] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("light")
  );
  const videoRefs = useRef({}); // refs for video elements

  useEffect(() => {
    fetch("http://127.0.0.1:5000/get-videos")
      .then((res) => res.json())
      .then((data) => setVideos(data))
      .catch((err) => console.error("Error fetching videos:", err));
  }, []);

  const cardStyle = {
    border: "1px solid #2f2f2f",
    borderRadius: 12,
    padding: 12,
    background: "#101010",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const lightCardStyle = {
    border: "1px solid rgba(0,0,0,.15)",
    background: "#ffffff",
    color: "#111",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
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
    background: isLight ? "#fff" : "#101010",
    borderRadius: 12,
    overflow: "hidden",
    maxWidth: "95%",
    maxHeight: "90%",
    width: "95%",
    height: "90%",
    boxShadow: isLight
      ? "0 12px 32px rgba(0,0,0,.22)"
      : "0 0 20px rgba(0,0,0,0.7)",
    color: isLight ? "#111" : "#fff",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 24,
    fontWeight: "bold",
    color: isLight ? "#111" : "#fff",
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
    color: isLight ? "#111" : "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    overflowY: "auto",
    width: "30%",
    maxHeight: "100%",
  };

  const thumbnailStyle = {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 8,
    background: "#333",
  };

  return (
    <div
      className="page"
      style={{ padding: 20, color: isLight ? "#111" : "#eaeaea" }}
    >
      <h1>Community Stage</h1>
      <p style={{ color: isLight ? "#444" : "#a8a8a8" }}>
        User creations will appear here.
      </p>

      {/* Video grid with thumbnails */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        {videos.map((video, i) => (
          <div
            key={i}
            style={isLight ? { ...cardStyle, ...lightCardStyle } : cardStyle}
            onClick={() => setSelectedVideo(video)}
          >
            {/* Thumbnail video */}
            <video
              ref={(el) => (videoRefs.current[video.url] = el)}
              src={video.url}
              style={thumbnailStyle}
              muted
              preload="metadata"
              onLoadedMetadata={(e) => {
                const vid = e.target;
                if (vid.duration > 1) vid.currentTime = 1;
              }}
            />
            <strong>{video.title}</strong>
            <p
              style={{
                fontSize: 12,
                color: isLight ? "#666" : "#aaa",
                marginTop: 4,
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
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setSelectedVideo(null)}
            >
              ×
            </button>

            <video controls autoPlay style={videoStyle}>
              <source src={selectedVideo.url} type="video/webm" />
            </video>

            <div style={textContainer}>
              <h2 style={{ margin: 0 }}>{selectedVideo.title}</h2>
              <p style={{ marginTop: 10, color: isLight ? "#444" : "#ccc" }}>
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}