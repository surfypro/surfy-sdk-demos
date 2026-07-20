import { useEffect, useState } from 'react';

import type { DemoAuthMode } from './demoRoutes';
import { DEMO_SECTIONS, resolveSectionEntityId, type DemoSectionId } from './demoSections';
import { DemoScopePicker } from './DemoScopePicker';
import { fetchDemoCatalog, type DemoBuilding, type DemoCatalog } from './fetchDemoCatalog';
import { LayoutDemoPanel } from './LayoutDemoPanel';

function pickInitialScope(buildings: readonly DemoBuilding[]): {
  buildingId: number | undefined;
  floorId: number | undefined;
} {
  const withFloors = buildings.find((b) => b.floors.length > 0) ?? buildings[0];
  if (!withFloors) {
    return { buildingId: undefined, floorId: undefined };
  }
  return {
    buildingId: withFloors.id,
    floorId: withFloors.floors[0]?.id,
  };
}

interface DemoWorkbenchProps {
  readonly embedded?: boolean;
  readonly authMode: DemoAuthMode;
  readonly activeSection: DemoSectionId;
}

/**
 * Shared demo UI (React web + RN WebView embed).
 * Section comes from the URL (`/:authMode/:host/:section`).
 * API mode: session cookie + server proxy (no Surfy JWT in the browser).
 * OAuth mode: placeholder until Entra OBO / delegate-token ships.
 */
export function DemoWorkbench({ embedded = false, authMode, activeSection }: DemoWorkbenchProps) {
  const [catalog, setCatalog] = useState<DemoCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [buildingId, setBuildingId] = useState<number | undefined>();
  const [floorId, setFloorId] = useState<number | undefined>();

  useEffect(() => {
    if (authMode !== 'api') {
      setCatalog(null);
      setCatalogError(null);
      setCatalogLoading(false);
      return;
    }

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    void fetchDemoCatalog()
      .then((result) => {
        if (cancelled) return;
        setCatalog(result);
        const initial = pickInitialScope(result.buildings);
        setBuildingId(initial.buildingId);
        setFloorId(initial.floorId);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCatalogError(error instanceof Error ? error.message : 'Failed to load buildings');
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authMode]);

  const selectedBuilding = catalog?.buildings.find((b) => b.id === buildingId);
  const scopeVariant = activeSection === 'building-3d' ? 'building' : 'floor';

  const onBuildingChange = (nextBuildingId: number) => {
    setBuildingId(nextBuildingId);
    const building = catalog?.buildings.find((b) => b.id === nextBuildingId);
    setFloorId(building?.floors[0]?.id);
  };

  if (authMode === 'oauth') {
    return (
      <div className="demo-workbench" data-testid="demo-workbench-oauth">
        <div className="demo-section__unavailable" data-testid="oauth-coming-soon">
          <p>
            Mode OAuth / Entra OBO (token utilisateur → droits Surfy) — à venir. Deux app
            registrations Entra (app cliente ↔ Surfy), échange type <code>openid/set-token</code>{' '}
            puis JWT pour <code>setAccessTokenProvider</code>.
          </p>
          <p>Pour l&apos;instant, utilisez le mode API (session serveur + proxy).</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`demo-workbench${embedded ? ' demo-workbench--embedded' : ''}`}
      data-testid="demo-workbench"
    >
      {!embedded ? (
        <p className="page__intro demo-workbench__intro">
          Mode API : session HttpOnly + proxy <code>/api/v1</code> (le JWT Surfy ne quitte pas le
          serveur). Bâtiments de référence uniquement.
        </p>
      ) : null}

      {catalogLoading ? (
        <p data-testid="demo-catalog-loading">Chargement des bâtiments…</p>
      ) : null}

      {catalogError ? (
        <p className="demo-catalog-error" data-testid="demo-catalog-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      {catalog ? (
        <>
          <p className="demo-tenant" data-testid="demo-tenant">
            Tenant: <code>{catalog.tenant}</code> · session API (proxy)
          </p>
          <DemoScopePicker
            buildings={catalog.buildings}
            selectedBuildingId={buildingId}
            selectedFloorId={floorId}
            onBuildingChange={onBuildingChange}
            onFloorChange={setFloorId}
            variant={scopeVariant}
            disabled={catalogLoading}
          />
          {scopeVariant === 'floor' && selectedBuilding && selectedBuilding.floors.length === 0 ? (
            <p className="demo-catalog-hint">Ce bâtiment n&apos;a pas d&apos;étage.</p>
          ) : null}
        </>
      ) : null}

      {catalog
        ? DEMO_SECTIONS.map((section) => (
            <LayoutDemoPanel
              key={section.id}
              section={section}
              active={activeSection === section.id}
              tenant={catalog.tenant}
              entityId={resolveSectionEntityId(section, floorId, buildingId)}
              buildingFloors={selectedBuilding?.floors}
            />
          ))
        : null}
    </div>
  );
}
