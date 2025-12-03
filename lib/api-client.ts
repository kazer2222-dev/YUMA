/**
 * API Client with automatic token refresh
 * 
 * This utility wraps fetch() to automatically handle token refresh
 * when access tokens expire (401 responses).
 */

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempts to refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Refresh failed - user needs to log in again
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Enhanced fetch wrapper that automatically handles token refresh
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (same as native fetch)
 * @returns Promise<Response>
 * 
 * @example
 * ```ts
 * const response = await apiFetch('/api/spaces', {
 *   method: 'GET',
 *   credentials: 'include'
 * });
 * ```
 */
export async function apiFetch(
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> {
  // Ensure credentials are included for cookie-based auth
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  };

  // Make the initial request
  let response = await fetch(url, fetchOptions);

  // If we get a 401, try to refresh the token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry the original request with the new token
      response = await fetch(url, fetchOptions);
    } else {
      // Refresh failed, return the 401 response
      return response;
    }
  }

  return response;
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(url: string, options: RequestInit = {}): Promise<Response> {
  return apiFetch(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return apiFetch(url, { ...options, method: 'DELETE' });
}

/**
 * Convenience method for PATCH requests
 */
export async function apiPatch(
  url: string,
  body?: any,
  options: RequestInit = {}
): Promise<Response> {
  return apiFetch(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}









