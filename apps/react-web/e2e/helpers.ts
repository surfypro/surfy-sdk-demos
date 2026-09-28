import { expect, type Page } from '@playwright/test';

type BrowserErrorCollector = {
  pageErrors: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  assertNoJsErrors: () => void;
};

export const DEMO_ROOM_COLOR = '#2196F3';
export const DEFAULT_ROOM_FILL = '#e8e8e8';
/** Default SPA entry after `/` redirect. */
export const DEFAULT_DEMO_URL = '/api/react-web/floor-2d';
export const BUILDING_3D_DEMO_URL = '/api/react-web/building-3d';
export const FLOOR_3D_DEMO_URL = '/api/react-web/floor-3d';
export const DATA_API_DEMO_URL = '/api/react-web/data-api';

type SurfyLayoutElement = HTMLElement & {
  setRoomColors: (colors: Record<number, string>) => void;
  clearRoomColors: () => void;
};

const ignoredConsolePatterns = [
  /favicon/i,
  /Download the React DevTools/i,
  /NODE_TLS_REJECT_UNAUTHORIZED/i,
  /error boundary to your tree/i,
  /link\/error-boundaries/i,
];

const reactComponentErrorWarningPattern = /An error occurred in the </;

function isIgnoredConsoleMessage(message: string): boolean {
  return ignoredConsolePatterns.some((pattern) => pattern.test(message));
}

export function attachBrowserErrorCollector(page: Page): BrowserErrorCollector {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('console', (message) => {
    const text = message.text();
    if (isIgnoredConsoleMessage(text)) {
      return;
    }

    if (message.type() === 'error') {
      consoleErrors.push(text);
      return;
    }

    if (message.type() === 'warning' && reactComponentErrorWarningPattern.test(text)) {
      consoleWarnings.push(text);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    consoleWarnings,
    assertNoJsErrors() {
      expect(
        pageErrors,
        pageErrors.length > 0 ? `Uncaught page errors:\n${pageErrors.join('\n')}` : undefined,
      ).toEqual([]);
      expect(
        consoleErrors,
        consoleErrors.length > 0 ? `Console errors:\n${consoleErrors.join('\n')}` : undefined,
      ).toEqual([]);
      expect(
        consoleWarnings,
        consoleWarnings.length > 0
          ? `React component errors (console.warn):\n${consoleWarnings.join('\n')}`
          : undefined,
      ).toEqual([]);
    },
  };
}

export async function getFirstRenderedRoomId(page: Page): Promise<number> {
  const roomId = await page.locator('surfy-floor-layout-2d').evaluate((element) => {
    const room = element.shadowRoot?.querySelector('[data-room-id]');
    if (!room) {
      throw new Error('No room polygon rendered in surfy-floor-layout-2d');
    }
    return Number(room.getAttribute('data-room-id'));
  });

  expect(Number.isFinite(roomId)).toBe(true);
  return roomId;
}

export async function getRoomFill(page: Page, roomId: number): Promise<string> {
  return page.locator('surfy-floor-layout-2d').evaluate((element, id) => {
    const polygon = element.shadowRoot?.querySelector(`[data-room-id="${id}"]`);
    if (!polygon || polygon.tagName.toLowerCase() !== 'polygon') {
      throw new Error(`Room ${id} polygon not found`);
    }
    return polygon.getAttribute('fill') ?? '';
  }, roomId);
}

export async function expectRoomFill(page: Page, roomId: number, fill: string) {
  await expect.poll(() => getRoomFill(page, roomId)).toBe(fill);
}

export async function setRoomColorsOnPlan(page: Page, colors: Record<number, string>) {
  await page.locator('surfy-floor-layout-2d').evaluate((element, roomColors) => {
    (element as SurfyLayoutElement).setRoomColors(roomColors);
  }, colors);
}

export async function clearRoomColorsOnPlan(page: Page) {
  await page.locator('surfy-floor-layout-2d').evaluate((element) => {
    (element as SurfyLayoutElement).clearRoomColors();
  });
}

export type SvgTransformMetrics = {
  readonly scale: number;
  readonly translateX: number;
  readonly translateY: number;
};

/** Parse the work-canvas `g[data-type="svg-content"]` transform (translate + scale). */
export function parseSvgTransform(transform: string): SvgTransformMetrics {
  const scales = [...transform.matchAll(/scale\(([^)]+)\)/g)].map((match) => Number(match[1].trim()));
  const scale = scales.reduce((product, value) => product * value, 1) || 1;
  const translateMatch = transform.match(/translate\(([^)]+)\)/);
  const [translateX = 0, translateY = 0] = translateMatch
    ? translateMatch[1].split(/\s+/).map(Number)
    : [];
  return { scale, translateX, translateY };
}

