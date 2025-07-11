# Firestore Security Rules für Read-Only Zugriff

## Problem

Nach dem Deployment zeigt die `readonly-firebase.html` Version:
```
Demo-Modus (Backend nicht erreichbar)
```

Das liegt daran, dass deine Firestore Security Rules den öffentlichen Zugriff blockieren.

## Lösung: Firestore Rules anpassen

### 1. Firebase Console öffnen

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Wähle dein Projekt: **datenprodukt-planer-app**
3. Navigiere zu **Firestore Database** → **Rules**

### 2. Aktuelle Rules anzeigen

Deine aktuellen Rules sehen wahrscheinlich so aus:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Rules für Read-Only Zugriff erweitern

Ersetze die Rules mit diesem Code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Bestehende authentifizierte Zugriffe (für deine Haupt-App)
    match /artifacts/{appId}/private/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // NEU: Read-Only Zugriff auf public data für alle
    match /artifacts/{appId}/public/data/{collection}/{document=**} {
      allow read: if true;  // Erlaubt jedem das Lesen
      allow write: if false; // Verhindert alle Schreibvorgänge
    }
    
    // NEU: Read-Only Zugriff auf Meta-Daten
    match /artifacts/{appId}/public/meta {
      allow read: if true;
      allow write: if false;
    }
    
    // Fallback: Alle anderen Pfade authentifiziert
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Rules veröffentlichen

1. Klicke **"Veröffentlichen"**
2. Warte auf die Bestätigung
3. Die Rules sind sofort aktiv

### 5. Testen

1. Öffne die `readonly-firebase.html` Datei im Browser
2. Du solltest jetzt sehen: **"✓ Firebase Verbindung aktiv"**
3. Die echten Daten werden geladen

## Was passiert?

Die neuen Rules erlauben:
- ✅ **Öffentliches Lesen** der Collections unter `artifacts/datenprodukt-planer-app/public/data/`
- ❌ **Keine Schreibvorgänge** für öffentliche Benutzer
- ✅ **Vollzugriff** für authentifizierte Benutzer (deine Haupt-App)

## Sicherheit

Diese Rules sind sicher, weil:
- Nur **Lesen** ist erlaubt, keine Änderungen
- Nur **spezifische Pfade** sind öffentlich
- **Sensible Daten** bleiben geschützt
- **Haupt-App** funktioniert weiterhin normal

## Alternative: Spezifische App-ID

Falls du mehrere Apps hast, ersetze `{appId}` mit der konkreten ID:

```javascript
match /artifacts/datenprodukt-planer-app/public/data/{collection}/{document=**} {
  allow read: if true;
  allow write: if false;
}
```

## Troubleshooting

### Rules funktionieren nicht?

1. **Cache leeren**: Browser-Cache löschen
2. **Warten**: Rules brauchen 1-2 Minuten zur Aktivierung
3. **Console prüfen**: Browser Developer Tools → Console für Fehlermeldungen

### Immer noch Demo-Modus?

1. **Rules prüfen**: Pfad `artifacts/datenprodukt-planer-app/public/data/` muss exakt stimmen
2. **Daten vorhanden?**: In Firestore Console prüfen ob Daten unter diesem Pfad existieren
3. **Browser Console**: Fehlermeldungen prüfen

### Permission Denied Fehler?

- Rules wurden noch nicht aktiviert → 2 Minuten warten
- Pfad stimmt nicht überein → Rules-Pfad korrigieren
- Syntax-Fehler in Rules → Rules erneut eingeben

Nach der Anpassung der Rules sollte die `readonly-firebase.html` Version deine echten Live-Daten anzeigen! 🚀