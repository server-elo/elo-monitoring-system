import { useState, useEffect } from 'react';

export const useOfflineStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  const setStoredValue = (newValue: T): void => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  const clearStoredValue = (): void => {
    try {
      setValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  };

  return {
    value,
    setValue: setStoredValue,
    clearValue: clearStoredValue,
    isLoading,
  };
};