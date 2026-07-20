import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SurfyLayout,
  SurfyLayout3dOptions,
  SurfyRoomUpdateOptions,
  SurfySdkErrorDetail,
} from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

import { buildInitialBuilding3dOptions } from './building3dDemo.constants';
import { Building3dDemoControls } from './Building3dDemoControls';
import {
  buildApiSnippetBlock,
  snippetClearRoomColors,
  snippetFitToView,
  snippetSetOptions,
  snippetSetRoomColors,
  snippetUpdateRoom,
} from './demoApiSnippets';
import {
  getConfiguredDemoRoomId,
  pickRandomItem,
  waitForDemoRoomId,
} from './demoLayoutElement';
import type { DemoSectionConfig } from './demoSections';
import { isSectionKindRegistered } from './demoSections';
import { getDemoThemeOptions } from './demoThemes';
import { getDemoProxyBearer, type DemoFloor } from './fetchDemoCatalog';
import { getSurfyDemoBaseUrl } from './surfyEnv';
import { useDemoTheme } from './useDemoTheme';

const DEMO_ROOM_COLOR = '#2196F3';
const RANDOM_BLINK_INTERVAL_MS = 250;
const API_LOG_MAX_LINES = 14;

const RANDOM_ROOM_COLORS = [
  '#e91e63',
  '#9c27b0',
  '#3f51b5',
  '#03a9f4',
  '#009688',
  '#8bc34a',
  '#ffc107',
  '#ff5722',
] as const;

interface LayoutDemoPanelProps {
  readonly section: DemoSectionConfig;
  readonly active: boolean;
  readonly tenant: string;
  readonly entityId: number | undefined;
  readonly buildingFloors?: readonly DemoFloor[];
}

