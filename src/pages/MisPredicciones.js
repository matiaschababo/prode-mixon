import { matches } from '../data/matches.js';
import { getPredictions, getResults, saveMyPrediction } from '../services/prodeStore.js';
import { auth } from '../services/firebase.js';

export function MisPredicciones() {
  const user = auth.currentUser;
  if (!user) {
    return `
      <div class="container animate-fade-in text-center" style="padding-top: 4rem;">
        <h2>Debes iniciar sesión para ver tus predicciones.</h2>
      </div>
    `;
  }

  const allPredictions = getPredictions();
  const results = getResults();
  
  // Sort matches chronologically
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  const matchFormsHTML = sortedMatches.map((match, index) => {
    const isPast = new Date() >= new Date(match.date);
    const userPred = allPredictions[match.id]?.[user.uid] || { home: '', away: '' };
    const result = results[match.id];
    
    // Si el partido ya pasó, deshabilitar inputs
    const disabled = isPast ? 'disabled' : '';
    const dateStr = new Date(match.date).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

    return `
      <div class="glass-card match-card animate-slide-up" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s; ${isPast ? 'opacity: 0.7;' : ''}">
        <div class="match-header">
          <span class="match-stage">${match.round}</span>
          <span class="match-date">${dateStr}</span>
        </div>
        <div class="match-teams" style="justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; justify-content: flex-end;">
            <span class="team-name" style="font-weight: 600;">${match.homeTeam}</span>
            <input type="number" min="0" class="pred-input my-pred-home" data-match="${match.id}" value="${userPred.home ?? ''}" ${disabled} style="width: 50px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; padding: 0.5rem;">
          </div>
          <span style="color: var(--text-secondary);">vs</span>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; justify-content: flex-start;">
            <input type="number" min="0" class="pred-input my-pred-away" data-match="${match.id}" value="${userPred.away ?? ''}" ${disabled} style="width: 50px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; padding: 0.5rem;">
            <span class="team-name" style="font-weight: 600;">${match.awayTeam}</span>
          </div>
        </div>
        ${isPast ? '<div style="text-align: center; font-size: 0.8rem; color: #ff4757; margin-top: 1rem;">Partido cerrado</div>' : ''}
        ${result ? `<div style="text-align: center; font-size: 0.9rem; color: #2ed573; margin-top: 0.5rem; font-weight: bold;">Resultado Final: ${result.home} - ${result.away}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <section class="mis-predicciones-page animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1 class="page-title">Mis Predicciones</h1>
          <p class="page-subtitle" style="color: var(--text-secondary);">Completá tus pronósticos antes de que empiece cada partido. Se guardan automáticamente.</p>
        </div>
      </div>
      
      <div class="matches-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
        ${matchFormsHTML}
      </div>
    </section>
  `;
}

export function attachMisPrediccionesEvents() {
  document.querySelectorAll('.pred-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const matchId = e.target.dataset.match;
      const card = e.target.closest('.match-card');
      const home = card.querySelector('.my-pred-home').value;
      const away = card.querySelector('.my-pred-away').value;
      
      try {
        await saveMyPrediction(matchId, home, away);
        // Efecto visual de guardado
        e.target.style.borderColor = '#2ed573';
        setTimeout(() => e.target.style.borderColor = 'rgba(255,255,255,0.2)', 1000);
      } catch (err) {
        alert("Error al guardar: " + err.message);
        e.target.value = ''; // Reset on error
      }
    });
  });
}
