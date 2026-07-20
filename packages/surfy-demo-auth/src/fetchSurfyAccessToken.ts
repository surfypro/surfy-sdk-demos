import { SurfyUpstreamAuthError } from './errors.js';

export type SurfyTokenApiResponse = {
  access_token?: string;
  token?: string;
  expires_in?: number;
  sub?: string;
  ok?: boolean;
};

export type FetchSurfyAccessTokenParams = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tlsInsecure?: boolean;
};

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

function resolveAccessToken(payload: SurfyTokenApiResponse): string {
  const token = payload.access_token ?? payload.token;
  if (!token) {
    throw new SurfyUpstreamAuthError('Surfy authentication response did not include access_token/token');
  }
  return token;
}

/**
 * Exchanges Surfy API credentials for a short-lived JWT.
 * Must only run server-side (demo-server or Netlify Function).
 *
 * @throws {SurfyUpstreamAuthError} when Surfy auth is unreachable or rejects credentials
 */
export async function fetchSurfyAccessToken({
  baseUrl,
  clientId,
  clientSecret,
  tlsInsecure = false,
}: FetchSurfyAccessTokenParams): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (tlsInsecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  try {
    let response: Response;
    try {
      response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/v1/authentication/token`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, clientSecret }),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'network error';
      throw new SurfyUpstreamAuthError(`Surfy authentication unreachable: ${detail}`);
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new SurfyUpstreamAuthError(
        `Surfy authentication failed (${response.status}): ${detail || response.statusText}`,
      );
    }

    const payload = (await response.json()) as SurfyTokenApiResponse;
    const token = resolveAccessToken(payload);
    const expiresIn = payload.expires_in ?? 300;
    cachedToken = {
      token,
      expiresAt: now + expiresIn * 1000,
    };
    return token;
  } finally {
    if (tlsInsecure) {
      if (previousTlsSetting === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
      }
    }
  }
}

export function clearCachedSurfyAccessToken(): void {
  cachedToken = null;
}
