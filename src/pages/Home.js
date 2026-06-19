import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants, ensureUserExists, getDailyMVP, getMatchResult, sendChatMessage } from '../services/prodeStore.js';
import { auth, googleProvider, signInWithPopup } from '../services/firebase.js';
import { getProgramChartHTML } from './Programas.js';
import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';

export function Home() {
  const user = auth.currentUser;
  return `
    <div class="home-page animate-fade-in">
      <section class="hero collab-hero">
        <div class="glow-bg"></div>
        
        <div class="collab-logos">
          <img src="/assets/logo-mundial.webp" alt="Mundial 2026" class="collab-logo collab-mundial drop-shadow-glow">
          <span class="collab-x">✕</span>
          <img src="/assets/logo-mixon-clear.png" alt="Mix On" class="collab-logo collab-mixon drop-shadow-glow">
        </div>

        <h1 class="hero-title">SEGUÍ TODO EL MUNDIAL CON <span class="slogan-brand">MIX ON</span></h1>
        <p class="hero-subtitle">
          La plataforma definitiva para vivir la Copa del Mundo 2026. Cargá tus pronósticos, compará con la comunidad y seguí cada partido en vivo.
        </p>
        <div class="hero-actions">
          ${user 
            ? `<a href="/fixture" class="btn btn-primary glass-btn play-btn-highlight" data-link>🎮 JUGAR / CARGAR PRONÓSTICOS</a>`
            : `<button id="home-login-btn" class="btn btn-primary glass-btn play-btn-highlight">👋 INICIÁ SESIÓN PARA JUGAR</button>`
          }
          <a href="/programas" class="btn btn-secondary glass-btn" data-link>POR PROGRAMA</a>
          <a href="/reglas" class="btn btn-secondary glass-btn" data-link>REGLAS</a>
        </div>
      </section>

      ${mvp ? `
        <div class="mvp-banner animate-fade-in" onclick="window.router.navigate('/perfil/${mvp.id}')" style="position: relative;">
          <div class="mvp-header">
            <div class="mvp-crown">👑</div>
            <div class="mvp-info">
              <div class="mvp-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <span>MVP de la Jornada • ${mvp.matchdayDate ? new Date(mvp.matchdayDate).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }) : ''}</span>
                <button id="btn-share-mvp" class="btn btn-sm" style="background: rgba(255, 215, 0, 0.15); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 20px; z-index: 3; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease; padding: 4px 10px;" onclick="event.stopPropagation(); window.shareMVPToChat('${mvp.id}', '${String(mvp.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${mvp.dailyPoints});" onmouseover="this.style.background='rgba(255, 215, 0, 0.25)'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='rgba(255, 215, 0, 0.15)'; this.style.transform='scale(1)'">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: normal;">Comentar en el chat</span>
                </button>
              </div>
              <div class="mvp-name">${mvp.name}</div>
              <div class="mvp-points">
                <span class="pts-val">${mvp.dailyPoints}</span> <span class="pts-lbl">pts diarios</span>
                <span style="margin: 0 10px; color: rgba(255,255,255,0.3);">|</span>
                <span class="pts-val">${mvp.dailyExacts || 0}</span> <span class="pts-lbl">plenos</span>
              </div>
            </div>
          </div>
          <div class="mvp-body">
            <img src="${mvp.photo}" alt="${String(mvp.name || '').replace(/"/g, '&quot;')}" class="mvp-photo">
            <div class="mvp-stats">
              <p>¡El participante con mejor rendimiento en los últimos partidos!</p>
              <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                ${mvp.matchesInfo?.slice(0,2).map(m => `
                  <div style="background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 8px; font-size: 0.85rem; display: flex; justify-content: space-between;">
                    <span>${m.home} vs ${m.away}</span>
                    <span style="color: ${m.points > 0 ? '#4caf50' : '#f44336'}; font-weight: 600;">+${m.points} pts</span>
                  </div>
                `).join('') || ''}
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <section class="rankings animate-fade-in" style="animation-delay: 0.1s;">
        <h2 class="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          Tabla de Posiciones
        </h2>
        
        <div class="filter-tabs">
          <button class="btn ${currentRankingFilter === 'general' ? 'btn-primary' : 'btn-secondary'} home-filter" data-filter="general">General</button>
          <button class="btn ${currentRankingFilter === 'conductores' ? 'btn-primary' : 'btn-secondary'} home-filter" data-filter="conductores">Conductores</button>
          <button class="btn ${currentRankingFilter === 'staff' ? 'btn-primary' : 'btn-secondary'} home-filter" data-filter="staff">Staff</button>
          <button class="btn ${currentRankingFilter === 'viewers' ? 'btn-primary' : 'btn-secondary'} home-filter" data-filter="viewers">Viewers</button>
          <button class="btn ${currentRankingFilter === 'programas' ? 'btn-primary' : 'btn-secondary'} home-filter" data-filter="programas">Programas</button>
        </div>

        <div id="ranking-table-container">
          ${rankingHtml}
        </div>
      </section>
    </div>
  `;
}

export function attachHomeEvents() {
  const loginBtn = document.getElementById('home-login-btn');
  if (loginBtn && !loginBtn.dataset.eventsAttached) {
    loginBtn.dataset.eventsAttached = 'true';
    loginBtn.addEventListener('click', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserExists(result.user);
        window.history.pushState(null, null, '/fixture');
        window.router();
      } catch (error) {
        console.error("Login falló", error);
        alert("Ocurrió un error al iniciar sesión.");
      }
    });
  }

  const buttons = document.querySelectorAll('.home-filter');
  buttons.forEach(button => {
    if (button.dataset.eventsAttached) return;
    button.dataset.eventsAttached = 'true';
    
    button.addEventListener('click', () => {
      currentRankingFilter = button.dataset.filter;
      window.router();
    });
  });
}
