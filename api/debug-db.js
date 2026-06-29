import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

export default async function handler(req, res) {
  try {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    const docSnap = await db.collection("global").doc("results").get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return res.status(200).json({ 
        total: Object.keys(data).length,
        results: data 
      });
    } else {
      return res.status(404).json({ error: "No results document" });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
