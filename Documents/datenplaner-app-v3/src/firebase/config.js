// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
// ERSETZE DIES MIT DEINER ECHTEN FIREBASE-KONFIGURATION!
const firebaseConfig = {
  apiKey: "AIzaSyDNdCSEHHveLZloWrdrgq4zqgi8DUR72RE",
  authDomain: "datenprodukt-planer-app.firebaseapp.com",
  projectId: "datenprodukt-planer-app",
  storageBucket: "datenprodukt-planer-app.firebasestorage.app",
  messagingSenderId: "32250523439",
  appId: "1:32250523439:web:3bafa128b7758f36253bda",
  measurementId: "G-CEV457PXY1"
};

// --- App ID for Firestore paths ---
export const appId = 'datenplaner-app-v3';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportiere die Instanzen zur Verwendung in anderen Dateien
export { auth, db };
