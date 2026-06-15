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
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists, MASTER_ADMINS, getDynamicUsers, updateUserDisplayName, startLiveMatchEngine, isDataReady, getChatMessages, sendChatMessage } from './services/prodeStore.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './services/firebase.js';
import { ChatWidget } from './components/ChatWidget.js';

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

let isChatOpen = false;
let lastReadChatLength = 0;

function LoadingScreen() {
  return `
    <div class="loading-screen">
      <div class="loading-content">
        <div class="loading-logos">
          <img src="/assets/logo-mixon.png" alt="Mix On" class="loading-logo">
          <span class="loading-x">✕</span>
          <img src="/assets/logo-mundial.webp" alt="Mundial 2026" class="loading-logo">
        </div>
        <div class="loading-spinner"></div>
        <p class="loading-text">Cargando datos del prode...</p>
        <div class="loading-skeletons">
          <div class="skeleton-row"></div>
          <div class="skeleton-row short"></div>
          <div class="skeleton-row"></div>
        </div>
      </div>
    </div>
  `;
}

function router() {
  const path = window.location.pathname;
  const dataReady = isDataReady();

  const msgs = getChatMessages();
  if (isChatOpen) {
    lastReadChatLength = msgs.length;
  }
  const unreadCount = msgs.length > lastReadChatLength ? msgs.length - lastReadChatLength : 0;

  const newHtml = `
    ${Navbar()}
    <main class="main-content container">
      ${dataReady ? renderPage(path) : LoadingScreen()}
    </main>
    ${dataReady ? ChatWidget(auth.currentUser, msgs, unreadCount, isChatOpen) : ''}
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

  if (dataReady) {
    attachPageEvents(path);
  }
  updateNavbarAuthUI();
  setupNavbar(path);
  if (dataReady) {
    setupChat();
  }
}

function setupChat() {
  const bubble = document.getElementById('chat-bubble');
  const closeBtn = document.getElementById('chat-close-btn');
  const sendBtn = document.getElementById('chat-send-btn');
  const input = document.getElementById('chat-input');
  const loginBtn = document.getElementById('chat-login-btn');
  const msgsContainer = document.getElementById('chat-messages-container');

  if (msgsContainer && !msgsContainer.dataset.scrolled) {
    // Scroll to bottom on first open or update
    msgsContainer.scrollTop = msgsContainer.scrollHeight;
    msgsContainer.dataset.scrolled = "true";
  }

  const toggleChat = () => {
    isChatOpen = !isChatOpen;
    router();
  };

  if (bubble && !bubble.dataset.events) {
    bubble.dataset.events = "true";
    bubble.addEventListener('click', toggleChat);
  }
  if (closeBtn && !closeBtn.dataset.events) {
    closeBtn.dataset.events = "true";
    closeBtn.addEventListener('click', toggleChat);
  }

  const handleSend = async () => {
    if (!input || !input.value.trim()) return;
    try {
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
      await sendChatMessage(input.value);
      input.value = '';
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error.message);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Enviar';
      }
      if (input) input.focus();
    }
  };

  if (sendBtn && !sendBtn.dataset.events) {
    sendBtn.dataset.events = "true";
    sendBtn.addEventListener('click', handleSend);
  }

  if (input && !input.dataset.events) {
    input.dataset.events = "true";
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  if (loginBtn && !loginBtn.dataset.events) {
    loginBtn.dataset.events = "true";
    loginBtn.addEventListener('click', async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (e) {
        console.error("Login failed", e);
      }
    });
  }
}

window.router = {
  navigate: (url) => {
    window.history.pushState(null, null, url);
    router();
  }
};

function setupNavbar(path) {
  // 1. Highlight active link
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      link.classList.add('active');
    }
  });

  // 2. Mobile Menu Logic
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('mobile-menu-close');
  const navLinks = document.getElementById('nav-links');
  const navOverlay = document.getElementById('nav-overlay');

  function openMenu() {
    navLinks?.classList.add('active');
    navOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  function closeMenu() {
    navLinks?.classList.remove('active');
    navOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileBtn) mobileBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (navOverlay) navOverlay.addEventListener('click', closeMenu);

  // Close menu when a link is clicked
  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
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
        <a href="/perfil/${user.uid}" data-link style="display: flex; align-items: center;">
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
