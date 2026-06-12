// src/components/Navbar.js

export function Navbar() {
  return `
    <nav class="navbar">
      <div class="container nav-content">
        <a href="/" class="nav-brand" data-link>
          <img src="/assets/logo-mixon.png" alt="Mix On Logo">
          <span class="nav-x" style="font-size: 1rem; margin: 0 0.2rem; opacity: 0.5;">✕</span>
          <img src="/assets/logo-mundial.webp" alt="Mundial 2026 Logo">
          <span class="nav-title" style="margin-left: 0.25rem;">PRODE 2026</span>
        </a>
        <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Abrir menú">
          <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="nav-overlay" id="nav-overlay"></div>
        
        <div class="nav-links" id="nav-links">
          <button id="mobile-menu-close" class="mobile-menu-close" aria-label="Cerrar menú">✕</button>
          <a href="/" class="nav-link" data-link>Rankings</a>
          <a href="/fixture" class="nav-link" data-link>🎮 Jugar (Fixture)</a>
          <a href="/llaves" class="nav-link" data-link>Llaves</a>
          <a href="/programas" class="nav-link" data-link>Por Programa</a>
          <a href="/puntajes" class="nav-link" data-link>Puntajes</a>
          <a href="/mis-predicciones" class="nav-link" data-link id="nav-my-predictions" style="display:none;">Mis Predicciones</a>
          <a href="/admin" class="nav-link" data-link id="nav-admin" style="display:none;">Admin</a>
        </div>
        <div class="nav-auth" id="auth-container">
          <!-- Auth state will be injected here by main.js -->
        </div>
      </div>
    </nav>
  `;
}
