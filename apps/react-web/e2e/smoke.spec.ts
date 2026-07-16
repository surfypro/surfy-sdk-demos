import { expect, test } from '@playwright/test';
import { attachBrowserErrorCollector } from './helpers';

const hasSdkCredentials = Boolean(
  process.env.VITE_SURFY_BASE_URL &&
    process.env.VITE_SURFY_TENANT &&
    process.env.VITE_SURFY_FLOOR_ID &&
    (process.env.SURFY_CLIENT_SECRET || process.env.VITE_SURFY_TOKEN),
);

test.describe('React demo shell', () => {
  test('renders the demo page without JavaScript errors', async ({ page }) => {
    test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Surfy SDK React Demo' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étage 2D' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Étage 3D' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Bâtiment 3D' })).toBeVisible();
    await expect(page.getByTestId('demo-section-floor-2d')).toBeVisible();
    await expect(page.getByText('Last event:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear colors' })).toBeVisible();
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();

    if (hasSdkCredentials) {
      await expect
        .poll(async () => page.locator('p', { hasText: 'Last event:' }).textContent(), {
          timeout: 60_000,
          message: 'Waiting for surfy:ready from the SDK',
        })
        .toContain('surfy:ready');

      await expect
        .poll(async () => page.getByRole('button', { name: /Color room/ }).textContent(), {
          timeout: 15_000,
          message: 'Waiting for the demo to resolve a room id for coloring',
        })
        .toMatch(/Color room \d+/);
    } else {
      await page.waitForTimeout(2_000);
      await expect(page.getByRole('button', { name: 'Color room' })).toBeDisabled();
    }

    errors.assertNoJsErrors();
  });
});
