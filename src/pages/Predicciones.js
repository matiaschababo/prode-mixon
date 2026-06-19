// src/pages/Predicciones.js
import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { getParticipantProgramLabel } from '../data/participants.js';
import { getPredictions, getMatchResult, getDynamicUsers } from '../services/prodeStore.js';
import { calculatePoints, getHitType } from '../services/scoring.js';

const escapeJS = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
const escapeHTML = (str) => String(str || '').replace(/"/g, '&quot;');

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

        const likes = p.prediction.likes || [];
        const shares = p.prediction.shares || 0;
        const currentUserId = window.auth?.currentUser ? (window.resolveUid ? window.resolveUid(window.auth.currentUser.uid) : window.auth.currentUser.uid) : null;
        const hasLiked = likes.some(l => (window.resolveUid ? window.resolveUid(l.uid) : l.uid) === currentUserId);
        const heartColor = hasLiked ? '#ff4757' : 'currentColor';
        const heartFill = hasLiked ? '#ff4757' : 'none';

        return `
          <div class="glass-card prediction-row animate-slide-up" style="animation-delay: ${index * 0.05}s">
            <a href="/perfil/${p.id}" data-link style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit; flex: 1;">
              <img src="${p.photo}" class="avatar" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;">
              <div>
                <div style="font-weight: 600;">${p.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${p.role || 'Participante'} · ${getParticipantProgramLabel(p)}</div>
              </div>
            </a>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
              <div class="prediction-score" style="text-align: right;">
                <div style="${scoreStyle} font-size: 1.25rem;">${p.prediction ? `${p.prediction.home} - ${p.prediction.away}` : '? - ?'}</div>
                ${p.points !== null ? `<small style="${scoreStyle}">${result && result.live ? '<span style="opacity:0.8; font-size:0.75rem;">Con este resultado: </span>' : ''}${icon} ${p.points} pts</small>` : ''}
                ${(() => {
                  if (p.prediction && p.prediction.timestamp) {
                    let d;
                    if (typeof p.prediction.timestamp.toDate === 'function') {
                      d = p.prediction.timestamp.toDate();
                    } else if (p.prediction.timestamp.seconds) {
                      d = new Date(p.prediction.timestamp.seconds * 1000);
                    } else {
                      d = new Date(p.prediction.timestamp);
                    }
                    if (!isNaN(d)) return `<div style="font-size:0.6rem; color:var(--text-muted); margin-top:4px;">${d.toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'})} ${d.toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'})}</div>`;
                  }
                  return '';
                })()}
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.8rem;">
                <div style="display: flex; align-items: center; gap: 0.2rem;">
                  <button onclick="window.toggleLikeOnPrediction('${match.id}', '${p.id}')" class="btn btn-sm" style="background: transparent; color: ${heartColor}; padding: 0.2rem; border: none; box-shadow: none;" title="Me gusta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="${heartFill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </button>
                  ${likes.length > 0 ? `<span style="cursor:pointer;" onclick="window.showLikesModal('${escape(JSON.stringify(likes))}')">${likes.length}</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 0.2rem;">
                  <button onclick="window.sharePredictionToChat('${p.id}', '${p.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${(home.name + " vs " + away.name).replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${p.prediction.home} - ${p.prediction.away}', '${match.id}')" class="btn btn-sm" style="background: transparent; color: var(--color-mixon-main); padding: 0.2rem; border: none; box-shadow: none;" title="Compartir al chat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </button>
                  ${shares > 0 ? `<span>${shares}</span>` : ''}
                </div>
              </div>
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
      ${result ? `<p class="result-pill" style="text-align: center; margin-bottom: 2rem;">${result.live ? 'Resultado parcial (En vivo)' : 'Resultado final'}: ${result.home} - ${result.away}</p>` : ''}
      
      <div class="predicciones-list">
        ${prediccionesHTML}
      </div>
    </div>
  `;
}
