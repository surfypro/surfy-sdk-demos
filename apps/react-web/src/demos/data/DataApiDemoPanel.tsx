import { useCallback, useState } from 'react';
import type { IBuilding, IFloor, IRoom } from '@surfy/surfy-sdk/client';

import { createDemoSurfyClient } from '../../createDemoSurfyClient';
import { useDemoI18n } from '../../i18n/DemoI18nProvider';
import { ApiSnippetPanel } from '../layout/actions/ApiSnippetPanel';
import { FetchBuildingsAction } from './actions/FetchBuildingsAction';
import { FetchFloorsAction } from './actions/FetchFloorsAction';
import { FetchRoomsAction } from './actions/FetchRoomsAction';
import {
  demoQueryNodeBuildings,
  demoQueryNodeFloorsByBuilding,
  demoQueryNodeRoomsByFloor,
} from './demoQueryNodes';

const SNIPPET_BUILDINGS = `import {
  SurfyClient,
  createFilter,
  type IBuilding,
  type SurfyQueryNode,
} from '@surfy/surfy-sdk/client';

const client = SurfyClient.create({
  baseUrl: origin + '/proxy', // demo server proxy (injects Bearer)
  tenant,
  getAccessToken,
});

// Business QueryNode — defined in your app, not in the SDK
const buildingsQn: SurfyQueryNode<'building'> = {
  name: 'building',
  _: ['id', 'name'],
  filters: [createFilter('is', 'buildingId', null)],
  order: 'name asc',
  pagination: { limit: 200 },
};

const buildings = await client.fetchEntities<IBuilding>(buildingsQn);`;

function snippetFloors(buildingId: number): string {
  return `const floorsQn: SurfyQueryNode<'floor'> = {
  name: 'floor',
  _: ['id', 'name', 'level', 'buildingId'],
  filters: [createFilter('eq', 'buildingId', ${buildingId})],
  order: 'level asc',
  pagination: { limit: 200 },
};

const floors = await client.fetchEntities<IFloor>(floorsQn);`;
}

function snippetRooms(floorId: number): string {
  return `const roomsQn: SurfyQueryNode<'room'> = {
  name: 'room',
  _: ['id', 'name', 'floorId'],
  filters: [createFilter('eq', 'floorId', ${floorId})],
  order: 'name asc',
  pagination: { limit: 500 },
};

const rooms = await client.fetchEntities<IRoom>(roomsQn);`;
}

interface DataApiDemoPanelProps {
  readonly active: boolean;
}

/**
 * Data API demo — no building/floor reference picker.
 * Scope IDs come from previous `fetchEntities` results (app-owned QueryNodes).
 */
export function DataApiDemoPanel({ active }: DataApiDemoPanelProps) {
  const { t } = useDemoI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState('// run an action');
  const [snippet, setSnippet] = useState(SNIPPET_BUILDINGS);
  const [buildingId, setBuildingId] = useState<number | undefined>();
  const [floorId, setFloorId] = useState<number | undefined>();

  const run = useCallback(async (label: string, snip: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setSnippet(snip);
    try {
      const data = await action();
      setResultJson(JSON.stringify({ action: label, data }, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setResultJson(JSON.stringify({ action: label, error: message }, null, 2));
    } finally {
      setBusy(false);
    }
  }, []);

  if (!active) {
    return null;
  }

  return (
    <section className="demo-section" data-testid="demo-section-data-api">
      <header className="demo-section__header">
        <h2>{t('data.title')}</h2>
        <p className="demo-section__description">{t('data.description')}</p>
      </header>

      <div className="demo-section__workspace">
        <aside className="demo-section__sidebar" data-testid="demo-data-sidebar">
          <div className="actions">
            <FetchBuildingsAction
              disabled={busy}
              onClick={() =>
                void run('fetchEntities(buildingsQn)', SNIPPET_BUILDINGS, async () => {
                  const client = await createDemoSurfyClient();
                  const buildings = await client.fetchEntities<IBuilding>(demoQueryNodeBuildings());
                  setBuildingId(buildings[0]?.id);
                  setFloorId(undefined);
                  return buildings;
                })
              }
            />
            <FetchFloorsAction
              disabled={busy || buildingId === undefined}
              onClick={() => {
                if (buildingId === undefined) return;
                void run('fetchEntities(floorsQn)', snippetFloors(buildingId), async () => {
                  const client = await createDemoSurfyClient();
                  const floors = await client.fetchEntities<IFloor>(
                    demoQueryNodeFloorsByBuilding(buildingId),
                  );
                  setFloorId(floors[0]?.id);
                  return floors;
                });
              }}
            />
            <FetchRoomsAction
              disabled={busy || floorId === undefined}
              onClick={() => {
                if (floorId === undefined) return;
                void run('fetchEntities(roomsQn)', snippetRooms(floorId), async () => {
                  const client = await createDemoSurfyClient();
                  return client.fetchEntities<IRoom>(demoQueryNodeRoomsByFloor(floorId));
                });
              }}
            />
          </div>
          {buildingId === undefined ? <p className="demo-catalog-hint">{t('data.needBuilding')}</p> : null}
          {buildingId !== undefined && floorId === undefined ? (
            <p className="demo-catalog-hint">{t('data.needFloor')}</p>
          ) : null}
          {buildingId !== undefined ? (
            <p className="demo-catalog-hint" data-testid="demo-data-scope">
              {t('data.scopeFromResult', { buildingId, floorId: floorId ?? '—' })}
            </p>
          ) : null}
          {error ? (
            <p className="demo-catalog-error" role="alert" data-testid="demo-data-error">
              {error}
            </p>
          ) : null}
          <ApiSnippetPanel
            testIdPrefix="demo-data-snippet"
            titleKey="data.snippetTitle"
            value={snippet}
          />
        </aside>
        <div className="demo-section__map">
          <h3 className="demo-data-result__title">{t('data.result')}</h3>
          <pre className="demo-data-result" data-testid="demo-data-result">
            {resultJson}
          </pre>
        </div>
      </div>
    </section>
  );
}
