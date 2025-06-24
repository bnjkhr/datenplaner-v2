# Datenplaner App

Dieses Projekt benötigt einige Umgebungsvariablen. Legen Sie eine `.env` Datei an und setzen Sie dort u.a. folgende Werte:

```
REACT_APP_FIREBASE_API_KEY=<Ihre Firebase API Key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<Ihre Auth Domain>
REACT_APP_FIREBASE_PROJECT_ID=<Ihre Projekt ID>
REACT_APP_FIREBASE_STORAGE_BUCKET=<Ihr Storage Bucket>
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<Ihre Sender ID>
REACT_APP_FIREBASE_APP_ID=<Ihre App ID>
REACT_APP_CONFLUENCE_CALENDAR_URL=<iCal-URL aus Confluence>
```

Die Variable `REACT_APP_CONFLUENCE_CALENDAR_URL` zeigt auf den iCalendar-Feed Ihres Confluence Kalenders. Die Anwendung lädt darüber Urlaubszeiten und ordnet sie den Personen anhand ihrer Namen zu.

Starten Sie die Entwicklungsumgebung wie gewohnt mit `npm start`.
