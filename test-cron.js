import { matches } from './src/data/matches.js';
import { bracketData } from './src/data/bracket.js';
import { calculateGroupStandings } from './src/services/standings.js';
import { getResolvedMatches } from './src/services/bracketResolver.js';

// Mock empty results for groups
const currentResults = {};
// Add dummy results for group A and B to make them finished?
// If we don't have results, calculateGroupStandings returns empty standings,
// and getResolvedMatches returns '2° Grupo A' instead of 'RSA'!!
const standings = calculateGroupStandings(matches, currentResults);
const resolved = getResolvedMatches(matches, standings, currentResults, bracketData);

const m73 = resolved.find(m => m.id === 73);
console.log("Match 73 resolved to:", m73.homeTeam, m73.awayTeam);
