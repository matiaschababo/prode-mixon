import { matches } from '../data/matches.js';
import { getParticipantProgramIds, getParticipantProgramLabel, getPrimaryProgram } from '../data/participants.js';
import { teams } from '../data/teams.js';
import { calculatePoints } from '../services/scoring.js';
import { getMatchResult, getPredictions, getParticipantStats, getDynamicUsers } from '../services/prodeStore.js';

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

  const rows = history.map(item => `
    <div class="history-row ${item.points === null ? 'pending' : ''}">
      <div>
        <strong>${item.label}</strong>
        <small>${item.match.round}</small>
      </div>
      <div class="history-score">
        <span>${item.prediction ? `${item.prediction.home}-${item.prediction.away}` : 'Sin predicción'}</span>
        <small>Predicción</small>
      </div>
      <div class="history-score">
        <span>${item.result ? `${item.result.home}-${item.result.away}` : 'Pendiente'}</span>
        <small>Resultado</small>
      </div>
      <div class="history-points">${item.points ?? '-'} pts</div>
    </div>
  `).join('');

  return `
    <div class="profile-page animate-fade-in">
      <a href="${firstProgramId ? `/programas/${firstProgramId}` : '/programas'}" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">Volver</a>

      <section class="profile-hero glass-card" style="border-color: ${program.theme.main}">
        <img src="${participant.photo}" class="profile-photo" alt="${participant.name}">
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
