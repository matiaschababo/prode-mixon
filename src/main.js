import './styles/index.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/animations.css';

import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { Fixture, attachFixtureEvents } from './pages/Fixture.js';
import { Programas } from './pages/Programas.js';
import { Predicciones } from './pages/Predicciones.js';
import { Admin, attachAdminEvents } from './pages/Admin.js';
import { Puntajes } from './pages/Puntajes.js';
import { Perfil } from './pages/Perfil.js';
import { Llaves } from './pages/Llaves.js';
import { matches } from './data/matches.js';
import { getParticipantProgramLabel, participants } from './data/participants.js';
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists, MASTER_ADMINS } from './services/prodeStore.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './services/firebase.js';

const app = document.getElementById('app');
let isInitialized = false;

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/llaves': Llaves,
  '/programas': Programas,
  '/puntajes': Puntajes,
  '/admin': Admin
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
  if (path === '/fixture') {
    attachFixtureFilters();
    attachFixtureEvents();
  }
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
    if (myPredsLink) myPredsLink.style.display = 'none'; // We don't need the link anymore
    const roleIcon = user.role === 'Conductor' ? '🎙️ ' : 
                     user.role === 'Productor' ? '🎬 ' : 
                     user.role === 'Operador' ? '🎛️ ' : '';
    const badgeHtml = MASTER_ADMINS.includes(user.email) 
      ? '<span class="user-role-badge user-role-master">⭐ MASTER ADMIN</span>'
      : `<span class="user-role-badge">${roleIcon}${(user.role || 'Viewer').toUpperCase()} ${user.program ? '· ' + user.program.toUpperCase() : ''}</span>`;

    container.innerHTML = `
      <div class="user-profile">
        <div class="user-info">
          <span class="user-name">${user.displayName}</span>
          ${badgeHtml}
        </div>
        <img src="${user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid}" alt="Avatar" class="avatar-small">
        <button id="btn-logout" class="btn btn-secondary btn-small" style="margin-left: 1rem;">SALIR</button>
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



document.body.addEventListener('click', e => {
  if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
    e.preventDefault();
    const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
    history.pushState(null, null, link.href);
    router();
  }
});

window.addEventListener('popstate', router);

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
