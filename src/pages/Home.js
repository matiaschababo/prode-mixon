// src/pages/Home.js
import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants } from '../services/prodeStore.js';

export function Home() {
  return `
    <div class="home-page animate-fade-in">
      <section class="hero" style="text-align: center; padding: 4rem 0;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(135deg, var(--color-mixon-main), var(--color-mixon-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PRODE MUNDIAL 2026</h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); max-width: 600px; margin: 0 auto 2rem;">
          Seguí en vivo el torneo de predicciones entre todos los conductores de Mix On.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <a href="/fixture" class="btn btn-primary" data-link>Ver Fixture</a>
          <a href="/programas" class="btn btn-secondary" data-link>Ver por Programa</a>
          <a href="/puntajes" class="btn btn-secondary" data-link>Cómo se suma</a>
        </div>
      </section>

      <section class="ranking-section">
        <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
          <span style="color: var(--color-mixon-light)">🏆</span> Rankings
        </h2>
        
        <div class="filter-tabs" style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;">
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
