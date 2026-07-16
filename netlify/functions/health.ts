import type { Handler } from '@netlify/functions';

/** Liveness for Docker / load balancers — no secrets. */
export const handler: Handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'ok' }),
});
