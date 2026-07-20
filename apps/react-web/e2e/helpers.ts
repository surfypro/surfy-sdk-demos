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
