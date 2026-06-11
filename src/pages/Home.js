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

        <h1 class="hero-title">EL TORNEO DEFINITIVO</h1>
        <p class="hero-subtitle">
          Seguí en vivo el torneo de predicciones entre todos los conductores, staff y viewers de Mix On.
        </p>
        <div class="hero-actions">
          <a href="/fixture" class="btn btn-primary glass-btn" data-link>VER FIXTURE</a>
          <a href="/programas" class="btn btn-secondary glass-btn" data-link>POR PROGRAMA</a>
          <a href="/puntajes" class="btn btn-secondary glass-btn" data-link>PUNTAJES</a>
        </div>
      </section>

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
