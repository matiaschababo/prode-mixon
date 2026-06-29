import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "prode-mixon-2026-36579",
  appId: "1:1003346295215:web:be1eddfb80a52b1f98575a",
  storageBucket: "prode-mixon-2026-36579.firebasestorage.app",
  apiKey: "AIzaSyDpndAAWTWZiAZbb6tQfzgjbXazaVlukXA",
  authDomain: "prode-mixon-2026-36579.firebaseapp.com",
  messagingSenderId: "1003346295215",
  measurementId: "G-YSBZZLELPX",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const uid = "XmaOWGha0UM8eFBX9ACTMtTGyQ23";
  const predDoc = await getDoc(doc(db, "predictions", uid));
  if (predDoc.exists()) {
      console.log(JSON.stringify(predDoc.data(), null, 2));
  } else {
      console.log("No predictions doc found for", uid);
  }
  process.exit(0);
}

run().catch(console.error);
