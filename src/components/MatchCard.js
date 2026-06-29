// src/components/MatchCard.js
import { teams } from '../data/teams.js';
import { getMatchStats } from '../services/prodeStore.js';
import { MULTIPLIERS, calculatePoints } from '../services/scoring.js';

const escapeHTML = (str) => String(str || '').replace(/"/g, '&quot;');

export function MatchCard(match, resultOverride = null, userPred = null) {
  const home = teams[match.homeTeam] || { name: match.homeTeam, flag: "❓" };
  const away = teams[match.awayTeam] || { name: match.awayTeam, flag: "❓" };
  
  const dateObj = new Date(resultOverride?.actualDate || match.date);
  const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const isPast = new Date() >= dateObj;
  const isMatchFinished = match.status === 'finished' || resultOverride?.status === 'FINISHED' || resultOverride?.status === 'FINALIZADO';
  const isMatchLive = match.status === 'live' || resultOverride?.live || resultOverride?.status === 'PAUSED';
  const hasStarted = isPast || isMatchFinished || isMatchLive;

  let badgeClass = 'badge-scheduled';
  let statusText = 'Programado';
  if (resultOverride?.live || match.status === 'live') {
    badgeClass = 'badge-live';
    let minText = '';
    let isHalftime = resultOverride?.status === 'PAUSED' || resultOverride?.minute === 'HT' || String(resultOverride?.minute).toLowerCase() === 'entretiempo';
    
    if (isHalftime) {
      statusText = `🔴 ENTRETIEMPO`;
    } else {
      if (resultOverride?.minute) {
        minText = ` ${resultOverride.minute}'`;
      }
      statusText = `🔴 EN VIVO${minText}`;
    }
  } else if (isMatchFinished || (isPast && !isMatchLive && ((resultOverride?.home !== undefined && resultOverride?.home !== null) || match.homeScore !== null))) {
    badgeClass = 'badge-finished';
    statusText = 'Finalizado';
  }

  const homeScore = resultOverride?.home ?? match.homeScore;
  const awayScore = resultOverride?.away ?? match.awayScore;
  const hasResult = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;

  const hasPrediction = userPred && userPred.home !== undefined && userPred.home !== null && userPred.home !== '';

  // Points tooltip logic
  const isKnockout = match.stage !== 'Group Stage';
  const multiplier = MULTIPLIERS[match.stage] || 1;
  const maxPts = isKnockout ? 5 * multiplier : 3 * multiplier;
  let pointsTooltip = `<div style="text-align: center; font-size: 0.75rem; color: var(--color-mixon-light); margin-bottom: 0.5rem; opacity: 0.9;">🎯 Puntos posibles: hasta ${maxPts} pts</div>`;
  if (isKnockout) {
    pointsTooltip += `<div style="text-align: center; font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem;">💡 En caso de empate, deberás elegir quién avanza (Suma 2 pts extra)</div>`;
  }
  
  // Advances selector logic (hidden by default unless it's a draw and knockout)
  const isDrawSaved = hasPrediction && userPred.home === userPred.away;
  const showAdvances = isKnockout && isDrawSaved;
  const advancesHtml = isKnockout ? `
    <div class="advances-selector" style="display: ${showAdvances ? 'block' : 'none'}; margin-top: 8px; margin-bottom: 8px; text-align: center;">
      <span style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin-bottom: 4px;">¿Quién clasifica en los penales?</span>
      <div style="display: flex; gap: 0.5rem; justify-content: center;">
        <label style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; cursor: pointer;">
          <input type="radio" name="advances_${match.id}" value="${home.id || home.name}" class="advances-radio" ${userPred?.advances === (home.id || home.name) ? 'checked' : ''}> ${home.name}
        </label>
        <label style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; cursor: pointer;">
          <input type="radio" name="advances_${match.id}" value="${away.id || away.name}" class="advances-radio" ${userPred?.advances === (away.id || away.name) ? 'checked' : ''}> ${away.name}
        </label>
      </div>
    </div>
  ` : '';

  // Build the prediction area
  let predictionArea = '';
  if (userPred !== null) {
    // User is logged in
    if (!hasStarted) {
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
            <div class="pred-edit-form" style="display: none; flex-direction: column;">
              ${pointsTooltip}
              <div class="pred-inputs-row">
                <input type="number" min="0" class="pred-input my-pred-home" data-match="${match.id}" value="${userPred.home}" placeholder="-">
                <span class="pred-dash">-</span>
                <input type="number" min="0" class="pred-input my-pred-away" data-match="${match.id}" value="${userPred.away}" placeholder="-">
              </div>
              ${advancesHtml}
              <button class="btn btn-primary btn-sm pred-save-btn" data-match="${match.id}" style="margin-top: 0.5rem;">Guardar</button>
            </div>
          </div>
        `;
      } else {
        // No prediction yet — show the form open with a call to action
        predictionArea = `
          <div class="pred-area pred-area-open" data-match="${match.id}">
            <div class="pred-cta">
              <span style="font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;">⚽</span>
              <span>¡Cargá tu pronóstico!</span>
            </div>
            <div class="pred-edit-form" style="flex-direction: column;">
              ${pointsTooltip}
              <div class="pred-inputs-row">
                <input type="number" min="0" class="pred-input my-pred-home" data-match="${match.id}" value="" placeholder="-">
                <span class="pred-dash">-</span>
                <input type="number" min="0" class="pred-input my-pred-away" data-match="${match.id}" value="" placeholder="-">
              </div>
              ${advancesHtml}
              <button class="btn btn-primary btn-sm pred-save-btn" data-match="${match.id}" style="margin-top: 0.5rem;">Guardar</button>
            </div>
          </div>
        `;
      }
    } else {
      // Match already started — show prediction as read-only
      if (hasPrediction) {
        let pointsHTML = '';
        if (hasResult) {
          const pts = calculatePoints(userPred.home, userPred.away, homeScore, awayScore, match.stage, userPred.advances, resultOverride?.winner);
          const ptsClass = pts >= 3 ? 'points-exact' : pts === 2 ? 'points-diff' : pts === 1 ? 'points-winner' : 'points-miss';
          const ptsSign = pts > 0 ? '+' : '';
          pointsHTML = `<span class="pred-points ${ptsClass}" style="margin-left: 10px; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; background: rgba(255,255,255,0.1);">${ptsSign}${pts} pts</span>`;
        }
        
        predictionArea = `
          <div class="pred-area pred-area-locked">
            <div class="pred-saved" style="display: flex; align-items: center;">
              <span class="pred-label">Tu pronóstico</span>
              <span class="pred-value">${userPred.home} - ${userPred.away}</span>
              ${pointsHTML}
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

  let actualResult = null;
  if (hasResult) {
    if (homeScore > awayScore) actualResult = 'home';
    else if (homeScore < awayScore) actualResult = 'away';
    else actualResult = 'draw';
  }

  // Community Stats (Sabiduría de la Multitud)
  let communityStatsHTML = '';
  if (userPred !== null) { // Only show stats if user is logged in (i.e. userPred is provided, even if empty)
    const stats = getMatchStats(match.id);
    if (stats.total > 0) {
      const homePct = Math.round((stats.home / stats.total) * 100);
      const drawPct = Math.round((stats.draw / stats.total) * 100);
      const awayPct = Math.round((stats.away / stats.total) * 100);
      let winner = null;
      if (hasResult) {
        if (homeScore > awayScore) winner = 'home';
        else if (awayScore > homeScore) winner = 'away';
        else winner = 'draw';
      }

      communityStatsHTML = `
        <div class="community-stats">
          <div class="stats-label">¿Qué votó la mayoría? (${stats.total} votos)</div>
          <div class="stats-bar">
            <div class="stat-home ${winner === 'home' ? 'stat-winner' : ''}" style="width: ${homePct}%" title="${escapeHTML(home.name)} (${homePct}%)"></div>
            <div class="stat-draw ${winner === 'draw' ? 'stat-winner' : ''}" style="width: ${drawPct}%" title="Empate (${drawPct}%)"></div>
            <div class="stat-away ${winner === 'away' ? 'stat-winner' : ''}" style="width: ${awayPct}%" title="${escapeHTML(away.name)} (${awayPct}%)"></div>
          </div>
          <div class="stats-text">
            <span class="${winner === 'home' ? 'text-highlight' : ''}">${home.flag} ${homePct}%</span>
            <span class="${winner === 'draw' ? 'text-highlight' : ''}">➖ ${drawPct}%</span>
            <span class="${winner === 'away' ? 'text-highlight' : ''}">${away.flag} ${awayPct}%</span>
          </div>
        </div>
      `;
    }
  }

  // Formatting prediction timestamp
  let timestampHTML = '';
  if (userPred && userPred.timestamp) {
    let d;
    if (typeof userPred.timestamp.toDate === 'function') {
      d = userPred.timestamp.toDate();
    } else if (userPred.timestamp.seconds) {
      d = new Date(userPred.timestamp.seconds * 1000);
    } else {
      d = new Date(userPred.timestamp);
    }
    if (!isNaN(d)) {
      const formattedDate = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const formattedTime = d.toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      timestampHTML = `<div class="pred-timestamp" style="font-size: 0.65rem; color: var(--text-muted); text-align: center; margin-top: 4px;">Guardado: ${formattedDate} a las ${formattedTime}</div>`;
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
    <div id="match-${match.id}" class="glass-card match-card animate-slide-up" data-stage="${match.stage}" data-home="${match.homeTeam}" data-away="${match.awayTeam}">
      <div class="match-header">
        <span class="match-round">${match.round}</span>
        <span class="badge ${badgeClass}">${statusText}</span>
      </div>
      
      <div class="match-teams">
        <div class="team home" onclick="window.router.navigate('/equipo/${match.homeTeam}')" style="cursor: pointer;">
          <img src="${home.flagUrl}" alt="${escapeHTML(home.name)}" loading="lazy" class="flag-img" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span class="flag-emoji" style="display:none">${home.flag}</span>
          <span class="name">${escapeHTML(home.name)}</span>
        </div>
        
        <div class="match-center">
          ${scoreDisplay}
          <div class="match-date">${dateStr}</div>
        </div>
        
        <div class="team away" onclick="window.router.navigate('/equipo/${match.awayTeam}')" style="cursor: pointer;">
          <img src="${away.flagUrl}" alt="${escapeHTML(away.name)}" loading="lazy" class="flag-img" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span class="flag-emoji" style="display:none">${away.flag}</span>
          <span class="name">${escapeHTML(away.name)}</span>
        </div>
      </div>

      ${(() => {
        const events = resultOverride?.events || [];
        const displayEvents = events.filter(e => e.type === 'goal' || e.type === 'red');
        if (displayEvents.length === 0) return '';
        
        const homeEvents = displayEvents.filter(e => e.team.toLowerCase() === match.homeTeam.toLowerCase());
        const awayEvents = displayEvents.filter(e => e.team.toLowerCase() === match.awayTeam.toLowerCase());
        
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
      ${timestampHTML}
      ${communityStatsHTML}
      
      <div class="match-footer">
        <span>📍 ${match.venue}</span>
        <a href="/predicciones/${match.id}" class="btn btn-secondary btn-sm" title="Comparar los pronósticos de todos los usuarios registrados para este partido" data-link>👥 Comparar pronósticos</a>
      </div>
    </div>
  `;
}
