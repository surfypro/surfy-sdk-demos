import { expect, type Page, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import { attachBrowserErrorCollector, BUILDING_3D_DEMO_URL } from './helpers';

type BuildingCanvasMetrics = {
  canvasCount: number;
  bufferWidth: number;
  bufferHeight: number;
  clientWidth: number;
  clientHeight: number;
};

async function waitForBuildingReady(page: Page) {
  const lastEvent = page.locator('p', { hasText: 'Last event:' });

  await expect
    .poll(async () => lastEvent.textContent(), {
      timeout: 90_000,
      message: 'Waiting for surfy:ready or surfy:error from building 3D',
    })
    .toMatch(/Last event: surfy:(ready|error)/);

  const text = (await lastEvent.textContent()) ?? '';
  expect(text, 'Building 3D reported an error instead of becoming ready').toContain('surfy:ready');
}

async function getBuildingCanvasMetrics(page: Page): Promise<BuildingCanvasMetrics> {
  return page.locator('surfy-building-layout-3d').evaluate((element) => {
    const canvas = element.shadowRoot?.querySelector('canvas');
    if (!canvas) {
      return {
        canvasCount: 0,
        bufferWidth: 0,
        bufferHeight: 0,
        clientWidth: 0,
        clientHeight: 0,
      };
    }
    return {
      canvasCount: 1,
      bufferWidth: canvas.width,
      bufferHeight: canvas.height,
      clientWidth: canvas.clientWidth,
      clientHeight: canvas.clientHeight,
    };
  });
}

test.describe('Surfy building 3D', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('loads Cuby with surfy:ready and a sized WebGL canvas', async ({ page }) => {
    test.setTimeout(120_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(BUILDING_3D_DEMO_URL);
    await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId('demo-section-building-3d')).toBeVisible();
    await expect(page.locator('surfy-building-layout-3d')).toBeVisible({ timeout: 30_000 });

    await waitForBuildingReady(page);

    await expect
      .poll(async () => getBuildingCanvasMetrics(page), {
        timeout: 30_000,
        message: 'Waiting for Cuby canvas with non-trivial drawing buffer',
      })
      .toMatchObject({
        canvasCount: 1,
      });

    const metrics = await getBuildingCanvasMetrics(page);
    expect(metrics.bufferWidth, 'WebGL buffer width').toBeGreaterThanOrEqual(100);
    expect(metrics.bufferHeight, 'WebGL buffer height').toBeGreaterThanOrEqual(100);
    expect(metrics.clientWidth, 'CSS canvas width').toBeGreaterThanOrEqual(100);
    expect(metrics.clientHeight, 'CSS canvas height').toBeGreaterThanOrEqual(100);

    errors.assertNoJsErrors();
  });
});
