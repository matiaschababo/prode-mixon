// src/pages/Programas.js
import { programs } from '../data/participants.js';
import { ProgramCard } from '../components/ProgramCard.js';
import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants, getDynamicUsers } from '../services/prodeStore.js';

export function Programas(programId = null) {
  if (programId) {
    const program = programs[programId];
    if (!program) return `<h2>Programa no encontrado</h2>`;
    const ranked = getRankedParticipants(programId);

    return `
      <div class="program-detail animate-fade-in">
        <a href="/programas" class="btn btn-secondary btn-sm" data-link style="margin-bottom: 1rem;">Volver</a>
        <section class="program-detail-hero glass-card" style="border-color: ${program.theme.main}">
          <div class="program-detail-cover" style="background-image: linear-gradient(90deg, rgba(10,10,15,0.9), rgba(10,10,15,0.35)), url('${program.cover || program.logo}')">
            <img src="${program.logo}" alt="${program.name}" class="program-detail-logo">
            <div>
              <p class="eyebrow">Ranking interno</p>
              <h1>${program.name}</h1>
              <p>Competencia entre sus conductores, calculada con las predicciones cargadas.</p>
            </div>
          </div>
        </section>
        <section style="margin-top: 2rem;">
          ${RankingTable(ranked)}
        </section>
      </div>
    `;
  }

  const programCardsHTML = Object.values(programs)
    .map(prog => ProgramCard(prog))
    .join('');

  const programTotals = Object.values(programs).map(prog => {
    const participants = getRankedParticipants(prog.id);
    const totalPoints = participants.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
    return { ...prog, totalPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const maxPoints = Math.max(...programTotals.map(p => p.totalPoints), 1);

  const chartHTML = `
    <section class="glass-card" style="margin-bottom: 2rem;">
      <h2 style="margin-bottom: 1.5rem; text-align: center;">Competencia Global</h2>
      <div class="program-chart">
        ${programTotals.map(prog => {
          const percentage = (prog.totalPoints / maxPoints) * 100;
          return `
            <div class="program-chart-row">
              <img src="${prog.logo}" alt="${prog.name}" class="program-chart-logo" style="border-color: ${prog.theme.main}">
              <div class="program-chart-bar-container">
                <div class="program-chart-bar-fill" style="width: ${percentage === 0 ? 5 : percentage}%; background: linear-gradient(90deg, ${prog.theme.main}, ${prog.theme.accent});">
                  ${prog.name}
                </div>
              </div>
              <div class="program-chart-points">${prog.totalPoints} pts</div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;

  return `
    <div class="programas-page animate-fade-in">
      <h1 style="margin-bottom: 2rem; text-align: center;">Ranking por Programa</h1>

      ${chartHTML}
      
      <div class="grid-4" style="margin-bottom: 3rem;">
        ${programCardsHTML}
      </div>
      
      <p style="text-align: center; color: var(--text-secondary);">
        Seleccioná un programa para ver el ranking interno entre sus conductores.
      </p>
    </div>
  `;
}
