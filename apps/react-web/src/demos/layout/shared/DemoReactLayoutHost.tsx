import { forwardRef, useEffect, useState } from 'react';
import {
  fetchBuildingLayoutData,
  fetchFloorLayoutData,
  type IEmbedLayoutViewData,
  type SurfyLayout3dOptions,
  type SurfySdkErrorDetail,
  type SurfyThemeOptions,
} from '@surfy/surfy-sdk';
import {
  SurfyBuildingLayout3dReact,
  SurfyFloorLayout2dReact,
  SurfyFloorLayout3dReact,
  type ISurfyBuilding3dLayoutApi,
} from '@surfy/surfy-sdk/react';

import { getDemoProxyBearer } from '../../../demoSession';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { useDemoAssetsBaseUrl } from '../../../useDemoAssetsBaseUrl';

interface DemoRoomInteractionDetail {
  readonly roomId: number;
  readonly name: string;
}

interface DemoReactFloorHostProps {
  readonly kind: 'floor-2d' | 'floor-3d';
  readonly tenant: string;
  readonly floorId: number;
}

interface DemoReactBuildingHostProps {
  readonly tenant: string;
  readonly buildingId: number;
  readonly layout3dOptions?: SurfyLayout3dOptions;
  readonly themeOptions?: SurfyThemeOptions;
  readonly onReady?: () => void;
  readonly onError?: (detail: SurfySdkErrorDetail) => void;
  readonly onRoomHover?: (detail: DemoRoomInteractionDetail | null) => void;
  readonly onRoomSelected?: (detail: DemoRoomInteractionDetail) => void;
}

export function DemoReactFloorHost({ kind, tenant, floorId }: DemoReactFloorHostProps) {
  const assetsBaseUrl = useDemoAssetsBaseUrl();
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
  if (!layout || !assetsBaseUrl) {
    return <p data-testid="demo-react-layout-loading">Loading layout…</p>;
  }

  const common = {
    tenant,
    baseUrl: getSurfyDemoBaseUrl(),
    assetsBaseUrl,
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

/**
 * Surfy React Web building-3d host — fetch layout then mount public component.
 * Host chrome (floors / hover log) stays outside via ref + callback props (WI-429 M2).
 */
export const DemoReactBuildingHost = forwardRef<
  ISurfyBuilding3dLayoutApi,
  DemoReactBuildingHostProps
>(function DemoReactBuildingHost(
  {
    tenant,
    buildingId,
    layout3dOptions,
    themeOptions,
    onReady,
    onError,
    onRoomHover,
    onRoomSelected,
  },
  ref,
) {
  const assetsBaseUrl = useDemoAssetsBaseUrl();
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
  if (!layout || !assetsBaseUrl) {
    return <p data-testid="demo-react-layout-loading">Loading layout…</p>;
  }

  return (
    <SurfyBuildingLayout3dReact
      ref={ref}
      tenant={tenant}
      baseUrl={getSurfyDemoBaseUrl()}
      assetsBaseUrl={assetsBaseUrl}
      buildingId={buildingId}
      layoutData={layout as never}
      getAccessToken={() => getDemoProxyBearer()}
      fillParent
      layout3dOptions={layout3dOptions}
      themeOptions={themeOptions}
      onReady={onReady}
      onError={onError}
      onRoomHover={onRoomHover as ((detail: unknown) => void) | undefined}
      onRoomSelected={onRoomSelected as ((detail: unknown) => void) | undefined}
    />
  );
});
