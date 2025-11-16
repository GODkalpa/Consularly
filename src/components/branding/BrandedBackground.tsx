'use client';

/**
 * Branded Background Component
 * 
 * Renders hero sections with organization background images and gradient overlays.
 * Ensures text readability with appropriate overlays.
 */

import { useEffect, useRef, useState } from 'react';

interface BrandedBackgroundProps {
  backgroundImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export function BrandedBackground({
  backgroundImage,
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6',
  children,
  height = '300px',
  className = '',
}: BrandedBackgroundProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backgroundImage) {
      setImageLoaded(true);
      return;
    }

    // Lazy load background image
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      // If image fails to load, just show gradient
      setImageLoaded(true);
    };
    img.src = backgroundImage;
  }, [backgroundImage]);

  // Generate background style
  const getBackgroundStyle = () => {
    const baseStyle: React.CSSProperties = {
      height,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (backgroundImage && imageLoaded) {
      // Background image with gradient overlay for text readability
      return {
        ...baseStyle,
        backgroundImage: `linear-gradient(135deg, ${primaryColor}CC 0%, ${secondaryColor}CC 100%), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
      };
    } else {
      // Gradient only
      return {
        ...baseStyle,
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`branded-background ${className}`}
      style={getBackgroundStyle()}
    >
      {/* Content overlay for better text readability */}
      <div
        className="content-overlay"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {children}
      </div>

      {/* Loading state - show gradient while image loads */}
      {backgroundImage && !imageLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
    </div>
  );
}
