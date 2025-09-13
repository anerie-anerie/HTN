import React from "react";

export default function GalleryPage() {
  const items = Array.from({ length: 6 });

  return (
    <div className="page">
      <h1 style={{ margin: "0 0 12px" }}>Community Stage</h1>
      <p style={{ color: "#a8a8a8", margin: "0 0 24px" }}>
        User creations will appear here.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              border: "1px dashed #2f2f2f",
              borderRadius: 12,
              padding: 12,
              background: "#101010",
              height: 180,
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ opacity: 0.6 }}>Placeholder #{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
