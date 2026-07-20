import express, { type NextFunction, type Request, type Response } from 'express';
import {
  assertDemoGate,
  DemoGateError,
  fetchSurfyAccessToken,
  isDemoProxyBearer,
  loadSurfyDemoAuthEnv,
  normalizeBaseUrl,
  SURFY_DEMO_PROXY_BEARER,
  SURFY_DEMO_SESSION_COOKIE,
} from '@surfy/surfy-demo-auth';

type SessionResponse = {
  tenant: string;
  authMode: 'api';
};

type ErrorResponse = {
  error: string;
};

const authEnv = loadSurfyDemoAuthEnv();
const app = express();
const port = Number(process.env.PORT ?? 8787);
const cookieSecure = process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';

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

async function resolveSurfyBearer(): Promise<string> {
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
    assertDemoGate(readDemoGateKey(req), authEnv.demoGateKey);
    await resolveSurfyBearer(); // warm cache / fail fast
    setSessionCookie(res);
    res.json({ tenant: authEnv.clientId, authMode: 'api' });
  } catch (error) {
    if (error instanceof DemoGateError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Session failed';
    res.status(502).json({ error: message });
  }
});

/** @deprecated Use GET /api/session — never returns the Surfy JWT. */
app.get('/api/surfy-token', async (req: Request, res: Response) => {
  try {
    assertDemoGate(readDemoGateKey(req), authEnv.demoGateKey);
    await resolveSurfyBearer();
    setSessionCookie(res);
    res.json({
      tenant: authEnv.clientId,
      authMode: 'api',
      // Intentionally no `token` — clients must use the proxy session.
      proxyBearer: SURFY_DEMO_PROXY_BEARER,
    });
  } catch (error) {
    if (error instanceof DemoGateError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Token exchange failed';
    res.status(502).json({ error: message });
  }
});

app.get('/api/health', (_req: Request, res: Response<{ status: 'ok' }>) => {
  res.json({ status: 'ok' });
});

/**
 * Same-origin Surfy proxy: injects API Bearer from connection string.
 * Browser may send Authorization: Bearer surfy-demo-proxy (SDK) — never the real JWT.
 */
app.use('/api/v1', requireSession, async (req: Request, res: Response) => {
  try {
    const upstreamPath = req.originalUrl; // includes /api/v1/...
    const url = new URL(upstreamPath, `${normalizeBaseUrl(authEnv.baseUrl)}/`);

    const headers = new Headers();
    const contentType = req.header('content-type');
    if (contentType) headers.set('content-type', contentType);
    const accept = req.header('accept');
    if (accept) headers.set('accept', accept);
    const acceptLanguage = req.header('accept-language');
    if (acceptLanguage) headers.set('accept-language', acceptLanguage);
    const xTenant = req.header('x-tenant') ?? authEnv.clientId;
    headers.set('x-tenant', xTenant);
    const sdkVersion = req.header('x-surfy-sdk-version');
    if (sdkVersion) headers.set('x-surfy-sdk-version', sdkVersion);

    const incomingAuth = req.header('authorization');
    if (isDemoProxyBearer(incomingAuth)) {
      const token = await resolveSurfyBearer();
      headers.set('authorization', `Bearer ${token}`);
    } else if (incomingAuth) {
      // Reject leaking real tokens from the browser in API demo mode
      res.status(400).json({ error: 'Use session proxy bearer only (surfy-demo-proxy)' });
      return;
    } else {
      const token = await resolveSurfyBearer();
      headers.set('authorization', `Bearer ${token}`);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      if (chunks.length > 0) {
        init.body = Buffer.concat(chunks);
      }
    }

    const response = await fetch(url, init);
    const body = Buffer.from(await response.arrayBuffer());
    res.status(response.status);
    const ct = response.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream proxy failed';
    res.status(502).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Surfy demo server listening on http://localhost:${port}`);
  console.log(`  session: GET /api/session  |  proxy: /api/v1/* (Bearer injected server-side)`);
});
