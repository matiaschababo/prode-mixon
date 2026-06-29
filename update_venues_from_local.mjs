import fs from 'fs';

const MATCHES_FILE = './src/data/matches.js';
const OPEN_FOOTBALL_FILE = './openfootball.json';

try {
  const openFootballData = JSON.parse(fs.readFileSync(OPEN_FOOTBALL_FILE, 'utf-8'));
  const venues = openFootballData.matches.map(m => m.ground);
  
  if (venues.length !== 104) {
    console.error('Expected 104 venues, got', venues.length);
    process.exit(1);
  }

  let content = fs.readFileSync(MATCHES_FILE, 'utf-8');
  const lines = content.split('\n');
  
  let currentId = null;
  let updatedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const idMatch = lines[i].match(/"id":\s*(\d+)/);
    if (idMatch) {
      currentId = Number(idMatch[1]);
    }
    
    if (lines[i].includes('"venue":') && currentId !== null && currentId <= 104) {
      const newVenue = venues[currentId - 1]; // Array is 0-indexed, IDs are 1-104
      lines[i] = lines[i].replace(/"venue":\s*".*?"/, `"venue": "${newVenue}"`);
      updatedCount++;
      currentId = null; 
    }
  }

  fs.writeFileSync(MATCHES_FILE, lines.join('\n'), 'utf-8');
  console.log(`Successfully updated ${updatedCount} venues in ${MATCHES_FILE}!`);

} catch (e) {
  console.error('Error:', e);
}
