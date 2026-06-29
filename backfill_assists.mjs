import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
if (!serviceAccount) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT environment variable.");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

import { readFileSync } from 'fs';
const matchesText = readFileSync('./src/data/matches.js', 'utf8');
// Just a dirty way to extract matches
const matchesMatch = matchesText.match(/export const matches = (\[[\s\S]*?\]);/);
let localMatches = [];
if (matchesMatch) {
  localMatches = eval(matchesMatch[1]);
}

async function run() {
  console.log("Fetching scoreboard for the entire tournament...");
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260720&limit=200`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.events || data.events.length === 0) {
    console.log("No events found in scoreboard.");
    return;
  }

  const resultsRef = db.collection('global').doc('results');
  const resultsDoc = await resultsRef.get();
  const currentResults = resultsDoc.exists ? resultsDoc.data() : {};
  let changed = false;

  for (const apiMatch of data.events) {
    const homeTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'home');
    const awayTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'away');
    if (!homeTeamData || !awayTeamData) continue;

    const localMatch = localMatches.find(m => {
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

    if (!isLive && !isFinished) continue; // Only process matches with events

    let homeGoals = parseInt(homeTeamData.score) || 0;
    let awayGoals = parseInt(awayTeamData.score) || 0;
    if (localMatch.homeTeam.toLowerCase() === awayTeamData.team.abbreviation.toLowerCase()) {
      homeGoals = parseInt(awayTeamData.score) || 0;
      awayGoals = parseInt(homeTeamData.score) || 0;
    }

    let minuteStr = apiMatch.status.displayClock || "0";
    minuteStr = minuteStr.replace("'", "");

    // Fetch summary for this match
    console.log(`Fetching summary for match ${localMatch.id}: ${apiMatch.name}`);
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
          // Find abbreviation from local matches or API competitors
          let teamAbbr = '';
          if (homeTeamData.team.displayName === team) teamAbbr = homeTeamData.team.abbreviation;
          else if (awayTeamData.team.displayName === team) teamAbbr = awayTeamData.team.abbreviation;

          const scorer = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
          const assister = ke.participants && ke.participants.length > 1 ? ke.participants[1].athlete.displayName || ke.participants[1].athlete.shortName : '';

          if (scorer) {
            matchEvents.push({
              min: ke.clock?.displayValue || '',
              type: 'goal',
              team: teamAbbr,
              player: scorer
            });
          }
          if (assister) {
            matchEvents.push({
              min: ke.clock?.displayValue || '',
              type: 'assist',
              team: teamAbbr,
              player: assister
            });
          }
        } else if (isRed) {
          const team = ke.team?.displayName || '';
          let teamAbbr = '';
          if (homeTeamData.team.displayName === team) teamAbbr = homeTeamData.team.abbreviation;
          else if (awayTeamData.team.displayName === team) teamAbbr = awayTeamData.team.abbreviation;
          
          const player = ke.participants && ke.participants.length > 0 ? ke.participants[0].athlete.displayName || ke.participants[0].athlete.shortName : '';
          if (player) {
            matchEvents.push({
              min: ke.clock?.displayValue || '',
              type: 'red',
              team: teamAbbr,
              player: player
            });
          }
        }
      });
    } else {
      // Fallback to details if keyEvents is not available
      const apiDetails = apiMatch.competitions[0].details || [];
      apiDetails.forEach(detail => {
        const isGoal = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('goal')) || detail.scoringPlay;
        const isRed = (detail.type && detail.type.text && detail.type.text.toLowerCase().includes('red card')) || detail.redCard;
        if (isGoal || isRed) {
          const player = detail.athletesInvolved && detail.athletesInvolved.length > 0 ? detail.athletesInvolved[0].shortName : '';
          const teamData = apiMatch.competitions[0].competitors.find(c => c.team.id === detail.team.id);
          const teamAbbr = teamData ? teamData.team.abbreviation : '';
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
    console.log("Updating Firebase results doc...");
    await resultsRef.set(currentResults);
    console.log("Done.");
  } else {
    console.log("No changes in results.");
  }
}

run().catch(console.error);
