import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported, setUserId } from "firebase/analytics";

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
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "https://your-app.vercel.app";
};

export const confluenceCalendarUrl =
  process.env.REACT_APP_CONFLUENCE_CALENDAR_URL;

export const calendarProxyUrl =
  process.env.REACT_APP_CALENDAR_PROXY_URL || `${getBaseUrl()}/api/calendar`;

export const logServerUrl =
  process.env.REACT_APP_LOG_SERVER_URL || `${getBaseUrl()}/api/log`;

export const appId = "datenplaner-app-v3";

export const defaultTenantId = process.env.REACT_APP_DEFAULT_TENANT_ID || appId;
export const tenantRegistrationEnabled =
  process.env.REACT_APP_TENANT_REGISTRATION_ENABLED === "true";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export let analytics = null;

let analyticsInitialization = Promise.resolve(null);
if (typeof window !== "undefined") {
  analyticsInitialization = isSupported()
    .then((supported) => {
      if (!supported) {
        return null;
      }

      const instance = getAnalytics(app);
      analytics = instance;
      return instance;
    })
    .catch((error) => {
      console.warn("Firebase Analytics konnte nicht initialisiert werden:", error);
      return null;
    });
}

export const waitForAnalytics = () => analyticsInitialization;

export const setAnalyticsUserId = async (userId) => {
  if (!userId) {
    return;
  }

  const instance = await analyticsInitialization;
  if (instance) {
    setUserId(instance, userId);
  }
};

export { auth, db };
