import Vapi from "@vapi-ai/web";

export const vapi =
  import.meta.env.VITE_VAPI_PUBLIC_KEY
    ? new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY)
    : null;

export const LANGS = [
  { code: "en", label: "English", bcp47: "en-US" },
  { code: "fr", label: "Français", bcp47: "fr-FR" },
  { code: "es", label: "Español", bcp47: "es-ES" },
];

export function getAssistantIdFor(lang) {
  const map = {
    en: import.meta.env.VITE_VAPI_ASSISTANT_EN,
    fr: import.meta.env.VITE_VAPI_ASSISTANT_FR,
    es: import.meta.env.VITE_VAPI_ASSISTANT_ES,
  };
  return map[lang] || map.en;
}

export function speakWithWebSpeech(text, bcp47 = "en-US") {
  if (!("speechSynthesis" in window)) {
    alert("No TTS available in this browser.");
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = bcp47;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export async function speakTTSOnly(text, langCode = "en") {
  const asstId = getAssistantIdFor(langCode);
  if (vapi && asstId) {
    try {
      await vapi.start(asstId);
      if (typeof vapi.setMuted === "function") vapi.setMuted(true); // don't listen
      if (typeof vapi.say === "function") {
        vapi.say(text, true);
        return;
      }
      if (typeof vapi.send === "function") {
        vapi.send({ type: "message", message: text });
        setTimeout(() => vapi.stop?.(), 8000);
        return;
      }
    } catch (e) {
      console.warn("Vapi failed, using Web Speech fallback:", e);
    }
  }
  const meta = LANGS.find(l => l.code === langCode) || LANGS[0];
  speakWithWebSpeech(text, meta.bcp47);
}