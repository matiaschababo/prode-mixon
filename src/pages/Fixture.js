import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { getMatchResult, getPredictions, saveMyPrediction } from '../services/prodeStore.js';
import { auth } from '../services/firebase.js';

export function Fixture() {
  const sorted = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  const user = auth.currentUser;
  const allPredictions = getPredictions();
  
  const grouped = {};
  sorted.forEach(match => {
    const dateObj = new Date(match.date);
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
      const result = getMatchResult(match);
      const userPred = user ? (allPredictions[match.id]?.[user.uid] || {}) : null;
      return MatchCard(match, result, userPred);
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
      <p class="page-subtitle animate-fade-in" style="color: var(--text-secondary); margin-bottom: 2rem;">
        Todos los partidos en tu horario local 🌍<br>
        ${user ? 'Podés cargar tus resultados directamente en las tarjetas de los partidos que no hayan empezado.' : 'Ingresá con tu cuenta para poder cargar tus predicciones.'}
      </p>
      
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

export function attachFixtureEvents() {
  document.querySelectorAll('.pred-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const matchId = e.target.dataset.match;
      const card = e.target.closest('.match-card');
      const home = card.querySelector('.my-pred-home').value;
      const away = card.querySelector('.my-pred-away').value;
      
      try {
        await saveMyPrediction(matchId, home, away);
        e.target.style.borderColor = '#2ed573';
        setTimeout(() => e.target.style.borderColor = 'rgba(255,255,255,0.2)', 1000);
      } catch (err) {
        alert("Error al guardar: " + err.message);
        e.target.value = '';
      }
    });
  });
}
