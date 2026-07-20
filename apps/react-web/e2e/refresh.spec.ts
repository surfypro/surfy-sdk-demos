import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials } from './credentials';
import {
  attachBrowserErrorCollector,
  BUILDING_3D_DEMO_URL,
  DEFAULT_DEMO_URL,
  FLOOR_3D_DEMO_URL,
} from './helpers';

const hasSdkCredentials = hasSurfySdkCredentials();

const DEEP_LINKS = [
  DEFAULT_DEMO_URL,
  FLOOR_3D_DEMO_URL,
  BUILDING_3D_DEMO_URL,
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

      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}(?:\\?.*)?$`));
      await expect(page.getByRole('heading', { name: 'Surfy SDK Demo' })).toBeVisible();

      // Hard reload must keep the same route (history API / SPA fallback).
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}(?:\\?.*)?$`));
      await expect(page.getByRole('heading', { name: 'Surfy SDK Demo' })).toBeVisible();

      if (path.startsWith('/api/react-web/') && hasSdkCredentials) {
        await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
      }

      if (path.includes('/oauth/')) {
        await expect(page.getByTestId('oauth-coming-soon')).toBeVisible();
      }

      if (path.includes('/react-native/')) {
        await expect(page.getByTestId('native-webview-sim')).toBeVisible();
        await expect(page.getByTestId('native-webview-iframe')).toBeVisible();
      }

      errors.assertNoJsErrors();
    });
  }
});
