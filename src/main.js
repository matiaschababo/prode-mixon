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
import { getPredictions, getResults, getRankedParticipants, initializeFirebaseSync, ensureUserExists, MASTER_ADMINS, getDynamicUsers, updateUserDisplayName, startLiveMatchEngine, isDataReady, getChatMessages, sendChatMessage, deleteChatMessage, banUser, toggleLikeChatMessage, listenToNotifications, markNotificationsAsRead, togglePredictionLike, incrementPredictionShares } from './services/prodeStore.js';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './services/firebase.js';
import { ChatWidget } from './components/ChatWidget.js';

const app = document.getElementById('app');
let isInitialized = false;

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/llaves': Llaves,
  '/programas': Programas,
  '/reglas': Reglas,
  '/perfil': Perfil,
  '/admin': Admin
};

let isChatOpen = false;
let lastReadChatLength = 0;
export let chatReplyingTo = null;

export function setChatReplyingTo(msg) {
  chatReplyingTo = msg;
  router();
}

window.closeChat = () => {
  isChatOpen = false;
  document.body.style.overflow = '';
  document.body.classList.remove('chat-open-mobile');
  router();
};

window.sharePredictionToChat = async (uid, name, matchStr, predStr, matchId) => {
  if (matchId) await incrementPredictionShares(matchId, uid);
  setChatReplyingTo({
    isPrediction: true,
    name,
    matchStr,
    predStr
  });
  if (!isChatOpen) {
    isChatOpen = true;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('chat-open-mobile');
    router();
  }
  setTimeout(() => {
    document.getElementById('chat-input')?.focus();
  }, 100);
};

window.showLikesModal = (likesJson) => {
  try {
    const likes = JSON.parse(unescape(likesJson));
    const modal = document.createElement('div');
    modal.className = 'glass-card animate-fade-in';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.zIndex = '10000';
    modal.style.width = '90%';
    modal.style.maxWidth = '350px';
    modal.style.padding = '1.5rem';
    
    const overlay = document.createElement('div');
    overlay.className = 'animate-fade-in';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.backdropFilter = 'blur(3px)';
    
    const close = () => { modal.remove(); overlay.remove(); };
    overlay.onclick = close;
    
    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
        <h3 style="margin: 0; font-size: 1.1rem;">Me gusta</h3>
        <button onclick="this.closest('.glass-card').nextSibling.click()" class="btn btn-sm" style="background: transparent; color: white; padding: 0.2rem;">✕</button>
      </div>
      <div style="max-height: 300px; overflow-y: auto;">
        ${likes.map(l => `
          <a href="/perfil/${l.uid}" onclick="this.closest('.glass-card').nextSibling.click(); window.router();" data-link style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 0; text-decoration: none; color: inherit; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <img src="${l.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+l.uid}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
            <div style="font-weight: 500; font-size: 0.9rem;">${l.name}</div>
          </a>
        `).join('')}
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.appendChild(overlay);
  } catch(e) { console.error(e); }
};

