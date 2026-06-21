import { matches } from '../src/data/matches.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Parse the service account from environment variables
if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
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
  if (getApps().length === 0) {
    return response.status(500).json({ error: "Firebase Admin no está configurado." });
  }

  const db = getFirestore();
  
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

      for (const apiMatch of data.events) {
        const competitors = apiMatch.competitions[0].competitors;
        if (!competitors || competitors.length < 2) continue;

        // Build a score/abbreviation map keyed by team abbreviation (case-insensitive)
        // This way we NEVER rely on ESPN's home/away ordering
        const teamMap = {};
        competitors.forEach(c => {
          teamMap[c.team.abbreviation.toLowerCase()] = {
            score: parseInt(c.score) || 0,
            abbreviation: c.team.abbreviation,
            displayName: c.team.displayName,
            id: c.team.id,
          };
        });

        const localMatch = matches.find(m => {
          const mHome = m.homeTeam.toLowerCase();
          const mAway = m.awayTeam.toLowerCase();
          return teamMap[mHome] && teamMap[mAway];
        });

        if (localMatch) {
          const state = apiMatch.status.type.state; // 'pre', 'in', 'post'
          const isLive = state === 'in';
          const isFinished = state === 'post';
          
          const espnStatus = apiMatch.status.type.name; // e.g. STATUS_HALFTIME
          const matchStatus = espnStatus === 'STATUS_HALFTIME' ? 'PAUSED' : null;

          // Map goals by TEAM ABBREVIATION — structurally impossible to swap
          const homeGoals = teamMap[localMatch.homeTeam.toLowerCase()].score;
          const awayGoals = teamMap[localMatch.awayTeam.toLowerCase()].score;

          let minuteStr = apiMatch.status.displayClock || "0";
          minuteStr = minuteStr.replace("'", "");

          // Helper: resolve ESPN team id/displayName to our abbreviation
          const resolveTeamAbbr = (espnTeamId, espnTeamName) => {
            for (const c of competitors) {
              if ((espnTeamId && c.team.id === espnTeamId) || (espnTeamName && c.team.displayName === espnTeamName)) {
                return c.team.abbreviation;
              }
            }
            return '';
          };

          // Fetch summary for this match
          const sumRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${apiMatch.id}`);
          const sumData = await sumRes.json();
          
          let matchEvents = [];
          if (sumData.keyEvents) {
            sumData.keyEvents.forEach(ke => {
              const typeId = ke.type?.id;
              const isGoal = typeId === "70" || typeId === "137" || typeId === "73" || ke.scoringPlay;
              const isRed = typeId === "93" || typeId === "100";

              if (isGoal) {
                const teamAbbr = resolveTeamAbbr(ke.team?.id, ke.team?.displayName);

                const scorer = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
                const assister = ke.participants && ke.participants.length > 1 ? ke.participants[1].athlete.displayName || ke.participants[1].athlete.shortName : '';

                if (scorer) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'goal', team: teamAbbr, player: scorer });
                if (assister) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'assist', team: teamAbbr, player: assister });
              } else if (isRed) {
                const teamAbbr = resolveTeamAbbr(ke.team?.id, ke.team?.displayName);
                
                const player = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
                if (player) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'red', team: teamAbbr, player: player });
              }
            });
          } else {
            const apiDetails = apiMatch.competitions[0].details || [];
            apiDetails.forEach(detail => {
              const isGoal = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('goal')) || detail.scoringPlay;
              const isRed = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('red card')) || detail.redCard;
              
              if (isGoal || isRed) {
                const player = detail.athletesInvolved && detail.athletesInvolved.length > 0 ? detail.athletesInvolved[0].shortName : '';
                const teamAbbr = resolveTeamAbbr(detail.team?.id, null);
                
                matchEvents.push({
                  min: detail.clock ? detail.clock.displayValue : '',
                  type: isGoal ? 'goal' : 'red',
                  team: teamAbbr,
                  player: player
                });
              }
            });
          }

          const saved = currentResults[localMatch.id];
          
          const newPayloadLive = { home: homeGoals, away: awayGoals, live: true, minute: minuteStr, events: matchEvents, status: matchStatus, updatedAt: new Date().toISOString() };
          const newPayloadDone = { home: homeGoals, away: awayGoals, events: matchEvents, status: matchStatus, updatedAt: new Date().toISOString() };
          
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
      }

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
