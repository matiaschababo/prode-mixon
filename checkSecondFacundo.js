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
  const uid = "gIXWnRDpFLgy5NzmSzUJHlqcxTv2";
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
      console.log("User doc:", userDoc.data());
  } else {
      console.log("No user doc found for", uid);
  }

  const predDoc = await getDoc(doc(db, "predictions", uid));
  if (predDoc.exists()) {
      console.log("Predictions doc:", Object.keys(predDoc.data()).length);
      console.log(JSON.stringify(predDoc.data(), null, 2));
  } else {
      console.log("No predictions doc found for", uid);
  }

  process.exit(0);
}

run().catch(console.error);
