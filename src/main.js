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
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists, MASTER_ADMINS, getDynamicUsers, updateUserDisplayName, startLiveMatchEngine, isDataReady, getChatMessages, sendChatMessage, deleteChatMessage, banUser, toggleLikeChatMessage } from './services/prodeStore.js';
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
  
  let isMentioned = false;
  if (unreadCount > 0 && auth.currentUser && auth.currentUser.displayName) {
    const firstName = auth.currentUser.displayName.split(' ')[0].toLowerCase();
    const unreadMsgs = msgs.slice(lastReadChatLength);
    isMentioned = unreadMsgs.some(m => m.text && m.text.toLowerCase().includes('@' + firstName));
  }

  const isMasterAdmin = auth.currentUser ? MASTER_ADMINS.includes(auth.currentUser.email) : false;

  const newHtml = `
    ${Navbar()}
    <main class="main-content container">
      ${dataReady ? renderPage(path) : LoadingScreen()}
    </main>
    ${dataReady ? ChatWidget(auth.currentUser, msgs, unreadCount, isChatOpen, isMentioned, isMasterAdmin) : ''}
  `;

  const renderTweets = (retries = 5) => {
    if (window.twttr && window.twttr.widgets) {
      document.querySelectorAll('.tweet-embed:not(.loaded)').forEach(el => {
        el.classList.add('loaded');
        const tweetId = el.getAttribute('data-tweet-id');
        el.innerHTML = ''; // clear placeholder text
        window.twttr.widgets.createTweet(tweetId, el, { theme: 'dark', conversation: 'none' }).catch(err => {
          console.error("Error rendering tweet", err);
          el.innerHTML = '<span style="color:var(--text-secondary);font-size:0.8rem;">Error al cargar Tweet</span>';
        });
      });
    } else if (retries > 0) {
      setTimeout(() => renderTweets(retries - 1), 500);
    }
  };

  if (!app.hasChildNodes()) {
    app.innerHTML = newHtml;
    setTimeout(renderTweets, 10);
  } else {
    const tempEl = document.createElement('div');
    tempEl.id = 'app';
    tempEl.innerHTML = newHtml;
    morphdom(app, tempEl, {
      childrenOnly: true,
      onBeforeElUpdated: function(fromEl, toEl) {
        if (fromEl.hasAttribute && fromEl.hasAttribute('data-ignore-morph')) {
          return false;
        }
        if (fromEl.tagName === 'INPUT' && fromEl.id === 'chat-input') {
          // If we manually cleared it, don't restore old value
          if (fromEl.dataset.cleared === 'true') {
            toEl.value = '';
            fromEl.dataset.cleared = 'false';
          } else {
            toEl.value = fromEl.value;
          }
        } else if (fromEl.tagName === 'INPUT') {
          toEl.value = fromEl.value;
        }
        return true;
      }
    });
    setTimeout(renderTweets, 10);
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

  if (bubble) bubble.onclick = toggleChat;
  if (closeBtn) closeBtn.onclick = toggleChat;

  const handleSend = async () => {
    if (!input || !input.value.trim()) return;
    const val = input.value;
    input.value = '';
    input.dataset.cleared = 'true'; // tell morphdom not to restore it
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
    }
    try {
      await sendChatMessage(val);
    } catch (error) {
      console.error("Error sending message:", error);
      input.value = val;
      input.dataset.cleared = 'false';
      alert(error.message);
    } finally {
      const currentSendBtn = document.getElementById('chat-send-btn');
      if (currentSendBtn) {
        currentSendBtn.disabled = false;
        currentSendBtn.textContent = 'Enviar'; // Wait, in ChatWidget it's an SVG icon, not text!
        currentSendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: translateX(-1px) translateY(1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }
      const currentInput = document.getElementById('chat-input');
      if (currentInput) currentInput.focus();
    }
  };

  if (sendBtn) sendBtn.onclick = handleSend;

  if (input) {
    input.onkeypress = (e) => {
      if (e.key === 'Enter') handleSend();
    };
    
    // Mentions Autocomplete
    const mentionsPanel = document.getElementById('chat-mentions-panel');
    if (mentionsPanel) {
      input.addEventListener('input', (e) => {
        const val = input.value;
        const lastWordMatch = val.match(/@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*)$/);
        
        if (lastWordMatch) {
          const search = lastWordMatch[1].toLowerCase();
          const allUsers = [...new Set(getRankedParticipants().map(p => p.name.split(' ')[0]))];
          const matches = allUsers.filter(u => u.toLowerCase().startsWith(search)).slice(0, 5);
          
          if (matches.length > 0) {
            mentionsPanel.innerHTML = matches.map(m => `
              <div class="mention-option" style="padding: 0.5rem 1rem; cursor: pointer; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">
                @${m}
              </div>
            `).join('');
            mentionsPanel.classList.remove('hidden');
            
            mentionsPanel.querySelectorAll('.mention-option').forEach(opt => {
              opt.onclick = () => {
                const name = opt.innerText.trim();
                input.value = val.replace(/@[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*$/, name + ' ');
                mentionsPanel.classList.add('hidden');
                input.focus();
              };
            });
          } else {
            mentionsPanel.classList.add('hidden');
          }
        } else {
          mentionsPanel.classList.add('hidden');
        }
      });
      
      // Hide mentions panel on click outside
      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !mentionsPanel.contains(e.target)) {
          mentionsPanel.classList.add('hidden');
        }
      });
    }
  }

  // Mod Tools
  document.querySelectorAll('.chat-mod-delete').forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm('¿Eliminar mensaje de forma permanente?')) {
        try {
          await deleteChatMessage(id);
        } catch (error) {
          alert(error.message);
        }
      }
    };
  });

  document.querySelectorAll('.chat-mod-ban').forEach(btn => {
    btn.onclick = async (e) => {
      const uid = e.target.getAttribute('data-uid');
      if (confirm('¿Bloquear a este usuario del chat? (No podrá enviar más mensajes)')) {
        try {
          await banUser(uid);
          alert('Usuario bloqueado exitosamente.');
        } catch (error) {
          alert(error.message);
        }
      }
    };
  });

  // Like Chat Messages
  document.querySelectorAll('.chat-like-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const target = e.target.closest('.chat-like-btn');
      const id = target.getAttribute('data-id');
      try {
        await toggleLikeChatMessage(id);
      } catch (error) {
        alert(error.message);
      }
    };
  });

  if (loginBtn) {
    loginBtn.onclick = async () => {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (e) {
        console.error("Login failed", e);
      }
    };
  }

  // --- PREMIUM CHAT FEATURES: EMOJI & GIF ---
  const emojiBtn = document.getElementById('chat-emoji-btn');
  const gifBtn = document.getElementById('chat-gif-btn');
  const emojiPanel = document.getElementById('chat-emoji-panel');
  const gifPanel = document.getElementById('chat-gif-panel');
  const panelsContainer = document.getElementById('chat-panels-container');
  const gifSearchInput = document.getElementById('chat-gif-search');
  const gifResults = document.getElementById('chat-gif-results');

  const closePanels = () => {
    if(panelsContainer) panelsContainer.classList.add('hidden');
    if(emojiPanel) emojiPanel.classList.add('hidden');
    if(gifPanel) gifPanel.classList.add('hidden');
  };

  // EMOJI PICKER
  if (emojiBtn && !emojiBtn.dataset.events) {
    emojiBtn.dataset.events = "true";
    emojiBtn.addEventListener('click', async () => {
      if (!panelsContainer.classList.contains('hidden') && !emojiPanel.classList.contains('hidden')) {
        closePanels();
        return;
      }
      closePanels();
      panelsContainer.classList.remove('hidden');
      emojiPanel.classList.remove('hidden');

      if (!window.picmoPicker) {
        emojiPanel.innerHTML = '<div style="padding:1rem;text-align:center;color:white;">Cargando emojis...</div>';
        try {
          if (!window.picmo) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/picmo@latest/dist/umd/picmo.js';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
          }
          emojiPanel.innerHTML = '';
          window.picmoPicker = window.picmo.createPicker({
            rootElement: emojiPanel,
            theme: 'dark'
          });
          window.picmoPicker.addEventListener('emoji:select', event => {
            if (input) input.value += event.emoji;
            if (input) input.focus();
            closePanels();
          });
        } catch (e) {
          emojiPanel.innerHTML = '<div style="padding:1rem;color:red;">Error cargando emojis</div>';
        }
      }
    });
  }

  // GIF PICKER
  const TENOR_API_KEY = 'LIVDSRZULELA'; // Public Tenor key
  
  const renderGifs = async (query = '') => {
    if (!gifResults) return;
    gifResults.innerHTML = '<div style="padding:1rem;text-align:center;color:white;">Buscando...</div>';
    try {
      const endpoint = query 
        ? `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=12`
        : `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=12`;
        
      const res = await fetch(endpoint);
      const { results } = await res.json();
      
      if (!results || results.length === 0) {
        gifResults.innerHTML = '<div style="padding:1rem;text-align:center;color:#999;">No se encontraron GIFs</div>';
        return;
      }

      gifResults.innerHTML = results.map(g => `
        <img src="${g.media[0].tinygif.url}" 
             data-url="${g.media[0].gif.url}" 
             class="chat-gif-option" 
             alt="GIF">
      `).join('');

      // Add click listeners to GIFs
      gifResults.querySelectorAll('.chat-gif-option').forEach(img => {
        img.addEventListener('click', async (e) => {
          const gifUrl = e.target.getAttribute('data-url');
          closePanels();
          try {
            await sendChatMessage('', 'gif', gifUrl);
          } catch (err) {
            alert('Error enviando GIF');
          }
        });
      });

    } catch (e) {
      gifResults.innerHTML = '<div style="padding:1rem;color:red;">Error al cargar GIFs</div>';
    }
  };

  if (gifBtn && !gifBtn.dataset.events) {
    gifBtn.dataset.events = "true";
    gifBtn.addEventListener('click', () => {
      if (!panelsContainer.classList.contains('hidden') && !gifPanel.classList.contains('hidden')) {
        closePanels();
        return;
      }
      closePanels();
      panelsContainer.classList.remove('hidden');
      gifPanel.classList.remove('hidden');
      renderGifs(); // Load trending by default
    });
  }

  let gifDebounce;
  if (gifSearchInput && !gifSearchInput.dataset.events) {
    gifSearchInput.dataset.events = "true";
    gifSearchInput.addEventListener('input', (e) => {
      clearTimeout(gifDebounce);
      gifDebounce = setTimeout(() => {
        renderGifs(e.target.value);
      }, 500);
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
