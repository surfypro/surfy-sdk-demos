import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import { attachBrowserErrorCollector, DEFAULT_DEMO_URL } from './helpers';

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
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('loads the floor plan without JavaScript errors and emits surfy:ready', async ({ page }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(DEFAULT_DEMO_URL);

    await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    await waitForSdkOutcome(page);
    errors.assertNoJsErrors();
  });
});
