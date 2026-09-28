import { useEffect, useState } from 'react';
import {
  fetchBuildingLayoutData,
  fetchFloorLayoutData,
  type IEmbedLayoutViewData,
} from '@surfy/surfy-sdk';
import {
  SurfyBuildingLayout3dReact,
  SurfyFloorLayout2dReact,
  SurfyFloorLayout3dReact,
} from '@surfy/surfy-sdk/react';

import { getDemoProxyBearer } from '../../../demoSession';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';

interface DemoReactFloorHostProps {
  readonly kind: 'floor-2d' | 'floor-3d';
  readonly tenant: string;
  readonly floorId: number;
}

interface DemoReactBuildingHostProps {
  readonly tenant: string;
  readonly buildingId: number;
}

export function DemoReactFloorHost({ kind, tenant, floorId }: DemoReactFloorHostProps) {
  const [layout, setLayout] = useState<IEmbedLayoutViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    setError(null);
    void fetchFloorLayoutData({
      baseUrl: getSurfyDemoBaseUrl(),
      tenant,
      floorId,
      getAccessToken: () => getDemoProxyBearer(),
    })
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Layout fetch failed');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenant, floorId]);

  if (error) {
    return (
      <p className="demo-catalog-error" data-testid="demo-react-layout-error" role="alert">
        {error}
      </p>
    );
  }
  if (!layout) {
    return <p data-testid="demo-react-layout-loading">Loading layout…</p>;
  }

  const common = {
    tenant,
    baseUrl: getSurfyDemoBaseUrl(),
    floorId,
    layoutData: layout as never,
    getAccessToken: () => getDemoProxyBearer(),
    fillParent: true as const,
  };

  if (kind === 'floor-3d') {
    return <SurfyFloorLayout3dReact {...common} />;
  }
  return <SurfyFloorLayout2dReact {...common} />;
}

export function DemoReactBuildingHost({ tenant, buildingId }: DemoReactBuildingHostProps) {
  const [layout, setLayout] = useState<IEmbedLayoutViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLayout(null);
    setError(null);
    void fetchBuildingLayoutData({
      baseUrl: getSurfyDemoBaseUrl(),
      tenant,
      buildingId,
      getAccessToken: () => getDemoProxyBearer(),
    })
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Layout fetch failed');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tenant, buildingId]);

  if (error) {
    return (
      <p className="demo-catalog-error" data-testid="demo-react-layout-error" role="alert">
        {error}
      </p>
    );
  }
  if (!layout) {
    return <p data-testid="demo-react-layout-loading">Loading layout…</p>;
  }

  return (
    <SurfyBuildingLayout3dReact
      tenant={tenant}
      baseUrl={getSurfyDemoBaseUrl()}
      buildingId={buildingId}
      layoutData={layout as never}
      getAccessToken={() => getDemoProxyBearer()}
      fillParent
    />
  );
}
