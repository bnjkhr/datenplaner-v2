#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase Admin initialisieren
if (!admin.apps.length) {
  try {
    // Versuche Service Account aus Umgebungsvariablen
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "datenprodukt-planer-app",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };

    if (serviceAccount.private_key) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
      });
      console.log('✅ Firebase Admin mit Service Account initialisiert');
    } else {
      // Fallback: Versuche lokale Service Account Datei
      const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
      if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath)
        });
        console.log('✅ Firebase Admin mit lokaler Service Account Datei initialisiert');
      } else {
        throw new Error('Keine Firebase Credentials gefunden');
      }
    }
  } catch (error) {
    console.error('❌ Firebase Admin Initialisierung fehlgeschlagen:', error.message);
    console.log('📋 Verwende Demo-Daten...');
    generateWithDemoData();
    process.exit(0);
  }
}

const db = admin.firestore();
const appId = "datenplaner-app-v3";

// Demo-Daten als Fallback
function getDemoData() {
  return {
    personen: [
      { id: "1", name: "Max Mustermann", email: "max@example.com", wochenstunden: 31, skillIds: ["1", "2"], isM13: true, kategorien: ["Plattform"] },
      { id: "2", name: "Anna Schmidt", email: "anna@example.com", wochenstunden: 35, skillIds: ["2", "3"], isM13: true, kategorien: ["Datenprodukt", "Governance"] },
      { id: "3", name: "Tom Weber", email: "tom@example.com", wochenstunden: 31, skillIds: ["1", "3"], isM13: false, kategorien: [] },
      { id: "4", name: "Lisa Müller", email: "lisa@example.com", wochenstunden: 31, skillIds: ["1", "2", "3"], isM13: true, kategorien: ["Governance"] },
      { id: "5", name: "Peter Klein", email: "peter@example.com", wochenstunden: 20, skillIds: ["2"], isM13: true, kategorien: [] }
    ],
    skills: [
      { id: "1", name: "Python", color: "#3776ab" },
      { id: "2", name: "Data Science", color: "#ff6b35" },
      { id: "3", name: "Machine Learning", color: "#4caf50" },
      { id: "4", name: "SQL", color: "#f29111" },
      { id: "5", name: "Tableau", color: "#e97627" }
    ],
    datenprodukte: [
      { id: "1", name: "Customer Analytics Dashboard" },
      { id: "2", name: "Sales Forecast Model" },
      { id: "3", name: "ML Recommendation Engine" },
      { id: "4", name: "Inventory Optimization" }
    ],
    rollen: [
      { id: "1", name: "Data Scientist" },
      { id: "2", name: "Analytics Engineer" },
      { id: "3", name: "ML Engineer" },
      { id: "4", name: "Business Analyst" }
    ],
    zuordnungen: [
      { id: "1", personId: "1", datenproduktId: "1", rolleId: "1", stunden: 20 },
      { id: "2", personId: "1", datenproduktId: "2", rolleId: "2", stunden: 15 },
      { id: "3", personId: "2", datenproduktId: "2", rolleId: "1", stunden: 25 },
      { id: "4", personId: "2", datenproduktId: "3", rolleId: "1", stunden: 10 },
      { id: "5", personId: "3", datenproduktId: "3", rolleId: "3", stunden: 31 },
      { id: "6", personId: "4", datenproduktId: "1", rolleId: "2", stunden: 15 },
      { id: "7", personId: "4", datenproduktId: "4", rolleId: "4", stunden: 20 },
      { id: "8", personId: "5", datenproduktId: "4", rolleId: "4", stunden: 25 }
    ]
  };
}

