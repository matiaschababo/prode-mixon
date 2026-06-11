import { matches } from '../data/matches.js';
import { isParticipantInProgram, participants } from '../data/participants.js';
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

export function getDynamicUsers() {
  return Object.values(prodeState.users).map(u => ({
    id: u.uid,
    name: u.displayName || 'Usuario',
    email: u.email || '',
    photo: u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.uid,
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
    name: u.displayName || 'Usuario',
    photo: u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.uid,
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
  'matiaschababo@gmail.com', // Correo real de Matías
  'edu.mixon@gmail.com',      // Reemplazar con el correo real del Edu
  'manzo.coinary@gmail.com'   // Correo real de Manzo
];

export function isMasterAdmin(email) {
  if (!email) return false;
  return MASTER_ADMINS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
