import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { LANGS, t } from "../i18n.js";
import { speakTTSOnly, vapi, getAssistantIdFor } from "../lib/vapi.js";
import { useTheme } from "../context/ThemeContext.jsx";

/* ---------- Small custom select (dark + glow, light + shadow) ---------- */
function LangSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const { isLight } = useTheme();

  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const glowHover =
    "0 0 0 2px rgba(155,240,255,.85), 0 0 18px rgba(155,240,255,.65), 0 0 36px rgba(255,47,179,.35)";
  const glowIdle =
    "0 0 0 1px rgba(155,240,255,.35), 0 0 14px rgba(155,240,255,.28), 0 0 28px rgba(255,47,179,.18)";

  // light-mode shadows
  const shadowIdle = "0 2px 6px rgba(0,0,0,.25)";
  const shadowHover = "0 4px 10px rgba(0,0,0,.35)";

  const selected = options.find((o) => o.code === value) || options[0];

  return (
    <div ref={boxRef} style={{ position: "relative", width: 170 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          background: isLight
            ? "#f8f8f8"
            : "linear-gradient(180deg, rgba(16,16,16,1) 0%, rgba(11,11,11,1) 100%)",
          color: isLight ? "#111" : "#fff",
          border: isLight ? "1px solid rgba(0,0,0,.2)" : "1px solid #2a2a2a",
          borderRadius: 10,
          boxShadow: open
            ? (isLight ? shadowHover : glowHover)
            : (isLight ? shadowIdle : glowIdle),
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 14 }}>{selected.label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "100%",
            background: isLight ? "#ffffff" : "rgba(10,10,10,.98)",
            color: isLight ? "#111" : "#fff",
            border: isLight ? "1px solid rgba(0,0,0,.15)" : "1px solid #2a2a2a",
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: isLight
              ? "0 4px 20px rgba(0,0,0,.25)"
              : "0 0 0 1px rgba(155,240,255,.25), 0 0 24px rgba(155,240,255,.25)",
            zIndex: 10,
          }}
        >
          {options.map((opt) => {
            const disabled = !getAssistantIdFor(opt.code);
            const active = opt.code === value;
            return (
              <button
                key={opt.code}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) onChange(opt.code);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: isLight
                    ? (active ? "#e8efff" : "transparent")
                    : (active ? "#1c2f66" : "transparent"),
                  color: disabled
                    ? (isLight ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.35)")
                    : (isLight ? "#111" : "#fff"),
                  border: "none",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Voice widget ---------- */
export default function VoiceWidget({ pageTextByLang }) {
  const { lang, setLang } = useLanguage(); // shared app language
  const [open, setOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHover, setIsHover] = useState(false);

  const text = pageTextByLang?.[lang] || pageTextByLang?.en || "Hello!";
  const statusText = isConnected ? (isSpeaking ? "Speaking…" : "Connected") : "Idle";

  useEffect(() => {
    if (!vapi) return;
    const onStart = () => setIsConnected(true);
    const onEnd = () => {
      setIsConnected(false);
      setIsSpeaking(false);
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    vapi.on("call-start", onStart);
    vapi.on("call-end", onEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", (e) => console.error("Vapi error:", e));

    return () => {
      vapi.off?.("call-start", onStart);
      vapi.off?.("call-end", onEnd);
      vapi.off?.("speech-start", onSpeechStart);
      vapi.off?.("speech-end", onSpeechEnd);
    };
  }, []);

  const handleSpeak = async () => {
    await speakTTSOnly(text, lang); // start -> mute -> say -> end
  };
  const handleStop = () => {
    vapi?.stop?.();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // theme flag (dark default)
  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  // glow presets (dark mode keeps original look)
  const glowIdle =
    "0 0 0 1px rgba(155,240,255,.35), 0 0 14px rgba(155,240,255,.28), 0 0 28px rgba(255,47,179,.18)";
  const glowHover =
    "0 0 0 2px rgba(155,240,255,.85), 0 0 18px rgba(155,240,255,.65), 0 0 36px rgba(255,47,179,.35)";
  const glowSpeak =
    "0 0 0 2px rgba(255,47,179,.9), 0 0 22px rgba(255,47,179,.55), 0 0 44px rgba(155,240,255,.35)";

  // light-mode drop-shadows
  const shadowIdle = "0 2px 6px rgba(0,0,0,.25)";
  const shadowHover = "0 4px 10px rgba(0,0,0,.35)";
  const shadowSpeak = "0 6px 14px rgba(0,0,0,.45)";

  const buttonShadow = isSpeaking
    ? (isLight ? shadowSpeak : glowSpeak)
    : (open || isHover)
      ? (isLight ? shadowHover : glowHover)
      : (isLight ? shadowIdle : glowIdle);

  const panelShadow = isLight
    ? "0 4px 20px rgba(0,0,0,.25)"
    : "0 0 0 1px rgba(155,240,255,.25), 0 8px 32px rgba(0,0,0,.55), 0 0 24px rgba(155,240,255,.2)";

  return (
    <div style={wrap}>
      {/* round button */}
      <button
        aria-label="Voice"
        title="Voice"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{ ...(isLight ? lightFab : fab), boxShadow: buttonShadow }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zm2.5 0c0 3.04-1.72 5.64-4.25 6.92v-13.8C17.28 6.36 19 8.96 19 12z"
          />
        </svg>
      </button>

      {/* panel */}
      {open && (
        <div style={{ ...(isLight ? lightPanel : panel), boxShadow: panelShadow }}>
          <div style={row}>
            <span style={label}>{t(lang, "language")}</span>
            <LangSelect value={lang} onChange={setLang} options={LANGS} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {!isConnected ? (
              <button onClick={handleSpeak} style={btnPrimary}>
                {t(lang, "speak")}
              </button>
            ) : (
              <button onClick={handleStop} style={btnDanger}>
                {t(lang, "stop")}
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={
                isLight
                  ? { ...btnGhost, background: "#f5f5f5", color: "#111", border: "1px solid #ccc" }
                  : btnGhost
              }
            >
              {t(lang, "close")}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>{statusText}</div>
        </div>
      )}
    </div>
  );
}

/* styles */
const wrap = { position: "fixed", right: 24, bottom: 24, zIndex: 1000 };

const fab = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  border: "1px solid rgba(42,42,42,.9)",
  background:
    "radial-gradient(120% 120% at 30% 30%, #1a1a1a 0%, #0f0f0f 60%, #0b0b0b 100%)",
  color: "#eaeaea",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  padding: 0,
  lineHeight: 1,
  transition: "box-shadow .22s ease, transform .12s ease",
};

const lightFab = {
  ...fab,
  border: "1px solid rgba(0,0,0,.2)",
  background: "#f8f8f8",
  color: "#111",
};

const panel = {
  position: "absolute",
  right: 0,
  bottom: 72,
  width: 280,
  background: "rgba(12,12,12,.96)",
  border: "1px solid rgba(42,42,42,.95)",
  borderRadius: 12,
  padding: 12,
  backdropFilter: "blur(4px)",
};

const lightPanel = {
  ...panel,
  background: "#ffffff",
  border: "1px solid rgba(0,0,0,.15)",
  backdropFilter: undefined,
};

const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
};
const label = { fontSize: 13, opacity: 0.85 };

const btnBase = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #2a2a2a",
  background: "#141414",
  color: "#eaeaea",
  cursor: "pointer",
};
const btnPrimary = {
  ...btnBase,
  borderColor: "#3874ff",
  background: "#1a2140",
  boxShadow: "0 0 0 1px rgba(56,116,255,.35), 0 0 14px rgba(56,116,255,.3)",
};
const btnDanger = {
  ...btnBase,
  borderColor: "#ff3b3b",
  background: "#401a1a",
  boxShadow: "0 0 0 1px rgba(255,59,59,.35), 0 0 14px rgba(255,59,59,.28)",
};
const btnGhost = { ...btnBase, opacity: 0.85 };
