'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import en from './locales/en.json';

type TranslationKeys = typeof en;

interface I18nContextType {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const translations: Record<string, any> = { en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode; initialLocale?: string }> = ({ 
  children, 
  initialLocale = 'en' 
}) => {
  const [locale, setLocale] = useState(initialLocale);

  const t = (path: string): string => {
    const keys = path.split('.');
    let result = translations[locale];
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path; // Fallback to key name
      }
    }
    
    return typeof result === 'string' ? result : path;
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a fallback t function if used outside provider
    return {
      t: (key: string) => key,
      locale: 'en',
      setLocale: () => {},
    };
  }
  return context;
};
