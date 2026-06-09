// src/pages/Predicciones.js
import { matches } from '../data/matches.js';
import { participants } from '../data/participants.js';

export function Predicciones(matchId) {
  const match = matches.find(m => m.id === parseInt(matchId));
  if (!match) return `<h2>Partido no encontrado</h2>`;

  // Mock de predicciones para diseño
  const prediccionesHTML = participants.map((p, index) => {
    return `
      <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; animation-delay: ${index * 0.1}s" class="animate-slide-up">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="${p.photo}" class="avatar" style="width: 40px; height: 40px;">
          <div>
            <div style="font-weight: 600;">${p.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.programId}</div>
          </div>
        </div>
        <div style="font-family: var(--font-display); font-size: 1.5rem; font-weight: 800;">
          <span style="color: var(--text-muted)">? - ?</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="predicciones-page animate-fade-in" style="max-width: 800px; margin: 0 auto;">
      <a href="/fixture" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">← Volver al Fixture</a>
      
      <h1 style="margin-bottom: 0.5rem;">Predicciones del Partido</h1>
      <h3 style="color: var(--color-mixon-light); margin-bottom: 2rem;">${match.homeTeam} vs ${match.awayTeam}</h3>
      
      <div class="predicciones-list">
        ${prediccionesHTML}
      </div>
    </div>
  `;
}
