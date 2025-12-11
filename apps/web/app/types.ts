export interface CalendarConfig {
  // Google Calendar Settings
  calendarUrl: string;
  
  // View Options
  viewMode: 'month' | 'week' | 'agenda';
  showTitle: boolean;
  showNavigation: boolean;
  showDate: boolean;
  showTodayButton: boolean;
  showPastEvents: boolean;
  showPrint: boolean;
  showTabs: boolean;
  showCalendars: boolean;
  showTimezone: boolean;
  
  // Styling
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  eventColor: string;  eventOpacity: number;          // Event background opacity (0-100)
  eventBorderColor: string;      // Event border color
  eventBorderOpacity: number;    // Event border opacity (0-100)  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  shadowSize: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontFamily: string;
  
  // Size & Responsiveness
  width: string;
  height: string;
  minHeight: string;
  maxHeight: string;
  responsive: boolean;
  aspectRatio: string;
  
  // Squarespace Specific
  squarespaceMode: boolean;
  containerPadding: number;
}

export const defaultConfig: CalendarConfig = {
  calendarUrl: '',
  
  viewMode: 'month',
  showTitle: true,
  showNavigation: true,
  showDate: true,
  showTodayButton: false,
  showPastEvents: true,
  showPrint: false,
  showTabs: true,
  showCalendars: true,
  showTimezone: false,
  
  theme: 'light',
  accentColor: '#4285f4',
  eventColor: '#4285f4',
  eventOpacity: 30,
  eventBorderColor: '#4285f4',
  eventBorderOpacity: 100,
  backgroundColor: '#ffffff',
  textColor: '#333333',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  shadowSize: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  
  width: '100%',
  height: '600px',
  minHeight: '400px',
  maxHeight: '800px',
  responsive: true,
  aspectRatio: '16/9',
  
  squarespaceMode: false,
  containerPadding: 0,
};

export function extractCalendarId(url: string): string | null {
  // Handle various Google Calendar URL formats
  
  // If it's already an email/calendar ID format
  if (url.includes('@') && !url.includes('http')) {
    return url.trim();
  }

  // Try to extract from embed URL
  const patterns = [
    /src=([^&]+)/,
    /calendar\/embed\?.*src=([^&]+)/,
    /calendar\/u\/0\/embed\?.*src=([^&]+)/,
    /calendar\.google\.com\/calendar\/embed\?src=([^&]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  // Try to extract from ical URL
  const icalMatch = url.match(/calendar\/ical\/([^/]+)/);
  if (icalMatch) {
    return decodeURIComponent(icalMatch[1]);
  }
  
  return null;
}

export function configToQueryString(config: CalendarConfig): string {
  return new URLSearchParams(
    Object.entries(config).map(([key, value]) => [key, String(value)])
  ).toString();
}

export function queryStringToConfig(query: URLSearchParams): Partial<CalendarConfig> {
  const config: Partial<CalendarConfig> = {};
  
  const stringFields = ['calendarUrl', 'viewMode', 'theme', 'accentColor', 'eventColor', 'eventBorderColor', 'backgroundColor', 
    'textColor', 'borderColor', 'shadowSize', 'fontFamily', 'width', 'height', 
    'minHeight', 'maxHeight', 'aspectRatio'];
  
  const booleanFields = ['showTitle', 'showNavigation', 'showDate', 'showTodayButton', 'showPastEvents', 'showPrint', 
    'showTabs', 'showCalendars', 'showTimezone', 'responsive', 'squarespaceMode'];
  
  const numberFields = ['borderRadius', 'borderWidth', 'containerPadding', 'eventOpacity', 'eventBorderOpacity'];
  
  stringFields.forEach(field => {
    const value = query.get(field);
    if (value) (config as Record<string, unknown>)[field] = value;
  });
  
  booleanFields.forEach(field => {
    const value = query.get(field);
    if (value) (config as Record<string, unknown>)[field] = value === 'true';
  });
  
  numberFields.forEach(field => {
    const value = query.get(field);
    if (value) (config as Record<string, unknown>)[field] = Number(value);
  });
  
  return config;
}
