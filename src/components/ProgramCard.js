// src/components/ProgramCard.js

export function ProgramCard(program) {
  return `
    <div class="glass-card program-card animate-slide-up" style="border-top: 4px solid ${program.theme.main}">
      <img src="${program.logo}" alt="${program.name} Logo" class="program-logo">
      <h3>${program.name}</h3>
      <a href="/programas/${program.id}" class="btn btn-secondary" data-link>Ver Ranking Interno</a>
    </div>
  `;
}
