import type { IFloor } from '@surfy/surfy-sdk/client';

import { createDemoSurfyClient } from './createDemoSurfyClient';
import { demoQueryNodeBuildingsWithFloors } from './demos/data/demoQueryNodes';

export type DemoFloor = {
  readonly id: number;
  readonly name: string;
  readonly level: number;
};

export type DemoBuilding = {
  readonly id: number;
  readonly name: string;
  readonly floors: readonly DemoFloor[];
};

export type DemoCatalog = {
  readonly tenant: string;
  readonly buildings: readonly DemoBuilding[];
};

export { ensureDemoSession, getDemoProxyBearer } from './demoSession';

type BuildingWithFloorsDto = {
  readonly id: number;
  readonly name: string;
  readonly floors?: { readonly entities?: readonly IFloor[] } | readonly IFloor[];
};

function mapNestedFloors(floors: BuildingWithFloorsDto['floors']): DemoFloor[] {
  const list: readonly IFloor[] = Array.isArray(floors)
    ? floors
    : (floors && 'entities' in floors ? (floors.entities ?? []) : []);
  return [...list]
    .map((floor) => ({
      id: floor.id,
      name: floor.name,
      level: floor.level,
    }))
    .toSorted((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

/**
 * Live catalog — one SurfyClient.fetchEntities with a demo-owned nested QueryNode.
 */
export async function fetchDemoCatalog(): Promise<DemoCatalog> {
  const client = await createDemoSurfyClient();
  const rows = await client.fetchEntities<BuildingWithFloorsDto>(demoQueryNodeBuildingsWithFloors());
  const buildings: DemoBuilding[] = rows.map((building) => ({
    id: building.id,
    name: building.name,
    floors: mapNestedFloors(building.floors),
  }));

  return {
    tenant: client.tenant,
    buildings: buildings.toSorted((a, b) => a.name.localeCompare(b.name)),
  };
}
