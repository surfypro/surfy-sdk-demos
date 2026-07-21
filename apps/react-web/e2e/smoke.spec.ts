import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import { attachBrowserErrorCollector } from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

test.describe('React demo shell', () => {
  test('renders the demo page without JavaScript errors', async ({ page }) => {
    test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page).toHaveURL(/\/api\/react-web\/floor-2d$/);
    await expect(page.getByRole('heading', { name: 'Surfy SDK Demo' })).toBeVisible();
    await expect(page.getByTestId('auth-mode-api')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étage 2D' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Bâtiment 3D' })).toBeVisible();
    await expect(page.getByTestId('demo-tab-floor-3d')).toHaveCount(0);

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
