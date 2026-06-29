import { matches } from '../data/matches.js';
import { isParticipantInProgram } from '../data/participants.js';
import { calculatePoints } from './scoring.js';
import { db, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, addDoc, serverTimestamp, orderBy, limit, increment, deleteField, analytics, logEvent, setUserId, setUserProperties } from './firebase.js';
import { getAuth } from 'firebase/auth';

export function resolveUid(uid) {
  if (uid === 'gIXWnRDpFLgy5NzmSzUJHlqcxTv2') {
    return 'XmaOWGha0UM8eFBX9ACTMtTGyQ23';
  }
  return uid;
}
if (typeof window !== 'undefined') window.resolveUid = resolveUid;

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
      const userId = resolveUid(docSnap.id);
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
      const u = docSnap.data();
      if (resolveUid(docSnap.id) === docSnap.id) {
        newUsers[docSnap.id] = u;
      }
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

export async function sendChatMessage(text, type = 'text', gifUrl = null, replyTo = null, mvpData = null) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para chatear");

  const resolvedUid = resolveUid(user.uid);
  const localUser = prodeState.users[resolvedUid];
  let photo = localUser?.photo || user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + resolvedUid;

  const msgPayload = {
    uid: resolvedUid,
    name: localUser?.name || capitalizeName(user.displayName),
    photo: photo,
    text: text ? text.trim() : '',
    type: type,
    gifUrl: gifUrl,
    replyTo: replyTo,
    timestamp: serverTimestamp()
  };

  if (mvpData) {
    msgPayload.mvpData = mvpData;
  }

  await addDoc(collection(db, "chat_messages"), msgPayload);

  if (analytics) {
    try { 
      const cleanText = text ? text.trim() : '';
      const hasMention = cleanText.includes('@');
      logEvent(analytics, 'send_chat_message', { 
        message_type: type, 
        has_reply: !!replyTo,
        has_mention: hasMention,
        character_length: cleanText.length
      }); 
    } catch(e) {}
  }
}

export async function deleteChatMessage(msgId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para borrar mensajes");

  const msgRef = doc(db, "chat_messages", msgId);
  const msgDoc = await getDoc(msgRef);
  
  if (!msgDoc.exists()) return;
  const msgData = msgDoc.data();

  const isAuthor = resolveUid(msgData.uid) === resolveUid(user.uid);
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
  const uid = resolveUid(user.uid);
  const userName = capitalizeName(user.displayName);

  const existingLike = likes.find(l => resolveUid(l.uid) === uid);

  if (existingLike) {
    await updateDoc(msgRef, {
      likes: arrayRemove(existingLike)
    });
  } else {
    const localUser = prodeState.users[uid];
    const photoUrl = localUser?.photo || user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + uid;
    await updateDoc(msgRef, {
      likes: arrayUnion({ uid, name: userName, photo: photoUrl })
    });
    if (analytics) {
      try { logEvent(analytics, 'like_chat_message', { msgId: msgId, content_author_id: data.uid }); } catch(e) {}
    }
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
export async function saveMyPrediction(matchId, home, away, advances = null) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Debes iniciar sesión para predecir.");

  // Verificar que el partido no haya empezado
  const match = matches.find(m => m.id == matchId);
  if (!match) throw new Error("Partido no encontrado");
  if (new Date() >= new Date(match.date)) {
    throw new Error("El partido ya comenzó, no se pueden modificar las predicciones.");
  }

  const userDocRef = doc(db, 'predictions', resolveUid(user.uid));
  
  if (home === '' || away === '') {
    await updateDoc(userDocRef, {
      [matchId]: deleteField()
    }).catch(async (e) => {
      // If doc doesn't exist yet, updateDoc fails. We can safely ignore or set empty object.
    });
  } else {
    const data = { home: Number(home), away: Number(away), timestamp: serverTimestamp() };
    if (advances) data.advances = advances;
    await setDoc(userDocRef, {
      [matchId]: data
    }, { merge: true });
    
    if (analytics) {
      try { 
        const predicted_outcome = Number(home) > Number(away) ? 'Home Win' : Number(home) < Number(away) ? 'Away Win' : 'Draw';
        const hours_before_match = (new Date(match.date).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        logEvent(analytics, 'save_prediction', { 
          match_id: matchId, 
          home: home, 
          away: away,
          match_stage: match.stage,
          predicted_outcome: predicted_outcome,
          hours_before_match: Math.round(hours_before_match * 10) / 10
        }); 
      } catch(e) {}
    }
  }
}

export async function adminSavePrediction(userId, matchId, home, away, advances = null) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user || !isMasterAdmin(user.email)) throw new Error("Acceso denegado.");

  const userDocRef = doc(db, 'predictions', resolveUid(userId));
  
  if (home === '' || away === '') {
    await updateDoc(userDocRef, {
      [matchId]: deleteField()
    }).catch(() => {});
  } else {
    const data = { home: Number(home), away: Number(away), timestamp: serverTimestamp() };
    if (advances) data.advances = advances;
    await setDoc(userDocRef, {
      [matchId]: data
    }, { merge: true });
  }
}

