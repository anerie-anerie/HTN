// src/pages/IntroPage.jsx
import React from "react";

export default function IntroPage() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">△</span>
          <span className="brand-name">StudioAgatho</span>
        </div>
      </header>

      <main className="hero">
        <div className="hero-left">
          <p className="quote">{"「Feel the beat, Be\n the Beat 」"}</p>
        </div>
        <div className="hero-right">
          <h1 className="title title-one">Creative</h1>
          <h1 className="title title-two">Credentials</h1>
        </div>
      </main>

      <hr className="divider" />

      <section className="lower">
        <div className="col col-left">
          <h2 className="inspo">Inspo</h2>

          <div className="corner-block">
            <span className="corner tl" />
            <span className="corner tr" />
            <p>
              Since its founding in the 80s, Studio Agatho has been the go-to
              company for various design needs. Its offerings range from graphic
              design and branding strategy to website development and video
              production.
            </p>
            <span className="corner bl" />
            <span className="corner br" />
          </div>
        </div>

        <div className="col col-right">
          <p className="body-copy">
            Agatho boasts a global client base and various industry awards. It
            has set the standard for design studios as its clients collaborate
            with the highest caliber of creatives, engineers, and ambassadors.
          </p>

          <span className="magenta-dot" />
        </div>
      </section>

      <style>{`
        :root{
          --bg:#0b0b0b; --text:#eaeaea; --muted:#a8a8a8;
          --accent:#9bf0ff; --accent-2:#79e0f2; --magenta:#ff2fb3;
        }

        .page{
          min-height:100dvh;
          width:100%;
          background:var(--bg);
          color:var(--text);
          padding-block:20px 40px; /* left/right padding comes from .app-shell */
        }

        .topbar{display:flex; align-items:center; justify-content:flex-end; padding:8px 0;}
        .brand{display:flex; gap:8px; align-items:center; color:#c38cf4; font-weight:600; letter-spacing:.2px}
        .brand-mark{font-size:18px; opacity:.9}
        .brand-name{font-size:14px}

        .hero{display:grid; grid-template-columns:1fr 2fr; gap:min(6vw,64px); align-items:end; padding-top:min(8vh,64px);}
        .quote{font-size:14px; line-height:1.6; color:var(--muted); white-space:pre-line;}
        .title{margin:0; line-height:.95; color:var(--accent);}
        .title-one{font-family:'Inter',system-ui; font-weight:700; font-size:clamp(48px,12vw,128px);}
        .title-two{font-family:'Playfair Display',serif; font-weight:600; font-size:clamp(48px,12vw,120px);}

        .divider{border:0; height:1px; background:#242424; margin:min(5vh,48px) 0;}

        .lower{display:grid; grid-template-columns:1fr 1fr; gap:min(6vw,64px); align-items:start}
        .inspo{color:var(--accent); margin:0 0 16px; font-size:clamp(24px,4vw,40px); font-weight:700}
        .body-copy{max-width:52ch; color:#d5d5d5; line-height:1.6}

        .corner-block{position:relative; max-width:52ch; padding:24px 20px; margin-top:48px; color:#d5d5d5; line-height:1.6}
        .corner{position:absolute; width:16px; height:16px; border-color:#e9e9e9;}
        .tl{left:0; top:0; border-left:2px solid #e9e9e9; border-top:2px solid #e9e9e9}
        .tr{right:0; top:0; border-right:2px solid #e9e9e9; border-top:2px solid #e9e9e9}
        .bl{left:0; bottom:0; border-left:2px solid #e9e9e9; border-bottom:2px solid #e9e9e9}
        .br{right:0; bottom:0; border-right:2px solid #e9e9e9; border-bottom:2px solid #e9e9e9}

        .magenta-dot{display:inline-block; width:18px; height:18px; background:var(--magenta); margin-top:40px; border-radius:2px}

        @media (max-width:900px){
          .hero{grid-template-columns:1fr; gap:24px;}
          .hero-right{order:-1}
          .quote{font-size:12px}
          .lower{grid-template-columns:1fr;}
        }
      `}</style>

    </div>
  );
}
