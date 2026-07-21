import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import {
  attachBrowserErrorCollector,
  BUILDING_3D_DEMO_URL,
  DEFAULT_DEMO_URL,
  getBuildingCanvasFingerprint,
  getFloor2dSvgTransform,
  waitForLayoutDemoActions,
} from './helpers';

test.describe('Layout view controls', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('floor 2D: fitToView and zoomOn room update the SVG transform and API snippet', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(DEFAULT_DEMO_URL);
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible({ timeout: 60_000 });
    await waitForLayoutDemoActions(page);

    const beforeZoom = await getFloor2dSvgTransform(page);

    await page.getByTestId('demo-zoom-on-room').click();
    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.zoomOn');
    await expect(page.getByTestId('demo-api-snippet')).toContainText('diameterMeters: 5');

    await expect
      .poll(async () => getFloor2dSvgTransform(page), {
        timeout: 10_000,
        message: 'Waiting for zoomOn to change the SVG transform',
      })
      .not.toEqual(beforeZoom);

    const afterZoom = await getFloor2dSvgTransform(page);

    await page.getByTestId('demo-fit-to-view').click();
    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.fitToView()');

    await expect
      .poll(async () => getFloor2dSvgTransform(page), {
        timeout: 10_000,
        message: 'Waiting for fitToView to change the SVG transform after zoom',
      })
      .not.toEqual(afterZoom);

    errors.assertNoJsErrors();
  });

  test('building 3D: fitToView and zoomOn room change the rendered canvas', async ({ page }) => {
    test.setTimeout(120_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(BUILDING_3D_DEMO_URL);
    await expect(page.locator('surfy-building-layout-3d')).toBeVisible({ timeout: 60_000 });
    await waitForLayoutDemoActions(page);

    const beforeZoom = await getBuildingCanvasFingerprint(page);
    expect(beforeZoom.length, 'Cuby canvas fingerprint before zoom').toBeGreaterThan(0);

    await page.getByTestId('demo-zoom-on-room').click();
    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.zoomOn');
    await expect(page.getByTestId('demo-api-snippet')).toContainText('diameterMeters: 5');

    await expect
      .poll(async () => getBuildingCanvasFingerprint(page), {
        timeout: 15_000,
        message: 'Waiting for zoomOn to change the WebGL canvas',
      })
      .not.toBe(beforeZoom);

    const afterZoom = await getBuildingCanvasFingerprint(page);

    await page.getByTestId('demo-fit-to-view').click();
    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.fitToView()');

    await expect
      .poll(async () => getBuildingCanvasFingerprint(page), {
        timeout: 15_000,
        message: 'Waiting for fitToView to change the WebGL canvas after zoom',
      })
      .not.toBe(afterZoom);

    errors.assertNoJsErrors();
  });
});
