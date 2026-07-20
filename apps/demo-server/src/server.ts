import express, { type NextFunction, type Request, type Response } from 'express';
import {
  assertDemoGate,
  demoAuthErrorBody,
  DemoGateError,
  fetchSurfyAccessToken,
  forwardSurfyProxyRequest,
  httpStatusFromDemoAuthError,
  loadSurfyDemoAuthEnv,
  resolveSurfyProxyUpstreamPath,
  SurfyConfigError,
  type SurfyDemoAuthEnv,
  SURFY_DEMO_PROXY_BEARER,
  SURFY_DEMO_PROXY_PATH_PREFIX,
  SURFY_DEMO_SESSION_COOKIE,
  SURFY_DEMO_API_ORIGIN_HEADER,
} from '@surfy/surfy-demo-auth';

type SessionResponse = {
  tenant: string;
  authMode: 'api';
};

type ErrorResponse = {
  error: string;
  code?: string;
};

const app = express();
const port = Number(process.env.PORT ?? 8787);
const cookieSecure = process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';

/** Lazy so a bad SURFY_CONNECTION_STRING returns JSON 500 instead of crashing at boot. */
let authEnvCache: SurfyDemoAuthEnv | undefined;

function getAuthEnv(): SurfyDemoAuthEnv {
  authEnvCache ??= loadSurfyDemoAuthEnv();
  return authEnvCache;
}

function sendAuthError(res: Response, error: unknown, fallbackMessage: string): void {
  if (error instanceof DemoGateError) {
    res.status(error.status).json(demoAuthErrorBody(error, error.message));
    return;
  }
  if (error instanceof SurfyConfigError && error.message.includes('proxy bearer')) {
    res.status(400).json(demoAuthErrorBody(error, error.message));
    return;
  }
  res.status(httpStatusFromDemoAuthError(error, 500)).json(demoAuthErrorBody(error, fallbackMessage));
}

function readDemoGateKey(req: Request): string | undefined {
  const header = req.header('x-surfy-demo-key');
  if (header) return header;
  const query = req.query.key;
  return typeof query === 'string' ? query : undefined;
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function setSessionCookie(res: Response): void {
  const maxAge = 60 * 60 * 8; // 8h
  const parts = [
    `${SURFY_DEMO_SESSION_COOKIE}=1`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (cookieSecure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (!readCookie(req, SURFY_DEMO_SESSION_COOKIE)) {
    res.status(401).json({ error: 'Demo session required — call GET /api/session first' });
    return;
  }
  next();
}

async function resolveSurfyBearer(authEnv: SurfyDemoAuthEnv): Promise<string> {
  return fetchSurfyAccessToken({
    baseUrl: authEnv.baseUrl,
    clientId: authEnv.clientId,
    clientSecret: authEnv.clientSecret,
    tlsInsecure: authEnv.tlsInsecure,
  });
}

/**
 * Opens an API-mode demo session.
 * Surfy JWT stays on the server; browser only gets HttpOnly session cookie + public tenant.
 */
app.get('/api/session', async (req: Request, res: Response<SessionResponse | ErrorResponse>) => {
  try {
    const authEnv = getAuthEnv();
    assertDemoGate(readDemoGateKey(req), authEnv.demoGateKey);
    await resolveSurfyBearer(authEnv); // warm cache / fail fast
    setSessionCookie(res);
    res.json({ tenant: authEnv.clientId, authMode: 'api' });
  } catch (error) {
    sendAuthError(res, error, 'Session failed');
  }
});

/** @deprecated Use GET /api/session — never returns the Surfy JWT. */
app.get('/api/surfy-token', async (req: Request, res: Response) => {
  try {
    const authEnv = getAuthEnv();
    assertDemoGate(readDemoGateKey(req), authEnv.demoGateKey);
    await resolveSurfyBearer(authEnv);
    setSessionCookie(res);
    res.json({
      tenant: authEnv.clientId,
      authMode: 'api',
      proxyBearer: SURFY_DEMO_PROXY_BEARER,
    });
  } catch (error) {
    sendAuthError(res, error, 'Token exchange failed');
  }
});

app.get('/api/health', (_req: Request, res: Response<{ status: 'ok' }>) => {
  res.json({ status: 'ok' });
});

/**
 * Unique Surfy proxy — does not implement Surfy routes.
 * Browser: `/proxy/api/v1/...` (+ optional `?surfyApiOrigin=` / `X-Surfy-API-Origin`).
 * Server injects Bearer from SURFY_CONNECTION_STRING and forwards method/query/body.
 */
app.use(SURFY_DEMO_PROXY_PATH_PREFIX, requireSession, async (req: Request, res: Response) => {
  try {
    const authEnv = getAuthEnv();
    const upstreamPath = resolveSurfyProxyUpstreamPath(
      `${SURFY_DEMO_PROXY_PATH_PREFIX}${req.url.split('?')[0] || ''}`,
    );
    const rawQuery = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : undefined;

    const chunks: Buffer[] = [];
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    }

    const extraHeaders: Record<string, string> = {};
    for (const name of ['connect-protocol-version', 'connect-timeout-ms']) {
      const value = req.header(name);
      if (value) extraHeaders[name] = value;
    }

    const result = await forwardSurfyProxyRequest({
      authEnv,
      method: req.method,
      upstreamPath,
      rawQuery,
      incomingAuthorization: req.header('authorization'),
      contentType: req.header('content-type'),
      accept: req.header('accept'),
      acceptLanguage: req.header('accept-language'),
      xTenant: req.header('x-tenant'),
      sdkVersion: req.header('x-surfy-sdk-version'),
      apiOriginHeader: req.header(SURFY_DEMO_API_ORIGIN_HEADER),
      extraHeaders,
      body: chunks.length > 0 ? Buffer.concat(chunks) : null,
    });

    res.status(result.status);
    res.setHeader('Content-Type', result.contentType);
    res.send(result.body);
  } catch (error) {
    sendAuthError(res, error, 'Upstream proxy failed');
  }
});

app.listen(port, () => {
  console.log(`Surfy demo server listening on http://localhost:${port}`);
  console.log(
    `  session: GET /api/session  |  proxy: ${SURFY_DEMO_PROXY_PATH_PREFIX}/api/v1/* (Bearer injected)`,
  );
});
