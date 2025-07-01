import ICAL from 'ical.js';

function cleanName(name) {
  return name.replace(/\s*\(.*?\)\s*$/, '').trim();
}

export async function fetchCalendarEvents(url) {
  if (!url) return [];
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const icsText = await response.text();
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
    return events;
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    return [];
  }
}