import { matches } from '../data/matches.js';
import { isParticipantInProgram } from '../data/participants.js';
import { calculatePoints } from './scoring.js';
import { db, doc, getDoc, setDoc, onSnapshot, collection, query } from './firebase.js';
import { getAuth } from 'firebase/auth';

let prodeState = {
  predictions: {},
  results: {},
  users: {}
};

let loadingState = { results: false, predictions: false, users: false };

export function isDataReady() {
  return loadingState.results && loadingState.predictions && loadingState.users;
}

// Start listening to Firebase data
export function initializeFirebaseSync(onUpdateCallback) {
  // Listen to results
  onSnapshot(doc(db, "global", "results"), (docSnap) => {
    if (docSnap.exists()) {
      prodeState.results = docSnap.data();
    }
    loadingState.results = true;
    onUpdateCallback();
  });

  // Listen to all predictions
  onSnapshot(collection(db, "predictions"), (snapshot) => {
    const newPredictions = {};
    snapshot.forEach(docSnap => {
      const userId = docSnap.id;
      const userPreds = docSnap.data();
      
      Object.entries(userPreds).forEach(([matchId, pred]) => {
        if (!newPredictions[matchId]) newPredictions[matchId] = {};
        newPredictions[matchId][userId] = pred;
      });
    });
    prodeState.predictions = newPredictions;
    loadingState.predictions = true;
    onUpdateCallback();
  });

  // Listen to users
  onSnapshot(collection(db, "users"), (snapshot) => {
    const users = {};
    snapshot.forEach(docSnap => {
      users[docSnap.id] = docSnap.data();
    });
    prodeState.users = users;
    loadingState.users = true;
    onUpdateCallback();
  });
}

export function getPredictions() {
  return prodeState.predictions;
}

export function getResults() {
  return prodeState.results;
}

// User-facing save function (only saves for the logged-in user)
export async function saveMyPrediction(matchId, home, away) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para predecir.");

  // Verificar que el partido no haya empezado
  const match = matches.find(m => m.id == matchId);
  if (!match) throw new Error("Partido no encontrado");
  if (new Date() >= new Date(match.date)) {
    throw new Error("El partido ya comenzó, no se pueden modificar las predicciones.");
  }

  const userDocRef = doc(db, 'predictions', user.uid);
  
  if (home === '' || away === '') {
    // We would need to use FieldValue.delete() to remove it, but for simplicity we can just set it to null or update the whole doc
    const currentPreds = (await getDoc(userDocRef)).data() || {};
    delete currentPreds[matchId];
    await setDoc(userDocRef, currentPreds);
  } else {
    await setDoc(userDocRef, {
      [matchId]: { home: Number(home), away: Number(away) }
    }, { merge: true });
  }
}

export async function adminSavePrediction(userId, matchId, home, away) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !isMasterAdmin(user.email)) throw new Error("Acceso denegado.");

  const userDocRef = doc(db, 'predictions', userId);
  
  if (home === '' || away === '') {
    const currentPreds = (await getDoc(userDocRef)).data() || {};
    delete currentPreds[matchId];
    await setDoc(userDocRef, currentPreds);
  } else {
    await setDoc(userDocRef, {
      [matchId]: { home: Number(home), away: Number(away) }
    }, { merge: true });
  }
}

// Admin save result function
export async function saveResult(matchId, home, away) {
  const resultsRef = doc(db, "global", "results");
  const currentResults = (await getDoc(resultsRef)).data() || {};
  
  if (home === '' || away === '') {
    delete currentResults[matchId];
  } else {
    currentResults[matchId] = { home: Number(home), away: Number(away) };
  }
  
  await setDoc(resultsRef, currentResults);
}

export function getMatchResult(match) {
  const saved = getResults()[String(match.id)];
  if (saved) return saved;
  if (match.homeScore !== null && match.awayScore !== null) {
    return { home: match.homeScore, away: match.awayScore };
  }
  return null;
}

function capitalizeName(name) {
  if (!name) return 'Usuario';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getCustomLocalPhoto(name) {
  const n = name ? name.toLowerCase() : '';
  if (n.includes('matias') && n.includes('chababo')) return '/assets/matias.jpg';
  if (n.includes('abril') && n.includes('zabaleta')) return '/assets/abril.jpg';
  if (n.includes('dianela') && n.includes('caracchi')) return '/assets/dianela.jpg';
  if (n.includes('tomas') && n.includes('holder')) return '/assets/tomas.jpg';
  if (n.includes('facu') && n.includes('colman')) return '/assets/facu.png';
  if (n.includes('fran') && n.includes('metz')) return '/assets/fran.png';
  if (n.includes('gonza') && n.includes('acevedo')) return '/assets/gonza.jpg';
  if (n.includes('grito') && n.includes('villagra')) return '/assets/grito.jpg';
  if (n.includes('pato') && n.includes('filippini')) return '/assets/pato.jpg';
  if (n.includes('lobell')) return '/assets/lobell.jpg';
  if (n.includes('tomi') && n.includes('messi')) return '/assets/tomi.jpg';
  if (n.includes('tonali')) return '/assets/tonali.jpg';
  return null;
}

export function getDynamicUsers() {
  return Object.values(prodeState.users).map(u => ({
    id: u.uid,
    name: capitalizeName(u.displayName),
    email: u.email || '',
    photo: u.photo || getCustomLocalPhoto(u.displayName) || u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.uid,
    program: u.program || 'viewers',
    role: u.role || 'Viewer'
  }));
}

export async function updateUserRole(uid, program, role) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { program, role }, { merge: true });
}

