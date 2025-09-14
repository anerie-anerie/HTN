import React, { useEffect, useState, useRef } from "react";

export default function GalleryPage() {
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const videoRefs = useRef({}); // refs for video elements

    useEffect(() => {
        fetch("http://localhost:5000/get-videos")
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

    const thumbnailStyle = {
        width: "100%",
        height: 180,
        objectFit: "cover",
        borderRadius: 8,
        marginBottom: 8,
        background: "#333",
    };

    return (
        <div className="page" style={{ padding: 20, color: "#eaeaea" }}>
            <h1>Community Stage</h1>
            <p style={{ color: "#a8a8a8" }}>User creations will appear here.</p>

            {/* Video grid with max 3 per row */}
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
                        style={cardStyle}
                        onClick={() => setSelectedVideo(video)}
                    >
                        {/* Video thumbnail */}
                        <video
                            ref={(el) => (videoRefs.current[video.url] = el)}
                            src={video.url}
                            style={thumbnailStyle}
                            muted
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                                // Seek to 1 second to show frame
                                const vid = e.target;
                                if (vid.duration > 1) vid.currentTime = 1;
                            }}
                        />
                        <strong>{video.title}</strong>
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

                        <video
                            controls
                            autoPlay
                            style={videoStyle}
                        >
                            <source src={selectedVideo.url} type="video/webm" />
                        </video>

                        <div style={textContainer}>
                            <h2 style={{ margin: 0 }}>{selectedVideo.title}</h2>
                            <p style={{ marginTop: 10, color: "#ccc" }}>
                                {selectedVideo.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}