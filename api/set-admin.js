// api/set-admin.js - Vercel Serverless Function für Admin-Verwaltung
import admin from 'firebase-admin';

// Track initialization errors for controlled error responses
let initializationError = null;

// Firebase Admin initialisieren (nur einmal)
if (!admin.apps.length) {
  // Service Account aus Environment Variable laden
  let serviceAccount = null;
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (envKey) {
    try {
      serviceAccount = JSON.parse(envKey);
    } catch (parseError) {
      // Log error with safe context (key length only, no secrets)
      const keyLength = envKey ? envKey.length : 0;
      const keyPreview = envKey ? `${envKey.substring(0, 10)}...` : 'empty';
      console.error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:',
        parseError.message,
        `| Key length: ${keyLength}`,
        `| Starts with: ${keyPreview.replace(/[a-zA-Z0-9]/g, '*')}`
      );
      initializationError = 'Firebase Admin SDK configuration error: Invalid service account JSON';
    }
  }

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin:', initError.message);
      initializationError = 'Firebase Admin SDK initialization failed';
    }
  } else if (!initializationError) {
    // Fallback für lokale Entwicklung mit GOOGLE_APPLICATION_CREDENTIALS
    try {
      admin.initializeApp();
    } catch (initError) {
      console.error('Failed to initialize Firebase Admin (fallback):', initError.message);
      initializationError = 'Firebase Admin SDK initialization failed (no credentials)';
    }
  }
}

export default async function handler(req, res) {
  // CORS Headers
  const allowedOrigins = [
    'http://localhost:3000',
    'https://datenplaner-app-v3.vercel.app',
    'https://datenplaner-v2.vercel.app'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for initialization errors
  if (initializationError) {
    console.error('Request rejected due to initialization error:', initializationError);
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'Firebase Admin SDK not properly configured'
    });
  }

  try {
    // Authorization Header prüfen
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Token verifizieren und prüfen ob der anfragende User Admin ist
    let requestingUser;
    try {
      requestingUser = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error.message || error.code || 'Unknown error');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Prüfen ob der anfragende User Admin ist
    if (!requestingUser.admin) {
      return res.status(403).json({ error: 'Nur Administratoren können Admin-Rechte vergeben' });
    }

    // Request Body validieren
    const { targetEmail, isAdmin } = req.body;

    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail ist erforderlich' });
    }

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin muss ein Boolean sein' });
    }

    // User anhand der E-Mail finden
    let targetUser;
    try {
      targetUser = await admin.auth().getUserByEmail(targetEmail);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Kein Benutzer mit dieser E-Mail-Adresse gefunden' });
      }
      throw error;
    }

    // Verhindern dass man sich selbst den Admin-Status entzieht
    if (targetUser.uid === requestingUser.uid && !isAdmin) {
      return res.status(400).json({ error: 'Du kannst dir nicht selbst die Admin-Rechte entziehen' });
    }

    // Custom Claims setzen
    const currentClaims = targetUser.customClaims || {};

    const newClaims = {
      ...currentClaims,
      admin: isAdmin
    };

    await admin.auth().setCustomUserClaims(targetUser.uid, newClaims);

    // Log with user IDs only (no PII/emails)
    console.log(`Admin status for user ${targetUser.uid} set to ${isAdmin} by user ${requestingUser.uid}`);

    return res.status(200).json({
      success: true,
      message: isAdmin
        ? 'Admin-Rechte erfolgreich vergeben'
        : 'Admin-Rechte erfolgreich entzogen',
      targetEmail,
      isAdmin
    });

  } catch (error) {
    // Log full error server-side (including stack trace)
    console.error('Error in set-admin:', error.message, error.stack);
    // Return generic error to client (no implementation details)
    return res.status(500).json({
      error: 'Fehler beim Setzen der Admin-Rechte'
    });
  }
}
