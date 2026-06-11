// src/data/scoring.js

/**
 * Sistema de Puntuación Prode Mundial 2026
 * 
 * - 3 pts -> Resultado exacto (ej: dice 2-1 y fue 2-1)
 * - 2 pts -> Acierta resultado + diferencia de goles (ej: dice 3-1 y fue 2-0, ambos gana local por 2)
 * - 1 pt -> Acierta resultado (ganador o empate, pero no el marcador)
 * - 0 pts -> Falla
 * 
 * Multiplicadores por fase:
 * - Grupos: x1
 * - Round of 32: x1.5
 * - Round of 16: x2
 * - Cuartos: x2.5
 * - Semis: x3
 * - 3er puesto / Final: x4
 */

export const MULTIPLIERS = {
  "Group Stage": 1,
  "Round of 32": 1.5,
  "Round of 16": 2,
  "Quarterfinals": 2.5,
  "Semifinals": 3,
  "Third Place": 4,
  "Final": 4
};

export function getHitType(predictionHome, predictionAway, actualHome, actualAway) {
  if (actualHome === null || actualAway === null) return "MISS";
  if (predictionHome === null || predictionAway === null) return "MISS";

  const predH = parseInt(predictionHome);
  const predA = parseInt(predictionAway);
  const actH = parseInt(actualHome);
  const actA = parseInt(actualAway);

  if (predH === actH && predA === actA) {
    return "EXACT"; // 3 pts
  } 

  const predDiff = predH - predA;
  const actDiff = actH - actA;
  
  const predWinner = predDiff > 0 ? "H" : predDiff < 0 ? "A" : "D";
  const actWinner = actDiff > 0 ? "H" : actDiff < 0 ? "A" : "D";

  if (predWinner === actWinner) {
    if (predWinner !== "D" && predDiff === actDiff) {
      return "DIFF"; // 2 pts
    } else {
      return "WINNER"; // 1 pt
    }
  }

  return "MISS"; // 0 pts
}

export function calculatePoints(predictionHome, predictionAway, actualHome, actualAway, stage = "Group Stage") {
  const hitType = getHitType(predictionHome, predictionAway, actualHome, actualAway);
  let basePoints = 0;
  
  if (hitType === "EXACT") basePoints = 3;
  else if (hitType === "DIFF") basePoints = 2;
  else if (hitType === "WINNER") basePoints = 1;

  const multiplier = MULTIPLIERS[stage] || 1;
  return basePoints * multiplier;
}
