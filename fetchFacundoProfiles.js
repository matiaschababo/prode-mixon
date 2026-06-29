import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
  const q = collection(db, "users");
  const querySnapshot = await getDocs(q);
  const profiles = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('facu') || str.includes('colman')) {
      profiles.push({ id: doc.id, ...data });
    }
  });
  
  console.log("Found profiles:", profiles.length);
  for (const profile of profiles) {
      console.log('Profile:', profile.id, profile.displayName || profile.name, profile.email);
  }

  process.exit(0);
}

run().catch(console.error);
