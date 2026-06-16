import { matches } from '../data/matches.js';
import { isParticipantInProgram } from '../data/participants.js';
import { calculatePoints } from './scoring.js';
import { db, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, addDoc, serverTimestamp, orderBy, limit, increment, deleteField } from './firebase.js';
import { getAuth } from 'firebase/auth';

let prodeState = {
  predictions: {},
  results: {},
  users: {},
  chatMessages: []
};

let loadingState = { results: false, predictions: false, users: false };
let cachedRankings = null;
let cachedMatchStats = null;
let cachedMVPCounts = null;

export function isDataReady() {
  return loadingState.results && loadingState.predictions && loadingState.users;
}

// Start listening to Firebase data
export function initializeFirebaseSync(onUpdateCallback) {
  // Listen to results
  onSnapshot(doc(db, "global", "results"), (docSnap) => {
    if (docSnap.exists()) {
      prodeState.results = docSnap.data();
      cachedRankings = null;
      cachedMVPCounts = null;
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
    cachedRankings = null;
    cachedMatchStats = null;
    cachedMVPCounts = null;
    loadingState.predictions = true;
    onUpdateCallback();
  });

  // Listen to users
  onSnapshot(collection(db, "users"), (snapshot) => {
    const newUsers = {};
    snapshot.forEach(docSnap => {
      newUsers[docSnap.id] = docSnap.data();
    });
    prodeState.users = newUsers;
    cachedRankings = null;
    cachedMVPCounts = null;
    loadingState.users = true;
    onUpdateCallback();
  });

  // Listen to Chat Messages (latest 50)
  const chatQuery = query(collection(db, "chat_messages"), orderBy("timestamp", "desc"), limit(50));
  onSnapshot(chatQuery, (snapshot) => {
    const msgs = [];
    snapshot.forEach(docSnap => {
      msgs.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Reverse to show oldest first at the top of the chat window
    prodeState.chatMessages = msgs.reverse();
    onUpdateCallback('chat');
  });
}

export function getChatMessages() {
  return prodeState.chatMessages;
}

export async function sendChatMessage(text, type = 'text', gifUrl = '', replyTo = null) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para chatear");

  let photo = user.photoURL;
  if (!photo) {
    const localUser = prodeState.users[user.uid];
    photo = localUser?.photo || getCustomLocalPhoto(user.displayName) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid;
  }

  await addDoc(collection(db, "chat_messages"), {
    uid: user.uid,
    name: capitalizeName(user.displayName),
    photo: photo,
    text: text ? text.trim() : '',
    type: type,
    gifUrl: gifUrl,
    replyTo: replyTo,
    timestamp: serverTimestamp()
  });
}

export async function deleteChatMessage(msgId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para borrar mensajes");

  const msgRef = doc(db, "chat_messages", msgId);
  const msgDoc = await getDoc(msgRef);
  
  if (!msgDoc.exists()) return;
  const msgData = msgDoc.data();

  const isAuthor = msgData.uid === user.uid;
  const isMod = MASTER_ADMINS.includes(user.email);

  if (!isAuthor && !isMod) throw new Error("No tienes permisos para borrar este mensaje");
  
  await deleteDoc(msgRef);
}

export async function toggleLikeChatMessage(msgId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para dar like");

  const msgRef = doc(db, "chat_messages", msgId);
  const msgDoc = await getDoc(msgRef);
  if (!msgDoc.exists()) return;
  
  const data = msgDoc.data();
  const likes = data.likes || [];
  const uid = user.uid;
  const userName = capitalizeName(user.displayName);

  const existingLike = likes.find(l => l.uid === uid);

  if (existingLike) {
    await updateDoc(msgRef, {
      likes: arrayRemove(existingLike)
    });
  } else {
    const localUser = prodeState.users[user.uid];
    const photoUrl = localUser?.photo || getCustomLocalPhoto(user.displayName) || user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid;
    await updateDoc(msgRef, {
      likes: arrayUnion({ uid, name: userName, photo: photoUrl })
    });
  }
}

export async function banUser(uid) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !MASTER_ADMINS.includes(user.email)) throw new Error("No tienes permisos para moderar");
  await setDoc(doc(db, "users", uid), { isBanned: true }, { merge: true });
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
    await updateDoc(userDocRef, {
      [matchId]: deleteField()
    }).catch(async (e) => {
      // If doc doesn't exist yet, updateDoc fails. We can safely ignore or set empty object.
    });
  } else {
    await setDoc(userDocRef, {
      [matchId]: { home: Number(home), away: Number(away), timestamp: serverTimestamp() }
    }, { merge: true });
  }
}

