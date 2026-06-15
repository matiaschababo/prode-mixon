import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, doc, setDoc, getDoc, collection, getDocs, writeBatch, query, where, onSnapshot, serverTimestamp, addDoc, orderBy, limit, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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
const auth = getAuth(app);

// Enable offline persistence — returning users get instant cached data
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, getDocs, writeBatch, query, onSnapshot, serverTimestamp, addDoc, orderBy, limit, deleteDoc, updateDoc, arrayUnion, arrayRemove, where };
