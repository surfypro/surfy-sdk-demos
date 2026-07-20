/**
 * Client-side URL helpers for the React web demo.
 *
 * Browser → same origin only:
 *   GET  /api/session     → HttpOnly cookie (Surfy JWT stays on server)
 *   *    /proxy/api/v1/…  → unique proxy injects Bearer (optional ?surfyApiOrigin=)
 */

import { SURFY_DEMO_PROXY_PATH_PREFIX } from '@surfy/surfy-demo-auth/session';

/** SDK / SurfyClient baseUrl = same-origin proxy prefix (not Surfy host). */
export function getSurfyDemoBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${SURFY_DEMO_PROXY_PATH_PREFIX}`;
  }
  return SURFY_DEMO_PROXY_PATH_PREFIX;
}

export function getSurfySessionUrl(): string {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  if (gate) {
    return `/api/session?key=${encodeURIComponent(gate)}`;
  }
  return '/api/session';
}

/** @deprecated Prefer SurfyClient with getSurfyDemoBaseUrl(); kept for ad-hoc paths. */
export function getSurfyApiPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalized.startsWith('/api/v1') ? normalized : `/api/v1${normalized}`;
  return `${SURFY_DEMO_PROXY_PATH_PREFIX}${apiPath}`;
}
