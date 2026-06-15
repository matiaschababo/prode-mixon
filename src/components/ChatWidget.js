// src/components/ChatWidget.js

function parseLinks(text) {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0a84ff; text-decoration: underline;">${url}</a>`;
  });
}

export function ChatWidget(user, messages = [], unreadCount = 0, isOpen = false) {
  const displayClass = isOpen ? 'chat-open' : 'chat-closed';
  
  const messagesHTML = messages.length === 0 
    ? `<div class="chat-empty" style="text-align: center; color: var(--text-secondary); padding: 2rem 1rem; font-size: 0.9rem;">No hay mensajes aún. ¡Sé el primero en comentar!</div>`
    : messages.map(msg => {
        const isMe = user && user.uid === msg.uid;
        // Handle serverTimestamp which might be pending (null) on optimistic UI update
        let timeStr = '';
        if (msg.timestamp) {
          const timeObj = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
          timeStr = timeObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }

        return `
          <div class="chat-message ${isMe ? 'chat-message-me' : 'chat-message-other'}">
            ${!isMe ? `<img src="${msg.photo}" class="chat-avatar" alt="${msg.name}">` : ''}
            <div class="chat-bubble-content">
              ${!isMe ? `<div class="chat-author">${msg.name}</div>` : ''}
              ${msg.type === 'gif' 
                ? `<img src="${msg.gifUrl}" class="chat-gif-img" alt="GIF">` 
                : `<div class="chat-text">${parseLinks(msg.text)}</div>`
              }
              <div class="chat-time">${timeStr}</div>
            </div>
          </div>
        `;
      }).join('');

  const inputAreaHTML = user
    ? `
      <div class="chat-input-area">
        <button id="chat-emoji-btn" class="chat-action-btn" title="Emojis">😀</button>
        <button id="chat-gif-btn" class="chat-action-btn" title="GIFs">GIF</button>
        <input type="text" id="chat-input" placeholder="Escribí un mensaje..." autocomplete="off">
        <button id="chat-send-btn" class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem;">Enviar</button>
      </div>
    `
    : `
      <div class="chat-input-area chat-login-prompt" style="justify-content: center; padding: 1rem;">
        <button id="chat-login-btn" class="btn btn-primary btn-sm" style="width: 100%;">Iniciá Sesión para chatear</button>
      </div>
    `;

  return `
    <div id="global-chat-container">
      <div id="chat-bubble" class="chat-bubble ${isOpen ? 'hidden' : ''}">
        <div class="chat-callout">¡Nuevo Chat! 🔥</div>
        <span class="chat-icon">💬</span>
        ${unreadCount > 0 ? `<span class="chat-unread-badge animate-bounce">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
      </div>

      <div id="chat-window" class="chat-window ${displayClass}">
        <div class="chat-header">
          <div class="chat-header-title">
            <span class="chat-header-icon animate-pulse" style="color: #ff3b30; font-size: 0.8rem;">●</span>
            <span style="font-weight: 700; font-family: var(--font-display);">Comunidad</span>
          </div>
          <button id="chat-close-btn" class="chat-close-btn">✕</button>
        </div>
        
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
