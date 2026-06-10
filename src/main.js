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
import { MisPredicciones, attachMisPrediccionesEvents } from './pages/MisPredicciones.js';
import { Admin } from './pages/Admin.js';
import { Puntajes } from './pages/Puntajes.js';
import { Perfil } from './pages/Perfil.js';
import { Llaves } from './pages/Llaves.js';
import { matches } from './data/matches.js';
import { getParticipantProgramLabel, participants } from './data/participants.js';
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists } from './services/prodeStore.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './services/firebase.js';

const app = document.getElementById('app');
let isInitialized = false;

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/llaves': Llaves,
  '/programas': Programas,
  '/puntajes': Puntajes,
  '/admin': Admin,
  '/mis-predicciones': MisPredicciones
};

function router() {
  const path = window.location.pathname;
  
  app.innerHTML = `
    ${Navbar()}
    <main class="main-content container">
      ${renderPage(path)}
    </main>
  `;

  attachPageEvents(path);
  updateNavbarAuthUI();
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
  if (path === '/mis-predicciones') attachMisPrediccionesEvents();
}

function attachFixtureFilters() {
  const buttons = document.querySelectorAll('.fixture-filter');
  const cards = document.querySelectorAll('.match-card');
  const days = document.querySelectorAll('.fixture-day');
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

      // Hide empty day containers
      days.forEach(day => {
        const visibleCards = day.querySelectorAll('.match-card:not([style*="display: none"])');
        day.style.display = visibleCards.length ? '' : 'none';
      });

      if (empty) empty.style.display = visibleCount ? 'none' : 'block';
    });
  });
}

function updateNavbarAuthUI() {
  const container = document.getElementById('auth-container');
  const myPredsLink = document.getElementById('nav-my-predictions');
  if (!container) return;

  const user = auth.currentUser;
  if (user) {
    if (myPredsLink) myPredsLink.style.display = 'inline-block';
    container.innerHTML = `
      <div class="user-profile">
        <img src="${user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid}" alt="Avatar" class="avatar-small">
        <span class="user-name">${user.displayName}</span>
        <button id="btn-logout" class="btn btn-secondary btn-small">Salir</button>
      </div>
    `;
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      signOut(auth).then(() => router());
    });
  } else {
    if (myPredsLink) myPredsLink.style.display = 'none';
    container.innerHTML = `
      <button id="btn-login-google" class="btn btn-primary btn-small">Ingresar con Google</button>
    `;
    document.getElementById('btn-login-google')?.addEventListener('click', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserExists(result.user);
        router();
      } catch (error) {
        console.error("Login falló", error);
        alert("Ocurrió un error al iniciar sesión.");
      }
    });
  }
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
    const { saveResult } = await import('./services/prodeStore.js');
    try {
      await saveResult(matchId, document.getElementById('result-home').value, document.getElementById('result-away').value);
      alert('Resultado oficial guardado en Firebase');
      router();
    } catch (e) {
      alert('Error guardando resultado: ' + e.message);
    }
  });
}

function renderAdminMatchForm() {
  const matchId = document.getElementById('admin-match-select')?.value || String(matches[0].id);
  const result = getResults()[String(matchId)] || {};

  const resultHome = document.getElementById('result-home');
  const resultAway = document.getElementById('result-away');
  if (resultHome) resultHome.value = result.home ?? '';
  if (resultAway) resultAway.value = result.away ?? '';
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

// Initialize App
onAuthStateChanged(auth, (user) => {
  if (!isInitialized) {
    initializeFirebaseSync(() => {
      router();
    });
    isInitialized = true;
  } else {
    router();
  }
});
