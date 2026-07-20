import { SURFY_DEMO_PROXY_BEARER } from '@surfy/surfy-demo-auth/session';

import { getSurfyApiPath, getSurfySessionUrl } from './surfyEnv';

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

type SessionResponse = {
  tenant: string;
  authMode?: string;
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

let sessionTenant: string | null = null;

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

function gateHeaders(): HeadersInit | undefined {
  const gate = import.meta.env.VITE_DEMO_GATE_KEY?.trim();
  return gate ? { 'X-Surfy-Demo-Key': gate } : undefined;
}

/**
 * Opens API-mode session (HttpOnly cookie). Surfy JWT never enters JS.
 */
export async function ensureDemoSession(): Promise<{ tenant: string }> {
  if (sessionTenant) {
    return { tenant: sessionTenant };
  }
  const response = await fetch(getSurfySessionUrl(), {
    credentials: 'include',
    headers: gateHeaders(),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? `Session failed (${response.status})`);
  }
  const data = (await response.json()) as SessionResponse;
  if (!data.tenant) {
    throw new Error('Session response missing tenant');
  }
  sessionTenant = data.tenant;
  return { tenant: data.tenant };
}

/** Opaque bearer for the SDK — proxy swaps it for the real Surfy JWT. */
export async function getDemoProxyBearer(): Promise<string> {
  await ensureDemoSession();
  return SURFY_DEMO_PROXY_BEARER;
}

/**
 * Live catalog — reference buildings + floors.
 * Auth: session cookie + proxy (no Surfy token in the browser).
 */
export async function fetchDemoCatalog(): Promise<DemoCatalog> {
  const { tenant } = await ensureDemoSession();

  const response = await fetch(getSurfyApiPath('/api/v1/data/entities?buildings'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SURFY_DEMO_PROXY_BEARER}`,
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
