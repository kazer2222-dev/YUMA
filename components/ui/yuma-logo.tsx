import React from 'react';
import { cn } from '@/lib/utils';

interface YUMALogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'mono' | 'stacked';
}

export function YUMALogo({ className, showText = true, size = 'md', variant = 'default' }: YUMALogoProps) {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', text: 'text-sm', spacing: 'space-x-2' },
    md: { icon: 'w-8 h-8', text: 'text-base', spacing: 'space-x-2.5' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', spacing: 'space-x-3' },
  };

  const { icon, text, spacing } = sizeClasses[size];
  const isLight = variant === 'light';
  const isMono = variant === 'mono';
  const isStacked = variant === 'stacked';

  return (
    <div className={cn(
      isStacked ? 'flex-col items-center' : 'flex items-center',
      isStacked ? 'space-y-2' : spacing,
      className
    )}>
      {/* Icon from SVG - only icon, no letters */}
      <div className={cn(icon, 'flex-shrink-0 relative')}>
        <img 
          src="/yuma-logo-icon.svg" 
          alt="YUMA Icon" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Wordmark text - only show when showText is true */}
      {showText && (
        <span className={cn(
          'font-bold tracking-tight',
          text,
          isLight && 'text-white',
          isMono && 'font-mono',
          !isLight && !isMono && 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent'
        )}>
          YUMA
        </span>
      )}
    </div>
  );
}
