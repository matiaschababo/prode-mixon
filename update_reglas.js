const fs = require('fs');

// Update main.js
let mainJs = fs.readFileSync('src/main.js', 'utf-8');
mainJs = mainJs.replace("import { Puntajes } from './pages/Puntajes.js';", "import { Reglas } from './pages/Reglas.js';");
mainJs = mainJs.replace("'/puntajes': Puntajes,", "'/reglas': Reglas,");
fs.writeFileSync('src/main.js', mainJs);

// Update Navbar.js
let navbarJs = fs.readFileSync('src/components/Navbar.js', 'utf-8');
navbarJs = navbarJs.replace('<a href="/puntajes" class="nav-link" data-link>Puntajes</a>', '<a href="/reglas" class="nav-link" data-link>Reglamento</a>');
fs.writeFileSync('src/components/Navbar.js', navbarJs);

// Update Reglas.js
let reglasJs = fs.readFileSync('src/pages/Reglas.js', 'utf-8');
reglasJs = reglasJs.replace('export function Puntajes() {', 'export function Reglas() {');
reglasJs = reglasJs.replace('<p class="eyebrow">Sistema de puntos</p>', '<p class="eyebrow">Reglamento Oficial</p>');
reglasJs = reglasJs.replace('</h1>', '</h1>\n          <p style="color: var(--text-secondary); margin-top: 1rem; font-size: 1.1rem; max-width: 600px;">Conocé cómo sumar puntos, los multiplicadores por fase, los desempates y los logros exclusivos.</p>');

const newSections = `
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
            <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6;">Si dos o más participantes tienen los mismos puntos totales en la tabla, el sistema desempatará automáticamente priorizando a quien tenga más resultados exactos. Si persite el empate, ganará el que haya acumulado más minutos de anticipación al cargar sus pronósticos.</p>
          </div>
        </div>
      </section>

      <section class="score-cases" style="margin-top: 3rem;">
        <div style="grid-column: 1 / -1; margin-bottom: 1rem;">
          <p class="eyebrow">Colección</p>
          <h2>Medallas y Rachas</h2>
        </div>
        <article style="border-top-color: #ffd700;">
          <span class="case-label">MVP x3 🏆</span>
          <h3>Leyenda Diaria</h3>
          <p>Se otorga al ganar el MVP de la jornada 3 veces a lo largo del torneo.</p>
        </article>
        <article style="border-top-color: #ff4757;">
          <span class="case-label">Racha de Fuego ☄️</span>
          <h3>Implacable</h3>
          <p>Mantener una racha de 5 partidos consecutivos sumando al menos 1 punto. Si no cargás un pronóstico, la racha se rompe.</p>
        </article>
        <article style="border-top-color: #9b59b6;">
          <span class="case-label">El Oráculo 🔮</span>
          <h3>Visionario</h3>
          <p>Conseguir 10 resultados EXACTOS a lo largo del torneo. Solo para los verdaderos adivinos.</p>
        </article>
        <article style="border-top-color: #f39c12;">
          <span class="case-label">Buzzer Beater ⏳</span>
          <h3>Sobre la hora</h3>
          <p>Cargar tu pronóstico menos de 5 minutos antes de que empiece el partido.</p>
        </article>
      </section>
`;

reglasJs = reglasJs.replace('</div>\n      </section>\n\n      <section class="score-decision glass-card">', '</div>\n      </section>\n' + newSections + '\n      <section class="score-decision glass-card">');

fs.writeFileSync('src/pages/Reglas.js', reglasJs);
