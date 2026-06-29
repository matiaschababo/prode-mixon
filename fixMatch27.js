import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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
  const ref = doc(db, "global", "results");
  const resultsDoc = await getDoc(ref);
  if (resultsDoc.exists()) {
      const data = resultsDoc.data();
      const match27 = data["27"];
      if (match27) {
        console.log("Current match 27:", match27);
        if (match27.home === 1 && match27.away === 0) {
          match27.home = 0;
          match27.away = 1;
          await updateDoc(ref, { "27": match27 });
          console.log("Fixed match 27. Swapped home and away.");
        } else {
          console.log("No need to swap or already swapped.");
        }
      }
  } else {
      console.log("No global results found");
  }
  process.exit(0);
}

run().catch(console.error);
