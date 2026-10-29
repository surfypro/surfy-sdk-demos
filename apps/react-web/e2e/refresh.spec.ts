import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import {
  attachBrowserErrorCollector,
  BUILDING_3D_DEMO_URL,
  DATA_API_DEMO_URL,
  FLOOR_2D_DEMO_URL,
  PLATFORM_3D_DEMO_URL,
} from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

const DEEP_LINKS = [
  FLOOR_2D_DEMO_URL,
  BUILDING_3D_DEMO_URL,
  DATA_API_DEMO_URL,
  PLATFORM_3D_DEMO_URL,
  /** Legacy deep-links must redirect to `/:section`. */
  '/api/react-web/floor-2d',
  '/oauth/react-web/floor-2d',
  '/api/react-native/building-3d',
] as const;

test.describe('SPA deep-link refresh', () => {
  for (const path of DEEP_LINKS) {
    test(`serves and remounts ${path}`, async ({ page }) => {
      test.setTimeout(hasSdkCredentials ? 90_000 : 30_000);
      const errors = attachBrowserErrorCollector(page);

      const response = await page.goto(path);
      expect(response?.ok(), `HTTP status for ${path}`).toBeTruthy();
      expect(await response?.headerValue('content-type')).toMatch(/text\/html/);

      const expectedSection = path.includes('building-3d')
        ? 'building-3d'
        : path.includes('data-api')
          ? 'data-api'
          : path.includes('platform-3d')
            ? 'platform-3d'
            : 'floor-2d';
      await expect(page).toHaveURL(new RegExp(`\\/${expectedSection}(?:\\?.*)?$`));
      await expect(page.getByTestId('demo-topbar')).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL(new RegExp(`\\/${expectedSection}(?:\\?.*)?$`));
      await expect(page.getByTestId('demo-topbar')).toBeVisible();

      if (hasSdkCredentials && !path.includes('platform-3d')) {
        if (expectedSection === 'data-api') {
          await expect(page.getByTestId('demo-section-data-api')).toBeVisible({ timeout: 60_000 });
        } else if (expectedSection === 'floor-2d' || expectedSection === 'building-3d') {
          await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
        }
      }

      errors.assertNoJsErrors();
    });
  }
});
