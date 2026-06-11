// src/pages/Home.js
import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants } from '../services/prodeStore.js';

export function Home() {
  return `
    <div class="home-page animate-fade-in">
      <section class="hero collab-hero">
        <div class="glow-bg"></div>
        
        <div class="collab-logos">
          <img src="/assets/logo-mundial.webp" alt="Mundial 2026" class="collab-logo collab-mundial drop-shadow-glow">
          <span class="collab-x">✕</span>
          <img src="/assets/logo-mixon-clear.png" alt="Mix On" class="collab-logo collab-mixon drop-shadow-glow">
        </div>

        <h1 class="hero-title">SEGUÍ TODO EL MUNDIAL CON MIX ON</h1>
        <p class="hero-subtitle">
          La plataforma definitiva para vivir la Copa del Mundo 2026. Cargá tus pronósticos, compará con la comunidad y seguí cada partido en vivo.
        </p>
        <div class="hero-actions">
          <a href="/fixture" class="btn btn-primary glass-btn" data-link>VER FIXTURE</a>
          <a href="/programas" class="btn btn-secondary glass-btn" data-link>POR PROGRAMA</a>
          <a href="/puntajes" class="btn btn-secondary glass-btn" data-link>PUNTAJES</a>
        </div>
      </section>

      <div class="home-features grid-3 animate-fade-in" style="margin-bottom: 3rem;">
        <div class="glass-card feature-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2rem; filter: drop-shadow(0 0 10px rgba(155, 89, 182, 0.4));">🔮</span>
          <h3 style="font-size: 1.1rem; color: var(--color-mixon-light); margin: 0; font-family: var(--font-display); font-weight: 800;">Pronósticos</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">Cargá tus pronósticos antes del partido y sumá puntos para subir en el ranking.</p>
        </div>
        <div class="glass-card feature-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2rem; filter: drop-shadow(0 0 10px rgba(155, 89, 182, 0.4));">👥</span>
          <h3 style="font-size: 1.1rem; color: var(--color-mixon-light); margin: 0; font-family: var(--font-display); font-weight: 800;">Comparar Votos</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">Hacél clic en <strong>"Comparar pronósticos"</strong> en cualquier tarjeta para ver qué votó el resto.</p>
        </div>
        <div class="glass-card feature-card" style="padding: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2rem; filter: drop-shadow(0 0 10px rgba(155, 89, 182, 0.4));">🔴</span>
          <h3 style="font-size: 1.1rem; color: var(--color-mixon-light); margin: 0; font-family: var(--font-display); font-weight: 800;">Eventos en Vivo</h3>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">Goles, rojas y cronómetro actualizados al instante en tiempo real.</p>
        </div>
      </div>

      <section class="ranking-section">
        <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
          <span style="color: var(--color-mixon-light)">🏆</span> Rankings
        </h2>
        
        <div class="filter-tabs">
          <button class="btn btn-primary home-filter" data-filter="general">General</button>
          <button class="btn btn-secondary home-filter" data-filter="conductores">Conductores</button>
          <button class="btn btn-secondary home-filter" data-filter="staff">Staff</button>
          <button class="btn btn-secondary home-filter" data-filter="viewers">Viewers</button>
        </div>

        <div id="ranking-table-container">
          ${RankingTable(getRankedParticipants())}
        </div>
      </section>
    </div>
  `;
}

export function attachHomeEvents() {
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
