/**
 * PWA Status Component
 * 
 * Displays PWA installation status, update notifications,
 * and offline capabilities with user interaction controls.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, Wifi, WifiOff, Bell, BellOff, X, Smartphone, Monitor, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { serviceWorkerManager, ServiceWorkerStatus } from '@/lib/pwa/service-worker-manager';
import { cn } from '@/lib/utils';

/**
 * PWA status component
 */
export function PWAStatus() {
  const [status, setStatus] = useState<ServiceWorkerStatus>('not-supported');
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  /**
   * Initialize PWA status monitoring
   */
  useEffect(() => {
    // Check initial status
    setStatus(serviceWorkerManager.getStatus());
    setIsOnline(serviceWorkerManager.isNetworkOnline());
    setUpdateAvailable(serviceWorkerManager.isUpdateAvailable());
    setNotificationsEnabled(Notification.permission === 'granted');

    // Set up event listeners
    const handleStatusChange = (newStatus: ServiceWorkerStatus) => {
      setStatus(newStatus);
    };

    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    const handleNetworkOnline = () => {
      setIsOnline(true);
    };

    const handleNetworkOffline = () => {
      setIsOnline(false);
    };

    const handleInstallPrompt = (event: any) => {
      event.preventDefault();
      (window as any).deferredPrompt = event;
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
    };

    // Register event listeners
    serviceWorkerManager.on('status-change', handleStatusChange);
    serviceWorkerManager.on('update-available', handleUpdateAvailable);
    serviceWorkerManager.on('network-online', handleNetworkOnline);
    serviceWorkerManager.on('network-offline', handleNetworkOffline);
    serviceWorkerManager.on('app-installed', handleAppInstalled);
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Load cache status
    loadCacheStatus();

    return () => {
      serviceWorkerManager.off('status-change', handleStatusChange);
      serviceWorkerManager.off('update-available', handleUpdateAvailable);
      serviceWorkerManager.off('network-online', handleNetworkOnline);
      serviceWorkerManager.off('network-offline', handleNetworkOffline);
      serviceWorkerManager.off('app-installed', handleAppInstalled);
      
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Load cache status
   */
  const loadCacheStatus = async () => {
    const status = await serviceWorkerManager.getCacheStatus();
    setCacheStatus(status);
  };

  /**
   * Handle update installation
   */
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await serviceWorkerManager.applyUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle PWA installation
   */
  const handleInstall = async () => {
    const installed = await serviceWorkerManager.showInstallPrompt();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  /**
   * Handle notification permission
   */
  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      // Can't revoke permission, just inform user
      alert('To disable notifications, please use your browser settings.');
    } else {
      const granted = await serviceWorkerManager.requestNotificationPermission();
      setNotificationsEnabled(granted);
    }
  };

  /**
   * Clear cache
   */
  const handleClearCache = async () => {
    const success = await serviceWorkerManager.clearCache();
    if (success) {
      await loadCacheStatus();
      window.location.reload();
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: ServiceWorkerStatus) => {
    switch (status) {
      case 'registered':
      case 'updated':
        return 'text-green-500';
      case 'updating':
      case 'registering':
        return 'text-yellow-500';
      case 'error':
      case 'not-supported':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * Get status message
   */
  const getStatusMessage = (status: ServiceWorkerStatus) => {
    switch (status) {
      case 'not-supported':
        return 'PWA features not supported';
      case 'not-registered':
        return 'PWA not installed';
      case 'registering':
        return 'Installing PWA features...';
      case 'registered':
        return 'PWA features active';
      case 'updating':
        return 'Updating PWA...';
      case 'updated':
        return 'PWA update available';
      case 'error':
        return 'PWA installation failed';
      default:
        return 'Unknown status';
    }
  };

  /**
   * Format cache size
   */
  const formatCacheSize = (cacheStatus: any) => {
    if (!cacheStatus) return 'Unknown';
    
    const totalItems = Object.values(cacheStatus.caches)
      .reduce((sum: number, cache: any) => sum + cache.size, 0);
    
    return `${totalItems} items cached`;
  };

  if (status === 'not-supported') {
    return null; // Don't show component if PWA not supported
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {/* Update notification */}
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mb-4"
          >
            <Card className="p-4 bg-blue-500 text-white shadow-lg">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">App Update Available</p>
                  <p className="text-sm opacity-90">New features and improvements</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Install prompt */}
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mb-4"
          >
            <Card className="p-4 bg-green-500 text-white shadow-lg">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">Install App</p>
                  <p className="text-sm opacity-90">Get quick access from your home screen</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowInstallPrompt(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleInstall}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA status indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <Card className="p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
          <div 
            className="flex items-center space-x-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            {/* Network status */}
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}

            {/* PWA status */}
            <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
            
            {/* Device indicator */}
            {window.matchMedia('(max-width: 768px)').matches ? (
              <Smartphone className="w-4 h-4 text-gray-500" />
            ) : (
              <Monitor className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </Card>

        {/* Detailed status panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-2 w-80"
            >
              <Card className="p-4 shadow-lg">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">PWA Status</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(status))} />
                        <span className="text-sm font-medium">{getStatusMessage(status)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Network</span>
                      <div className="flex items-center space-x-2">
                        {isOnline ? (
                          <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Notifications</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleNotificationToggle}
                        className="p-1"
                      >
                        {notificationsEnabled ? (
                          <Bell className="w-4 h-4 text-green-500" />
                        ) : (
                          <BellOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cache</span>
                      <span className="text-sm font-medium">
                        {formatCacheSize(cacheStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t">
                    {updateAvailable && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleUpdate}
                        disabled={isUpdating}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {isUpdating ? 'Updating...' : 'Install Update'}
                      </Button>
                    )}

                    {showInstallPrompt && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleInstall}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install App
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleClearCache}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="flex items-start space-x-2 pt-2 border-t">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="text-xs text-gray-600">
                      <p>PWA features provide offline access and app-like experience.</p>
                      {!isOnline && (
                        <p className="text-yellow-600 mt-1">
                          Some features may be limited while offline.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}