window.toggleLikeOnPrediction = async (matchId, targetUserId) => {
  try {
    await togglePredictionLike(matchId, targetUserId);
    router(); // re-render to reflect like changes instantly
  } catch(e) {
    alert(e.message);
  }
};

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
    ${dataReady ? ChatWidget(auth.currentUser, msgs, unreadCount, isChatOpen, isMentioned, isMasterAdmin, chatReplyingTo) : ''}
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

  // Scroll to bottom button logic
  const scrollToBottomBtn = document.getElementById('chat-scroll-to-bottom');
  if (msgsContainer && !msgsContainer.dataset.scrollEvent) {
    msgsContainer.dataset.scrollEvent = "true";
    msgsContainer.addEventListener('scroll', () => {
      const isNearBottom = msgsContainer.scrollHeight - msgsContainer.scrollTop - msgsContainer.clientHeight < 100;
      if (!isNearBottom) {
        scrollToBottomBtn?.classList.remove('hidden');
      } else {
        scrollToBottomBtn?.classList.add('hidden');
      }
    });
  }
  
  if (bubble && !bubble.dataset.events) {
    bubble.dataset.events = "true";
    bubble.addEventListener('click', () => {
      isChatOpen = true;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('chat-open-mobile');
      lastReadChatLength = getChatMessages().length;
      router();
      setTimeout(() => {
        document.getElementById('chat-input')?.focus();
      }, 300);
    });
  }

  if (closeBtn && !closeBtn.dataset.events) {
    closeBtn.dataset.events = "true";
    closeBtn.addEventListener('click', () => {
      window.closeChat();
    });
  }
  
  if (scrollToBottomBtn && !scrollToBottomBtn.dataset.events) {
    scrollToBottomBtn.dataset.events = "true";
    scrollToBottomBtn.addEventListener('click', () => {
      msgsContainer.scrollTo({ top: msgsContainer.scrollHeight, behavior: 'smooth' });
    });
  }

  // Swipe-to-reply logic
  if (msgsContainer && !msgsContainer.dataset.swipeEvents) {
    msgsContainer.dataset.swipeEvents = "true";
    let startX = 0;
    let startY = 0;
    let currentMsg = null;
    msgsContainer.addEventListener('touchstart', (e) => {
      const msg = e.target.closest('.chat-message');
      if (msg) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentMsg = msg;
        msg.style.animation = 'none'; // Overrides CSS animation that blocks transform
        msg.style.transition = 'none';
      }
    }, {passive: true});

    msgsContainer.addEventListener('touchmove', (e) => {
      if (!currentMsg) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const diffX = x - startX;
      const diffY = Math.abs(y - startY);
      
      if (diffX > 10 && diffY < 30) {
        const translateX = Math.min(diffX, 60);
        currentMsg.style.transform = `translateX(${translateX}px)`;
      } else if (diffY > 30) {
        currentMsg.style.transform = '';
        currentMsg = null;
      }
    }, {passive: true});

    msgsContainer.addEventListener('touchend', (e) => {
      if (!currentMsg) return;
      const msg = currentMsg;
      currentMsg = null;
      msg.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      msg.style.transform = '';
      
      const diffX = e.changedTouches[0].clientX - startX;
      if (diffX > 50) {
        const replyBtn = msg.querySelector('.chat-mod-reply');
        if (replyBtn) replyBtn.click();
      }
    });
  }

  const toggleChat = () => {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (chatReplyingTo) setChatReplyingTo(null);
    }
    router();
  };

  if (bubble) bubble.onclick = toggleChat;
  if (closeBtn) closeBtn.onclick = toggleChat;

  const chatWindow = document.getElementById('chat-window');
  if (chatWindow && !chatWindow.dataset.touchBlocker) {
    chatWindow.dataset.touchBlocker = "true";
    chatWindow.addEventListener('touchmove', (e) => {
      // Prevent scrolling the background app when touching inside chat window
      // Only allow scrolling inside scrollable areas
      const isScrollableArea = e.target.closest('.chat-messages-container') || 
                               e.target.closest('.chat-gif-results') || 
                               e.target.closest('.picmo__picker') ||
                               e.target.closest('#chat-mentions-panel');
      if (!isScrollableArea) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  const handleSend = async () => {
    if (!input || !input.value.trim()) return;
    const val = input.value;
    const replyData = chatReplyingTo ? { ...chatReplyingTo } : null;
    input.value = '';
    input.dataset.cleared = 'true'; // tell morphdom not to restore it
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = '...';
    }
    if (chatReplyingTo) {
      chatReplyingTo = null; // Clear immediately for UI
      router();
    }
    try {
      await sendChatMessage(val, 'text', '', replyData);
      // Fix iOS Safari viewport shift bug after sending/closing keyboard
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
    } catch (error) {
      console.error("Error sending message:", error);
      input.value = val;
      input.dataset.cleared = 'false';
      alert(error.message);
    } finally {
      const currentSendBtn = document.getElementById('chat-send-btn');
      if (currentSendBtn) {
        currentSendBtn.disabled = false;
        currentSendBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: translateX(-1px) translateY(1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
      }
      setTimeout(() => {
        const currentInput = document.getElementById('chat-input');
        if (currentInput) {
          currentInput.focus();
        }
      }, 50);
    }
  };

  if (sendBtn) sendBtn.onclick = handleSend;

  if (input) {
    input.onkeypress = (e) => {
      if (e.key === 'Enter') handleSend();
    };
    input.onblur = () => {
      // Fix iOS keyboard closing shift
      window.scrollTo(0, 0);
    };
    
    // Mentions Autocomplete
    const mentionsPanel = document.getElementById('chat-mentions-panel');
    if (mentionsPanel) {
      input.addEventListener('input', (e) => {
        const val = input.value;
        const lastWordMatch = val.match(/@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*)$/);
        
        if (lastWordMatch) {
          const search = lastWordMatch[1].toLowerCase();
          const allUsers = getRankedParticipants().map(p => ({
            displayName: p.name,
            mentionName: p.name.replace(/\s+/g, '_')
          }));
          const matches = allUsers.filter(u => u.displayName.toLowerCase().includes(search) || u.mentionName.toLowerCase().includes(search)).slice(0, 5);
          
          if (matches.length > 0) {
            mentionsPanel.innerHTML = matches.map(m => `
              <div class="mention-option" data-mention="${m.mentionName}" style="padding: 0.5rem 1rem; cursor: pointer; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">
                @${m.displayName}
              </div>
            `).join('');
            mentionsPanel.classList.remove('hidden');
            
            mentionsPanel.querySelectorAll('.mention-option').forEach(opt => {
              opt.onclick = () => {
                const mention = opt.getAttribute('data-mention');
                input.value = val.replace(/@[a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*$/, '@' + mention + ' ');
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

  // Reply to messages
  document.querySelectorAll('.chat-mod-reply').forEach(btn => {
    btn.onclick = (e) => {
      const target = e.target.closest('.chat-mod-reply');
      const id = target.getAttribute('data-id');
      const name = target.getAttribute('data-name');
      const text = target.getAttribute('data-text');
      setChatReplyingTo({ id, name, text });
    };
  });

  // Cancel reply
  const cancelReplyBtn = document.getElementById('chat-cancel-reply-btn');
  if (cancelReplyBtn) {
    cancelReplyBtn.onclick = () => {
      setChatReplyingTo(null);
    };
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
        ? `https://api.tenor.com/v1/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=12`
        : `https://api.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=12`;
        
      const res = await fetch(endpoint);
      const { results } = await res.json();
      
      if (!results || results.length === 0) {
        gifResults.innerHTML = '<div style="padding:1rem;text-align:center;color:#999;">No se encontraron GIFs</div>';
        return;
      }

      gifResults.innerHTML = results.map(g => `
        <img src="${g.media_formats.tinygif.url}" 
             data-url="${g.media_formats.gif.url}" 
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

    const unreadCount = window.userNotifications ? window.userNotifications.filter(n => !n.read).length : 0;
    const notifsHtml = `
      <div class="notif-container" style="position: relative; cursor: pointer; margin-right: 0.5rem;" id="btn-notifs">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-primary);"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        ${unreadCount > 0 ? `<span class="notif-badge" style="position: absolute; top: -5px; right: -5px; background: #ff4757; color: white; border-radius: 50%; padding: 0.1rem 0.3rem; font-size: 0.6rem; font-weight: bold;">${unreadCount}</span>` : ''}
        
        <div id="notif-dropdown" class="glass-card notif-dropdown hidden">
          <h4 style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem;">Notificaciones</h4>
          ${window.userNotifications && window.userNotifications.length > 0 
            ? window.userNotifications.map(n => `
                <div class="notif-item" style="display: flex; gap: 0.5rem; align-items: center; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); ${n.read ? 'opacity: 0.7;' : 'background: rgba(255,255,255,0.05); border-radius: 4px;'}">
                  <img src="${n.fromUserPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+n.fromUserId}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                  <div style="font-size: 0.8rem; line-height: 1.2;">
                    <strong>${n.fromUserName}</strong> 
                    ${n.type === 'like' ? 'le dio like a tu pronóstico' : 'compartió tu pronóstico al chat'}
                  </div>
                </div>
              `).join('')
            : '<div style="padding: 1rem; text-align: center; font-size: 0.8rem; color: var(--text-secondary);">No hay notificaciones nuevas</div>'}
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="user-profile" style="display: flex; align-items: center;">
        ${notifsHtml}
        <div class="user-info desktop-only">
          <span class="user-name">${currentUserDynamic?.name || user.displayName}</span>
          ${badgeHtml}
        </div>
        <a href="/perfil/${user.uid}" data-link style="display: flex; align-items: center; text-decoration: none;">
          <img src="${customPhoto}" alt="Avatar" class="avatar-small" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1); transition: border-color 0.3s ease;">
        </a>
        <div class="user-actions" style="display: flex; gap: 0.5rem; margin-left: 0.8rem; align-items: center;">
          ${MASTER_ADMINS.includes(user.email) ? '<a href="/admin" class="desktop-only" data-link style="color: rgba(255,255,255,0.5); transition: color 0.3s;" title="Admin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></a>' : ''}
          <button id="btn-logout" style="background: transparent; border: none; padding: 0.2rem; cursor: pointer; color: rgba(255,59,48,0.7); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;" title="Salir">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    `;

    // Add logic for mobile nav buttons
    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) navAdmin.style.display = MASTER_ADMINS.includes(user.email) ? 'block' : 'none';

    document.getElementById('btn-notifs')?.addEventListener('click', (e) => {
      const drop = document.getElementById('notif-dropdown');
      if (drop.classList.contains('hidden')) {
        drop.classList.remove('hidden');
        if (unreadCount > 0) {
          markNotificationsAsRead(user.uid);
        }
      } else {
        drop.classList.add('hidden');
      }
      e.stopPropagation();
    });
    
    document.addEventListener('click', (e) => {
      const drop = document.getElementById('notif-dropdown');
      if (drop && !e.target.closest('#btn-notifs')) {
        drop.classList.add('hidden');
      }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      signOut(auth).then(() => router());
    });
  } else {
    if (myPredsLink) myPredsLink.style.display = 'none';
    container.innerHTML = `
      <button id="btn-login-google" class="btn btn-primary btn-small">
        <span class="desktop-only">Ingresar con Google</span>
        <span class="mobile-only">Ingresar</span>
      </button>
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

window.userNotifications = [];
let notifUnsubscribe = null;

window.addEventListener('popstate', router);

onAuthStateChanged(auth, (user) => {
  if (user) {
    startLiveMatchEngine();
    
    if (notifUnsubscribe) notifUnsubscribe();
    notifUnsubscribe = listenToNotifications(user.uid, (notifs) => {
      window.userNotifications = notifs;
      router();
    });
  } else {
    window.userNotifications = [];
    if (notifUnsubscribe) notifUnsubscribe();
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
