import admin from 'firebase-admin';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const config = {};
env.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').replace(/['"]/g, '').trim();
    config[key] = val;
  }
});

const sa = {
  projectId: config.FIREBASE_PROJECT_ID,
  clientEmail: config.FIREBASE_CLIENT_EMAIL,
  privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(sa)
});

const db = admin.firestore();

async function check() {
  const docSnap = await db.collection("global").doc("results").get();
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log("Total Results in Firestore:", Object.keys(data).length);
    console.log("Match 73 result:", data['73']);
    
    // Let's also verify group standings
    const groupMatches = [1,2,3,4,5,6]; // Just check if any exist
    let groupResults = 0;
    groupMatches.forEach(id => { if (data[id]) groupResults++; });
    console.log("Sample Group Results Count:", groupResults);
  } else {
    console.log("No results document found.");
  }
  process.exit(0);
}
check();
