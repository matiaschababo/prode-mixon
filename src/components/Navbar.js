// src/components/Navbar.js

export function Navbar() {
  return `
    <nav class="navbar">
      <div class="container nav-content">
        <a href="/" class="nav-brand" data-link>
          <img src="/assets/logo-mixon.png" alt="Mix On Logo">
          <span>PRODE 2026</span>
        </a>
        <div class="nav-links">
          <a href="/" class="nav-link" data-link>Ranking General</a>
          <a href="/fixture" class="nav-link" data-link>Fixture</a>
          <a href="/programas" class="nav-link" data-link>Por Programa</a>
          <a href="/puntajes" class="nav-link" data-link>Puntajes</a>
          <a href="/admin" class="nav-link" data-link>Admin</a>
        </div>
      </div>
    </nav>
  `;
}
