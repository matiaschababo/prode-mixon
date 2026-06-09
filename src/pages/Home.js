// src/pages/Home.js
import { RankingTable } from '../components/RankingTable.js';
import { participants } from '../data/participants.js';

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
        </div>
      </section>

      <section class="ranking-section">
        <h2 style="margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--color-mixon-light)">🏆</span> Ranking General
        </h2>
        ${RankingTable(participants)}
      </section>
    </div>
  `;
}