export function LayoutDemoPanel({
  section,
  active,
  tenant,
  entityId,
  buildingFloors = [],
}: LayoutDemoPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayout | null>(null);
  const [lastEvent, setLastEvent] = useState('none');
  const [demoRoomId, setDemoRoomId] = useState<number | undefined>(getConfiguredDemoRoomId());
  const [fillParent, setFillParent] = useState(true);
  const [randomBlinkOn, setRandomBlinkOn] = useState(false);
  const [lastBlink, setLastBlink] = useState<{ roomId: number; color: string } | null>(null);
  const [apiLog, setApiLog] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const apiLogTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const registered = isSectionKindRegistered(section.kind);
  const { themeId } = useDemoTheme();
  const isBuilding3d = section.id === 'building-3d';

  const pushApiLine = useCallback((line: string) => {
    setApiLog((prev) => [...prev, line].slice(-API_LOG_MAX_LINES));
  }, []);

  const apply3dOptions = useCallback(
    (patch: SurfyLayout3dOptions) => {
      layoutRef.current?.setOptions(patch);
      pushApiLine(snippetSetOptions(JSON.stringify(patch)));
    },
    [pushApiLine],
  );

  const updateRoom = useCallback((roomId: number, options: SurfyRoomUpdateOptions) => {
    layoutRef.current?.updateRoom(roomId, options);
  }, []);

  const fitToView = useCallback(() => {
    layoutRef.current?.fitToView();
    pushApiLine(snippetFitToView());
  }, [pushApiLine]);

  const logUpdateRoom = useCallback(
    (roomId: number, optionsLiteral: string) => {
      pushApiLine(snippetUpdateRoom(roomId, optionsLiteral));
    },
    [pushApiLine],
  );

  useEffect(() => {
    const el = apiLogTextareaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [apiLog]);

  useEffect(() => {
    layoutRef.current?.setFillParent(fillParent);
  }, [fillParent]);

  useEffect(() => {
    layoutRef.current?.setTheme(getDemoThemeOptions(themeId));
  }, [themeId]);

  useEffect(() => {
    if (!randomBlinkOn) {
      return;
    }

    const tick = () => {
      const layout = layoutRef.current;
      if (!layout) return;
      const roomId = pickRandomItem(layout.getRenderedRoomIds());
      const color = pickRandomItem(RANDOM_ROOM_COLORS);
      if (roomId === undefined || color === undefined) return;
      layout.setRoomColors({ [roomId]: color });
      setLastBlink({ roomId, color });
      setApiLog((prev) => [...prev, snippetSetRoomColors(roomId, color)].slice(-API_LOG_MAX_LINES));
    };

    tick();
    const timer = window.setInterval(tick, RANDOM_BLINK_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [randomBlinkOn, active, entityId]);

  useEffect(() => {
    if (!active || entityId === undefined || !registered) return;

    const container = containerRef.current;
    if (!container) return;

    const layout = SurfySdk.mount({
      container,
      kind: section.kind,
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      floorId: section.entityKind === 'floor' ? entityId : undefined,
      buildingId: section.entityKind === 'building' ? entityId : undefined,
      fillParent: true,
      theme: getDemoThemeOptions(themeId),
      options:
        section.kind === 'building-3d'
          ? buildInitialBuilding3dOptions(buildingFloors.map((floor) => floor.id))
          : undefined,
      getAccessToken: () => getDemoProxyBearer(),
      onReady: () => {
        setLastEvent('surfy:ready');
        const current = layoutRef.current;
        if (!current) return;
        void waitForDemoRoomId(current).then((roomId) => {
          if (roomId !== undefined) {
            setDemoRoomId((prev) => prev ?? roomId);
          }
        });
      },
      onRoomHover: (detail) => {
        setLastEvent(
          detail ? `surfy:room-hover ${detail.roomId} ${detail.name}` : 'surfy:room-hover leave',
        );
      },
      onRoomSelected: (detail) => {
        setDemoRoomId(detail.roomId);
        setLastEvent(`surfy:room-selected ${detail.roomId} ${detail.name}`);
      },
      onError: (detail: SurfySdkErrorDetail) => {
        setLastEvent(`surfy:error ${detail.code} ${detail.message}`);
      },
    });

    layoutRef.current = layout;

    return () => {
      setRandomBlinkOn(false);
      setLastBlink(null);
      setApiLog([]);
      setCopyFeedback(null);
      layout.destroy();
      layoutRef.current = null;
      setLastEvent('none');
    };
  }, [active, section, tenant, entityId, buildingFloors, themeId, registered]);

  if (!active) {
    return null;
  }

  const entityAttr = section.entityKind === 'building' ? 'buildingId' : 'floorId';

  return (
    <section className="demo-section" data-testid={`demo-section-${section.id}`}>
      <header className="demo-section__header">
        <h2>{section.label}</h2>
        <p className="demo-section__tag">
          <code>SurfySdk.mount({'{'} kind: &apos;{section.kind}&apos; {'}'})</code>
          {entityId !== undefined ? (
            <>
              {' '}
              · {entityAttr}={entityId}
            </>
          ) : null}
        </p>
        <p className="demo-section__description">{section.description}</p>
      </header>

      {!registered ? (
        <div className="demo-section__unavailable" data-testid="demo-section-unavailable">
          <p>
            Ce kind n&apos;est pas encore enregistré dans le bundle SDK (phase 2 — moteur CubyV2).
            La section sera activée automatiquement à la publication de{' '}
            <code>{section.kind}</code>.
          </p>
        </div>
      ) : entityId === undefined ? (
        <div className="demo-section__unavailable" data-testid="demo-section-no-entity">
          <p>Sélectionnez un bâtiment et un étage dans la liste ci-dessus.</p>
        </div>
      ) : (
        <div className="demo-section__workspace">
          <aside className="demo-section__sidebar" data-testid="demo-sidebar">
            <p>
              Last event: <span data-testid="demo-last-event">{lastEvent}</span>
            </p>
            <div className="actions">
              <button
                type="button"
                data-testid="demo-color-room"
                disabled={demoRoomId === undefined || randomBlinkOn}
                onClick={() => {
                  if (demoRoomId !== undefined) {
                    layoutRef.current?.setRoomColors({ [demoRoomId]: DEMO_ROOM_COLOR });
                    pushApiLine(snippetSetRoomColors(demoRoomId, DEMO_ROOM_COLOR));
                  }
                }}
              >
                {demoRoomId === undefined ? 'Color room' : `Color room ${demoRoomId}`}
              </button>
              <button
                type="button"
                data-testid="demo-random-blink"
                aria-pressed={randomBlinkOn}
                onClick={() => {
                  setRandomBlinkOn((on) => {
                    if (on) {
                      layoutRef.current?.clearRoomColors();
                      setLastBlink(null);
                      pushApiLine(snippetClearRoomColors());
                      return false;
                    }
                    return true;
                  });
                }}
              >
                {randomBlinkOn ? 'Stop random blink' : 'Random blink'}
              </button>
              <button
                type="button"
                data-testid="demo-clear-colors"
                onClick={() => {
                  setRandomBlinkOn(false);
                  setLastBlink(null);
                  layoutRef.current?.clearRoomColors();
                  pushApiLine(snippetClearRoomColors());
                }}
              >
                Clear colors
              </button>
              {isBuilding3d ? (
                <button type="button" data-testid="demo-fit-to-view" onClick={fitToView}>
                  Fit to view
                </button>
              ) : null}
            </div>
            {lastBlink ? (
              <p className="demo-blink-status" data-testid="demo-blink-status">
                Lit room{' '}
                <code data-testid="demo-blink-room-id">{lastBlink.roomId}</code>
                <span
                  className="demo-blink-swatch"
                  data-testid="demo-blink-color"
                  style={{ backgroundColor: lastBlink.color }}
                  title={lastBlink.color}
                />
                <code>{lastBlink.color}</code>
              </p>
            ) : null}
            <label className="floor-plan-options">
              <input
                type="checkbox"
                checked={fillParent}
                onChange={(event) => setFillParent(event.target.checked)}
              />
              Remplir le conteneur parent
            </label>

            {isBuilding3d ? (
              <Building3dDemoControls
                buildingFloors={buildingFloors}
                demoRoomId={demoRoomId}
                onApplyOptions={apply3dOptions}
                onUpdateRoom={updateRoom}
                onFitToView={fitToView}
                onLogUpdateRoom={logUpdateRoom}
              />
            ) : null}

            <div className="demo-api-snippet" data-testid="demo-api-snippet">
              <div className="demo-api-snippet__header">
                <span>Appel SurfySdk — copiable</span>
                <button
                  type="button"
                  data-testid="demo-api-snippet-copy"
                  onClick={() => {
                    const text = buildApiSnippetBlock(section.kind, apiLog);
                    void navigator.clipboard.writeText(text).then(
                      () => {
                        setCopyFeedback('Copié');
                        window.setTimeout(() => setCopyFeedback(null), 1500);
                      },
                      () => setCopyFeedback('Échec copie'),
                    );
                  }}
                >
                  {copyFeedback ?? 'Copier'}
                </button>
              </div>
              <textarea
                ref={apiLogTextareaRef}
                className="demo-api-snippet__code"
                data-testid="demo-api-snippet-textarea"
                readOnly
                spellCheck={false}
                value={buildApiSnippetBlock(section.kind, apiLog)}
                rows={Math.min(12, Math.max(4, apiLog.length + 8))}
              />
            </div>
          </aside>

          <div className="demo-section__map">
            <div ref={containerRef} className="layout-host" data-testid="layout-host" />
          </div>
        </div>
      )}
    </section>
  );
}
