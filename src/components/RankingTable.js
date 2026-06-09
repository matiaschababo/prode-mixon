// src/components/RankingTable.js
import { programs } from '../data/participants.js';

export function RankingTable(participantsData) {
  // Sort participants by points descending
  const sorted = [...participantsData].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  let rows = '';
  sorted.forEach((p, index) => {
    const prog = programs[p.programId];
    const points = p.totalPoints || 0;
    const pos = index + 1;
    
    // Medal logic
    let medal = '';
    if (pos === 1) medal = '🥇';
    else if (pos === 2) medal = '🥈';
    else if (pos === 3) medal = '🥉';
    else medal = `<span class="pos-num">${pos}</span>`;

    rows += `
      <div class="ranking-row animate-slide-up stagger-${(index % 5) + 1}" style="--target-width: ${Math.max(5, (points / (sorted[0]?.totalPoints || 1)) * 100)}%;">
        <div class="ranking-pos">${medal}</div>
        <img src="${p.photo}" alt="${p.name}" class="avatar">
        <div class="ranking-info">
          <div class="ranking-name">${p.name}</div>
          <div class="ranking-program" style="color: ${prog.theme.accent}">${prog.name}</div>
        </div>
        
        <div class="ranking-bar-container">
          <div class="ranking-bar bar-fill" style="background: linear-gradient(90deg, ${prog.theme.main}, ${prog.theme.accent})"></div>
        </div>
        
        <div class="ranking-points">
          <strong>${points}</strong> pts
        </div>
      </div>
    `;
  });

  return `
    <div class="glass-card ranking-table">
      ${rows}
    </div>
  `;
}
