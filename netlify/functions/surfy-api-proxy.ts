import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  fetchSurfyAccessToken,
  isDemoProxyBearer,
  loadSurfyDemoAuthEnv,
  normalizeBaseUrl,
  SURFY_DEMO_SESSION_COOKIE,
} from '@surfy/surfy-demo-auth';

function readCookie(event: HandlerEvent, name: string): string | undefined {
  const raw = event.headers.cookie ?? event.headers.Cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/**
 * Proxies /api/v1/* → Surfy and injects the API Bearer from SURFY_CONNECTION_STRING.
 * Browser never receives the Surfy JWT (session cookie + opaque proxy bearer only).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const authEnv = loadSurfyDemoAuthEnv();
    if (!readCookie(event, SURFY_DEMO_SESSION_COOKIE)) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        body: JSON.stringify({ error: 'Demo session required — call GET /api/session first' }),
      };
    }

    const upstreamPath = resolveUpstreamPath(event);
    const url = new URL(upstreamPath, `${normalizeBaseUrl(authEnv.baseUrl)}/`);

    if (event.rawQuery) {
      url.search = event.rawQuery.startsWith('?') ? event.rawQuery : `?${event.rawQuery}`;
    }

    const headers = new Headers();
    copyRequestHeader(event, headers, 'content-type');
    copyRequestHeader(event, headers, 'accept');
    copyRequestHeader(event, headers, 'accept-language');
    copyRequestHeader(event, headers, 'x-tenant');
    copyRequestHeader(event, headers, 'x-surfy-sdk-version');
    if (!headers.has('x-tenant')) {
      headers.set('x-tenant', authEnv.clientId);
    }

    const incomingAuth =
      event.headers.authorization ?? event.headers.Authorization ?? undefined;
    if (incomingAuth && !isDemoProxyBearer(incomingAuth)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        body: JSON.stringify({ error: 'Use session proxy bearer only (surfy-demo-proxy)' }),
      };
    }

    const token = await fetchSurfyAccessToken({
      baseUrl: authEnv.baseUrl,
      clientId: authEnv.clientId,
      clientSecret: authEnv.clientSecret,
      tlsInsecure: authEnv.tlsInsecure,
    });
    headers.set('authorization', `Bearer ${token}`);

    const init: RequestInit = {
      method: event.httpMethod,
      headers,
    };
    if (event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
      init.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
    }

    const response = await fetch(url, init);
    const responseBody = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        ...corsHeaders(),
      },
      body: responseBody.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream proxy failed';
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      body: JSON.stringify({ error: message }),
    };
  }
};

function resolveUpstreamPath(event: HandlerEvent): string {
  const path = event.path;

  if (path.startsWith('/api/v1/')) {
    return path;
  }

  const marker = '/.netlify/functions/surfy-api-proxy/';
  if (path.startsWith(marker)) {
    return `/api/v1/${path.slice(marker.length)}`;
  }

  throw new Error(`Unable to resolve upstream path from ${path}`);
}

function copyRequestHeader(event: HandlerEvent, headers: Headers, name: string): void {
  const value = event.headers[name] ?? event.headers[name.toLowerCase()];
  if (value) {
    headers.set(name, value);
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-tenant, accept-language, X-Surfy-Sdk-Version, X-Surfy-Demo-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}
