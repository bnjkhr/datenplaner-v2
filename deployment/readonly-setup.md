# Read-Only Setup Guide

## Übersicht

Diese Anleitung erklärt, wie du die sichere Read-Only Version für Confluence einrichtest, ohne Firebase-Credentials im Frontend preiszugeben.

## Architektur

```
Confluence → readonly-secure.html → Backend API → Firebase Admin SDK → Firestore
```

## Setup-Schritte

### 1. Firebase Service Account erstellen

1. Gehe zur [Firebase Console](https://console.firebase.google.com/)
2. Wähle dein Projekt aus
3. Gehe zu "Projekteinstellungen" → "Dienstkonten"
4. Klicke "Neuen privaten Schlüssel generieren"
5. Lade die JSON-Datei herunter

### 2. Environment Variables konfigurieren

Kopiere `.env.example` zu `.env` und fülle die Werte aus:

```bash
cp .env.example .env
```

Aus der Service Account JSON-Datei:
- `FIREBASE_PRIVATE_KEY_ID` → `private_key_id`
- `FIREBASE_PRIVATE_KEY` → `private_key` (mit Anführungszeichen)
- `FIREBASE_CLIENT_EMAIL` → `client_email`
- `FIREBASE_CLIENT_ID` → `client_id`

### 3. Backend API starten

#### Entwicklung:
```bash
npm run readonly-api
```

#### Produktion:
```bash
npm run start:readonly-api
```

### 4. Frontend konfigurieren

In `readonly-secure.html` die API-URL anpassen:

```javascript
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:3002'  // Entwicklung
  : 'https://your-api-domain.com'; // Produktion
```

## Deployment-Optionen

### Option 1: Vercel (empfohlen)

1. **Backend als Serverless Function:**
```bash
# vercel.json erstellen
{
  "functions": {
    "server/readonly-api.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/readonly/(.*)",
      "dest": "/server/readonly-api.js"
    }
  ]
}
```

2. **Environment Variables in Vercel setzen:**
   - Gehe zu Vercel Dashboard → Projekt → Settings → Environment Variables
   - Füge alle `.env` Variablen hinzu

### Option 2: Heroku

1. **Procfile erstellen:**
```
web: npm run start:readonly-api
```

2. **Environment Variables setzen:**
```bash
heroku config:set FIREBASE_PRIVATE_KEY_ID=your-value
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# ... weitere Variablen
```

### Option 3: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY server/ ./server/
COPY public/readonly-secure.html ./public/

EXPOSE 3002
CMD ["npm", "run", "start:readonly-api"]
```

### Option 4: Eigener Server

1. **PM2 für Process Management:**
```bash
npm install -g pm2
pm2 start npm --name "readonly-api" -- run start:readonly-api
pm2 save
pm2 startup
```

2. **Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location /api/readonly/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/your/public;
        try_files $uri $uri/ =404;
    }
}
```

## Confluence Integration

### HTML einbetten:

```html
<div style="width: 100%; height: 800px;">
  <iframe 
    src="https://your-domain.com/readonly-secure.html" 
    width="100%" 
    height="100%" 
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

### User Macro erstellen:

```html
## Macro Name: datenplaner-secure
## Macro Title: Datenprodukt Planer (Secure)
## Description: Sichere Read-Only Ansicht mit Backend-API
## Categories: confluence-content
## Macro has a body: No

<div style="width: 100%; height: 800px;">
  <iframe 
    src="https://your-api-domain.com/readonly-secure.html" 
    width="100%" 
    height="100%" 
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

## API Endpoints

- `GET /api/readonly/health` - Health Check
- `GET /api/readonly/data` - Alle Daten
- `GET /api/readonly/stats` - Statistiken

## Sicherheitsfeatures

✅ **Firebase Credentials im Backend** - Nie im Frontend sichtbar  
✅ **CORS-Schutz** - Nur erlaubte Domains  
✅ **Read-Only Zugriff** - Keine Schreiboperationen  
✅ **Error Handling** - Graceful Fallback zu Demo-Daten  
✅ **Auto-Refresh** - Alle 5 Minuten bei aktiver Verbindung  

## Troubleshooting

### Backend startet nicht:
```bash
# Logs überprüfen
npm run readonly-api

# Environment Variables testen
node -e "require('dotenv').config(); console.log(process.env.FIREBASE_PROJECT_ID);"
```

### CORS Fehler:
- `READONLY_ALLOWED_ORIGINS` in `.env` überprüfen
- Domain zur Liste hinzufügen

### Firebase Verbindung fehlschlägt:
- Service Account JSON-Daten überprüfen
- Firestore-Regeln für Service Account prüfen

### Frontend lädt keine Daten:
- API-URL in `readonly-secure.html` überprüfen
- Browser Developer Tools für Network-Fehler prüfen

## Monitoring

Backend-Logs enthalten:
- API-Aufrufe mit Zeitstempel
- Firebase-Verbindungsstatus
- Error Details bei Problemen

Frontend zeigt:
- Verbindungsstatus (grün/rot/orange)
- Letzte Aktualisierung
- Auto-Fallback zu Demo-Daten