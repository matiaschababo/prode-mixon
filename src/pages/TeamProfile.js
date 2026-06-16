import { teams } from '../data/teams.js';
import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { calculateGroupStandings } from '../services/standings.js';

export function TeamProfile() {
  const path = window.location.pathname;
  const teamId = path.split('/').pop().toUpperCase();
  const team = teams[teamId];

  if (!team || teamId === 'TBD') {
    return `
      <section class="team-profile-page">
        <h1 class="page-title animate-fade-in" style="text-align:center;">Selección no encontrada</h1>
        <div style="text-align:center; margin-top:2rem;">
          <a href="/llaves" class="btn btn-primary" data-link>Volver a Fase de Grupos</a>
        </div>
      </section>
    `;
  }

  // Get all matches for this team
  const teamMatches = matches.filter(m => m.homeTeam === team.id || m.awayTeam === team.id);

  // Compute standings to show group position
  const standings = calculateGroupStandings();
  const groupStandings = standings[team.group] || [];
  const teamStats = groupStandings.find(s => s.id === team.id);
  const position = groupStandings.findIndex(s => s.id === team.id) + 1;

  let statsSection = '';
  if (teamStats) {
    statsSection = `
      <div class="glass-card animate-slide-up" style="margin-top: 2rem; padding: 1.5rem; text-align: center;">
        <h3 style="margin-bottom: 1rem;">Estadísticas del Torneo</h3>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${position}°</div><div style="font-size: 0.8rem; color: var(--text-muted);">Posición Grupo ${team.group}</div></div>
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${teamStats.points}</div><div style="font-size: 0.8rem; color: var(--text-muted);">Puntos</div></div>
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${teamStats.played}</div><div style="font-size: 0.8rem; color: var(--text-muted);">Partidos</div></div>
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${teamStats.won}</div><div style="font-size: 0.8rem; color: var(--text-muted);">Victorias</div></div>
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${teamStats.drawn}</div><div style="font-size: 0.8rem; color: var(--text-muted);">Empates</div></div>
          <div><div style="font-size: 2rem; font-weight: 800; color: var(--color-mixon-light);">${teamStats.lost}</div><div style="font-size: 0.8rem; color: var(--text-muted);">Derrotas</div></div>
        </div>
      </div>
    `;
  }

  return `
    <section class="team-profile-page" style="max-width: 800px; margin: 0 auto;">
      <div class="team-profile-header animate-fade-in">
        <img src="${team.flagUrl}" alt="${String(team.name).replace(/"/g, '&quot;')}" class="team-profile-flag">
        <div class="team-profile-info">
          <h1 class="page-title" style="margin-bottom: 0.25rem;">${team.name}</h1>
          <div class="team-profile-group">Grupo ${team.group}</div>
        </div>
      </div>

      ${statsSection}

      <h2 class="section-title animate-fade-in" style="margin-top: 3rem;">Partidos</h2>
      <div class="matches-list animate-slide-up" style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
        ${teamMatches.map(m => MatchCard(m)).join('')}
      </div>

      <div style="text-align:center; margin-top:3rem;" class="animate-fade-in">
        <a href="/llaves" class="btn btn-secondary" data-link>Volver a Llaves</a>
      </div>
    </section>
  `;
}
