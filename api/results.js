import { matches } from '../src/data/matches.js';

const API_URL = 'https://v3.football.api-sports.io';
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return response.status(200).json({
      results: {},
      configured: false,
      message: 'Falta configurar API_FOOTBALL_KEY en Vercel.'
    });
  }

  const trackedMatches = matches.filter(match => match.apiFootballFixtureId);
  if (!trackedMatches.length) {
    return response.status(200).json({
      results: {},
      configured: true,
      message: 'Falta mapear apiFootballFixtureId en src/data/matches.js.'
    });
  }

  try {
    const ids = trackedMatches.map(match => match.apiFootballFixtureId).join('-');
    const upstream = await fetch(`${API_URL}/fixtures?ids=${ids}`, {
      headers: {
        'x-apisports-key': apiKey
      }
    });

    if (!upstream.ok) {
      return response.status(upstream.status).json({
        results: {},
        error: 'API-Football no respondió correctamente.'
      });
    }

    const data = await upstream.json();
    const byFixtureId = new Map((data.response || []).map(item => [item.fixture.id, item]));
    const results = {};

    trackedMatches.forEach(match => {
      const fixture = byFixtureId.get(match.apiFootballFixtureId);
      const status = fixture?.fixture?.status?.short;
      const home = fixture?.goals?.home;
      const away = fixture?.goals?.away;

      if (FINISHED_STATUSES.has(status) && home !== null && away !== null) {
        results[String(match.id)] = {
          home,
          away,
          status,
          source: 'api-football'
        };
      }
    });

    return response.status(200).json({
      results,
      configured: true,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return response.status(500).json({
      results: {},
      error: error.message
    });
  }
}
