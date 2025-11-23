import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Space {
  id: string;
  slug: string;
  name: string;
  description?: string;
  ticker?: string;
  taskCount: number;
  memberCount: number;
  customFields?: any[];
  members?: any[];
  settings?: {
    allowCustomFields: boolean;
    allowIntegrations: boolean;
    aiAutomationsEnabled: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface SpaceListItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  ticker?: string;
  taskCount: number;
  memberCount: number;
}

async function fetchWithCredentials(url: string) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }
  return response.json();
}

// Query keys
export const queryKeys = {
  user: ['user'] as const,
  spaces: ['spaces'] as const,
  space: (slug: string) => ['spaces', slug] as const,
  boards: (slug: string) => ['spaces', slug, 'boards'] as const,
  tasks: (slug: string) => ['spaces', slug, 'tasks'] as const,
  statuses: (slug: string) => ['spaces', slug, 'statuses'] as const,
};

// Optimized React Query configuration with better caching
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime) - keep in cache
  refetchOnWindowFocus: false, // Don't refetch on window focus
  refetchOnMount: false, // Don't refetch on mount if data exists
  refetchOnReconnect: true, // Refetch on reconnect
};

// Hooks
export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => fetchWithCredentials('/api/auth/me'),
    select: (data) => data.success ? data.user : null,
    retry: false,
    ...defaultQueryOptions,
    staleTime: 2 * 60 * 1000, // User data refreshes more frequently
  });
}

export function useSpaces() {
  return useQuery({
    queryKey: queryKeys.spaces,
    queryFn: () => fetchWithCredentials('/api/spaces'),
    select: (data) => data.success ? data.spaces || [] : [],
    ...defaultQueryOptions,
  });
}

export function useSpace(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.space(slug),
    queryFn: () => fetchWithCredentials(`/api/spaces/${slug}`),
    select: (data) => data.success ? data.space : null,
    enabled: enabled && !!slug,
    ...defaultQueryOptions,
  });
}

export function useBoards(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.boards(slug),
    queryFn: () => fetchWithCredentials(`/api/spaces/${slug}/boards`),
    select: (data) => data.success ? (data.boards || []) : [],
    enabled: enabled && !!slug,
    ...defaultQueryOptions,
  });
}

export function useRefreshSpaces() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.spaces });
  };
}

export function useRefreshSpace(slug: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.space(slug) });
    queryClient.invalidateQueries({ queryKey: queryKeys.boards(slug) });
  };
}







