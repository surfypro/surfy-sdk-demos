import { createHmac, timingSafeEqual } from 'node:crypto';

import type { SurfyDemoAuthEnv } from './config.js';

/**
 * Signed demo-session cookie value.
 *
 * The old cookie value was the literal `1` — present-or-not, trivially forgeable,
 * so the proxy could be hit without ever passing the `/api/session` gate. This
 * module makes the cookie an HMAC-signed, expiring token so the proxy can *verify*
 * a session was legitimately opened (gate honored) instead of just checking presence.
 *
 * Server-only (uses `node:crypto`) — never import from browser code.
 */

/** Session lifetime; kept in sync with the cookie `Max-Age`. */
export const SURFY_DEMO_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type SessionTokenPayload = {
  /** Schema version, so the format can evolve. */
  readonly v: 1;
  /** Absolute expiry, epoch ms. */
  readonly exp: number;
};

/**
 * HMAC secret for signing the session cookie.
 *
 * Prefers an explicit `DEMO_SESSION_SECRET`; otherwise derives from the server-only
 * `client_secret` so the feature works with zero extra config. Either way the secret
 * never leaves the server (never a `VITE_*`).
 */
function resolveSessionSecret(
  authEnv: SurfyDemoAuthEnv,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = env.DEMO_SESSION_SECRET?.trim();
  if (explicit) return explicit;
  return `surfy-demo-session:${authEnv.clientSecret}`;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

export type SessionTokenOptions = {
  readonly now?: number;
  readonly ttlMs?: number;
  readonly env?: NodeJS.ProcessEnv;
};

/** Mint a signed session cookie value: `<payload>.<hmac>` (base64url, no padding). */
export function createSurfyDemoSessionToken(
  authEnv: SurfyDemoAuthEnv,
  options: SessionTokenOptions = {},
): string {
  const now = options.now ?? Date.now();
  const ttlMs = options.ttlMs ?? SURFY_DEMO_SESSION_TTL_MS;
  const secret = resolveSessionSecret(authEnv, options.env);
  const payload: SessionTokenPayload = { v: 1, exp: now + ttlMs };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

/**
 * Verify a session cookie value: correct HMAC (constant-time) and not expired.
 * The legacy literal `1` value is intentionally rejected.
 */
export function verifySurfyDemoSessionToken(
  token: string | null | undefined,
  authEnv: SurfyDemoAuthEnv,
  options: Pick<SessionTokenOptions, 'now' | 'env'> = {},
): boolean {
  if (!token) return false;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return false;

  const secret = resolveSessionSecret(authEnv, options.env);
  const expected = sign(payloadB64, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as Partial<SessionTokenPayload>;
    const now = options.now ?? Date.now();
    return typeof payload.exp === 'number' && payload.exp > now;
  } catch {
    return false;
  }
}
