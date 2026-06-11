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

// Start listening to Firebase data
export function initializeFirebaseSync(onUpdateCallback) {
  // Listen to results
  onSnapshot(doc(db, "global", "results"), (docSnap) => {
    if (docSnap.exists()) {
      prodeState.results = docSnap.data();
    }
    onUpdateCallback();
  });

  // Listen to all predictions (scalable for staff, we will need pagination/functions for 50k users later)
  onSnapshot(collection(db, "predictions"), (snapshot) => {
    const newPredictions = {};
    snapshot.forEach(docSnap => {
      const userId = docSnap.id;
      const userPreds = docSnap.data();
      
      // Convert from { matchId: {home, away} } to { matchId: { userId: {home, away} } }
      Object.entries(userPreds).forEach(([matchId, pred]) => {
        if (!newPredictions[matchId]) newPredictions[matchId] = {};
        newPredictions[matchId][userId] = pred;
      });
    });
    prodeState.predictions = newPredictions;
    onUpdateCallback();
  });

  // Listen to users
  onSnapshot(collection(db, "users"), (snapshot) => {
    const users = {};
    snapshot.forEach(docSnap => {
      users[docSnap.id] = docSnap.data();
    });
    prodeState.users = users;
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
    if (!prediction || !result) return stats;

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

  // The Master Admin's browser will act as the cron job to fetch real data
  console.log("🟢 Live Match Engine (Real API Mode) Started");

  liveEngineInterval = setInterval(async () => {
    try {
      // Intentamos obtener la key de las variables de entorno
      const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;
      
      // Si no hay key, no hacemos nada (el usuario debe configurarla)
      if (!apiKey) {
        console.warn("⚠️ Falta VITE_API_FOOTBALL_KEY en .env. El motor de datos reales está pausado.");
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      // Buscamos los partidos de la Copa Mundial 2026 (League ID = 1) para el día de hoy
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}&league=1&season=2026`, {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey
        }
      });
      const data = await res.json();
      
      if (data.response && data.response.length > 0) {
        const currentResults = { ...getResults() };
        let changed = false;

        data.response.forEach(apiMatch => {
          // Buscamos en nuestra base local un partido que coincida en equipos
          const localMatch = matches.find(m => {
            const apiHome = apiMatch.teams.home.name.toLowerCase();
            const apiAway = apiMatch.teams.away.name.toLowerCase();
            // Esto asume que los nombres o al menos los primeros caracteres coinciden
            // Para un proyecto en producción real, se armaría un diccionario de mapeo de IDs
            return apiHome.includes(m.homeTeam.toLowerCase()) || 
                   m.homeTeam.toLowerCase().includes(apiHome.substring(0, 3));
          });

          if (localMatch) {
            const isLive = apiMatch.fixture.status.short === '1H' || 
                           apiMatch.fixture.status.short === '2H' ||
                           apiMatch.fixture.status.short === 'HT' ||
                           apiMatch.fixture.status.short === 'ET' ||
                           apiMatch.fixture.status.short === 'P';
                           
            const isFinished = apiMatch.fixture.status.short === 'FT' || 
                               apiMatch.fixture.status.short === 'AET' || 
                               apiMatch.fixture.status.short === 'PEN';

            const homeGoals = apiMatch.goals.home ?? 0;
            const awayGoals = apiMatch.goals.away ?? 0;
            const minute = apiMatch.fixture.status.elapsed;

            const saved = currentResults[localMatch.id];
            
            if (isLive) {
              if (!saved || saved.home !== homeGoals || saved.away !== awayGoals || saved.minute !== minute) {
                currentResults[localMatch.id] = { home: homeGoals, away: awayGoals, live: true, minute: minute };
                changed = true;
              }
            } else if (isFinished) {
              if (!saved || saved.home !== homeGoals || saved.away !== awayGoals || saved.live) {
                currentResults[localMatch.id] = { home: homeGoals, away: awayGoals };
                changed = true;
              }
            }
          }
        });

        if (changed) {
          const resultsRef = doc(db, 'global', 'results');
          await setDoc(resultsRef, currentResults);
          console.log("✅ Resultados reales sincronizados con la API");
        }
      }
    } catch (e) {
      console.error("Error fetching live real data:", e);
    }
  }, 60000); // Check every 60 seconds
}
