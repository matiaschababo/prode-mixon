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


export const participants = [];

export function getParticipantProgramIds(participant) {
  const program = participant.program || participant.programId;
  return participant.programIds || (program && program !== 'viewers' ? [program] : []);
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
