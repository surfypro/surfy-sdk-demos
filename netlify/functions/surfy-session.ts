import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  assertDemoGate,
  createSurfyDemoSessionToken,
  demoAuthErrorBody,
  DemoGateError,
  fetchSurfyAccessToken,
  httpStatusFromDemoAuthError,
  loadSurfyDemoAuthEnv,
  SURFY_DEMO_PROXY_BEARER,
  SURFY_DEMO_SESSION_COOKIE,
  type SurfyDemoAuthEnv,
} from '@surfy/surfy-demo-auth';

function readDemoGateKey(event: HandlerEvent): string | undefined {
  const header = event.headers['x-surfy-demo-key'] ?? event.headers['X-Surfy-Demo-Key'];
  if (header) return header;
  const raw = event.queryStringParameters?.key;
  return raw || undefined;
}

function sessionCookieHeader(authEnv: SurfyDemoAuthEnv, secure: boolean): string {
  const token = createSurfyDemoSessionToken(authEnv);
  const parts = [
    `${SURFY_DEMO_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 8}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/**
 * GET /api/session — API-mode demo session (no Surfy JWT in the response body).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const authEnv = loadSurfyDemoAuthEnv();
    assertDemoGate(readDemoGateKey(event), authEnv.demoGateKey);
    await fetchSurfyAccessToken({
      baseUrl: authEnv.baseUrl,
      clientId: authEnv.clientId,
      clientSecret: authEnv.clientSecret,
      tlsInsecure: authEnv.tlsInsecure,
    });
    const secure = true; // Netlify HTTPS
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookieHeader(authEnv, secure),
        ...corsHeaders(),
      },
      body: JSON.stringify({
        tenant: authEnv.clientId,
        authMode: 'api',
        proxyBearer: SURFY_DEMO_PROXY_BEARER,
      }),
    };
  } catch (error) {
    if (error instanceof DemoGateError) {
      return json(error.status, demoAuthErrorBody(error, error.message));
    }
    return json(httpStatusFromDemoAuthError(error, 500), demoAuthErrorBody(error, 'Session failed'));
  }
};

function corsHeaders(): Record<string, string> {
  // Same-origin redirects on Netlify — no wildcard + credentials (invalid).
  return {
    'Access-Control-Allow-Headers': 'Content-Type, X-Surfy-Demo-Key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
    body: JSON.stringify(body),
  };
}
