export default async function handler(req, res) {
  const allowedOrigin = process.env.CORS_ORIGIN;
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }

  const sourceUrl = process.env.CALENDAR_PROXY_SOURCE_URL;
  if (!sourceUrl) {
    res.status(500).json({ error: 'Missing CALENDAR_PROXY_SOURCE_URL environment variable' });
    return;
  }

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.text();
    res.setHeader('Content-Type', 'text/calendar');
    res.status(200).send(data);
 } catch (err) {
    console.error('Error fetching calendar:', err);
    res.status(500).json({ error: 'Error fetching calendar' });
  }
}
