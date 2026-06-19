import { getResults } from './prodeStore.js';
import { teams } from '../data/teams.js';

export function getTopScorersAndAssists() {
  const results = getResults();
  const players = {}; // { "L. Messi": { team: "ARG", goals: 5, assists: 2 } }

  Object.values(results).forEach(result => {
    if (result.events && Array.isArray(result.events)) {
      result.events.forEach(event => {
        // Event format expected: { type: 'goal', player: 'L. Messi', team: 'ARG' }
        if (event.type === 'goal') {
          if (!players[event.player]) {
            players[event.player] = { name: event.player, team: event.team, goals: 0, assists: 0 };
          }
          players[event.player].goals += 1;
        } else if (event.type === 'assist') {
          // If we track assists in events
          if (!players[event.player]) {
            players[event.player] = { name: event.player, team: event.team, goals: 0, assists: 0 };
          }
          players[event.player].assists += 1;
        }
      });
    }
  });

  const allPlayers = Object.values(players);

  // Map team ID to full name and flag
  const enrichedPlayers = allPlayers.map(p => {
    // If the team is something like "Argentina" or "ARG", map it
    // Usually event.team could be the 3-letter code or full name depending on ESPN
    // Let's try to find it in teams
    const teamObj = teams[p.team] || Object.values(teams).find(t => t.name.toLowerCase() === p.team?.toLowerCase());
    return {
      ...p,
      teamName: teamObj ? teamObj.name : p.team,
      flagUrl: teamObj ? teamObj.flagUrl : 'https://flagcdn.com/w40/un.png'
    };
  });

  const topScorers = [...enrichedPlayers].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const topAssists = [...enrichedPlayers].filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists);

  return { topScorers, topAssists };
}
