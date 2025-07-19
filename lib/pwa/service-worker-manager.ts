/**
 * Service Worker Manager
 * 
 * Manages service worker registration, updates, and status tracking
 * for Progressive Web App functionality.
 */

export type ServiceWorkerStatusType = 
  | 'not-supported'
  | 'not-registered'
  | 'registering'
  | 'registered'
  | 'updating'
  | 'updated'
  | 'error';

export interface ServiceWorkerStatus {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOnline: boolean;
  canInstall: boolean;
  installationPrompt?: BeforeInstallPromptEvent;
  status: ServiceWorkerStatusType;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type EventCallback = (...args: any[]) => void;

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private status: ServiceWorkerStatus = {
    isInstalled: false,
    isUpdateAvailable: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    canInstall: false,
    status: 'not-registered'
  };
  private listeners: ((status: ServiceWorkerStatus) => void)[] = [];
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private installPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      this.updateStatus({ canInstall: true, installationPrompt: this.installPrompt });
      this.emit('install-prompt', e);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      this.emit('network-online');
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
      this.emit('network-offline');
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        this.updateStatus({ isInstalled: true, status: 'registered' });
        this.emit('status-change', this.status);

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateStatus({ isUpdateAvailable: true, status: 'updated' });
                this.emit('update-available');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
        this.updateStatus({ status: 'error' });
      }
    }
  }

  private updateStatus(updates: Partial<ServiceWorkerStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public getStatus(): ServiceWorkerStatus {
    return { ...this.status };
  }

  public subscribe(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choiceResult = await this.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.updateStatus({ canInstall: false, installationPrompt: undefined });
        this.emit('app-installed');
        return true;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    }

    return false;
  }

  public async updateServiceWorker(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      
      // If there's a waiting worker, activate it
      if (this.registration.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
    } catch (error) {
      console.error('Service worker update failed:', error);
    }

    return false;
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      if (result) {
        this.updateStatus({ isInstalled: false, isUpdateAvailable: false, status: 'not-registered' });
      }
      return result;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }

  // Event emitter methods
  public on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  // Additional methods expected by PWAStatus component
  public isNetworkOnline(): boolean {
    return this.status.isOnline;
  }

  public isUpdateAvailable(): boolean {
    return this.status.isUpdateAvailable;
  }

  public async getCacheStatus(): Promise<any> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cacheNames = await caches.keys();
      const cacheStatus: any = { caches: {} };
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        cacheStatus.caches[cacheName] = { size: requests.length };
      }
      
      return cacheStatus;
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return null;
    }
  }

  public async applyUpdate(): Promise<void> {
    if (this.registration?.waiting) {
      // Tell waiting service worker to take control
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload once the new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    return this.promptInstall();
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  public async clearCache(): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;