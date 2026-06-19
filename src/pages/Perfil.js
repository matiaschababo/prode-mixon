import { matches } from '../data/matches.js';
import { getParticipantProgramIds, getParticipantProgramLabel, getPrimaryProgram } from '../data/participants.js';
import { teams } from '../data/teams.js';
import { calculatePoints } from '../services/scoring.js';
import { getMatchResult, getPredictions, getParticipantStats, getDynamicUsers, isMasterAdmin, adminSavePrediction, updateUserPhoto, updateUserDisplayName } from '../services/prodeStore.js';
import { auth } from '../services/firebase.js';

const escapeJS = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
const escapeHTML = (str) => String(str || '').replace(/"/g, '&quot;');

export function Perfil(participantId) {
  const dynamicUsers = getDynamicUsers();
  const participant = dynamicUsers.find(item => item.id === participantId);
  if (!participant) return `<h2>Conductor no encontrado</h2>`;

  const program = getPrimaryProgram(participant);
  const firstProgramId = getParticipantProgramIds(participant)[0];
  const predictions = getPredictions();
  const stats = getParticipantStats(participantId);

  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setUTCHours(d.getUTCHours() - 10);
    return d.toISOString().split('T')[0];
  };

  const history = matches.map(match => {
    const prediction = predictions[String(match.id)]?.[participantId];
    const result = getMatchResult(match);
    const points = prediction && result
      ? calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage)
      : null;
    const home = teams[match.homeTeam] || { name: match.homeTeam, flag: '' };
    const away = teams[match.awayTeam] || { name: match.awayTeam, flag: '' };

    return {
      match,
      prediction,
      result,
      points,
      label: `<span style="font-size:1.1rem; vertical-align:middle; margin-right:4px;">${home.flag}</span> ${home.name} vs ${away.name} <span style="font-size:1.1rem; vertical-align:middle; margin-left:4px;">${away.flag}</span>`,
      plainLabel: `${home.flag} ${home.name} vs ${away.name} ${away.flag}`
    };
  });

  const loggedInUser = auth.currentUser;
  const isAdmin = loggedInUser && isMasterAdmin(loggedInUser.email);
  const isOwnProfile = loggedInUser && (window.resolveUid ? window.resolveUid(loggedInUser.uid) : loggedInUser.uid) === (window.resolveUid ? window.resolveUid(participantId) : participantId);

  const rows = history.map(item => {
    let predictionHtml;
    if (isAdmin) {
      predictionHtml = `
        <div class="prediction-inputs" style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="number" min="0" class="admin-pred-input admin-pred-home" data-match="${item.match.id}" data-uid="${participantId}" value="${item.prediction?.home ?? '0'}" style="width: 40px; text-align: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; padding: 0.25rem;">
          <span>-</span>
          <input type="number" min="0" class="admin-pred-input admin-pred-away" data-match="${item.match.id}" data-uid="${participantId}" value="${item.prediction?.away ?? '0'}" style="width: 40px; text-align: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; padding: 0.25rem;">
        </div>
      `;
    } else {
      let tsHtml = '';
      if (item.prediction?.timestamp) {
        const d = item.prediction.timestamp.toDate ? item.prediction.timestamp.toDate() : new Date(item.prediction.timestamp);
        if (!isNaN(d)) {
          const dateStr = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
          const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          tsHtml = `<div style="font-size:0.6rem; color:var(--text-muted); margin-top:2px;" title="${dateStr} ${timeStr}">${dateStr} ${timeStr}</div>`;
        }
      }
      predictionHtml = `<div style="display:flex; flex-direction:column; align-items:center;"><span>${item.prediction ? `${item.prediction.home}-${item.prediction.away}` : 'Sin predicción'}</span>${tsHtml}</div>`;
    }

    return `
      <div class="history-row ${item.points === null ? 'pending' : ''}" id="match-${item.match.id}" data-date="${getLogicalDate(item.match.date)}">
        <div>
          <strong>${item.label}</strong>
          <small>${item.match.round}</small>
        </div>
        <div class="history-score">
          ${predictionHtml}
          <small>Predicción</small>
        </div>
        <div class="history-score">
          <span>${item.result ? `${item.result.home}-${item.result.away}` : 'Pendiente'}</span>
          <small>Resultado</small>
        </div>
        <div class="history-points" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
          <div style="font-weight: 600;">${item.points ?? '-'} pts</div>
          ${item.prediction ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.7rem;">
              <div style="display: flex; align-items: center; gap: 0.2rem;">
                <button onclick="window.toggleLikeOnPrediction('${item.match.id}', '${participantId}')" class="btn btn-sm" style="background: transparent; color: ${item.prediction.likes?.some(l => (window.resolveUid ? window.resolveUid(l.uid) : l.uid) === (window.resolveUid ? window.resolveUid(window.auth?.currentUser?.uid) : window.auth?.currentUser?.uid)) ? '#ff4757' : 'currentColor'}; padding: 0.2rem; border: none; box-shadow: none;" title="Me gusta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="${item.prediction.likes?.some(l => (window.resolveUid ? window.resolveUid(l.uid) : l.uid) === (window.resolveUid ? window.resolveUid(window.auth?.currentUser?.uid) : window.auth?.currentUser?.uid)) ? '#ff4757' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
                ${item.prediction.likes?.length > 0 ? `<span style="cursor:pointer;" onclick="window.showLikesModal('${escape(JSON.stringify(item.prediction.likes))}')">${item.prediction.likes.length}</span>` : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 0.2rem;">
                <button onclick="window.sharePredictionToChat('${participantId}', '${participant.name.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${item.plainLabel.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', '${item.prediction.home} - ${item.prediction.away}', '${item.match.id}')" class="btn btn-sm" style="background: transparent; color: var(--color-mixon-main); padding: 0.2rem; border: none; box-shadow: none;" title="Compartir al chat">

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </button>
                ${item.prediction.shares > 0 ? `<span>${item.prediction.shares}</span>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="profile-page animate-fade-in">
      <a href="#" onclick="window.history.back(); return false;" class="btn btn-secondary btn-sm" style="margin-bottom: 1rem;">Volver</a>

      <section class="profile-hero glass-card" style="border-color: ${program.theme.main}">
        <div style="position: relative; display: inline-block;">
          <img src="${participant.photo}" class="profile-photo" alt="${escapeHTML(participant.name)}">
          ${isAdmin ? `
            <button class="btn btn-secondary btn-sm change-photo-btn" data-uid="${participantId}" style="position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); padding: 0.2rem 0.5rem; font-size: 0.7rem; white-space: nowrap; border-radius: 20px;">✏️ Cambiar foto</button>
          ` : ''}
        </div>
        <div>
          <p class="eyebrow">${participant.role || 'Participante'} · ${getParticipantProgramLabel(participant)}</p>
          <h1 style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">${participant.name}
            ${stats.currentStreak >= 3 ? `
              <div class="streak-badge-container" style="font-size: 0.9rem;">
                <span class="streak-badge-icon">🔥 Racha x${stats.currentStreak}</span>
                <div class="streak-popover" style="text-transform: none;">
                  <h4 style="font-size: 0.8rem;">Racha Activa</h4>
                  <p style="font-size: 0.8rem;">Sumando puntos hace ${stats.currentStreak} partidos consecutivos</p>
                </div>
              </div>
            ` : ''}
            ${isOwnProfile ? `<button class="btn btn-secondary btn-sm edit-name-btn" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">✏️ Cambiar nombre</button>` : ''}
          </h1>
          
          ${stats.badges?.length > 0 || stats.mvpCount > 0 ? `
            <div class="badges-container" style="justify-content: flex-start; margin-bottom: 0.8rem; gap: 0.5rem; flex-wrap: wrap;">
              ${stats.mvpDates?.length > 0 ? stats.mvpDates.map(d => {
                const [y, m, day] = d.split('-');
                const dateObj = new Date(y, m - 1, day);
                const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
                return `<div class="badge-item mvp-badge-single" data-tooltip="Clic para ver tus predicciones\nde la jornada MVP (${dateStr})" data-filter-date="${d}" onclick="window.filterHistoryByDate('${d}', true)" style="cursor: pointer; transition: all 0.2s;">👑 MVP ${dateStr.split(' ')[1]} ${dateStr.split(' ')[2]}</div>`;
              }).join('') : ''}
              ${stats.badges?.length > 0 ? stats.badges.map(b => {
                let badgeIcon = '⭐';
                let badgeDesc = 'Insignia especial por logros en el prode.';
                if (b === 'El Oráculo') { badgeIcon = '🔮'; badgeDesc = 'Acertó 5 o más resultados exactos en el torneo.'; }
                else if (b === 'Buzzer Beater') { badgeIcon = '⏳'; badgeDesc = 'Cargó un pronóstico exacto en los últimos 5 minutos antes de que empiece el partido.'; }
                else if (b === 'El Contra') { badgeIcon = '🧠'; badgeDesc = 'Fue la única persona en todo el prode en acertar el ganador de un partido.'; }
                else if (b === 'Racha de Fuego') { badgeIcon = '☄️'; badgeDesc = 'Acertó 3 o más resultados exactos de forma consecutiva.'; }
                else if (b === 'MVP x3') { badgeIcon = '🏆'; badgeDesc = 'Ganó el MVP de la jornada 3 o más veces.'; }
                else if (b === 'Influencer') { badgeIcon = '📱'; badgeDesc = 'Invitó a 5 o más amigos a la plataforma.'; }
                return `<div class="badge-item" data-tooltip="${badgeDesc}">${badgeIcon} ${b}</div>`;
              }).join('') : ''}
            </div>
          ` : ''}

          <div class="profile-stats">
            <div><strong>${stats.totalPoints}</strong><span>puntos</span></div>
            <div><strong>${stats.played}</strong><span>partidos puntuados</span></div>
            <div><strong>${stats.exacts}</strong><span>exactos</span></div>
            <div><strong>${stats.hits}</strong><span>aciertos</span></div>
          </div>
        </div>
      </section>

      <section style="margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
          <h2 style="margin: 0;">Historial de predicciones</h2>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <select id="history-filter" onchange="window.filterHistoryByDate(this.value)" style="padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5); color: white; cursor: pointer; outline: none; font-size: 0.9rem;">
              <option value="all">Todas las jornadas</option>
              ${[...new Set(history.map(h => getLogicalDate(h.match.date)))].sort().map(d => {
                const [y, m, day] = d.split('-');
                const dateObj = new Date(y, m - 1, day);
                const label = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                return `<option value="${d}">Jornada ${label}</option>`;
              }).join('')}
            </select>
            <button id="clear-history-filter" class="btn btn-secondary btn-sm" style="display: none; padding: 0.4rem 0.8rem; font-size: 0.9rem; border-radius: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: white; cursor: pointer;" onclick="window.filterHistoryByDate('all')">Ver todas</button>
          </div>
        </div>
        <div class="glass-card history-table">
          ${rows}
        </div>
      </section>
    </div>
  `;
}

export function attachPerfilEvents() {
  window.filterHistoryByDate = (dateStr, isBadgeClick) => {
    const filterSelect = document.getElementById('history-filter');
    let targetDate = dateStr;
    if (filterSelect) {
      if (isBadgeClick && filterSelect.value === dateStr) {
        targetDate = 'all';
      }
      filterSelect.value = targetDate;
    }
    
    const clearBtn = document.getElementById('clear-history-filter');
    if (clearBtn) {
      clearBtn.style.display = targetDate === 'all' ? 'none' : 'inline-block';
    }
    
    document.querySelectorAll('.history-row').forEach(row => {
      if (targetDate === 'all' || row.dataset.date === targetDate) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    document.querySelectorAll('.mvp-badge-single').forEach(b => {
      const filterDate = b.dataset.filterDate;
      const [y, m, day] = filterDate.split('-');
      const dateObj = new Date(y, m - 1, day);
      const label = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
      
      if (targetDate !== 'all' && filterDate === targetDate) {
        b.style.boxShadow = '0 0 0 2px var(--color-mixon-main)';
        b.style.background = 'rgba(255,215,0,0.2)';
        b.setAttribute('data-tooltip', `Clic para quitar filtro\n(Ver todas las jornadas)`);
      } else {
        b.style.boxShadow = 'none';
        b.style.background = '';
        b.setAttribute('data-tooltip', `Clic para ver tus predicciones\nde la jornada MVP (${label})`);
      }
    });
  };

  document.querySelectorAll('.admin-pred-input').forEach(input => {
    if (input.dataset.eventsAttached) return;
    input.dataset.eventsAttached = 'true';
    input.addEventListener('change', async (e) => {
      const matchId = e.target.dataset.match;
      const userId = e.target.dataset.uid;
      const row = e.target.closest('.history-row');
      const home = row.querySelector('.admin-pred-home').value;
      const away = row.querySelector('.admin-pred-away').value;
      
      try {
        await adminSavePrediction(userId, matchId, home, away);
        e.target.style.borderColor = '#2ed573';
        setTimeout(() => e.target.style.borderColor = 'rgba(255,255,255,0.2)', 1000);
      } catch (err) {
        alert("Error al guardar: " + err.message);
      }
    });
  });

  const changePhotoBtn = document.querySelector('.change-photo-btn');
  if (changePhotoBtn && !changePhotoBtn.dataset.eventsAttached) {
    changePhotoBtn.dataset.eventsAttached = 'true';
    changePhotoBtn.addEventListener('click', async (e) => {
      const uid = e.target.dataset.uid;
      const url = prompt("Pegá el enlace (URL) de la nueva foto.\nDejá el espacio en blanco si querés restaurar la foto original.");
      if (url !== null) { // User didn't click Cancel
        try {
          await updateUserPhoto(uid, url.trim());
          alert("¡Foto actualizada! Los cambios pueden tardar unos segundos en reflejarse.");
          window.location.reload();
        } catch (err) {
          alert("Error: " + err.message);
        }
      }
    });
  }

  const editNameBtn = document.querySelector('.edit-name-btn');
  if (editNameBtn) {
    editNameBtn.addEventListener('click', async () => {
      const currentName = document.querySelector('.profile-hero h1')?.textContent?.trim() || '';
      const newName = prompt('Ingresá tu nuevo nombre de usuario:', currentName);
      if (newName !== null && newName.trim()) {
        try {
          await updateUserDisplayName(newName);
          window.location.reload();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    });
  }
}
