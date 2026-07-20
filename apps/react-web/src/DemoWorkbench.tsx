import { useEffect, useState } from 'react';

import { DataApiDemoPanel } from './demos/data/DataApiDemoPanel';
import { Building3dDemoPanel } from './demos/layout/building-3d/Building3dDemoPanel';
import { Floor2dDemoPanel } from './demos/layout/floor-2d/Floor2dDemoPanel';
import type { DemoAuthMode } from './demoRoutes';
import {
  DEMO_SECTIONS,
  isLayoutSection,
  type DemoSectionId,
} from './demoSections';
import { DemoScopePicker } from './DemoScopePicker';
import { fetchDemoCatalog, type DemoBuilding, type DemoCatalog, type DemoFloor } from './fetchDemoCatalog';
import { useDemoI18n } from './i18n/DemoI18nProvider';

const EMPTY_FLOORS: readonly DemoFloor[] = [];

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
 */
export function DemoWorkbench({ embedded = false, authMode, activeSection }: DemoWorkbenchProps) {
  const { t } = useDemoI18n();
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
  const activeDemoSection = DEMO_SECTIONS.find((item) => item.id === activeSection);
  const layoutSection =
    activeDemoSection && isLayoutSection(activeDemoSection) ? activeDemoSection : null;

  const onBuildingChange = (nextBuildingId: number) => {
    setBuildingId(nextBuildingId);
    const building = catalog?.buildings.find((b) => b.id === nextBuildingId);
    setFloorId(building?.floors[0]?.id);
  };

  if (authMode === 'oauth') {
    return (
      <div className="demo-workbench" data-testid="demo-workbench-oauth">
        <div className="demo-section__unavailable" data-testid="oauth-coming-soon">
          <p>{t('oauth.comingSoon')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`demo-workbench${embedded ? ' demo-workbench--embedded' : ''}`}
      data-testid="demo-workbench"
    >
      {!embedded ? <p className="page__intro demo-workbench__intro">{t('workbench.intro')}</p> : null}

      {layoutSection && catalogLoading ? (
        <p data-testid="demo-catalog-loading">{t('workbench.loading')}</p>
      ) : null}

      {layoutSection && catalogError ? (
        <p className="demo-catalog-error" data-testid="demo-catalog-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      {catalog && layoutSection ? (
        <>
          <p className="demo-tenant" data-testid="demo-tenant">
            {t('workbench.tenant')}: <code>{catalog.tenant}</code> · {t('workbench.session')}
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
            <p className="demo-catalog-hint">{t('workbench.noFloors')}</p>
          ) : null}
        </>
      ) : null}

      {activeSection === 'data-api' ? <DataApiDemoPanel active /> : null}

      {catalog && layoutSection?.id === 'floor-2d' ? (
        <Floor2dDemoPanel
          key="floor-2d"
          active
          tenant={catalog.tenant}
          floorId={floorId}
          title={layoutSection.label}
          description={layoutSection.description}
        />
      ) : null}

      {catalog && layoutSection?.id === 'building-3d' ? (
        <Building3dDemoPanel
          key="building-3d"
          active
          tenant={catalog.tenant}
          buildingId={buildingId}
          buildingFloors={selectedBuilding?.floors ?? EMPTY_FLOORS}
          title={layoutSection.label}
          description={layoutSection.description}
        />
      ) : null}
    </div>
  );
}
