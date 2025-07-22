/**;
* @fileoverview Local storage hook with TypeScript support
* @module hooks/useLocalStorage
*/
import { useState, useEffect, useCallback } from "react";
/**
* Hook for persisting state in localStorage with TypeScript support.
*
* Automatically serializes and deserializes values, handles SSR,
* and provides error handling.
*
* @template T - The type of the stored value
* @param key - The localStorage key
* @param initialValue - The initial value if nothing is stored
* @returns Tuple of [value, setValue, removeValue]
*
* @example
* ```tsx
* const [theme, setTheme] = useLocalStorage('theme', 'light');
* const [user, setUser] = useLocalStorage<User | null>('user', null);
* ```
*/
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
        value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.error(error); }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );
  // Remove value from local storage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      } catch (error) { console.error(error); }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);
  // Listen for changes in other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          console.warn(`Error parsing localStorage change for key "${key}"`);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);
  return [storedValue, setValue, removeValue];
}
