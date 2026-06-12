import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { getMatchResult, getPredictions, saveMyPrediction, ensureUserExists } from '../services/prodeStore.js';
import { auth, googleProvider, signInWithPopup } from '../services/firebase.js';

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
      <div class="page-subtitle animate-fade-in" style="color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.5;">
        Todos los partidos en tu horario local 🌍<br>
        ${!user ? `
        <div style="margin-top: 1.2rem; margin-bottom: 1.2rem; background: rgba(0, 0, 0, 0.2); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--color-mixon); text-align: center;">
          <p style="color: #fff; font-size: 1.1rem; margin-bottom: 1rem;"><strong>¡Tenés que iniciar sesión para jugar!</strong><br>Logueate para poder cargar tus predicciones y sumar puntos.</p>
          <button id="fixture-login-btn" class="btn btn-primary glass-btn play-btn-highlight" style="font-size: 1rem; padding: 0.8rem 1.5rem; text-transform: uppercase;">👋 Entrar con Google</button>
        </div>
        ` : `
        <div style="font-size: 0.88rem; color: #00E676; margin-top: 0.8rem; line-height: 1.5; padding: 0.8rem 1rem; background: rgba(0, 230, 118, 0.08); border: 1px solid rgba(0, 230, 118, 0.2); border-radius: 12px; display: flex; gap: 0.6rem; align-items: flex-start; text-align: left; box-sizing: border-box;">
          <span style="flex-shrink: 0; margin-top: 0.1rem;">🟢</span>
          <div>
            <strong>¡Jugá a tu ritmo!</strong> Podés cargar y editar tus predicciones partido a partido, hasta el minuto anterior a que empiece cada encuentro. No hace falta completar todo el fixture de una.
          </div>
        </div>
        `}
        <div style="font-size: 0.85rem; color: var(--color-mixon-light); margin-top: 0.8rem; line-height: 1.4;">
          💡 <strong>Tip:</strong> Hacé clic en <strong>"Comparar pronósticos"</strong> en cualquier tarjeta para ver qué votaron los demás participantes, o seguí los goles y eventos en vivo una vez que comience el encuentro.
        </div>
      </div>
      
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
  const loginBtn = document.getElementById('fixture-login-btn');
  if (loginBtn && !loginBtn.dataset.eventsAttached) {
    loginBtn.dataset.eventsAttached = 'true';
    loginBtn.addEventListener('click', async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await ensureUserExists(result.user);
        window.router();
      } catch (error) {
        console.error("Login falló", error);
        alert("Ocurrió un error al iniciar sesión.");
      }
    });
  }

  // "Cambiar" button — toggle the edit form
  document.querySelectorAll('.pred-change-btn').forEach(btn => {
    if (btn.dataset.eventsAttached) return;
    btn.dataset.eventsAttached = 'true';
    btn.addEventListener('click', (e) => {
      const area = e.target.closest('.pred-area');
      const saved = area.querySelector('.pred-saved');
      const form = area.querySelector('.pred-edit-form');
      const changeBtn = area.querySelector('.pred-change-btn');
      saved.style.display = 'none';
      changeBtn.style.display = 'none';
      form.style.display = 'flex';
    });
  });

  // "Guardar" button — save and update the UI
  document.querySelectorAll('.pred-save-btn').forEach(btn => {
    if (btn.dataset.eventsAttached) return;
    btn.dataset.eventsAttached = 'true';
    btn.addEventListener('click', async (e) => {
      const area = e.target.closest('.pred-area');
      const matchId = e.target.dataset.match;
      const home = area.querySelector('.my-pred-home').value;
      const away = area.querySelector('.my-pred-away').value;

      if (home === '' || away === '') {
        alert('Completá ambos marcadores para guardar tu pronóstico.');
        return;
      }

      try {
        await saveMyPrediction(matchId, home, away);
        
        // Update the UI to show saved state
        const form = area.querySelector('.pred-edit-form');
        let saved = area.querySelector('.pred-saved');
        let changeBtn = area.querySelector('.pred-change-btn');
        const cta = area.querySelector('.pred-cta');
        
        if (cta) cta.remove();

        if (!saved) {
          // First time saving — create the saved display
          saved = document.createElement('div');
          saved.className = 'pred-saved';
          saved.innerHTML = `<span class="pred-label">Tu pronóstico</span><span class="pred-value">${home} - ${away}</span>`;
          area.insertBefore(saved, form);
          
          changeBtn = document.createElement('button');
          changeBtn.className = 'btn btn-secondary btn-sm pred-change-btn';
          changeBtn.dataset.match = matchId;
          changeBtn.textContent = '✏️ Cambiar';
          area.insertBefore(changeBtn, form);
          
          changeBtn.addEventListener('click', () => {
            saved.style.display = 'none';
            changeBtn.style.display = 'none';
            form.style.display = 'flex';
          });
        } else {
          saved.querySelector('.pred-value').textContent = `${home} - ${away}`;
          saved.style.display = '';
          if (changeBtn) changeBtn.style.display = '';
        }
        
        form.style.display = 'none';
        area.classList.remove('pred-area-open');
        
        // Brief green flash on the saved value
        const val = saved.querySelector('.pred-value');
        val.style.color = '#2ed573';
        setTimeout(() => val.style.color = '', 1500);
      } catch (err) {
        alert("Error al guardar: " + err.message);
      }
    });
  });
}
