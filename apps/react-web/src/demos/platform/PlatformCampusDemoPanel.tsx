import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SURFY_SDK_MIN_HOST_VERSION, SURFY_SDK_VERSION } from '@surfy/surfy-sdk';
import {
  SdkAltitudeFloor0LockedError,
  SurfyPlatformView3dReact,
  useBuildings,
  useCurrentZoom,
  useFloors,
  usePositionFromGeo,
  useSetCurrentZoom,
} from '@surfy/surfy-sdk/react';

import { ensureDemoSession, getDemoProxyBearer } from '../../demoSession';
import { getSurfyDemoBaseUrl } from '../../surfyEnv';
import { useDemoAssetsBaseUrl } from '../../useDemoAssetsBaseUrl';
import { useDemoI18n } from '../../i18n/DemoI18nProvider';
import {
  DEMO_PLATFORM_BUILDING_DETAIL_FIXTURE,
  DEMO_PLATFORM_GEO_INJECT,
  DEMO_PLATFORM_VISION_FIXTURE,
} from './platformDemo.fixtures';
import { compareDemoSurfyHostVersion } from './compareDemoSurfyHostVersion.helper';

interface PlatformCampusDemoPanelProps {
  readonly active: boolean;
  readonly tenant?: string;
  readonly title: string;
  readonly description: string;
}

interface PlatformHostListProps {
  readonly mountNode: HTMLElement | null;
}

/**
 * Must render under SurfyPlatform Provider (as children), then portal into the
 * left host sidebar — never float on the map.
 */
function PlatformAltitudeControls({ mountNode }: PlatformHostListProps) {
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
        if (result.reason === 'ALTITUDE_FLOOR0_MISSING' || result.reason === 'NO_CALIBRATION') {
          setError(t('platform.altitudeFloor0Missing'));
          setLastResult(`locked: ${result.reason}`);
          return;
        }
        setLastResult(`locked: ${result.reason}`);
        return;
      }
      setLastResult(
        `floor=${result.floorId} space=${result.spaceId ?? '—'} ambiguous=${String(result.ambiguous)}`,
      );
    } catch (err) {
      if (err instanceof SdkAltitudeFloor0LockedError) {
        setError(t('platform.altitudeFloor0Missing'));
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setLastResult('error');
    }
  }, [positionFromGeo, t]);

  if (!mountNode) {
    return null;
  }

  return createPortal(
    <div className="demo-platform-controls" data-testid="demo-platform-altitude">
      <strong>{t('platform.geoInjectTitle')}</strong>
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
    </div>,
    mountNode,
  );
}

