import type { SurfyDemoAuthEnv } from './config.js';
import {
  SURFY_DEMO_PROXY_PATH_PREFIX,
  isDemoProxyBearer,
} from './demoSession.js';
import {
  sanitizeDemoHttpStatus,
  SurfyConfigError,
} from './errors.js';
import { fetchSurfyAccessToken, normalizeBaseUrl } from './fetchSurfyAccessToken.js';

export { SURFY_DEMO_PROXY_PATH_PREFIX } from './demoSession.js';

/** Query/header to override Surfy API origin for this request (defaults to connection-string host). */
export const SURFY_DEMO_API_ORIGIN_QUERY = 'surfyApiOrigin';
export const SURFY_DEMO_API_ORIGIN_HEADER = 'x-surfy-api-origin';

export type SurfyProxyForwardInput = {
  readonly authEnv: SurfyDemoAuthEnv;
  readonly method: string;
  /** Path after `/proxy`, e.g. `/api/v1/data/entities` (must start with `/`). */
  readonly upstreamPath: string;
  /** Raw query string without leading `?` (may include `surfyApiOrigin` — stripped before forward). */
  readonly rawQuery?: string;
  readonly incomingAuthorization?: string | null;
  readonly contentType?: string | null;
  readonly accept?: string | null;
  readonly acceptLanguage?: string | null;
  readonly xTenant?: string | null;
  readonly sdkVersion?: string | null;
  readonly apiOriginHeader?: string | null;
  /** Extra headers to forward (e.g. Connect RPC `connect-protocol-version`). */
  readonly extraHeaders?: Readonly<Record<string, string>>;
  readonly body?: Buffer | string | null;
};

export type SurfyProxyForwardResult = {
  readonly status: number;
  readonly contentType: string;
  readonly body: Buffer;
};

function stripProxyQueryParams(rawQuery: string | undefined): {
  search: string;
  originOverride?: string;
} {
  if (!rawQuery?.trim()) {
    return { search: '' };
  }
  const params = new URLSearchParams(
    rawQuery.startsWith('?') ? rawQuery.slice(1) : rawQuery,
  );
  const originOverride = params.get(SURFY_DEMO_API_ORIGIN_QUERY)?.trim() || undefined;
  params.delete(SURFY_DEMO_API_ORIGIN_QUERY);
  const search = params.toString();
  return { search: search ? `?${search}` : '', originOverride };
}

function resolveUpstreamOrigin(
  authEnv: SurfyDemoAuthEnv,
  queryOrigin: string | undefined,
  headerOrigin: string | null | undefined,
): string {
  const override = headerOrigin?.trim() || queryOrigin;
  return normalizeBaseUrl(override || authEnv.baseUrl);
}

/**
 * Strip `/proxy` prefix from a request path.
 * Accepts `/proxy/api/v1/...` or bare `/api/v1/...` (legacy).
 */
export function resolveSurfyProxyUpstreamPath(requestPath: string): string {
  const path = requestPath.split('?')[0] ?? requestPath;
  if (path === SURFY_DEMO_PROXY_PATH_PREFIX || path === `${SURFY_DEMO_PROXY_PATH_PREFIX}/`) {
    throw new SurfyConfigError(
      'Proxy path missing — use /proxy/api/v1/... (Surfy API path after /proxy)',
    );
  }
  if (path.startsWith(`${SURFY_DEMO_PROXY_PATH_PREFIX}/`)) {
    const rest = path.slice(SURFY_DEMO_PROXY_PATH_PREFIX.length);
    if (!rest.startsWith('/')) {
      throw new SurfyConfigError(`Invalid proxy path "${path}"`);
    }
    return rest;
  }
  if (path.startsWith('/api/v1/')) {
    return path;
  }
  throw new SurfyConfigError(
    `Unable to resolve Surfy upstream path from "${path}" (expected /proxy/api/v1/...)`,
  );
}

/**
 * Single forwarder: demo server is not Surfy — it only injects the Bearer and relays.
 */
export async function forwardSurfyProxyRequest(
  input: SurfyProxyForwardInput,
): Promise<SurfyProxyForwardResult> {
  const { search, originOverride } = stripProxyQueryParams(input.rawQuery);
  const upstreamOrigin = resolveUpstreamOrigin(
    input.authEnv,
    originOverride,
    input.apiOriginHeader,
  );

  if (input.incomingAuthorization && !isDemoProxyBearer(input.incomingAuthorization)) {
    throw new SurfyConfigError('Use session proxy bearer only (surfy-demo-proxy)');
  }

  const token = await fetchSurfyAccessToken({
    baseUrl: upstreamOrigin,
    clientId: input.authEnv.clientId,
    clientSecret: input.authEnv.clientSecret,
    tlsInsecure: input.authEnv.tlsInsecure,
  });

  const url = new URL(input.upstreamPath + search, `${upstreamOrigin}/`);
  const headers = new Headers();
  if (input.contentType) headers.set('content-type', input.contentType);
  if (input.accept) headers.set('accept', input.accept);
  if (input.acceptLanguage) headers.set('accept-language', input.acceptLanguage);
  headers.set('x-tenant', input.xTenant?.trim() || input.authEnv.clientId);
  if (input.sdkVersion) headers.set('x-surfy-sdk-version', input.sdkVersion);
  if (input.extraHeaders) {
    for (const [name, value] of Object.entries(input.extraHeaders)) {
      if (value) headers.set(name, value);
    }
  }
  headers.set('authorization', `Bearer ${token}`);

  const init: RequestInit = {
    method: input.method,
    headers,
  };
  if (
    input.body != null &&
    input.body !== '' &&
    input.method !== 'GET' &&
    input.method !== 'HEAD'
  ) {
    init.body = typeof input.body === 'string' ? input.body : new Uint8Array(input.body);
  }

  const response = await fetch(url, init);
  const body = Buffer.from(await response.arrayBuffer());
  return {
    status: sanitizeDemoHttpStatus(response.status),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    body,
  };
}
