import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error("Error inicializando Firebase Admin en api/results.js", error);
  }
}

export default async function handler(request, response) {
  // CORS and shared cache headers for Vercel Edge CDN (cache for 60s, stale-while-revalidate for 120s)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (getApps().length === 0) {
    return response.status(500).json({ error: "Firebase Admin no está configurado." });
  }

  try {
    const db = getFirestore();
    const resultsDoc = await db.collection('global').doc('results').get();
    const results = resultsDoc.exists ? resultsDoc.data() : {};

    return response.status(200).json({
      results,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message
    });
  }
}
