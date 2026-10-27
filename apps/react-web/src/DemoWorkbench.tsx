import { Suspense, lazy, useEffect, useState } from 'react';

import { DataApiDemoPanel } from './demos/data/DataApiDemoPanel';
import {
  DEMO_SECTIONS,
  isLayoutSection,
  isPlatformSection,
  type DemoSectionId,
} from './demoSections';
import { DemoScopePicker } from './DemoScopePicker';
import { fetchDemoCatalog, type DemoBuilding, type DemoCatalog, type DemoFloor } from './fetchDemoCatalog';
import { useDemoI18n } from './i18n/DemoI18nProvider';

/** Layout WC panels — pull `@surfy/surfy-sdk` (index + Three). Lazy so platform never loads them. */
const Floor2dDemoPanel = lazy(async () => {
  const m = await import('./demos/layout/floor-2d/Floor2dDemoPanel');
  return { default: m.Floor2dDemoPanel };
});
const Building3dDemoPanel = lazy(async () => {
  const m = await import('./demos/layout/building-3d/Building3dDemoPanel');
  return { default: m.Building3dDemoPanel };
});
const Floor3dDemoPanel = lazy(async () => {
  const m = await import('./demos/layout/floor-3d/Floor3dDemoPanel');
  return { default: m.Floor3dDemoPanel };
});

/** Platform (`platform-3d` ↔ building/3d-maplibre) — `@surfy/surfy-sdk/react` only. */
const PlatformCampusDemoPanel = lazy(async () => {
  const m = await import('./demos/platform/PlatformCampusDemoPanel');
  return { default: m.PlatformCampusDemoPanel };
});

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
  readonly activeSection: DemoSectionId;
}

/**
 * Demo workbench — API session + proxy only.
 * Section from URL (`/:section`). Layout WC vs React platform via `React.lazy`.
 */
export function DemoWorkbench({ activeSection }: DemoWorkbenchProps) {
  const { t } = useDemoI18n();
  const [catalog, setCatalog] = useState<DemoCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [buildingId, setBuildingId] = useState<number | undefined>();
  const [floorId, setFloorId] = useState<number | undefined>();

  useEffect(() => {
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
  }, []);

  const selectedBuilding = catalog?.buildings.find((b) => b.id === buildingId);
  const scopeVariant = activeSection === 'building-3d' ? 'building' : 'floor';
  const activeDemoSection = DEMO_SECTIONS.find((item) => item.id === activeSection);
  const layoutSection =
    activeDemoSection && isLayoutSection(activeDemoSection) ? activeDemoSection : null;
  const platformSection =
    activeDemoSection && isPlatformSection(activeDemoSection) ? activeDemoSection : null;

  const onBuildingChange = (nextBuildingId: number) => {
    setBuildingId(nextBuildingId);
    const building = catalog?.buildings.find((b) => b.id === nextBuildingId);
    setFloorId(building?.floors[0]?.id);
  };

  return (
    <div className="demo-workbench" data-testid="demo-workbench">
      {layoutSection && catalogLoading ? (
        <p data-testid="demo-catalog-loading">{t('workbench.loading')}</p>
      ) : null}

      {layoutSection && catalogError ? (
        <p className="demo-catalog-error" data-testid="demo-catalog-error" role="alert">
          {catalogError}
        </p>
      ) : null}

      {catalog && layoutSection ? (
        <div className="demo-workbench__toolbar">
          <p className="demo-tenant" data-testid="demo-tenant">
            {t('workbench.tenant')}: <code>{catalog.tenant}</code>
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
        </div>
      ) : null}

      {activeSection === 'data-api' ? <DataApiDemoPanel active /> : null}

      <Suspense fallback={<p data-testid="demo-section-loading">{t('workbench.loading')}</p>}>
        {platformSection ? (
          <PlatformCampusDemoPanel
            key={platformSection.id}
            active
            tenant={catalog?.tenant}
            title={platformSection.label}
            description={platformSection.description}
          />
        ) : null}

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

        {catalog && layoutSection?.id === 'floor-3d' ? (
          <Floor3dDemoPanel
            key="floor-3d"
            active
            tenant={catalog.tenant}
            floorId={floorId}
            floor={selectedBuilding?.floors.find((f) => f.id === floorId)}
            title={layoutSection.label}
            description={layoutSection.description}
          />
        ) : null}
      </Suspense>
    </div>
  );
}
