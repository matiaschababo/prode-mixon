import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const fileContent = fs.readFileSync('./src/services/firebase.js', 'utf-8');
const configStr = fileContent.substring(fileContent.indexOf('const firebaseConfig = {') + 23, fileContent.indexOf('};') + 1);
const firebaseConfig = eval('(' + configStr + ')');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const predsDoc = await getDoc(doc(db, "global", "predictions"));
  const predictions = predsDoc.data() || {};
  const m73 = predictions['73'] || {};
  console.log("Number of predictions for Match 73:", Object.keys(m73).length);
  
  // Also save the result for Match 73!
  const { setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(doc(db, "global", "results"), {
    "73": {
      home: 0,
      away: 1,
      timestamp: serverTimestamp(),
      winner: "CAN" // Away won
    }
  }, { merge: true });
  console.log("Result saved for Match 73!");
  
  process.exit(0);
}
run();
