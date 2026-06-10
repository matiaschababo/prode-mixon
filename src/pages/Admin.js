import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { getResults, getDynamicUsers, updateUserRole } from '../services/prodeStore.js';

export function Admin() {
  const results = getResults();
  const users = getDynamicUsers();

  const matchOptions = matches.map(match => {
    const home = teams[match.homeTeam] || { name: match.homeTeam };
    const away = teams[match.awayTeam] || { name: match.awayTeam };
    return `<option value="${match.id}">${match.id}. ${home.name} vs ${away.name} - ${match.round}</option>`;
  }).join('');

  const firstMatch = matches[0];
  const firstResult = results[String(firstMatch.id)] || {};

  const programOptions = `
    <option value="viewers">Viewers (Espectador)</option>
    <option value="aqn">Antes que Nadie</option>
    <option value="updr">Un Poco de Ruido</option>
    <option value="tkm">Tarde de Tertulia</option>
    <option value="ndn">Nadie Dice Nada</option>
    <option value="efqf">El Fin de la Metáfora</option>
    <option value="luzu">Luzu TV Staff</option>
  `;

  const userRows = users.map(user => `
    <div class="glass-card" style="margin-bottom: 1rem; padding: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${user.photo}" class="avatar" alt="${user.name}">
        <div>
          <strong style="display:block;">${user.name}</strong>
          <small style="color:var(--text-secondary);">${user.email}</small>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="user-role-input" data-uid="${user.id}" value="${user.role}" placeholder="Rol (ej. Conductor)" style="padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
        <select class="user-program-input" data-uid="${user.id}" style="padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3); color: white;">
          ${programOptions.replace(`value="${user.program}"`, `value="${user.program}" selected`)}
        </select>
        <button class="btn btn-secondary btn-sm save-user-role" data-uid="${user.id}">Guardar</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="admin-page animate-fade-in" style="max-width: 980px; margin: 0 auto;">
      <h1 style="margin-bottom: 2rem; text-align: center;">Panel de Administración</h1>
      
      <div class="glass-card" id="login-section">
        <h3 style="margin-bottom: 1rem;">Acceso Restringido</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Ingresá la contraseña para administrar el Prode.</p>
        
        <div style="display: flex; gap: 1rem;">
          <input type="password" id="admin-pass" placeholder="Contraseña" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: white;">
          <button class="btn btn-primary" id="btn-login">Ingresar</button>
        </div>
      </div>

      <div id="admin-dashboard" style="display: none; margin-top: 2rem;">
        <div class="admin-note" style="margin-bottom: 2rem;">
          Contraseña actual: <strong>mixon2026</strong>
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
              <input type="number" min="0" id="result-home" value="${firstResult.home ?? ''}" aria-label="Resultado local">
              <span>-</span>
              <input type="number" min="0" id="result-away" value="${firstResult.away ?? ''}" aria-label="Resultado visitante">
            </div>
            <button class="btn btn-primary" id="save-result" style="width: 100%; margin-top: 1rem;">Guardar resultado</button>
          </div>
        </div>

        <div class="admin-users-manager">
          <h2 style="margin-bottom: 1rem;">Gestión de Roles (Staff)</h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Acá aparecen todas las personas que iniciaron sesión. Podés ascenderlos a Conductores, Productores, etc. y asignarlos a un programa.</p>
          <div id="admin-users-list">
            ${userRows || '<p>Nadie inició sesión todavía.</p>'}
          </div>
        </div>

      </div>
    </div>
  `;
}

export function attachAdminEvents() {
  const btnLogin = document.getElementById('btn-login');
  const passInput = document.getElementById('admin-pass');

  const openDashboard = () => {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    renderAdminMatchForm();
  };

  btnLogin?.addEventListener('click', () => {
    if (passInput.value === 'mixon2026') {
      sessionStorage.setItem('prode-admin-auth', '1');
      openDashboard();
    } else {
      alert('Contraseña incorrecta');
    }
  });

  passInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') btnLogin.click();
  });

  if (sessionStorage.getItem('prode-admin-auth') === '1') openDashboard();

  document.getElementById('admin-match-select')?.addEventListener('change', renderAdminMatchForm);
  
  document.getElementById('save-result')?.addEventListener('click', async () => {
    const matchId = document.getElementById('admin-match-select').value;
    const { saveResult } = await import('../services/prodeStore.js');
    try {
      await saveResult(matchId, document.getElementById('result-home').value, document.getElementById('result-away').value);
      alert('Resultado oficial guardado en Firebase');
    } catch (e) {
      alert('Error guardando resultado: ' + e.message);
    }
  });

  document.querySelectorAll('.save-user-role').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const uid = e.target.dataset.uid;
      const role = document.querySelector(`.user-role-input[data-uid="${uid}"]`).value;
      const program = document.querySelector(`.user-program-input[data-uid="${uid}"]`).value;
      
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
}
