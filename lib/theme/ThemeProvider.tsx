'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'solidity-learn-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isSystemDark, setIsSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get actual theme (resolving 'auto' to 'light' or 'dark')
  const actualTheme = theme === 'auto' ? (isSystemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    setMounted(true);
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSystemDark(mediaQuery.matches);

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(actualTheme);
    
    // Update CSS custom properties for smooth transitions
    if (actualTheme === 'dark') {
      root.style.setProperty('--background', '0 0% 3.9%');
      root.style.setProperty('--foreground', '0 0% 98%');
      root.style.setProperty('--card', '0 0% 3.9%');
      root.style.setProperty('--card-foreground', '0 0% 98%');
      root.style.setProperty('--popover', '0 0% 3.9%');
      root.style.setProperty('--popover-foreground', '0 0% 98%');
      root.style.setProperty('--primary', '0 0% 98%');
      root.style.setProperty('--primary-foreground', '0 0% 9%');
      root.style.setProperty('--secondary', '0 0% 14.9%');
      root.style.setProperty('--secondary-foreground', '0 0% 98%');
      root.style.setProperty('--muted', '0 0% 14.9%');
      root.style.setProperty('--muted-foreground', '0 0% 63.9%');
      root.style.setProperty('--accent', '0 0% 14.9%');
      root.style.setProperty('--accent-foreground', '0 0% 98%');
      root.style.setProperty('--destructive', '0 62.8% 30.6%');
      root.style.setProperty('--destructive-foreground', '0 0% 98%');
      root.style.setProperty('--border', '0 0% 14.9%');
      root.style.setProperty('--input', '0 0% 14.9%');
      root.style.setProperty('--ring', '0 0% 83.1%');
    } else {
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 3.9%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 3.9%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 3.9%');
      root.style.setProperty('--primary', '0 0% 9%');
      root.style.setProperty('--primary-foreground', '0 0% 98%');
      root.style.setProperty('--secondary', '0 0% 96.1%');
      root.style.setProperty('--secondary-foreground', '0 0% 9%');
      root.style.setProperty('--muted', '0 0% 96.1%');
      root.style.setProperty('--muted-foreground', '0 0% 45.1%');
      root.style.setProperty('--accent', '0 0% 96.1%');
      root.style.setProperty('--accent-foreground', '0 0% 9%');
      root.style.setProperty('--destructive', '0 84.2% 60.2%');
      root.style.setProperty('--destructive-foreground', '0 0% 98%');
      root.style.setProperty('--border', '0 0% 89.8%');
      root.style.setProperty('--input', '0 0% 89.8%');
      root.style.setProperty('--ring', '0 0% 3.9%');
    }
  }, [actualTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualTheme,
        setTheme,
        toggleTheme,
        isSystemDark,
      }}
    >
      <div className="transition-colors duration-300 ease-in-out">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme toggle component with smooth animations
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'auto', label: 'System', icon: '💻' },
  ];

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
        aria-label="Toggle theme"
      >
        <motion.span
          key={actualTheme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-lg"
        >
          {actualTheme === 'dark' ? '🌙' : '☀️'}
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 right-0 z-50 min-w-[120px] bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg overflow-hidden"
            >
              {themes.map((themeOption) => (
                <motion.button
                  key={themeOption.value}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                    theme === themeOption.value
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{themeOption.icon}</span>
                  <span className="text-sm font-medium">{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <motion.div
                      layoutId="activeTheme"
                      className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Eye comfort settings component
export function EyeComfortSettings() {
  const { actualTheme } = useTheme();

  // Use actualTheme for theme-aware rendering
  const themeClass = actualTheme === 'dark' ? 'dark' : 'light';
  const [settings, setSettings] = useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    lineHeight: 'normal',
    letterSpacing: 'normal',
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('eye-comfort-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  }, []);

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement;
    
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    root.style.setProperty('--base-font-size', fontSizes[settings.fontSize as keyof typeof fontSizes]);

    // Line height
    const lineHeights = {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    };
    root.style.setProperty('--base-line-height', lineHeights[settings.lineHeight as keyof typeof lineHeights]);

    // Letter spacing
    const letterSpacings = {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
    };
    root.style.setProperty('--base-letter-spacing', letterSpacings[settings.letterSpacing as keyof typeof letterSpacings]);

    // Save to localStorage
    localStorage.setItem('eye-comfort-settings', JSON.stringify(settings));
  }, [settings]);

  return (
    <div className={`space-y-6 p-6 bg-white/5 backdrop-blur-md rounded-lg border border-white/20 ${themeClass}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Eye Comfort Settings</h3>
      
      <div className="space-y-4">
        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Reduce motion</span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => setSettings(prev => ({ ...prev, reducedMotion: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-gray-300">High contrast</span>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => setSettings(prev => ({ ...prev, highContrast: e.target.checked }))}
            className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Font size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => setSettings(prev => ({ ...prev, fontSize: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Line height</label>
          <select
            value={settings.lineHeight}
            onChange={(e) => setSettings(prev => ({ ...prev, lineHeight: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Relaxed</option>
            <option value="loose">Loose</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Letter spacing</label>
          <select
            value={settings.letterSpacing}
            onChange={(e) => setSettings(prev => ({ ...prev, letterSpacing: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="tight">Tight</option>
            <option value="normal">Normal</option>
            <option value="wide">Wide</option>
            <option value="wider">Wider</option>
          </select>
        </div>
      </div>
    </div>
  );
}
