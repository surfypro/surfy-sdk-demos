import { SurfyClient } from '@surfy/surfy-sdk/client';

import { ensureDemoSession, getDemoProxyBearer } from './demoSession';
import { getSurfyDemoBaseUrl } from './surfyEnv';

/** Demo SurfyClient — origin = same-origin proxy; token = opaque demo bearer. */
export async function createDemoSurfyClient(): Promise<SurfyClient> {
  const { tenant } = await ensureDemoSession();
  return SurfyClient.create({
    baseUrl: getSurfyDemoBaseUrl(),
    tenant,
    getAccessToken: getDemoProxyBearer,
  });
}
