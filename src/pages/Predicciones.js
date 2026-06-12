// src/pages/Predicciones.js
import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { getParticipantProgramLabel } from '../data/participants.js';
import { getPredictions, getMatchResult, getDynamicUsers } from '../services/prodeStore.js';
import { calculatePoints, getHitType } from '../services/scoring.js';

export function Predicciones(matchId) {
  const match = matches.find(m => m.id === parseInt(matchId));
  if (!match) return `<h2>Partido no encontrado</h2>`;

  const predictions = getPredictions()[String(match.id)] || {};
  const result = getMatchResult(match);
  const dynamicUsers = getDynamicUsers();

  const home = teams[match.homeTeam] || { name: match.homeTeam, flag: "❓" };
  const away = teams[match.awayTeam] || { name: match.awayTeam, flag: "❓" };

  // Filter to only users who have a prediction for this match, and map data
  let usersWithPredictions = dynamicUsers
    .filter(u => predictions[u.id])
    .map(u => {
      const prediction = predictions[u.id];
      let points = null;
      let hitType = null;
      if (prediction && result) {
        points = calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage);
        hitType = getHitType(prediction.home, prediction.away, result.home, result.away);
      }
      return { ...u, prediction, points, hitType };
    });

  // Sort descending by points if available
  usersWithPredictions.sort((a, b) => {
    if (a.points !== null && b.points !== null) {
      return b.points - a.points;
    }
    return 0;
  });

  const prediccionesHTML = usersWithPredictions.length === 0
    ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Todavía nadie cargó una predicción para este partido.</p>`
    : usersWithPredictions.map((p, index) => {
        let scoreStyle = '';
        let icon = '';
        if (p.hitType === "EXACT") { scoreStyle = 'color: var(--color-exact); font-weight: 800;'; icon = '✅'; }
        else if (p.hitType === "DIFF") { scoreStyle = 'color: var(--color-diff); font-weight: 800;'; icon = '🔥'; }
        else if (p.hitType === "WINNER") { scoreStyle = 'color: var(--color-winner); font-weight: 800;'; icon = '👍'; }
        else if (p.hitType === "MISS") { scoreStyle = 'color: var(--color-miss); opacity: 0.8;'; icon = '❌'; }

        return `
          <div class="glass-card prediction-row animate-slide-up" style="animation-delay: ${index * 0.05}s">
            <a href="/perfil/${p.id}" data-link style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit;">
              <img src="${p.photo}" class="avatar" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">
              <div>
                <div style="font-weight: 600;">${p.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.role || 'Participante'} · ${getParticipantProgramLabel(p)}</div>
              </div>
            </a>
            <div class="prediction-score" style="text-align: right;">
              <div style="${scoreStyle} font-size: 1.25rem;">${p.prediction ? `${p.prediction.home} - ${p.prediction.away}` : '? - ?'}</div>
              ${p.points !== null ? `<small style="${scoreStyle}">${icon} ${p.points} pts</small>` : ''}
            </div>
          </div>
        `;
      }).join('');

  return `
    <div class="predicciones-page animate-fade-in" style="max-width: 800px; margin: 0 auto;">
      <a href="/fixture" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">← Volver al Fixture</a>
      
      <h1 style="margin-bottom: 0.5rem; text-align: center;">Predicciones del Partido</h1>
      <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <span style="font-weight: 600; font-size: 1.4rem;">${home.name}</span>
          <span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${home.flag}</span>
        </div>
        <div style="color: var(--text-secondary); font-weight: bold; font-size: 1.1rem;">vs</div>
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <span style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${away.flag}</span>
          <span style="font-weight: 600; font-size: 1.4rem;">${away.name}</span>
        </div>
      </div>
      ${result ? `<p class="result-pill" style="text-align: center; margin-bottom: 2rem;">Resultado final: ${result.home} - ${result.away}</p>` : ''}
      
      <div class="predicciones-list">
        ${prediccionesHTML}
      </div>
    </div>
  `;
}
