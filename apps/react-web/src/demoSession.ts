import { SURFY_DEMO_PROXY_BEARER } from '@surfy/surfy-demo-auth/session';

import { getSurfySessionUrl } from './surfyEnv';

type SessionResponse = {
  tenant: string;
  authMode?: string;
};

let sessionTenant: string | null = null;

function gateHeaders(): HeadersInit | undefined {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  return gate ? { 'X-Surfy-Demo-Key': gate } : undefined;
}

/**
 * Opens API-mode session (HttpOnly cookie). Surfy JWT never enters JS.
 */
export async function ensureDemoSession(): Promise<{ tenant: string }> {
  if (sessionTenant) {
    return { tenant: sessionTenant };
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
  sessionTenant = data.tenant;
  return { tenant: data.tenant };
}

/** Opaque bearer for the SDK — proxy swaps it for the real Surfy JWT. */
export async function getDemoProxyBearer(): Promise<string> {
  await ensureDemoSession();
  return SURFY_DEMO_PROXY_BEARER;
}
