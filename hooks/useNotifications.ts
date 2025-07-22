/**
 * Notifications Hook
 * 
 * Provides notification functionality for displaying toast messages
 */
'use client';

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    category?: string;
    priority?: string;
  };
}

export function useNotifications() {
  const showSuccess = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    toast.success(message || title, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
    });
  }, []);

  const showError = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    toast.error(message || title, {
      duration: options?.duration || 6000,
      position: options?.position || 'bottom-right',
    });
  }, []);

  const showWarning = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    toast(message || title, {
      duration: options?.duration || 5000,
      position: options?.position || 'bottom-right',
      icon: '⚠️',
    });
  }, []);

  const showInfo = useCallback((title: string, message?: string, options?: NotificationOptions) => {
    toast(message || title, {
      duration: options?.duration || 4000,
      position: options?.position || 'bottom-right',
      icon: 'ℹ️',
    });
  }, []);

  const showLoading = useCallback((message: string) => {
    return toast.loading(message, {
      position: 'bottom-right',
    });
  }, []);

  const dismissNotification = useCallback((toastId: string) => {
    toast.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissNotification,
    dismissAll,
  };
}