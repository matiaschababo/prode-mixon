import { teams } from '../data/teams.js';
import { bracketData, groupsList } from '../data/bracket.js';
import { calculateGroupStandings, getProvisionalBracket, getThirdPlacedStandings } from '../services/standings.js';
import { getTopScorersAndAssists } from '../services/stats.js';
import { getResults } from '../services/prodeStore.js';

function renderGroupMini(group, standings) {
  const groupTeams = standings[group] || [];
  const isFinished = groupTeams.length > 0 && groupTeams.every(t => t.played === 3);
  
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

function expandLabel(label) {
  if (!label) return '';
  return label
    .replace(/^1° Grupo (\w)$/, '1° del Grupo $1')
    .replace(/^2° Grupo (\w)$/, '2° del Grupo $1')
    .replace(/^3° Grupo ([A-Z\\/]+)$/, '3° Grupo $1')
    .replace(/^G\\. M(\\d+)$/, 'Ganador M$1')
    .replace(/^P\\. SF(\\d)$/, 'Perdedor SF$1')
    .replace(/^G\\. SF(\\d)$/, 'Ganador SF$1');
}

const resolveSource = (sourceLabel, resolvedMap, results) => {
  if (!sourceLabel) return { team: null, label: '', isProvisional: true };
  
  let matchId = null;
  let isWinner = true;
  
  const mWinner = sourceLabel.match(/^G\. M(\d+)$/);
  const mWinnerSF = sourceLabel.match(/^G\. SF(\d)$/);
  const mLoserSF = sourceLabel.match(/^P\. SF(\d)$/);

  if (mWinner) {
    matchId = parseInt(mWinner[1]);
  } else if (mWinnerSF) {
    matchId = mWinnerSF[1] === '1' ? 101 : 102;
  } else if (mLoserSF) {
    matchId = mLoserSF[1] === '1' ? 101 : 102;
    isWinner = false;
  }

  if (!matchId) {
    return { team: null, label: sourceLabel, isProvisional: true };
  }

  const prevMatch = resolvedMap[matchId];
  if (!prevMatch) {
    return { team: null, label: sourceLabel, isProvisional: true };
  }

  const res = results[String(matchId)];
  if (res && res.home !== null && res.away !== null) {
    const hG = parseInt(res.home, 10);
    const aG = parseInt(res.away, 10);
    let winner = null;
    let loser = null;

    if (hG > aG) {
      winner = prevMatch.home;
      loser = prevMatch.away;
    } else if (aG > hG) {
      winner = prevMatch.away;
      loser = prevMatch.home;
    } else {
      if (res.winner === prevMatch.home?.id) {
        winner = prevMatch.home;
        loser = prevMatch.away;
      } else if (res.winner === prevMatch.away?.id) {
        winner = prevMatch.away;
        loser = prevMatch.home;
      } else {
        winner = prevMatch.home;
        loser = prevMatch.away;
      }
    }

    const team = isWinner ? winner : loser;
    const isProvisional = prevMatch.homeProvisional || prevMatch.awayProvisional || (hG === aG && !res.winner);
    return { team, label: team ? team.name : sourceLabel, isProvisional };
  } else {
    const candidates = [];
    if (prevMatch.home) candidates.push(prevMatch.home);
    if (prevMatch.away) candidates.push(prevMatch.away);

    return { 
      team: null, 
      label: sourceLabel, 
      isProvisional: true, 
      candidates: candidates.length === 2 ? candidates : null 
    };
  }
};

function renderBracketSlot(matchId, resolvedMap, results) {
  const slot = resolvedMap[matchId];
  if (!slot) return '';

  const res = results[String(matchId)];
  const hasResult = res && res.home !== null && res.away !== null;
  
  const renderTeamRow = (team, label, isProvisional, candidates, score, isWinnerTeam) => {
    let content = '';
    let rowClass = 'bracket-team-row';
    if (isProvisional) rowClass += ' provisional';
    if (isWinnerTeam) rowClass += ' winner-highlight';

    if (team) {
      content = `
        <img src="${team.flagUrl}" class="bracket-flag" onerror="this.style.display='none'">
        <span class="bracket-team-name">${team.name}</span>
        ${score !== undefined && score !== null ? `<span class="bracket-team-score">${score}</span>` : ''}
      `;
    } else if (candidates && candidates.length === 2) {
      content = `
        <div class="candidate-flags">
          <img src="${candidates[0].flagUrl}" class="bracket-flag mini-flag" title="${candidates[0].name}">
          <span class="candidate-slash">/</span>
          <img src="${candidates[1].flagUrl}" class="bracket-flag mini-flag" title="${candidates[1].name}">
        </div>
        <span class="bracket-team-name candidate-label">${candidates[0].codeEsp || candidates[0].id}/${candidates[1].codeEsp || candidates[1].id}</span>
        <span class="bracket-team-score empty-score">?</span>
      `;
    } else {
      content = `
        <span class="bracket-team-label">${expandLabel(label)}</span>
        <span class="bracket-team-score empty-score">-</span>
      `;
    }

    return `<div class="${rowClass}">${content}</div>`;
  };

  let homeWinner = false;
  let awayWinner = false;
  if (hasResult) {
    const hG = parseInt(res.home, 10);
    const aG = parseInt(res.away, 10);
    if (hG > aG) homeWinner = true;
    else if (aG > hG) awayWinner = true;
    else {
      if (res.winner === slot.home?.id) homeWinner = true;
      else if (res.winner === slot.away?.id) awayWinner = true;
    }
  }

  let badgeHtml = '';
  if (hasResult) {
    const isProvisional = slot.homeProvisional || slot.awayProvisional || (parseInt(res.home) === parseInt(res.away) && !res.winner);
    if (isProvisional) {
      badgeHtml = '<span class="bracket-match-status parcial" title="Resultado parcial">Parcial</span>';
    } else {
      badgeHtml = '<span class="bracket-match-status definitivo" title="Partido concluido">Definitivo</span>';
    }
  }

  return `
    <div class="bracket-match-card glass-card" data-match="${matchId}">
      <div class="bracket-match-header">
        <span>Partido ${matchId}</span>
        ${badgeHtml}
      </div>
      <div class="bracket-match-teams">
        ${renderTeamRow(slot.home, slot.homeLabel, slot.homeProvisional, slot.homeCandidates, res?.home, homeWinner)}
        ${renderTeamRow(slot.away, slot.awayLabel, slot.awayProvisional, slot.awayCandidates, res?.away, awayWinner)}
      </div>
    </div>
  `;
}

function renderThirdsTable(thirds) {
  const rows = thirds.map((team, index) => {
    const isQualified = index < 8;
    const rowClass = isQualified ? 'third-qualified' : 'third-eliminated';
    const goalDiffStr = team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff;
    
    return `
      <tr class="${rowClass}" onclick="window.router.navigate('/equipo/${team.id}')" style="cursor: pointer;">
        <td class="third-pos">${index + 1}</td>
        <td class="third-team">
          <img src="${team.flagUrl}" alt="${String(team.name).replace(/"/g, '&quot;')}" class="third-flag" onerror="this.style.display='none'">
          <span class="third-name">${team.name}</span>
          <span class="third-group-badge">Grupo ${team.group}</span>
        </td>
        <td>${team.played}</td>
        <td>${team.won}</td>
        <td>${team.drawn}</td>
        <td>${team.lost}</td>
        <td class="third-goals">${team.goalsFor}:${team.goalsAgainst}</td>
        <td class="third-diff">${goalDiffStr}</td>
        <td class="third-pts">${team.points}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="glass-card thirds-standings-card animate-slide-up" style="margin-bottom: 4rem;">
      <div class="thirds-header-container">
        <h3 class="thirds-title">📊 Tabla de Mejores Terceros</h3>
        <p class="thirds-desc">Comparativa de los 3° lugares de cada grupo. Avanzan los <strong>8 mejores</strong> a los 16avos de final.</p>
      </div>
      <div class="table-responsive">
        <table class="thirds-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>Goles</th>
              <th>DIF</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <div class="thirds-footer">
        <span class="indicator-dot dot-qualified"></span> Clasifica a Siguiente Ronda
        <span class="indicator-dot dot-eliminated" style="margin-left: 1.5rem;"></span> Eliminado
      </div>
    </div>
  `;
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
  const results = getResults();
  
  const provisionalRoundOf32 = getProvisionalBracket(standings, bracketData);
  const thirds = getThirdPlacedStandings(standings);
  const groups = groupsList.map(g => renderGroupMini(g, standings)).join('');

  // Resolve the entire bracket tree dynamically
  const resolved = {};
  
  // R32
  provisionalRoundOf32.forEach(slot => {
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: slot.homeResolved?.team || null,
      away: slot.awayResolved?.team || null,
      homeLabel: slot.homeResolved?.team ? null : (slot.homeResolved?.originalLabel || slot.home),
      awayLabel: slot.awayResolved?.team ? null : (slot.awayResolved?.originalLabel || slot.away),
      homeProvisional: slot.homeResolved?.isProvisional ?? true,
      awayProvisional: slot.awayResolved?.isProvisional ?? true,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // R16
  bracketData.roundOf16.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // QF
  bracketData.quarterFinals.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // SF
  bracketData.semiFinals.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      side: slot.side
    };
  });

  // Third Place
  const tpSlot = bracketData.thirdPlace;
  const tpHomeRes = resolveSource(tpSlot.home, resolved, results);
  const tpAwayRes = resolveSource(tpSlot.away, resolved, results);
  resolved[tpSlot.matchId] = {
    matchId: tpSlot.matchId,
    home: tpHomeRes.team,
    away: tpAwayRes.team,
    homeLabel: tpHomeRes.team ? null : tpHomeRes.label,
    awayLabel: tpAwayRes.team ? null : tpAwayRes.label,
    homeProvisional: tpHomeRes.isProvisional,
    awayProvisional: tpAwayRes.isProvisional,
    homeCandidates: tpHomeRes.candidates,
    awayCandidates: tpAwayRes.candidates
  };

  // Final
  const fSlot = bracketData.final;
  const fHomeRes = resolveSource(fSlot.home, resolved, results);
  const fAwayRes = resolveSource(fSlot.away, resolved, results);
  resolved[fSlot.matchId] = {
    matchId: fSlot.matchId,
    home: fHomeRes.team,
    away: fAwayRes.team,
    homeLabel: fHomeRes.team ? null : fHomeRes.label,
    awayLabel: fAwayRes.team ? null : fAwayRes.label,
    homeProvisional: fHomeRes.isProvisional,
    awayProvisional: fAwayRes.isProvisional,
    homeCandidates: fHomeRes.candidates,
    awayCandidates: fAwayRes.candidates
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
          Tablas, llaves en vivo y estadísticas oficiales.
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
        <!-- TAB 1: LLAVES, TERCEROS Y GRUPOS -->
        <div role="tabpanel" id="panel-grupos" class="tab-panel active" aria-labelledby="tab-grupos">
          
          <!-- LLAVES SIMÉTRICAS ARRIBA DE TODO -->
          <h2 class="section-title animate-fade-in">🏆 Cuadro Eliminatorio (En Vivo)</h2>
          <p class="section-desc animate-fade-in">Seguí los cruces en tiempo real. Se muestran candidatos posibles si el rival está por definirse.</p>
          
          <div class="bracket-scroll-container animate-fade-in">
            <div class="symmetrical-bracket">
              
              <!-- LADO IZQUIERDO (SIDE A) -->
              <div class="bracket-side bracket-left">
                <div class="bracket-column r32-column">
                  <h4 class="bracket-round-title">16avos</h4>
                  <div class="bracket-round-slots">
                    ${[74, 77, 73, 75, 83, 84, 81, 82].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
                <div class="bracket-column r16-column">
                  <h4 class="bracket-round-title">Octavos</h4>
                  <div class="bracket-round-slots">
                    ${[89, 90, 93, 94].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
                <div class="bracket-column qf-column">
                  <h4 class="bracket-round-title">Cuartos</h4>
                  <div class="bracket-round-slots">
                    ${[97, 98].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
              </div>

              <!-- COLUMNA CENTRAL: SEMIFINALES, COPA Y FINAL -->
              <div class="bracket-center">
                <!-- Semifinales -->
                <div class="bracket-center-semis">
                  <div class="semi-slot sf-left">
                    <h5 class="center-sub-title">Semifinal A</h5>
                    ${renderBracketSlot(101, resolved, results)}
                  </div>
                  <div class="semi-slot sf-right">
                    <h5 class="center-sub-title">Semifinal B</h5>
                    ${renderBracketSlot(102, resolved, results)}
                  </div>
                </div>

                <!-- Centro: Trofeo y Gran Final -->
                <div class="bracket-center-core">
                  <div class="trophy-holder">
                    <img src="/assets/world-cup-trophy.jpg" class="trophy-img animate-float" alt="Trofeo Mundial">
                  </div>
                  <div class="final-slot">
                    <h3 class="final-main-title">Gran Final</h3>
                    ${renderBracketSlot(104, resolved, results)}
                  </div>
                </div>

                <!-- Tercer Puesto -->
                <div class="third-place-slot">
                  <h4 class="third-place-main-title">Tercer Puesto</h4>
                  ${renderBracketSlot(103, resolved, results)}
                </div>
              </div>

              <!-- LADO DERECHO (SIDE B) -->
              <div class="bracket-side bracket-right">
                <div class="bracket-column qf-column">
                  <h4 class="bracket-round-title">Cuartos</h4>
                  <div class="bracket-round-slots">
                    ${[99, 100].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
                <div class="bracket-column r16-column">
                  <h4 class="bracket-round-title">Octavos</h4>
                  <div class="bracket-round-slots">
                    ${[91, 92, 95, 96].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
                <div class="bracket-column r32-column">
                  <h4 class="bracket-round-title">16avos</h4>
                  <div class="bracket-round-slots">
                    ${[76, 78, 79, 80, 86, 88, 85, 87].map(id => renderBracketSlot(id, resolved, results)).join('')}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- TABLA DE MEJORES TERCEROS EN EL MEDIO -->
          ${renderThirdsTable(thirds)}

          <!-- GRUPOS ABAJO DE TODO -->
          <h2 class="section-title animate-fade-in">📋 Fase de Grupos</h2>
          <p class="section-desc animate-fade-in">Posiciones completas de cada grupo. Clasifican los 2 mejores de cada grupo y los 8 mejores terceros.</p>
          <div class="groups-grid animate-fade-in">
            ${groups}
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
