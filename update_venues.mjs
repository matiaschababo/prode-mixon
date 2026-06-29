import fs from 'fs';
import https from 'https';
import path from 'path';

const MATCHES_FILE = './src/data/matches.js';
const URLS = [
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json',
  'https://www.thestatsapi.com/world-cup/data/fixtures.json'
];

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function updateVenues() {
  console.log('Fetching 2026 World Cup schedule data...');
  let venueMap = new Map();
  
  for (const url of URLS) {
    try {
      const data = await fetchJSON(url);
      
      // Parse openfootball structure
      if (data.rounds) {
        data.rounds.forEach(round => {
          if (round.matches) {
            round.matches.forEach(match => {
              if (match.num && match.stadium) {
                const venue = match.stadium.city ? `${match.stadium.name}, ${match.stadium.city}` : match.stadium.name;
                venueMap.set(Number(match.num), venue);
              }
            });
          }
        });
      }
      // Parse alternative structure
      else if (Array.isArray(data)) {
        data.forEach(match => {
          const matchNum = match.matchNumber || match.id || match.num;
          if (matchNum && match.stadium) {
            const venue = match.hostCity ? `${match.stadium}, ${match.hostCity}` : match.stadium;
            venueMap.set(Number(matchNum), venue);
          }
        });
      }

      if (venueMap.size > 0) {
        console.log(`Successfully loaded ${venueMap.size} venues from ${url}`);
        break; // Successfully got the venues, stop trying URLs
      }
    } catch (e) {
      console.log(`Failed to fetch from ${url}: ${e.message}`);
    }
  }

  if (venueMap.size === 0) {
    console.error('Failed to retrieve venue data.');
    return;
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
    
    if (lines[i].includes('"venue":') && currentId !== null) {
      if (venueMap.has(currentId)) {
        const newVenue = venueMap.get(currentId);
        lines[i] = lines[i].replace(/"venue":\s*".*?"/, `"venue": "${newVenue}"`);
        updatedCount++;
      }
      currentId = null; 
    }
  }

  fs.writeFileSync(MATCHES_FILE, lines.join('\n'), 'utf-8');
  console.log(`Successfully updated ${updatedCount} venues in ${MATCHES_FILE}!`);
}

updateVenues();
