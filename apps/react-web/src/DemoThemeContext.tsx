import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DemoThemeContext } from './demoThemeContextValue';
import {
  DEFAULT_DEMO_THEME,
  DEMO_THEMES,
  type DemoThemeId,
  isDemoThemeId,
} from './demoThemes';

const STORAGE_KEY = 'surfy-demo-theme-preset';

function readStoredThemeId(): DemoThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isDemoThemeId(raw)) {
      return raw;
    }
  } catch {
    // ignore (private mode)
  }
  return DEFAULT_DEMO_THEME;
}

export function DemoThemeProvider({ children }: { readonly children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<DemoThemeId>(readStoredThemeId);

  const setThemeId = useCallback((id: DemoThemeId) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.demoTheme = themeId;
  }, [themeId]);

  const value = useMemo(
    () => ({ themeId, themes: DEMO_THEMES, setThemeId }),
    [themeId, setThemeId],
  );

  return <DemoThemeContext.Provider value={value}>{children}</DemoThemeContext.Provider>;
}
