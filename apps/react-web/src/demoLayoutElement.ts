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

export async function waitForDemoRoomId(
  layout: SurfyLayout,
  timeoutMs = 10_000,
): Promise<number | undefined> {
  const configuredRoomId = getConfiguredDemoRoomId();
  if (configuredRoomId !== undefined) {
    return configuredRoomId;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const roomId = layout.getRenderedRoomIds()[0];
    if (roomId !== undefined) {
      return roomId;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return undefined;
}
