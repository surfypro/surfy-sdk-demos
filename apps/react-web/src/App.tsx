import { Navigate, NavLink, useParams } from 'react-router-dom';

import './App.css';
import { DEMO_SECTIONS, isLayoutSection } from './demoSections';
import { buildDemoPath, DEFAULT_DEMO_PATH, parseDemoRouteParams } from './demoRoutes';
import { DemoThemeProvider } from './DemoThemeContext';
import { DemoThemeSwitcher } from './DemoThemeSwitcher';
import { DemoSdkMeta } from './DemoSdkMeta';
import { DemoWorkbench } from './DemoWorkbench';
import { DemoI18nProvider, useDemoI18n } from './i18n/DemoI18nProvider';
import { DemoLocaleSwitcher } from './i18n/DemoLocaleSwitcher';
import {
  DemoCompactDrawer,
  DemoCompactEventsHost,
  DemoCompactTopBar,
} from './responsive/DemoCompactChrome';
import { DemoResponsiveProvider, useDemoResponsive } from './responsive/DemoResponsiveContext';
import { SDK_BUNDLE_VERSION } from './sdkBundleVersion';

function DemoDesktopHeader({
  showWcSdkMeta,
}: {
  readonly showWcSdkMeta: boolean;
}) {
  const { t } = useDemoI18n();

  return (
    <header className="page__header" data-testid="demo-topbar">
      <div className="page__header-brand">
        <h1>{t('app.title')}</h1>
        <span
          className="page__version"
          data-testid="demo-version-line"
          data-sdk-version={SDK_BUNDLE_VERSION}
          title={`@surfy/surfy-sdk ${SDK_BUNDLE_VERSION}`}
        >
          v{SDK_BUNDLE_VERSION}
        </span>
        {showWcSdkMeta ? <DemoSdkMeta /> : null}
      </div>

      <nav className="page__header-sections host-tabs" role="tablist" aria-label={t('nav.sections')}>
        {DEMO_SECTIONS.map((item) => (
          <NavLink
            key={item.id}
            to={buildDemoPath(item.id)}
            role="tab"
            data-testid={`demo-tab-${item.id}`}
            className={({ isActive }) =>
              `host-tabs__tab${isActive ? ' host-tabs__tab--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="page__header-actions">
        <DemoLocaleSwitcher />
        <DemoThemeSwitcher />
      </div>
    </header>
  );
}

function DemoAppShell() {
  const { t } = useDemoI18n();
  const { isCompact } = useDemoResponsive();
  const route = parseDemoRouteParams(useParams());

  if (!route) {
    return <Navigate to={DEFAULT_DEMO_PATH} replace />;
  }

  const { section } = route;
  const activeSectionConfig = DEMO_SECTIONS.find((item) => item.id === section);
  const showWcSdkMeta = activeSectionConfig !== undefined && isLayoutSection(activeSectionConfig);
  const sectionLabel = activeSectionConfig?.label ?? t('app.title');

  return (
    <main className={`page${isCompact ? ' page--compact' : ''}`}>
      {isCompact ? (
        <>
          <DemoCompactTopBar
            sectionLabel={sectionLabel}
            showWcSdkMeta={showWcSdkMeta}
            sdkMeta={<DemoSdkMeta />}
          />
          <DemoCompactDrawer />
        </>
      ) : (
        <DemoDesktopHeader showWcSdkMeta={showWcSdkMeta} />
      )}

      <div className="page__main">
        <DemoWorkbench activeSection={section} />
      </div>

      {isCompact ? <DemoCompactEventsHost /> : null}
    </main>
  );
}

export default function App() {
  return (
    <DemoI18nProvider>
      <DemoThemeProvider>
        <DemoResponsiveProvider>
          <DemoAppShell />
        </DemoResponsiveProvider>
      </DemoThemeProvider>
    </DemoI18nProvider>
  );
}
