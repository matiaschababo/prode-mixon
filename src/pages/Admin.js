// src/pages/Admin.js
import { matches } from '../data/matches.js';
import { participants } from '../data/participants.js';
import { teams } from '../data/teams.js';
import { getPredictions, getResults } from '../services/prodeStore.js';

export function Admin() {
  const predictions = getPredictions();
  const results = getResults();

  const matchOptions = matches.map(match => {
    const home = teams[match.homeTeam] || { name: match.homeTeam };
    const away = teams[match.awayTeam] || { name: match.awayTeam };
    return `<option value="${match.id}">${match.id}. ${home.name} vs ${away.name} - ${match.round}</option>`;
  }).join('');

  const firstMatch = matches[0];
  const firstResult = results[String(firstMatch.id)] || {};
  const predictionRows = participants.map(participant => {
    const prediction = predictions[String(firstMatch.id)]?.[participant.id] || {};
    return `
      <div class="admin-prediction-row" data-participant="${participant.id}">
        <div class="admin-person">
          <img src="${participant.photo}" class="avatar" alt="${participant.name}">
          <div>
            <strong>${participant.name}</strong>
            <small>${participant.programId}</small>
          </div>
        </div>
        <div class="score-inputs">
          <input type="number" min="0" class="prediction-home" value="${prediction.home ?? ''}" aria-label="${participant.name} goles local">
          <span>-</span>
          <input type="number" min="0" class="prediction-away" value="${prediction.away ?? ''}" aria-label="${participant.name} goles visitante">
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="admin-page animate-fade-in" style="max-width: 980px; margin: 0 auto;">
      <h1 style="margin-bottom: 2rem; text-align: center;">Panel de Administración</h1>
      
      <div class="glass-card" id="login-section">
        <h3 style="margin-bottom: 1rem;">Acceso Restringido</h3>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Ingresá la contraseña para cargar resultados y predicciones.</p>
        
        <div style="display: flex; gap: 1rem;">
          <input type="password" id="admin-pass" placeholder="Contraseña" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: white;">
          <button class="btn btn-primary" id="btn-login">Ingresar</button>
        </div>
      </div>

      <div id="admin-dashboard" style="display: none; margin-top: 2rem;">
        <div class="admin-note">
          Contraseña actual: <strong>mixon2026</strong>. Las predicciones quedan guardadas en este navegador. Los resultados reales pueden sincronizarse automáticamente cuando estén configurados la API key y los IDs reales de partidos.
        </div>

        <div class="glass-card admin-editor">
          <label class="admin-label" for="admin-match-select">Partido</label>
          <select id="admin-match-select" class="admin-select">
            ${matchOptions}
          </select>

          <div class="admin-result-box">
            <div>
              <h3>Resultado real</h3>
              <p>Cuando cargás esto, los rankings ya pueden calcular puntos.</p>
            </div>
            <div class="score-inputs">
              <input type="number" min="0" id="result-home" value="${firstResult.home ?? ''}" aria-label="Resultado local">
              <span>-</span>
              <input type="number" min="0" id="result-away" value="${firstResult.away ?? ''}" aria-label="Resultado visitante">
            </div>
            <button class="btn btn-primary" id="save-result">Guardar resultado</button>
          </div>

          <div class="admin-section-title">
            <div>
              <h3>Predicciones de conductores</h3>
              <p>Cargá el marcador que dijo cada uno para el partido seleccionado.</p>
            </div>
            <button class="btn btn-secondary" id="save-predictions">Guardar predicciones</button>
          </div>

          <div id="admin-predictions-list">
            ${predictionRows}
          </div>

          <div class="admin-tools">
            <button class="btn btn-secondary" id="export-data">Exportar datos</button>
            <label class="btn btn-secondary" for="import-data">Importar datos</label>
            <input type="file" id="import-data" accept="application/json" hidden>
          </div>
          <textarea id="export-output" class="admin-export" readonly placeholder="Acá aparece el JSON exportado para respaldo."></textarea>
        </div>
      </div>
    </div>
  `;
}
