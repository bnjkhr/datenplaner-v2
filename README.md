# DP Planer - Datenprodukt Planer

Eine moderne React-Anwendung zur Verwaltung von Personal, Datenprodukten, Rollen und Skills mit Kalenderintegration für Team- und Ressourcenplanung.

## Features

- **Personalverwaltung** - Verwalten von Mitarbeitern mit Skills, Kontaktinformationen und Verfügbarkeit
- **Datenprodukt-Management** - Planung und Organisation von Datenprodukten
- **Rollen & Skills** - Definition und Zuordnung von Rollen und Fähigkeiten
- **Zuordnungen** - Mapping von Personen zu Datenprodukten und Rollen
- **Kalenderintegration** - Automatischer Import von Urlaubs- und Abwesenheitsdaten aus Confluence-Kalendern
- **Auswertungen & Analytics** - Visualisierung von Auslastung und Ressourcenverteilung mit Recharts
- **Real-time Updates** - Live-Synchronisation über Firebase Firestore
- **Read-only Modus** - Eingeschränkter Zugriff für reine Ansichtsberechtigungen
- **Modern UI** - Glassmorphism-Design mit Dark Theme und Tailwind CSS

## Tech Stack

- **Frontend:** React 18 mit Functional Components & Hooks
- **Backend/Database:** Firebase (Authentication + Firestore)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Calendar:** ical.js für iCal-Parsing
- **Deployment:** Vercel (mit Serverless Functions)

## Getting Started

### Voraussetzungen

- Node.js (v14 oder höher)
- npm oder yarn
- Firebase-Projekt (für Authentication und Firestore)

### Installation

1. Repository klonen:
```bash
git clone https://github.com/benkohler/datenplaner-v2.git
cd datenplaner-v2
```

2. Dependencies installieren:
```bash
npm install
```

3. Environment-Variablen konfigurieren:

Erstelle eine `.env` Datei im Root-Verzeichnis mit folgenden Variablen:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Optional: Calendar Integration
REACT_APP_CONFLUENCE_CALENDAR_URL=your_calendar_url
REACT_APP_CALENDAR_PROXY_URL=/api/calendar
REACT_APP_LOG_SERVER_URL=/api/log
```

4. Development Server starten:
```bash
npm start
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) verfügbar.

## Verfügbare Scripts

- `npm start` - Startet Development Server auf Port 3000
- `npm run build` - Erstellt Production Build
- `npm test` - Führt Jest Test Suite aus
- `npm run generate-confluence` - Generiert statische Confluence-Daten
- `npm run dev:readonly` - Startet App im Read-only Modus

## Projektstruktur

```
datenplaner-v2/
├── public/              # Statische Assets
├── src/
│   ├── api/            # API-Integration (Calendar, etc.)
│   ├── components/     # React Components
│   ├── context/        # React Context (DataProvider)
│   ├── pages/          # Hauptseiten (Verwaltung, Auswertungen)
│   ├── App.js          # Main App Component mit Auth
│   └── index.js        # Entry Point
├── api/                # Vercel Serverless Functions
│   └── calendar.js     # Calendar Proxy Endpoint
└── server/             # Optional: Local Server für Read-only Modus
```

## Firebase Setup

### Firestore Datenstruktur

Die App verwendet folgende Collections unter `/artifacts/${appId}/public/data/`:

- `personen` - Personaldaten mit Skills und Kontaktinformationen
- `datenprodukte` - Datenprodukt-Definitionen
- `rollen` - Rollendefinitionen
- `skills` - Skill-Definitionen mit Farbcodierung
- `zuordnungen` - Zuordnungen zwischen Personen, Produkten und Rollen
- `urlaube` - Urlaubs- und Abwesenheitsdaten

### Firestore Security Rules

Beispiel für Firestore Rules (anpassen nach Bedarf):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{collection}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Deployment

### Vercel

Die App ist für Deployment auf Vercel optimiert:

1. Projekt mit Vercel verbinden
2. Environment-Variablen in Vercel konfigurieren
3. Deploy ausführen

Die Serverless Functions unter `/api` werden automatisch deployed.

## Architektur

### State Management

Die App verwendet React Context (`DataProvider`) für zentrales State Management:
- CRUD-Operationen für alle Entitäten
- Real-time Firestore Subscriptions
- Optimistic UI Updates
- Error Handling mit User-friendly Messages

### Authentication Flow

1. `App.js` verwaltet Auth State
2. Nicht-authentifizierte User sehen `AuthPage`
3. Authentifizierte User sehen `MainAppContent` mit Navigation

### Kalenderintegration

- Fetching von iCal-Daten über Confluence
- Parsing mit ical.js
- Automatisches Mapping zu Personaldaten
- Anzeige in Verfügbarkeits-Übersicht

## Beitragen

Contributions sind willkommen! Bitte beachte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) Datei für Details.

## Support

Bei Fragen oder Problemen öffne bitte ein [Issue](https://github.com/benkohler/datenplaner-v2/issues).

## Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Powered by [Firebase](https://firebase.google.com/)
