'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { CalendarConfig, defaultConfig, generateEmbedUrl, queryStringToConfig } from '../types';

export default function EmbedContent() {
  const searchParams = useSearchParams();
  
  // Parse config from URL params (memoized to avoid unnecessary recalculations)
  const config = useMemo<CalendarConfig>(() => {
    const parsedConfig = queryStringToConfig(searchParams);
    return { ...defaultConfig, ...parsedConfig };
  }, [searchParams]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: '100%', height: '100%' });

  // Auto-resize functionality for Squarespace and responsive mode
  useEffect(() => {
    if (!config.responsive && !config.squarespaceMode) return;

    const parseAspectRatio = (ratio: string): number => {
      if (ratio === 'auto') return 1;
      const parts = ratio.split('/');
      if (parts.length === 2) {
        const width = parseFloat(parts[0]);
        const height = parseFloat(parts[1]);
        if (!isNaN(width) && !isNaN(height) && height !== 0) {
          return width / height;
        }
      }
      return 1;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth } = entry.contentRect;
        
        if (config.squarespaceMode) {
          // Special Squarespace handling
          const adjustedWidth = containerWidth - (config.containerPadding * 2);
          const aspectRatioValue = parseAspectRatio(config.aspectRatio);
          setDimensions({
            width: `${adjustedWidth}px`,
            height: config.aspectRatio !== 'auto' 
              ? `${adjustedWidth / aspectRatioValue}px`
              : config.height,
          });
        } else if (config.responsive) {
          setDimensions({
            width: '100%',
            height: config.height,
          });
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Send message to parent for iframe resizing
    const sendHeightToParent = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage({ type: 'resize', height }, '*');
      }
    };

    const interval = setInterval(sendHeightToParent, 1000);

    return () => {
      resizeObserver.disconnect();
      clearInterval(interval);
    };
  }, [config]);

  const googleEmbedUrl = generateEmbedUrl(config);

  if (!googleEmbedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <p>No calendar URL provided</p>
      </div>
    );
  }

  const shadowStyles = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  };

  const containerStyle: React.CSSProperties = {
    width: dimensions.width,
    height: dimensions.height,
    minHeight: config.minHeight,
    maxHeight: config.maxHeight,
    backgroundColor: config.backgroundColor,
    borderRadius: `${config.borderRadius}px`,
    border: `${config.borderWidth}px solid ${config.borderColor}`,
    boxShadow: shadowStyles[config.shadowSize],
    overflow: 'hidden',
    fontFamily: config.fontFamily,
    padding: config.squarespaceMode ? `${config.containerPadding}px` : 0,
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  };

  const iframeStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  };

  // Apply theme-based CSS variables
  const themeStyles: React.CSSProperties = config.theme === 'dark' ? {
    filter: 'invert(1) hue-rotate(180deg)',
  } : {};

  return (
    <div 
      ref={containerRef}
      className="embed-container"
      style={{ 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        padding: config.squarespaceMode ? `${config.containerPadding}px` : 0,
      }}
    >
      <div style={containerStyle}>
        <iframe
          src={googleEmbedUrl}
          style={{ ...iframeStyle, ...themeStyles }}
          loading="lazy"
          title="Google Calendar"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Inject custom styles for theme and accent color */}
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: transparent;
        }
        
        .embed-container {
          --accent-color: ${config.accentColor};
          --text-color: ${config.textColor};
          --bg-color: ${config.backgroundColor};
        }

        /* Auto theme detection */
        ${config.theme === 'auto' ? `
          @media (prefers-color-scheme: dark) {
            .embed-container iframe {
              filter: invert(1) hue-rotate(180deg);
            }
          }
        ` : ''}

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
