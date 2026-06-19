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

      ${(() => {
        const mvp = getDailyMVP();
        if (!mvp) return '';
        return `
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
                <div class="mvp-stats">Sumó <strong>${mvp.dailyPoints} pts</strong> en ${mvp.matchCount} partidos (${mvp.dailyExacts} resultados exactos)</div>
              </div>
              <div class="mvp-photo-wrapper">
                <img src="${mvp.photo}" alt="${String(mvp.name || '').replace(/"/g, '&quot;')}" class="mvp-photo">
              </div>
            </div>
            
            ${mvp.matchesInfo && mvp.matchesInfo.length > 0 ? `
            <div class="mvp-matches">
              ${mvp.matchesInfo.map(info => {
                // Determine if it was an exact match (for styling)
                const isExact = info.points === 3 || info.points === 4 || info.points === 5; // Points depend on scoring.js, but generally >1 implies exact or correct difference.
                return `
                <div class="mvp-match-badge ${isExact ? 'mvp-match-exact' : 'mvp-match-normal'}" onclick="event.stopPropagation(); window.history.pushState(null, null, '/perfil/${mvp.id}?hl=${info.match.id}'); window.router();" style="cursor: pointer; position: relative; z-index: 2;">
                  <span style="color: white; font-weight: 600;">${teams[info.match.homeTeam]?.flag || ''} ${teams[info.match.homeTeam]?.codeEsp || info.match.homeTeam} ${info.prediction.home}-${info.prediction.away} ${teams[info.match.awayTeam]?.codeEsp || info.match.awayTeam} ${teams[info.match.awayTeam]?.flag || ''}</span>
                  <span style="color: ${isExact ? '#ffd700' : '#4cd137'}; font-weight: bold;">+${info.points}</span>
                </div>
                `;
              }).join('')}
            </div>
            ` : ''}
          </div>
        `;
      })()}


      <section class="ranking-section">
        <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
          <span style="color: var(--color-mixon-light)">🏆</span> Rankings
        </h2>
        
        <div class="filter-tabs">
          <button class="btn btn-primary home-filter" data-filter="general">General</button>
          <button class="btn btn-secondary home-filter" data-filter="conductores">Conductores</button>
          <button class="btn btn-secondary home-filter" data-filter="staff">Staff</button>
          <button class="btn btn-secondary home-filter" data-filter="viewers">Viewers</button>
          <button class="btn btn-secondary home-filter" data-filter="programas">Programas</button>
        </div>

        <div id="ranking-table-container">
          ${RankingTable(getRankedParticipants())}
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
  const container = document.getElementById('ranking-table-container');
  
  if (!buttons.length || !container) return;

  buttons.forEach(button => {
    if (button.dataset.eventsAttached) return;
    button.dataset.eventsAttached = 'true';
    
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      buttons.forEach(btn => {
        btn.classList.toggle('btn-primary', btn === button);
        btn.classList.toggle('btn-secondary', btn !== button);
      });

      if (filter === 'programas') {
        container.innerHTML = getProgramChartHTML();
        return;
      }

      let participants = getRankedParticipants();

      if (filter === 'conductores') {
        participants = participants.filter(p => p.role === 'Conductor');
      } else if (filter === 'staff') {
        participants = participants.filter(p => 
          p.role === 'Productor' || p.role === 'Operador' || p.role === 'Editor/a' || (p.program !== 'viewers' && p.role !== 'Conductor' && p.role !== 'Viewer')
        );
      } else if (filter === 'viewers') {
        participants = participants.filter(p => p.role === 'Viewer' || p.program === 'viewers');
      }

      container.innerHTML = RankingTable(participants);
    });
  });
}
