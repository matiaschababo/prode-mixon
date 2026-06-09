// src/services/api-football.js
// Browser code should never receive the API-Football key.
// Results are fetched through /api/results, a Vercel serverless function.

export async function fetchAutomaticResults() {
  const response = await fetch('/api/results', {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error('No se pudieron traer los resultados automáticos.');
  }

  return response.json();
}
