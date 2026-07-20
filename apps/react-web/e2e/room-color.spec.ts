import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import {
  attachBrowserErrorCollector,
  clearRoomColorsOnPlan,
  DEFAULT_DEMO_URL,
  DEFAULT_ROOM_FILL,
  DEMO_ROOM_COLOR,
  expectRoomFill,
  getFirstRenderedRoomId,
  setRoomColorsOnPlan,
} from './helpers';

async function waitForSdkReady(page: import('@playwright/test').Page) {
  const lastEvent = page.locator('p', { hasText: 'Last event:' });

  await expect
    .poll(async () => lastEvent.textContent(), {
      timeout: 60_000,
      message: 'Waiting for surfy:ready from the SDK',
    })
    .toContain('surfy:ready');
}

test.describe('Room color', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  test('loads the floor plan and changes a room fill color', async ({ page }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(DEFAULT_DEMO_URL);

    await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    await waitForSdkReady(page);

    // First rendered room (DOM order) — not a fixed fixture id
    const roomId = await getFirstRenderedRoomId(page);
    await expectRoomFill(page, roomId, DEFAULT_ROOM_FILL);

    await setRoomColorsOnPlan(page, { [roomId]: DEMO_ROOM_COLOR });
    await expectRoomFill(page, roomId, DEMO_ROOM_COLOR);

    await clearRoomColorsOnPlan(page);
    await expectRoomFill(page, roomId, DEFAULT_ROOM_FILL);

    errors.assertNoJsErrors();
  });

  test('random blink toggle lights rooms continuously and shows room id', async ({ page }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto(DEFAULT_DEMO_URL);

    await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    await waitForSdkReady(page);

    await page.getByTestId('demo-random-blink').click();
    await expect(page.getByTestId('demo-random-blink')).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByTestId('demo-blink-status')).toBeVisible({ timeout: 5_000 });
    const firstRoomId = await page.getByTestId('demo-blink-room-id').textContent();
    expect(firstRoomId).toMatch(/^\d+$/);
    const firstColor = await page.getByTestId('demo-blink-color').getAttribute('title');
    expect(firstColor).toMatch(/^#[0-9a-f]{6}$/i);

    // Continuous blink: status should update (room id and/or color) within a few ticks
    await expect
      .poll(
        async () => {
          const roomId = await page.getByTestId('demo-blink-room-id').textContent();
          const color = await page.getByTestId('demo-blink-color').getAttribute('title');
          return `${roomId}|${color}`;
        },
        { timeout: 5_000, message: 'Waiting for blink tick to change room/color' },
      )
      .not.toBe(`${firstRoomId}|${firstColor}`);

    await page.getByTestId('demo-random-blink').click();
    await expect(page.getByTestId('demo-random-blink')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('demo-blink-status')).toHaveCount(0);

    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.setRoomColors');
    await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.clearRoomColors');

    errors.assertNoJsErrors();
  });
});
