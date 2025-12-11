'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { CalendarConfig, defaultConfig, queryStringToConfig, extractCalendarId } from '../types';
import CustomCalendar from '../components/CustomCalendar';
import { CalendarEvent } from '../api/calendar/route';

export default function EmbedContent() {
  const searchParams = useSearchParams();
  
  // Parse config from URL params (memoized to avoid unnecessary recalculations)
  const config = useMemo<CalendarConfig>(() => {
    const parsedConfig = queryStringToConfig(searchParams);
    return { ...defaultConfig, ...parsedConfig };
  }, [searchParams]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calendar data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarName, setCalendarName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    const calendarId = extractCalendarId(config.calendarUrl);
    if (!calendarId) {
      setError('Invalid calendar URL or ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set time range based on showPastEvents
      const timeMin = config.showPastEvents 
        ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year ago
        : new Date().toISOString(); // Now
      
      const response = await fetch(`/api/calendar?calendarId=${encodeURIComponent(calendarId)}&timeMin=${encodeURIComponent(timeMin)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar');
      }

      setEvents(data.events || []);
      setCalendarName(data.summary || 'Calendar');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [config.calendarUrl, config.showPastEvents]);

  // Fetch on mount
  useEffect(() => {
    if (config.calendarUrl) {
      fetchCalendarData();
    } else {
      setLoading(false);
      setError('No calendar URL provided');
    }
  }, [config.calendarUrl, fetchCalendarData]);

  // Auto-resize functionality for Squarespace and responsive mode
  useEffect(() => {
    if (!config.responsive && !config.squarespaceMode) return;

    // Send message to parent for iframe resizing
    const sendHeightToParent = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
      }
    };

    const interval = setInterval(sendHeightToParent, 1000);
    sendHeightToParent();

    return () => {
      clearInterval(interval);
    };
  }, [config.responsive, config.squarespaceMode]);

  // Determine background color
  const isDark = config.theme === 'dark' || 
    (config.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const bgColor = config.backgroundColor || (isDark ? '#0a0a0a' : '#ffffff');

  return (
    <div 
      ref={containerRef}
      className="embed-container"
      style={{ 
        width: '100%', 
        minHeight: '100vh',
        backgroundColor: bgColor,
        padding: config.squarespaceMode ? `${config.containerPadding}px` : 0,
      }}
    >
      <CustomCalendar
        events={events}
        config={config}
        calendarName={calendarName}
        loading={loading}
        error={error}
      />

      {/* Inject custom styles for theme */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: ${bgColor};
        }
        
        .embed-container {
          --accent-color: ${config.accentColor};
          --text-color: ${config.textColor};
          --bg-color: ${bgColor};
        }

        /* Squarespace specific fixes */
        ${config.squarespaceMode ? `
          .embed-container {
            max-width: 100% !important;
          }
          
          @media (max-width: 768px) {
            .embed-container > div {
              border-radius: ${Math.min(config.borderRadius, 8)}px !important;
            }
          }
        ` : ''}
      `}</style>
    </div>
  );
}
