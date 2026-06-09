// src/main.js
import './styles/index.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/animations.css';

import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { Fixture } from './pages/Fixture.js';
import { Programas } from './pages/Programas.js';
import { Predicciones } from './pages/Predicciones.js';
import { Admin } from './pages/Admin.js';
import { Puntajes } from './pages/Puntajes.js';
import { Perfil } from './pages/Perfil.js';
import { matches } from './data/matches.js';
import { participants } from './data/participants.js';
import { getPredictions, getResults, savePrediction, saveResult, exportLocalData, importLocalData } from './services/prodeStore.js';
import { loadSharedState, saveSharedState } from './services/sharedState.js';

const app = document.getElementById('app');

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/programas': Programas,
  '/puntajes': Puntajes,
  '/admin': Admin
};

function router() {
  const path = window.location.pathname;
  
  // Basic layout: Navbar + Main Content container
  app.innerHTML = `
    ${Navbar()}
    <main class="main-content container">
      ${renderPage(path)}
    </main>
  `;

  attachPageEvents(path);

}

function renderPage(path) {
  // Handle dynamic routes like /predicciones/:id
  if (path.startsWith('/predicciones/')) {
    const matchId = path.split('/')[2];
    return Predicciones(matchId);
  }

  if (path.startsWith('/programas/')) {
    const programId = path.split('/')[2];
    return Programas(programId);
  }

  if (path.startsWith('/perfil/')) {
    const participantId = path.split('/')[2];
    return Perfil(participantId);
  }
  
  const page = routes[path];
  return page ? page() : `<h2>404 - Página no encontrada</h2>`;
}

function attachPageEvents(path) {
  if (path === '/admin') attachAdminEvents();
  if (path === '/fixture') attachFixtureFilters();
}

function attachFixtureFilters() {
  const buttons = document.querySelectorAll('.fixture-filter');
  const cards = document.querySelectorAll('.match-card');
  const empty = document.getElementById('fixture-empty');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;

      buttons.forEach(btn => {
        btn.classList.toggle('btn-primary', btn === button);
        btn.classList.toggle('btn-secondary', btn !== button);
      });

      cards.forEach(card => {
        const stage = card.dataset.stage;
        const isArgentina = card.dataset.home === 'ARG' || card.dataset.away === 'ARG';
        const shouldShow =
          filter === 'all' ||
          (filter === 'groups' && stage === 'Group Stage') ||
          (filter === 'knockout' && stage !== 'Group Stage') ||
          (filter === 'argentina' && isArgentina);

        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount += 1;
      });

      empty.style.display = visibleCount ? 'none' : 'block';
    });
  });
}

function attachAdminEvents() {
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
      sessionStorage.setItem('prode-admin-password', passInput.value);
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
    saveResult(matchId, document.getElementById('result-home').value, document.getElementById('result-away').value);
    await persistAdminState('Resultado guardado en la base compartida');
  });
  document.getElementById('save-predictions')?.addEventListener('click', saveAdminPredictions);
  document.getElementById('export-data')?.addEventListener('click', () => {
    document.getElementById('export-output').value = JSON.stringify(exportLocalData(), null, 2);
  });
  document.getElementById('import-data')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    importLocalData(await file.text());
    renderAdminMatchForm();
    await persistAdminState('Datos importados y guardados en la base compartida');
  });
}

function renderAdminMatchForm() {
  const matchId = document.getElementById('admin-match-select')?.value || String(matches[0].id);
  const predictions = getPredictions()[String(matchId)] || {};
  const result = getResults()[String(matchId)] || {};

  const resultHome = document.getElementById('result-home');
  const resultAway = document.getElementById('result-away');
  if (resultHome) resultHome.value = result.home ?? '';
  if (resultAway) resultAway.value = result.away ?? '';

  const list = document.getElementById('admin-predictions-list');
  if (!list) return;

  list.innerHTML = participants.map(participant => {
    const prediction = predictions[participant.id] || {};
    return `
      <div class="admin-prediction-row" data-participant="${participant.id}">
        <div class="admin-person">
          <img src="${participant.photo}" class="avatar" alt="${participant.name}">
          <div>
            <strong>${participant.name}</strong>
            <small>${participant.programId}</small>
          </div>
        </div>
        <div class="score-inputs">
          <input type="number" min="0" class="prediction-home" value="${prediction.home ?? ''}" aria-label="${participant.name} goles local">
          <span>-</span>
          <input type="number" min="0" class="prediction-away" value="${prediction.away ?? ''}" aria-label="${participant.name} goles visitante">
        </div>
      </div>
    `;
  }).join('');
}

async function saveAdminPredictions() {
  const matchId = document.getElementById('admin-match-select').value;
  document.querySelectorAll('.admin-prediction-row').forEach(row => {
    savePrediction(
      matchId,
      row.dataset.participant,
      row.querySelector('.prediction-home').value,
      row.querySelector('.prediction-away').value
    );
  });
  await persistAdminState('Predicciones guardadas en la base compartida');
}

async function persistAdminState(message) {
  try {
    await saveSharedState(sessionStorage.getItem('prode-admin-password') || 'mixon2026', exportLocalData());
    alert(message);
    router();
  } catch (error) {
    alert(error.message);
  }
}

// Intercept link clicks for SPA routing
document.body.addEventListener('click', e => {
  if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
    e.preventDefault();
    const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
    history.pushState(null, null, link.href);
    router();
  }
});

// Handle back/forward buttons
window.addEventListener('popstate', router);

// Initial render
loadSharedState()
  .catch(error => console.warn(error))
  .finally(router);
