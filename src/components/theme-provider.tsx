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

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (mode === 'system') {
        const newResolved = updateResolvedMode(mode);
        applyTheme(colorTheme, newResolved);
      }
    };

    // Listen for user theme changes
    const handleUserThemeChange = (event: CustomEvent) => {
      const { colorTheme: newColorTheme, mode: newMode } = event.detail;
      setColorThemeState(newColorTheme);
      setModeState(newMode);
      const resolved = updateResolvedMode(newMode);
      applyTheme(newColorTheme, resolved);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    window.addEventListener('userThemeChanged', handleUserThemeChange as EventListener);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      window.removeEventListener('userThemeChanged', handleUserThemeChange as EventListener);
    };
  }, []);

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
