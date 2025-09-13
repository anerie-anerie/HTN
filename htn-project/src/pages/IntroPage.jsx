import React from "react";

export default function IntroPage() {
  return (
    <div className="page">

      <main className="hero">
          <h1 className="title title-one">Feel the Beat,</h1>
          <h1 className="title title-two">Be the Beat</h1>
      </main>

    <section className="inspo-2col">
        <div className="inspo-left">
          <div className="inspo-title">
            <h2>Inspiration</h2>
          </div>

          <div className="inspo-corner">
            <div className="corner-block">
              <span className="corner tl" />
              <span className="corner tr" />
              <p>See the music. Hear the art.</p>
              <p>Move and let them meet.</p>
              <span className="corner bl" />
              <span className="corner br" />
            </div>
          </div>
        </div>

        <div className="inspo-right">
          <div className="inspo-copy">
            <p>
              Synesthesia is a neurological phenomenon. A stimulus in one sensory 
              or cognitive pathway triggers an automatic, involuntary experience in 
              another. Examples include tasting words or hearing colors. It is not 
              a disease. It is a form of sensory crossover. Common forms include 
              grapheme color synesthesia, where letters and numbers have colors, and 
              sound color synesthesia, where music evokes colors.
            </p>
          </div>
        </div>
    </section>

      <style>{`
        :root{
          --bg:#0b0b0b; 
          --text:#eaeaea; 
          --muted:#a8a8a8;
          --accent:#9bf0ff; 
          --accent-2:#79e0f2; 
        }

        .page{
          min-height:100dvh;
          width:100%;
          background:var(--bg);
          color:var(--text);
          padding-block:20px 40px; 
        }

        /* Hero Section */
        .hero{
          display:grid;
          gap:12px;
          padding-top:min(12vh, 120px);
          padding-bottom:min(12vh, 120px);
        }
        .title{
          margin:0;
          line-height:.95;
          color:var(--accent);
          letter-spacing:-0.5px;
          padding-bottom:30px;
        }
        .title-one{
          font-family:'Inter', system-ui;
          font-weight:700;
          font-size:clamp(48px, 12vw, 128px);
          padding-right:10vw; 
          padding-top:5vw; 
        }
        .title-two{
          font-family:'Inter', system-ui;
          font-weight:700;
          font-size:clamp(48px, 12vw, 128px);
          padding-left:30vw; 
        }
        
        /* Inspo Section */
        .inspo-2col{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:var(--gap);
          align-items:stretch;
          margin-top:min(6vh, 56px);
        }
        .inspo-left{
          display:grid;
          align-content:start;
          gap:16px;
          text-align:left;
        }
        .inspo-title h2{
          margin:0;
          color:var(--accent);
          font-size:clamp(30px, 5vw, 50px);
          font-weight:700;
          letter-spacing:0.5px;
          padding-bottom:40px;
        }
        .corner-block{
          position:relative;
          max-width:52ch;
          padding:20px 20px;
          color:#d5d5d5;
          text-align:center;
        }
        .corner{
          position:absolute; 
          width:16px; 
          height:16px; 
          border-color:#e9e9e9;
        }
        .tl{left:0; top:0; border-left:2px solid #e9e9e9; border-top:2px solid #e9e9e9}
        .tr{right:0; top:0; border-right:2px solid #e9e9e9; border-top:2px solid #e9e9e9}
        .bl{left:0; bottom:0; border-left:2px solid #e9e9e9; border-bottom:2px solid #e9e9e9}
        .br{right:0; bottom:0; border-right:2px solid #e9e9e9; border-bottom:2px solid #e9e9e9}

        .inspo-right{
          display:flex;
          align-items:center;
          justify-content:flex-start;
        }
        .inspo-copy p{
          margin:0;
          max-width:60ch;
          color:#d5d5d5;
          line-height:1.6;
          text-align:left;
        }
      `}</style>

    </div>
  );
}
