import type { SurfyThemeOptions } from '@surfy/surfy-sdk';

/** Host theme payload for `layout.setTheme` — same shape as SDK `SurfyThemeOptions`. */
export type DemoThemeOptions = SurfyThemeOptions;

export type DemoThemeId = 'classic' | 'ocean' | 'midnight' | 'fire';

export type DemoThemeDefinition = {
  readonly id: DemoThemeId;
  readonly label: string;
  /** Accent used by the icon swatch */
  readonly accent: string;
  /**
   * Theme pushed to the layout element via `setTheme`.
   * `null` = leave SDK default (classic light blue).
   */
  readonly theme: DemoThemeOptions | null;
};

/** Demo-owned presets — not part of the SDK. */
export const DEMO_THEMES: readonly DemoThemeDefinition[] = [
  {
    id: 'classic',
    label: 'Classic',
    accent: '#1976d2',
    theme: null,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    accent: '#0277bd',
    theme: {
      mode: 'light',
      primary: { main: '#0277bd' },
      background: { default: '#e1f5fe', paper: '#ffffff' },
      tooltip: { backgroundColor: '#01579b', color: '#e1f5fe', fontSize: 13 },
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    accent: '#90caf9',
    theme: {
      mode: 'dark',
      primary: { main: '#90caf9' },
      tooltip: { backgroundColor: '#1a237e', color: '#e8eaf6', fontSize: 13 },
    },
  },
  {
    id: 'fire',
    label: 'Fire',
    accent: '#e64a19',
    theme: {
      mode: 'light',
      primary: { main: '#e64a19' },
      background: { default: '#fff3e0', paper: '#ffcc80' },
      tooltip: { backgroundColor: '#bf360c', color: '#fff8e1', fontSize: 15 },
    },
  },
] as const;

export const DEFAULT_DEMO_THEME: DemoThemeId = 'classic';

const demoThemeById = new Map(DEMO_THEMES.map((theme) => [theme.id, theme]));

export function isDemoThemeId(value: string | null | undefined): value is DemoThemeId {
  return Boolean(value && demoThemeById.has(value as DemoThemeId));
}

export function getDemoThemeOptions(id: DemoThemeId): DemoThemeOptions | null {
  return demoThemeById.get(id)?.theme ?? null;
}
