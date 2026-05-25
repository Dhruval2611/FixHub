/**
 * Simple API response caching utility
 * Provides in-memory and localStorage caching for API responses
 */

class ApiCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes default
    this.maxSize = 50; // Maximum number of cached items
  }

  /**
   * Generate a cache key from URL and params
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  /**
   * Check if cached item is still valid
   */
  isValid(cacheItem) {
    return Date.now() - cacheItem.timestamp < this.maxAge;
  }

  /**
   * Get item from cache
   */
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cacheItem = this.cache.get(key);

    if (cacheItem && this.isValid(cacheItem)) {
      return cacheItem.data;
    }

    // Try localStorage as fallback
    try {
      const stored = localStorage.getItem(`api_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.isValid(parsed)) {
          // Restore to memory cache
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          localStorage.removeItem(`api_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Error reading from localStorage cache:', error);
    }

    return null;
  }

  /**
   * Set item in cache
   */
  set(url, params = {}, data) {
    const key = this.generateKey(url, params);
    const cacheItem = {
      data,
      timestamp: Date.now(),
      url,
      params
    };

    // Maintain cache size limit
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, cacheItem);

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Error writing to localStorage cache:', error);
    }
  }

  /**
   * Clear all cached items
   */
  clear() {
    this.cache.clear();
    // Clear localStorage cache items
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error);
    }
  }

  /**
   * Clear expired items from cache
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
        try {
          localStorage.removeItem(`api_cache_${key}`);
        } catch (error) {
          // Ignore localStorage errors
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      memoryCacheSize: this.cache.size,
      maxAge: this.maxAge,
      maxSize: this.maxSize
    };
  }
}

// Create singleton instance
const apiCache = new ApiCache();

// Clear expired items every 5 minutes
setInterval(() => {
  apiCache.clearExpired();
}, 5 * 60 * 1000);

export default apiCache;
