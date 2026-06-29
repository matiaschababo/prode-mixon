const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

module.exports = async function handler(request, response) {
  try {
    const resultsRef = db.collection('global').doc('results');
    const docSnap = await resultsRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      delete data['73'];
      await resultsRef.set(data);
      return response.status(200).json({ success: true, message: 'Wiped match 73' });
    } else {
      return response.status(404).json({ error: 'Not found' });
    }
  } catch (e) {
    return response.status(500).json({ error: e.message });
  }
}
