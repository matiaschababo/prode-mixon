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
  const usersQ = collection(db, "users");
  const usersSnapshot = await getDocs(usersQ);
  const userIds = new Set();
  const emails = {};
  usersSnapshot.forEach(doc => {
      userIds.add(doc.id);
      if (doc.data().email) emails[doc.id] = doc.data().email;
  });

  const predQ = collection(db, "predictions");
  const predSnapshot = await getDocs(predQ);
  const predUserIds = new Set();
  predSnapshot.forEach(doc => {
      predUserIds.add(doc.id);
  });

  console.log("Users in predictions without profile:");
  for (const pid of predUserIds) {
      if (!userIds.has(pid)) {
          console.log(pid);
      }
  }

  process.exit(0);
}

run().catch(console.error);
