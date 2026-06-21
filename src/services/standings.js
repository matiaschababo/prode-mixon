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

export function getProvisionalBracket(groups, bracketData) {
  const isGroupFinished = (g) => groups[g] && groups[g].length > 0 && groups[g].every(t => t.played === 3);

  // Extract all 3rd placed teams
  const thirds = [];
  Object.keys(groups).forEach(g => {
    if (groups[g].length >= 3) {
      thirds.push(groups[g][2]);
    }
  });

  // Sort to find the 8 best 3rd placed teams
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  const bestThirds = thirds.slice(0, 8);

  const resolveTeam = (label) => {
    let team = null;
    let isProvisional = true;

    // Match "1° Grupo X"
    let m1 = label.match(/^1° Grupo ([A-L])$/);
    if (m1) {
      const g = m1[1];
      if (groups[g] && groups[g][0] && groups[g][0].played > 0) {
        team = groups[g][0];
        isProvisional = !isGroupFinished(g);
      }
      return { team, isProvisional, originalLabel: label };
    }

    // Match "2° Grupo X"
    let m2 = label.match(/^2° Grupo ([A-L])$/);
    if (m2) {
      const g = m2[1];
      if (groups[g] && groups[g][1] && groups[g][1].played > 0) {
        team = groups[g][1];
        isProvisional = !isGroupFinished(g);
      }
      return { team, isProvisional, originalLabel: label };
    }

    // Match "3° Grupo X/Y/Z"
    let m3 = label.match(/^3° Grupo ([A-L\\/]+)$/);
    if (m3) {
      const allowedGroups = m3[1].split('/');
      return { team: null, allowedGroups, isProvisional: true, originalLabel: label, isThirdPlaceSlot: true };
    }

    return { team: null, isProvisional: true, originalLabel: label };
  };

  const parsedRoundOf32 = bracketData.roundOf32.map(slot => ({
    ...slot,
    homeResolved: resolveTeam(slot.home),
    awayResolved: resolveTeam(slot.away)
  }));

  // Assign best 3rd placed teams
  const availableThirds = [...bestThirds];
  const thirdPlaceSlots = [];
  
  parsedRoundOf32.forEach(slot => {
    if (slot.homeResolved.isThirdPlaceSlot) thirdPlaceSlots.push(slot.homeResolved);
    if (slot.awayResolved.isThirdPlaceSlot) thirdPlaceSlots.push(slot.awayResolved);
  });

  // Very simple greedy assignment with backtracking
  const assignThirds = (slotIndex, currentAvailable) => {
    if (slotIndex >= thirdPlaceSlots.length) return true; // All assigned

    const slot = thirdPlaceSlots[slotIndex];
    for (let i = 0; i < currentAvailable.length; i++) {
      const candidate = currentAvailable[i];
      if (slot.allowedGroups.includes(candidate.group)) {
        slot.team = candidate;
        slot.isProvisional = !isGroupFinished(candidate.group);
        const nextAvailable = [...currentAvailable];
        nextAvailable.splice(i, 1);
        if (assignThirds(slotIndex + 1, nextAvailable)) {
          return true;
        }
        slot.team = null; // backtrack
      }
    }
    return false; // If we couldn't assign, the slot.team remains null
  };

  assignThirds(0, availableThirds);

  return parsedRoundOf32;
}
