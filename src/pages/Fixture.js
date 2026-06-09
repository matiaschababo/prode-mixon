// src/pages/Fixture.js
import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';

export function Fixture() {
  const matchesHTML = matches.map(match => MatchCard(match)).join('');

  return `
    <div class="fixture-page animate-fade-in">
      <h1 style="margin-bottom: 2rem;">Fixture Mundial 2026</h1>
      
      <div class="filters" style="display: flex; gap: 1rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem;">
        <button class="btn btn-primary">Todos</button>
        <button class="btn btn-secondary">Grupos</button>
        <button class="btn btn-secondary">Eliminatorias</button>
        <button class="btn btn-secondary">Argentina 🇦🇷</button>
      </div>

      <div class="grid-3">
        ${matchesHTML}
      </div>
    </div>
  `;
}
