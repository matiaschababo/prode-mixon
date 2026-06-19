import { MULTIPLIERS } from '../services/scoring.js';

export function Reglas() {
  const phaseTranslations = {
    "Group Stage": "Fase de Grupos",
    "Round of 32": "16avos de Final",
    "Round of 16": "Octavos de Final",
    "Quarterfinals": "Cuartos de Final",
    "Semifinals": "Semifinales",
    "Third Place": "Tercer Puesto",
    "Final": "Final"
  };

  const phaseCards = Object.entries(MULTIPLIERS)
    .map(([phase, multiplier]) => `
      <div class="score-phase-card">
        <span>${phaseTranslations[phase] || phase}</span>
        <strong>x${multiplier}</strong>
      </div>
    `).join('');

  return `
    <div class="puntajes-page animate-fade-in">
      <section class="score-hero">
        <div>
          <p class="eyebrow">Reglamento Oficial</p>
          <h1>Acertar mejor vale más. Acertar en fases grandes vale muchísimo más.</h1>
          <p style="color: var(--text-secondary); margin-top: 1rem; font-size: 1.1rem; max-width: 600px;">Conocé cómo sumar puntos, los multiplicadores por fase, los desempates del Ranking Global y los logros exclusivos.</p>
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
          <p>Dijo 2-1 y terminó 2-1. Clavó los goles de los dos equipos.</p>
        </article>
        <article class="score-rule diff">
          <span class="score-number">2</span>
          <h2>Ganador + diferencia</h2>
          <p>Dijo 3-1 y terminó 2-0. Mismo ganador, misma distancia: ganó por 2.</p>
        </article>
        <article class="score-rule winner">
          <span class="score-number">1</span>
          <h2>Ganador o empate</h2>
          <p>Dijo que ganaba Argentina o dijo empate, y ese signo se cumplió.</p>
        </article>
        <article class="score-rule miss">
          <span class="score-number">0</span>
          <h2>No acertó</h2>
          <p>El partido fue para otro lado. No suma.</p>
        </article>
      </section>

      <section class="score-decision glass-card">
        <div>
          <p class="eyebrow">Cómo se decide</p>
          <h2>Se revisa de arriba hacia abajo</h2>
        </div>
        <div class="decision-ladder">
          <div><strong>1</strong><span>¿Marcador exacto?</span><b>3 pts</b></div>
          <div><strong>2</strong><span>¿Ganador y diferencia?</span><b>2 pts</b></div>
          <div><strong>3</strong><span>¿Ganador o empate?</span><b>1 pt</b></div>
          <div><strong>4</strong><span>¿Nada de eso?</span><b>0 pts</b></div>
        </div>
      </section>

      <section class="score-decision glass-card" style="margin-top: 3rem;">
        <div>
          <p class="eyebrow">Desempates y MVP</p>
          <h2>El camino a la gloria</h2>
        </div>
        <div style="display: grid; gap: 1.5rem; margin-top: 2rem;">
          <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #ffd700;">
            <h3 style="color: #ffd700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">👑 MVP de la Jornada</h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">Al finalizar todos los partidos del día (horario UTC), el jugador con más puntos se corona MVP. Si hay empate, se decide por:</p>
            <ol style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem; margin-left: 1.5rem;">
              <li>Mayor cantidad de resultados exactos en esa jornada.</li>
              <li>Menor tiempo de anticipación (el que cargó sus pronósticos primero).</li>
            </ol>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--accent-blue);">
            <h3 style="color: white; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">🥇 Ranking Global</h3>
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">Si dos o más participantes tienen los mismos puntos totales en la tabla, el sistema desempatará automáticamente priorizando a quien tenga más resultados exactos. Si persite el empate, ganará el que haya acumulado más minutos de anticipación al cargar sus pronósticos a lo largo del torneo.</p>
          </div>
        </div>
      </section>

      <section class="score-cases" style="margin-top: 3rem;">
        <div style="grid-column: 1 / -1; margin-bottom: 1rem;">
          <p class="eyebrow">Colección</p>
          <h2>Medallas y Rachas</h2>
        </div>
        <article class="medal-card" style="--medal-color: 255, 215, 0;">
          <div class="medal-icon-wrapper">🏆</div>
          <div class="medal-content">
            <span class="medal-label" style="color: rgb(255, 215, 0);">MVP x3</span>
            <h3>Leyenda Diaria</h3>
            <p>Se otorga al ganar el MVP de la jornada 3 veces a lo largo del torneo.</p>
          </div>
        </article>
        <article class="medal-card" style="--medal-color: 255, 71, 87;">
          <div class="medal-icon-wrapper">☄️</div>
          <div class="medal-content">
            <span class="medal-label" style="color: rgb(255, 71, 87);">Racha de Fuego</span>
            <h3>Implacable</h3>
            <p>Mantener una racha de 5 partidos consecutivos sumando al menos 1 punto. Si no cargás un pronóstico, la racha se rompe y vuelve a 0.</p>
          </div>
        </article>
        <article class="medal-card" style="--medal-color: 155, 89, 182;">
          <div class="medal-icon-wrapper">🔮</div>
          <div class="medal-content">
            <span class="medal-label" style="color: rgb(155, 89, 182);">El Oráculo</span>
            <h3>Visionario</h3>
            <p>Conseguir 10 resultados EXACTOS a lo largo del torneo. Solo para los verdaderos adivinos.</p>
          </div>
        </article>
        <article class="medal-card" style="--medal-color: 243, 156, 18;">
          <div class="medal-icon-wrapper">⏳</div>
          <div class="medal-content">
            <span class="medal-label" style="color: rgb(243, 156, 18);">Buzzer Beater</span>
            <h3>Sobre la hora</h3>
            <p>Cargar tu pronóstico menos de 5 minutos antes de que empiece el partido.</p>
          </div>
        </article>
      </section>

      <section class="score-cases">
        <article>
          <span class="case-label">Ganador + diferencia</span>
          <h3>Predicción 3-1 · Real 2-0</h3>
          <p>Gana el mismo equipo y la diferencia es +2. Suma 2.</p>
        </article>
        <article>
          <span class="case-label">Solo ganador</span>
          <h3>Predicción 2-0 · Real 1-0</h3>
          <p>Ganó el mismo equipo, pero por otra diferencia. Suma 1.</p>
        </article>
        <article>
          <span class="case-label">Empates</span>
          <h3>Predicción 1-1 · Real 2-2</h3>
          <p>No es exacto, pero acertó empate. Suma 1.</p>
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