export function getParticipantStats(participantId) {
  const predictions = getPredictions();

  return matches.reduce((stats, match) => {
    const prediction = predictions[String(match.id)]?.[participantId];
    const result = getMatchResult(match);
    if (!prediction || !result || result.live) return stats;

    const points = calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage);
    stats.totalPoints += points;
    stats.played += 1;
    if (points > 0) stats.hits += 1;
    if (points === calculatePoints(result.home, result.away, result.home, result.away, match.stage)) {
      stats.exacts += 1;
    }
    return stats;
  }, { totalPoints: 0, played: 0, hits: 0, exacts: 0 });
}

export function getRankedParticipants(programId = null) {
  const dynamicUsers = Object.values(prodeState.users).map(u => ({
    id: u.uid,
    name: capitalizeName(u.displayName),
    photo: u.photo || getCustomLocalPhoto(u.displayName) || u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.uid,
    program: u.program || 'viewers',
    role: u.role || 'Viewer'
  }));

  return dynamicUsers
    .filter(participant => !programId || isParticipantInProgram(participant, programId))
    .map(participant => ({
      ...participant,
      ...getParticipantStats(participant.id)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.exacts - a.exacts || a.name.localeCompare(b.name));
}

export async function ensureUserExists(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      program: 'viewers',
      role: 'Viewer'
    });
  }
}

export const MASTER_ADMINS = [
  'matiaschababo@gmail.com',
  'manzo.coinary@gmail.com',
  'Pitta.visual.garden@gmail.com'
];

export async function updateUserPhoto(userId, photoUrl) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) throw new Error("Debes iniciar sesión");
  
  // Only Master Admins can change photos to prevent inappropriate links
  if (!isMasterAdmin(user.email)) {
    throw new Error("Solo los Master Admins pueden cambiar las fotos de perfil");
  }

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { photo: photoUrl || null }, { merge: true });
}

export function isMasterAdmin(email) {
  if (!email) return false;
  return MASTER_ADMINS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

export async function updateUserDisplayName(newName) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión");
  if (!newName || !newName.trim()) throw new Error("El nombre no puede estar vacío");

  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, { displayName: newName.trim() }, { merge: true });
}

let liveEngineInterval = null;

export function startLiveMatchEngine() {
  if (liveEngineInterval) return;

  const auth = getAuth();
  if (!auth.currentUser || !isMasterAdmin(auth.currentUser.email)) return;

  console.log("🟢 Live Match Engine (ESPN Free API Mode) Started");

  const runEngine = async () => {
    try {
      // Obtenemos la fecha en formato YYYYMMDD para la API de ESPN
      const todayDate = new Date();
      const yyyy = todayDate.getFullYear();
      const mm = String(todayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(todayDate.getDate()).padStart(2, '0');
      
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${yyyy}${mm}${dd}`);
      const data = await res.json();
      
      if (data.events && data.events.length > 0) {
        const currentResults = { ...getResults() };
        let changed = false;

        data.events.forEach(apiMatch => {
          const homeTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'home');
          const awayTeamData = apiMatch.competitions[0].competitors.find(c => c.homeAway === 'away');
          
          if (!homeTeamData || !awayTeamData) return;

          const localMatch = matches.find(m => {
            return m.homeTeam.toLowerCase() === homeTeamData.team.abbreviation.toLowerCase() ||
                   m.awayTeam.toLowerCase() === awayTeamData.team.abbreviation.toLowerCase();
          });

          if (localMatch) {
            const state = apiMatch.status.type.state; // 'pre', 'in', 'post'
            const isLive = state === 'in';
            const isFinished = state === 'post';

            const homeGoals = parseInt(homeTeamData.score) || 0;
            const awayGoals = parseInt(awayTeamData.score) || 0;
            // ESPN displayClock gives things like "75'" or "45+2'". We'll strip the quote.
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
            
            // To check if changed we can JSON stringify
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
          const resultsRef = doc(db, 'global', 'results');
          await setDoc(resultsRef, currentResults);
          console.log("✅ Resultados reales sincronizados con ESPN API");
        }
      }
    } catch (e) {
      console.error("Error fetching live real data:", e);
    }
  };

  // Ejecutamos inmediatamente
  runEngine();
  
  // Y luego cada 60 segundos
  liveEngineInterval = setInterval(runEngine, 60000);
}
