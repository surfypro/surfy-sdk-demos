/**
 * Public (Vite) env helpers for the React web demo.
 * Never put SURFY_CONNECTION_STRING / client_secret here — only VITE_* values reach the browser.
 */

/** API origin for the SDK. Empty → same origin (Netlify proxy to Surfy). */
export function getSurfyDemoBaseUrl(): string {
  const configured = import.meta.env.VITE_SURFY_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/** Token endpoint + optional public demo gate key (not the Surfy API secret). */
export function getSurfyTokenUrl(): string {
  const url = new URL('/api/surfy-token', getSurfyDemoBaseUrl() || 'http://localhost');
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  if (gate) {
    url.searchParams.set('key', gate);
  }
  // When base is same-origin, use path-only for fetch
  if (!import.meta.env.VITE_SURFY_BASE_URL?.trim()) {
    return `${url.pathname}${url.search}`;
  }
  return url.toString();
}
