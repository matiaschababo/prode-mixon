import { mergeResults } from './prodeStore.js';

export async function syncRemoteResults() {
  try {
    const response = await fetch('/api/results', {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return false;

    const data = await response.json();
    if (!data.results) return false;

    return mergeResults(data.results);
  } catch (error) {
    console.warn('No se pudieron sincronizar resultados automáticos.', error);
    return false;
  }
}
