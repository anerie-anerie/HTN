import React, { useEffect, useState } from "react";

export default function GalleryPage() {
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/get-videos")
            .then((res) => res.json())
            .then((data) => setVideos(data))
            .catch((err) => console.error("Error fetching videos:", err));
    }, []);

    return (
        <div className="page" style={{ padding: 20, color: "#eaeaea" }}>
            <h1>Community Stage</h1>
            <p style={{ color: "#a8a8a8" }}>User creations will appear here.</p>

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
                        style={{
                            border: "1px solid #2f2f2f",
                            borderRadius: 12,
                            padding: 12,
                            background: "#101010",
                            height: 180,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                        onClick={() => setSelectedVideo(video.url)}
                    >
                        <span style={{ color: "#fff" }}>Video #{i + 1}</span>
                    </div>
                ))}
            </div>

            {selectedVideo && (
                <div
                    onClick={() => setSelectedVideo(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                    }}
                >
                    <video controls autoPlay style={{ maxWidth: "90%", maxHeight: "80%" }}>
                        <source src={selectedVideo} type="video/webm" />
                    </video>
                </div>
            )}
        </div>
    );
}