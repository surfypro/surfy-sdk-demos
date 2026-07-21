import { expect, test } from '@playwright/test';
import { hasSurfySdkCredentials, SDK_CREDENTIALS_HINT } from './credentials';
import {
  attachBrowserErrorCollector,
  BUILDING_3D_DEMO_URL,
  clickFirstRoomOnFloor2d,
  DATA_API_DEMO_URL,
  DEFAULT_DEMO_URL,
  getBuildingCanvasFingerprint,
  hoverFirstRoomOnFloor2d,
  getRenderedRoomCount,
  readFillParentAttribute,
  waitForLayoutDemoActions,
  waitForSdkReady,
} from './helpers';
import { manifestEntriesForSdkCoverageSpec } from './sdkFeatureManifest';

test.describe.configure({ mode: 'serial' });

test.describe('SDK feature coverage (manifest)', () => {
  test.skip(!hasSurfySdkCredentials(), SDK_CREDENTIALS_HINT);

  for (const feature of manifestEntriesForSdkCoverageSpec()) {
    test(`[${feature.id}] ${feature.description}`, async ({ page }) => {
      test.setTimeout(120_000);

      switch (feature.id) {
        case 'SurfySdk.version': {
          await page.goto(DEFAULT_DEMO_URL);
          const meta = page.getByTestId('demo-sdk-meta');
          await expect(meta).toHaveAttribute('data-sdk-version', /^\d+\.\d+\.\d+/);
          await expect(page.getByTestId('demo-version-line')).toContainText(/Demo v\d+/);
          break;
        }
        case 'SurfySdk.tagForKind': {
          await page.goto(DEFAULT_DEMO_URL);
          const meta = page.getByTestId('demo-sdk-meta');
          await expect(meta).toHaveAttribute('data-floor-tag', 'surfy-floor-layout-2d');
          await expect(meta).toHaveAttribute('data-building-tag', 'surfy-building-layout-3d');
          break;
        }
        case 'SurfySdk.isKindRegistered': {
          await page.goto(DEFAULT_DEMO_URL);
          const meta = page.getByTestId('demo-sdk-meta');
          await expect(meta).toHaveAttribute('data-floor-registered', 'true');
          await expect(meta).toHaveAttribute('data-building-registered', 'true');
          break;
        }
        case 'SurfyLayout.setTheme': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          await page.locator('surfy-floor-layout-2d').evaluate((element) => {
            (element as HTMLElement & { setTheme: (theme?: unknown) => void }).setTheme({
              primary: { main: '#006064' },
              tooltip: { backgroundColor: '#004d40', color: '#ffffff' },
            });
          });
          await expect(page.locator('surfy-floor-layout-2d')).toBeVisible();
          break;
        }
        case 'SurfyLayout.setFillParent': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          expect(await readFillParentAttribute(page, 'surfy-floor-layout-2d')).toBe(true);
          await page.getByTestId('demo-fill-parent').uncheck();
          await expect
            .poll(() => readFillParentAttribute(page, 'surfy-floor-layout-2d'))
            .toBe(false);
          await page.getByTestId('demo-fill-parent').check();
          await expect
            .poll(() => readFillParentAttribute(page, 'surfy-floor-layout-2d'))
            .toBe(true);
          break;
        }
        case 'SurfyLayout.getRenderedRoomIds': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          const count = await getRenderedRoomCount(page, 'surfy-floor-layout-2d');
          expect(count).toBeGreaterThan(0);
          break;
        }
        case 'SurfyLayout.setEntityId': {
          await page.goto(DEFAULT_DEMO_URL);
          await expect(page.getByTestId('demo-scope-picker')).toBeVisible({ timeout: 60_000 });
          await waitForLayoutDemoActions(page);
          const floorSelect = page.getByTestId('demo-floor-select');
          const options = await floorSelect.locator('option').all();
          if (options.length < 2) {
            test.skip(true, 'Need at least two floors in catalog for setEntityId');
          }
          const secondValue = await options[1].getAttribute('value');
          expect(secondValue).toBeTruthy();
          await floorSelect.selectOption(secondValue!);
          await expect
            .poll(async () => page.locator('surfy-floor-layout-2d').getAttribute('floor-id'))
            .toBe(secondValue);
          await expect
            .poll(async () => page.getByTestId('demo-last-event').textContent(), {
              timeout: 90_000,
              message: 'Waiting for surfy:ready or surfy:error after entity change',
            })
            .toMatch(/surfy:(ready|error)/);
          const lastEvent = await page.getByTestId('demo-last-event').textContent();
          if (!lastEvent?.includes('surfy:ready')) {
            test.skip(true, `Alternate floor ${secondValue} not loadable in this tenant`);
          }
          await expect(page.getByTestId('demo-zoom-on-room')).toBeEnabled({ timeout: 30_000 });
          break;
        }
        case 'SurfyLayout.destroy': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          await page.getByTestId('demo-tab-data-api').click();
          await expect(page.locator('surfy-floor-layout-2d')).toHaveCount(0);
          await page.getByTestId('demo-tab-floor-2d').click();
          await expect(page.locator('surfy-floor-layout-2d')).toBeVisible({ timeout: 60_000 });
          await waitForSdkReady(page);
          break;
        }
        case 'SurfyLayout.setOptions': {
          await page.goto(BUILDING_3D_DEMO_URL);
          await expect(page.getByTestId('demo-3d-controls')).toBeVisible({ timeout: 60_000 });
          await waitForLayoutDemoActions(page);
          const before = await getBuildingCanvasFingerprint(page);
          await page.getByTestId('demo-floor-space').evaluate((input) => {
            const el = input as HTMLInputElement;
            el.value = '400';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          });
          await page.getByTestId('demo-show-room-labels').uncheck();
          await page.getByTestId('demo-wall-mode').selectOption('half');
          await page.getByTestId('demo-show-structure-walls').check();
          await page.getByTestId('demo-single-zoom-mode').selectOption('isometric');
          await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.setOptions');
          await expect
            .poll(async () => getBuildingCanvasFingerprint(page), { timeout: 15_000 })
            .not.toBe(before);
          break;
        }
        case 'SurfyLayout.updateRoom': {
          await page.goto(BUILDING_3D_DEMO_URL);
          await waitForLayoutDemoActions(page);
          await page.getByTestId('demo-update-room').click();
          await expect(page.getByTestId('demo-api-snippet')).toContainText('layout.updateRoom');
          await page.getByTestId('demo-room-show-label').uncheck();
          await expect(page.getByTestId('demo-api-snippet')).toContainText('showLabel');
          break;
        }
        case 'SurfyBuildingLayout3dElement.setFetchFloorIds': {
          await page.goto(BUILDING_3D_DEMO_URL);
          await waitForLayoutDemoActions(page);
          const firstFloorCheckbox = page.locator('[data-testid^="demo-floor-visible-"]').first();
          await expect(firstFloorCheckbox).toBeVisible({ timeout: 30_000 });
          const checkboxTestId = await firstFloorCheckbox.getAttribute('data-testid');
          const floorId = checkboxTestId?.replace('demo-floor-visible-', '') ?? '';
          expect(floorId).not.toBe('');
          await page.locator('surfy-building-layout-3d').evaluate((element, id) => {
            (element as HTMLElement & { setFetchFloorIds: (ids: number[]) => void }).setFetchFloorIds([
              Number(id),
            ]);
          }, floorId);
          await expect
            .poll(async () => page.locator('surfy-building-layout-3d').getAttribute('floor-ids'))
            .toBe(floorId);
          break;
        }
        case 'surfy:room-hover': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          await hoverFirstRoomOnFloor2d(page);
          await expect
            .poll(async () => page.getByTestId('demo-last-event').textContent())
            .toContain('surfy:room-hover');
          break;
        }
        case 'surfy:room-selected': {
          await page.goto(DEFAULT_DEMO_URL);
          await waitForLayoutDemoActions(page);
          const roomId = await clickFirstRoomOnFloor2d(page);
          await expect
            .poll(async () => page.getByTestId('demo-last-event').textContent())
            .toContain(`surfy:room-selected ${roomId}`);
          break;
        }
        case 'SurfyClient.fetchEntities.buildings': {
          await page.goto(DATA_API_DEMO_URL);
          await page.getByTestId('demo-fetch-buildings').click();
          await expect(page.getByTestId('demo-data-result')).toContainText(
            '"action": "fetchEntities(buildingsQn)"',
            { timeout: 60_000 },
          );
          await expect(page.getByTestId('demo-data-result')).toContainText('"id":');
          break;
        }
        case 'SurfyClient.fetchEntities.floors': {
          await page.goto(DATA_API_DEMO_URL);
          await page.getByTestId('demo-fetch-buildings').click();
          await expect(page.getByTestId('demo-data-scope')).toBeVisible({ timeout: 60_000 });
          await page.getByTestId('demo-fetch-floors').click();
          await expect(page.getByTestId('demo-data-result')).toContainText(
            '"action": "fetchEntities(floorsQn)"',
            { timeout: 60_000 },
          );
          await expect(page.getByTestId('demo-data-result')).toContainText('"buildingId":');
          break;
        }
        case 'SurfyClient.fetchEntities.rooms': {
          await page.goto(DATA_API_DEMO_URL);
          await page.getByTestId('demo-fetch-buildings').click();
          await page.getByTestId('demo-fetch-floors').click();
          await expect(page.getByTestId('demo-data-scope')).toContainText('floorId=', {
            timeout: 60_000,
          });
          await page.getByTestId('demo-fetch-rooms').click();
          await expect(page.getByTestId('demo-data-result')).toContainText(
            '"action": "fetchEntities(roomsQn)"',
            { timeout: 60_000 },
          );
          await expect(page.getByTestId('demo-data-result')).toContainText('"floorId":');
          break;
        }
        default:
          throw new Error(`Unhandled manifest feature: ${feature.id}`);
      }

      attachBrowserErrorCollector(page).assertNoJsErrors();
    });
  }
});
