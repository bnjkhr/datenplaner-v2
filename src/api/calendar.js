import ICAL from 'ical.js';

function cleanName(name) {
  return name.replace(/\s*\(.*?\)\s*$/, '').trim();
}

export async function fetchCalendarEvents(url) {
  console.log('🚀 fetchCalendarEvents called with URL:', url);
  
  if (!url) {
    console.log('❌ No URL provided to fetchCalendarEvents');
    return [];
  }
  
  try {
    console.log('🌐 Starting fetch request...');
    const response = await fetch(url);
    console.log('📊 Fetch response status:', response.status, response.ok);
    
    if (!response.ok) {
      console.error('❌ Fetch failed:', response.status, response.statusText);
      throw new Error('Network response was not ok');
    }
    
    const icsText = await response.text();
    console.log('📜 ICS text length:', icsText.length);
    console.log('📜 ICS text start:', icsText.substring(0, 100));
    console.log('📜 Contains VCALENDAR:', icsText.includes('BEGIN:VCALENDAR'));
    
    if (!icsText || icsText.trim().length === 0) {
      console.log('❌ Empty ICS text received');
      return [];
    }
    
    console.log('🛠️ Parsing ICAL data...');
    const jcalData = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent').map((evComp) => {
      const event = new ICAL.Event(evComp);
      const attendeeProps = evComp.getAllProperties('attendee') || [];
      const attendees = attendeeProps.map((p) => {
        const cn = p.getParameter('CN');
        const paramEmail = p.getParameter('EMAIL');
        const value = String(p.getFirstValue() || '');
        const email = paramEmail ? paramEmail : value;

        if (cn) return cleanName(cn.trim());
        if (email) return cleanName(email.replace(/^mailto:/i, '').trim());
        return cleanName((event.summary || '').trim());
      });

      return {
        summary: event.summary,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        attendees,
      };
    });
    
    console.log('✅ Parsed events successfully:', events.length);
    console.log('📅 Sample events:', events.slice(0, 2));
    return events;
  } catch (err) {
    console.error('❌ Error fetching calendar events:', err);
    console.error('❌ Error details:', err.message, err.stack);
    return [];
  }
}