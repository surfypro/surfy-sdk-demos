import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  demoAuthErrorBody,
  forwardSurfyProxyRequest,
  httpStatusFromDemoAuthError,
  loadSurfyDemoAuthEnv,
  resolveSurfyProxyUpstreamPath,
  SurfyConfigError,
  SURFY_DEMO_SESSION_COOKIE,
  SURFY_DEMO_API_ORIGIN_HEADER,
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

function readHeader(event: HandlerEvent, name: string): string | undefined {
  return event.headers[name] ?? event.headers[name.toLowerCase()] ?? undefined;
}

/**
 * Unique Surfy proxy (Netlify) — relays any Surfy path under `/proxy/*`.
 * Does not implement Surfy API routes; only injects Bearer server-side.
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
    const extraHeaders: Record<string, string> = {};
    for (const name of ['connect-protocol-version', 'connect-timeout-ms']) {
      const value = readHeader(event, name);
      if (value) extraHeaders[name] = value;
    }

    const result = await forwardSurfyProxyRequest({
      authEnv,
      method: event.httpMethod,
      upstreamPath,
      rawQuery: event.rawQuery,
      incomingAuthorization:
        event.headers.authorization ?? event.headers.Authorization ?? undefined,
      contentType: readHeader(event, 'content-type'),
      accept: readHeader(event, 'accept'),
      acceptLanguage: readHeader(event, 'accept-language'),
      xTenant: readHeader(event, 'x-tenant'),
      sdkVersion: readHeader(event, 'x-surfy-sdk-version'),
      apiOriginHeader: readHeader(event, SURFY_DEMO_API_ORIGIN_HEADER),
      extraHeaders,
      body:
        event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD'
          ? event.isBase64Encoded
            ? Buffer.from(event.body, 'base64')
            : event.body
          : null,
    });

    return {
      statusCode: result.status,
      headers: {
        'Content-Type': result.contentType,
        ...corsHeaders(),
      },
      body: result.body.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    const status =
      error instanceof SurfyConfigError && error.message.includes('proxy bearer')
        ? 400
        : httpStatusFromDemoAuthError(error, 500);
    return {
      statusCode: status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      body: JSON.stringify(demoAuthErrorBody(error, 'Upstream proxy failed')),
    };
  }
};

function resolveUpstreamPath(event: HandlerEvent): string {
  const path = event.path;

  if (path.startsWith('/proxy/')) {
    return resolveSurfyProxyUpstreamPath(path);
  }

  const marker = '/.netlify/functions/surfy-api-proxy/';
  if (path.startsWith(marker)) {
    const rest = path.slice(marker.length);
    return resolveSurfyProxyUpstreamPath(`/proxy/${rest}`);
  }

  // Legacy rewrite /api/v1/* → treat as /proxy/api/v1/*
  if (path.startsWith('/api/v1/')) {
    return path;
  }

  throw new SurfyConfigError(`Unable to resolve Surfy upstream path from ${path}`);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-tenant, accept-language, X-Surfy-Sdk-Version, X-Surfy-Demo-Key, X-Surfy-API-Origin, Connect-Protocol-Version, Connect-Timeout-Ms',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}
