import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIREBASE_CONFIG = '{}'; // to bypass getApps
initializeApp({ projectId: 'prode-mixon' });
const db = getFirestore();

async function run() {
  const doc = await db.collection('global').doc('results').get();
  console.log(JSON.stringify(doc.data()['31'], null, 2));
}
run();