export async function adminSavePrediction(userId, matchId, home, away) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !isMasterAdmin(user.email)) throw new Error("Acceso denegado.");

  const userDocRef = doc(db, 'predictions', userId);
  
  if (home === '' || away === '') {
    await updateDoc(userDocRef, {
      [matchId]: deleteField()
    }).catch(() => {});
  } else {
    await setDoc(userDocRef, {
      [matchId]: { home: Number(home), away: Number(away), timestamp: serverTimestamp() }
    }, { merge: true });
  }
}

// Admin save result function
export async function adminSaveResult(matchId, home, away) {
  const resultsRef = doc(db, "global", "results");
  if (home === '' || away === '') {
    await updateDoc(resultsRef, {
      [matchId]: deleteField()
    }).catch(() => {});
  } else {
    await setDoc(resultsRef, {
      [matchId]: { home: Number(home), away: Number(away), timestamp: serverTimestamp() }
    }, { merge: true });
  }
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

export function getCustomLocalPhoto(name) {
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

export function getMatchStats(matchId) {
  if (cachedMatchStats && cachedMatchStats[matchId]) return cachedMatchStats[matchId];
  if (!cachedMatchStats) cachedMatchStats = {};
  
  const predsForMatch = getPredictions()[String(matchId)] || {};
  let total = 0, home = 0, away = 0, draw = 0;
  Object.values(predsForMatch).forEach(p => {
    if (p.home > p.away) home++;
    else if (p.away > p.home) away++;
    else draw++;
    total++;
  });
  
  cachedMatchStats[matchId] = { total, home, away, draw };
  return cachedMatchStats[matchId];
}

export function getParticipantStats(participantId) {
  const predictions = getPredictions();
  const stats = { totalPoints: 0, played: 0, hits: 0, exacts: 0, currentStreak: 0, exactStreak: 0, badges: [] };
  let totalLikes = 0;

  matches.forEach(match => {
    const prediction = predictions[String(match.id)]?.[participantId];
    if (prediction && prediction.likes) totalLikes += prediction.likes.length;

    const result = getMatchResult(match);
    if (!prediction || !result || result.live) return;

    const points = calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage);
    stats.totalPoints += points;
    stats.played += 1;
    
    if (points > 0) {
      stats.hits += 1;
      stats.currentStreak += 1;
      
      if (!stats.badges.includes('El Contra')) {
        const matchStats = getMatchStats(match.id);
        if (matchStats.total > 0) {
          let pickedPct = 0;
          if (prediction.home > prediction.away) pickedPct = matchStats.home / matchStats.total;
          else if (prediction.away > prediction.home) pickedPct = matchStats.away / matchStats.total;
          else pickedPct = matchStats.draw / matchStats.total;
          
          if (pickedPct < 0.15) stats.badges.push('El Contra');
        }
      }
    } else {
      stats.currentStreak = 0;
    }

    if (points === calculatePoints(result.home, result.away, result.home, result.away, match.stage)) {
      stats.exacts += 1;
      stats.exactStreak += 1;
    } else {
      stats.exactStreak = 0;
    }

    if (prediction.timestamp && !stats.badges.includes('Buzzer Beater')) {
       const matchTime = new Date(match.date).getTime();
       const predTime = prediction.timestamp.toMillis ? prediction.timestamp.toMillis() : prediction.timestamp;
       if (matchTime - predTime <= 5 * 60 * 1000 && matchTime - predTime >= 0) {
           stats.badges.push('Buzzer Beater');
       }
    }
  });

  if (stats.exacts >= 10) stats.badges.push('El Oráculo');
  if (totalLikes >= 50) stats.badges.push('Influencer');

  const mvpDates = getHistoricalMVPCounts()[participantId] || [];
  stats.mvpCount = mvpDates.length;
  stats.mvpDates = mvpDates;

  return stats;
}

export function getRankedParticipants(programId = null) {
  if (!cachedRankings) {
    const dynamicUsers = Object.values(prodeState.users).map(u => ({
      id: u.uid,
      name: capitalizeName(u.displayName),
      photo: u.photo || getCustomLocalPhoto(u.displayName) || u.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.uid,
      program: u.program || 'viewers',
      role: u.role || 'Viewer'
    }));

    cachedRankings = dynamicUsers
      .map(participant => ({
        ...participant,
        ...getParticipantStats(participant.id)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.exacts - a.exacts || a.name.localeCompare(b.name));
  }

  return cachedRankings.filter(participant => !programId || isParticipantInProgram(participant, programId));
}

export function getDailyMVP() {
  const dynamicUsers = getDynamicUsers();
  const preds = getPredictions();
  
  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setHours(d.getHours() - 4);
    return d.toDateString();
  };

  const matchdays = {};
  matches.forEach(m => {
    const d = getLogicalDate(m.date);
    if (!matchdays[d]) matchdays[d] = { matches: [], finishedCount: 0 };
    matchdays[d].matches.push(m);
    const res = getMatchResult(m);
    if (res && !res.live) {
      matchdays[d].finishedCount++;
    }
  });

  let latestCompleteDate = null;
  let maxTime = 0;
  Object.keys(matchdays).forEach(d => {
    const day = matchdays[d];
    if (day.finishedCount === day.matches.length && day.matches.length > 0) {
      const dayTime = new Date(d).getTime();
      if (dayTime > maxTime) {
        maxTime = dayTime;
        latestCompleteDate = d;
      }
    }
  });

  if (!latestCompleteDate) return null;
  const dailyMatches = matchdays[latestCompleteDate].matches;
  
  let bestUser = null;
  let maxPoints = -1;
  let maxExacts = -1;
  let minTimestamp = Infinity;
  let bestMatchesInfo = [];
  
  dynamicUsers.forEach(user => {
    let pts = 0;
    let exacts = 0;
    let latestTimestamp = 0;
    let userMatchesInfo = [];
    
    dailyMatches.forEach(match => {
      const p = preds[String(match.id)]?.[user.id];
      const r = getMatchResult(match);
      if (p && r) {
        const pt = calculatePoints(p.home, p.away, r.home, r.away, match.stage);
        pts += pt;
        if (pt === calculatePoints(r.home, r.away, r.home, r.away, match.stage) && pt > 0) exacts++;
        const ts = p.timestamp ? (p.timestamp.toMillis ? p.timestamp.toMillis() : new Date(p.timestamp).getTime()) : 0;
        if (ts > latestTimestamp) latestTimestamp = ts;
        userMatchesInfo.push({ match, prediction: p, result: r, points: pt });
      }
    });
    
    if (pts > 0) {
      if (pts > maxPoints) {
        maxPoints = pts; maxExacts = exacts; minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
      } else if (pts === maxPoints) {
        if (exacts > maxExacts) {
          maxExacts = exacts; minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
        } else if (exacts === maxExacts) {
          if (latestTimestamp < minTimestamp && latestTimestamp > 0) {
            minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
          }
        }
      }
    }
  });
  
  if (maxPoints > 0) return { ...bestUser, dailyPoints: maxPoints, dailyExacts: maxExacts, matchCount: dailyMatches.length, matchesInfo: bestMatchesInfo, matchdayDate: latestCompleteDate };
  return null;
}

export function getHistoricalMVPCounts() {
  if (cachedMVPCounts) return cachedMVPCounts;
  
  const dynamicUsers = getDynamicUsers();
  const preds = getPredictions();
  
  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setHours(d.getHours() - 4);
    return d.toDateString();
  };

  const matchdays = {};
  matches.forEach(m => {
    const d = getLogicalDate(m.date);
    if (!matchdays[d]) matchdays[d] = { matches: [], finishedCount: 0 };
    matchdays[d].matches.push(m);
    const res = getMatchResult(m);
    if (res && !res.live) {
      matchdays[d].finishedCount++;
    }
  });

  const counts = {};
  
  Object.keys(matchdays).forEach(date => {
    const day = matchdays[date];
    if (day.finishedCount !== day.matches.length || day.matches.length === 0) return;
    
    const dailyMatches = day.matches;
    let maxPoints = -1;
    let maxExacts = -1;
    let minTimestamp = Infinity;
    let bestUsers = [];
    
    dynamicUsers.forEach(user => {
      let pts = 0;
      let exacts = 0;
      let latestTimestamp = 0;
      dailyMatches.forEach(match => {
        const p = preds[String(match.id)]?.[user.id];
        const r = getMatchResult(match);
        if (p && r) {
          const pt = calculatePoints(p.home, p.away, r.home, r.away, match.stage);
          pts += pt;
          if (pt === calculatePoints(r.home, r.away, r.home, r.away, match.stage) && pt > 0) exacts++;
          const ts = p.timestamp ? (p.timestamp.toMillis ? p.timestamp.toMillis() : new Date(p.timestamp).getTime()) : 0;
          if (ts > latestTimestamp) latestTimestamp = ts;
        }
      });
      
      if (pts > 0) {
        if (pts > maxPoints) {
          maxPoints = pts; maxExacts = exacts; minTimestamp = latestTimestamp; bestUsers = [user];
        } else if (pts === maxPoints) {
          if (exacts > maxExacts) {
            maxExacts = exacts; minTimestamp = latestTimestamp; bestUsers = [user];
          } else if (exacts === maxExacts) {
            if (latestTimestamp < minTimestamp && latestTimestamp > 0) {
              minTimestamp = latestTimestamp; bestUsers = [user];
            } else if (latestTimestamp === minTimestamp || latestTimestamp === 0) {
              bestUsers.push(user);
            }
          }
        }
      }
    });
    
    if (maxPoints > 0) {
      bestUsers.forEach(u => {
        if (!counts[u.id]) counts[u.id] = [];
        counts[u.id].push(date);
      });
    }
  });
  
  cachedMVPCounts = counts;
  return counts;
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
  console.log("🟢 Live Match Engine polling backend API");
  
  const triggerLiveUpdate = async () => {
    try {
      await fetch('/api/cron-live-matches');
    } catch (e) {
      console.log('Live update skipped');
    }
  };
  
  // Trigger once immediately, then every 60 seconds
  triggerLiveUpdate();
  if (liveEngineInterval) clearInterval(liveEngineInterval);
  liveEngineInterval = setInterval(triggerLiveUpdate, 60000);
}

// ==============================================
// Social Predictions (Likes, Shares, Notifications)
// ==============================================

export async function togglePredictionLike(matchId, targetUserId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para dar me gusta");

  const predRef = doc(db, 'predictions', targetUserId);
  const snap = await getDoc(predRef);
  const current = snap.data() || {};
  
  if (!current[matchId]) return;

  const currentLikes = current[matchId]?.likes || [];
  const userLikedIndex = currentLikes.findIndex(l => l.uid === user.uid);
  
  const uid = user.uid;
  const name = user.displayName || 'Usuario';
  const photo = user.photoURL || '';

  let isLiking = false;

  if (userLikedIndex >= 0) {
    const existingLike = currentLikes[userLikedIndex];
    await updateDoc(predRef, {
      [`${matchId}.likes`]: arrayRemove(existingLike)
    });
  } else {
    isLiking = true;
    await updateDoc(predRef, {
      [`${matchId}.likes`]: arrayUnion({ uid, name, photo })
    });
  }

  // Send Notification
  if (isLiking && targetUserId !== user.uid) {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      fromUserId: user.uid,
      fromUserName: user.displayName || 'Alguien',
      fromUserPhoto: user.photoURL || '',
      type: 'like',
      matchId: matchId,
      timestamp: serverTimestamp(),
      read: false
    });
  }
}

export async function incrementPredictionShares(matchId, targetUserId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const predRef = doc(db, 'predictions', targetUserId);
  const snap = await getDoc(predRef);
  const current = snap.data() || {};
  
  if (!current[matchId]) return;

  await updateDoc(predRef, {
    [`${matchId}.shares`]: increment(1)
  });

  if (targetUserId !== user.uid) {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      fromUserId: user.uid,
      fromUserName: user.displayName || 'Alguien',
      fromUserPhoto: user.photoURL || '',
      type: 'share',
      matchId: matchId,
      timestamp: serverTimestamp(),
      read: false
    });
  }
}

export function listenToNotifications(userId, callback) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
}

export async function markNotificationsAsRead(userId) {
  // Using multiple updateDoc calls since writeBatch can be overkill for a few unread notifications
  // In a real prod environment with many notifications, we might query unread ones first.
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