export async function getFloor2dSvgTransform(page: Page): Promise<SvgTransformMetrics> {
  const transform = await page.locator('surfy-floor-layout-2d').evaluate((element) => {
    const group = element.shadowRoot?.querySelector('g[data-type="svg-content"]');
    if (!group) {
      throw new Error('SVG content group not found in surfy-floor-layout-2d');
    }
    return group.getAttribute('transform') ?? '';
  });
  return parseSvgTransform(transform);
}

/** Cheap visual fingerprint for Cuby WebGL canvas (changes when the camera moves). */
export async function getBuildingCanvasFingerprint(page: Page): Promise<string> {
  return page.locator('surfy-building-layout-3d').evaluate((element) => {
    const canvas = element.shadowRoot?.querySelector('canvas');
    if (!canvas) {
      return '';
    }
    try {
      return canvas.toDataURL('image/png');
    } catch {
      return `${canvas.width}x${canvas.height}`;
    }
  });
}

function parseDemoRateLimitRetryMs(eventText: string): number | undefined {
  const match = eventText.match(/"retryAfterSec":(\d+)/);
  if (!match || !eventText.includes('DEMO_RATE_LIMIT')) {
    return undefined;
  }
  return Number(match[1]) * 1000 + 500;
}

export async function waitForSdkReady(page: Page, options?: { timeout?: number }) {
  const timeout = options?.timeout ?? 60_000;
  const lastEvent = page.getByTestId('demo-last-event');
  await expect(lastEvent).toBeVisible({ timeout: Math.min(timeout, 30_000) });
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const text = (await lastEvent.textContent()) ?? '';
    if (text.includes('surfy:ready')) {
      return;
    }

    const retryMs = parseDemoRateLimitRetryMs(text);
    if (retryMs !== undefined) {
      await page.waitForTimeout(retryMs);
      continue;
    }

    if (text.includes('surfy:error')) {
      throw new Error(`SDK error before ready: ${text}`);
    }

    await page.waitForTimeout(250);
  }

  const finalText = (await lastEvent.textContent()) ?? '';
  expect(finalText, 'Waiting for surfy:ready from the SDK').toContain('surfy:ready');
}

export async function waitForLayoutDemoActions(page: Page) {
  await waitForSdkReady(page);
  await expect(page.getByTestId('demo-fit-to-view')).toBeEnabled({ timeout: 30_000 });
  await expect(page.getByTestId('demo-zoom-on-room')).toBeEnabled({ timeout: 30_000 });
}

export async function getRenderedRoomCount(page: Page, tag: 'surfy-floor-layout-2d' | 'surfy-building-layout-3d') {
  return page.locator(tag).evaluate((element) => {
    return element.shadowRoot?.querySelectorAll('[data-room-id]').length ?? 0;
  });
}

export async function hoverFirstRoomOnFloor2d(page: Page) {
  await page.locator('surfy-floor-layout-2d').evaluate((element) => {
    const polygon = element.shadowRoot?.querySelector('[data-room-id]');
    if (!(polygon instanceof SVGGraphicsElement)) {
      throw new Error('No room polygon to hover');
    }
    polygon.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    polygon.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  });
}

export async function clickFirstRoomOnFloor2d(page: Page): Promise<number> {
  return page.locator('surfy-floor-layout-2d').evaluate((element) => {
    const polygon = element.shadowRoot?.querySelector('[data-room-id]');
    if (!(polygon instanceof SVGGraphicsElement)) {
      throw new Error('No room polygon to click');
    }
    const roomId = Number(polygon.getAttribute('data-room-id'));
    polygon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return roomId;
  });
}

export async function readFillParentAttribute(
  page: Page,
  tag: 'surfy-floor-layout-2d' | 'surfy-building-layout-3d',
): Promise<boolean> {
  return page.locator(tag).evaluate((element) => {
    const value = element.getAttribute('fill-parent');
    return value !== 'false';
  });
}
