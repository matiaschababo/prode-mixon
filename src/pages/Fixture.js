// src/pages/Fixture.js
import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { getMatchResult } from '../services/prodeStore.js';

export function Fixture() {
  const matchesHTML = matches.map(match => MatchCard(match, getMatchResult(match))).join('');

  return `
    <div class="fixture-page animate-fade-in">
      <h1 style="margin-bottom: 2rem;">Fixture Mundial 2026</h1>
      
      <div class="filters" style="display: flex; gap: 1rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem;">
        <button class="btn btn-primary fixture-filter" data-filter="all">Todos</button>
        <button class="btn btn-secondary fixture-filter" data-filter="groups">Grupos</button>
        <button class="btn btn-secondary fixture-filter" data-filter="knockout">Eliminatorias</button>
        <button class="btn btn-secondary fixture-filter" data-filter="argentina">Argentina</button>
      </div>

      <div class="grid-3" id="fixture-grid">
        ${matchesHTML}
      </div>
      <p class="empty-state" id="fixture-empty" style="display: none;">No hay partidos para este filtro.</p>
    </div>
  `;
}
