'use client';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');

  // Load theme preference from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fresh_theme_preference') as Theme;
      if (saved && (saved === 'light' || saved === 'dark')) {
        setTheme(saved);
      } else {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(systemPrefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;

      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.setProperty('--theme-bg', '#1f2937');
        root.style.setProperty('--theme-bg-secondary', '#374151');
        root.style.setProperty('--theme-text', '#f9fafb');
        root.style.setProperty('--theme-text-muted', '#d1d5db');
        root.style.setProperty('--theme-border', '#4b5563');
      } else {
        root.classList.remove('dark');
        root.style.setProperty('--theme-bg', '#ffffff');
        root.style.setProperty('--theme-bg-secondary', '#f9fafb');
        root.style.setProperty('--theme-text', '#111827');
        root.style.setProperty('--theme-text-muted', '#6b7280');
        root.style.setProperty('--theme-border', '#e5e7eb');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fresh_theme_preference', newTheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper hook to get theme-aware colors
export function useThemeColors() {
  const { isDark } = useTheme();

  return {
    bg: isDark ? '#1f2937' : '#ffffff',
    bgSecondary: isDark ? '#374151' : '#f9fafb',
    text: isDark ? '#f9fafb' : '#111827',
    textMuted: isDark ? '#d1d5db' : '#6b7280',
    border: isDark ? '#4b5563' : '#e5e7eb',
    primary: '#2563eb', // Keep consistent
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    error: isDark ? '#ef4444' : '#dc2626',
  };
}
