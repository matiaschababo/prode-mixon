// src/pages/Home.js
import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants } from '../services/prodeStore.js';

export function Home() {
  return `
    <div class="home-page animate-fade-in">
      <section class="hero">
        <h1 class="hero-title">PRODE MUNDIAL 2026</h1>
        <p class="hero-subtitle">
          Seguí en vivo el torneo de predicciones entre todos los conductores de Mix On.
        </p>
        <div class="hero-actions">
          <a href="/fixture" class="btn btn-primary btn-sm" data-link>Ver Fixture</a>
          <a href="/programas" class="btn btn-secondary btn-sm" data-link>Por Programa</a>
          <a href="/puntajes" class="btn btn-secondary btn-sm" data-link>Puntajes</a>
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
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      
      buttons.forEach(btn => {
        btn.classList.toggle('btn-primary', btn === button);
        btn.classList.toggle('btn-secondary', btn !== button);
      });

      let participants = getRankedParticipants();

      if (filter === 'conductores') {
        participants = participants.filter(p => 
          p.program !== 'viewers' && p.role !== 'Productor' && p.role !== 'Operador' && p.role !== 'Master Admin'
        );
      } else if (filter === 'staff') {
        participants = participants.filter(p => 
          p.role === 'Productor' || p.role === 'Operador'
        );
      } else if (filter === 'viewers') {
        participants = participants.filter(p => p.role === 'Viewer' || p.program === 'viewers');
      }

      container.innerHTML = RankingTable(participants);
    });
  });
}
