import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { t } from "../i18n.js";

export default function Navbar() {
    const { lang } = useLanguage();
    const { pathname } = useLocation();
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

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

@media (prefers-reduced-motion: reduce) {
  .syna-wrap { transition: none !important; }
}
        `}</style>
            </header>
        </>
    );
}
