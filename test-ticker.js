const m = { id: 31, homeTeam: 'MAR', awayTeam: 'SCO' };
const homeTeam = { name: 'Marruecos', flag: '🇲🇦', flagUrl: 'https://flagcdn.com/w80/ma.png', codeEsp: 'MAR' };
const awayTeam = { name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', flagUrl: 'https://flagcdn.com/w80/gb-sct.png', codeEsp: 'ESC' };
const middle = '1 - 0';
const statusText = '<span class="ticker-status-live">EN VIVO 13\'</span>';
const itemClass = 'ticker-item-live';

const html = `<a href="/fixture#match-${m.id}" data-link class="ticker-item ${itemClass}" style="text-decoration: none; color: inherit;">
      <span class="ticker-team"><img src="${homeTeam.flagUrl}" class="ticker-flag" alt="${homeTeam.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="flag-emoji" style="display:none">${homeTeam.flag}</span> ${(homeTeam.codeEsp || m.homeTeam).toUpperCase()}</span>
      <span class="ticker-middle">${middle}</span>
      <span class="ticker-team">${(awayTeam.codeEsp || m.awayTeam).toUpperCase()} <img src="${awayTeam.flagUrl}" class="ticker-flag" alt="${awayTeam.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"><span class="flag-emoji" style="display:none">${awayTeam.flag}</span></span>
      ${statusText}
    </a>`;

console.log(html);
