/**
 * React hook for making API calls with automatic token refresh
 * 
 * This hook provides a convenient way to make API calls that automatically
 * handle token refresh when access tokens expire.
 */

import { useCallback } from 'react';
import { apiFetch, apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/api-client';

export function useApiFetch() {
  const fetch = useCallback(apiFetch, []);
  const get = useCallback(apiGet, []);
  const post = useCallback(apiPost, []);
  const put = useCallback(apiPut, []);
  const del = useCallback(apiDelete, []);
  const patch = useCallback(apiPatch, []);

  return {
    fetch,
    get,
    post,
    put,
    delete: del,
    patch,
  };
}










