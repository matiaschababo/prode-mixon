import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { programs } from '../data/participants.js';
import { getResults, getDynamicUsers, updateUserRole, isMasterAdmin } from '../services/prodeStore.js';
import { calculateGroupStandings } from '../services/standings.js';
import { getResolvedMatches } from '../services/bracketResolver.js';
import { bracketData } from '../data/bracket.js';
import { auth } from '../services/firebase.js';

export function Admin() {
  const user = auth.currentUser;
  
  // Si no está logueado o no es master admin
  if (!user || !isMasterAdmin(user.email)) {
    return `
      <div class="admin-page animate-fade-in" style="max-width: 600px; margin: 4rem auto; text-align: center;">
        <div class="glass-card">
          <h1 style="margin-bottom: 1rem; color: #E21B3C;">Acceso Denegado</h1>
          <p style="color: var(--text-secondary);">Esta sección es exclusiva para los Master Admins de Mix On.</p>
          ${!user ? '<p style="margin-top: 1rem;">Iniciá sesión con tu cuenta de Google autorizada.</p>' : ''}
        </div>
      </div>
    `;
  }

  const results = getResults();
  const users = getDynamicUsers();
  
  const standings = calculateGroupStandings(results);
  const resolvedMatches = getResolvedMatches(matches, standings, results, bracketData);

  const matchOptions = resolvedMatches.map(match => {
    const home = teams[match.homeTeam] || { name: match.homeTeam };
    const away = teams[match.awayTeam] || { name: match.awayTeam };
    return `<option value="${match.id}">${match.id}. ${home.name} vs ${away.name} - ${match.round}</option>`;
  }).join('');

  const firstMatch = resolvedMatches[0];
  const firstResult = results[String(firstMatch.id)] || {};

  const programOptions = `
    <option value="viewers">Viewers (Espectador)</option>
    <option value="MIXON">Equipo Mix On (Staff)</option>
    ${Object.values(programs).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
  `;

  const userRows = users.map(u => `
    <div class="glass-card" style="margin-bottom: 1rem; padding: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${u.photo}" class="avatar" alt="${String(u.name || '').replace(/"/g, '&quot;')}">
        <div>
          <strong style="display:block;">${u.name}</strong>
          <small style="color:var(--text-secondary);">${u.email}</small>
          <div style="font-size: 0.7rem; color: #ff9800;">UID: ${u.id}</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <select class="user-role-input" data-uid="${u.id}" style="padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
          <option value="Conductor" ${u.role === 'Conductor' ? 'selected' : ''}>Conductor</option>
          <option value="Productor" ${u.role === 'Productor' ? 'selected' : ''}>Productor</option>
          <option value="Operador" ${u.role === 'Operador' ? 'selected' : ''}>Operador</option>
          <option value="Editor/a" ${u.role === 'Editor/a' ? 'selected' : ''}>Editor/a</option>
          <option value="Viewer" ${['Conductor', 'Productor', 'Operador', 'Editor/a'].includes(u.role) ? '' : 'selected'}>Viewer</option>
        </select>
        
        <select class="user-program-input" data-uid="${u.id}" style="padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
          ${programOptions.replace(`value="${u.program?.split(',')[0]?.trim() || u.program}"`, `value="${u.program?.split(',')[0]?.trim() || u.program}" selected`)}
        </select>

        <select class="user-program2-input" data-uid="${u.id}" style="padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: rgba(255,255,255,0.5);">
          <option value="">(Sin Prog. 2)</option>
          ${programOptions.replace(`value="${u.program?.split(',')[1]?.trim() || ''}"`, `value="${u.program?.split(',')[1]?.trim() || ''}" selected`)}
        </select>

        <button class="btn btn-secondary btn-sm save-user-role" data-uid="${u.id}">Guardar</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="admin-page animate-fade-in" style="max-width: 980px; margin: 0 auto;">
      <h1 style="margin-bottom: 2rem; text-align: center;">Panel de Administración</h1>
      
      <div id="admin-dashboard">
        <div class="admin-note" style="margin-bottom: 2rem;">
          Autenticado como Master Admin: <strong>${user.email}</strong>
        </div>

        <div class="glass-card admin-editor" style="margin-bottom: 2rem;">
          <h2 style="margin-bottom: 1rem;">Carga de Resultados Oficiales</h2>
          <label class="admin-label" for="admin-match-select">Partido</label>
          <select id="admin-match-select" class="admin-select">
            ${matchOptions}
          </select>

          <div class="admin-result-box" style="margin-top: 1rem;">
            <div>
              <h3>Resultado real</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">Esto calcula los puntajes de todo el ranking automáticamente.</p>
            </div>
            <div class="score-inputs">
              <input type="number" min="0" id="result-home" value="${firstResult.home ?? '0'}" aria-label="Resultado local">
              <span>-</span>
              <input type="number" min="0" id="result-away" value="${firstResult.away ?? '0'}" aria-label="Resultado visitante">
            </div>
            <div id="admin-knockout-winner-container" style="margin-top: 1rem; display: none;"></div>
            <button class="btn btn-primary" id="save-result" style="width: 100%; margin-top: 1rem;">Guardar resultado</button>
          </div>
        </div>

        <div class="admin-users-manager">
          <h2 style="margin-bottom: 1rem;">Gestión de Roles (Staff)</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Acá aparecen todas las personas que iniciaron sesión en la app. Podés ascenderlos a Conductores, Productores, etc. y asignarlos a un programa de Mix On.</p>
          <div id="admin-users-list">
            ${userRows || '<p>Nadie inició sesión todavía.</p>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachAdminEvents() {
  const matchSelect = document.getElementById('admin-match-select');
  if (matchSelect && !matchSelect.dataset.eventsAttached) {
    matchSelect.dataset.eventsAttached = 'true';
    matchSelect.addEventListener('change', renderAdminMatchForm);
    renderAdminMatchForm(); // Populate on initial load
  }
  
  const saveResultBtn = document.getElementById('save-result');
  if (saveResultBtn && !saveResultBtn.dataset.eventsAttached) {
    saveResultBtn.dataset.eventsAttached = 'true';
    saveResultBtn.addEventListener('click', async () => {
      const matchId = document.getElementById('admin-match-select').value;
      const { saveResult } = await import('../services/prodeStore.js');
      const homeScore = document.getElementById('result-home').value;
      const awayScore = document.getElementById('result-away').value;
      const winnerSelect = document.getElementById('result-winner');
      const winner = winnerSelect ? winnerSelect.value : null;
      try {
        await saveResult(matchId, homeScore, awayScore, winner);
        alert('Resultado oficial guardado en Firebase');
      } catch (e) {
        alert('Error guardando resultado: ' + e.message);
      }
    });
  }

  document.querySelectorAll('.save-user-role').forEach(btn => {
    if (btn.dataset.eventsAttached) return;
    btn.dataset.eventsAttached = 'true';
    btn.addEventListener('click', async (e) => {
      const uid = e.target.dataset.uid;
      const role = document.querySelector(`.user-role-input[data-uid="${uid}"]`).value;
      const program1 = document.querySelector(`.user-program-input[data-uid="${uid}"]`).value;
      const program2 = document.querySelector(`.user-program2-input[data-uid="${uid}"]`).value;
      
      const program = program2 ? `${program1}, ${program2}` : program1;

      try {
        await updateUserRole(uid, program, role);
        e.target.innerText = '✅ Guardado';
        setTimeout(() => e.target.innerText = 'Guardar', 2000);
      } catch (err) {
        alert("Error al actualizar usuario: " + err.message);
      }
    });
  });
}

function renderAdminMatchForm() {
  const matchId = document.getElementById('admin-match-select')?.value || String(matches[0].id);
  const results = getResults();
  const result = results[String(matchId)] || {};

  const resultHome = document.getElementById('result-home');
  const resultAway = document.getElementById('result-away');
  if (resultHome) resultHome.value = result.home ?? '';
  if (resultAway) resultAway.value = result.away ?? '';

  const match = matches.find(m => String(m.id) === String(matchId));
  const winnerContainer = document.getElementById('admin-knockout-winner-container');
  if (match && match.stage !== 'Group Stage' && winnerContainer) {
    winnerContainer.style.display = 'block';
    const homeName = teams[match.homeTeam]?.name || match.homeTeam;
    const awayName = teams[match.awayTeam]?.name || match.awayTeam;
    winnerContainer.innerHTML = `
      <label class="admin-label" for="result-winner" style="margin-top: 0.5rem; display: block; font-weight: 600;">Ganador del cruce (por penales/alargue si hay empate)</label>
      <select id="result-winner" class="admin-select" style="margin-top: 0.25rem; width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
        <option value="" ${!result.winner ? 'selected' : ''}>— Elegir ganador —</option>
        <option value="${match.homeTeam}" ${result.winner === match.homeTeam ? 'selected' : ''}>Gana ${homeName}</option>
        <option value="${match.awayTeam}" ${result.winner === match.awayTeam ? 'selected' : ''}>Gana ${awayName}</option>
      </select>
    `;
  } else if (winnerContainer) {
    winnerContainer.style.display = 'none';
    winnerContainer.innerHTML = '';
  }
}
