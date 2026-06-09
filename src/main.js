// src/main.js
import './styles/index.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/animations.css';

import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { Fixture } from './pages/Fixture.js';
import { Programas } from './pages/Programas.js';
import { Predicciones } from './pages/Predicciones.js';
import { Admin } from './pages/Admin.js';

const app = document.getElementById('app');

const routes = {
  '/': Home,
  '/fixture': Fixture,
  '/programas': Programas,
  '/admin': Admin
};

function router() {
  const path = window.location.pathname;
  
  // Basic layout: Navbar + Main Content container
  app.innerHTML = `
    ${Navbar()}
    <main class="main-content container">
      ${renderPage(path)}
    </main>
  `;

  // Attach event listeners for admin login if needed
  if (path === '/admin') {
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
      btnLogin.addEventListener('click', () => {
        const pass = document.getElementById('admin-pass').value;
        if (pass === 'mixon2026') { // TODO: use real auth or simple hash
          document.getElementById('login-section').style.display = 'none';
          document.getElementById('admin-dashboard').style.display = 'block';
        } else {
          alert('Contraseña incorrecta');
        }
      });
    }
  }
}

function renderPage(path) {
  // Handle dynamic routes like /predicciones/:id
  if (path.startsWith('/predicciones/')) {
    const matchId = path.split('/')[2];
    return Predicciones(matchId);
  }
  
  const page = routes[path];
  return page ? page() : `<h2>404 - Página no encontrada</h2>`;
}

// Intercept link clicks for SPA routing
document.body.addEventListener('click', e => {
  if (e.target.matches('[data-link]') || e.target.closest('[data-link]')) {
    e.preventDefault();
    const link = e.target.matches('[data-link]') ? e.target : e.target.closest('[data-link]');
    history.pushState(null, null, link.href);
    router();
  }
});

// Handle back/forward buttons
window.addEventListener('popstate', router);

// Initial render
router();
