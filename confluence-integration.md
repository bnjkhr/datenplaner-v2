# Confluence Integration - Datenprodukt Planer

## Übersicht

Die Read-Only Version des Datenprodukt Planers kann in Confluence eingebettet werden, um Team-Übersichten und Auswertungen anzuzeigen, ohne dass Benutzer Änderungen vornehmen können.

## Verfügbare Read-Only Komponenten

### 1. PersonenVerwaltungReadOnly
- **Datei**: `src/pages/PersonenVerwaltungReadOnly.js`
- **Features**:
  - Team-Übersicht mit Auslastungsindikator
  - Suchfunktion nach Namen, Skills und Datenprodukten
  - Anzeige aktuell abwesender Personen
  - Team-Statistiken (Gesamt, mit Zuordnung, überbucht, abwesend)
  - Detaillierte Personenliste mit Skills und Zuordnungen

### 2. AuswertungenReadOnly
- **Datei**: `src/pages/AuswertungenReadOnly.js`
- **Features**:
  - Filterbare Auslastungsübersicht
  - Tabellarische Übersicht
  - Grafische Auswertungen (Bar Charts)
  - Skill-Analyse
  - Alle Filter funktionsfähig (Auslastung, Skill, Datenprodukt, Rolle)

### 3. ReadOnlyApp
- **Datei**: `src/ReadOnlyApp.js`
- **Features**:
  - Standalone App mit Navigation zwischen den Read-Only Views
  - Automatisch im Read-Only Modus (isReadOnly=true)
  - Minimale Navigation ohne Bearbeitungsoptionen

## Integration in Confluence

### Option 1: iframe Integration

```html
<iframe 
  src="https://your-domain.com/readonly.html" 
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: none;">
</iframe>
```

### Option 2: JavaScript Widget (empfohlen)

1. **Build die Read-Only Version:**
```bash
# Erstelle separaten Build für Read-Only
npm run build:readonly
```

2. **Hosting Setup:**
- Hoste die gebauten Dateien auf einem zugänglichen Server
- Stelle sicher, dass CORS korrekt konfiguriert ist

3. **Confluence Widget Code:**
```html
<div id="datenprodukt-planer-readonly"></div>
<script src="https://your-domain.com/static/js/readonly.js"></script>
<script>
  DatenproduktPlanerReadOnly.mount('datenprodukt-planer-readonly');
</script>
```

### Option 3: Confluence User Macro

Erstelle ein User Macro in Confluence:

```html
## Macro Name: datenprodukt-planer
## Macro Title: Datenprodukt Planer Read-Only
## Description: Zeigt Team-Übersichten und Auswertungen an
## Categories: confluence-content
## Macro has a body: No
## Parameters:
## - view|title=Ansicht|type=enum|enumValues=personen,auswertungen|default=personen

<div id="datenprodukt-readonly-$!{random.nextInt(10000)}"></div>
<script>
  (function() {
    var elementId = 'datenprodukt-readonly-$!{random.nextInt(10000)}';
    var view = '$!{paramview}' || 'personen';
    
    // Load external scripts
    var script = document.createElement('script');
    script.src = 'https://your-domain.com/static/js/readonly.js';
    script.onload = function() {
      if (window.DatenproduktPlanerReadOnly) {
        window.DatenproduktPlanerReadOnly.mount(elementId, { initialView: view });
      }
    };
    document.head.appendChild(script);
  })();
</script>
```

## Build-Konfiguration

### package.json Anpassungen

```json
{
  "scripts": {
    "build:readonly": "REACT_APP_BUILD_TARGET=readonly npm run build",
    "start:readonly": "REACT_APP_BUILD_TARGET=readonly npm start"
  }
}
```

### Webpack-Konfiguration (falls ejected)

```javascript
// Für Read-Only Build
if (process.env.REACT_APP_BUILD_TARGET === 'readonly') {
  config.entry = './src/readonly-entry.js';
  config.output.filename = 'static/js/readonly.js';
}
```

## Sicherheitsüberlegungen

1. **CORS-Konfiguration**: Stelle sicher, dass deine API CORS für Confluence-Domains erlaubt
2. **API-Keys**: Verwende read-only API-Keys für die Confluence-Integration
3. **Rate Limiting**: Implementiere Rate Limiting für öffentliche Endpunkte
4. **CSP Headers**: Konfiguriere Content Security Policy Headers

## Deployment

### 1. Firebase Hosting (empfohlen)
```bash
# Build für Produktion
npm run build:readonly

# Deploy zu Firebase
firebase deploy --only hosting:readonly
```

### 2. CDN-basierte Lösung
- Lade gebaute Files zu einem CDN hoch
- Konfiguriere Caching-Headers appropriat
- Verwende eine dedizierte Subdomain (z.B. readonly.your-domain.com)

## Monitoring und Updates

1. **Analytics**: Integriere Analytics um Usage zu tracken
2. **Error Logging**: Implementiere Error Logging für die Read-Only Version
3. **Auto-Updates**: Setup für automatische Updates der Read-Only Version

## Beispiel URLs

Nach dem Deployment sind folgende URLs verfügbar:

- **Vollständige Read-Only App**: `https://your-domain.com/readonly.html`
- **Nur Team-Übersicht**: `https://your-domain.com/readonly.html#personen`
- **Nur Auswertungen**: `https://your-domain.com/readonly.html#auswertungen`

## Troubleshooting

### Häufige Probleme:

1. **CORS Fehler**: Prüfe API-Konfiguration
2. **Styling-Probleme**: Stelle sicher, dass CSS korrekt geladen wird
3. **Performance**: Optimiere für Confluence-Umgebung (kleinere Bundle-Größen)

### Debug-Modus:
```javascript
// Aktiviere Debug-Logs
window.DATENPRODUKT_DEBUG = true;
```