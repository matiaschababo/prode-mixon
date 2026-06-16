const fs = require('fs');
const content = fs.readFileSync('src/services/prodeStore.js', 'utf-8');

const getDailyMVPMatch = content.match(/export function getDailyMVP\(\) \{[\s\S]*?return null;\n\}/);
const getHistoricalMVPCountsMatch = content.match(/export function getHistoricalMVPCounts\(\) \{[\s\S]*?return counts;\n\}/);

const replacementDaily = `export function getDailyMVP() {
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
}`;

const replacementHistorical = `export function getHistoricalMVPCounts() {
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
        counts[u.id] = (counts[u.id] || 0) + 1;
      });
    }
  });
  
  cachedMVPCounts = counts;
  return counts;
}`;

let newContent = content.replace(getDailyMVPMatch[0], replacementDaily);
newContent = newContent.replace(getHistoricalMVPCountsMatch[0], replacementHistorical);

fs.writeFileSync('src/services/prodeStore.js', newContent);
