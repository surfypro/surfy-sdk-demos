import type { Handler, HandlerEvent } from '@netlify/functions';
import { loadSurfyDemoAuthEnv, normalizeBaseUrl } from '@surfy/surfy-demo-auth';

/**
 * Proxies /api/v1/* to Surfy so the browser stays same-origin
 * (no Surfy CORS allowlist required for the Netlify domain).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const authEnv = loadSurfyDemoAuthEnv();
    const upstreamPath = resolveUpstreamPath(event);
    const url = new URL(upstreamPath, `${normalizeBaseUrl(authEnv.baseUrl)}/`);

    if (event.rawQuery) {
      url.search = event.rawQuery.startsWith('?') ? event.rawQuery : `?${event.rawQuery}`;
    }

    const headers = new Headers();
    copyRequestHeader(event, headers, 'authorization');
    copyRequestHeader(event, headers, 'content-type');
    copyRequestHeader(event, headers, 'accept');
    copyRequestHeader(event, headers, 'accept-language');
    copyRequestHeader(event, headers, 'x-tenant');
    copyRequestHeader(event, headers, 'x-surfy-sdk-version');

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

  const alt = '/.netlify/functions/surfy-api-proxy';
  if (path === alt) {
    throw new Error('Missing /api/v1 path splat for surfy-api-proxy');
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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-tenant, accept-language, X-Surfy-Sdk-Version, X-Surfy-Demo-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}
