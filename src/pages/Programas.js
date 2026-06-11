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
          const maxP = maxPoints > 0 ? maxPoints : 1;
          const ratio = prog.totalPoints / maxP;
          const percentage = ratio * 100;
          
          const logoSize = 40 + (ratio * 50); 
          const fontSize = 1 + (ratio * 0.6); 
          const glowOpacity = 0.2 + (ratio * 0.8);
          
          return `
            <div class="program-chart-col">
              <div class="program-chart-points" style="font-size: ${fontSize}rem; text-shadow: 0 0 ${ratio * 20}px ${prog.theme.main}; color: ${ratio === 1 ? '#fff' : 'var(--text-primary)'};">
                ${prog.totalPoints} <span style="font-size: 0.6em; opacity: 0.8;">pts</span>
              </div>
              
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 100%; margin: 1rem 0;">
                <img src="${prog.logo}" alt="${prog.name}" class="program-chart-logo" 
                     style="width: ${logoSize}px; height: ${logoSize}px; 
                            border-color: ${prog.theme.main}; 
                            box-shadow: 0 0 ${ratio * 25}px ${prog.theme.main}; 
                            z-index: 2; margin-bottom: -${logoSize * 0.15}px;">
                            
                <div class="program-chart-pedestal" 
                     style="height: ${percentage === 0 ? 5 : percentage}%; 
                            width: ${logoSize * 0.75}px; 
                            background: linear-gradient(to top, rgba(0,0,0,0), ${prog.theme.main}); 
                            opacity: ${glowOpacity}; 
                            border-top: 3px solid ${prog.theme.accent}; 
                            box-shadow: 0 -10px 30px ${prog.theme.main}; 
                            border-radius: 4px 4px 0 0; 
                            transition: height 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);">
                </div>
              </div>
              
              <div class="program-chart-name" style="font-size: ${0.75 + (ratio * 0.15)}rem; color: ${ratio === 1 ? '#fff' : 'var(--text-secondary)'}; font-weight: ${ratio === 1 ? '900' : '700'};">
                ${prog.name}
              </div>
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
