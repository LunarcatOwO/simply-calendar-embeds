'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent } from '../api/calendar/route';
import { CalendarConfig } from '../types';

// Helper function to convert hex color and opacity percentage to rgba
function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex (e.g., #fff)
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  // Convert opacity percentage (0-100) to alpha (0-1)
  const alpha = Math.max(0, Math.min(100, opacity)) / 100;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to determine if text should be light or dark based on background
function getContrastTextColor(hexColor: string, opacity: number): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Handle shorthand hex
  const fullHex = hex.length === 3 
    ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    : hex;
  
  const r = parseInt(fullHex.substring(0, 2), 16) || 0;
  const g = parseInt(fullHex.substring(2, 4), 16) || 0;
  const b = parseInt(fullHex.substring(4, 6), 16) || 0;
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If opacity is high enough and background is dark, use white text
  // If opacity is low, use the event color itself for better visibility
  if (opacity >= 60) {
    return luminance > 0.5 ? '#000000' : '#ffffff';
  } else {
    // For lower opacity, use a darker version of the event color or the color itself
    return hexColor;
  }
}

interface CustomCalendarProps {
  events: CalendarEvent[];
  config: CalendarConfig;
  calendarName?: string;
  loading?: boolean;
  error?: string | null;
}

// Helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Get event start date as Date object
function getEventStartDate(event: CalendarEvent): Date {
  if (event.start.dateTime) {
    return new Date(event.start.dateTime);
  } else if (event.start.date) {
    return new Date(event.start.date + 'T00:00:00');
  }
  return new Date();
}

// Get event end date as Date object
function getEventEndDate(event: CalendarEvent): Date {
  if (event.end?.dateTime) {
    return new Date(event.end.dateTime);
  } else if (event.end?.date) {
    // For all-day events, end date is exclusive
    const endDate = new Date(event.end.date + 'T00:00:00');
    endDate.setDate(endDate.getDate() - 1);
    return endDate;
  }
  return getEventStartDate(event);
}

// Check if event spans this day
function eventSpansDay(event: CalendarEvent, targetDate: Date): boolean {
  const eventStart = getEventStartDate(event);
  const eventEnd = getEventEndDate(event);
  
  const targetStart = new Date(targetDate);
  targetStart.setHours(0, 0, 0, 0);
  
  const targetEnd = new Date(targetDate);
  targetEnd.setHours(23, 59, 59, 999);
  
  const eventStartDay = new Date(eventStart);
  eventStartDay.setHours(0, 0, 0, 0);
  
  const eventEndDay = new Date(eventEnd);
  eventEndDay.setHours(23, 59, 59, 999);
  
  return targetStart <= eventEndDay && targetEnd >= eventStartDay;
}

