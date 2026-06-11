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
        <div class="nav-links">
          <a href="/" class="nav-link" data-link>Rankings</a>
          <a href="/fixture" class="nav-link" data-link>Fixture</a>
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
