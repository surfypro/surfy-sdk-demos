import type { IEmbedLayoutViewData, IEmbedRoom, SurfyPinLayout } from '@surfy/surfy-sdk';

import { pickRandomItem } from '../../../demoLayoutElement';

export type LayoutPoint = { readonly x: number; readonly y: number };

export type LayoutPinSpec = SurfyPinLayout & {
  readonly label?: string;
};

export type LayoutBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

function roomPointNodes(room: IEmbedRoom): readonly { readonly roomPointId: number; readonly roomPoint?: LayoutPoint }[] {
  return room.roomPointRooms?.nodes ?? [];
}

/** Centroid of a room polygon from embed layout points. */
export function roomCentroid(
  room: IEmbedRoom,
  pointsById: ReadonlyMap<number, LayoutPoint>,
): LayoutPoint | undefined {
  const pts: LayoutPoint[] = [];
  for (const node of roomPointNodes(room)) {
    const point = node.roomPoint ?? pointsById.get(node.roomPointId);
    if (point) pts.push(point);
  }
  if (pts.length === 0) return undefined;
  const sum = pts.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / pts.length, y: sum.y / pts.length };
}

export function buildRoomPointsById(
  data: IEmbedLayoutViewData,
): Map<number, LayoutPoint> {
  return new Map(data.roomPoints.map((p) => [p.id, { x: p.x, y: p.y }]));
}

export function layoutBounds(data: IEmbedLayoutViewData): LayoutBounds | undefined {
  if (data.roomPoints.length === 0) return undefined;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of data.roomPoints) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return undefined;
  return { minX, maxX, minY, maxY };
}

/** Pin at the centroid of a random rendered room. */
export function pickRandomRoomPin(
  data: IEmbedLayoutViewData,
  renderedRoomIds: readonly number[],
  floorId: number,
): LayoutPinSpec | undefined {
  const intersecting =
    renderedRoomIds.length > 0
      ? data.rooms.filter((room) => renderedRoomIds.includes(room.id))
      : [];
  // Building-3d may render other floors; fall back to this floor's rooms for a visible pin.
  const room = pickRandomItem(intersecting.length > 0 ? intersecting : data.rooms);
  if (!room) return undefined;
  const center = roomCentroid(room, buildRoomPointsById(data));
  if (!center) return undefined;
  return {
    x: center.x,
    y: center.y,
    floorId,
    label: room.name ? `Espace ${room.name}` : `Espace ${room.id}`,
  };
}

/** Pin at a random layout point inside the plan bounding box. */
export function pickRandomPlanPin(data: IEmbedLayoutViewData, floorId: number): LayoutPinSpec | undefined {
  const bounds = layoutBounds(data);
  if (!bounds) return undefined;
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  if (spanX <= 0 || spanY <= 0) {
    return {
      x: bounds.minX,
      y: bounds.minY,
      floorId,
      label: 'Plan',
    };
  }
  return {
    x: bounds.minX + Math.random() * spanX,
    y: bounds.minY + Math.random() * spanY,
    floorId,
    label: 'Plan',
  };
}
