import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';

test.describe('Demo server auth proxy', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('opens API session without exposing Surfy JWT', async ({ request }) => {
    const response = await request.get('/api/session');
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as { token?: string; tenant?: string; authMode?: string };
    expect(body.tenant).toBeTruthy();
    expect(body.authMode).toBe('api');
    expect(body.token).toBeUndefined();

    const setCookie = response.headers()['set-cookie'] ?? '';
    expect(setCookie.toLowerCase()).toContain('surfy_demo_session');
    expect(setCookie.toLowerCase()).toContain('httponly');
  });
});
