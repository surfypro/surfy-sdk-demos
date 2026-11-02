import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { DEMO_SECTIONS } from '../demoSections';
import { buildDemoPath } from '../demoRoutes';
import { DemoThemeSwitcher } from '../DemoThemeSwitcher';
import { useDemoI18n } from '../i18n/DemoI18nProvider';
import { DemoLocaleSwitcher } from '../i18n/DemoLocaleSwitcher';
import { SDK_BUNDLE_VERSION } from '../sdkBundleVersion';
import { useDemoResponsive } from './DemoResponsiveContext';

interface DemoCompactTopBarProps {
  readonly sectionLabel: string;
  readonly showWcSdkMeta: boolean;
  readonly sdkMeta: ReactNode;
}

export function DemoCompactTopBar({
  sectionLabel,
  showWcSdkMeta,
  sdkMeta,
}: DemoCompactTopBarProps) {
  const { t } = useDemoI18n();
  const { menuOpen, setMenuOpen } = useDemoResponsive();

  return (
    <header className="page__header page__header--compact" data-testid="demo-topbar">
      <button
        type="button"
        className="page__hamburger"
        data-testid="demo-hamburger"
        aria-label={t('chrome.menu')}
        aria-expanded={menuOpen}
        aria-controls="demo-compact-drawer"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="page__hamburger-icon" aria-hidden />
      </button>
      <div className="page__header-brand page__header-brand--compact">
        <span className="page__section-label" data-testid="demo-compact-section-label">
          {sectionLabel}
        </span>
        <span
          className="page__version"
          data-testid="demo-version-line"
          data-sdk-version={SDK_BUNDLE_VERSION}
          title={`@surfy/surfy-sdk ${SDK_BUNDLE_VERSION}`}
        >
          v{SDK_BUNDLE_VERSION}
        </span>
        {showWcSdkMeta ? sdkMeta : null}
      </div>
    </header>
  );
}

/** Drawer stays mounted while compact so portaled controls keep state when closed. */
export function DemoCompactDrawer() {
  const { t } = useDemoI18n();
  const { menuOpen, closeMenu, setSlotMount } = useDemoResponsive();
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSlotMount('scope', scopeRef.current);
    setSlotMount('controls', controlsRef.current);
    return () => {
      setSlotMount('scope', null);
      setSlotMount('controls', null);
    };
  }, [setSlotMount]);

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          className="page__drawer-backdrop"
          data-testid="demo-drawer-backdrop"
          aria-label={t('chrome.closeMenu')}
          onClick={closeMenu}
        />
      ) : null}
      <aside
        id="demo-compact-drawer"
        className={`page__drawer${menuOpen ? '' : ' page__drawer--closed'}`}
        data-testid="demo-compact-drawer"
        role="dialog"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
        aria-label={t('chrome.menu')}
        hidden={!menuOpen}
      >
        <nav className="page__drawer-nav" aria-label={t('nav.sections')}>
          <p className="page__drawer-heading">{t('nav.sections')}</p>
          {DEMO_SECTIONS.map((item) => (
            <NavLink
              key={item.id}
              to={buildDemoPath(item.id)}
              data-testid={`demo-tab-${item.id}`}
              className={({ isActive }) =>
                `page__drawer-link${isActive ? ' page__drawer-link--active' : ''}`
              }
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="page__drawer-block">
          <p className="page__drawer-heading">{t('chrome.appearance')}</p>
          <div className="page__header-actions page__header-actions--drawer">
            <DemoLocaleSwitcher />
            <DemoThemeSwitcher />
          </div>
        </div>

        <div className="page__drawer-block" data-testid="demo-drawer-scope">
          <p className="page__drawer-heading">{t('chrome.scope')}</p>
          <div ref={scopeRef} className="page__drawer-slot" />
        </div>

        <div className="page__drawer-block" data-testid="demo-drawer-controls">
          <p className="page__drawer-heading">{t('chrome.controls')}</p>
          <div ref={controlsRef} className="page__drawer-slot" />
        </div>
      </aside>
    </>
  );
}

function EventsChevronIcon({ collapsed }: { readonly collapsed: boolean }) {
  return (
    <svg
      className="page__events-chevron"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
    >
      {collapsed ? (
        <path
          d="M4.2 6.2 8 10l3.8-3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M4.2 9.8 8 6l3.8 3.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function DemoCompactEventsHost() {
  const { t } = useDemoI18n();
  const { setSlotMount } = useDemoResponsive();
  const [collapsed, setCollapsed] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSlotMount('events', collapsed ? null : bodyRef.current);
    return () => setSlotMount('events', null);
  }, [collapsed, setSlotMount]);

  return (
    <section
      className={`page__events${collapsed ? ' page__events--collapsed' : ''}`}
      data-testid="demo-events-strip"
      aria-label={t('chrome.events')}
    >
      <header className="page__events-header">
        <button
          type="button"
          className="page__events-toggle"
          data-testid="demo-events-collapse"
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('chrome.eventsExpand') : t('chrome.eventsCollapse')}
          title={collapsed ? t('chrome.eventsExpand') : t('chrome.eventsCollapse')}
          onClick={() => setCollapsed((v) => !v)}
        >
          <strong className="page__events-title">{t('chrome.events')}</strong>
          <EventsChevronIcon collapsed={collapsed} />
        </button>
      </header>
      {collapsed ? null : (
        <div ref={bodyRef} className="page__events-body" data-testid="demo-events-body" />
      )}
    </section>
  );
}
