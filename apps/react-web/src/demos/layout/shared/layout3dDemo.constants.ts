import type {
  SurfyLayout3dControls,
  SurfyLayout3dOptions,
  SurfyLayout3dWallMode,
  SurfyLayout3dZoomMode,
} from '@surfy/surfy-sdk';

export type Layout3dDemoScope = 'building' | 'floor';

export const DEFAULT_FLOOR_SPACE = 240;

/** Defaults shared by building-3d and floor-3d mounts. */
export const DEFAULT_LAYOUT_3D_OPTIONS = {
  floorSpace: DEFAULT_FLOOR_SPACE,
  showRoomLabels: true,
  showFloorLabels: true,
  wallMode: 'no',
  showStructureWalls: false,
  singleFloorNavigation: { controls: 'map', zoomMode: 'zenith' },
  multiFloorNavigation: { controls: 'building', zoomMode: 'isometric' },
} as const satisfies SurfyLayout3dOptions;

export const WALL_MODE_OPTIONS: readonly SurfyLayout3dWallMode[] = [
  'cuby',
  'no',
  'half',
  'reality',
  'cuby-reality-selected',
  'no-wall-selected',
];

export const CONTROLS_OPTIONS: readonly SurfyLayout3dControls[] = ['map', 'orbit', 'building'];
export const ZOOM_MODE_OPTIONS: readonly SurfyLayout3dZoomMode[] = ['zenith', 'isometric'];

export type Layout3dPanelState = {
  floorSpace: number;
  showRoomLabels: boolean;
  showFloorLabels: boolean;
  roomShowLabel: boolean;
  selectedFloorIds: number[];
  wallMode: SurfyLayout3dWallMode;
  showStructureWalls: boolean;
  structureFloorIds: number[];
  singleControls: SurfyLayout3dControls;
  singleZoomMode: SurfyLayout3dZoomMode;
  multiControls: SurfyLayout3dControls;
  multiZoomMode: SurfyLayout3dZoomMode;
};

export function createInitialLayout3dPanelState(floorIds: number[]): Layout3dPanelState {
  return {
    floorSpace: DEFAULT_FLOOR_SPACE,
    showRoomLabels: true,
    showFloorLabels: true,
    roomShowLabel: true,
    selectedFloorIds: floorIds,
    wallMode: 'no',
    showStructureWalls: false,
    structureFloorIds: floorIds,
    singleControls: 'map',
    singleZoomMode: 'zenith',
    multiControls: 'building',
    multiZoomMode: 'isometric',
  };
}

/** Initial `setOptions` / mount options for building-3d (multi-floor). */
export function buildInitialBuilding3dOptions(floorIds: number[]): SurfyLayout3dOptions {
  return {
    ...DEFAULT_LAYOUT_3D_OPTIONS,
    selectedFloorIds: floorIds,
    structureFloorIds: floorIds,
  };
}

/**
 * Initial options for floor-3d — single floor locked.
 * Omits multi-floor knobs; `selectedFloorIds` forced by SDK to `[floorId]`.
 */
export function buildInitialFloor3dOptions(floorId: number): SurfyLayout3dOptions {
  return {
    showRoomLabels: DEFAULT_LAYOUT_3D_OPTIONS.showRoomLabels,
    showFloorLabels: DEFAULT_LAYOUT_3D_OPTIONS.showFloorLabels,
    wallMode: DEFAULT_LAYOUT_3D_OPTIONS.wallMode,
    showStructureWalls: DEFAULT_LAYOUT_3D_OPTIONS.showStructureWalls,
    structureFloorIds: [floorId],
    singleFloorNavigation: DEFAULT_LAYOUT_3D_OPTIONS.singleFloorNavigation,
    selectedFloorIds: [floorId],
  };
}

/** @deprecated use DEFAULT_LAYOUT_3D_OPTIONS */
export const DEFAULT_BUILDING_3D_OPTIONS = DEFAULT_LAYOUT_3D_OPTIONS;

/** @deprecated use createInitialLayout3dPanelState */
export const createInitialBuilding3dPanelState = createInitialLayout3dPanelState;

/** @deprecated use Layout3dPanelState */
export type Building3dPanelState = Layout3dPanelState;
