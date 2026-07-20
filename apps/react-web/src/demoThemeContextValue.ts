import { createContext } from 'react';

import type { DemoThemeDefinition, DemoThemeId } from './demoThemes';

export type DemoThemeContextValue = {
  readonly themeId: DemoThemeId;
  readonly themes: readonly DemoThemeDefinition[];
  readonly setThemeId: (id: DemoThemeId) => void;
};

export const DemoThemeContext = createContext<DemoThemeContextValue | null>(null);
