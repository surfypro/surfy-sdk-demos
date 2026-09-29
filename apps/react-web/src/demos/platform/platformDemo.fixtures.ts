/**
 * Local fixtures for Vue plateforme / campus demos (mirror SDK Storybook fixtures).
 * Keeps the demo usable without live GetVision when RPC is unavailable.
 */

export type DemoPlatformVision = {
  readonly version: string;
  readonly buildings: readonly {
    readonly id: number;
    readonly name: string;
    readonly campusId?: number;
    readonly lat?: number;
    readonly lng?: number;
    readonly footprints: readonly { readonly spaceId: number; readonly xy: readonly number[] }[];
  }[];
  readonly masterData: { readonly roomTypeIds: readonly number[] };
};

export type DemoPlatformBuildingDetail = {
  readonly version: string;
  readonly buildingId: number;
  readonly floors: readonly {
    readonly id: number;
    readonly level: number;
    readonly heightCm: number;
    readonly altitudeM?: number;
    readonly spaces: readonly {
      readonly id: number;
      readonly roomTypeId?: number;
      readonly xy: readonly number[];
    }[];
    readonly furniture: readonly { readonly id: number; readonly itemTypeId: number; readonly x: number; readonly y: number }[];
  }[];
  readonly calibration: {
    readonly buildingAddress: { readonly lat: number; readonly lng: number };
    readonly backgroundSize: { readonly width: number; readonly height: number };
    readonly mapRatio: number;
    readonly transform: {
      readonly translate: { readonly x: number; readonly y: number };
      readonly rotate: number;
      readonly scale: number;
    };
    readonly altitudeFloor0M?: number;
  };
  readonly masterData: { readonly roomTypeIds: readonly number[]; readonly itemTypeIds: readonly number[] };
};

export const DEMO_PLATFORM_VISION_FIXTURE: DemoPlatformVision = {
  version: 'demo-vision-1',
  buildings: [
    {
      id: 101,
      name: 'Tower A',
      campusId: 1,
      lat: 48.8566,
      lng: 2.3522,
      footprints: [{ spaceId: 1, xy: [0, 0, 10, 0, 10, 10, 0, 10] }],
    },
    {
      id: 102,
      name: 'Tower B',
      campusId: 1,
      lat: 48.8576,
      lng: 2.3532,
      footprints: [{ spaceId: 2, xy: [0, 0, 8, 0, 8, 8, 0, 8] }],
    },
    {
      id: 201,
      name: 'Remote Campus Hall',
      campusId: 2,
      lat: 48.86,
      lng: 2.36,
      footprints: [],
    },
  ],
  masterData: { roomTypeIds: [2] },
};

export const DEMO_PLATFORM_BUILDING_DETAIL_FIXTURE: DemoPlatformBuildingDetail = {
  version: 'demo-building-1',
  buildingId: 101,
  floors: [
    {
      id: 10,
      level: 0,
      heightCm: 300,
      altitudeM: 100,
      spaces: [{ id: 1, roomTypeId: 2, xy: [0, 0, 5, 0, 5, 5, 0, 5] }],
      furniture: [{ id: 9, itemTypeId: 3, x: 1, y: 2 }],
    },
    {
      id: 11,
      level: 1,
      heightCm: 280,
      altitudeM: 103,
      spaces: [{ id: 2, roomTypeId: 2, xy: [0, 0, 4, 0, 4, 4, 0, 4] }],
      furniture: [{ id: 10, itemTypeId: 3, x: 2, y: 3 }],
    },
  ],
  calibration: {
    buildingAddress: { lat: 48.8566, lng: 2.3522 },
    backgroundSize: { width: 800, height: 600 },
    mapRatio: 0.05,
    transform: {
      translate: { x: 0, y: 0 },
      rotate: 0,
      scale: 1,
    },
    altitudeFloor0M: 100,
  },
  masterData: { roomTypeIds: [2], itemTypeIds: [3] },
};

/** Mid floor-0 band, near space 1 centre (layout ~2.5,2.5). */
export const DEMO_PLATFORM_GEO_INJECT = {
  lat: 48.8566,
  lng: 2.3522,
  altitude: 101.5,
} as const;

export const DEMO_DEFAULT_CAMPUS_ID = 1;
