import { SURFY_DEMO_PROXY_BEARER } from '@surfy/surfy-demo-auth/session';

import { getSurfySessionUrl } from './surfyEnv';

type SessionResponse = {
  tenant: string;
  authMode?: string;
  /** Surfy host for public `/assets/*` (fonts) — not the demo `/proxy`. */
  assetsOrigin?: string;
};

let sessionTenant: string | null = null;
let sessionAssetsOrigin: string | null = null;

function gateHeaders(): HeadersInit | undefined {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  return gate ? { 'X-Surfy-Demo-Key': gate } : undefined;
}

/**
 * Opens API-mode session (HttpOnly cookie). Surfy JWT never enters JS.
 */
export async function ensureDemoSession(): Promise<{ tenant: string; assetsOrigin: string }> {
  if (sessionTenant && sessionAssetsOrigin) {
    return { tenant: sessionTenant, assetsOrigin: sessionAssetsOrigin };
  }
  const response = await fetch(getSurfySessionUrl(), {
    credentials: 'include',
    headers: gateHeaders(),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? `Session failed (${response.status})`);
  }
  const data = (await response.json()) as SessionResponse;
  if (!data.tenant) {
    throw new Error('Session response missing tenant');
  }
  if (!data.assetsOrigin?.trim()) {
    throw new Error('Session response missing assetsOrigin');
  }
  sessionTenant = data.tenant;
  sessionAssetsOrigin = data.assetsOrigin.replace(/\/$/, '');
  return { tenant: sessionTenant, assetsOrigin: sessionAssetsOrigin };
}

/** Surfy host for fonts / public static assets (bypass `/proxy`). */
export async function getDemoAssetsOrigin(): Promise<string> {
  const session = await ensureDemoSession();
  return session.assetsOrigin;
}

/** Sync peek after {@link ensureDemoSession} — undefined until session opens. */
export function peekDemoAssetsOrigin(): string | undefined {
  return sessionAssetsOrigin ?? undefined;
}

/** Opaque bearer for the SDK — proxy swaps it for the real Surfy JWT. */
export async function getDemoProxyBearer(): Promise<string> {
  await ensureDemoSession();
  return SURFY_DEMO_PROXY_BEARER;
}