// Firebase-Daten laden
async function loadFirebaseData() {
  try {
    console.log('🔍 Lade Firebase-Daten...');
    
    const collections = ['personen', 'skills', 'datenprodukte', 'rollen', 'zuordnungen'];
    const data = {};

    for (const collectionName of collections) {
      const path = `artifacts/${appId}/public/data/${collectionName}`;
      console.log(`📊 Lade Collection: ${path}`);
      
      try {
        const snapshot = await db.collection(path).get();
        console.log(`✅ ${collectionName}: ${snapshot.docs.length} Dokumente geladen`);
        
        data[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sortiere Daten außer Zuordnungen
        if (collectionName !== 'zuordnungen') {
          data[collectionName].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de'));
        }
      } catch (collectionError) {
        console.error(`❌ Fehler bei Collection ${collectionName}:`, collectionError.message);
        throw collectionError;
      }
    }
    
    console.log('✅ Firebase-Daten erfolgreich geladen');
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Laden der Firebase-Daten:', error.message);
    throw error;
  }
}

// Workload-Daten berechnen - nur M13 Mitarbeiter
function calculateWorkloadData(data) {
  // Filtere nur M13 Mitarbeiter
  const m13Personen = data.personen.filter(person => person.isM13 === true);
  
  return m13Personen.map(person => {
    const assignments = data.zuordnungen.filter(z => z.personId === person.id);
    const gebuchteStunden = assignments.reduce((sum, a) => sum + (a.stunden || 0), 0);
    const auslastung = (gebuchteStunden / (person.wochenstunden || 31)) * 100;
    
    return {
      ...person,
      gebuchteStunden,
      auslastung: Math.round(auslastung * 10) / 10,
      status: auslastung > 100 ? 'overbooked' : auslastung < 20 ? 'underbooked' : 'normal'
    };
  });
}

// Gruppiere M13 Mitarbeiter nach Kategorien
function groupByCategories(workloadData) {
  const categories = {
    'Plattform': [],
    'Datenprodukt': [],
    'Governance': [],
    'Ohne Kategorie': []
  };
  
  workloadData.forEach(person => {
    if (!person.kategorien || person.kategorien.length === 0) {
      categories['Ohne Kategorie'].push(person);
    } else {
      // Person kann in mehreren Kategorien sein
      person.kategorien.forEach(kategorie => {
        if (categories[kategorie]) {
          categories[kategorie].push(person);
        }
      });
      
      // Falls Person nicht in bekannte Kategorien eingeordnet wurde
      const hasKnownCategory = person.kategorien.some(k => ['Plattform', 'Datenprodukt', 'Governance'].includes(k));
      if (!hasKnownCategory) {
        categories['Ohne Kategorie'].push(person);
      }
    }
  });
  
  return categories;
}

// HTML generieren
function generateHTML(data, isLiveData = true) {
  const workloadData = calculateWorkloadData(data);
  const groupedData = groupByCategories(workloadData);
  const totalM13Persons = workloadData.length;
  const assignedM13Persons = workloadData.filter(p => 
    data.zuordnungen.some(z => z.personId === p.id)
  ).length;
  const uniqueDataProducts = data.datenprodukte.length;

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Datenprodukt Planer - Live Data</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: linear-gradient(135deg, #f8fafc 0%, rgba(239, 246, 255, 0.3) 100%);
        min-height: 100vh;
        color: #1f2937;
        padding: 20px;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      .header {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      
      .title {
        font-size: 28px;
        font-weight: bold;
        background: linear-gradient(45deg, #2563eb, #4f46e5);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: #2563eb;
        margin-bottom: 8px;
      }
      
      .subtitle {
        color: #6b7280;
        font-size: 16px;
      }
      
      .status {
        margin-top: 12px;
        display: flex;
        align-items: center;
        font-size: 14px;
        color: ${isLiveData ? '#059669' : '#f59e0b'};
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        background-color: ${isLiveData ? '#10b981' : '#f59e0b'};
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-bottom: 24px;
        overflow: hidden;
      }
      
      .card-header {
        padding: 20px;
        border-bottom: 1px solid #f3f4f6;
        background: #fafafa;
      }
      
      .card-title {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .card-content {
        padding: 20px;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      
      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        border: 1px solid #e5e7eb;
      }
      
      .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        font-size: 20px;
      }
      
      .icon-blue {
        background-color: #dbeafe;
        color: #2563eb;
      }
      
      .icon-green {
        background-color: #d1fae5;
        color: #059669;
      }
      
      .icon-orange {
        background-color: #fed7aa;
        color: #ea580c;
      }
      
      .icon-gray {
        background-color: #f3f4f6;
        color: #6b7280;
      }
      
      .stat-content h3 {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .stat-content p {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
      }
      
      .team-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .team-table th {
        background: #f8fafc;
        padding: 12px 16px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .team-table td {
        padding: 10px 16px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
        font-size: 14px;
      }
      
      .team-table tr:hover {
        background: #f9fafb;
      }
      
      .team-table tr:last-child td {
        border-bottom: none;
      }
      
      .person-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 2px;
      }
      
      .person-email {
        font-size: 12px;
        color: #6b7280;
      }
      
      .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      
      .status-normal {
        color: #065f46;
        background-color: #d1fae5;
      }
      
      .status-overbooked {
        color: #991b1b;
        background-color: #fecaca;
      }
      
      .status-underbooked {
        color: #c2410c;
        background-color: #fed7aa;
      }
      
      .skills {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }
      
      .skill-tag {
        display: inline-flex;
        align-items: center;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;
        color: #374151;
        background: #f3f4f6;
      }
      
      .assignments {
        font-size: 12px;
        line-height: 1.4;
      }
      
      .assignment {
        margin-bottom: 3px;
        color: #374151;
      }
      
      .assignment:last-child {
        margin-bottom: 0;
      }
      
      .assignment-name {
        font-weight: 600;
        color: #1f2937;
      }
      
      .assignment-role {
        color: #6b7280;
      }
      
      .assignment-hours {
        font-weight: 500;
        color: #374151;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="title">Datenprodukt Planer - M13 Mitarbeiter</h1>
        <p class="subtitle">M13 Team-Übersicht nach Kategorien</p>
      </div>

      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue">👥</div>
          <div class="stat-content">
            <h3>M13 Gesamt</h3>
            <p>${totalM13Persons}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon icon-green">✅</div>
          <div class="stat-content">
            <h3>Mit Zuordnung</h3>
            <p>${assignedM13Persons}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon icon-orange">📊</div>
          <div class="stat-content">
            <h3>Datenprodukt-Teams</h3>
            <p>${uniqueDataProducts}</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon ${isLiveData ? 'icon-green' : 'icon-gray'}">🔥</div>
          <div class="stat-content">
            <h3>Status</h3>
            <p style="font-size: 16px;">${isLiveData ? 'Live' : 'Demo'}</p>
          </div>
        </div>
      </div>

      <!-- Categories -->
      ${Object.entries(groupedData).map(([kategorie, personen]) => {
        if (personen.length === 0) return '';
        
        const categoryIcon = kategorie === 'Plattform' ? '🏗️' :
                            kategorie === 'Datenprodukt' ? '📊' :
                            kategorie === 'Governance' ? '⚖️' : '❓';
        
        return `
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">${categoryIcon} ${kategorie} (${personen.length})</h2>
            </div>
            <div class="card-content">
              <table class="team-table">
                <thead>
                  <tr>
                    <th>Name & E-Mail</th>
                    <th>Planstunden</th>
                    <th>Zuordnungen</th>
                  </tr>
                </thead>
                <tbody>
                  ${personen.map(person => {
                    const assignments = data.zuordnungen.filter(z => z.personId === person.id);
                    
                    return `
                      <tr>
                        <td>
                          <div class="person-name">${person.name}</div>
                          <div class="person-email">${person.email || ''}</div>
                        </td>
                        <td>
                          <div class="status-badge status-normal">
                            ${person.wochenstunden || 31}h
                          </div>
                        </td>
                        <td>
                          <div class="assignments">
                            ${assignments.length > 0 ? assignments.map(assignment => {
                              const produkt = data.datenprodukte.find(dp => dp.id === assignment.datenproduktId);
                              return `
                                <div class="assignment">
                                  <span class="assignment-name">${produkt?.name || 'Unbekanntes Produkt'}</span>
                                </div>
                              `;
                            }).join('') : '<span style="color: #6b7280; font-style: italic;">Keine Zuordnungen</span>'}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </body>
</html>`;
}

// Mit Demo-Daten generieren
function generateWithDemoData() {
  console.log('📋 Generiere HTML mit Demo-Daten...');
  const demoData = getDemoData();
  const html = generateHTML(demoData, false);
  
  const outputPath = path.join(__dirname, '..', 'public', 'readonly-live.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ HTML-Datei mit Demo-Daten generiert: ${outputPath}`);
}

// Hauptfunktion
async function main() {
  try {
    console.log('🚀 Starte Generierung der statischen HTML-Datei...');
    
    // Versuche Firebase-Daten zu laden
    const data = await loadFirebaseData();
    console.log('✅ Live-Daten von Firebase geladen');
    
    // HTML generieren
    const html = generateHTML(data, true);
    
    // Datei schreiben
    const outputPath = path.join(__dirname, '..', 'public', 'readonly-live.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    
    console.log(`✅ HTML-Datei mit Live-Daten generiert: ${outputPath}`);
    console.log(`📊 ${data.personen.length} Personen, ${data.zuordnungen.length} Zuordnungen`);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.log('📋 Fallback zu Demo-Daten...');
    generateWithDemoData();
  }
}

// Script ausführen
if (require.main === module) {
  main().then(() => {
    console.log('🎉 Fertig!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Unerwarteter Fehler:', error);
    process.exit(1);
  });
}

module.exports = { main, generateWithDemoData };