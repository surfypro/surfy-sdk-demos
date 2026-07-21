import { SurfySdk } from '@surfy/surfy-sdk';

import { DEMO_APP_VERSION } from './demoVersion';

/** Expose SDK meta for E2E (no window global) — see `sdk-coverage.spec.ts`. */
export function DemoSdkMeta() {
  return (
    <div
      className="demo-sdk-meta"
      data-testid="demo-sdk-meta"
      data-demo-version={DEMO_APP_VERSION}
      data-sdk-version={SurfySdk.version}
      data-floor-tag={SurfySdk.tagForKind('floor-2d')}
      data-building-tag={SurfySdk.tagForKind('building-3d')}
      data-floor-registered={String(SurfySdk.isKindRegistered('floor-2d'))}
      data-building-registered={String(SurfySdk.isKindRegistered('building-3d'))}
    />
  );
}
