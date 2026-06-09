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

export function calculatePoints(predictionHome, predictionAway, actualHome, actualAway, stage = "Group Stage") {
  if (actualHome === null || actualAway === null) return 0;
  if (predictionHome === null || predictionAway === null) return 0;

  const predH = parseInt(predictionHome);
  const predA = parseInt(predictionAway);
  const actH = parseInt(actualHome);
  const actA = parseInt(actualAway);

  let points = 0;

  // Resultado exacto
  if (predH === actH && predA === actA) {
    points = 3;
  } 
  // Diferencia exacta (pero no resultado exacto) - Solo aplica si hay ganador, en empate 2pts no aplica si no es resultado exacto, porque empate siempre es dif 0. Si puso 1-1 y salió 2-2, es 1pt por acertar resultado.
  else {
    const predDiff = predH - predA;
    const actDiff = actH - actA;
    
    const predWinner = predDiff > 0 ? "H" : predDiff < 0 ? "A" : "D";
    const actWinner = actDiff > 0 ? "H" : actDiff < 0 ? "A" : "D";

    if (predWinner === actWinner) {
      if (predWinner !== "D" && predDiff === actDiff) {
        points = 2; // Acertó ganador y diferencia
      } else {
        points = 1; // Acertó ganador o empate
      }
    }
  }

  const multiplier = MULTIPLIERS[stage] || 1;
  return points * multiplier;
}
