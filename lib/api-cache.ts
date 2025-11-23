/**
 * API Request Caching and Deduplication Utility
 * Prevents duplicate API calls and caches responses for better performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get cached data or fetch if not cached/expired
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cacheKey = key;
    const entry = this.cache.get(cacheKey);
    const now = Date.now();
    const cacheTTL = ttl || this.defaultTTL;

    // Check if we have a valid cached entry
    if (entry && (now - entry.timestamp) < cacheTTL) {
      return entry.data;
    }

    // Check if there's already a pending request for this key (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }

    // Create new request
    const promise = fetcher()
      .then((data) => {
        // Cache the result
        this.cache.set(cacheKey, {
          data,
          timestamp: now,
        });

        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);

        return data;
      })
      .catch((error) => {
        // Remove from pending requests on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, promise);

    return promise;
  }

  /**
   * Manually set cache entry
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

/**
 * Hook for cached API requests with deduplication
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const cacheKey = `${options?.method || 'GET'}:${url}`;

  return apiCache.get(
    cacheKey,
    async () => {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    },
    ttl
  );
}

/**
 * Invalidate cache for a specific API endpoint
 */
export function invalidateCache(url: string, method: string = 'GET'): void {
  apiCache.invalidate(`${method}:${url}`);
}

/**
 * Invalidate all cache entries for a space
 */
export function invalidateSpaceCache(spaceSlug: string): void {
  apiCache.invalidatePattern(new RegExp(`.*/spaces/${spaceSlug}/.*`));
}

/**
 * Invalidate all cache entries for a board
 */
export function invalidateBoardCache(boardId: string): void {
  apiCache.invalidatePattern(new RegExp(`.*/boards/${boardId}/.*`));
}





























