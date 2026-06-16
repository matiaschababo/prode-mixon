import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants, ensureUserExists, getDailyMVP, getMatchResult } from '../services/prodeStore.js';
import { auth, googleProvider, signInWithPopup } from '../services/firebase.js';
import { getProgramChartHTML } from './Programas.js';
import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';

export function Home() {
  const user = auth.currentUser;
  return `
    <div class="home-page animate-fade-in">
      ${(() => {
        const now = new Date();
        now.setUTCHours(now.getUTCHours() - 4);
        const todayLogicalStr = now.toISOString().split('T')[0];
        
        const getLogicalDate = (dateString) => {
          const d = new Date(dateString);
          d.setUTCHours(d.getUTCHours() - 4);
          return d.toISOString().split('T')[0];
        };

        let tickerMatches = matches.filter(m => getLogicalDate(m.date) === todayLogicalStr);
        if (tickerMatches.length === 0) {
          const futureMatches = matches.filter(m => new Date(m.date) > new Date());
          if (futureMatches.length > 0) {
            const nextDayStr = getLogicalDate(futureMatches[0].date);
            tickerMatches = matches.filter(m => getLogicalDate(m.date) === nextDayStr);
          } else {
             const lastDayStr = getLogicalDate(matches[matches.length - 1].date);
             tickerMatches = matches.filter(m => getLogicalDate(m.date) === lastDayStr);
          }
        }

        if (tickerMatches.length === 0) return '';

        const tickerItems = tickerMatches.map(m => {
          const homeTeam = teams[m.homeTeam] || { name: m.homeTeam, flag: "❓" };
          const awayTeam = teams[m.awayTeam] || { name: m.awayTeam, flag: "❓" };
          const res = getMatchResult(m);
          
          let statusText = '';
          let middle = 'vs';
          
          if (res) {
             middle = `${res.home} - ${res.away}`;
             if (res.live) {
                statusText = `<span style="color: #4cd137; font-weight: bold; margin-left: 0.5rem; animation: pulse 2s infinite;">EN VIVO</span>`;
             } else {
                statusText = `<span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: 0.5rem; font-weight: bold;">FIN</span>`;
             }
          } else {
             const d = new Date(m.date);
             const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
             statusText = `<span style="color: #ffd700; margin-left: 0.5rem; font-weight: 600;">HOY ${timeStr}</span>`;
          }

          return `<div class="ticker-item" style="display: inline-flex; align-items: center; margin-right: 2.5rem; font-size: 0.95rem;">
            <span style="margin-right: 0.5rem; font-weight: 600;">${homeTeam.flag} ${homeTeam.name.toUpperCase()}</span>
            <span style="font-weight: 800; background: rgba(255,255,255,0.1); padding: 0.2rem 0.6rem; border-radius: 4px;">${middle}</span>
            <span style="margin-left: 0.5rem; font-weight: 600;">${awayTeam.name.toUpperCase()} ${awayTeam.flag}</span>
            ${statusText}
          </div>`;
        }).join('');

        return `
          <div class="news-ticker-container" style="width: 100%; overflow: hidden; background: rgba(10, 10, 15, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding: 0.5rem 0; white-space: nowrap; position: relative;">
            <div class="news-ticker" style="display: inline-block; animation: marquee-scroll 30s linear infinite; padding-left: 100%;">
              ${tickerItems}
            </div>
          </div>
        `;
      })()}
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
          <a href="/puntajes" class="btn btn-secondary glass-btn" data-link>PUNTAJES</a>
        </div>
      </section>

      ${(() => {
        const mvp = getDailyMVP();
        if (!mvp) return '';
        return `
          <div class="mvp-banner animate-fade-in" onclick="window.router.navigate('/perfil/${mvp.id}')">
            <div class="mvp-header">
              <div class="mvp-crown">👑</div>
              <div class="mvp-info">
                <div class="mvp-title">MVP de la Jornada • ${mvp.matchdayDate ? new Date(mvp.matchdayDate).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }) : ''}</div>
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
                <div class="mvp-match-badge ${isExact ? 'mvp-match-exact' : 'mvp-match-normal'}">
                  <span style="color: white; font-weight: 600;">${teams[info.match.homeTeam]?.flag || ''} ${info.match.homeTeam} ${info.prediction.home}-${info.prediction.away} ${info.match.awayTeam} ${teams[info.match.awayTeam]?.flag || ''}</span>
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
