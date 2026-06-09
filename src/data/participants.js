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
  { id: "holder", name: "Tomás Holder", programIds: ["PF"], role: "Conductor", photo: "/assets/conductores/tomas-holder.jpg" },
  { id: "dianela", name: "Dianela Caracchi", programIds: ["PF", "FDF"], role: "Conductora", photo: "/assets/conductores/dianela-caracchi.jpg" },
  { id: "abril", name: "Abril Zabaleta", programIds: ["PF"], role: "Conductora", photo: "/assets/conductores/abril-zabaleta.jpg" },
  
  // Fuera De Foco
  { id: "fran-metz", name: "Fran Metz", programIds: ["FDF"], role: "Conductor", photo: "/assets/conductores/fran-metz.png" },
  { id: "facu-colman", name: "Facu Colman", programIds: ["FDF"], role: "Conductor", photo: "/assets/conductores/facu-colman.png" },

  // Giro Perfecto
  { id: "grito-villagra", name: "Grito Villagra", programIds: ["GP"], role: "Conductor", photo: "/assets/conductores/grito-villagra.jpg" },
  { id: "pato-filippini", name: "Pato Filippini", programIds: ["GP"], role: "Conductor", photo: "/assets/conductores/pato-filippini.jpg" },
  { id: "gonza-acevedo", name: "Gonza Acevedo", programIds: ["GP"], role: "Conductor", photo: "/assets/conductores/gonza-acevedo.jpg" },

  // Hoy Hay Que Ganar
  { id: "tomi-messi", name: "Tomi Messi", programIds: ["HQG"], role: "Conductor", photo: "/assets/conductores/tomi-messi.jpg" },
  { id: "lobell", name: "Lobell", programIds: ["HQG"], role: "Conductor", photo: "/assets/conductores/lobell.jpg" },
  { id: "tonali", name: "Tonali", programIds: ["HQG"], role: "Conductor", photo: "/assets/conductores/tonali.jpg" },

  // Operadores
  { id: "juan", name: "Juan", role: "Operador", photo: "/assets/logo-mixon.png" },
  { id: "bocha", name: "Bocha", role: "Operador", photo: "/assets/logo-mixon.png" },
  { id: "manzo", name: "Manzo", role: "Operador", photo: "/assets/logo-mixon.png" },

  // Productores
  { id: "nahuel-cantero", name: "Nahuel Cantero", role: "Productor", photo: "/assets/logo-mixon.png" },
  { id: "matias-chababo", name: "Matías Chababo", role: "Productor", photo: "/assets/logo-mixon.png" },
  { id: "el-edu", name: "El Edu", role: "Productor", photo: "/assets/logo-mixon.png" }
];

export function getParticipantProgramIds(participant) {
  return participant.programIds || [participant.programId].filter(Boolean);
}

export function isParticipantInProgram(participant, programId) {
  return getParticipantProgramIds(participant).includes(programId);
}

export function getPrimaryProgram(participant) {
  return programs[getParticipantProgramIds(participant)[0]] || {
    id: "MIXON",
    name: "Equipo Mix On",
    theme: { main: "#7B2D8E", accent: "#9B59B6" }
  };
}

export function getParticipantProgramLabel(participant) {
  const programIds = getParticipantProgramIds(participant);
  if (!programIds.length) return "Equipo Mix On";

  return programIds
    .map(programId => programs[programId]?.name || programId)
    .join(' + ');
}
