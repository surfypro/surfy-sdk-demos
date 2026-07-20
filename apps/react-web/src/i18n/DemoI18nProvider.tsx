import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  type DemoLocale,
  type DemoMessageKey,
  translate,
} from './demoMessages';

type DemoI18nValue = {
  readonly locale: DemoLocale;
  readonly setLocale: (locale: DemoLocale) => void;
  readonly t: (key: DemoMessageKey, vars?: Record<string, string | number>) => string;
};

const DemoI18nContext = createContext<DemoI18nValue | null>(null);

const STORAGE_KEY = 'surfy-sdk-demo-locale';

function readInitialLocale(): DemoLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    /* ignore */
  }
  return typeof navigator !== 'undefined' && navigator.language.startsWith('fr') ? 'fr' : 'en';
}

export function DemoI18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<DemoLocale>(readInitialLocale);

  const value = useMemo<DemoI18nValue>(() => {
    const setLocale = (next: DemoLocale) => {
      setLocaleState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    };
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    };
  }, [locale]);

  return <DemoI18nContext.Provider value={value}>{children}</DemoI18nContext.Provider>;
}

export function useDemoI18n(): DemoI18nValue {
  const ctx = useContext(DemoI18nContext);
  if (!ctx) {
    throw new Error('useDemoI18n must be used within DemoI18nProvider');
  }
  return ctx;
}
