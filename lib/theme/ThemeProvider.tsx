'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
type Theme = 'light' | 'dark' | 'system'
interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isSystemDark: boolean
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'solidity-platform-theme',
}: ThemeProviderProps): void {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [isSystemDark, setIsSystemDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  // Get actual theme (resolving 'system' to 'light' or 'dark')
  const actualTheme =
    theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme
  useEffect(() => {
    setMounted(true)
    // Load theme from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsSystemDark(mediaQuery.matches)
    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [storageKey])
  useEffect(() => {
    if (!mounted) return
    const root = window.document.documentElement
    // Remove previous theme classes
    root.classList.remove('light', 'dark')
    // Add current theme class
    root.classList.add(actualTheme)
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        actualTheme === 'dark' ? '#0f172a' : '#ffffff',
      )
    }
  }, [actualTheme, mounted])
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }
  const toggleTheme = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }
  // Prevent hydration mismatch by rendering children immediately
  // but only apply theme-related side effects after mounting
  return (
    <ThemeContext.Provider
      value={{ theme, actualTheme, setTheme, toggleTheme, isSystemDark }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
export function useTheme(): void {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
