// src/pages/Llaves.js
import { teams } from '../data/teams.js';
import { bracketData, groupsList } from '../data/bracket.js';
import { calculateGroupStandings } from '../services/standings.js';
import { getTopScorersAndAssists } from '../services/stats.js';

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
    .replace(/^3° Grupo ([A-Z\\/]+)$/, 'El mejor tercero de los Grupos $1')
    .replace(/^G\\. M(\\d+)$/, 'Ganador del Partido $1')
    .replace(/^P\\. SF(\\d)$/, 'Perdedor de Semifinal $1')
    .replace(/^G\\. SF(\\d)$/, 'Ganador de Semifinal $1');
}

export function attachLlavesEvents() {
  const tabGrupos = document.getElementById('tab-grupos');
  const tabStats = document.getElementById('tab-stats');
  const panelGrupos = document.getElementById('panel-grupos');
  const panelStats = document.getElementById('panel-stats');

  if (tabGrupos && tabStats) {
    if (tabGrupos.dataset.eventsAttached) return;
    tabGrupos.dataset.eventsAttached = 'true';

    tabGrupos.addEventListener('click', () => {
      tabGrupos.classList.add('active');
      tabStats.classList.remove('active');
      panelGrupos.classList.add('active');
      panelStats.classList.remove('active');
    });

    tabStats.addEventListener('click', () => {
      tabStats.classList.add('active');
      tabGrupos.classList.remove('active');
      panelStats.classList.add('active');
      panelGrupos.classList.remove('active');
    });
  }
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

  const { topScorers, topAssists } = getTopScorersAndAssists();

  const renderStatsList = (players, statName) => {
    if (players.length === 0) {
      return `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Los datos se actualizarán cuando comience el torneo.</p>`;
    }
    return players.map((p, index) => {
      let rankClass = 'rank-default';
      if (index === 0) rankClass = 'rank-1';
      else if (index === 1) rankClass = 'rank-2';
      else if (index === 2) rankClass = 'rank-3';

      const statValue = statName === 'goals' ? p.goals : p.assists;

      return `
        <li class="stats-item">
          <span class="rank ${rankClass}">${index + 1}</span>
          <img src="${p.flagUrl}" alt="${p.teamName}" class="player-avatar" loading="lazy" onerror="this.src='https://flagcdn.com/w40/un.png'" />
          <div class="player-info">
            <span class="player-name">${p.name}</span>
            <span class="player-team">${p.teamName}</span>
          </div>
          <span class="stat-value">${statValue}</span>
        </li>
      `;
    }).join('');
  };

  return `
    <section class="tournament-dashboard">
      <header class="dashboard-header animate-fade-in">
        <h1 class="page-title">Seguí el Mundial</h1>
        <div class="page-subtitle" style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5; text-align: center;">
          Tablas, llaves y estadísticas en un solo lugar.
        </div>
        
        <div class="glass-tabs-container">
          <div class="glass-tabs" role="tablist">
            <div class="tab-indicator"></div>
            <button role="tab" aria-selected="true" class="tab-btn active" id="tab-grupos" aria-controls="panel-grupos">
              Llaves y Grupos
            </button>
            <button role="tab" aria-selected="false" class="tab-btn" id="tab-stats" aria-controls="panel-stats">
              Estadísticas
            </button>
          </div>
        </div>
      </header>

      <div class="tab-content-area">
        <!-- TAB 1: GRUPOS Y LLAVES -->
        <div role="tabpanel" id="panel-grupos" class="tab-panel active" aria-labelledby="tab-grupos">
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
        </div>

        <!-- TAB 2: ESTADÍSTICAS -->
        <div role="tabpanel" id="panel-stats" class="tab-panel" aria-labelledby="tab-stats">
          <div class="stats-grid animate-fade-in">
            <div class="glass-card" style="padding: 1.5rem;">
              <h3 style="color: #fff; text-align: center; margin-bottom: 1rem; font-family: var(--font-display);">Goleadores</h3>
              <ul class="stats-list">
                ${renderStatsList(topScorers, 'goals')}
              </ul>
            </div>
            <div class="glass-card" style="padding: 1.5rem;">
              <h3 style="color: #fff; text-align: center; margin-bottom: 1rem; font-family: var(--font-display);">Asistencias</h3>
              <ul class="stats-list">
                ${renderStatsList(topAssists, 'assists')}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
