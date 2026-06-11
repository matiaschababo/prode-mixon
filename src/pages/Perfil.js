import { matches } from '../data/matches.js';
import { getParticipantProgramIds, getParticipantProgramLabel, getPrimaryProgram } from '../data/participants.js';
import { teams } from '../data/teams.js';
import { calculatePoints } from '../services/scoring.js';
import { getMatchResult, getPredictions, getParticipantStats, getDynamicUsers, isMasterAdmin, adminSavePrediction, updateUserPhoto } from '../services/prodeStore.js';
import { auth } from '../services/firebase.js';

export function Perfil(participantId) {
  const dynamicUsers = getDynamicUsers();
  const participant = dynamicUsers.find(item => item.id === participantId);
  if (!participant) return `<h2>Conductor no encontrado</h2>`;

  const program = getPrimaryProgram(participant);
  const firstProgramId = getParticipantProgramIds(participant)[0];
  const predictions = getPredictions();
  const stats = getParticipantStats(participantId);

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
      label: `${home.flag} ${home.name} vs ${away.name} ${away.flag}`
    };
  });

  const loggedInUser = auth.currentUser;
  const isAdmin = loggedInUser && isMasterAdmin(loggedInUser.email);

  const rows = history.map(item => {
    let predictionHtml;
    if (isAdmin) {
      predictionHtml = `
        <div class="prediction-inputs" style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="number" min="0" class="admin-pred-input admin-pred-home" data-match="${item.match.id}" data-uid="${participantId}" value="${item.prediction?.home ?? ''}" placeholder="-" style="width: 40px; text-align: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; padding: 0.25rem;">
          <span>-</span>
          <input type="number" min="0" class="admin-pred-input admin-pred-away" data-match="${item.match.id}" data-uid="${participantId}" value="${item.prediction?.away ?? ''}" placeholder="-" style="width: 40px; text-align: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white; padding: 0.25rem;">
        </div>
      `;
    } else {
      predictionHtml = `<span>${item.prediction ? `${item.prediction.home}-${item.prediction.away}` : 'Sin predicción'}</span>`;
    }

    return `
      <div class="history-row ${item.points === null ? 'pending' : ''}">
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
        <div class="history-points">${item.points ?? '-'} pts</div>
      </div>
    `;
  }).join('');

  return `
    <div class="profile-page animate-fade-in">
      <a href="${firstProgramId ? `/programas/${firstProgramId}` : '/programas'}" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">Volver</a>

      <section class="profile-hero glass-card" style="border-color: ${program.theme.main}">
        <div style="position: relative; display: inline-block;">
          <img src="${participant.photo}" class="profile-photo" alt="${participant.name}">
          ${isAdmin ? `
            <button class="btn btn-secondary btn-sm change-photo-btn" data-uid="${participantId}" style="position: absolute; bottom: 0; left: 50%; transform: translate(-50%, 50%); padding: 0.2rem 0.5rem; font-size: 0.7rem; white-space: nowrap; border-radius: 20px;">✏️ Cambiar foto</button>
          ` : ''}
        </div>
        <div>
          <p class="eyebrow">${participant.role || 'Participante'} · ${getParticipantProgramLabel(participant)}</p>
          <h1>${participant.name}</h1>
          <div class="profile-stats">
            <div><strong>${stats.totalPoints}</strong><span>puntos</span></div>
            <div><strong>${stats.played}</strong><span>partidos puntuados</span></div>
            <div><strong>${stats.exacts}</strong><span>exactos</span></div>
            <div><strong>${stats.hits}</strong><span>aciertos</span></div>
          </div>
        </div>
      </section>

      <section style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem;">Historial de predicciones</h2>
        <div class="glass-card history-table">
          ${rows}
        </div>
      </section>
    </div>
  `;
}

export function attachPerfilEvents() {
  document.querySelectorAll('.admin-pred-input').forEach(input => {
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
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', async (e) => {
      const uid = e.target.dataset.uid;
      const url = prompt("Pegá el enlace (URL) de la nueva foto.\\nDejá el espacio en blanco si querés restaurar la foto original.");
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
}
