// src/pages/Fixture.js
import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { getMatchResult } from '../services/prodeStore.js';

export function Fixture() {
  // Sort matches chronologically
  const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Group by date (day)
  const grouped = {};
  sorted.forEach(match => {
    const dateObj = new Date(match.date);
    // Use Argentina timezone for grouping
    const dayKey = dateObj.toLocaleDateString('es-AR', { 
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(match);
  });

  const matchCards = Object.entries(grouped).map(([day, dayMatches]) => {
    const cards = dayMatches.map(match => {
      const result = getMatchResult(match.id);
      return MatchCard(match, result);
    }).join('');
    
    return `
      <div class="fixture-day">
        <div class="fixture-day-header">
          <span class="fixture-day-icon">📅</span>
          <h3 class="fixture-day-title">${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
        </div>
        <div class="fixture-day-matches">
          ${cards}
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="fixture-page">
      <h1 class="page-title animate-fade-in">Fixture Mundial 2026</h1>
      <p class="page-subtitle animate-fade-in" style="color: var(--text-secondary); margin-bottom: 2rem;">Todos los partidos en horario de Argentina 🇦🇷</p>
      
      <div class="fixture-filters animate-fade-in">
        <button class="btn btn-primary fixture-filter" data-filter="all">Todos</button>
        <button class="btn btn-secondary fixture-filter" data-filter="groups">Grupos</button>
        <button class="btn btn-secondary fixture-filter" data-filter="knockout">Eliminatorias</button>
        <button class="btn btn-secondary fixture-filter" data-filter="argentina">🇦🇷 Argentina</button>
      </div>

      <div id="fixture-list">
        ${matchCards}
      </div>
      <p id="fixture-empty" class="empty-state" style="display:none;">No se encontraron partidos para este filtro.</p>
    </section>
  `;
}
