// src/components/MatchCard.js
import { teams } from '../data/teams.js';

export function MatchCard(match, resultOverride = null, userPred = null) {
  const home = teams[match.homeTeam] || { name: match.homeTeam, flag: "❓" };
  const away = teams[match.awayTeam] || { name: match.awayTeam, flag: "❓" };
  
  const dateObj = new Date(match.date);
  const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const isPast = new Date() >= dateObj;

  let badgeClass = 'badge-scheduled';
  let statusText = 'Programado';
  if (resultOverride?.live || match.status === 'live') {
    badgeClass = 'badge-live';
    statusText = `🔴 EN VIVO ${resultOverride?.minute ? '- ' + resultOverride.minute + "'" : ''}`;
  } else if (match.status === 'finished' || (isPast && !resultOverride?.live && (resultOverride?.home !== undefined || match.homeScore !== null))) {
    badgeClass = 'badge-finished';
    statusText = 'Finalizado';
  }

  const homeScore = resultOverride?.home ?? match.homeScore;
  const awayScore = resultOverride?.away ?? match.awayScore;
  const hasResult = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  const hasPrediction = userPred && userPred.home !== undefined && userPred.home !== null && userPred.home !== '';

  // Build the prediction area
  let predictionArea = '';
  if (userPred !== null) {
    // User is logged in
    if (!isPast) {
      // Match hasn't started — they can predict
      if (hasPrediction) {
        // Already has a prediction saved — show it with a "Cambiar" button
        predictionArea = `
          <div class="pred-area" data-match="${match.id}">
            <div class="pred-saved">
              <span class="pred-label">Tu pronóstico</span>
              <span class="pred-value">${userPred.home} - ${userPred.away}</span>
            </div>
            <button class="btn btn-secondary btn-sm pred-change-btn" data-match="${match.id}">✏️ Cambiar</button>
            <div class="pred-edit-form" style="display: none;">
              <div class="pred-inputs-row">
                <input type="number" min="0" class="pred-input my-pred-home" data-match="${match.id}" value="${userPred.home}" placeholder="0">
                <span class="pred-dash">-</span>
                <input type="number" min="0" class="pred-input my-pred-away" data-match="${match.id}" value="${userPred.away}" placeholder="0">
              </div>
              <button class="btn btn-primary btn-sm pred-save-btn" data-match="${match.id}">Guardar</button>
            </div>
          </div>
        `;
      } else {
        // No prediction yet — show the form open with a call to action
        predictionArea = `
          <div class="pred-area pred-area-open" data-match="${match.id}">
            <span class="pred-cta">⚽ ¡Cargá tu pronóstico!</span>
            <div class="pred-edit-form">
              <div class="pred-inputs-row">
                <input type="number" min="0" class="pred-input my-pred-home" data-match="${match.id}" value="" placeholder="0">
                <span class="pred-dash">-</span>
                <input type="number" min="0" class="pred-input my-pred-away" data-match="${match.id}" value="" placeholder="0">
              </div>
              <button class="btn btn-primary btn-sm pred-save-btn" data-match="${match.id}">Guardar</button>
            </div>
          </div>
        `;
      }
    } else {
      // Match already started — show prediction as read-only
      if (hasPrediction) {
        predictionArea = `
          <div class="pred-area pred-area-locked">
            <div class="pred-saved">
              <span class="pred-label">Tu pronóstico</span>
              <span class="pred-value">${userPred.home} - ${userPred.away}</span>
            </div>
            <span class="pred-lock">🔒</span>
          </div>
        `;
      } else {
        predictionArea = `
          <div class="pred-area pred-area-locked">
            <span class="pred-label" style="color: var(--text-muted);">No cargaste pronóstico</span>
            <span class="pred-lock">🔒</span>
          </div>
        `;
      }
    }
  }

  // Main score display (result or time)
  let scoreDisplay;
  if (hasResult) {
    scoreDisplay = `<div class="match-score">${homeScore} - ${awayScore}</div>`;
  } else {
    scoreDisplay = `<div class="match-time">${timeStr}</div>`;
  }

  return `
    <div class="glass-card match-card animate-slide-up" data-stage="${match.stage}" data-home="${match.homeTeam}" data-away="${match.awayTeam}">
      <div class="match-header">
        <span class="match-round">${match.round}</span>
        <span class="badge ${badgeClass}">${statusText}</span>
      </div>
      
      <div class="match-teams">
        <div class="team home">
          <img src="${home.flagUrl}" alt="${home.name}" class="flag-img" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span class="flag-emoji" style="display:none">${home.flag}</span>
          <span class="name">${home.name}</span>
        </div>
        
        <div class="match-center">
          ${scoreDisplay}
          <div class="match-date">${dateStr}</div>
        </div>
        
        <div class="team away">
          <img src="${away.flagUrl}" alt="${away.name}" class="flag-img" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span class="flag-emoji" style="display:none">${away.flag}</span>
          <span class="name">${away.name}</span>
        </div>
      </div>

      ${(() => {
        const events = resultOverride?.events || [];
        if (events.length === 0) return '';
        
        const homeEvents = events.filter(e => e.team.toLowerCase() === match.homeTeam.toLowerCase());
        const awayEvents = events.filter(e => e.team.toLowerCase() === match.awayTeam.toLowerCase());
        
        const renderEvs = (evs) => evs.map(e => `
          <div class="event-item">
            ${e.type === 'goal' ? '⚽' : '🟥'} ${e.player} <span class="event-min">${e.min}</span>
          </div>
        `).join('');

        return `
          <div class="match-events-timeline">
            <div class="events-home">${renderEvs(homeEvents)}</div>
            <div class="events-away">${renderEvs(awayEvents)}</div>
          </div>
        `;
      })()}

      ${predictionArea}
      
      <div class="match-footer">
        <span>📍 ${match.venue}</span>
        <a href="/predicciones/${match.id}" class="btn btn-secondary btn-sm" data-link>Ver todas</a>
      </div>
    </div>
  `;
}
