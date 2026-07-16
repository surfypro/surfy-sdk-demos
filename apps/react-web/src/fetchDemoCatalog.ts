import { getSurfyDemoBaseUrl, getSurfyTokenUrl } from './surfyEnv';

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

type TokenResponse = {
  token: string;
  tenant?: string;
};

type FloorDto = {
  id: number;
  name: string;
  level: number;
};

type BuildingDto = {
  id: number;
  name: string;
  floors?: { entities?: FloorDto[] } | FloorDto[];
};

type EntitiesResponse = {
  entities?: BuildingDto[];
};

function mapFloors(floors: BuildingDto['floors']): DemoFloor[] {
  const list = Array.isArray(floors) ? floors : (floors?.entities ?? []);
  return list
    .map((floor) => ({
      id: floor.id,
      name: floor.name,
      level: floor.level,
    }))
    .toSorted((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

async function fetchDemoAccess(tokenUrl: string): Promise<TokenResponse> {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  const response = await fetch(tokenUrl, {
    headers: gate ? { 'X-Surfy-Demo-Key': gate } : undefined,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? `Token request failed (${response.status})`);
  }
  return (await response.json()) as TokenResponse;
}

/**
 * Live catalog for the demo picker — buildings + floors (reference buildings only).
 * Auth via /api/surfy-token; data via POST /api/v1/data/entities (same-origin proxy on Netlify).
 */
export async function fetchDemoCatalog(): Promise<DemoCatalog> {
  const baseUrl = getSurfyDemoBaseUrl();
  const { token, tenant } = await fetchDemoAccess(getSurfyTokenUrl());
  if (!tenant) {
    throw new Error('Token response missing tenant (update demo-server / Netlify surfy-token)');
  }

  const entitiesUrl = new URL('/api/v1/data/entities?buildings', `${baseUrl || 'http://localhost'}/`);
  const path = import.meta.env.VITE_SURFY_BASE_URL?.trim()
    ? entitiesUrl.toString()
    : `${entitiesUrl.pathname}${entitiesUrl.search}`;

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant': tenant,
    },
    body: JSON.stringify({
      queryNode: {
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
        // Reference buildings only (exclude scenario clones)
        filters: [{ operator: 'is', column: 'buildingId', value: null }],
        order: 'name asc',
        pagination: { limit: 200 },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to list buildings (${response.status}): ${detail || response.statusText}`);
  }

  const payload = (await response.json()) as EntitiesResponse;
  const buildings: DemoBuilding[] = (payload.entities ?? []).map((building) => ({
    id: building.id,
    name: building.name,
    floors: mapFloors(building.floors),
  }));

  return { tenant, buildings };
}

export async function fetchSurfyDemoToken(): Promise<string> {
  const { token } = await fetchDemoAccess(getSurfyTokenUrl());
  return token;
}
