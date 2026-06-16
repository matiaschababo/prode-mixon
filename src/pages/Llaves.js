// src/pages/Llaves.js
import { teams } from '../data/teams.js';
import { bracketData, groupsList } from '../data/bracket.js';

import { calculateGroupStandings } from '../services/standings.js';

function renderGroupMini(group, standings) {
  const groupTeams = standings[group] || [];
  const rows = groupTeams.map((team, i) => {
    const posClass = i < 2 ? 'group-qualified' : (i === 2 ? 'group-third' : 'group-eliminated');
    return `
      <tr class="${posClass}" onclick="window.router.navigate('/equipo/${team.id}')" style="cursor: pointer;">
        <td class="group-mini-pos">${i + 1}</td>
        <td class="group-mini-team">
          <img src="${team.flagUrl}" alt="${String(team.name).replace(/"/g, '&quot;')}" class="group-mini-flag" onerror="this.style.display='none'">
          <span class="group-mini-name">${team.name}</span>
        </td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td>${team.goalsFor}</td>
        <td>${team.goalsAgainst}</td>
        <td>${team.goalDiff > 0 ? '+'+team.goalDiff : team.goalDiff}</td>
        <td class="group-mini-pts">${team.points}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="glass-card group-mini animate-slide-up">
      <div class="group-mini-header">Grupo ${group}</div>
      <table class="group-standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Equipo</th>
            <th>PJ</th>
            <th>G</th>
            <th>E</th>
            <th>P</th>
            <th>GF</th>
            <th>GC</th>
            <th>DIF</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function renderBracketSlot(slot, round) {
  const homeLabel = slot.home;
  const awayLabel = slot.away;
  
  // Build detailed tooltip text
  let tooltipHome = homeLabel;
  let tooltipAway = awayLabel;
  
  if (round === 'roundOf32') {
    tooltipHome = expandLabel(homeLabel);
    tooltipAway = expandLabel(awayLabel);
  }

  return `
    <div class="bracket-slot glass-card" data-match="${slot.matchId}">
      <div class="bracket-slot-round">Partido ${slot.matchId}</div>
      <div class="bracket-slot-team">
        <span class="bracket-team-label">${homeLabel}</span>
      </div>
      <div class="bracket-slot-vs">vs</div>
      <div class="bracket-slot-team">
        <span class="bracket-team-label">${awayLabel}</span>
      </div>
      <div class="bracket-tooltip">
        <div class="bracket-tooltip-content">
          <strong>🏟️ Partido ${slot.matchId}</strong>
          <p>${tooltipHome}</p>
          <span class="bracket-tooltip-vs">vs</span>
          <p>${tooltipAway}</p>
        </div>
      </div>
    </div>
  `;
}

function expandLabel(label) {
  return label
    .replace(/^1° Grupo (\w)$/, 'El primero del Grupo $1')
    .replace(/^2° Grupo (\w)$/, 'El segundo del Grupo $1')
    .replace(/^3° Grupo ([A-Z\/]+)$/, 'El mejor tercero de los Grupos $1')
    .replace(/^G\. M(\d+)$/, 'Ganador del Partido $1')
    .replace(/^P\. SF(\d)$/, 'Perdedor de Semifinal $1')
    .replace(/^G\. SF(\d)$/, 'Ganador de Semifinal $1');
}

export function Llaves() {
  const standings = calculateGroupStandings();
  const groups = groupsList.map(g => renderGroupMini(g, standings)).join('');

  const renderRound = (matches, title, round) => {
    const slots = matches.map(s => renderBracketSlot(s, round)).join('');
    return `
      <div class="bracket-round">
        <h3 class="bracket-round-label">${title}</h3>
        <div class="bracket-round-matches">
          ${slots}
        </div>
      </div>
    `;
  };

  return `
    <section class="llaves-page">
      <h1 class="page-title animate-fade-in">Llaves del Mundial 2026</h1>
      <div class="page-subtitle animate-fade-in" style="color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5;">
        Explorá el cuadro completo. Pasá el mouse sobre cada partido para ver quién se enfrenta.<br>
        <div style="font-size: 0.85rem; color: var(--color-mixon-light); margin-top: 0.8rem; line-height: 1.4;">
          💡 <strong>Navegación:</strong> Hacé clic en cualquier bandera o selección dentro de las tablas de posiciones de grupos para ver su fixture completo, historial y estadísticas.
        </div>
      </div>
      
      <h2 class="section-title animate-fade-in">📋 Fase de Grupos</h2>
      <p class="section-desc animate-fade-in">Los 2 primeros de cada grupo clasifican directo. Los 8 mejores terceros también avanzan.</p>
      <div class="groups-grid animate-fade-in">
        ${groups}
      </div>

      <h2 class="section-title animate-fade-in" style="margin-top: 3rem;">🏆 Cuadro Eliminatorio</h2>
      <p class="section-desc animate-fade-in">Hacé hover en cada partido para ver cómo se arman las llaves.</p>
      
      <div class="bracket-container animate-fade-in">
        ${renderRound(bracketData.roundOf32, '32avos de Final', 'roundOf32')}
        ${renderRound(bracketData.roundOf16, 'Octavos de Final', 'roundOf16')}
        ${renderRound(bracketData.quarterFinals, 'Cuartos de Final', 'quarterFinals')}
        ${renderRound(bracketData.semiFinals, 'Semifinales', 'semiFinals')}
        
        <div class="bracket-round bracket-finals">
          <h3 class="bracket-round-label">Tercer Puesto</h3>
          <div class="bracket-round-matches">
            ${renderBracketSlot(bracketData.thirdPlace, 'final')}
          </div>
        </div>

        <div class="bracket-round bracket-finals">
          <h3 class="bracket-round-label">Final</h3>
          <div class="bracket-round-matches">
            ${renderBracketSlot(bracketData.final, 'final')}
          </div>
        </div>
      </div>
    </section>
  `;
}
