// api/calendar.js - Vercel Serverless Function
export default async function handler(req, res) {
  console.log('🚀 Calendar API called');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const calendarUrl = process.env.REACT_APP_CONFLUENCE_CALENDAR_URL;
    
    if (!calendarUrl) {
      console.error('❌ REACT_APP_CONFLUENCE_CALENDAR_URL not configured');
      return res.status(500).json({ error: 'Calendar URL not configured' });
    }

    console.log('📅 Fetching from Confluence:', calendarUrl);

    const response = await fetch(calendarUrl, {
      headers: {
        'User-Agent': 'Datenplaner-App/3.0',
        'Accept': 'text/calendar, application/ics, */*'
      }
    });

    console.log('📊 Confluence response:', response.status, response.ok);

    if (!response.ok) {
      console.error('❌ Confluence error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Confluence server error: ${response.status} ${response.statusText}` 
      });
    }

    const icsData = await response.text();
    
    console.log('📜 ICS data length:', icsData.length);
    console.log('📜 Is ICS format:', icsData.includes('BEGIN:VCALENDAR'));

    if (!icsData.includes('BEGIN:VCALENDAR')) {
      console.error('❌ Invalid ICS format received');
      return res.status(500).json({ error: 'Invalid calendar data format' });
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).send(icsData);
    
    console.log('✅ Calendar data sent successfully');
    
  } catch (error) {
    console.error('❌ Calendar API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar data',
      details: error.message 
    });
  }
}
