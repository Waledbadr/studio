
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { dictionaries, type Dictionary } from '@/lib/dictionaries';
import { getCustomDictionaries } from '@/lib/custom-translations';

type Locale = 'en' | 'ar';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLanguage: () => void;
  dict: Dictionary;
  refreshTranslations: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize locale from localStorage if available (client-only)
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('locale');
        if (stored === 'ar' || stored === 'en') return stored as Locale;
      }
    } catch {}
    return 'en';
  });

  const [currentDictionaries, setCurrentDictionaries] = useState(() => {
    if (typeof window !== 'undefined') {
      return getCustomDictionaries();
    }
    return dictionaries;
  });

  const refreshTranslations = useCallback(() => {
    if (typeof window !== 'undefined') {
      const customDicts = getCustomDictionaries();
      setCurrentDictionaries(customDicts);
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
      // Set CSS variable for font
      const font = locale === 'ar' ? 'Tajawal' : 'Inter';
      document.documentElement.style.setProperty('--font-body', font);
      document.documentElement.style.setProperty('--font-headline', font);
      localStorage.setItem('locale', locale);
    } catch {}
  }, [locale]);

  // Listen for custom translations updates
  useEffect(() => {
    const handleCustomTranslationsUpdate = () => {
      refreshTranslations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('customTranslationsUpdated', handleCustomTranslationsUpdate);
      return () => {
        window.removeEventListener('customTranslationsUpdated', handleCustomTranslationsUpdate);
      };
    }
  }, [refreshTranslations]);

  // Load custom translations on mount
  useEffect(() => {
    refreshTranslations();
  }, [refreshTranslations]);
  
  const toggleLanguage = useCallback(() => {
      setLocale(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const value = {
    locale,
    setLocale,
    toggleLanguage,
    refreshTranslations,
    // Use custom dictionaries if available, fallback to original
    dict: (currentDictionaries as any)[locale] || dictionaries.en,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // If a consumer accidentally calls useLanguage outside the provider,
    // return a safe fallback to avoid crashing the entire app (helps during
    // hydration/order-of-mount issues). Log a warning in dev so it can be fixed.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('useLanguage was called outside of LanguageProvider — returning fallback dictionary. Wrap your tree with <LanguageProvider> to provide translations.');
    }
    return {
      locale: 'en',
      setLocale: () => {},
      toggleLanguage: () => {},
      refreshTranslations: () => {},
      dict: dictionaries.en as Dictionary,
    } as LanguageContextType;
  }
  return context;
};
