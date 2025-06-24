import ICAL from 'ical.js';

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
        const paramEmail = p.getParameter('EMAIL');
        const value = paramEmail ? paramEmail : String(p.getFirstValue());
        return value.replace(/^mailto:/i, '').toLowerCase();
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