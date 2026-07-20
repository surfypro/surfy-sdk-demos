import type { CSSProperties } from 'react';

import type { DemoThemeId } from './demoThemes';
import { useDemoTheme } from './useDemoTheme';

function ThemeIcon({ themeId }: { readonly themeId: DemoThemeId }) {
  if (themeId === 'ocean') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-switcher__icon">
        <path
          fill="currentColor"
          d="M3 16c1.8-1.2 3.6-1.8 5.5-1.8S12.2 14.8 14 16s3.6 1.8 5.5 1.8c.5 0 1-.05 1.5-.15V19H3v-3zm0-4.5c1.8-1.2 3.6-1.8 5.5-1.8s3.7.6 5.5 1.8 3.6 1.8 5.5 1.8c.5 0 1-.05 1.5-.15V14c-1.8 1-3.7 1.5-5.5 1.5-1.9 0-3.7-.6-5.5-1.8S4.8 12.2 3 12.2V11.5zM12 4l1.2 3.2L16.5 8l-2.6 1.9.9 3.3L12 11.5 9.2 13.2l.9-3.3L7.5 8l3.3-.8L12 4z"
        />
      </svg>
    );
  }
  if (themeId === 'midnight') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-switcher__icon">
        <path
          fill="currentColor"
          d="M12.1 2a9.9 9.9 0 0 0-1.2.1A10 10 0 1 0 21.9 13a8 8 0 0 1-9.8-11z"
        />
      </svg>
    );
  }
  if (themeId === 'fire') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-switcher__icon">
        <path
          fill="currentColor"
          d="M12 2s3 3.2 3 6.2c0 1.4-.6 2.6-1.5 3.5.9-.2 1.8-.8 2.4-1.7.4 2.4-.5 4.6-2.2 6.1C15.5 17.5 17 15 17 12c1.8 1.6 3 4 3 6.5C20 21 16.4 23 12 23S4 21 4 18.5C4 14 8 10.5 10 8c0 2 1 3.5 2 4.5C12 9.5 12 5.5 12 2z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-switcher__icon">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        fill="currentColor"
        d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Global theme presets — Classic / Ocean / Midnight / Fire (icons). */
export function DemoThemeSwitcher() {
  const { themeId, themes, setThemeId } = useDemoTheme();

  return (
    <div className="theme-switcher" role="group" aria-label="Thème de l'application">
      {themes.map((theme) => {
        const selected = theme.id === themeId;
        return (
          <button
            key={theme.id}
            type="button"
            className={`theme-switcher__btn${selected ? ' theme-switcher__btn--active' : ''}`}
            data-testid={`demo-theme-${theme.id}`}
            aria-pressed={selected}
            title={theme.label}
            style={{ '--theme-accent': theme.accent } as CSSProperties}
            onClick={() => setThemeId(theme.id)}
          >
            <ThemeIcon themeId={theme.id} />
            <span className="theme-switcher__label">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
