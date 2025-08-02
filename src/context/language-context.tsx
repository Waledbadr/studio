
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { dictionaries, type Dictionary } from '@/lib/dictionaries';

type Locale = 'en' | 'ar';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLanguage: () => void;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    // Set CSS variable for font
    const font = locale === 'ar' ? 'Tajawal' : 'Inter';
    document.documentElement.style.setProperty('--font-body', font);
    document.documentElement.style.setProperty('--font-headline', font);
  }, [locale]);
  
  const toggleLanguage = useCallback(() => {
      setLocale(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const value = {
    locale,
    setLocale,
    toggleLanguage,
    dict: dictionaries[locale],
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
