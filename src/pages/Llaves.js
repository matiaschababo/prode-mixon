import { teams } from '../data/teams.js';
import { bracketData, groupsList } from '../data/bracket.js';
import { calculateGroupStandings, getProvisionalBracket } from '../services/standings.js';
import { getTopScorersAndAssists } from '../services/stats.js';

function renderGroupMini(group, standings) {
  const groupTeams = standings[group] || [];
  const isFinished = groupTeams.length > 0 && groupTeams.every(t => t.played === 3);
  
  const rows = groupTeams.map((team, i) => {
    // Top 2 classify directly. 3rd might classify. 
    // We visually highlight top 2 always. We could highlight 3rd if they are among best 8, but we will leave them yellow.
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
    <div class="glass-card group-mini animate-slide-up" style="position: relative;">
      ${isFinished ? '<div class="group-status-badge definitivo">Terminado</div>' : '<div class="group-status-badge parcial">En Juego</div>'}
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

function renderProvisionalSlot(slotData, round) {
  // Support both fully provisional and static bracket slots
  // For round of 32 we use the parsed provisional data
  // For other rounds, we just show "Ganador Partido X"
  
  let homeTeamNode = '';
  let awayTeamNode = '';
  let homeLabel = slotData.home;
  let awayLabel = slotData.away;
  let isProvisional = true;

  if (slotData.homeResolved || slotData.awayResolved) {
    // This is from getProvisionalBracket
    isProvisional = slotData.homeResolved?.isProvisional || slotData.awayResolved?.isProvisional;
    
    if (slotData.homeResolved?.team) {
      homeTeamNode = `
        <img src="${slotData.homeResolved.team.flagUrl}" class="bracket-flag" onerror="this.style.display='none'">
        <span class="bracket-team-name">${slotData.homeResolved.team.name}</span>
      `;
    } else {
      homeTeamNode = `<span class="bracket-team-label">${slotData.homeResolved?.originalLabel || homeLabel}</span>`;
    }

    if (slotData.awayResolved?.team) {
      awayTeamNode = `
        <img src="${slotData.awayResolved.team.flagUrl}" class="bracket-flag" onerror="this.style.display='none'">
        <span class="bracket-team-name">${slotData.awayResolved.team.name}</span>
      `;
    } else {
      awayTeamNode = `<span class="bracket-team-label">${slotData.awayResolved?.originalLabel || awayLabel}</span>`;
    }
  } else {
    // Static slot
    homeTeamNode = `<span class="bracket-team-label">${expandLabel(homeLabel)}</span>`;
    awayTeamNode = `<span class="bracket-team-label">${expandLabel(awayLabel)}</span>`;
  }

  const badgeHtml = round === 'roundOf32' ? (isProvisional 
    ? '<div class="bracket-match-badge parcial" title="Cruce sujeto a cambios">Parcial</div>' 
    : '<div class="bracket-match-badge definitivo" title="Cruce confirmado">Definitivo</div>') : '';

  return `
    <div class="bracket-match-card glass-card" data-match="${slotData.matchId}">
      ${badgeHtml}
      <div class="bracket-match-header">Partido ${slotData.matchId}</div>
      <div class="bracket-team-row">
        ${homeTeamNode}
      </div>
      <div class="bracket-match-vs">vs</div>
      <div class="bracket-team-row">
        ${awayTeamNode}
      </div>
    </div>
  `;
}

function expandLabel(label) {
  if (!label) return '';
  return label
    .replace(/^1° Grupo (\w)$/, 'El primero del Grupo $1')
    .replace(/^2° Grupo (\w)$/, 'El segundo del Grupo $1')
    .replace(/^3° Grupo ([A-Z\\/]+)$/, 'Mejor tercero $1')
    .replace(/^G\\. M(\\d+)$/, 'Ganador M$1')
    .replace(/^P\\. SF(\\d)$/, 'Perdedor SF$1')
    .replace(/^G\\. SF(\\d)$/, 'Ganador SF$1');
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
  
  const provisionalRoundOf32 = getProvisionalBracket(standings, bracketData);

  const renderRound = (matches, title, round) => {
    const slots = matches.map(s => renderProvisionalSlot(s, round)).join('');
    return `
      <div class="bracket-round-col">
        <h3 class="bracket-round-title">${title}</h3>
        <div class="bracket-round-slots">
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
          Tablas, llaves provisionales y estadísticas.
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
          <p class="section-desc animate-fade-in">Posiciones actualizadas al instante. Los 2 primeros de cada grupo clasifican directo. Los 8 mejores terceros también avanzan.</p>
          <div class="groups-grid animate-fade-in" style="margin-bottom: 4rem;">
            ${groups}
          </div>

          <h2 class="section-title animate-fade-in">🏆 Cuadro Eliminatorio (En Vivo)</h2>
          <p class="section-desc animate-fade-in">Así estarían los cruces si la fase de grupos terminara hoy.</p>
          
          <div class="bracket-tree-wrapper animate-fade-in">
            <div class="bracket-tree-container">
              ${renderRound(provisionalRoundOf32, '32avos de Final', 'roundOf32')}
              ${renderRound(bracketData.roundOf16, 'Octavos de Final', 'roundOf16')}
              ${renderRound(bracketData.quarterFinals, 'Cuartos de Final', 'quarterFinals')}
              ${renderRound(bracketData.semiFinals, 'Semifinales', 'semiFinals')}
              <div class="bracket-round-col">
                <h3 class="bracket-round-title">Finales</h3>
                <div class="bracket-round-slots finals-slots">
                  ${renderProvisionalSlot(bracketData.thirdPlace, 'thirdPlace')}
                  ${renderProvisionalSlot(bracketData.final, 'final')}
                </div>
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
