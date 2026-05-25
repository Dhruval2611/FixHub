import axios from 'axios';
import apiCache from './apiCache';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Cached GET request
 * @param {string} url - API endpoint
 * @param {object} params - Query parameters
 * @param {object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {boolean} options.forceRefresh - Force refresh cache (default: false)
 * @returns {Promise} API response
 */
export const cachedGet = async (url, params = {}, options = {}) => {
  const { useCache = true, forceRefresh = false } = options;

  // Check cache first (unless force refresh)
  if (useCache && !forceRefresh) {
    const cachedData = apiCache.get(url, params);
    if (cachedData) {
      return { data: cachedData, cached: true };
    }
  }

  try {
    const response = await api.get(url, { params });

    // Cache the response
    if (useCache) {
      apiCache.set(url, params, response.data);
    }

    return { data: response.data, cached: false };
  } catch (error) {
    // If request fails and we have cached data, return it as fallback
    if (useCache && !forceRefresh) {
      const cachedData = apiCache.get(url, params);
      if (cachedData) {
        console.warn('API request failed, returning cached data:', error.message);
        return { data: cachedData, cached: true, fallback: true };
      }
    }
    throw error;
  }
};

/**
 * Cached POST request (typically not cached, but included for consistency)
 */
export const cachedPost = async (url, data, options = {}) => {
  try {
    const response = await api.post(url, data, options);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Cached PUT request
 */
export const cachedPut = async (url, data, options = {}) => {
  try {
    const response = await api.put(url, data, options);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Cached DELETE request
 */
export const cachedDelete = async (url, options = {}) => {
  try {
    const response = await api.delete(url, options);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Clear API cache
 */
export const clearApiCache = () => {
  apiCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return apiCache.getStats();
};

// Export the axios instance for direct use when caching is not needed
export default api;
