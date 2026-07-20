import { useDemoI18n } from './DemoI18nProvider';
import type { DemoLocale } from './demoMessages';

export function DemoLocaleSwitcher() {
  const { locale, setLocale, t } = useDemoI18n();

  return (
    <div className="demo-locale" role="group" aria-label="Language">
      {(['fr', 'en'] as const satisfies readonly DemoLocale[]).map((code) => (
        <button
          key={code}
          type="button"
          className={
            locale === code ? 'demo-locale__btn demo-locale__btn--active' : 'demo-locale__btn'
          }
          data-testid={`demo-locale-${code}`}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {t(`locale.${code}`)}
        </button>
      ))}
    </div>
  );
}
