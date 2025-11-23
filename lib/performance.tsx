import React, { lazy, Suspense, memo } from 'react';

// Lazy load heavy components
export const LazyBoardView = lazy(() => import('@/components/board/board-view').then(mod => ({ default: mod.BoardView })));
export const LazyCalendarView = lazy(() => import('@/components/calendar/calendar-view').then(mod => ({ default: mod.CalendarView })));
export const LazyRoadmapView = lazy(() => import('@/components/roadmap/roadmap-view').then(mod => ({ default: mod.RoadmapView })));
export const LazyAIAssistant = lazy(() => import('@/components/ai/ai-assistant').then(mod => ({ default: mod.AIAssistant })));

// Optimized image component
export const OptimizedImage = memo(({ src, alt, ...props }: any) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});
OptimizedImage.displayName = 'OptimizedImage';

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Memoized component wrapper
export function withMemo<T extends object>(Component: React.ComponentType<T>) {
  return memo(Component);
}

// Virtual scrolling hook (simplified)
export function useVirtualScroll<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}
