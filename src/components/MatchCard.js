// src/components/MatchCard.js
import { teams } from '../data/teams.js';

export function MatchCard(match) {
  const home = teams[match.homeTeam] || { name: match.homeTeam, flag: "❓" };
  const away = teams[match.awayTeam] || { name: match.awayTeam, flag: "❓" };
  
  const dateObj = new Date(match.date);
  const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  let badgeClass = 'badge-scheduled';
  let statusText = 'Programado';
  if (match.status === 'live') {
    badgeClass = 'badge-live';
    statusText = '🔴 En Vivo';
  } else if (match.status === 'finished') {
    badgeClass = 'badge-finished';
    statusText = 'Finalizado';
  }

  const scoreDisplay = match.status !== 'scheduled' && match.homeScore !== null 
    ? `<div class="match-score">${match.homeScore} - ${match.awayScore}</div>`
    : `<div class="match-time">${timeStr}</div>`;

  return `
    <div class="glass-card match-card animate-slide-up">
      <div class="match-header">
        <span class="match-round">${match.round}</span>
        <span class="badge ${badgeClass}">${statusText}</span>
      </div>
      
      <div class="match-teams">
        <div class="team home">
          <span class="flag">${home.flag}</span>
          <span class="name">${home.name}</span>
        </div>
        
        <div class="match-center">
          ${scoreDisplay}
          <div class="match-date">${dateStr}</div>
        </div>
        
        <div class="team away">
          <span class="flag">${away.flag}</span>
          <span class="name">${away.name}</span>
        </div>
      </div>
      
      <div class="match-footer">
        <span>📍 ${match.venue}</span>
        <a href="/predicciones/${match.id}" class="btn btn-secondary btn-sm" data-link>Ver Predicciones</a>
      </div>
    </div>
  `;
}
