'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationState {
  scrollPosition?: number;
  filters?: Record<string, any>;
  grouping?: string;
  selectedDate?: string;
  [key: string]: any;
}

interface NavigationHistory {
  route: string;
  state?: NavigationState;
}

interface NavigationContextType {
  push: (route: string, options?: { state?: NavigationState; from?: string }) => void;
  back: (fallbackRoute?: string) => void;
  getFromParam: () => string | null;
  getNavigationState: () => NavigationState | null;
  saveNavigationState: (route: string, state: NavigationState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Store navigation history in sessionStorage for persistence across page refreshes
const STORAGE_KEY = 'yuma_navigation_history';
const STATE_STORAGE_KEY = 'yuma_navigation_states';

function getHistory(): NavigationHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: NavigationHistory[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save navigation history:', e);
  }
}

function getNavigationStates(): Record<string, NavigationState> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STATE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveNavigationStates(states: Record<string, NavigationState>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(states));
  } catch (e) {
    console.warn('Failed to save navigation states:', e);
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Note: useSearchParams must be used in a component wrapped by Suspense
  // For now, we'll read it dynamically when needed
  const [history, setHistory] = useState<NavigationHistory[]>(getHistory());

  const push = useCallback((route: string, options?: { state?: NavigationState; from?: string }) => {
    // Save current location before navigating
    const currentPath = window.location.pathname;
    if (currentPath && currentPath !== route) {
      const newHistory = [...history, { route: currentPath }];
      setHistory(newHistory);
      saveHistory(newHistory);
    }

    // Add from parameter if provided
    let finalRoute = route;
    if (options?.from) {
      const separator = route.includes('?') ? '&' : '?';
      finalRoute = `${route}${separator}from=${encodeURIComponent(options.from)}`;
    }

    // Save navigation state if provided
    if (options?.state) {
      const states = getNavigationStates();
      states[route] = options.state;
      saveNavigationStates(states);
    }

    router.push(finalRoute);
  }, [router, history]);

  const back = useCallback((fallbackRoute?: string) => {
    // Read from parameter from URL
    let from: string | null = null;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      from = params.get('from');
    }
    
    if (from) {
      // Extract spaceSlug from pathname more reliably
      // Pathname format: /spaces/[slug]/tasks/[taskId] or /spaces/[slug]
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const spaceSlugIndex = pathParts.indexOf('spaces');
      let spaceSlug: string | null = null;
      
      if (spaceSlugIndex !== -1 && pathParts[spaceSlugIndex + 1]) {
        spaceSlug = pathParts[spaceSlugIndex + 1];
      }
      
      // Try to extract from fallbackRoute if pathname extraction failed
      if (!spaceSlug && fallbackRoute) {
        const fallbackMatch = fallbackRoute.match(/\/spaces\/([^/?]+)/);
        if (fallbackMatch) {
          spaceSlug = fallbackMatch[1];
        }
      }
      
      // Navigate back based on from parameter
      const routeMap: Record<string, string> = {
        roadmap: spaceSlug ? `/spaces/${spaceSlug}?view=roadmap` : (fallbackRoute || '/'),
        board: spaceSlug ? `/spaces/${spaceSlug}?view=board` : (fallbackRoute || '/'),
        calendar: spaceSlug ? `/spaces/${spaceSlug}?view=calendar` : (fallbackRoute || '/'),
        search: '/', // Return to home/search
        tasks: spaceSlug ? `/spaces/${spaceSlug}?view=tasks` : (fallbackRoute || '/'),
      };

      const targetRoute = routeMap[from] || fallbackRoute;
      
      if (targetRoute) {
        // Restore navigation state if available
        const states = getNavigationStates();
        const savedState = states[targetRoute];
        
        router.push(targetRoute);
        
        // Restore scroll position after navigation if state was saved
        if (savedState?.scrollPosition && typeof window !== 'undefined') {
          setTimeout(() => {
            window.scrollTo(0, savedState.scrollPosition!);
          }, 100);
        }
        
        return;
      }
    }

    // Fallback to browser history or provided route
    if (fallbackRoute) {
      router.push(fallbackRoute);
    } else if (history.length > 0) {
      const previous = history[history.length - 1];
      const states = getNavigationStates();
      const savedState = states[previous.route];
      
      router.push(previous.route);
      
      // Restore scroll position
      if (savedState?.scrollPosition && typeof window !== 'undefined') {
        setTimeout(() => {
          window.scrollTo(0, savedState.scrollPosition!);
        }, 100);
      }
      
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      saveHistory(newHistory);
    } else {
      // Last resort: use browser back
      router.back();
    }
  }, [router, history]);

  const getFromParam = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('from');
  }, []);

  const getNavigationState = useCallback((route?: string): NavigationState | null => {
    const targetRoute = route || window.location.pathname;
    const states = getNavigationStates();
    return states[targetRoute] || null;
  }, []);

  const saveNavigationState = useCallback((route: string, state: NavigationState) => {
    const states = getNavigationStates();
    states[route] = state;
    saveNavigationStates(states);
  }, []);

  return (
    <NavigationContext.Provider value={{ push, back, getFromParam, getNavigationState, saveNavigationState }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    // Fallback implementation if used outside provider
    const router = useRouter();
    
    return {
      push: (route: string, options?: { state?: NavigationState; from?: string }) => {
        let finalRoute = route;
        if (options?.from) {
          const separator = route.includes('?') ? '&' : '?';
          finalRoute = `${route}${separator}from=${encodeURIComponent(options.from)}`;
        }
        router.push(finalRoute);
      },
      back: (fallbackRoute?: string) => {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const from = params.get('from');
          if (from) {
            // Extract spaceSlug from pathname more reliably
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const spaceSlugIndex = pathParts.indexOf('spaces');
          const spaceSlug = spaceSlugIndex !== -1 && pathParts[spaceSlugIndex + 1] 
            ? pathParts[spaceSlugIndex + 1] 
            : null;
          
          if (spaceSlug) {
            const routeMap: Record<string, string> = {
              roadmap: `/spaces/${spaceSlug}?view=roadmap`,
              board: `/spaces/${spaceSlug}?view=board`,
              calendar: `/spaces/${spaceSlug}?view=calendar`,
              search: '/',
              tasks: `/spaces/${spaceSlug}?view=tasks`,
            };
            router.push(routeMap[from] || fallbackRoute || `/spaces/${spaceSlug}`);
          } else {
            router.push(fallbackRoute || '/');
          }
          } else {
            router.back();
          }
        } else {
          router.back();
        }
      },
      getFromParam: () => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        return params.get('from');
      },
      getNavigationState: () => null,
      saveNavigationState: () => {},
    };
  }
  return context;
}

