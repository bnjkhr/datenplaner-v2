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

// Firebase Admin initialisieren
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
}

const db = admin.firestore();
const appId = process.env.REACT_APP_FIREBASE_APP_ID || 'datenprodukt-planer-app';

// Helper function to get collection path
const getCollectionPath = (name) => `artifacts/${appId}/public/data/${name}`;

// API Endpoints
app.get('/api/readonly/data', async (req, res) => {
  try {
    const collections = ['personen', 'skills', 'datenprodukte', 'rollen', 'zuordnungen'];
    const data = {};

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

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/readonly/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Statistiken endpoint
app.get('/api/readonly/stats', async (req, res) => {
  try {
    const collections = ['personen', 'skills', 'datenprodukte', 'rollen', 'zuordnungen'];
    const stats = {};

    for (const collectionName of collections) {
      const path = getCollectionPath(collectionName);
      const snapshot = await db.collection(path).get();
      stats[collectionName] = snapshot.size;
    }

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
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