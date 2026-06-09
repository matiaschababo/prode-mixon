import { get, put } from '@vercel/blob';
import { matches } from '../src/data/matches.js';

const STATE_PATH = 'prode-state.json';
const API_URL = 'https://v3.football.api-sports.io';
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const DEFAULT_STATE = {
  predictions: {},
  results: {}
};

function normalizeState(state) {
  const predictions = { ...(state.predictions || {}) };

  Object.values(predictions).forEach(matchPredictions => {
    if (matchPredictions['dianela-fdf'] && !matchPredictions.dianela) {
      matchPredictions.dianela = matchPredictions['dianela-fdf'];
    }
    delete matchPredictions['dianela-fdf'];
  });

  return {
    ...state,
    predictions,
    results: state.results || {}
  };
}

async function readState() {
  const blob = await get(STATE_PATH, {
    access: 'private',
    useCache: false
  });

  if (!blob?.stream) return DEFAULT_STATE;

  const text = await new Response(blob.stream).text();
  if (!text) return DEFAULT_STATE;

  return {
    ...DEFAULT_STATE,
    ...normalizeState(JSON.parse(text))
  };
}

async function writeState(state) {
  const normalized = normalizeState(state);
  const cleanState = {
    predictions: normalized.predictions,
    results: normalized.results,
    updatedAt: new Date().toISOString()
  };

  await put(STATE_PATH, JSON.stringify(cleanState, null, 2), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });

  return cleanState;
}

function parseBody(body) {
  if (!body) return DEFAULT_STATE;
  if (typeof body === 'string') return JSON.parse(body);
  return body;
}

async function syncAutomaticResults(state) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const trackedMatches = matches.filter(match => match.apiFootballFixtureId);
  if (!apiKey || !trackedMatches.length) return state;

  const ids = trackedMatches.map(match => match.apiFootballFixtureId).join('-');
  const upstream = await fetch(`${API_URL}/fixtures?ids=${ids}`, {
    headers: { 'x-apisports-key': apiKey }
  });

  if (!upstream.ok) return state;

  const data = await upstream.json();
  const byFixtureId = new Map((data.response || []).map(item => [item.fixture.id, item]));
  let changed = false;
  const results = { ...(state.results || {}) };

  trackedMatches.forEach(match => {
    const fixture = byFixtureId.get(match.apiFootballFixtureId);
    const status = fixture?.fixture?.status?.short;
    const home = fixture?.goals?.home;
    const away = fixture?.goals?.away;

    if (!FINISHED_STATUSES.has(status) || home === null || away === null) return;

    const key = String(match.id);
    const next = { home, away, status, source: 'api-football' };
    const previous = results[key];
    if (!previous || previous.home !== home || previous.away !== away || previous.status !== status) {
      results[key] = next;
      changed = true;
    }
  });

  if (!changed) return state;
  return writeState({ ...state, results });
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    let state = await readState();
    state = await syncAutomaticResults(state);
    return response.status(200).json(state);
  }

  if (request.method === 'POST') {
    const expectedPassword = process.env.PRODE_ADMIN_PASSWORD || 'mixon2026';
    if (request.headers['x-admin-password'] !== expectedPassword) {
      return response.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const state = await writeState(parseBody(request.body));
    return response.status(200).json(state);
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ error: 'Método no permitido.' });
}
