'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme } from '@/lib/themes';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorTheme: string;
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setColorTheme: (colorTheme: string) => void;
  setMode: (mode: ThemeMode) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<string>('blue');
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  const updateResolvedMode = (currentMode: ThemeMode) => {
    let resolved: 'light' | 'dark';
    
    if (currentMode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = currentMode;
    }
    
    setResolvedMode(resolved);
    
    // Apply theme classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    
    return resolved;
  };

  useEffect(() => {
    // Get theme settings from localStorage
    const storedColorTheme = localStorage.getItem('colorTheme') || 'blue';
    const storedMode = localStorage.getItem('themeMode') as ThemeMode || 'system';
    
    setColorThemeState(storedColorTheme);
    setModeState(storedMode);
    
    const resolved = updateResolvedMode(storedMode);

    // Apply the theme immediately
    applyTheme(storedColorTheme, resolved);

    setIsLoaded(true);

    // Listen for system theme changes and apply only when mode === 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentMode = (localStorage.getItem('themeMode') as ThemeMode) || mode || 'system';
      if (currentMode === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedMode(newResolved);
        // keep classes in sync
        document.documentElement.classList.toggle('dark', newResolved === 'dark');
        document.documentElement.classList.toggle('light', newResolved === 'light');
        applyTheme(storedColorTheme, newResolved);
      }
    };

    // Listen for user theme changes via a custom event (other parts of app may dispatch this)
    const handleUserThemeChange = (event: Event) => {
      try {
        // event may be CustomEvent with detail
        const ce = event as CustomEvent | Event;
        const detail = (ce as any).detail || {};
        const newColorTheme = detail.colorTheme || localStorage.getItem('colorTheme') || colorTheme;
        const newMode = (detail.mode as ThemeMode) || (localStorage.getItem('themeMode') as ThemeMode) || mode;

        setColorThemeState(newColorTheme);
        setModeState(newMode);

        const resolvedNew = updateResolvedMode(newMode);
        applyTheme(newColorTheme, resolvedNew);
      } catch (e) {
        console.warn('userThemeChanged handler error', e);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('userThemeChanged', handleUserThemeChange as EventListener);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('userThemeChanged', handleUserThemeChange as EventListener);
    };
  }, []);

  // Keep theme in sync when colorTheme or explicit mode changes
  useEffect(() => {
    const resolved = updateResolvedMode(mode);
    applyTheme(colorTheme, resolved);
  }, [colorTheme, mode]);

  const setColorTheme = (newColorTheme: string) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem('colorTheme', newColorTheme);
    applyTheme(newColorTheme, resolvedMode);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('themeMode', newMode);
    const resolved = updateResolvedMode(newMode);
    applyTheme(colorTheme, resolved);
  };

  return (
    <ThemeContext.Provider value={{ 
      colorTheme, 
      mode, 
      resolvedMode,
      setColorTheme, 
      setMode, 
      isLoaded 
    }}>
      {children}
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
