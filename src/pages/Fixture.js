import { matches } from '../data/matches.js';
import { MatchCard } from '../components/MatchCard.js';
import { getMatchResult, getPredictions, saveMyPrediction, ensureUserExists } from '../services/prodeStore.js';
import { auth, googleProvider, signInWithPopup } from '../services/firebase.js';
import { getResolvedBracket } from '../services/bracketResolver.js';

export function Fixture() {
  const resolvedBracket = getResolvedBracket();
  
  const mappedMatches = matches.map(m => {
    if (m.stage !== 'Group Stage' && resolvedBracket[m.id]) {
      const slot = resolvedBracket[m.id];
      return {
        ...m,
        homeTeam: slot.home ? slot.home.id : (slot.homeLabel || m.homeTeam),
        awayTeam: slot.away ? slot.away.id : (slot.awayLabel || m.awayTeam),
      };
    }
    return m;
  });

  const sorted = [...mappedMatches].sort((a, b) => new Date(a.date) - new Date(b.date));
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

  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setUTCHours(d.getUTCHours() - 10);
    return d.toISOString().split('T')[0];
  };

  const matchCards = Object.entries(grouped).map(([day, dayMatches]) => {
    const logicalDateStr = getLogicalDate(dayMatches[0].date);

    const cards = dayMatches.map(match => {
      const result = getMatchResult(match);
      const userPred = user ? (allPredictions[match.id]?.[window.resolveUid ? window.resolveUid(user.uid) : user.uid] || {}) : null;
      return MatchCard(match, result, userPred);
    }).join('');
    
    return `
      <div class="fixture-day" data-date="${logicalDateStr}">
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
      <div id="fixture-empty" class="empty-state" style="display:none;">
        <div class="empty-state-icon">🏟️</div>
        <div class="empty-state-title">No hay partidos</div>
        <p>No se encontraron partidos para este filtro.</p>
      </div>
      
      <!-- FAB Ir a Hoy -->
      <button id="fab-hoy" class="btn btn-primary" style="
        position: fixed; 
        bottom: 20px; 
        left: 50%; 
        transform: translateX(-50%); 
        z-index: 999; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        border-radius: 99px;
        background: linear-gradient(135deg, #2ed573, #00b09b);
        color: white;
        border: none;
        padding: 0.6rem 1.5rem;
        font-size: 0.9rem;
      ">
        👇 Ir a Hoy
      </button>
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

  const fabHoy = document.getElementById('fab-hoy');
  if (fabHoy && !fabHoy.dataset.eventsAttached) {
    fabHoy.dataset.eventsAttached = 'true';
    fabHoy.addEventListener('click', () => {
      const btnAll = document.querySelector('.fixture-filter[data-filter="all"]');
      if (btnAll && !btnAll.classList.contains('btn-primary')) {
         btnAll.click();
      }

      const getLogicalDateStr = (date) => {
        const d = new Date(date);
        d.setUTCHours(d.getUTCHours() - 10);
        return d.toISOString().split('T')[0];
      };

      const todayLogicalStr = getLogicalDateStr(new Date());

      const days = document.querySelectorAll('.fixture-day');
      let targetEl = null;

      for (const day of days) {
        const dayDate = day.dataset.date;
        if (dayDate >= todayLogicalStr) {
          targetEl = day;
          break;
        }
      }

      if (targetEl) {
        const y = targetEl.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

  // Listen for input changes to toggle the advances selector if it's a draw
  document.querySelectorAll('.pred-input').forEach(input => {
    if (input.dataset.eventsAttached) return;
    input.dataset.eventsAttached = 'true';
    input.addEventListener('input', (e) => {
      const area = e.target.closest('.pred-area');
      const home = area.querySelector('.my-pred-home').value;
      const away = area.querySelector('.my-pred-away').value;
      const selector = area.querySelector('.advances-selector');
      if (selector) {
        if (home !== '' && away !== '' && home === away) {
          selector.style.display = 'block';
        } else {
          selector.style.display = 'none';
        }
      }
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

      let advances = null;
      const selector = area.querySelector('.advances-selector');
      if (selector && selector.style.display === 'block') {
        const checked = area.querySelector('.advances-radio:checked');
        if (!checked) {
          alert('En caso de empate en fase eliminatoria, debés elegir quién clasifica.');
          return;
        }
        advances = checked.value;
      }

      try {
        await saveMyPrediction(matchId, home, away, advances);
        
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
