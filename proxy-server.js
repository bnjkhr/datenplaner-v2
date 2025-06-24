// proxy-server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());

app.get("/calendar", async (req, res) => {
  try {
    const calendarUrl = "https://confluence.ard.de/rest/calendar-services/1.0/calendar/export/subcalendar/private/68490163a561512e0772ceaa1719605de6dce90e.ics";
    const response = await fetch(calendarUrl);

    if (!response.ok) {
      return res.status(response.status).send("Fehler beim Abrufen der ICS-Datei.");
    }

    const data = await response.text();
    res.setHeader("Content-Type", "text/calendar");
    res.send(data);
  } catch (error) {
    console.error("Fehler beim Abrufen:", error);
    res.status(500).send("Interner Serverfehler");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy läuft auf http://localhost:${PORT}`);
});
