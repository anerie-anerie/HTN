import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { t } from "../i18n.js";

export default function Navbar() {
    const { lang } = useLanguage();
    const { pathname } = useLocation();
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);
    const { isLight } = useTheme();

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const goingDown = y > lastY.current;
            lastY.current = y;

            const nearBottom = window.innerHeight + y >= document.body.scrollHeight - 24;
            setHidden(goingDown || nearBottom);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const toggleTheme = () => {
      const el = document.documentElement;
      el.classList.toggle("light");
      setIsLight(el.classList.contains("light"));
    };

    const links = React.useMemo(() => ([
      { to: "/",        label: t(lang, "home") },
      { to: "/record",  label: t(lang, "record") },
      { to: "/gallery", label: t(lang, "gallery") },
    ]), [lang]);

    return (
        <>
            <div style={{ height: 64 }} aria-hidden />
            <header className={`syna-wrap ${hidden ? "syna-hide" : ""}`}>
                <nav className="syna-nav">
                    <ul className="syna-list">
                        {links.map((l) => {
                            const active = pathname === l.to;
                            return (
                                <li key={l.to}>
                                    <Link
                                        to={l.to}
                                        className={`syna-link ${active ? "is-active" : ""}`}
                                    >
                                        <span className="syna-text">{l.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* theme toggle */}
                    <button
                      type="button"
                      className="syna-toggle"
                      onClick={toggleTheme}
                      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
                      title={isLight ? "Dark mode" : "Light mode"}
                    >
                      {isLight ? (
                        // Moon icon
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 11V9h3v2h-3zm-2.24-6.16l1.79-1.79 1.41 1.41-1.79 1.79-1.41-1.41zM11 1h2v3h-2V1zm7.76 18.39l1.67-1.67 1.41 1.41-1.67 1.67-1.41-1.41zM12 6a6 6 0 100 12 6 6 0 000-12z"
                          />
                        </svg>
                      ) : (
                        // Sun icon
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="currentColor"
                            d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
                          />
                        </svg>
                      )}
                    </button>
                </nav>

                <style>{`
.syna-wrap {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  z-index: 1000;
  display: flex;
  justify-content: center;
  background: transparent;
  transition: transform 220ms ease;
  pointer-events: none;
}
.syna-hide {
  transform: translate3d(-50%, -140%, 0);
}

.syna-nav {
  pointer-events: auto;
  position: relative;
  display: inline-flex;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(12px) saturate(115%);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
  gap:10px;
  align-items:center;
}

.syna-list {
  list-style: none;
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 0;
}

.syna-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  text-decoration: none;
  color: #f2f2f2;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  transition: background 180ms ease, border-color 180ms ease;
}
.syna-link:is(:hover,:focus-visible) {
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.18);
}

.syna-link.is-active {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.25);
}

.syna-text {
  font-weight: 600;
  color: #ffffffcc; /* faint white */
  letter-spacing: 0.3px;
}

/* toggle button (dark default) */
.syna-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  color: #f2f2f2;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
}
.syna-toggle:is(:hover,:focus-visible) {
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.18);
}

/* ---------------- Light mode overrides ---------------- */
html.light .syna-nav {
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5);
}

html.light .syna-link {
  color: #111;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.10);
}
html.light .syna-link:is(:hover,:focus-visible) {
  background: rgba(0,0,0,0.06);
  border-color: rgba(0,0,0,0.16);
}
html.light .syna-link.is-active {
  background: rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.20);
}

html.light .syna-text {
  color: #111;
}

html.light .syna-toggle {
  border: 1px solid rgba(0,0,0,0.12);
  background: rgba(0,0,0,0.05);
  color: #111;
}
html.light .syna-toggle:is(:hover,:focus-visible) {
  background: rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.18);
}

@media (prefers-reduced-motion: reduce) {
  .syna-wrap { transition: none !important; }
}
        `}</style>
            </header>
        </>
    );
}