// Check if event starts on this day
function eventStartsOnDay(event: CalendarEvent, targetDate: Date): boolean {
  const eventStart = getEventStartDate(event);
  return isSameDay(eventStart, targetDate);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  }
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export default function CustomCalendar({ events, config, calendarName, loading, error }: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [direction, setDirection] = useState(0);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar weeks with spanning event info
  const calendarWeeks = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const weeks: Array<Array<{ day: number | null; date: Date | null }>> = [];
    
    let currentWeek: Array<{ day: number | null; date: Date | null }> = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ day: null, date: null });
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push({ 
        day, 
        date: new Date(currentYear, currentMonth, day) 
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill remaining days in the last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({ day: null, date: null });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [currentMonth, currentYear]);

  // Get spanning events for a specific week
  const getWeekEvents = (weekStartDate: Date, weekEndDate: Date) => {
    return events
      .filter(event => {
        const eventStart = getEventStartDate(event);
        const eventEnd = getEventEndDate(event);
        return eventStart <= weekEndDate && eventEnd >= weekStartDate;
      })
      .sort((a, b) => {
        // Sort by start date, then by duration (longer events first)
        const aStart = getEventStartDate(a);
        const bStart = getEventStartDate(b);
        if (aStart.getTime() !== bStart.getTime()) {
          return aStart.getTime() - bStart.getTime();
        }
        const aDuration = getEventEndDate(a).getTime() - aStart.getTime();
        const bDuration = getEventEndDate(b).getTime() - bStart.getTime();
        return bDuration - aDuration;
      });
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToPreviousWeek = () => {
    setDirection(-1);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    setDirection(1);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setDirection(0);
    setCurrentDate(new Date());
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  // Styles based on config with dark theme defaults
  const isDark = config.theme === 'dark' || 
    (config.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const bgColor = config.backgroundColor || (isDark ? '#0a0a0a' : '#ffffff');
  const textColor = config.textColor || (isDark ? '#ededed' : '#1a1a1a');
  const borderColor = config.borderColor || (isDark ? '#27272a' : '#e4e4e7');
  const accentColor = config.accentColor || '#3b82f6';

  const containerStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    color: textColor,
    fontFamily: config.fontFamily,
    borderRadius: `${config.borderRadius}px`,
    border: `${config.borderWidth}px solid ${borderColor}`,
    boxShadow: config.shadowSize === 'none' ? 'none' :
      config.shadowSize === 'sm' ? '0 1px 2px rgba(0,0,0,0.3)' :
      config.shadowSize === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.4)' :
      config.shadowSize === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.5)' :
      '0 25px 50px -12px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <motion.div 
        style={containerStyle} 
        className="min-h-[400px] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            style={{ color: textColor, opacity: 0.7 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.2 }}
          >
            Loading calendar...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        style={containerStyle} 
        className="min-h-[400px] flex items-center justify-center p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          >
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </motion.div>
          <motion.p 
            className="text-red-400 font-medium mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Failed to load calendar
          </motion.p>
          <motion.p 
            className="text-sm opacity-70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {error}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // Render Month View with spanning events
  if (config.viewMode === 'month') {
    return (
      <motion.div 
        style={containerStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        {config.showTitle && (
          <motion.div 
            className="px-6 py-4"
            style={{ backgroundColor: accentColor }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h2 className="text-lg font-semibold text-white">{calendarName || 'Calendar'}</h2>
          </motion.div>
        )}
        
        {/* Navigation */}
        {config.showNavigation && (
          <motion.div 
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ color: textColor }}
              whileHover={{ scale: 1.1, backgroundColor: `${accentColor}20` }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            
            <div className="flex items-center gap-3">
              {config.showDate && (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.h3 
                    key={`${currentMonth}-${currentYear}`}
                    className="text-lg font-semibold"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </motion.h3>
                </AnimatePresence>
              )}
              {config.showTodayButton && (
                <motion.button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-all"
                  style={{ 
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                  }}
                  whileHover={{ scale: 1.05, backgroundColor: `${accentColor}30` }}
                  whileTap={{ scale: 0.95 }}
                >
                  Today
                </motion.button>
              )}
            </div>
            
            <motion.button
              onClick={goToNextMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ color: textColor }}
              whileHover={{ scale: 1.1, backgroundColor: `${accentColor}20` }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor }}>
          {DAY_NAMES.map((day, i) => (
            <motion.div 
              key={day} 
              className="py-2 text-center text-xs font-medium uppercase tracking-wider"
              style={{ color: textColor, opacity: 0.5 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              {day}
            </motion.div>
          ))}
        </div>

        {/* Calendar Grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentMonth}-${currentYear}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {calendarWeeks.map((week, weekIndex) => {
              // Get the start and end dates of this week
              const firstDayOfWeek = week.find(d => d.date)?.date || new Date();
              const lastDayOfWeek = [...week].reverse().find(d => d.date)?.date || new Date();
              const weekEvents = getWeekEvents(firstDayOfWeek, lastDayOfWeek);
              
              // Track which rows are occupied for event positioning
              const eventRows: Map<string, number> = new Map();
              
              // Assign rows to spanning events
              const eventPlacements: Array<{
                event: CalendarEvent;
                startCol: number;
                span: number;
                row: number;
              }> = [];
              
              weekEvents.forEach(event => {
                // Find which column this event starts in this week
                let startCol = 0;
                for (let i = 0; i < week.length; i++) {
                  const cell = week[i];
                  if (cell.date && eventSpansDay(event, cell.date)) {
                    if (eventStartsOnDay(event, cell.date) || i === 0 || !week[i-1].date) {
                      startCol = i;
                      break;
                    }
                  }
                }
                
                // Calculate span within this week
                let span = 0;
                for (let i = startCol; i < week.length; i++) {
                  const cell = week[i];
                  if (cell.date && eventSpansDay(event, cell.date)) {
                    span++;
                  } else if (cell.date) {
                    break;
                  }
                }
                
                if (span === 0) return;
                
                // Find an available row
                let row = 0;
                while (true) {
                  let rowAvailable = true;
                  for (let col = startCol; col < startCol + span; col++) {
                    const key = `${row}-${col}`;
                    if (eventRows.has(key)) {
                      rowAvailable = false;
                      break;
                    }
                  }
                  if (rowAvailable) break;
                  row++;
                }
                
                // Mark cells as occupied
                for (let col = startCol; col < startCol + span; col++) {
                  eventRows.set(`${row}-${col}`, 1);
                }
                
                eventPlacements.push({ event, startCol, span, row });
              });

              return (
                <div key={weekIndex} className="relative">
                  {/* Day cells */}
                  <div className="grid grid-cols-7">
                    {week.map((cell, dayIndex) => {
                      const isCurrentDay = cell.day ? isToday(cell.day) : false;
                      
                      return (
                        <motion.div
                          key={dayIndex}
                          className="min-h-[100px] p-1 border-b border-r"
                          style={{ 
                            borderColor,
                            backgroundColor: isCurrentDay ? `${accentColor}10` : 'transparent',
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                        >
                          {cell.day && (
                            <motion.div 
                              className={`w-7 h-7 flex items-center justify-center text-sm rounded-full mb-1 ${
                                isCurrentDay ? 'text-white font-bold' : ''
                              }`}
                              style={{ 
                                backgroundColor: isCurrentDay ? accentColor : 'transparent',
                                color: isCurrentDay ? '#ffffff' : textColor,
                              }}
                              whileHover={{ scale: 1.1 }}
                            >
                              {cell.day}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Spanning events overlay */}
                  <div 
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: '32px' }}
                  >
                    {eventPlacements.slice(0, 3).map(({ event, startCol, span, row }, idx) => {
                      const isMultiDay = span > 1;
                      const startsThisWeek = eventStartsOnDay(event, week[startCol].date!);
                      
                      return (
                        <motion.div
                          key={event.id || idx}
                          className="absolute text-xs px-2 py-1 rounded cursor-pointer pointer-events-auto truncate"
                          style={{
                            left: `calc(${(startCol / 7) * 100}% + 2px)`,
                            width: `calc(${(span / 7) * 100}% - 4px)`,
                            top: `${row * 24}px`,
                            backgroundColor: hexToRgba(config.eventColor, config.eventOpacity),
                            color: getContrastTextColor(config.eventColor, config.eventOpacity),
                            borderLeft: `3px solid ${hexToRgba(config.eventBorderColor, config.eventBorderOpacity)}`,
                            borderRadius: isMultiDay 
                              ? `${startsThisWeek ? '4px' : '0'} ${span === 7 - startCol || !week[startCol + span]?.date ? '4px' : '0'} ${span === 7 - startCol || !week[startCol + span]?.date ? '4px' : '0'} ${startsThisWeek ? '4px' : '0'}`
                              : '4px',
                          }}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25,
                            delay: idx * 0.05 
                          }}
                          whileHover={{ 
                            scale: 1.02,
                            zIndex: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          {!startsThisWeek && isMultiDay && '← '}
                          {!event.allDay && !isMultiDay && event.start.dateTime && (
                            <span className="opacity-70">{formatTime(event.start.dateTime)} </span>
                          )}
                          {event.title}
                        </motion.div>
                      );
                    })}
                    {eventPlacements.length > 3 && (
                      <motion.div
                        className="absolute text-xs px-2 py-0.5"
                        style={{
                          left: '2px',
                          top: `${3 * 24}px`,
                          color: textColor,
                          opacity: 0.6,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                      >
                        +{eventPlacements.length - 3} more
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Event Details Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <EventModal
              event={selectedEvent}
              accentColor={accentColor}
              textColor={textColor}
              bgColor={bgColor}
              borderColor={borderColor}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Render Week View
  if (config.viewMode === 'week') {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });

    const weekEvents = events.filter(event => {
      const eventStart = getEventStartDate(event);
      const eventEnd = getEventEndDate(event);
      return eventStart <= weekDays[6] && eventEnd >= weekDays[0];
    });

    return (
      <motion.div 
        style={containerStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        {config.showTitle && (
          <motion.div 
            className="px-6 py-4"
            style={{ backgroundColor: accentColor }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-semibold text-white">{calendarName || 'Calendar'}</h2>
          </motion.div>
        )}
        
        {/* Navigation */}
        {config.showNavigation && (
          <motion.div 
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor }}
          >
            <motion.button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg"
              whileHover={{ scale: 1.1, backgroundColor: `${accentColor}20` }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
            
            <div className="flex items-center gap-3">
              {config.showDate && (
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.h3 
                    key={startOfWeek.toISOString()}
                    className="text-lg font-semibold"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {MONTH_NAMES[startOfWeek.getMonth()]} {startOfWeek.getFullYear()}
                  </motion.h3>
                </AnimatePresence>
              )}
              {config.showTodayButton && (
                <motion.button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Today
                </motion.button>
              )}
            </div>
            
            <motion.button
              onClick={goToNextWeek}
              className="p-2 rounded-lg"
              whileHover={{ scale: 1.1, backgroundColor: `${accentColor}20` }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {/* Week Grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div 
            key={startOfWeek.toISOString()}
            className="grid grid-cols-7"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {weekDays.map((day, dayIndex) => {
              const dayEvents = weekEvents.filter(event => eventSpansDay(event, day));
              const isCurrentDay = isSameDay(day, new Date());

              return (
                <motion.div 
                  key={dayIndex} 
                  className="min-h-[350px] border-r"
                  style={{ 
                    borderColor,
                    backgroundColor: isCurrentDay ? `${accentColor}08` : 'transparent',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: dayIndex * 0.05 }}
                >
                  <div 
                    className="text-center py-3 border-b sticky top-0"
                    style={{ borderColor, backgroundColor: bgColor }}
                  >
                    <div className="text-xs uppercase tracking-wider" style={{ color: textColor, opacity: 0.5 }}>
                      {DAY_NAMES[dayIndex]}
                    </div>
                    <motion.div 
                      className={`w-9 h-9 mx-auto mt-1 flex items-center justify-center rounded-full text-lg font-medium ${isCurrentDay ? 'text-white' : ''}`}
                      style={{ backgroundColor: isCurrentDay ? accentColor : 'transparent' }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {day.getDate()}
                    </motion.div>
                  </div>
                  <div className="p-1.5 space-y-1.5">
                    {dayEvents.slice(0, 8).map((event, i) => {
                      const startsToday = eventStartsOnDay(event, day);
                      const isMultiDay = !isSameDay(getEventStartDate(event), getEventEndDate(event));
                      
                      return (
                        <motion.div
                          key={event.id || i}
                          className="text-xs p-2 rounded cursor-pointer"
                          style={{ 
                            backgroundColor: hexToRgba(config.eventColor, config.eventOpacity),
                            color: getContrastTextColor(config.eventColor, config.eventOpacity),
                            borderLeft: `2px solid ${hexToRgba(config.eventBorderColor, config.eventBorderOpacity)}`,
                          }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ scale: 1.02, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="font-medium truncate">
                            {!startsToday && isMultiDay && '← '}
                            {event.title}
                          </div>
                          {!event.allDay && !isMultiDay && event.start.dateTime && (
                            <div className="opacity-70 mt-0.5">{formatTime(event.start.dateTime)}</div>
                          )}
                        </motion.div>
                      );
                    })}
                    {dayEvents.length > 8 && (
                      <div className="text-xs px-2 opacity-60">+{dayEvents.length - 8} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && (
            <EventModal
              event={selectedEvent}
              accentColor={accentColor}
              textColor={textColor}
              bgColor={bgColor}
              borderColor={borderColor}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Render Agenda View
  return (
    <motion.div 
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      {config.showTitle && (
        <motion.div 
          className="px-6 py-4"
          style={{ backgroundColor: accentColor }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-white">{calendarName || 'Calendar'}</h2>
        </motion.div>
      )}
      
      {/* Navigation */}
      {config.showNavigation && (
        <motion.div 
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor }}
        >
          <h3 className="text-lg font-semibold">Upcoming Events</h3>
          {config.showTodayButton && (
            <motion.button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm rounded-lg font-medium"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Today
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Event List */}
      <motion.div 
        className="divide-y"
        style={{ borderColor }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {events.length === 0 ? (
          <motion.div 
            className="py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <svg className="w-16 h-16 mx-auto mb-4" style={{ color: textColor, opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </motion.div>
            <p style={{ color: textColor, opacity: 0.5 }}>No upcoming events</p>
          </motion.div>
        ) : (
          events.slice(0, 20).map((event, index) => {
            const eventStart = getEventStartDate(event);
            const eventEnd = getEventEndDate(event);
            const isMultiDay = !isSameDay(eventStart, eventEnd);
            
            return (
              <motion.div 
                key={event.id || index} 
                className="px-4 py-4 cursor-pointer"
                style={{ borderColor }}
                variants={itemVariants}
                whileHover={{ backgroundColor: `${accentColor}08` }}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-1.5 rounded-full self-stretch min-h-[50px]"
                    style={{ backgroundColor: hexToRgba(config.eventBorderColor, config.eventBorderOpacity) }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.05 }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium" style={{ color: textColor }}>{event.title}</h4>
                      {isMultiDay && (
                        <motion.span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: hexToRgba(config.eventColor, config.eventOpacity), color: getContrastTextColor(config.eventColor, config.eventOpacity) }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          Multi-day
                        </motion.span>
                      )}
                    </div>
                    <div className="text-sm mt-1" style={{ color: textColor, opacity: 0.6 }}>
                      {event.allDay ? (
                        isMultiDay ? (
                          `${formatDate(event.start.date!)} → ${formatDate(eventEnd.toISOString())}`
                        ) : (
                          formatDate(event.start.date!)
                        )
                      ) : (
                        isMultiDay ? (
                          `${formatDate(event.start.dateTime!)} ${formatTime(event.start.dateTime!)} → ${formatDate(event.end?.dateTime || event.start.dateTime!)} ${formatTime(event.end?.dateTime || event.start.dateTime!)}`
                        ) : (
                          `${formatDate(event.start.dateTime!)} at ${formatTime(event.start.dateTime!)}${event.end?.dateTime ? ` - ${formatTime(event.end.dateTime)}` : ''}`
                        )
                      )}
                    </div>
                    {event.location && (
                      <div className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: textColor, opacity: 0.5 }}>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: textColor, opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <AnimatePresence>
        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            accentColor={accentColor}
            textColor={textColor}
            bgColor={bgColor}
            borderColor={borderColor}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Event Modal Component
function EventModal({ 
  event,
  accentColor,
  textColor,
  bgColor,
  borderColor,
  onClose 
}: { 
  event: CalendarEvent;
  accentColor: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  onClose: () => void;
}) {
  const eventStart = getEventStartDate(event);
  const eventEnd = getEventEndDate(event);
  const isMultiDay = !isSameDay(eventStart, eventEnd);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div 
        className="relative w-full max-w-md max-h-[80vh] overflow-auto rounded-xl"
        style={{ 
          backgroundColor: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
        }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="px-5 py-4 flex items-center justify-between sticky top-0"
          style={{ backgroundColor: accentColor }}
        >
          <h3 className="font-semibold text-white truncate pr-4">{event.title}</h3>
          <motion.button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-white/20 text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
        <div className="p-5 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">
                {event.allDay ? (
                  isMultiDay ? (
                    `${formatDate(event.start.date!)} → ${formatDate(eventEnd.toISOString())}`
                  ) : (
                    formatDate(event.start.date!)
                  )
                ) : (
                  formatDate(event.start.dateTime!)
                )}
              </p>
              {!event.allDay && (
                <p className="text-sm opacity-60">
                  {formatTime(event.start.dateTime!)}
                  {event.end?.dateTime && ` - ${formatTime(event.end.dateTime)}`}
                </p>
              )}
              {isMultiDay && (
                <span 
                  className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  Multi-day event
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
                <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm opacity-60">{event.location}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-3 border-t" style={{ borderColor }}>
              <p className="text-sm whitespace-pre-wrap opacity-80">{event.description}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
