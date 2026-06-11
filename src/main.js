import morphdom from 'morphdom';
import './styles/index.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/animations.css';

import { Navbar } from './components/Navbar.js';
import { Home, attachHomeEvents } from './pages/Home.js';
import { Fixture, attachFixtureEvents } from './pages/Fixture.js';
import { Programas } from './pages/Programas.js';
import { Predicciones } from './pages/Predicciones.js';
import { Admin, attachAdminEvents } from './pages/Admin.js';
import { Puntajes } from './pages/Puntajes.js';
import { Perfil, attachPerfilEvents } from './pages/Perfil.js';
import { Llaves } from './pages/Llaves.js';
import { TeamProfile } from './pages/TeamProfile.js';
import { matches } from './data/matches.js';
import { getParticipantProgramLabel, participants } from './data/participants.js';
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists, MASTER_ADMINS, getDynamicUsers, updateUserDisplayName, startLiveMatchEngine } from './services/prodeStore.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './services/firebase.js';

const app = document.getElementById('app');
let isInitialized = false;

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/llaves': Llaves,
  '/programas': Programas,
  '/puntajes': Puntajes,
  '/perfil': Perfil,
  '/admin': Admin
};

function router() {
  const path = window.location.pathname;
  
  const newHtml = `
    ${Navbar()}
    <main class="main-content container">
      ${renderPage(path)}
    </main>
  `;

  if (!app.hasChildNodes()) {
    app.innerHTML = newHtml;
  } else {
    const tempEl = document.createElement('div');
    tempEl.id = 'app';
    tempEl.innerHTML = newHtml;
    morphdom(app, tempEl, {
      childrenOnly: true,
      onBeforeElUpdated: function(fromEl, toEl) {
        if (fromEl.tagName === 'INPUT') {
          toEl.value = fromEl.value;
        }
        return true;
      }
    });
  }

  attachPageEvents(path);
  updateNavbarAuthUI();
}

window.router = {
  navigate: (url) => {
    window.history.pushState(null, null, url);
    router();
  }
};

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

  if (path.startsWith('/equipo/')) {
    return TeamProfile();
  }
  
  const page = routes[path];
  return page ? page() : `<h2>404 - Página no encontrada</h2>`;
}

function attachPageEvents(path) {
  if (path === '/') {
    attachHomeEvents();
  } else if (path === '/admin') {
    attachAdminEvents();
  } else if (path === '/fixture') {
    attachFixtureFilters();
    attachFixtureEvents();
  } else if (path.startsWith('/perfil/')) {
    attachPerfilEvents();
  }
}

function attachFixtureFilters() {
  const buttons = document.querySelectorAll('.fixture-filter');
  const cards = document.querySelectorAll('.match-card');
  const days = document.querySelectorAll('.fixture-day');
  const empty = document.getElementById('fixture-empty');

  buttons.forEach(button => {
    if (button.dataset.eventsAttached) return;
    button.dataset.eventsAttached = 'true';
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
    
    // Check if there is a dynamic user to use custom photo
    const dynamicUsers = getDynamicUsers();
    const currentUserDynamic = dynamicUsers.find(u => u.id === user.uid);
    const customPhoto = currentUserDynamic?.photo || user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid;

    const currentRole = currentUserDynamic?.role || 'Viewer';
    const currentProgram = currentUserDynamic?.program || '';

    const roleIcon = currentRole === 'Conductor' ? '🎙️ ' : 
                     currentRole === 'Productor' ? '🎬 ' : 
                     currentRole === 'Operador' ? '🎛️ ' : 
                     currentRole === 'Editor/a' ? '✂️ ' : '';
    const badgeHtml = `<span class="user-role-badge">${roleIcon}${currentRole.toUpperCase()} ${currentProgram && currentProgram !== 'viewers' ? '· ' + currentProgram.toUpperCase() : ''}</span>`;

    container.innerHTML = `
      <div class="user-profile">
        <div class="user-info">
          <span class="user-name">${currentUserDynamic?.name || user.displayName}</span>
          ${badgeHtml}
        </div>
        <a href="/perfil" data-link style="display: flex; align-items: center;">
          <img src="${customPhoto}" alt="Avatar" class="avatar-small">
        </a>
        <div class="user-actions" style="display: flex; gap: 0.25rem; margin-left: 0.25rem;">
          ${MASTER_ADMINS.includes(user.email) ? '<a href="/admin" class="btn btn-secondary btn-small" data-link style="padding: 0.4rem 0.6rem; font-size: 0.7rem;">ADMIN</a>' : ''}
          <button id="btn-logout" class="btn btn-secondary btn-small" style="padding: 0.4rem 0.6rem; font-size: 0.7rem;">SALIR</button>
        </div>
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
  if (user) {
    startLiveMatchEngine();
  }

  if (!isInitialized) {
    initializeFirebaseSync(() => {
      router();
    });
    isInitialized = true;
  } else {
    router();
  }
});
