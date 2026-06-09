// src/pages/Programas.js
import { programs } from '../data/participants.js';
import { ProgramCard } from '../components/ProgramCard.js';

export function Programas() {
  const programCardsHTML = Object.values(programs)
    .map(prog => ProgramCard(prog))
    .join('');

  return `
    <div class="programas-page animate-fade-in">
      <h1 style="margin-bottom: 2rem; text-align: center;">Ranking por Programa</h1>
      
      <div class="grid-4" style="margin-bottom: 3rem;">
        ${programCardsHTML}
      </div>
      
      <p style="text-align: center; color: var(--text-secondary);">
        Seleccioná un programa para ver el ranking interno entre sus conductores.
      </p>
    </div>
  `;
}
