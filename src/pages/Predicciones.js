// src/pages/Predicciones.js
import { matches } from '../data/matches.js';
import { getParticipantProgramLabel } from '../data/participants.js';
import { getPredictions, getMatchResult, getDynamicUsers } from '../services/prodeStore.js';
import { calculatePoints } from '../services/scoring.js';

export function Predicciones(matchId) {
  const match = matches.find(m => m.id === parseInt(matchId));
  if (!match) return `<h2>Partido no encontrado</h2>`;

  const predictions = getPredictions()[String(match.id)] || {};
  const result = getMatchResult(match);
  const dynamicUsers = getDynamicUsers();

  // Filter to only users who have a prediction for this match
  const usersWithPredictions = dynamicUsers.filter(u => predictions[u.id]);

  const prediccionesHTML = usersWithPredictions.length === 0
    ? `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Todavía nadie cargó una predicción para este partido.</p>`
    : usersWithPredictions.map((p, index) => {
        const prediction = predictions[p.id];
        const points = prediction && result
          ? calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage)
          : null;

        return `
          <div class="glass-card prediction-row animate-slide-up" style="animation-delay: ${index * 0.05}s">
            <a href="/perfil/${p.id}" data-link style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit;">
              <img src="${p.photo}" class="avatar" style="width: 40px; height: 40px;">
              <div>
                <div style="font-weight: 600;">${p.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.role || 'Participante'} · ${getParticipantProgramLabel(p)}</div>
              </div>
            </a>
            <div class="prediction-score">
              <span>${prediction ? `${prediction.home} - ${prediction.away}` : '? - ?'}</span>
              ${points !== null ? `<small>${points} pts</small>` : ''}
            </div>
          </div>
        `;
      }).join('');

  return `
    <div class="predicciones-page animate-fade-in" style="max-width: 800px; margin: 0 auto;">
      <a href="/fixture" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">← Volver al Fixture</a>
      
      <h1 style="margin-bottom: 0.5rem;">Predicciones del Partido</h1>
      <h3 style="color: var(--color-mixon-light); margin-bottom: 2rem;">${match.homeTeam} vs ${match.awayTeam}</h3>
      ${result ? `<p class="result-pill">Resultado cargado: ${result.home} - ${result.away}</p>` : ''}
      
      <div class="predicciones-list">
        ${prediccionesHTML}
      </div>
    </div>
  `;
}
