import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

// Leer config de .env.local
const env = fs.readFileSync('.env.local', 'utf-8');
const config = {};
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    config[key] = val.join('=').replace(/['"]/g, '');
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const docSnap = await getDoc(doc(db, "global", "results"));
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log("Results count:", Object.keys(data).length);
    console.log("Sample keys:", Object.keys(data).slice(0, 10));
    console.log("Match 73 result:", data['73']);
    console.log("Match 1 result:", data['1']);
  } else {
    console.log("No results document found in Firestore.");
  }
  process.exit(0);
}
check();
