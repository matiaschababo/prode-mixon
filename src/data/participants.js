// src/data/participants.js
export const programs = {
  "PF": {
    id: "PF",
    name: "Prendido Fuego",
    theme: { main: "#E21B3C", accent: "#5CB8E4" },
    logo: "/assets/programs/pf-logo.png",
    cover: "/assets/programs/pf-cover.png"
  },
  "FDF": {
    id: "FDF",
    name: "Fuera De Foco",
    theme: { main: "#6C3CE0", accent: "#C8FF00" },
    logo: "/assets/programs/fdf-logo.png",
    cover: "/assets/programs/fdf-cover.png"
  },
  "GP": {
    id: "GP",
    name: "Giro Perfecto",
    theme: { main: "#1A4BD1", accent: "#00E676" },
    logo: "/assets/programs/gp-logo.png",
    cover: "/assets/programs/gp-cover.png"
  },
  "HQG": {
    id: "HQG",
    name: "Hoy Hay Que Ganar",
    theme: { main: "#1B8C1B", accent: "#FFFFFF" },
    logo: "/assets/programs/hqg-logo.png",
    cover: "/assets/programs/hqg-cover.png"
  }
};

export const participants = [
  // Prendido Fuego
  { id: "holder", name: "Tomás Holder", programId: "PF", photo: "/assets/conductores/tomas-holder.jpg" },
  { id: "dianela", name: "Dianela Caracchi", programId: "PF", photo: "/assets/conductores/dianela-caracchi.jpg" },
  { id: "abril", name: "Abril Zabaleta", programId: "PF", photo: "/assets/conductores/abril-zabaleta.jpg" },
  
  // Fuera De Foco
  { id: "fran-metz", name: "Fran Metz", programId: "FDF", photo: "/assets/conductores/fran-metz.png" },
  { id: "facu-colman", name: "Facu Colman", programId: "FDF", photo: "/assets/conductores/facu-colman.png" },
  { id: "dianela-fdf", name: "Dianela Caracchi", programId: "FDF", photo: "/assets/conductores/dianela-caracchi-fdf.png" },

  // Giro Perfecto
  { id: "grito-villagra", name: "Grito Villagra", programId: "GP", photo: "/assets/conductores/grito-villagra.jpg" },
  { id: "pato-filippini", name: "Pato Filippini", programId: "GP", photo: "/assets/conductores/pato-filippini.jpg" },
  { id: "gonza-acevedo", name: "Gonza Acevedo", programId: "GP", photo: "/assets/conductores/gonza-acevedo.jpg" },

  // Hoy Hay Que Ganar
  { id: "tomi-messi", name: "Tomi Messi", programId: "HQG", photo: "/assets/conductores/tomi-messi.jpg" },
  { id: "lobell", name: "Lobell", programId: "HQG", photo: "/assets/conductores/lobell.jpg" },
  { id: "tonali", name: "Tonali", programId: "HQG", photo: "/assets/conductores/tonali.jpg" }
];
