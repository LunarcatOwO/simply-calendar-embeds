import { NextRequest, NextResponse } from 'next/server';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  allDay: boolean;
  color?: string;
  htmlLink?: string;
}

export interface CalendarData {
  summary: string;
  description?: string;
  timeZone: string;
  events: CalendarEvent[];
  updated: string;
}

// Extract calendar ID from various URL formats
function extractCalendarId(input: string): string | null {
  // If it's already an email/calendar ID format
  if (input.includes('@') && !input.includes('http')) {
    return input;
  }

  // Try to extract from embed URL
  const patterns = [
    /src=([^&]+)/,
    /calendar\/embed\?.*src=([^&]+)/,
    /calendar\/u\/0\/embed\?.*src=([^&]+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  // Try to extract from ical URL
  const icalMatch = input.match(/calendar\/ical\/([^/]+)/);
  if (icalMatch) {
    return decodeURIComponent(icalMatch[1]);
  }

  return null;
}

// Parse iCal format to extract events
function parseICalEvents(icalData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icalData.split(/\r?\n/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {
        id: '',
        title: 'Untitled Event',
        allDay: false,
      };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.id && currentEvent.start) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const keyPart = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        const key = keyPart.split(';')[0];

        switch (key) {
          case 'UID':
            currentEvent.id = value;
            break;
          case 'SUMMARY':
            currentEvent.title = unescapeICalText(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = unescapeICalText(value);
            break;
          case 'LOCATION':
            currentEvent.location = unescapeICalText(value);
            break;
          case 'DTSTART':
            const startParams = keyPart.includes('VALUE=DATE');
            if (startParams) {
              currentEvent.start = { date: formatICalDate(value) };
              currentEvent.allDay = true;
            } else {
              currentEvent.start = { dateTime: formatICalDateTime(value) };
            }
            break;
          case 'DTEND':
            const endParams = keyPart.includes('VALUE=DATE');
            if (endParams) {
              currentEvent.end = { date: formatICalDate(value) };
            } else {
              currentEvent.end = { dateTime: formatICalDateTime(value) };
            }
            break;
          case 'URL':
            currentEvent.htmlLink = value;
            break;
        }
      }
    }
  }

  return events;
}

function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function formatICalDate(dateStr: string): string {
  // Format: YYYYMMDD -> YYYY-MM-DD
  if (dateStr.length >= 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

function formatICalDateTime(dateTimeStr: string): string {
  // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS -> ISO format
  const cleaned = dateTimeStr.replace('Z', '');
  if (cleaned.length >= 15) {
    const date = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    const time = `${cleaned.slice(9, 11)}:${cleaned.slice(11, 13)}:${cleaned.slice(13, 15)}`;
    return `${date}T${time}${dateTimeStr.endsWith('Z') ? 'Z' : ''}`;
  }
  return dateTimeStr;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const calendarInput = searchParams.get('calendarId') || searchParams.get('url');
  const timeMin = searchParams.get('timeMin') || new Date().toISOString();
  const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  if (!calendarInput) {
    return NextResponse.json(
      { error: 'Calendar ID or URL is required' },
      { status: 400 }
    );
  }

  const calendarId = extractCalendarId(calendarInput);
  
  if (!calendarId) {
    return NextResponse.json(
      { error: 'Invalid calendar ID or URL format' },
      { status: 400 }
    );
  }

  try {
    // Fetch the public iCal feed
    const icalUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
    
    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Simply-Calendar-Embeds/1.0',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      // Try alternative URL format
      const altUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/full.ics`;
      const altResponse = await fetch(altUrl, {
        headers: {
          'User-Agent': 'Simply-Calendar-Embeds/1.0',
        },
        next: { revalidate: 300 },
      });

      if (!altResponse.ok) {
        return NextResponse.json(
          { error: 'Calendar not found or not public. Make sure the calendar is set to public.' },
          { status: 404 }
        );
      }

      const icalData = await altResponse.text();
      const events = parseICalEvents(icalData);
      
      // Filter events by time range
      const filteredEvents = filterEventsByTimeRange(events, timeMin, timeMax);

      return NextResponse.json({
        summary: extractCalendarName(icalData) || 'Calendar',
        timeZone: extractTimeZone(icalData) || 'UTC',
        events: filteredEvents,
        updated: new Date().toISOString(),
      } as CalendarData);
    }

    const icalData = await response.text();
    const events = parseICalEvents(icalData);
    
    // Filter events by time range
    const filteredEvents = filterEventsByTimeRange(events, timeMin, timeMax);

    return NextResponse.json({
      summary: extractCalendarName(icalData) || 'Calendar',
      timeZone: extractTimeZone(icalData) || 'UTC',
      events: filteredEvents,
      updated: new Date().toISOString(),
    } as CalendarData);

  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data. Make sure the calendar is public.' },
      { status: 500 }
    );
  }
}

function extractCalendarName(icalData: string): string | null {
  const match = icalData.match(/X-WR-CALNAME:(.+)/);
  return match ? unescapeICalText(match[1].trim()) : null;
}

function extractTimeZone(icalData: string): string | null {
  const match = icalData.match(/X-WR-TIMEZONE:(.+)/);
  return match ? match[1].trim() : null;
}

function filterEventsByTimeRange(events: CalendarEvent[], timeMin: string, timeMax: string): CalendarEvent[] {
  const minDate = new Date(timeMin);
  const maxDate = new Date(timeMax);

  return events.filter(event => {
    const eventStart = event.start.dateTime 
      ? new Date(event.start.dateTime)
      : event.start.date 
        ? new Date(event.start.date)
        : null;

    if (!eventStart) return false;

    return eventStart >= minDate && eventStart <= maxDate;
  }).sort((a, b) => {
    const aStart = a.start.dateTime || a.start.date || '';
    const bStart = b.start.dateTime || b.start.date || '';
    return new Date(aStart).getTime() - new Date(bStart).getTime();
  });
}
