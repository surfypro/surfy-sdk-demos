import { useContext } from 'react';

import { DemoThemeContext, type DemoThemeContextValue } from './demoThemeContextValue';

export function useDemoTheme(): DemoThemeContextValue {
  const ctx = useContext(DemoThemeContext);
  if (!ctx) {
    throw new Error('useDemoTheme must be used within DemoThemeProvider');
  }
  return ctx;
}
