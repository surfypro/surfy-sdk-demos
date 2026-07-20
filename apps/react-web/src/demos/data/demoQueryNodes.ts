import {
  createFilter,
  type IBuilding,
  type IFloor,
  type IRoom,
  type SurfyQueryNode,
} from '@surfy/surfy-sdk/client';

/**
 * Demo-only business QueryNodes — not part of `@surfy/surfy-sdk`.
 * Apps build their own queries the same way. Entity types = Surfy models.
 */

export function demoQueryNodeBuildings(limit = 200): SurfyQueryNode<'building'> {
  return {
    name: 'building',
    _: ['id', 'name'],
    filters: [createFilter('is', 'buildingId', null)],
    order: 'name asc',
    pagination: { limit },
  };
}

export function demoQueryNodeBuildingsWithFloors(limit = 200): SurfyQueryNode<'building'> {
  return {
    name: 'building',
    _: [
      'id',
      'name',
      {
        name: 'floors',
        _: ['id', 'name', 'level'],
        order: 'level asc',
      },
    ],
    filters: [createFilter('is', 'buildingId', null)],
    order: 'name asc',
    pagination: { limit },
  };
}

export function demoQueryNodeFloorsByBuilding(
  buildingId: number,
  limit = 200,
): SurfyQueryNode<'floor'> {
  return {
    name: 'floor',
    _: ['id', 'name', 'level', 'buildingId'],
    filters: [createFilter('eq', 'buildingId', buildingId)],
    order: 'level asc',
    pagination: { limit },
  };
}

export function demoQueryNodeRoomsByFloor(floorId: number, limit = 500): SurfyQueryNode<'room'> {
  return {
    name: 'room',
    _: ['id', 'name', 'floorId'],
    filters: [createFilter('eq', 'floorId', floorId)],
    order: 'name asc',
    pagination: { limit },
  };
}

export type { IBuilding, IFloor, IRoom };
