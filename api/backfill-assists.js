import { matches } from '../src/data/matches.js';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Error inicializando Firebase Admin", error);
  }
}

export default async function handler(request, response) {
  if (getApps().length === 0) {
    return response.status(500).json({ error: "Firebase Admin no está configurado." });
  }
  const db = getFirestore();
  
  try {
    console.log("Fetching scoreboard for the entire tournament...");
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260720&limit=200`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.events || data.events.length === 0) {
      return response.status(200).json({ message: "No events found in scoreboard." });
    }

    const resultsRef = db.collection('global').doc('results');
    const resultsDoc = await resultsRef.get();
    const currentResults = resultsDoc.exists ? resultsDoc.data() : {};
    let changed = false;

    for (const apiMatch of data.events) {
      const homeTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'away');
      if (!homeTeamData || !awayTeamData) continue;

      const localMatch = matches.find(m => {
        const apiHome = homeTeamData.team.abbreviation.toLowerCase();
        const apiAway = awayTeamData.team.abbreviation.toLowerCase();
        const mHome = m.homeTeam.toLowerCase();
        const mAway = m.awayTeam.toLowerCase();
        return (mHome === apiHome && mAway === apiAway) || (mHome === apiAway && mAway === apiHome);
      });

      if (!localMatch) continue;

      const state = apiMatch.status.type.state;
      const isLive = state === 'in';
      const isFinished = state === 'post';

      if (!isLive && !isFinished) continue;

      let homeGoals = parseInt(homeTeamData.score) || 0;
      let awayGoals = parseInt(awayTeamData.score) || 0;
      if (localMatch.homeTeam.toLowerCase() === awayTeamData.team.abbreviation.toLowerCase()) {
        homeGoals = parseInt(awayTeamData.score) || 0;
        awayGoals = parseInt(homeTeamData.score) || 0;
      }

      let minuteStr = apiMatch.status.displayClock || "0";
      minuteStr = minuteStr.replace("'", "");

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
            const team = ke.team?.displayName || '';
            let teamAbbr = '';
            if (homeTeamData.team.displayName === team) teamAbbr = homeTeamData.team.abbreviation;
            else if (awayTeamData.team.displayName === team) teamAbbr = awayTeamData.team.abbreviation;

            const scorer = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
            const assister = ke.participants && ke.participants.length > 1 ? ke.participants[1].athlete.displayName || ke.participants[1].athlete.shortName : '';

            if (scorer) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'goal', team: teamAbbr, player: scorer });
            if (assister) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'assist', team: teamAbbr, player: assister });
          } else if (isRed) {
            const team = ke.team?.displayName || '';
            let teamAbbr = '';
            if (homeTeamData.team.displayName === team) teamAbbr = homeTeamData.team.abbreviation;
            else if (awayTeamData.team.displayName === team) teamAbbr = awayTeamData.team.abbreviation;
            
            const player = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
            if (player) matchEvents.push({ min: ke.clock?.displayValue || '', type: 'red', team: teamAbbr, player: player });
          }
        });
      }

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

    if (changed) {
      await resultsRef.set(currentResults);
      return response.status(200).json({ success: true, message: "Backfill complete. Results updated." });
    } else {
      return response.status(200).json({ success: true, message: "No changes needed." });
    }
  } catch (e) {
    console.error("Backfill Error:", e);
    return response.status(500).json({ error: e.message });
  }
}
