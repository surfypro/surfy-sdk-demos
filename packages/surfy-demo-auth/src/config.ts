import { parseSurfyConnectionString } from './connectionString.js';

export type SurfyDemoAuthEnv = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  tlsInsecure: boolean;
  /** Optional shared gate for public demos (not the Surfy API secret). */
  demoGateKey?: string;
};

function readBooleanEnv(env: NodeJS.ProcessEnv, name: string, fallback = false): boolean {
  const value = env[name];
  if (value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function readDiscreteAuthEnv(env: NodeJS.ProcessEnv): SurfyDemoAuthEnv | null {
  const baseUrl = env.SURFY_BASE_URL ?? env.VITE_SURFY_BASE_URL;
  const clientId = env.SURFY_CLIENT_ID ?? env.VITE_SURFY_TENANT;
  const clientSecret = env.SURFY_CLIENT_SECRET ?? env.VITE_SURFY_TOKEN;
  if (!baseUrl || !clientId || !clientSecret) {
    return null;
  }
  return {
    baseUrl,
    clientId,
    clientSecret,
    tlsInsecure: readBooleanEnv(env, 'SURFY_TLS_INSECURE', false),
    demoGateKey: env.DEMO_GATE_KEY?.trim() || undefined,
  };
}

/**
 * Server-only config. Prefer a single `SURFY_CONNECTION_STRING`:
 *   host=https://app.example.surfy.pro;client_id=<tenant>;client_secret=<secret>
 *
 * Discrete SURFY_BASE_URL / SURFY_CLIENT_ID / SURFY_CLIENT_SECRET still work as fallback.
 * Never expose clientSecret to Vite / the browser.
 */
export function loadSurfyDemoAuthEnv(env: NodeJS.ProcessEnv = process.env): SurfyDemoAuthEnv {
  const demoGateKey = env.DEMO_GATE_KEY?.trim() || undefined;
  const connectionRaw = env.SURFY_CONNECTION_STRING ?? env.SURFY_API_CONNECTION_STRING;

  if (connectionRaw?.trim()) {
    const parsed = parseSurfyConnectionString(connectionRaw);
    return {
      baseUrl: parsed.host,
      clientId: parsed.clientId,
      clientSecret: parsed.clientSecret,
      tlsInsecure: readBooleanEnv(env, 'SURFY_TLS_INSECURE', false),
      demoGateKey,
    };
  }

  const discrete = readDiscreteAuthEnv(env);
  if (discrete) {
    return { ...discrete, demoGateKey: discrete.demoGateKey ?? demoGateKey };
  }

  throw new Error(
    'Missing Surfy credentials. Set SURFY_CONNECTION_STRING=' +
      'host=<url>;client_id=<tenant>;client_secret=<secret> ' +
      '(or SURFY_BASE_URL + SURFY_CLIENT_ID + SURFY_CLIENT_SECRET).',
  );
}

export function assertDemoGate(providedKey: string | null | undefined, expectedKey: string | undefined): void {
  if (!expectedKey) {
    return;
  }
  if (!providedKey || providedKey !== expectedKey) {
    throw new DemoGateError('Missing or invalid demo gate key');
  }
}

export class DemoGateError extends Error {
  readonly status = 401;

  constructor(message: string) {
    super(message);
    this.name = 'DemoGateError';
  }
}
