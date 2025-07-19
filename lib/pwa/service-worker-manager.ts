/**
 * Service Worker Manager
 * 
 * Manages service worker registration, updates, and status tracking
 * for Progressive Web App functionality.
 */

export interface ServiceWorkerStatus {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOnline: boolean;
  canInstall: boolean;
  installationPrompt?: BeforeInstallPromptEvent;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private status: ServiceWorkerStatus = {
    isInstalled: false,
    isUpdateAvailable: false,
    isOnline: navigator.onLine,
    canInstall: false,
  };
  private listeners: ((status: ServiceWorkerStatus) => void)[] = [];
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
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        this.updateStatus({ isInstalled: true });

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateStatus({ isUpdateAvailable: true });
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
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
        this.updateStatus({ isInstalled: false, isUpdateAvailable: false });
      }
      return result;
    } catch (error) {
      console.error('Service worker unregistration failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
export default serviceWorkerManager;