// api/set-admin.js - Vercel Serverless Function für Admin-Verwaltung
import admin from 'firebase-admin';

// Firebase Admin initialisieren (nur einmal)
if (!admin.apps.length) {
  // Service Account aus Environment Variable laden
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback für lokale Entwicklung mit GOOGLE_APPLICATION_CREDENTIALS
    admin.initializeApp();
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
      console.error('Token verification failed:', error);
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

    console.log(`Admin status for ${targetEmail} set to ${isAdmin} by ${requestingUser.email}`);

    return res.status(200).json({
      success: true,
      message: isAdmin
        ? 'Admin-Rechte erfolgreich vergeben'
        : 'Admin-Rechte erfolgreich entzogen',
      targetEmail,
      isAdmin
    });

  } catch (error) {
    console.error('Error in set-admin:', error);
    return res.status(500).json({
      error: 'Fehler beim Setzen der Admin-Rechte',
      details: error.message
    });
  }
}
