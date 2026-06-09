// src/pages/Programas.js
import { participants, programs } from '../data/participants.js';
import { ProgramCard } from '../components/ProgramCard.js';
import { RankingTable } from '../components/RankingTable.js';
import { getRankedParticipants } from '../services/prodeStore.js';

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
  const staff = participants.filter(participant => !participant.programIds?.length);
  const staffHTML = staff.map(person => `
    <a href="/perfil/${person.id}" class="team-person" data-link>
      <img src="${person.photo}" class="avatar" alt="${person.name}">
      <div>
        <strong>${person.name}</strong>
        <small>${person.role}</small>
      </div>
    </a>
  `).join('');

  return `
    <div class="programas-page animate-fade-in">
      <h1 style="margin-bottom: 2rem; text-align: center;">Ranking por Programa</h1>
      
      <div class="grid-4" style="margin-bottom: 3rem;">
        ${programCardsHTML}
      </div>
      
      <p style="text-align: center; color: var(--text-secondary);">
        Seleccioná un programa para ver el ranking interno entre sus conductores.
      </p>

      <section class="glass-card team-section">
        <div>
          <p class="eyebrow">Ranking general</p>
          <h2>Productores y operadores</h2>
          <p>Compiten en la tabla general, pero no entran en rankings internos de un programa específico.</p>
        </div>
        <div class="team-list">
          ${staffHTML}
        </div>
      </section>
    </div>
  `;
}
