import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import IntroPage from "./pages/IntroPage.jsx";
import RecordingPage from "./pages/RecordingPage.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";

export default function App() {
  return (
    <LanguageProvider defaultLang="en">
    <BrowserRouter>
      <div className="app-shell" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/record" element={<RecordingPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
    </LanguageProvider>
  );
}
