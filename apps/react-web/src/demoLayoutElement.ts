import type { SurfyLayout } from '@surfy/surfy-sdk';

export function getConfiguredDemoRoomId(): number | undefined {
  const raw = import.meta.env.VITE_SURFY_DEMO_ROOM_ID;
  if (!raw) return undefined;
  const roomId = Number(raw);
  return Number.isFinite(roomId) ? roomId : undefined;
}

export function pickRandomItem<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Pick a room id that is actually rendered on the current layout (étage / étages visibles).
 * Configured `VITE_SURFY_DEMO_ROOM_ID` is used only when it belongs to that set.
 */
export async function waitForDemoRoomId(
  layout: SurfyLayout,
  timeoutMs = 10_000,
): Promise<number | undefined> {
  const configuredRoomId = getConfiguredDemoRoomId();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const rendered = layout.getRenderedRoomIds();
    if (rendered.length > 0) {
      if (configuredRoomId !== undefined && rendered.includes(configuredRoomId)) {
        return configuredRoomId;
      }
      return rendered[0];
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return undefined;
}

/** No-op when the room is not among currently rendered spaces (étage / étages visibles). */
export function isRenderedDemoRoom(layout: SurfyLayout | null | undefined, roomId: number): boolean {
  if (!layout) return false;
  const rendered = layout.getRenderedRoomIds();
  return rendered.length === 0 || rendered.includes(roomId);
}
