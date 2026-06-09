// src/data/participants.js
export const programs = {
  "PF": {
    id: "PF",
    name: "Prendido Fuego",
    theme: { main: "#E21B3C", accent: "#5CB8E4" },
    logo: "/assets/programs/pf-logo.png"
  },
  "FDF": {
    id: "FDF",
    name: "Fuera De Foco",
    theme: { main: "#6C3CE0", accent: "#C8FF00" },
    logo: "/assets/programs/fdf-placeholder.png"
  },
  "GP": {
    id: "GP",
    name: "Giro Perfecto",
    theme: { main: "#1A4BD1", accent: "#00E676" },
    logo: "/assets/programs/gp-placeholder.png"
  },
  "HQG": {
    id: "HQG",
    name: "Hoy Hay Que Ganar",
    theme: { main: "#1B8C1B", accent: "#FFFFFF" },
    logo: "/assets/programs/hqg-placeholder.png"
  }
};

export const participants = [
  // Prendido Fuego
  { id: "holder", name: "Tomás Holder", programId: "PF", photo: "/assets/conductores/tomas-holder.jpg" },
  { id: "dianela", name: "Dianela Caracchi", programId: "PF", photo: "/assets/conductores/dianela-caracchi.jpg" },
  { id: "abril", name: "Abril Zabaleta", programId: "PF", photo: "/assets/conductores/abril-zabaleta.jpg" },
  
  // Fuera De Foco (Placeholders)
  { id: "fdf1", name: "Conductor 1 (FDF)", programId: "FDF", photo: "/assets/logo-mixon.png" },
  { id: "fdf2", name: "Conductor 2 (FDF)", programId: "FDF", photo: "/assets/logo-mixon.png" },
  { id: "fdf3", name: "Conductor 3 (FDF)", programId: "FDF", photo: "/assets/logo-mixon.png" },

  // Giro Perfecto (Placeholders)
  { id: "gp1", name: "Conductor 1 (GP)", programId: "GP", photo: "/assets/logo-mixon.png" },
  { id: "gp2", name: "Conductor 2 (GP)", programId: "GP", photo: "/assets/logo-mixon.png" },
  { id: "gp3", name: "Conductor 3 (GP)", programId: "GP", photo: "/assets/logo-mixon.png" },

  // Hoy Hay Que Ganar (Placeholders)
  { id: "hqg1", name: "Conductor 1 (HQG)", programId: "HQG", photo: "/assets/logo-mixon.png" },
  { id: "hqg2", name: "Conductor 2 (HQG)", programId: "HQG", photo: "/assets/logo-mixon.png" },
  { id: "hqg3", name: "Conductor 3 (HQG)", programId: "HQG", photo: "/assets/logo-mixon.png" }
];
