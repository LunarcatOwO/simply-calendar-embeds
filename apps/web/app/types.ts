export interface CalendarConfig {
  // Google Calendar Settings
  calendarUrl: string;
  
  // View Options
  viewMode: 'month' | 'week' | 'agenda';
  showTitle: boolean;
  showNavigation: boolean;
  showDate: boolean;
  showPrint: boolean;
  showTabs: boolean;
  showCalendars: boolean;
  showTimezone: boolean;
  
  // Styling
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  backgroundColor: string;
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
  showPrint: false,
  showTabs: true,
  showCalendars: true,
  showTimezone: false,
  
  theme: 'light',
  accentColor: '#4285f4',
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
  
  // Check if it's already a calendar ID (email format)
  if (url.includes('@') && !url.includes('http')) {
    return url;
  }
  
  return null;
}

export function generateEmbedUrl(config: CalendarConfig): string {
  const calendarId = extractCalendarId(config.calendarUrl);
  if (!calendarId) return '';
  
  const params = new URLSearchParams();
  params.set('src', calendarId);
  params.set('ctz', Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // View mode
  const modeMap = { month: 'MONTH', week: 'WEEK', agenda: 'AGENDA' };
  params.set('mode', modeMap[config.viewMode] || 'MONTH');
  
  // Show/hide options
  params.set('showTitle', config.showTitle ? '1' : '0');
  params.set('showNav', config.showNavigation ? '1' : '0');
  params.set('showDate', config.showDate ? '1' : '0');
  params.set('showPrint', config.showPrint ? '1' : '0');
  params.set('showTabs', config.showTabs ? '1' : '0');
  params.set('showCalendars', config.showCalendars ? '1' : '0');
  params.set('showTz', config.showTimezone ? '1' : '0');
  
  // Colors (Google uses hex without #)
  const bgColor = config.backgroundColor.replace('#', '');
  params.set('bgcolor', bgColor);
  
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
}

export function configToQueryString(config: CalendarConfig): string {
  return new URLSearchParams(
    Object.entries(config).map(([key, value]) => [key, String(value)])
  ).toString();
}

export function queryStringToConfig(query: URLSearchParams): Partial<CalendarConfig> {
  const config: Partial<CalendarConfig> = {};
  
  const stringFields = ['calendarUrl', 'viewMode', 'theme', 'accentColor', 'backgroundColor', 
    'textColor', 'borderColor', 'shadowSize', 'fontFamily', 'width', 'height', 
    'minHeight', 'maxHeight', 'aspectRatio'];
  
  const booleanFields = ['showTitle', 'showNavigation', 'showDate', 'showPrint', 
    'showTabs', 'showCalendars', 'showTimezone', 'responsive', 'squarespaceMode'];
  
  const numberFields = ['borderRadius', 'borderWidth', 'containerPadding'];
  
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
