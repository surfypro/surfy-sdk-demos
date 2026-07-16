import express, { type Request, type Response } from 'express';
import {
  assertDemoGate,
  DemoGateError,
  fetchSurfyAccessToken,
  loadSurfyDemoAuthEnv,
} from '@surfy/surfy-demo-auth';

type SurfyTokenResponse = {
  token: string;
};

type ErrorResponse = {
  error: string;
};

const authEnv = loadSurfyDemoAuthEnv();
const app = express();
const port = Number(process.env.PORT ?? 8787);

function readDemoGateKey(req: Request): string | undefined {
  const header = req.header('x-surfy-demo-key');
  if (header) return header;
  const query = req.query.key;
  return typeof query === 'string' ? query : undefined;
}

/**
 * Exchanges Surfy API credentials for a short-lived access token.
 * clientSecret stays server-side only (never VITE_*).
 */
app.get('/api/surfy-token', async (req: Request, res: Response<SurfyTokenResponse | ErrorResponse>) => {
  try {
    assertDemoGate(readDemoGateKey(req), authEnv.demoGateKey);
    const token = await fetchSurfyAccessToken({
      baseUrl: authEnv.baseUrl,
      clientId: authEnv.clientId,
      clientSecret: authEnv.clientSecret,
      tlsInsecure: authEnv.tlsInsecure,
    });
    res.json({ token });
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

app.listen(port, () => {
  console.log(`Surfy demo server listening on http://localhost:${port}`);
});
