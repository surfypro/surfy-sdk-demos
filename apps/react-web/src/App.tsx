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
import { DemoWorkbench } from './DemoWorkbench';
import { NativeWebViewSimulator } from './NativeWebViewSimulator';

function authModeLabel(mode: DemoAuthMode): string {
  return mode === 'api' ? 'API (serveur)' : 'OAuth / Entra';
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
        <h1>Surfy SDK Demo</h1>
        <DemoThemeSwitcher />
      </header>
      <p className="page__intro page__intro--compact">
        Routes : <code>/api|oauth/react-web|react-native/floor-2d|floor-3d|building-3d</code>. Mode
        API : session HttpOnly + proxy <code>/api/v1</code>.
      </p>

      <nav className="host-tabs" role="tablist" aria-label="Mode d'authentification">
        {DEMO_AUTH_MODES.map((mode) => (
          <DemoNavLink
            key={mode}
            to={buildDemoPath(mode, host, section)}
            testId={`auth-mode-${mode}`}
          >
            {authModeLabel(mode)}
          </DemoNavLink>
        ))}
      </nav>

      <nav className="host-tabs" role="tablist" aria-label="Hôte de démo">
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

      <nav className="demo-tabs" role="tablist" aria-label="Composants SDK">
        {DEMO_SECTIONS.map((item) => (
          <NavLink
            key={item.id}
            to={buildDemoPath(authMode, host, item.id)}
            role="tab"
            data-testid={`demo-tab-${item.id}`}
            className={({ isActive }) =>
              `demo-tabs__tab${isActive ? ' demo-tabs__tab--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {host === 'react-web' ? (
        <DemoWorkbench authMode={authMode} activeSection={section} />
      ) : (
        <NativeWebViewSimulator authMode={authMode} section={section} />
      )}
    </main>
  );
}

export type { DemoAuthMode, DemoHostId };

export default function App() {
  return (
    <DemoThemeProvider>
      <DemoAppShell />
    </DemoThemeProvider>
  );
}
