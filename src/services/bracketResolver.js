import { bracketData } from '../data/bracket.js';
import { calculateGroupStandings, getProvisionalBracket } from './standings.js';
import { getResults } from './prodeStore.js';
import { teams } from '../data/teams.js';

export const resolveSource = (sourceLabel, resolvedMap, results) => {
  if (!sourceLabel) return { team: null, label: '', isProvisional: true };
  
  let matchId = null;
  let isWinner = true;
  
  const mWinner = sourceLabel.match(/^G\. M(\d+)$/);
  const mWinnerSF = sourceLabel.match(/^G\. SF(\d)$/);
  const mLoserSF = sourceLabel.match(/^P\. SF(\d)$/);

  if (mWinner) {
    matchId = parseInt(mWinner[1]);
  } else if (mWinnerSF) {
    matchId = mWinnerSF[1] === '1' ? 101 : 102;
  } else if (mLoserSF) {
    matchId = mLoserSF[1] === '1' ? 101 : 102;
    isWinner = false;
  }

  if (!matchId) {
    return { team: null, label: sourceLabel, isProvisional: true };
  }

  const prevMatch = resolvedMap[matchId];
  if (!prevMatch) {
    return { team: null, label: sourceLabel, isProvisional: true };
  }

  const res = results[String(matchId)];
  if (res && res.home !== null && res.away !== null) {
    const hG = parseInt(res.home, 10);
    const aG = parseInt(res.away, 10);
    let winner = null;
    let loser = null;

    if (hG > aG) {
      winner = prevMatch.home;
      loser = prevMatch.away;
    } else if (aG > hG) {
      winner = prevMatch.away;
      loser = prevMatch.home;
    } else {
      if (res.winner === prevMatch.home?.id) {
        winner = prevMatch.home;
        loser = prevMatch.away;
      } else if (res.winner === prevMatch.away?.id) {
        winner = prevMatch.away;
        loser = prevMatch.home;
      } else {
        winner = prevMatch.home;
        loser = prevMatch.away;
      }
    }

    const team = isWinner ? winner : loser;
    const isTeamProvisional = (isWinner ? prevMatch.homeProvisional : prevMatch.awayProvisional) || (hG === aG && !res.winner);
    return { team, label: team ? team.name : sourceLabel, isProvisional: isTeamProvisional };
  } else {
    return { 
      team: null, 
      label: sourceLabel, 
      isProvisional: true, 
      candidates: null 
    };
  }
};

export function getResolvedBracket() {
  const standings = calculateGroupStandings();
  const results = getResults();
  
  const provisionalRoundOf32 = getProvisionalBracket(standings, bracketData);
  const resolved = {};
  
  // R32
  provisionalRoundOf32.forEach(slot => {
    let homeTeam = slot.homeResolved?.team || null;
    let awayTeam = slot.awayResolved?.team || null;
    let isHomeProvisional = slot.homeResolved?.isProvisional ?? true;
    let isAwayProvisional = slot.awayResolved?.isProvisional ?? true;
    let homeLabel = homeTeam ? null : (slot.homeResolved?.originalLabel || slot.home);
    let awayLabel = awayTeam ? null : (slot.awayResolved?.originalLabel || slot.away);

    const res = results[String(slot.matchId)];
    if (res) {
      if (res.espnHome && teams[res.espnHome]) {
        homeTeam = teams[res.espnHome];
        isHomeProvisional = false;
        homeLabel = null;
      }
      if (res.espnAway && teams[res.espnAway]) {
        awayTeam = teams[res.espnAway];
        isAwayProvisional = false;
        awayLabel = null;
      }
    }

    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeTeam,
      away: awayTeam,
      homeLabel: homeLabel,
      awayLabel: awayLabel,
      homeProvisional: isHomeProvisional,
      awayProvisional: isAwayProvisional,
      homeCandidates: slot.homeResolved?.candidates,
      awayCandidates: slot.awayResolved?.candidates,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // R16
  bracketData.roundOf16.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // QF
  bracketData.quarterFinals.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      feedsTo: slot.feedsTo,
      side: slot.side
    };
  });

  // SF
  bracketData.semiFinals.forEach(slot => {
    const homeRes = resolveSource(slot.home, resolved, results);
    const awayRes = resolveSource(slot.away, resolved, results);
    resolved[slot.matchId] = {
      matchId: slot.matchId,
      home: homeRes.team,
      away: awayRes.team,
      homeLabel: homeRes.team ? null : homeRes.label,
      awayLabel: awayRes.team ? null : awayRes.label,
      homeProvisional: homeRes.isProvisional,
      awayProvisional: awayRes.isProvisional,
      homeCandidates: homeRes.candidates,
      awayCandidates: awayRes.candidates,
      side: slot.side
    };
  });

  // Third Place
  const tpSlot = bracketData.thirdPlace;
  const tpHomeRes = resolveSource(tpSlot.home, resolved, results);
  const tpAwayRes = resolveSource(tpSlot.away, resolved, results);
  resolved[tpSlot.matchId] = {
    matchId: tpSlot.matchId,
    home: tpHomeRes.team,
    away: tpAwayRes.team,
    homeLabel: tpHomeRes.team ? null : tpHomeRes.label,
    awayLabel: tpAwayRes.team ? null : tpAwayRes.label,
    homeProvisional: tpHomeRes.isProvisional,
    awayProvisional: tpAwayRes.isProvisional,
    homeCandidates: tpHomeRes.candidates,
    awayCandidates: tpAwayRes.candidates
  };

  // Final
  const fSlot = bracketData.final;
  const fHomeRes = resolveSource(fSlot.home, resolved, results);
  const fAwayRes = resolveSource(fSlot.away, resolved, results);
  resolved[fSlot.matchId] = {
    matchId: fSlot.matchId,
    home: fHomeRes.team,
    away: fAwayRes.team,
    homeLabel: fHomeRes.team ? null : fHomeRes.label,
    awayLabel: fAwayRes.team ? null : fAwayRes.label,
    homeProvisional: fHomeRes.isProvisional,
    awayProvisional: fAwayRes.isProvisional,
    homeCandidates: fHomeRes.candidates,
    awayCandidates: fAwayRes.candidates
  };

  return resolved;
}

export function getResolvedMatches(matches, standings, results, bracketData) {
  const resolvedBracket = getResolvedBracket(standings, results, bracketData);
  
  return matches.map(m => {
    const finalDate = (results && results[m.id] && results[m.id].actualDate) ? results[m.id].actualDate : m.date;
    
    if (m.stage === "Group Stage") return { ...m, date: finalDate };
    
    // Find the match in the resolved bracket
    const slot = resolvedBracket[m.id];
    if (slot) {
      return {
        ...m,
        date: finalDate,
        homeTeam: slot.home ? slot.home.id : (slot.homeLabel || m.homeTeam),
        awayTeam: slot.away ? slot.away.id : (slot.awayLabel || m.awayTeam),
        isProvisional: slot.homeProvisional || slot.awayProvisional
      };
    }
    return { ...m, date: finalDate };
  });
}
