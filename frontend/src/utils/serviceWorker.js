// Service Worker Registration and Management
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.updateCallbacks = [];
  }

  // Register the service worker
  async register() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.registration.scope);

        // Handle updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          console.log('Service Worker update found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        });

        // Handle controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed - page will reload');
          window.location.reload();
        });

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleMessage(event.data);
        });

        return this.registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    } else {
      console.warn('Service Workers not supported in this browser');
      return null;
    }
  }

  // Unregister the service worker
  async unregister() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('Service Worker unregistered');
        this.registration = null;
        this.updateAvailable = false;
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
      }
    }
  }

  // Check if update is available
  isUpdateAvailable() {
    return this.updateAvailable;
  }

  // Apply update (skip waiting)
  async applyUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Subscribe to update notifications
  onUpdateAvailable(callback) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify all update callbacks
  notifyUpdateAvailable() {
    this.updateCallbacks.forEach(callback => callback());
  }

  // Handle messages from service worker
  handleMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.payload);
        break;
      case 'OFFLINE_READY':
        console.log('App ready for offline use');
        break;
      default:
        console.log('Service Worker message:', data);
    }
  }

  // Get cache statistics
  async getCacheStats() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const stats = {};

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          stats[cacheName] = keys.length;
        }

        return stats;
      } catch (error) {
        console.error('Error getting cache stats:', error);
        return {};
      }
    }
    return {};
  }

  // Clear all caches
  async clearAllCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      } catch (error) {
        console.error('Error clearing caches:', error);
      }
    }
  }

  // Check online status
  isOnline() {
    return navigator.onLine;
  }

  // Listen for online/offline events
  onOnlineStatusChange(callback) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Create singleton instance
const swManager = new ServiceWorkerManager();

export default swManager;
