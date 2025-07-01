// api/calendar.js - Vercel Serverless Function
export default async function handler(req, res) {
  // CORS Headers setzen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS-Request für CORS Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Nur GET-Requests erlauben
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Confluence-Kalender-URL aus Environment-Variable
    const calendarUrl = process.env.REACT_APP_CONFLUENCE_CALENDAR_URL;

    if (!calendarUrl) {
      console.error("REACT_APP_CONFLUENCE_CALENDAR_URL nicht gesetzt");
      return res.status(500).json({ error: "Calendar URL not configured" });
    }



    // Kalender-Daten vom Confluence-Server abrufen
    const response = await fetch(calendarUrl, {
      headers: {
        "User-Agent": "Datenplaner-App/1.0",
        Accept: "text/calendar, application/ics, */*",
      },
    });

    if (!response.ok) {
      console.error(
        "Confluence Response Error:",
        response.status,
        response.statusText
      );
      return res.status(response.status).json({
        error: `Confluence server error: ${response.status} ${response.statusText}`,
      });
    }

    const calendarData = await response.text();



    // ICS-Content zurückgeben
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate"); // 5 Min Cache
    res.status(200).send(calendarData);
  } catch (error) {
    console.error("❌ Calendar proxy error:", error);

    return res.status(500).json({
      error: "Failed to fetch calendar data",
      details: error.message,
    });
  }
}
