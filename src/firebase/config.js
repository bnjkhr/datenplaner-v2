import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Automatische URL-Erkennung basierend auf Umgebung
const getBaseUrl = () => {
  // Development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Vercel Production/Preview
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Custom Domain oder Fallback
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback
  return "https://your-app.vercel.app";
};

// URL zum Abonnieren des Confluence-Kalenders
export const confluenceCalendarUrl =
  process.env.REACT_APP_CONFLUENCE_CALENDAR_URL;

// Kalender-Proxy-URL - automatisch je nach Umgebung
export const calendarProxyUrl =
  process.env.REACT_APP_CALENDAR_PROXY_URL || `${getBaseUrl()}/api/calendar`;

export const logServerUrl =
  process.env.REACT_APP_LOG_SERVER_URL || `${getBaseUrl()}/api/log`;

// --- App ID for Firestore paths ---
export const appId = "datenplaner-app-v3";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportiere die Instanzen zur Verwendung in anderen Dateien
export { auth, db };