function PlatformBuildingsList({ mountNode }: PlatformHostListProps) {
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
                      {typeof b.campusId === 'number' ? ` · campus ${b.campusId}` : ''}
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
 * Host chrome floors — `useFloors` + `useSetCurrentZoom({ type: 'enterFloor' })`
 * (pattern ExternalHostFocusControls). Empty until building detail hydrates.
 */
function PlatformFloorsList({ mountNode }: PlatformHostListProps) {
  const { t } = useDemoI18n();
  const floors = useFloors() as readonly {
    readonly id: number;
    readonly name: string;
    readonly level?: number;
  }[];
  const zoom = useCurrentZoom() as {
    readonly buildingId?: number;
    readonly floorId?: number;
  };
  const setZoom = useSetCurrentZoom() as (update: {
    readonly type: 'enterFloor';
    readonly floorId: number;
    readonly buildingId: number;
  }) => void;

  const selectFloor = useCallback(
    (floorId: number) => {
      if (zoom.buildingId == null) {
        return;
      }
      setZoom({
        type: 'enterFloor',
        floorId,
        buildingId: zoom.buildingId,
      });
    },
    [setZoom, zoom.buildingId],
  );

  if (!mountNode) {
    return null;
  }

  return createPortal(
    <div data-testid="demo-platform-floors-list">
      <strong>{t('platform.floorsFromDetail')}</strong>
      {floors.length === 0 ? (
        <p className="demo-section__tag">{t('platform.noFloors')}</p>
      ) : (
        <ul className="demo-platform-floors">
          {floors.map((floor) => {
            const selected = zoom.floorId === floor.id;
            const label =
              floor.name?.trim() ||
              (typeof floor.level === 'number' ? `level ${floor.level}` : `floor ${floor.id}`);
            return (
              <li key={floor.id}>
                <button
                  type="button"
                  className={`demo-platform-floor-row${selected ? ' demo-platform-floor-row--selected' : ''}`}
                  data-testid={`demo-platform-floor-${floor.id}`}
                  data-floor-name={label}
                  data-selected={selected ? 'true' : 'false'}
                  aria-pressed={selected}
                  aria-label={label}
                  disabled={zoom.buildingId == null}
                  onClick={() => selectFloor(floor.id)}
                >
                  <span className="demo-platform-floor-row__label">{label}</span>
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
 * Demo `platform-3d` — SurfyPlatformView3dReact (same stack as product building/3d-maplibre).
 * Sidebar lists = **host chrome** via public hooks (`useBuildings` / `useFloors` /
 * `useSetCurrentZoom` / `usePositionFromGeo`) — not product PlatformStructureBuildingList.
 */
type HostCompatState =
  | { readonly status: 'pending' }
  | { readonly status: 'live'; readonly hostVersion: string }
  | {
      readonly status: 'fixtures';
      readonly hostVersion: string;
      readonly reason: string;
    };

export function PlatformCampusDemoPanel({
  active,
  tenant: tenantProp,
  title,
  description,
}: PlatformCampusDemoPanelProps) {
  const { t } = useDemoI18n();
  const [tenant, setTenant] = useState(tenantProp ?? '');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [hostCompat, setHostCompat] = useState<HostCompatState>({ status: 'pending' });
  const [ready, setReady] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [buildingsSlot, setBuildingsSlot] = useState<HTMLElement | null>(null);
  const [floorsSlot, setFloorsSlot] = useState<HTMLElement | null>(null);
  const [altitudeSlot, setAltitudeSlot] = useState<HTMLElement | null>(null);
  const [cubyHydrateError, setCubyHydrateError] = useState<string | null>(null);
  const [mapHostEl, setMapHostEl] = useState<HTMLElement | null>(null);
  const assetsBaseUrl = useDemoAssetsBaseUrl();

  useEffect(() => {
    if (!mapHostEl) {
      setCubyHydrateError(null);
      return;
    }
    const readError = () => {
      const host = mapHostEl.querySelector('[data-surfy-sdk-cuby-hydrate-error]');
      const value = host?.getAttribute('data-surfy-sdk-cuby-hydrate-error')?.trim() ?? '';
      setCubyHydrateError(value || null);
    };
    readError();
    const observer = new MutationObserver(readError);
    observer.observe(mapHostEl, {
      attributes: true,
      attributeFilter: ['data-surfy-sdk-cuby-hydrate-error'],
      subtree: true,
      childList: true,
    });
    return () => observer.disconnect();
  }, [mapHostEl]);

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
    if (!tenant) {
      setHostCompat({ status: 'pending' });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const token = await getDemoProxyBearer();
        const response = await fetch(`${getSurfyDemoBaseUrl()}/api/v1/configuration/config`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'x-tenant': tenant,
          },
        });
        if (!response.ok) {
          throw new Error(`configuration ${response.status}`);
        }
        const payload = (await response.json()) as { version?: string };
        const hostVersion = payload.version?.trim() || 'unknown';
        const cmp = compareDemoSurfyHostVersion(hostVersion, SURFY_SDK_MIN_HOST_VERSION);
        if (cancelled) return;
        if (cmp == null || cmp < 0) {
          setHostCompat({
            status: 'fixtures',
            hostVersion,
            reason: t('platform.hostVersionIncompatible', {
              host: hostVersion,
              min: SURFY_SDK_MIN_HOST_VERSION,
              sdk: SURFY_SDK_VERSION,
            }),
          });
          return;
        }
        setHostCompat({ status: 'live', hostVersion });
      } catch (err: unknown) {
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        setHostCompat({
          status: 'fixtures',
          hostVersion: 'unknown',
          reason: t('platform.hostVersionCheckFailed', { detail }),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant, t]);

  const push = useCallback((line: string) => {
    setLog((prev) => [line, ...prev].slice(0, 12));
  }, []);

  const useFixtures = hostCompat.status === 'fixtures';

  const commonProps = useMemo(
    () => ({
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      assetsBaseUrl,
      getAccessToken: () => getDemoProxyBearer(),
      ...(useFixtures
        ? {
            fixtureVision: DEMO_PLATFORM_VISION_FIXTURE,
            fixtureBuildingDetail: DEMO_PLATFORM_BUILDING_DETAIL_FIXTURE,
          }
        : {}),
      style: { width: '100%', height: '100%', minHeight: 420 } as const,
      onReady: () => {
        setReady(true);
        push('onReady');
      },
      onBuildingChange: (buildingId: number) => push(`onBuildingChange(${buildingId})`),
      onFloorChange: (floorId: number) => push(`onFloorChange(${floorId})`),
    }),
    [push, tenant, assetsBaseUrl, useFixtures],
  );

  if (!active) {
    return null;
  }

  const canMount = Boolean(tenant && assetsBaseUrl && hostCompat.status !== 'pending');

  /** Host chrome under Provider — portaled into the left sidebar slots (not map overlay). */
  const hostChromeChildren = (
    <>
      <PlatformBuildingsList mountNode={buildingsSlot} />
      <PlatformFloorsList mountNode={floorsSlot} />
      <PlatformAltitudeControls mountNode={altitudeSlot} />
    </>
  );

  return (
    <section className="demo-section" data-testid="demo-section-platform-3d">
      <header className="demo-section__header">
        <h2>{title}</h2>
        <p className="demo-section__tag">
          <code>{'<SurfyPlatformView3dReact />'}</code>
          {' · '}
          {ready ? t('platform.ready') : t('platform.loading')}
        </p>
        <p className="demo-section__description">{description}</p>
        <p className="demo-section__tag" data-testid="demo-platform-host-chrome-note">
          {t('platform.hostChromeNote')}
        </p>
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
            <div
              ref={setBuildingsSlot}
              data-testid="demo-platform-buildings-slot"
              className="demo-platform-buildings-slot"
            />
            <div
              ref={setFloorsSlot}
              data-testid="demo-platform-floors-slot"
              className="demo-platform-floors-slot"
            />
            <div
              ref={setAltitudeSlot}
              data-testid="demo-platform-altitude-slot"
              className="demo-platform-altitude-slot"
            />
            <p className="demo-section__description">
              {useFixtures ? t('platform.fixturesNote') : t('platform.liveApiNote')}
            </p>
            {hostCompat.status === 'fixtures' ? (
              <p
                className="demo-catalog-error"
                role="status"
                data-testid="demo-platform-host-compat"
              >
                {hostCompat.reason}
              </p>
            ) : null}
            {hostCompat.status === 'live' ? (
              <p className="demo-section__tag" data-testid="demo-platform-host-compat">
                {t('platform.hostVersionOk', {
                  host: hostCompat.hostVersion,
                  min: SURFY_SDK_MIN_HOST_VERSION,
                })}
              </p>
            ) : null}
            {cubyHydrateError ? (
              <p
                className="demo-catalog-error"
                role="alert"
                data-testid="demo-platform-cuby-hydrate-error"
              >
                {t('platform.cubyHydrateError')}
                <br />
                <code>{t('platform.cubyHydrateErrorDetail', { detail: cubyHydrateError })}</code>
              </p>
            ) : null}
            <div data-testid="demo-platform-event-log">
              <strong>{t('platform.events')}</strong>
              <ul>
                {log.map((line, index) => (
                  <li key={`${index}-${line}`}>
                    <code>{line}</code>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="demo-section__map">
            <div
              className="layout-host layout-host--react"
              data-testid="layout-host-react-platform"
              ref={setMapHostEl}
            >
              {canMount ? (
                <SurfyPlatformView3dReact
                  key={`platform-${tenant}-${useFixtures ? 'fx' : 'live'}`}
                  {...commonProps}
                >
                  {hostChromeChildren}
                </SurfyPlatformView3dReact>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
