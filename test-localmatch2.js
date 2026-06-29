import fetch from 'node-fetch';
import { getProvisionalBracket } from './src/services/standings.js';
import { bracketData } from './src/data/bracket.js';
import { calculateGroupStandings } from './src/services/standings.js';

async function test() {
  const dbRes = await fetch('https://prode-mixon.vercel.app/api/debug-db');
  const dbData = await dbRes.json();
  const standings = calculateGroupStandings(dbData.results);
  
  const pGroups = getProvisionalBracket(standings, bracketData);
  console.log("Provisional Group C:", pGroups["1° Grupo C"]);
  console.log("Provisional Group F:", pGroups["2° Grupo F"]);
}
test();
