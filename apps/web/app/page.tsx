'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarConfig, defaultConfig, generateEmbedUrl, extractCalendarId, configToQueryString, queryStringToConfig } from './types';

function HomeContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<CalendarConfig>(defaultConfig);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'styling' | 'advanced'>('basic');
  const [previewKey, setPreviewKey] = useState(0);

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

  useEffect(() => {
    if (config.calendarUrl) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const queryString = configToQueryString(config);
      const embedUrl = `${baseUrl}/embed?${queryString}`;
      
      const code = `<iframe 
  src="${embedUrl}"
  style="border: none; width: 100%; height: ${config.height}; min-height: ${config.minHeight};"
  loading="lazy"
  title="Google Calendar"
></iframe>`;
      
      setEmbedCode(code);
    }
  }, [config]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const isValidCalendar = extractCalendarId(config.calendarUrl) !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Simply Calendar Embeds</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Beautiful Google Calendar widgets</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/presets"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Presets
              </Link>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                No Account Required
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Transform Your Google Calendar Embed
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Paste your Google Calendar embed URL and customize it with beautiful styling. 
            Perfect for Squarespace, WordPress, and any website. Auto-resizes to fit any container.
          </p>
        </div>

        {/* Main URL Input */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Google Calendar Embed URL or Calendar ID
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={config.calendarUrl}
                onChange={(e) => updateConfig({ calendarUrl: e.target.value })}
                placeholder="Paste your Google Calendar embed URL or calendar ID here..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={refreshPreview}
                disabled={!isValidCalendar}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate
              </button>
            </div>
            {config.calendarUrl && !isValidCalendar && (
              <p className="mt-2 text-sm text-red-500">
                Please enter a valid Google Calendar embed URL or calendar ID
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Find your embed URL in Google Calendar → Settings → Calendar settings → Integrate calendar → Embed code
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {(['basic', 'styling', 'advanced'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
              {/* Basic Tab */}
              {activeTab === 'basic' && (
                <>
                  {/* View Mode */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Display Options */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Display Options
                    </label>
                    <div className="space-y-3">
                      {[
                        { key: 'showTitle', label: 'Show Title' },
                        { key: 'showNavigation', label: 'Show Navigation' },
                        { key: 'showDate', label: 'Show Date' },
                        { key: 'showTabs', label: 'Show View Tabs' },
                        { key: 'showCalendars', label: 'Show Calendar List' },
                        { key: 'showPrint', label: 'Show Print Button' },
                        { key: 'showTimezone', label: 'Show Timezone' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config[key as keyof CalendarConfig] as boolean}
                            onChange={(e) => updateConfig({ [key]: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'auto'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => updateConfig({ theme })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            config.theme === theme
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Styling Tab */}
              {activeTab === 'styling' && (
                <>
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Accent Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.accentColor}
                          onChange={(e) => updateConfig({ accentColor: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                        <input
                          type="text"
                          value={config.accentColor}
                          onChange={(e) => updateConfig({ accentColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Background
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                        <input
                          type="text"
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Text Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.textColor}
                          onChange={(e) => updateConfig({ textColor: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                        <input
                          type="text"
                          value={config.textColor}
                          onChange={(e) => updateConfig({ textColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Border Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={config.borderColor}
                          onChange={(e) => updateConfig({ borderColor: e.target.value })}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                        />
                        <input
                          type="text"
                          value={config.borderColor}
                          onChange={(e) => updateConfig({ borderColor: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Border Radius: {config.borderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={config.borderRadius}
                      onChange={(e) => updateConfig({ borderRadius: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Border Width */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Border Width: {config.borderWidth}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={config.borderWidth}
                      onChange={(e) => updateConfig({ borderWidth: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Shadow */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {size.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Font Family
                    </label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Width
                      </label>
                      <input
                        type="text"
                        value={config.width}
                        onChange={(e) => updateConfig({ width: e.target.value })}
                        placeholder="100%"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Height
                      </label>
                      <input
                        type="text"
                        value={config.height}
                        onChange={(e) => updateConfig({ height: e.target.value })}
                        placeholder="600px"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Min Height
                      </label>
                      <input
                        type="text"
                        value={config.minHeight}
                        onChange={(e) => updateConfig({ minHeight: e.target.value })}
                        placeholder="400px"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Max Height
                      </label>
                      <input
                        type="text"
                        value={config.maxHeight}
                        onChange={(e) => updateConfig({ maxHeight: e.target.value })}
                        placeholder="800px"
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                      />
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Aspect Ratio (when responsive)
                    </label>
                    <select
                      value={config.aspectRatio}
                      onChange={(e) => updateConfig({ aspectRatio: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    >
                      <option value="16/9">16:9 (Widescreen)</option>
                      <option value="4/3">4:3 (Standard)</option>
                      <option value="1/1">1:1 (Square)</option>
                      <option value="3/4">3:4 (Portrait)</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  {/* Squarespace Mode */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={config.squarespaceMode}
                        onChange={(e) => updateConfig({ squarespaceMode: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Squarespace Mode
                      </span>
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Enables auto-resizing and special optimizations for Squarespace containers
                    </p>
                    {config.squarespaceMode && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Container Padding: {config.containerPadding}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={config.containerPadding}
                          onChange={(e) => updateConfig({ containerPadding: Number(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">Live Preview</h3>
                <button
                  onClick={refreshPreview}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="p-6 bg-slate-100 dark:bg-slate-900">
                {isValidCalendar ? (
                  <div
                    className="transition-all duration-300"
                    style={{
                      borderRadius: `${config.borderRadius}px`,
                      border: `${config.borderWidth}px solid ${config.borderColor}`,
                      boxShadow: config.shadowSize === 'none' ? 'none' :
                        config.shadowSize === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' :
                        config.shadowSize === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' :
                        config.shadowSize === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' :
                        '0 25px 50px -12px rgba(0,0,0,0.25)',
                      overflow: 'hidden',
                      backgroundColor: config.backgroundColor,
                    }}
                  >
                    <div style={{
                      filter: config.theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none',
                      transition: 'filter 0.3s ease',
                    }}>
                      <iframe
                        key={`${previewKey}-${generateEmbedUrl(config)}`}
                        src={generateEmbedUrl(config)}
                        style={{
                          width: '100%',
                          height: '400px',
                          border: 'none',
                          display: 'block',
                        }}
                        loading="lazy"
                        title="Calendar Preview"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Embed Code</h3>
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-2xl">1</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Get Your Calendar URL</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Go to Google Calendar → Settings → Calendar settings → Integrate calendar → Copy the embed code or calendar ID
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-2xl">2</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Customize Your Embed</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Use our customization options to style your calendar exactly how you want it. Change colors, fonts, borders and more.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-2xl">3</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Copy & Paste</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Copy the generated embed code and paste it into your Squarespace, WordPress, or any website using HTML blocks.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Simply Calendar Embeds - No account required. Your calendar URL is never stored.</p>
            <p className="mt-2">Works with any public Google Calendar</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
