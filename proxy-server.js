const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env if available
dotenv.config();

const app = express();
const PORT = process.env.CALENDAR_PROXY_PORT || 3001;
const sourceUrl = process.env.CALENDAR_PROXY_SOURCE_URL;

if (!sourceUrl) {
  console.error('Missing CALENDAR_PROXY_SOURCE_URL environment variable');
  process.exit(1);
}

app.get('/calendar', async (_req, res) => {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.text();
    res.header('Content-Type', 'text/calendar');
    res.send(data);
  } catch (err) {
    console.error('Error fetching calendar:', err);
    res.status(500).send('Error fetching calendar');
  }
});

app.listen(PORT, () => {
  console.log(`Calendar proxy running on port ${PORT}`);
});