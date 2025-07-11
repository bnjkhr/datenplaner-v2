// server/readonly-api.js - Backend API für Read-Only Zugriff
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.READONLY_API_PORT || 3002;

// CORS konfigurieren
app.use(cors({
  origin: process.env.READONLY_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: false
}));

app.use(express.json());

// Firebase Admin initialisieren (optional)
let db = null;
let firebaseInitialized = false;
const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'datenprodukt-planer-app';

// Versuche Firebase zu initialisieren, falls Credentials vorhanden
try {
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && !admin.apps.length) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
    });

    db = admin.firestore();
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK erfolgreich initialisiert');
  } else {
    console.log('⚠️ Firebase Credentials nicht vollständig - verwende Demo-Daten');
  }
} catch (error) {
  console.error('❌ Firebase Initialisierung fehlgeschlagen:', error.message);
  console.log('🔄 Verwende Demo-Daten als Fallback');
}

// Helper function to get collection path
const getCollectionPath = (name) => `artifacts/${appId}/public/data/${name}`;

// Demo-Daten als Fallback
const getDemoData = () => ({
  personen: [
    { id: "1", name: "Max Mustermann", email: "max@example.com", wochenstunden: 31, skillIds: ["1", "2"] },
    { id: "2", name: "Anna Schmidt", email: "anna@example.com", wochenstunden: 35, skillIds: ["2", "3"] },
    { id: "3", name: "Tom Weber", email: "tom@example.com", wochenstunden: 31, skillIds: ["1", "3"] },
    { id: "4", name: "Sarah Johnson", email: "sarah@example.com", wochenstunden: 31, skillIds: ["1", "2", "3"] },
    { id: "5", name: "Mike Chen", email: "mike@example.com", wochenstunden: 40, skillIds: ["3"] }
  ],
  skills: [
    { id: "1", name: "Python", color: "#3776ab" },
    { id: "2", name: "Data Science", color: "#ff6b35" },
    { id: "3", name: "Machine Learning", color: "#4caf50" },
    { id: "4", name: "SQL", color: "#336791" },
    { id: "5", name: "React", color: "#61dafb" }
  ],
  datenprodukte: [
    { id: "1", name: "Customer Analytics Dashboard" },
    { id: "2", name: "Sales Forecasting Model" },
    { id: "3", name: "ML Pipeline Infrastructure" },
    { id: "4", name: "Data Quality Monitor" }
  ],
  rollen: [
    { id: "1", name: "Data Scientist" },
    { id: "2", name: "Analytics Engineer" },
    { id: "3", name: "ML Engineer" },
    { id: "4", name: "Data Engineer" }
  ],
  zuordnungen: [
    { id: "1", personId: "1", datenproduktId: "1", rolleId: "1", stunden: 20 },
    { id: "2", personId: "1", datenproduktId: "2", rolleId: "2", stunden: 15 },
    { id: "3", personId: "2", datenproduktId: "2", rolleId: "1", stunden: 25 },
    { id: "4", personId: "3", datenproduktId: "3", rolleId: "3", stunden: 31 },
    { id: "5", personId: "4", datenproduktId: "1", rolleId: "2", stunden: 10 },
    { id: "6", personId: "4", datenproduktId: "4", rolleId: "4", stunden: 20 },
    { id: "7", personId: "5", datenproduktId: "3", rolleId: "3", stunden: 40 }
  ]
});

// API Endpoints
app.get('/api/readonly/data', async (req, res) => {
  try {
    let data;
    let dataSource = 'demo';

    if (firebaseInitialized && db) {
      try {
        const collections = ['personen', 'skills', 'datenprodukte', 'rollen', 'zuordnungen'];
        data = {};

        // Lade alle Collections parallel
        const promises = collections.map(async (collectionName) => {
          const path = getCollectionPath(collectionName);
          const snapshot = await db.collection(path).get();
          data[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sortiere Daten außer Zuordnungen
          if (collectionName !== 'zuordnungen') {
            data[collectionName].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
          }
        });

        await Promise.all(promises);
        dataSource = 'firebase';
        console.log('✅ Daten erfolgreich von Firebase geladen');
      } catch (firebaseError) {
        console.error('❌ Firebase Fehler, verwende Demo-Daten:', firebaseError.message);
        data = getDemoData();
      }
    } else {
      console.log('📋 Verwende Demo-Daten (Firebase nicht verfügbar)');
      data = getDemoData();
    }

    res.json({
      success: true,
      data,
      dataSource,
      firebaseConnected: firebaseInitialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Allgemeiner Fehler:', error);
    res.json({
      success: true,
      data: getDemoData(),
      dataSource: 'demo',
      firebaseConnected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/readonly/health', (req, res) => {
  res.json({
    status: 'ok',
    firebaseConnected: firebaseInitialized,
    dataSource: firebaseInitialized ? 'firebase' : 'demo',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Statistiken endpoint
app.get('/api/readonly/stats', async (req, res) => {
  try {
    let stats = {};
    let dataSource = 'demo';

    if (firebaseInitialized && db) {
      try {
        const collections = ['personen', 'skills', 'datenprodukte', 'rollen', 'zuordnungen'];

        for (const collectionName of collections) {
          const path = getCollectionPath(collectionName);
          const snapshot = await db.collection(path).get();
          stats[collectionName] = snapshot.size;
        }
        dataSource = 'firebase';
      } catch (firebaseError) {
        console.error('Firebase Fehler bei Stats:', firebaseError.message);
        // Fallback zu Demo-Stats
        const demoData = getDemoData();
        stats = {
          personen: demoData.personen.length,
          skills: demoData.skills.length,
          datenprodukte: demoData.datenprodukte.length,
          rollen: demoData.rollen.length,
          zuordnungen: demoData.zuordnungen.length
        };
      }
    } else {
      // Demo-Stats
      const demoData = getDemoData();
      stats = {
        personen: demoData.personen.length,
        skills: demoData.skills.length,
        datenprodukte: demoData.datenprodukte.length,
        rollen: demoData.rollen.length,
        zuordnungen: demoData.zuordnungen.length
      };
    }

    res.json({
      success: true,
      stats,
      dataSource,
      firebaseConnected: firebaseInitialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Allgemeiner Fehler bei Stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🔧 Read-Only API Server läuft auf Port ${port}`);
  console.log(`📊 Health Check: http://localhost:${port}/api/readonly/health`);
  console.log(`📈 Stats: http://localhost:${port}/api/readonly/stats`);
  console.log(`📋 Data: http://localhost:${port}/api/readonly/data`);
});

module.exports = app;