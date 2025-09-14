export const LANGS = [
  { code: "en", label: "English", bcp47: "en-US" },
  { code: "fr", label: "Français", bcp47: "fr-FR" },
  { code: "es", label: "Español", bcp47: "es-ES" },
];

export const tdict = {
  en: {
    hero1: "Feel the Beat,",
    hero2: "Bee the Beat",
    inspoTitle: "Inspiration",
    inspoCopy: 
    "Synesthesia is a neurological phenomenon. A stimulus in one sensory or cognitive pathway triggers an automatic, involuntary experience in another. Examples include tasting words or hearing colors. It is not a disease. It is a form of sensory crossover. Common forms include grapheme color synesthesia, where letters and numbers have colors, and sound color synesthesia, where music evokes colors.",
    corner1: "See the music. Hear the art.",
    corner2: "Move and let them meet.",
    language: "Language",
    speak: "Speak",
    stop: "Stop",
    close: "Close",
    home: "Home", 
    record: "Record", 
    gallery: "Gallery",
  },
  fr: {
    hero1: "Ressens le rythme,",
    hero2: "Deviens le rythme",
    inspoTitle: "Inspiration",
    inspoCopy:
    "La synesthésie est un phénomène neurologique. Un stimulus dans une voie sensorielle ou cognitive déclenche une expérience automatique et involontaire dans une autre. Par exemple, goûter des mots ou entendre des couleurs. Ce n'est pas une maladie. C'est une forme de croisement sensoriel. Les formes courantes incluent la synesthésie graphème-couleur, où les lettres et les chiffres sont colorés, et la synesthésie son-couleur, où la musique évoque des couleurs.",
    corner1: "Vois la musique. Entends l’art.",
    corner2: "Bouge et laisse-les se rencontrer.",
    language: "Langue",
    speak: "Parler",
    stop: "Arrêter",
    close: "Fermer",
    home: "Accueil", 
    record: "Enregistrer", 
    gallery: "Galerie",
  },
  es: {
    hero1: "Siente el ritmo,",
    hero2: "Sé el ritmo",
    inspoTitle: "Inspiración",
    inspoCopy:
    "La sinestesia es un fenómeno neurológico. Un estímulo en una vía sensorial o cognitiva desencadena una experiencia automática e involuntaria en otra. Algunos ejemplos incluyen el sabor de las palabras o la audición de los colores. No es una enfermedad. Es una forma de cruce sensorial. Las formas comunes incluyen la sinestesia grafema-color, donde las letras y los números tienen colores, y la sinestesia sonora-color, donde la música evoca colores.",
    corner1: "Mira la música. Escucha el arte.",
    corner2: "Muévete y deja que se encuentren.",
    language: "Idioma",
    speak: "Hablar",
    stop: "Detener",
    close: "Carrar",
    home: "Inicio", 
    record: "Grabar", 
    gallery: "Galeria",
  },
};

export function t(lang, key) {
  return (tdict[lang] && tdict[lang][key]) || tdict.en[key] || key;
}