// Admin save result function
export async function adminSaveResult(matchId, home, away, winner = null) {
  const resultsRef = doc(db, "global", "results");
  if (home === '' || away === '') {
    await updateDoc(resultsRef, {
      [matchId]: deleteField()
    }).catch(() => {});
  } else {
    const data = { home: Number(home), away: Number(away), timestamp: serverTimestamp() };
    if (winner) {
      data.winner = winner;
    }
    await setDoc(resultsRef, {
      [matchId]: data
    }, { merge: true });
  }
}
export { adminSaveResult as saveResult };

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
  return Object.values(prodeState.users)
    .filter(u => resolveUid(u.uid) === u.uid)
    .map(u => ({
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
  participantId = resolveUid(participantId);
  const predictions = getPredictions();
  const stats = { totalPoints: 0, played: 0, hits: 0, exacts: 0, currentStreak: 0, exactStreak: 0, maxStreak: 0, timeInAdvance: 0, badges: [] };
  let totalLikes = 0;

  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedMatches.forEach(match => {
    const prediction = predictions[String(match.id)]?.[participantId];
    if (prediction && prediction.likes) totalLikes += prediction.likes.length;

    const result = getMatchResult(match);
    if (!result || result.live) return;

    if (!prediction) {
      if (stats.played > 0) {
        stats.currentStreak = 0;
        stats.exactStreak = 0;
      }
      return;
    }

    const points = calculatePoints(prediction.home, prediction.away, result.home, result.away, match.stage, prediction.advances, result.winner);
    stats.totalPoints += points;
    stats.played += 1;
    
    if (points > 0) {
      stats.hits += 1;
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
      
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

    if (points === calculatePoints(result.home, result.away, result.home, result.away, match.stage, result.winner, result.winner)) {
      stats.exacts += 1;
      stats.exactStreak += 1;
    } else {
      stats.exactStreak = 0;
    }

    let predTime = 0;
    if (prediction.timestamp) {
      predTime = prediction.timestamp.toMillis ? prediction.timestamp.toMillis() : new Date(prediction.timestamp).getTime();
    }
    const matchTime = new Date(match.date).getTime();

    if (predTime > 0 && matchTime >= predTime) {
      stats.timeInAdvance += (matchTime - predTime);
      if (!stats.badges.includes('Buzzer Beater') && matchTime - predTime <= 5 * 60 * 1000) {
        stats.badges.push('Buzzer Beater');
      }
    }
  });

  if (stats.exacts >= 10 && !stats.badges.includes('El Oráculo')) stats.badges.push('El Oráculo');
  if (totalLikes >= 50 && !stats.badges.includes('Influencer')) stats.badges.push('Influencer');
  if (stats.maxStreak >= 5 && !stats.badges.includes('Racha de Fuego')) stats.badges.push('Racha de Fuego');

  const mvpDates = getHistoricalMVPCounts()[participantId] || [];
  stats.mvpCount = mvpDates.length;
  stats.mvpDates = mvpDates;
  if (stats.mvpCount >= 3 && !stats.badges.includes('MVP x3')) stats.badges.push('MVP x3');

  return stats;
}

export function getRankedParticipants(programId = null) {
  if (cachedRankings && cachedRankings[programId || 'all']) {
    return cachedRankings[programId || 'all'];
  }

  const dynamicUsers = Object.values(prodeState.users)
    .filter(u => resolveUid(u.uid) === u.uid)
    .map(u => ({
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
      .sort((a, b) => b.totalPoints - a.totalPoints || b.exacts - a.exacts || b.timeInAdvance - a.timeInAdvance || a.name.localeCompare(b.name));

  return cachedRankings.filter(participant => !programId || isParticipantInProgram(participant, programId));
}

export function getDailyMVP(customMatches = matches) {
  const dynamicUsers = getDynamicUsers();
  const preds = getPredictions();
  
  const getLogicalDate = (dateString) => {
    const d = new Date(dateString);
    d.setUTCHours(d.getUTCHours() - 10);
    return d.toISOString().split('T')[0];
  };

  const matchdays = {};
  customMatches.forEach(m => {
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
      let dayMaxTime = 0;
      day.matches.forEach(m => {
        const mt = new Date(m.date).getTime();
        if (mt > dayMaxTime) dayMaxTime = mt;
      });
      if (dayMaxTime > maxTime) {
        maxTime = dayMaxTime;
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
      if (r) {
        let pt = 0;
        let ts = Infinity;
        if (p) {
          pt = calculatePoints(p.home, p.away, r.home, r.away, match.stage, p.advances, r.winner);
          pts += pt;
          if (pt === calculatePoints(r.home, r.away, r.home, r.away, match.stage, r.winner, r.winner) && pt > 0) exacts++;
          ts = p.timestamp ? (p.timestamp.toMillis ? p.timestamp.toMillis() : new Date(p.timestamp).getTime()) : Infinity;
          if (ts > latestTimestamp) latestTimestamp = ts;
        }
        userMatchesInfo.push({ match, prediction: p || null, result: r, points: pt });
      }
    });
    
    if (pts > 0) {
      if (pts > maxPoints) {
        maxPoints = pts; maxExacts = exacts; minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
      } else if (pts === maxPoints) {
        if (exacts > maxExacts) {
          maxExacts = exacts; minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
        } else if (exacts === maxExacts) {
          if (latestTimestamp < minTimestamp) {
            minTimestamp = latestTimestamp; bestUser = user; bestMatchesInfo = userMatchesInfo;
          } else if (latestTimestamp === minTimestamp) {
            if (bestUser && user.name.localeCompare(bestUser.name) < 0) {
              bestUser = user; bestMatchesInfo = userMatchesInfo;
            }
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
    d.setUTCHours(d.getUTCHours() - 10);
    return d.toISOString().split('T')[0];
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
          const pt = calculatePoints(p.home, p.away, r.home, r.away, match.stage, p.advances, r.winner);
          pts += pt;
          if (pt === calculatePoints(r.home, r.away, r.home, r.away, match.stage, r.winner, r.winner) && pt > 0) exacts++;
          const ts = p.timestamp ? (p.timestamp.toMillis ? p.timestamp.toMillis() : new Date(p.timestamp).getTime()) : Infinity;
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
            if (latestTimestamp < minTimestamp) {
              minTimestamp = latestTimestamp; bestUsers = [user];
            } else if (latestTimestamp === minTimestamp) {
              // Tie breaker for equal timestamps (e.g. Infinity)
              if (user.name.localeCompare(bestUsers[0].name) < 0) {
                bestUsers = [user];
              }
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
  const resolvedUid = resolveUid(user.uid);
  if (resolvedUid !== user.uid) return;

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
    if (analytics) {
      try { logEvent(analytics, 'sign_up', { method: 'google' }); } catch(e) {}
    }
    
    try {
      const q = query(collection(db, "users"), where("email", "in", MASTER_ADMINS));
      const adminSnaps = await getDocs(q);
      adminSnaps.forEach(async (adminDoc) => {
        const adminData = adminDoc.data();
        if (adminData.uid !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: adminData.uid,
            fromUserId: user.uid,
            fromUserName: user.displayName || 'Nuevo Usuario',
            fromUserPhoto: user.photoURL || '',
            type: 'system',
            message: `se registró en la app (${user.email || 'Sin mail'})`,
            timestamp: serverTimestamp(),
            read: false
          });
        }
      });
    } catch(err) {
      console.error('Error notifying admins', err);
    }
  } else {
    if (analytics) {
      try { logEvent(analytics, 'login', { method: 'google' }); } catch(e) {}
    }
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

  const userRef = doc(db, 'users', resolveUid(userId));
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

  const userRef = doc(db, 'users', resolveUid(user.uid));
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

  const resolvedTargetUid = resolveUid(targetUserId);
  const resolvedUserUid = resolveUid(user.uid);

  const predRef = doc(db, 'predictions', resolvedTargetUid);
  const snap = await getDoc(predRef);
  const current = snap.data() || {};
  
  if (!current[matchId]) return;

  const currentLikes = current[matchId]?.likes || [];
  const userLikedIndex = currentLikes.findIndex(l => resolveUid(l.uid) === resolvedUserUid);
  
  const uid = resolvedUserUid;
  const localUser = prodeState.users[resolvedUserUid];
  const name = localUser?.name || user.displayName || 'Usuario';
  const photo = localUser?.photo || user.photoURL || '';

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
    if (analytics) {
      try { logEvent(analytics, 'like_prediction', { matchId: matchId, content_author_id: resolvedTargetUid }); } catch(e) {}
    }
  }

  // Send Notification
  if (isLiking && resolvedTargetUid !== resolvedUserUid) {
    await addDoc(collection(db, 'notifications'), {
      userId: resolvedTargetUid,
      fromUserId: resolvedUserUid,
      fromUserName: localUser?.name || user.displayName || 'Alguien',
      fromUserPhoto: localUser?.photo || user.photoURL || '',
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

  const resolvedTargetUid = resolveUid(targetUserId);
  const resolvedUserUid = resolveUid(user.uid);

  const predRef = doc(db, 'predictions', resolvedTargetUid);
  const snap = await getDoc(predRef);
  const current = snap.data() || {};
  
  if (!current[matchId]) return;

  await updateDoc(predRef, {
    [`${matchId}.shares`]: increment(1)
  });

  if (resolvedTargetUid !== resolvedUserUid) {
    const localUser = prodeState.users[resolvedUserUid];
    await addDoc(collection(db, 'notifications'), {
      userId: resolvedTargetUid,
      fromUserId: resolvedUserUid,
      fromUserName: localUser?.name || user.displayName || 'Alguien',
      fromUserPhoto: localUser?.photo || user.photoURL || '',
      type: 'share',
      matchId: matchId,
      timestamp: serverTimestamp(),
      read: false
    });
  }
  if (analytics) {
    try { logEvent(analytics, 'share_prediction', { matchId: matchId, targetUser: resolvedTargetUid }); } catch(e) {}
  }
}

export function listenToNotifications(userId, callback) {
  if (!userId) return () => {};
  const resolvedUid = resolveUid(userId);
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', resolvedUid),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
}

export async function markNotificationsAsRead(userId) {
  const resolvedUid = resolveUid(userId);
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', resolvedUid),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

