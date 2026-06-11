import { matches } from '../data/matches.js';
import { teams } from '../data/teams.js';
import { getResults } from './prodeStore.js';

export function calculateGroupStandings() {
  const standings = {};

  // Initialize standings for all real teams
  Object.values(teams).forEach(t => {
    if (t.id === 'TBD') return;
    standings[t.id] = {
      id: t.id,
      name: t.name,
      flagUrl: t.flagUrl,
      group: t.group,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };
  });

  const results = getResults();

  // Process all matches with a result
  matches.forEach(m => {
    const res = results[m.id];
    if (res && res.home !== null && res.away !== null) {
      const homeTeam = m.homeTeam;
      const awayTeam = m.awayTeam;

      if (!standings[homeTeam] || !standings[awayTeam]) return;

      const hG = parseInt(res.home, 10);
      const aG = parseInt(res.away, 10);

      // Home team stats
      standings[homeTeam].played += 1;
      standings[homeTeam].goalsFor += hG;
      standings[homeTeam].goalsAgainst += aG;

      // Away team stats
      standings[awayTeam].played += 1;
      standings[awayTeam].goalsFor += aG;
      standings[awayTeam].goalsAgainst += hG;

      if (hG > aG) {
        standings[homeTeam].won += 1;
        standings[homeTeam].points += 3;
        standings[awayTeam].lost += 1;
      } else if (hG < aG) {
        standings[awayTeam].won += 1;
        standings[awayTeam].points += 3;
        standings[homeTeam].lost += 1;
      } else {
        standings[homeTeam].drawn += 1;
        standings[homeTeam].points += 1;
        standings[awayTeam].drawn += 1;
        standings[awayTeam].points += 1;
      }
    }
  });

  // Calculate goal difference
  Object.values(standings).forEach(s => {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  });

  // Group the standings
  const groups = {};
  Object.values(standings).forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  // Sort each group
  Object.keys(groups).forEach(g => {
    groups[g].sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Goal Difference
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      // 3. Goals For
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      // 4. Alphabetical fallback
      return a.name.localeCompare(b.name);
    });
  });

  return groups;
}
