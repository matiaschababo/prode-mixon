import { getParticipantProgramLabel, getPrimaryProgram } from '../data/participants.js';

const escapeHTML = (str) => String(str || '').replace(/"/g, '&quot;');

export function RankingTable(participantsData) {
  // Sort participants by points descending
  const sorted = [...participantsData].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  let rows = '';
  sorted.forEach((p, index) => {
    const prog = getPrimaryProgram(p);
    const points = p.totalPoints || 0;
    const pos = index + 1;
    
    // Medal logic
    let medal = '';
    if (pos === 1) medal = '🥇';
    else if (pos === 2) medal = '🥈';
    else if (pos === 3) medal = '🥉';
    else medal = `<span class="pos-num">${pos}</span>`;
    const roleIcon = p.role === 'Conductor' ? '🎙️ ' : 
                     p.role === 'Productor' ? '🎬 ' : 
                     p.role === 'Operador' ? '🎛️ ' : 
                     p.role === 'Editor/a' ? '✂️ ' : '';
    const roleDisplay = `${roleIcon}${(p.role || 'Viewer').toUpperCase()}`;
    
    const topClass = pos <= 3 ? `top-${pos}` : '';

    rows += `
      <div class="ranking-row ${topClass} animate-slide-up stagger-${(index % 5) + 1}" style="--target-width: ${Math.max(5, (points / (sorted[0]?.totalPoints || 1)) * 100)}%;">
        <div class="ranking-pos">${medal}</div>
        <img src="${p.photo}" alt="${escapeHTML(p.name)}" class="avatar">
        <div class="ranking-info">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <a href="/perfil/${p.id}" class="ranking-name" data-link>${p.name}</a>
            ${p.currentStreak >= 3 ? `<span title="¡Racha de ${p.currentStreak} partidos sumando puntos!" style="font-size: 0.8rem;">🔥</span>` : ''}
            ${p.mvpCount > 0 ? `<span class="badge-item" title="MVP del día ${p.mvpCount} veces" style="background: rgba(255,215,0,0.15); border: 1px solid rgba(255,215,0,0.4); color: #ffd700; padding: 0.1rem 0.4rem; font-size: 0.65rem; border-radius: 12px; white-space: nowrap;">👑 MVP x${p.mvpCount}</span>` : ''}
          </div>
          <div class="ranking-program" style="color: ${prog.theme.accent}; display: flex; align-items: center; gap: 0.5rem;">
            ${prog.logo ? `<img src="${prog.logo}" alt="${escapeHTML(prog.name)}" class="program-mini-logo" style="height: 18px; width: auto; object-fit: contain;">` : ''}
            ${roleDisplay} · ${getParticipantProgramLabel(p)}
          </div>
        </div>
        
        <div class="ranking-bar-container">
          <div class="ranking-bar bar-fill" style="background: linear-gradient(90deg, ${prog.theme.main}, ${prog.theme.accent})"></div>
        </div>
        
        <div class="ranking-points">
          <strong>${points}</strong> pts
          <small>${p.exacts || 0} exactos</small>
        </div>
      </div>
    `;
  });

  return `
    <div class="glass-card ranking-table">
      ${rows || '<p class="empty-state">Todavía no hay participantes para mostrar.</p>'}
    </div>
  `;
}
