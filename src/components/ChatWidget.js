// src/components/ChatWidget.js

function parseMessage(text, user) {
  if (!text) return '';
  let parsed = text;
  
  // Parse links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  parsed = parsed.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0a84ff; text-decoration: underline;">${url}</a>`;
  });

  // Parse mentions
  const firstName = user?.displayName ? user.displayName.split(' ')[0].toLowerCase() : '';
  const mentionRegex = /@([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/g;
  parsed = parsed.replace(mentionRegex, function(match, name) {
    const isMe = firstName && name.toLowerCase() === firstName;
    const color = isMe ? '#ffb300' : '#5CB8E4';
    const bg = isMe ? 'rgba(255, 179, 0, 0.2)' : 'rgba(92, 184, 228, 0.2)';
    const glow = isMe ? `box-shadow: 0 0 10px rgba(255,179,0,0.5);` : '';
    return `<span style="color: ${color}; background: ${bg}; padding: 0 4px; border-radius: 4px; font-weight: 700; ${glow}">${match}</span>`;
  });

  return parsed;
}

export function ChatWidget(user, messages = [], unreadCount = 0, isOpen = false, isMentioned = false, isMasterAdmin = false) {
  const displayClass = isOpen ? 'chat-open' : 'chat-closed';
  
  const messagesHTML = messages.length === 0 
    ? `<div class="chat-empty" style="text-align: center; color: var(--text-secondary); padding: 2rem 1rem; font-size: 0.9rem;">No hay mensajes aún. ¡Sé el primero en comentar!</div>`
    : messages.map(msg => {
        const isMe = user && user.uid === msg.uid;
        let timeStr = '';
        if (msg.timestamp) {
          const timeObj = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
          timeStr = timeObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }

        const modHTML = isMasterAdmin && !isMe ? `
          <div class="chat-mod-tools" style="display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.25rem;">
            <button class="chat-mod-delete btn btn-sm" data-id="${msg.id}" style="background: rgba(255,59,48,0.2); color: #ff3b30; padding: 0.2rem 0.5rem; font-size: 0.7rem; border: 1px solid #ff3b30;">Eliminar</button>
            <button class="chat-mod-ban btn btn-sm" data-uid="${msg.uid}" style="background: rgba(255,149,0,0.2); color: #ff9500; padding: 0.2rem 0.5rem; font-size: 0.7rem; border: 1px solid #ff9500;">Bloquear</button>
          </div>
        ` : '';

        return `
          <div class="chat-message ${isMe ? 'chat-message-me' : 'chat-message-other'}">
            ${!isMe ? `<img src="${msg.photo}" class="chat-avatar" alt="${msg.name}">` : ''}
            <div class="chat-bubble-content">
              ${!isMe ? `<div class="chat-author">${msg.name}</div>` : ''}
              ${msg.type === 'gif' 
                ? `<img src="${msg.gifUrl}" class="chat-gif-img" alt="GIF">` 
                : `<div class="chat-text">${parseMessage(msg.text, user)}</div>`
              }
              <div class="chat-time">${timeStr}</div>
              ${modHTML}
            </div>
          </div>
        `;
      }).join('');

  const inputAreaHTML = user
    ? `
      <div class="chat-input-area" style="position: relative;">
        <div id="chat-mentions-panel" class="hidden" style="position: absolute; bottom: 100%; left: 0; width: 100%; max-height: 150px; overflow-y: auto; background: var(--glass-bg); backdrop-filter: blur(10px); border-top: 1px solid var(--glass-border); border-radius: 12px 12px 0 0; z-index: 10;"></div>
        
        <div class="chat-input-wrapper">
          <button id="chat-emoji-btn" class="chat-action-btn" title="Emojis">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          </button>
          <button id="chat-gif-btn" class="chat-action-btn" title="GIFs">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><path d="M6 10v4"></path><path d="M10 10h4"></path><path d="M12 10v4"></path><path d="M18 10v4h-2"></path></svg>
          </button>
          <input type="text" id="chat-input" placeholder="Mensaje..." autocomplete="off">
        </div>
        
        <button id="chat-send-btn" class="chat-send-circle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: translateX(-1px) translateY(1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    `
    : `
      <div class="chat-input-area chat-login-prompt" style="justify-content: center; padding: 1rem;">
        <button id="chat-login-btn" class="btn btn-primary btn-sm" style="width: 100%;">Iniciá Sesión para chatear</button>
      </div>
    `;

  let badgeHTML = '';
  if (isMentioned) {
    badgeHTML = `<span class="chat-unread-badge animate-bounce" style="background: #ffb300; font-weight: 900; font-size: 1rem;">@</span>`;
  } else if (unreadCount > 0) {
    badgeHTML = `<span class="chat-unread-badge animate-bounce">${unreadCount > 99 ? '99+' : unreadCount}</span>`;
  }

  return `
    <div id="global-chat-container">
      <div id="chat-bubble" class="chat-bubble ${isOpen ? 'hidden' : ''}">
        <div class="chat-callout">¡Nuevo Chat! 🔥</div>
        <span class="chat-icon">💬</span>
        ${badgeHTML}
      </div>

      <div id="chat-window" class="chat-window ${displayClass}">
        <div class="chat-header">
          <div class="chat-header-title">
            <span class="chat-header-icon" style="color: #00E676; font-size: 0.8rem; filter: drop-shadow(0 0 4px #00E676);">●</span>
            <div>
              <div style="font-weight: 700; font-family: var(--font-display); line-height: 1.1;">Comunidad</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary); opacity: 0.8;">En línea</div>
            </div>
          </div>
          <button id="chat-close-btn" class="chat-close-btn">✕</button>
        </div>
        
        <div class="chat-bg-pattern"></div>
        <div id="chat-messages-container" class="chat-messages-container">
          ${messagesHTML}
        </div>
        
        <div id="chat-panels-container" class="chat-panels-container hidden">
          <div id="chat-emoji-panel" class="chat-panel hidden"></div>
          <div id="chat-gif-panel" class="chat-panel hidden">
            <div style="padding: 0.5rem;">
              <input type="text" id="chat-gif-search" placeholder="Buscar GIF..." autocomplete="off">
            </div>
            <div id="chat-gif-results" class="chat-gif-results"></div>
          </div>
        </div>

        ${inputAreaHTML}
      </div>
    </div>
  `;
}
