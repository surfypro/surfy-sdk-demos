import type {
  SurfyLayout3dControls,
  SurfyLayout3dOptions,
  SurfyLayout3dWallMode,
  SurfyLayout3dZoomMode,
} from '@surfy/surfy-sdk';

export const DEFAULT_FLOOR_SPACE = 240;

export const DEFAULT_BUILDING_3D_OPTIONS = {
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

export type Building3dPanelState = {
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

export function createInitialBuilding3dPanelState(floorIds: number[]): Building3dPanelState {
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

export function buildInitialBuilding3dOptions(floorIds: number[]): SurfyLayout3dOptions {
  return {
    ...DEFAULT_BUILDING_3D_OPTIONS,
    selectedFloorIds: floorIds,
    structureFloorIds: floorIds,
  };
}
