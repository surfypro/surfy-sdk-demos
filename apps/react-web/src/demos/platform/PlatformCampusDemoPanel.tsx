import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SurfyCampusView3dReact,
  SurfyPlatformView3dReact,
  useBuildings,
  useCurrentZoom,
  usePositionFromGeo,
  useSetCurrentZoom,
} from '@surfy/surfy-sdk/react';

import { createDemoSurfyClient } from '../../createDemoSurfyClient';
import { ensureDemoSession, getDemoProxyBearer } from '../../demoSession';
import { getSurfyDemoBaseUrl } from '../../surfyEnv';
import { useDemoI18n } from '../../i18n/DemoI18nProvider';
import {
  type DemoCampusRow,
  demoQueryNodeCampuses,
} from '../data/demoQueryNodes';
import { DEMO_PLATFORM_GEO_INJECT } from './platformDemo.fixtures';

type PlatformDemoMode = 'platform' | 'campus';

interface PlatformCampusDemoPanelProps {
  readonly active: boolean;
  readonly mode: PlatformDemoMode;
  readonly tenant?: string;
  readonly title: string;
  readonly description: string;
}

interface PlatformBuildingsListProps {
  readonly mountNode: HTMLElement | null;
}

/** Must render under SurfyPlatform/Campus Provider (as children). */
function PlatformAltitudeControls() {
  const { t } = useDemoI18n();
  const positionFromGeo = usePositionFromGeo();
  const [lastResult, setLastResult] = useState<string>('—');
  const [error, setError] = useState<string | null>(null);

  const inject = useCallback(() => {
    setError(null);
    try {
      const result = positionFromGeo({ ...DEMO_PLATFORM_GEO_INJECT }) as
        | { readonly ok: false; readonly reason: string }
        | {
            readonly ok: true;
            readonly floorId: number;
            readonly spaceId: number | null;
            readonly ambiguous: boolean;
          };
      if (!result.ok) {
        setLastResult(`locked: ${result.reason}`);
        return;
      }
      setLastResult(
        `floor=${result.floorId} space=${result.spaceId ?? '—'} ambiguous=${String(result.ambiguous)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLastResult('error');
    }
  }, [positionFromGeo]);

  return (
    <div className="demo-platform-controls" data-testid="demo-platform-altitude">
      <p className="demo-section__tag">
        <code>{'{ lat, lng, altitude }'}</code> → {t('platform.altitudeHint')}
      </p>
      <button type="button" data-testid="demo-platform-inject-geo" onClick={inject}>
        {t('platform.injectAltitude')}
      </button>
      <p data-testid="demo-platform-geo-result">
        {t('platform.lastGeo')}: <code>{lastResult}</code>
      </p>
      {error ? (
        <p className="demo-catalog-error" role="alert" data-testid="demo-platform-geo-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PlatformBuildingsList({ mountNode }: PlatformBuildingsListProps) {
  const { t } = useDemoI18n();
  const buildings = useBuildings() as readonly {
    readonly id: number;
    readonly name: string;
    readonly campusId?: number;
    readonly lat?: number;
    readonly lng?: number;
  }[];
  const zoom = useCurrentZoom() as {
    readonly buildingId?: number;
    readonly campusId?: number;
  };
  const setZoom = useSetCurrentZoom() as (update: {
    readonly type: 'enterBuilding';
    readonly buildingId: number;
    readonly campusId?: number;
  }) => void;

  const selectBuilding = useCallback(
    (building: { readonly id: number; readonly campusId?: number }) => {
      setZoom({
        type: 'enterBuilding',
        buildingId: building.id,
        campusId: building.campusId ?? zoom.campusId,
      });
    },
    [setZoom, zoom.campusId],
  );

  if (!mountNode) {
    return null;
  }

  return createPortal(
    <div data-testid="demo-platform-buildings-list">
      <strong>{t('platform.buildingsFromApi')}</strong>
      {buildings.length === 0 ? (
        <p className="demo-section__tag">{t('platform.noBuildings')}</p>
      ) : (
        <ul className="demo-platform-buildings">
          {buildings.map((b) => {
            const selected = zoom.buildingId === b.id;
            const hasGps =
              typeof b.lat === 'number' &&
              Number.isFinite(b.lat) &&
              typeof b.lng === 'number' &&
              Number.isFinite(b.lng);
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className={`demo-platform-building-row${selected ? ' demo-platform-building-row--selected' : ''}`}
                  data-testid={`demo-platform-building-${b.id}`}
                  data-selected={selected ? 'true' : 'false'}
                  data-has-gps={hasGps ? 'true' : 'false'}
                  aria-pressed={selected}
                  onClick={() => selectBuilding(b)}
                >
                  <span className="demo-platform-building-row__label">
                    <code>
                      {b.id} · {b.name}
                      {b.campusId != null ? ` · campus ${b.campusId}` : ''}
                    </code>
                  </span>
                  {!hasGps ? (
                    <span
                      className="demo-platform-building-row__hint"
                      data-testid={`demo-platform-building-no-gps-${b.id}`}
                    >
                      {t('platform.noGpsHint')}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>,
    mountNode,
  );
}

/**
 * Vue plateforme / Vue campus — live GetVision / GetBuildingDetail via demo proxy.
 */
export function PlatformCampusDemoPanel({
  active,
  mode,
  tenant: tenantProp,
  title,
  description,
}: PlatformCampusDemoPanelProps) {
  const { t } = useDemoI18n();
  const [tenant, setTenant] = useState(tenantProp ?? '');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [campuses, setCampuses] = useState<readonly DemoCampusRow[]>([]);
  const [campusId, setCampusId] = useState<number | null>(null);
  const [campusesError, setCampusesError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [buildingsSlot, setBuildingsSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (tenantProp) {
      setTenant(tenantProp);
      return;
    }
    let cancelled = false;
    void ensureDemoSession()
      .then((session: { tenant: string }) => {
        if (!cancelled) {
          setSessionError(null);
          setTenant(session.tenant);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTenant('');
          setSessionError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenantProp]);

  useEffect(() => {
    if (!tenant || mode !== 'campus') {
      return;
    }
    let cancelled = false;
    setCampusesError(null);
    void createDemoSurfyClient()
      .then((client) => client.fetchEntities<DemoCampusRow>(demoQueryNodeCampuses()))
      .then((rows) => {
        if (cancelled) {
          return;
        }
        setCampuses(rows);
        setCampusId((prev) => {
          if (prev != null && rows.some((r) => r.id === prev)) {
            return prev;
          }
          return rows[0]?.id ?? null;
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCampuses([]);
          setCampusId(null);
          setCampusesError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenant, mode]);

  const push = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }, []);

  const commonProps = useMemo(
    () => ({
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      getAccessToken: () => getDemoProxyBearer(),
      style: { width: '100%', height: '100%', minHeight: 420 } as const,
      onReady: () => {
        setReady(true);
        push('onReady');
      },
      onBuildingChange: (buildingId: number) => push(`onBuildingChange(${buildingId})`),
      onFloorChange: (floorId: number) => push(`onFloorChange(${floorId})`),
    }),
    [push, tenant],
  );

  if (!active) {
    return null;
  }

  const snippet =
    mode === 'campus'
      ? `<SurfyCampusView3dReact campusId={${campusId ?? '…'}} />`
      : '<SurfyPlatformView3dReact />';

  const canMountCampus = mode === 'campus' && campusId != null;
  const canMountPlatform = mode === 'platform' && Boolean(tenant);
  const canMount = Boolean(tenant) && (canMountPlatform || canMountCampus);

  const overlayChildren = (
    <div className="demo-platform-overlay">
      <PlatformBuildingsList mountNode={buildingsSlot} />
      <PlatformAltitudeControls />
    </div>
  );

  return (
    <section className="demo-section" data-testid={`demo-section-${mode}-3d`}>
      <header className="demo-section__header">
        <h2>{title}</h2>
        <p className="demo-section__tag">
          <code>{snippet}</code>
          {' · '}
          {ready ? t('platform.ready') : t('platform.loading')}
        </p>
        <p className="demo-section__description">{description}</p>
      </header>

      {sessionError ? (
        <p className="demo-catalog-error" role="alert">
          {sessionError}
        </p>
      ) : null}

      {!tenant && !sessionError ? <p>{t('workbench.loading')}</p> : null}

      {tenant ? (
        <div className="demo-section__workspace">
          <aside className="demo-section__sidebar" data-testid="demo-platform-sidebar">
            {mode === 'campus' ? (
              <label className="demo-platform-campus-id">
                {t('platform.campusId')}
                <select
                  data-testid="demo-platform-campus-id"
                  value={campusId ?? ''}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setCampusId(Number.isFinite(next) ? next : null);
                    setReady(false);
                  }}
                >
                  {campuses.length === 0 ? (
                    <option value="">{t('platform.noCampuses')}</option>
                  ) : (
                    campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))
                  )}
                </select>
              </label>
            ) : null}
            {campusesError ? (
              <p className="demo-catalog-error" role="alert">
                {campusesError}
              </p>
            ) : null}
            <div
              ref={setBuildingsSlot}
              data-testid="demo-platform-buildings-slot"
              className="demo-platform-buildings-slot"
            />
            <p className="demo-section__description">{t('platform.liveApiNote')}</p>
            <div data-testid="demo-platform-event-log">
              <strong>{t('platform.events')}</strong>
              <ul>
                {log.map((line) => (
                  <li key={line}>
                    <code>{line}</code>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="demo-section__map">
            <div className="layout-host layout-host--react" data-testid="layout-host-react-platform">
              {canMount && mode === 'campus' && campusId != null ? (
                <SurfyCampusView3dReact key={`campus-${campusId}`} {...commonProps} campusId={campusId}>
                  {overlayChildren}
                </SurfyCampusView3dReact>
              ) : null}
              {canMount && mode === 'platform' ? (
                <SurfyPlatformView3dReact key={`platform-${tenant}`} {...commonProps}>
                  {overlayChildren}
                </SurfyPlatformView3dReact>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
