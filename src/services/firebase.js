// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with real Firebase config from the user
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "prode-mixon.firebaseapp.com",
  projectId: "prode-mixon",
  storageBucket: "prode-mixon.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
