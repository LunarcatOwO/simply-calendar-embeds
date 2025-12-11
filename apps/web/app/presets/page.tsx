'use client';

import Link from 'next/link';
import { CalendarConfig, defaultConfig, configToQueryString } from '../types';

interface Preset {
  name: string;
  description: string;
  thumbnail: string;
  config: Partial<CalendarConfig>;
}

const presets: Preset[] = [
  {
    name: 'Clean Minimal',
    description: 'Simple and clean design with subtle shadows',
    thumbnail: '🎯',
    config: {
      theme: 'light',
      borderRadius: 12,
      borderWidth: 0,
      shadowSize: 'md',
      backgroundColor: '#ffffff',
      showTitle: false,
      showPrint: false,
    },
  },
  {
    name: 'Dark Mode',
    description: 'Modern dark theme for dark websites',
    thumbnail: '🌙',
    config: {
      theme: 'dark',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#374151',
      shadowSize: 'lg',
      backgroundColor: '#1f2937',
      textColor: '#f3f4f6',
    },
  },
  {
    name: 'Rounded Card',
    description: 'Friendly rounded corners with soft shadow',
    thumbnail: '📦',
    config: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadowSize: 'xl',
      backgroundColor: '#ffffff',
    },
  },
  {
    name: 'Corporate Blue',
    description: 'Professional look with blue accent',
    thumbnail: '💼',
    config: {
      accentColor: '#1e40af',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#1e40af',
      shadowSize: 'sm',
      backgroundColor: '#f0f9ff',
    },
  },
  {
    name: 'Squarespace Ready',
    description: 'Optimized for Squarespace containers',
    thumbnail: '🔲',
    config: {
      squarespaceMode: true,
      responsive: true,
      borderRadius: 0,
      borderWidth: 0,
      shadowSize: 'none',
      containerPadding: 20,
    },
  },
  {
    name: 'Agenda Focus',
    description: 'Agenda view for upcoming events',
    thumbnail: '📋',
    config: {
      viewMode: 'agenda',
      showTitle: true,
      showNavigation: true,
      showDate: true,
      showTabs: false,
      showCalendars: false,
      borderRadius: 12,
      shadowSize: 'md',
    },
  },
  {
    name: 'Week Planner',
    description: 'Weekly view for detailed planning',
    thumbnail: '📅',
    config: {
      viewMode: 'week',
      showTitle: true,
      showNavigation: true,
      showDate: true,
      showTabs: true,
      height: '700px',
      borderRadius: 8,
    },
  },
  {
    name: 'Glassmorphism',
    description: 'Modern glass effect style',
    thumbnail: '✨',
    config: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      shadowSize: 'xl',
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
  },
];

export default function PresetsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Simply Calendar Embeds</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Design Presets</p>
              </div>
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Editor
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Design Presets
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Start with a pre-designed template and customize it to match your brand.
            Click on any preset to use it as your starting point.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {presets.map((preset) => {
            const presetConfig = { ...defaultConfig, ...preset.config };
            const queryString = configToQueryString(presetConfig);
            
            return (
              <Link
                key={preset.name}
                href={`/?${queryString}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                {/* Preset Preview */}
                <div className="h-40 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                  <div 
                    className="w-32 h-24 flex items-center justify-center"
                    style={{
                      backgroundColor: preset.config.backgroundColor || '#ffffff',
                      borderRadius: `${preset.config.borderRadius || 12}px`,
                      border: `${preset.config.borderWidth || 1}px solid ${preset.config.borderColor || '#e5e7eb'}`,
                      boxShadow: preset.config.shadowSize === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' :
                                preset.config.shadowSize === 'xl' ? '0 25px 50px -12px rgba(0,0,0,0.25)' :
                                preset.config.shadowSize === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' :
                                preset.config.shadowSize === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <span className="text-4xl">{preset.thumbnail}</span>
                  </div>
                </div>
                
                {/* Preset Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                    {preset.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {preset.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            How to Use Presets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Choose a Preset</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click on any preset card to load its settings into the editor.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Add Your Calendar</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Paste your Google Calendar URL in the input field.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Customize & Export</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Fine-tune the settings if needed, then copy the embed code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Simply Calendar Embeds - No account required.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
