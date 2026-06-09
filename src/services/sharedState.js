import { setProdeState } from './prodeStore.js';

export async function loadSharedState() {
  const response = await fetch('/api/prode-state', {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error('No se pudo leer la base compartida.');
  }

  const data = await response.json();
  setProdeState(data);
  return data;
}

export async function saveSharedState(password, state) {
  const response = await fetch('/api/prode-state', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-password': password
    },
    body: JSON.stringify(state)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo guardar en la base compartida.');
  }

  setProdeState(data);
  return data;
}
