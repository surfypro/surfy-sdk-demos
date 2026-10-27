import { useEffect, useState } from 'react';

import { DEMO_APP_VERSION } from './demoVersion';

interface IDemoSdkMetaAttrs {
  readonly version: string;
  readonly floorTag: string;
  readonly buildingTag: string;
  readonly floorRegistered: boolean;
  readonly buildingRegistered: boolean;
}

/**
 * Expose WC SDK meta for E2E (`sdk-coverage.spec.ts`).
 * Loads `@surfy/surfy-sdk` (index / Three) only when mounted — parent should skip on
 * React-only sections (platform-3d) so those pages never pull the WC bundle.
 */
export function DemoSdkMeta() {
  const [meta, setMeta] = useState<IDemoSdkMetaAttrs | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@surfy/surfy-sdk').then(({ SurfySdk }) => {
      if (cancelled) {
        return;
      }
      setMeta({
        version: SurfySdk.version,
        floorTag: SurfySdk.tagForKind('floor-2d'),
        buildingTag: SurfySdk.tagForKind('building-3d'),
        floorRegistered: SurfySdk.isKindRegistered('floor-2d'),
        buildingRegistered: SurfySdk.isKindRegistered('building-3d'),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!meta) {
    return (
      <div
        className="demo-sdk-meta"
        data-testid="demo-sdk-meta"
        data-demo-version={DEMO_APP_VERSION}
        data-sdk-meta-loading="true"
      />
    );
  }

  return (
    <div
      className="demo-sdk-meta"
      data-testid="demo-sdk-meta"
      data-demo-version={DEMO_APP_VERSION}
      data-sdk-version={meta.version}
      data-floor-tag={meta.floorTag}
      data-building-tag={meta.buildingTag}
      data-floor-registered={String(meta.floorRegistered)}
      data-building-registered={String(meta.buildingRegistered)}
    />
  );
}
