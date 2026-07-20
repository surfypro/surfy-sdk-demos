/**
 * Client-side URL helpers for the React web demo.
 *
 * Browser → same origin only:
 *   GET  /api/session   → HttpOnly cookie (Surfy JWT stays on server)
 *   POST /api/v1/...    → proxy injects Bearer from SURFY_CONNECTION_STRING
 */

/** Origin passed to SDK web components (= page origin). */
export function getSurfyDemoBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function getSurfySessionUrl(): string {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  if (gate) {
    return `/api/session?key=${encodeURIComponent(gate)}`;
  }
  return '/api/session';
}

export function getSurfyApiPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.startsWith('/api/v1') ? normalized : `/api/v1${normalized}`;
}
