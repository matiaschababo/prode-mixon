import { matches } from '../src/data/matches.js';
import admin from 'firebase-admin';

// Parse the service account from environment variables
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Error inicializando Firebase Admin. Verifica FIREBASE_SERVICE_ACCOUNT", error);
  }
}

export default async function handler(request, response) {
  // Configuración de CORS por si acaso
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Comprobar que Firebase se inicializó correctamente
  if (!admin.apps.length) {
    return response.status(500).json({ error: "Firebase Admin no está configurado." });
  }

  const db = admin.firestore();
  
  try {
    const todayDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(todayDate.getDate() - 2);

    const yyyy1 = pastDate.getFullYear();
    const mm1 = String(pastDate.getMonth() + 1).padStart(2, '0');
    const dd1 = String(pastDate.getDate()).padStart(2, '0');

    const yyyy2 = todayDate.getFullYear();
    const mm2 = String(todayDate.getMonth() + 1).padStart(2, '0');
    const dd2 = String(todayDate.getDate()).padStart(2, '0');
    
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${yyyy1}${mm1}${dd1}-${yyyy2}${mm2}${dd2}`;
    console.log(`Cron: Fetching ${url}`);
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.events && data.events.length > 0) {
      const resultsRef = db.collection('global').doc('results');
      const resultsDoc = await resultsRef.get();
      const currentResults = resultsDoc.exists ? resultsDoc.data() : {};
      
      let changed = false;

      data.events.forEach(apiMatch => {
        const homeTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'home');
        const awayTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'away');
        
        if (!homeTeamData || !awayTeamData) return;

        const localMatch = matches.find(m => {
          const apiHome = homeTeamData.team.abbreviation.toLowerCase();
          const apiAway = awayTeamData.team.abbreviation.toLowerCase();
          const mHome = m.homeTeam.toLowerCase();
          const mAway = m.awayTeam.toLowerCase();
          
          return (mHome === apiHome && mAway === apiAway) || (mHome === apiAway && mAway === apiHome);
        });

        if (localMatch) {
          const state = apiMatch.status.type.state; // 'pre', 'in', 'post'
          const isLive = state === 'in';
          const isFinished = state === 'post';

          const homeGoals = parseInt(homeTeamData.score) || 0;
          const awayGoals = parseInt(awayTeamData.score) || 0;
          let minuteStr = apiMatch.status.displayClock || "0";
          minuteStr = minuteStr.replace("'", "");

          const apiDetails = apiMatch.competitions[0].details || [];
          let matchEvents = [];
          
          apiDetails.forEach(detail => {
            const isGoal = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('goal')) || detail.scoringPlay;
            const isRed = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('red card')) || detail.redCard;
            
            if (isGoal || isRed) {
              const player = detail.athletesInvolved && detail.athletesInvolved.length > 0 ? detail.athletesInvolved[0].shortName : '';
              const teamData = apiMatch.competitions[0].competitors.find(c => c.team.id === detail.team.id);
              const team = teamData ? teamData.team.abbreviation : '';
              
              matchEvents.push({
                min: detail.clock ? detail.clock.displayValue : '',
                type: isGoal ? 'goal' : 'red',
                team: team,
                player: player
              });
            }
          });

          const saved = currentResults[localMatch.id];
          
          const newPayloadLive = { home: homeGoals, away: awayGoals, live: true, minute: minuteStr, events: matchEvents };
          const newPayloadDone = { home: homeGoals, away: awayGoals, events: matchEvents };
          
          if (isLive) {
            if (!saved || saved.home !== homeGoals || saved.away !== awayGoals || saved.minute !== minuteStr || JSON.stringify(saved.events) !== JSON.stringify(matchEvents)) {
              currentResults[localMatch.id] = newPayloadLive;
              changed = true;
            }
          } else if (isFinished) {
            if (!saved || saved.home !== homeGoals || saved.away !== awayGoals || saved.live || JSON.stringify(saved.events) !== JSON.stringify(matchEvents)) {
              currentResults[localMatch.id] = newPayloadDone;
              changed = true;
            }
          }
        }
      });

      if (changed) {
        await resultsRef.set(currentResults);
        return response.status(200).json({ success: true, message: "Resultados actualizados", updated: true });
      } else {
        return response.status(200).json({ success: true, message: "No hubo cambios", updated: false });
      }
    } else {
      return response.status(200).json({ success: true, message: "No se encontraron eventos en ESPN", updated: false });
    }
  } catch (e) {
    console.error("Cron Error:", e);
    return response.status(500).json({ error: e.message });
  }
}
