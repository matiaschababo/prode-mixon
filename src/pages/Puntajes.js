import { MULTIPLIERS } from '../services/scoring.js';

export function Puntajes() {
  const phaseCards = Object.entries(MULTIPLIERS)
    .map(([phase, multiplier]) => `
      <div class="score-phase-card">
        <span>${phase}</span>
        <strong>x${multiplier}</strong>
      </div>
    `).join('');

  return `
    <div class="puntajes-page animate-fade-in">
      <section class="score-hero">
        <div>
          <p class="eyebrow">Sistema de puntos</p>
          <h1>Acertar mejor vale más. Acertar en fases grandes vale muchísimo más.</h1>
        </div>
        <div class="score-wheel" aria-label="Resumen visual de puntajes">
          <div class="score-chip exact">3</div>
          <div class="score-chip diff">2</div>
          <div class="score-chip winner">1</div>
          <div class="score-chip miss">0</div>
        </div>
      </section>

      <section class="score-grid">
        <article class="score-rule exact">
          <span class="score-number">3</span>
          <h2>Marcador exacto</h2>
          <p>Dijo 2-1 y terminó 2-1. Puntaje completo.</p>
        </article>
        <article class="score-rule diff">
          <span class="score-number">2</span>
          <h2>Ganador + diferencia</h2>
          <p>Dijo 3-1 y terminó 2-0. Mismo ganador, misma distancia.</p>
        </article>
        <article class="score-rule winner">
          <span class="score-number">1</span>
          <h2>Ganador o empate</h2>
          <p>No clavó el resultado, pero sí el signo del partido.</p>
        </article>
        <article class="score-rule miss">
          <span class="score-number">0</span>
          <h2>No acertó</h2>
          <p>El partido fue para otro lado. No suma.</p>
        </article>
      </section>

      <section class="score-example glass-card">
        <div>
          <p class="eyebrow">Ejemplo rápido</p>
          <h2>Si en semifinales clavás un 2-1 exacto:</h2>
        </div>
        <div class="score-formula">
          <span>3 pts</span>
          <b>×</b>
          <span>x3</span>
          <b>=</b>
          <strong>9 pts</strong>
        </div>
      </section>

      <section>
        <h2 style="margin-bottom: 1rem;">Multiplicadores por fase</h2>
        <div class="score-phases">
          ${phaseCards}
        </div>
      </section>
    </div>
  `;
}
