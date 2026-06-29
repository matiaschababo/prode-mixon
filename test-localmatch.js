import fetch from 'node-fetch';
import { matches } from './src/data/matches.js';
import { bracketData } from './src/data/bracket.js';
import { calculateGroupStandings } from './src/services/standings.js';
import { getResolvedMatches } from './src/services/bracketResolver.js';

async function test() {
  const dbRes = await fetch('https://prode-mixon.vercel.app/api/debug-db');
  const dbData = await dbRes.json();
  const currentResults = dbData.results;

  const standings = calculateGroupStandings(currentResults);
  const resolvedMatches = getResolvedMatches(matches, standings, currentResults, bracketData);

  const match76 = resolvedMatches.find(m => m.id === 76);
  console.log("Match 76 from bracketResolver:");
  console.log("homeTeam:", match76.homeTeam, "awayTeam:", match76.awayTeam);
  
  const mHome = (match76.homeTeam || '').toLowerCase();
  const mAway = (match76.awayTeam || '').toLowerCase();
  
  console.log("Lowercased home:", mHome, "away:", mAway);
}
test();
