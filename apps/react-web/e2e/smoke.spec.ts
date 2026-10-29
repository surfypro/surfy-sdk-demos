import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import { attachBrowserErrorCollector } from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

test.describe('React demo shell', () => {
  test('renders the demo page without JavaScript errors', async ({ page }) => {
    test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/platform-3d$/);
    await expect(page.getByTestId('demo-topbar')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('demo-tab-floor-2d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-building-3d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-floor-3d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-platform-3d')).toBeVisible();
    await expect(page.getByTestId('demo-section-platform-3d')).toBeVisible();

    if (hasSdkCredentials) {
      await expect
        .poll(
          async () => page.getByTestId('demo-platform-event-log').textContent(),
          {
            timeout: 90_000,
            message: 'Waiting for onReady on default platform-3d',
          },
        )
        .toContain('onReady');
    }

    errors.assertNoJsErrors();
  });
});
