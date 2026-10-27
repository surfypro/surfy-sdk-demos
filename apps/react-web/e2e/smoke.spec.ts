import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import { attachBrowserErrorCollector } from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

test.describe('React demo shell', () => {
  test('renders the demo page without JavaScript errors', async ({ page }) => {
    test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/floor-2d$/);
    await expect(page.getByTestId('demo-topbar')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId('demo-tab-floor-2d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-building-3d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-floor-3d')).toBeVisible();
    await expect(page.getByTestId('demo-tab-platform-3d')).toBeVisible();

    if (hasSdkCredentials) {
      await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId('demo-section-floor-2d')).toBeVisible();
      await expect(page.getByText('Last event:')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear colors' })).toBeVisible();
      await expect(page.getByTestId('demo-fit-to-view')).toBeVisible();
      await expect(page.getByTestId('demo-zoom-on-room')).toBeVisible();
      await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();

      await expect
        .poll(async () => page.locator('p', { hasText: 'Last event:' }).textContent(), {
          timeout: 60_000,
          message: 'Waiting for surfy:ready from the SDK',
        })
        .toContain('surfy:ready');
    } else {
      await expect(page.getByTestId('demo-catalog-error')).toBeVisible({ timeout: 15_000 });
    }

    errors.assertNoJsErrors();
  });
});
