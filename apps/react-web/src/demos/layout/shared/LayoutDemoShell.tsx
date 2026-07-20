import type { ReactNode, RefObject } from 'react';

import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface LayoutDemoShellProps {
  readonly testId: string;
  readonly title: string;
  readonly mountSnippet: string;
  readonly entityLabel: string | undefined;
  readonly description: string;
  readonly registered: boolean;
  readonly hasEntity: boolean;
  readonly sidebar: ReactNode;
  readonly mapHostRef: RefObject<HTMLDivElement | null>;
}

/** Shared section chrome — header, empty states, sidebar + map host. */
export function LayoutDemoShell({
  testId,
  title,
  mountSnippet,
  entityLabel,
  description,
  registered,
  hasEntity,
  sidebar,
  mapHostRef,
}: LayoutDemoShellProps) {
  const { t } = useDemoI18n();

  return (
    <section className="demo-section" data-testid={testId}>
      <header className="demo-section__header">
        <h2>{title}</h2>
        <p className="demo-section__tag">
          <code>{mountSnippet}</code>
          {entityLabel !== undefined ? (
            <>
              {' '}
              · {entityLabel}
            </>
          ) : null}
        </p>
        <p className="demo-section__description">{description}</p>
      </header>

      {!registered ? (
        <div className="demo-section__unavailable" data-testid="demo-section-unavailable">
          <p>{t('layout.unavailable')}</p>
        </div>
      ) : !hasEntity ? (
        <div className="demo-section__unavailable" data-testid="demo-section-no-entity">
          <p>{t('layout.noEntity')}</p>
        </div>
      ) : (
        <div className="demo-section__workspace">
          <aside className="demo-section__sidebar" data-testid="demo-sidebar">
            {sidebar}
          </aside>
          <div className="demo-section__map">
            <div ref={mapHostRef} className="layout-host" data-testid="layout-host" />
          </div>
        </div>
      )}
    </section>
  );
}
