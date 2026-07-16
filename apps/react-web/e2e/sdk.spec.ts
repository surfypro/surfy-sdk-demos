import { expect, test } from '@playwright/test';
import { attachBrowserErrorCollector } from './helpers';

const hasSdkCredentials = Boolean(
  process.env.VITE_SURFY_BASE_URL &&
    process.env.VITE_SURFY_TENANT &&
    process.env.VITE_SURFY_FLOOR_ID &&
    (process.env.SURFY_CLIENT_SECRET || process.env.VITE_SURFY_TOKEN),
);

async function waitForSdkOutcome(page: import('@playwright/test').Page) {
  const lastEvent = page.locator('p', { hasText: 'Last event:' });

  await expect
    .poll(async () => lastEvent.textContent(), {
      timeout: 60_000,
      message: 'Waiting for surfy:ready or surfy:error from the SDK',
    })
    .toMatch(/Last event: surfy:(ready|error)/);

  const text = (await lastEvent.textContent()) ?? '';
  expect(text, 'SDK reported an error instead of becoming ready').toContain('surfy:ready');
}

test.describe('Surfy SDK integration', () => {
  test.skip(
    !hasSdkCredentials,
    'Set VITE_SURFY_* in apps/react-web/.env and SURFY_CLIENT_SECRET in apps/demo-server/.env.',
  );

  test('loads the floor plan without JavaScript errors and emits surfy:ready', async ({ page }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    await waitForSdkOutcome(page);
    errors.assertNoJsErrors();
  });
});
