import { Navigate, NavLink, useParams, useSearchParams } from 'react-router-dom';

import './App.css';
import { DEMO_SECTIONS } from './demoSections';
import {
  buildDemoPath,
  DEMO_AUTH_MODES,
  DEMO_HOSTS,
  DEFAULT_DEMO_PATH,
  parseDemoRouteParams,
  type DemoAuthMode,
  type DemoHostId,
} from './demoRoutes';
import { DemoThemeProvider } from './DemoThemeContext';
import { DemoThemeSwitcher } from './DemoThemeSwitcher';
import { DemoSdkMeta } from './DemoSdkMeta';
import { DemoWorkbench } from './DemoWorkbench';
import { DEMO_APP_VERSION } from './demoVersion';
import { DemoI18nProvider, useDemoI18n } from './i18n/DemoI18nProvider';
import { DemoLocaleSwitcher } from './i18n/DemoLocaleSwitcher';
import { NativeWebViewSimulator } from './NativeWebViewSimulator';

function authModeLabel(mode: DemoAuthMode, t: ReturnType<typeof useDemoI18n>['t']): string {
  return mode === 'api' ? t('auth.api') : t('auth.oauth');
}

function DemoNavLink(props: {
  readonly to: string;
  readonly testId: string;
  readonly children: string;
}) {
  const { to, testId, children } = props;
  return (
    <NavLink
      to={to}
      role="tab"
      data-testid={testId}
      className={({ isActive }) =>
        `host-tabs__tab${isActive ? ' host-tabs__tab--active' : ''}`
      }
    >
      {children}
    </NavLink>
  );
}

function DemoAppShell() {
  const { t } = useDemoI18n();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const embedded = searchParams.get('embed') === '1';
  const route = parseDemoRouteParams(params);

  if (!route) {
    return <Navigate to={DEFAULT_DEMO_PATH} replace />;
  }

  const { authMode, host, section } = route;

  if (embedded) {
    return (
      <main className="page page--embed" data-testid="embed-webview-host">
        <DemoWorkbench embedded authMode={authMode} activeSection={section} />
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>{t('app.title')}</h1>
        <div className="page__header-actions">
          <DemoLocaleSwitcher />
          <DemoThemeSwitcher />
        </div>
      </header>
      <p className="page__intro page__intro--compact">{t('app.routesHint')}</p>
      <p className="page__version" data-testid="demo-version-line">
        Demo v{DEMO_APP_VERSION}
      </p>
      <DemoSdkMeta />

      <nav className="host-tabs" role="tablist" aria-label={t('nav.auth')}>
        {DEMO_AUTH_MODES.map((mode) => (
          <DemoNavLink
            key={mode}
            to={buildDemoPath(mode, host, section)}
            testId={`auth-mode-${mode}`}
          >
            {authModeLabel(mode, t)}
          </DemoNavLink>
        ))}
      </nav>

      <nav className="host-tabs" role="tablist" aria-label={t('nav.host')}>
        {DEMO_HOSTS.map((item) => (
          <DemoNavLink
            key={item.id}
            to={buildDemoPath(authMode, item.id, section)}
            testId={item.testId}
          >
            {item.label}
          </DemoNavLink>
        ))}
      </nav>

      <div className="demo-shell">
        <aside className="demo-api-nav" aria-label={t('nav.apiFamilies')}>
          <div className="demo-api-nav__group">
            <h2 className="demo-api-nav__title">{t('nav.apiComponents')}</h2>
            <nav className="demo-api-nav__list" role="tablist" aria-label={t('nav.apiComponents')}>
              {DEMO_SECTIONS.filter((item) => item.id !== 'data-api').map((item) => (
                <NavLink
                  key={item.id}
                  to={buildDemoPath(authMode, host, item.id)}
                  role="tab"
                  data-testid={`demo-tab-${item.id}`}
                  className={({ isActive }) =>
                    `demo-api-nav__link${isActive ? ' demo-api-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="demo-api-nav__group">
            <h2 className="demo-api-nav__title">{t('nav.apiData')}</h2>
            <nav className="demo-api-nav__list" role="tablist" aria-label={t('nav.apiData')}>
              {DEMO_SECTIONS.filter((item) => item.id === 'data-api').map((item) => (
                <NavLink
                  key={item.id}
                  to={buildDemoPath(authMode, host, item.id)}
                  role="tab"
                  data-testid={`demo-tab-${item.id}`}
                  className={({ isActive }) =>
                    `demo-api-nav__link${isActive ? ' demo-api-nav__link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="demo-shell__main">
          {host === 'react-web' ? (
            <DemoWorkbench authMode={authMode} activeSection={section} />
          ) : (
            <NativeWebViewSimulator authMode={authMode} section={section} />
          )}
        </div>
      </div>
    </main>
  );
}

export type { DemoAuthMode, DemoHostId };

export default function App() {
  return (
    <DemoI18nProvider>
      <DemoThemeProvider>
        <DemoAppShell />
      </DemoThemeProvider>
    </DemoI18nProvider>
  );
}
