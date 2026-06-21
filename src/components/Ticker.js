import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { getMatchResult } from '../services/prodeStore.js';

export function Ticker() {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() - 10);
  const todayLogicalStr = now.toISOString().split('T')[0];
  
  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setUTCHours(d.getUTCHours() - 10);
    return d.toISOString().split('T')[0];
  };

  let tickerMatches = matches.filter(m => getLogicalDate(m.date) === todayLogicalStr);
  if (tickerMatches.length === 0) {
    const futureMatches = matches.filter(m => new Date(m.date) > new Date());
    if (futureMatches.length > 0) {
      const nextDayStr = getLogicalDate(futureMatches[0].date);
      tickerMatches = matches.filter(m => getLogicalDate(m.date) === nextDayStr);
    } else {
       const lastDayStr = getLogicalDate(matches[matches.length - 1].date);
       tickerMatches = matches.filter(m => getLogicalDate(m.date) === lastDayStr);
    }
  }

  if (tickerMatches.length === 0) return '';

  const renderItems = () => tickerMatches.map(m => {
    const homeTeam = teams[m.homeTeam] || { name: m.homeTeam, flag: "❓" };
    const awayTeam = teams[m.awayTeam] || { name: m.awayTeam, flag: "❓" };
    const res = getMatchResult(m);
    
    let statusText = '';
    let middle = 'vs';
    let itemClass = 'ticker-item-pending';
    
    if (res) {
       middle = `${res.home} - ${res.away}`;
       if (res.live) {
          let isHalftime = res.status === 'PAUSED' || res.minute === 'HT' || String(res.minute).toLowerCase() === 'entretiempo';
          if (isHalftime) {
            statusText = `<span class="ticker-status-live">ENTRETIEMPO</span>`;
          } else {
            let minText = '';
            if (res.minute) minText = ` ${res.minute}'`;
            statusText = `<span class="ticker-status-live">EN VIVO${minText}</span>`;
          }
          itemClass = 'ticker-item-live';
       } else {
          statusText = `<span class="ticker-status-end">FIN</span>`;
          itemClass = 'ticker-item-finished';
       }
    } else {
       const d = new Date(m.date);
       const timeStr = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
       statusText = `<span class="ticker-status-time">HOY ${timeStr}</span>`;
    }

    return `<a href="/fixture#match-${m.id}" data-link class="ticker-item ${itemClass}" style="text-decoration: none; color: inherit;">
      <span class="ticker-team"><img src="${homeTeam.flagUrl}" class="ticker-flag" alt="${homeTeam.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="flag-emoji" style="display:none">${homeTeam.flag}</span> ${(homeTeam.codeEsp || m.homeTeam).toUpperCase()}</span>
      <span class="ticker-middle">${middle}</span>
      <span class="ticker-team">${(awayTeam.codeEsp || m.awayTeam).toUpperCase()} <img src="${awayTeam.flagUrl}" class="ticker-flag" alt="${awayTeam.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="flag-emoji" style="display:none">${awayTeam.flag}</span></span>
      ${statusText}
    </a>`;
  }).join('');

  const itemsHtml = renderItems();

  return `
    <div class="global-ticker-container" data-ignore-morph="true">
      <div class="global-ticker-track">
        <div class="global-ticker-content">
          ${itemsHtml}
        </div>
        <div class="global-ticker-content" aria-hidden="true">
          ${itemsHtml}
        </div>
      </div>
    </div>
  `;
}
