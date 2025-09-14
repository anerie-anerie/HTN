import React from "react";
import { useLanguage } from "../context/LanguageContext.jsx"; 
import { t } from "../i18n.js";
import VoiceWidget from "../components/VoiceWidget.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function IntroPage() {
  const { lang } = useLanguage(); 
  const { isLight } = useTheme();
  const speakMap = {
    en: `Feel the Beat. Bee the Beat. 
         Synesthesia is a neurological phenomenon. A stimulus in one sensory 
         or cognitive pathway triggers an automatic, involuntary experience in 
         another. Examples include tasting words or hearing colors. It is not 
         a disease. It is a form of sensory crossover. Common forms include 
         grapheme color synesthesia, where letters and numbers have colors, and 
         sound color synesthesia, where music evokes colors.
         See the music. Hear the art. Move and let them meet.`,
    fr: `Ressentez le rythme. Soyez au rythme.
         La synesthésie est un phénomène neurologique. Un stimulus dans une voie 
         sensorielle ou cognitive déclenche une expérience automatique et 
         involontaire dans une autre. Par exemple, goûter des mots ou entendre 
         des couleurs. Ce n'est pas une maladie. C'est une forme de croisement 
         sensoriel. Les formes courantes incluent la synesthésie graphème-couleur, 
         où les lettres et les chiffres sont colorés, et la synesthésie son-couleur, 
         où la musique évoque des couleurs.
         Voyez la musique. Écoutez l'art. Bougez et laissez-les se rencontrer.`,
    es: `Siente el ritmo. Sé el ritmo.
         La sinestesia es un fenómeno neurológico. Un estímulo en una vía sensorial 
         o cognitiva desencadena una experiencia automática e involuntaria en otra. 
         Algunos ejemplos incluyen el sabor de las palabras o la audición de los 
         colores. No es una enfermedad. Es una forma de cruce sensorial. Las formas 
         comunes incluyen la sinestesia grafema-color, donde las letras y los números 
         tienen colores, y la sinestesia sonora-color, donde la música evoca colores.
         Ve la música. Escucha el arte. Muévete y deja que se encuentren.`,
  };

  return (
    <div className="page">
      {/* HERO */}
      <main className="hero">
        <h1 className="title title-one">{t(lang, "hero1")}</h1>
        <h1 className="title title-two">{t(lang, "hero2")}</h1>
      </main>

      {/* INSPIRATION */}
      <section className="inspo-2col">
        <div className="inspo-left">
          <div className="inspo-title">
            <h2>{t(lang, "inspoTitle")}</h2>
          </div>
          <div className="corner-block">
            <span className="corner tl" />
            <span className="corner tr" />
            <p>{t(lang, "corner1")}</p>
            <p>{t(lang, "corner2")}</p>
            <span className="corner bl" />
            <span className="corner br" />
          </div>
        </div>
        <div className="inspo-right">
          <div className="inspo-copy">
            <p>{t(lang, "inspoCopy")}</p>
          </div>
        </div>
      </section>

      {/* Voice widget */}
      <VoiceWidget pageTextByLang={speakMap} />

      <style>{`
        :root{
          --text:#eaeaea; 
          --muted: #d5d5d5;
          --edge: #e9e9e9;
          --accent: #9bf0ff;
          --gap:24px;
          --title-glow:
            0 0 6px rgba(155,240,255,.55),
            0 0 14px rgba(155,240,255,.45),
            0 0 28px rgba(255,47,179,.35);
        }
        :root.light {
          --muted: #3a3a3a;
          --edge: #1f1f1f;
          --title-shadow:
            0 1px 2px rgba(0,0,0,.20),
            0 3px 6px rgba(0,0,0,.15);
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
          font-family:'Inter', system-ui;
          font-weight:700;
          font-size:clamp(48px, 12vw, 128px);
          line-height:1;
          color:var(--accent);
          letter-spacing:-0.5px;
          padding-bottom:30px;
          text-shadow: var(--title-glow);
        }
        html.light .title{
          text-shadow: var(--title-shadow);
        }
        .title-one{
          padding-top:5vw; 
        }
        .title-two{
          text-align:right;
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
          color:var(--muted);
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
        .tl{left:0; top:0; border-left:2px solid var(--edge); border-top:2px solid var(--edge)}
        .tr{right:0; top:0; border-right:2px solid var(--edge); border-top:2px solid var(--edge)}
        .bl{left:0; bottom:0; border-left:2px solid var(--edge); border-bottom:2px solid var(--edge)}
        .br{right:0; bottom:0; border-right:2px solid var(--edge); border-bottom:2px solid var(--edge)}

        .inspo-right{
          display:flex;
          align-items:center;
          justify-content:flex-start;
        }
        .inspo-copy p{
          margin:0;
          max-width:60ch;
          color:var(--muted);
          line-height:1.6;
          text-align:left;
        }
      `}</style>
    </div>
  );
}