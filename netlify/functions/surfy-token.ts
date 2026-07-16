import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  assertDemoGate,
  DemoGateError,
  fetchSurfyAccessToken,
  loadSurfyDemoAuthEnv,
} from '@surfy/surfy-demo-auth';

function readDemoGateKey(event: HandlerEvent): string | undefined {
  const header = event.headers['x-surfy-demo-key'] ?? event.headers['X-Surfy-Demo-Key'];
  if (header) return header;
  const raw = event.queryStringParameters?.key;
  return raw || undefined;
}

/**
 * GET /api/surfy-token → short-lived Surfy JWT.
 * Secrets: SURFY_CONNECTION_STRING (Netlify env only — never VITE_*).
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
    const token = await fetchSurfyAccessToken({
      baseUrl: authEnv.baseUrl,
      clientId: authEnv.clientId,
      clientSecret: authEnv.clientSecret,
      tlsInsecure: authEnv.tlsInsecure,
    });
    // tenant (= clientId) is public; secret stays server-side in SURFY_CONNECTION_STRING
    return json(200, { token, tenant: authEnv.clientId });
  } catch (error) {
    if (error instanceof DemoGateError) {
      return json(error.status, { error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Token exchange failed';
    return json(502, { error: message });
  }
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
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
