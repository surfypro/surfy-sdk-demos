import { expect, test } from '@playwright/test';
import {
  attachBrowserErrorCollector,
  clearRoomColorsOnPlan,
  DEFAULT_ROOM_FILL,
  DEMO_ROOM_COLOR,
  expectRoomFill,
  getFirstRenderedRoomId,
  setRoomColorsOnPlan,
} from './helpers';

const hasSdkCredentials = Boolean(
  process.env.VITE_SURFY_BASE_URL &&
    process.env.VITE_SURFY_TENANT &&
    process.env.VITE_SURFY_FLOOR_ID &&
    (process.env.SURFY_CLIENT_SECRET || process.env.VITE_SURFY_TOKEN),
);

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
  test.skip(
    !hasSdkCredentials,
    'Set VITE_SURFY_* in apps/react-web/.env and SURFY_CLIENT_SECRET in apps/demo-server/.env.',
  );

  test('loads the floor plan and changes a room fill color', async ({ page }) => {
    test.setTimeout(90_000);

    const errors = attachBrowserErrorCollector(page);

    await page.goto('/');

    await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
    await waitForSdkReady(page);

    const roomId = await getFirstRenderedRoomId(page);
    await expectRoomFill(page, roomId, DEFAULT_ROOM_FILL);

    await setRoomColorsOnPlan(page, { [roomId]: DEMO_ROOM_COLOR });
    await expectRoomFill(page, roomId, DEMO_ROOM_COLOR);

    await clearRoomColorsOnPlan(page);
    await expectRoomFill(page, roomId, DEFAULT_ROOM_FILL);

    errors.assertNoJsErrors();
  });
});
