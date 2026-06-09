// src/components/ProgramCard.js

export function ProgramCard(program) {
  return `
    <div class="glass-card program-card animate-slide-up" style="border-top: 4px solid ${program.theme.main}">
      <div class="program-cover" style="background-image: linear-gradient(180deg, rgba(10,10,15,0.1), rgba(10,10,15,0.85)), url('${program.cover || program.logo}')">
        <img src="${program.logo}" alt="${program.name} Logo" class="program-logo">
      </div>
      <h3>${program.name}</h3>
      <a href="/programas/${program.id}" class="btn btn-secondary" data-link>Ver Ranking Interno</a>
    </div>
  `;
}
