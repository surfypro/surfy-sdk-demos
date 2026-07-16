import { expect, test } from '@playwright/test';

const hasSdkCredentials = Boolean(
  process.env.VITE_SURFY_BASE_URL &&
    process.env.VITE_SURFY_TENANT &&
    process.env.VITE_SURFY_FLOOR_ID &&
    (process.env.SURFY_CLIENT_SECRET || process.env.VITE_SURFY_TOKEN),
);

test.describe('Demo server auth proxy', () => {
  test.skip(!hasSdkCredentials, 'Configure apps/demo-server/.env with SURFY_CLIENT_SECRET to run auth E2E tests.');

  test('exchanges client credentials via /api/surfy-token', async ({ request }) => {
    const response = await request.get('/api/surfy-token');
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { token?: string };
    expect(body.token).toBeTruthy();
    expect(body.token?.split('.').length).toBe(3);
  });
});
