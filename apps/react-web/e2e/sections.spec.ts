import { expect, test } from '@playwright/test';
import { attachBrowserErrorCollector } from './helpers';

test.describe('Demo sections', () => {
  test('shows placeholder for 3D sections not yet in the SDK bundle', async ({ page }) => {
    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await page.getByTestId('demo-tab-floor-3d').click();
    await expect(page.getByTestId('demo-section-floor-3d')).toBeVisible();
    await expect(page.getByTestId('demo-section-unavailable')).toBeVisible();
    await expect(page.locator('surfy-floor-layout-3d')).toHaveCount(0);

    await page.getByTestId('demo-tab-building-3d').click();
    await expect(page.getByTestId('demo-section-building-3d')).toBeVisible();
    await expect(page.getByTestId('demo-section-unavailable')).toBeVisible();
    await expect(page.locator('surfy-building-layout-3d')).toHaveCount(0);

    await page.getByTestId('demo-tab-floor-2d').click();
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();

    errors.assertNoJsErrors();
  });
});
