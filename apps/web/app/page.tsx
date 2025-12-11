'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarConfig, defaultConfig, extractCalendarId, configToQueryString, queryStringToConfig } from './types';
import CustomCalendar from './components/CustomCalendar';
import { CalendarEvent } from './api/calendar/route';

function HomeContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CalendarConfig>(defaultConfig);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'styling' | 'advanced'>('basic');
  
  // Calendar data state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarName, setCalendarName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateConfig = useCallback((updates: Partial<CalendarConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Load config from URL params (for presets)
  useEffect(() => {
    const parsedConfig = queryStringToConfig(searchParams);
    if (Object.keys(parsedConfig).length > 0) {
      setConfig(prev => ({ ...prev, ...parsedConfig }));
    }
  }, [searchParams]);

  // Fetch calendar data when URL changes
  const fetchCalendarData = useCallback(async (calendarUrl: string) => {
    const calendarId = extractCalendarId(calendarUrl);
    if (!calendarId) {
      setError('Invalid calendar URL or ID');
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
  }, [config.showPastEvents]);

  // Auto-fetch when calendar URL changes
  useEffect(() => {
    if (config.calendarUrl) {
      const timeoutId = setTimeout(() => {
        fetchCalendarData(config.calendarUrl);
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setEvents([]);
      setCalendarName('');
      setError(null);
    }
  }, [config.calendarUrl, config.showPastEvents, fetchCalendarData]);

  // Generate embed code
  useEffect(() => {
    if (config.calendarUrl && extractCalendarId(config.calendarUrl)) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const queryString = configToQueryString(config);
      const embedUrl = `${baseUrl}/embed?${queryString}`;
      
      const code = `<iframe 
  src="${embedUrl}"
  style="border: none; width: ${config.width}; height: ${config.height}; min-height: ${config.minHeight};"
  loading="lazy"
  title="Calendar"
></iframe>`;
      
      setEmbedCode(code);
    }
  }, [config]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidCalendar = extractCalendarId(config.calendarUrl) !== null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0a0a0a]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Simply Calendar Embeds</h1>
                <p className="text-sm text-zinc-400">Beautiful Google Calendar widgets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/presets"
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Presets
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Transform Your Google Calendar
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Paste your public Google Calendar URL and get a fully customizable, beautifully rendered calendar.
            Perfect for Squarespace, WordPress, and any website.
          </p>
        </div>

        {/* Main URL Input */}
        <div className="mb-8">
          <div className="bg-zinc-900 rounded-2xl shadow-lg p-6 border border-zinc-800">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Google Calendar URL or Calendar ID
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={config.calendarUrl}
                onChange={(e) => updateConfig({ calendarUrl: e.target.value })}
                placeholder="Paste your Google Calendar embed URL or calendar ID here..."
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => fetchCalendarData(config.calendarUrl)}
                disabled={!isValidCalendar || loading}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load Calendar'
                )}
              </button>
            </div>
            {config.calendarUrl && !isValidCalendar && (
              <p className="mt-2 text-sm text-red-400">
                Please enter a valid Google Calendar embed URL or calendar ID
              </p>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              Your calendar must be set to public. Find it in Google Calendar → Settings → Make available to public
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800">
              {(['basic', 'styling', 'advanced'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Tab */}
              {activeTab === 'basic' && (
                <>
                  {/* View Mode */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      View Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['month', 'week', 'agenda'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => updateConfig({ viewMode: mode })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            config.viewMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Options */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-3">
                      Display Options
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'showTitle', label: 'Show Calendar Title' },
                        { key: 'showNavigation', label: 'Show Navigation Controls' },
                        { key: 'showDate', label: 'Show Current Date' },
                        { key: 'showTodayButton', label: 'Show Today Button' },
                        { key: 'showPastEvents', label: 'Show Past Events (Last Year)' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config[key as keyof CalendarConfig] as boolean}
                            onChange={(e) => updateConfig({ [key]: e.target.checked })}
                            className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-zinc-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Styling Tab */}
              {activeTab === 'styling' && (
                <>
                  {/* Event Styling Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200">Event Styling</h3>
                      <span className="text-xs text-zinc-500">How events look on the calendar</span>
                    </div>
                    
                    {/* Event Preview */}
                    <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900">
                      <div className="text-xs text-zinc-400 mb-2">Preview</div>
                      <div 
                        className="px-3 py-2 rounded text-sm"
                        style={{
                          backgroundColor: `rgba(${parseInt(config.eventColor.slice(1,3), 16)}, ${parseInt(config.eventColor.slice(3,5), 16)}, ${parseInt(config.eventColor.slice(5,7), 16)}, ${config.eventOpacity / 100})`,
                          color: config.eventOpacity >= 60 ? '#ffffff' : config.eventColor,
                          borderLeft: `3px solid rgba(${parseInt(config.eventBorderColor.slice(1,3), 16)}, ${parseInt(config.eventBorderColor.slice(3,5), 16)}, ${parseInt(config.eventBorderColor.slice(5,7), 16)}, ${config.eventBorderOpacity / 100})`
                        }}
                      >
                        Sample Event
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Event Fill Color
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.eventColor}
                              onChange={(e) => updateConfig({ eventColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.eventColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.eventColor}
                            onChange={(e) => updateConfig({ eventColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            placeholder="#4285f4"
                          />
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-zinc-400 mb-1">
                            Fill Opacity: {config.eventOpacity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.eventOpacity}
                            onChange={(e) => updateConfig({ eventOpacity: Number(e.target.value) })}
                            className="w-full h-2 bg-zinc-700 rounded-lg cursor-pointer slider"
                            style={{ accentColor: '#3b82f6' }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Event Border Color
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.eventBorderColor}
                              onChange={(e) => updateConfig({ eventBorderColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.eventBorderColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.eventBorderColor}
                            onChange={(e) => updateConfig({ eventBorderColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            placeholder="#4285f4"
                          />
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-zinc-400 mb-1">
                            Border Opacity: {config.eventBorderOpacity}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={config.eventBorderOpacity}
                            onChange={(e) => updateConfig({ eventBorderOpacity: Number(e.target.value) })}
                            className="w-full h-2 bg-zinc-700 rounded-lg cursor-pointer slider"
                            style={{ accentColor: '#3b82f6' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Colors Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200">Calendar Colors</h3>
                      <span className="text-xs text-zinc-500">Overall calendar appearance</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Accent Color
                          <span className="block text-xs text-zinc-500 font-normal mt-0.5">Headers, buttons, current day</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.accentColor}
                              onChange={(e) => updateConfig({ accentColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.accentColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.accentColor}
                            onChange={(e) => updateConfig({ accentColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            placeholder="#4285f4"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Background
                          <span className="block text-xs text-zinc-500 font-normal mt-0.5">Calendar background color</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.backgroundColor}
                              onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.backgroundColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Text Color
                          <span className="block text-xs text-zinc-500 font-normal mt-0.5">Calendar text and labels</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.textColor}
                              onChange={(e) => updateConfig({ textColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.textColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.textColor}
                            onChange={(e) => updateConfig({ textColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            placeholder="#333333"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Border Color
                          <span className="block text-xs text-zinc-500 font-normal mt-0.5">Calendar grid borders</span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative">
                            <input
                              type="color"
                              value={config.borderColor}
                              onChange={(e) => updateConfig({ borderColor: e.target.value })}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                              className="w-12 h-10 rounded-lg border-2 border-zinc-600 cursor-pointer hover:border-blue-500 transition-colors"
                              style={{ backgroundColor: config.borderColor }}
                            />
                          </div>
                          <input
                            type="text"
                            value={config.borderColor}
                            onChange={(e) => updateConfig({ borderColor: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm font-mono"
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm"
                            placeholder="#e5e7eb"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Border Radius: {config.borderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={config.borderRadius}
                      onChange={(e) => updateConfig({ borderRadius: Number(e.target.value) })}
                      className="w-full h-2 bg-zinc-700 rounded-lg cursor-pointer slider"
                      style={{
                        accentColor: '#3b82f6',
                      }}
                    />
                  </div>

                  {/* Border Width */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Border Width: {config.borderWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={config.borderWidth}
                      onChange={(e) => updateConfig({ borderWidth: Number(e.target.value) })}
                      className="w-full h-2 bg-zinc-700 rounded-lg cursor-pointer slider"
                      style={{
                        accentColor: '#3b82f6',
                      }}
                    />
                  </div>

                  {/* Shadow */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Shadow Size
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateConfig({ shadowSize: size })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            config.shadowSize === size
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="system-ui, sans-serif">System Default</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Roboto', sans-serif">Roboto</option>
                      <option value="'Open Sans', sans-serif">Open Sans</option>
                      <option value="'Lato', sans-serif">Lato</option>
                      <option value="'Montserrat', sans-serif">Montserrat</option>
                    </select>
                  </div>
                </>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <>
                  {/* Size Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Width
                      </label>
                      <input
                        type="text"
                        value={config.width}
                        onChange={(e) => updateConfig({ width: e.target.value })}
                        placeholder="100%"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Height
                      </label>
                      <input
                        type="text"
                        value={config.height}
                        onChange={(e) => updateConfig({ height: e.target.value })}
                        placeholder="600px"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Min Height
                      </label>
                      <input
                        type="text"
                        value={config.minHeight}
                        onChange={(e) => updateConfig({ minHeight: e.target.value })}
                        placeholder="400px"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Max Height
                      </label>
                      <input
                        type="text"
                        value={config.maxHeight}
                        onChange={(e) => updateConfig({ maxHeight: e.target.value })}
                        placeholder="800px"
                        className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Squarespace Mode */}
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={config.squarespaceMode}
                        onChange={(e) => updateConfig({ squarespaceMode: e.target.checked })}
                        className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-zinc-200">
                        Squarespace Mode
                      </span>
                    </label>
                    <p className="text-sm text-zinc-400">
                      Enables auto-resizing and special optimizations for Squarespace containers
                    </p>
                    {config.squarespaceMode && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Container Padding: {config.containerPadding}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={config.containerPadding}
                          onChange={(e) => updateConfig({ containerPadding: Number(e.target.value) })}
                          className="w-full h-2 bg-zinc-700 rounded-lg cursor-pointer slider"
                          style={{
                            accentColor: '#3b82f6',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Responsive Mode */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.responsive}
                      onChange={(e) => updateConfig({ responsive: e.target.checked })}
                      className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-zinc-300">
                      Enable Responsive Resizing
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-white">Live Preview</h3>
                <button
                  onClick={() => fetchCalendarData(config.calendarUrl)}
                  disabled={!isValidCalendar || loading}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="p-6 bg-zinc-950">
                {isValidCalendar || events.length > 0 ? (
                  <CustomCalendar
                    events={events}
                    config={config}
                    calendarName={calendarName}
                    loading={loading}
                    error={error}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-zinc-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>Enter a Google Calendar URL to see preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Embed Code */}
            {isValidCalendar && (
              <div className="bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Embed Code</h3>
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-xl text-sm overflow-x-auto border border-zinc-800">
                    <code>{embedCode}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl text-blue-400">1</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Make Calendar Public</h3>
            <p className="text-sm text-zinc-400">
              Go to Google Calendar → Settings → Select your calendar → Make available to public
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl text-blue-400">2</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Customize Your Calendar</h3>
            <p className="text-sm text-zinc-400">
              Use our customization options to style your calendar exactly how you want it. Change colors, fonts, and more.
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl text-blue-400">3</span>
            </div>
            <h3 className="font-semibold text-white mb-2">Copy & Paste</h3>
            <p className="text-sm text-zinc-400">
              Copy the generated embed code and paste it into your Squarespace, WordPress, or any website.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-zinc-500">
            <p>Simply Calendar Embeds - Works with any public Google Calendar</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
