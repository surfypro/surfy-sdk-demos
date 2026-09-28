import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import {
  attachBrowserErrorCollector,
  BUILDING_3D_DEMO_URL,
  DEFAULT_DEMO_URL,
  FLOOR_3D_DEMO_URL,
} from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

test.describe('Demo sections', () => {
  test('routes: floor-2d, building-3d, floor-3d when registered', async ({ page }) => {
    test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(DEFAULT_DEMO_URL);

    if (hasSdkCredentials) {
      await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    }

    await page.goto(BUILDING_3D_DEMO_URL);
    await expect(page.getByTestId('demo-section-building-3d')).toBeVisible();
    if (hasSdkCredentials) {
      await expect(page.locator('surfy-building-layout-3d')).toBeVisible({ timeout: 30_000 });
    } else {
      await expect(page.getByTestId('demo-section-no-entity')).toBeVisible();
    }

    await expect(page.getByTestId('demo-tab-floor-3d')).toBeVisible();

    await page.goto(FLOOR_3D_DEMO_URL);
    await expect(page.getByTestId('demo-section-floor-3d')).toBeVisible();
    await expect(page.getByTestId('demo-surface-toggle')).toBeVisible();
    if (hasSdkCredentials) {
      await expect(page.locator('surfy-floor-layout-3d')).toBeVisible({ timeout: 30_000 });
    }

    errors.assertNoJsErrors();
  });
});
