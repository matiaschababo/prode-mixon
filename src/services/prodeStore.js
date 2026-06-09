import { matches } from '../data/matches.js';
import { participants } from '../data/participants.js';
import { calculatePoints } from './scoring.js';

const PREDICTIONS_KEY = 'prode-mixon-predictions-v1';
const RESULTS_KEY = 'prode-mixon-results-v1';
let prodeState = {
  predictions: readJSON(PREDICTIONS_KEY, {}),
  results: readJSON(RESULTS_KEY, {})
};

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getPredictions() {
  return prodeState.predictions;
}

export function savePrediction(matchId, participantId, home, away) {
  const predictions = getPredictions();
  const key = String(matchId);
  predictions[key] = predictions[key] || {};

  if (home === '' || away === '') {
    delete predictions[key][participantId];
  } else {
    predictions[key][participantId] = {
      home: Number(home),
      away: Number(away)
    };
  }

  setProdeState({ predictions, results: getResults() });
}

export function getResults() {
  return prodeState.results;
}

export function saveResult(matchId, home, away) {
  const results = getResults();
  const key = String(matchId);

  if (home === '' || away === '') {
    delete results[key];
  } else {
    results[key] = {
      home: Number(home),
      away: Number(away)
    };
  }

  setProdeState({ predictions: getPredictions(), results });
}

export function mergeResults(nextResults) {
  const current = getResults();
  let changed = false;

  Object.entries(nextResults || {}).forEach(([matchId, result]) => {
    const previous = current[matchId];
    if (!previous || previous.home !== result.home || previous.away !== result.away || previous.status !== result.status) {
      current[matchId] = result;
      changed = true;
    }
  });

  if (changed) setProdeState({ predictions: getPredictions(), results: current });
  return changed;
}

export function getMatchResult(match) {
  const saved = getResults()[String(match.id)];
  if (saved) return saved;
  if (match.homeScore !== null && match.awayScore !== null) {
    return { home: match.homeScore, away: match.awayScore };
  }
  return null;
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
  return participants
    .filter(participant => !programId || participant.programId === programId)
    .map(participant => ({
      ...participant,
      ...getParticipantStats(participant.id)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.exacts - a.exacts || a.name.localeCompare(b.name));
}

export function exportLocalData() {
  return {
    predictions: getPredictions(),
    results: getResults()
  };
}

export function importLocalData(rawText) {
  const parsed = JSON.parse(rawText);
  setProdeState({
    predictions: parsed.predictions || {},
    results: parsed.results || {}
  });
}

export function setProdeState(nextState) {
  prodeState = {
    predictions: nextState.predictions || {},
    results: nextState.results || {}
  };
  writeJSON(PREDICTIONS_KEY, prodeState.predictions);
  writeJSON(RESULTS_KEY, prodeState.results);
}
