import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import {
  attachBrowserErrorCollector,
  PLATFORM_3D_DEMO_URL,
} from './helpers';

/**
 * Captures pageerror / console.error on Vue plateforme 3D — Cuby hydrate used to throw
 * `Cannot read properties of undefined (reading 'active')` from getRoomFilterColor.
 */
test.describe('Surfy platform 3D', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('platform-3d hydrates Cuby without getRoomFilterColor / duplicate-key errors', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(PLATFORM_3D_DEMO_URL);
    await expect(page.getByTestId('demo-section-platform-3d')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Surfy SDK Demo' })).toBeVisible();

    await expect
      .poll(
        async () => page.getByTestId('demo-platform-event-log').textContent(),
        {
          timeout: 90_000,
          message: 'Waiting for onReady on platform-3d',
        },
      )
      .toContain('onReady');

    const firstBuilding = page.locator('[data-testid^="demo-platform-building-"]').first();
    await expect(firstBuilding).toBeVisible({ timeout: 60_000 });
    await firstBuilding.click();

    await expect
      .poll(
        async () => page.getByTestId('demo-platform-event-log').textContent(),
        {
          timeout: 30_000,
          message: 'Waiting for onBuildingChange after building click',
        },
      )
      .toMatch(/onBuildingChange\(\d+\)/);

    // Allow Cuby layout hydrate + wallMode rebuild to finish (or surface pageerror).
    await page.waitForTimeout(8_000);

    const hydrateBanner = page.getByTestId('demo-platform-cuby-hydrate-error');
    if (await hydrateBanner.isVisible().catch(() => false)) {
      const detail = (await hydrateBanner.textContent()) ?? '';
      expect(detail, 'Cuby hydrate error banner').not.toMatch(/reading 'active'/i);
    }

    // SDK-429-HC-D5 — host floor chrome → onFloorChange (after detail hydrate).
    const firstFloor = page.locator('[data-testid^="demo-platform-floor-"]').first();
    await expect(firstFloor).toBeVisible({ timeout: 60_000 });
    await firstFloor.click();

    await expect
      .poll(
        async () => page.getByTestId('demo-platform-event-log').textContent(),
        {
          timeout: 30_000,
          message: 'Waiting for onFloorChange after floor click',
        },
      )
      .toMatch(/onFloorChange\(\d+\)/);

    const allNoise = [...errors.pageErrors, ...errors.consoleErrors].join('\n');
    expect(allNoise, 'getRoomFilterColor crash').not.toMatch(/reading 'active'/i);
    expect(allNoise, 'getRoomFilterColor stack').not.toMatch(/getRoomFilterColor/i);
    expect(allNoise, 'React duplicate key').not.toMatch(/two children with the same key/i);

    errors.assertNoJsErrors();
  });
});
