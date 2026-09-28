import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SurfyLayout, SurfyLayout3dOptions, SurfyRoomUpdateOptions } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

import {
  buildApiSnippetBlock,
  snippetFitToView,
  snippetSetOptions,
  snippetUpdateRoom,
  snippetZoomOnRoom,
} from '../../../demoApiSnippets';
import { isRenderedDemoRoom } from '../../../demoLayoutElement';
import { getDemoProxyBearer } from '../../../demoSession';
import { getDemoThemeOptions } from '../../../demoThemes';
import type { DemoFloor } from '../../../fetchDemoCatalog';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { ApiSnippetPanel } from '../actions/ApiSnippetPanel';
import type { DemoSurfaceMode } from '../shared/demoSurfaceMode';
import { DemoReactFloorHost } from '../shared/DemoReactLayoutHost';
import { Layout3dDemoControls } from '../shared/Layout3dDemoControls';
import { buildInitialFloor3dOptions } from '../shared/layout3dDemo.constants';
import { LayoutDemoCommonActions } from '../shared/LayoutDemoCommonActions';
import { LayoutDemoShell } from '../shared/LayoutDemoShell';
import { useLayoutDemoChrome } from '../shared/useLayoutDemoChrome';

const MOUNT_SNIPPET = 'SurfySdk.mountFloor3d({ floorId })';
const REACT_SNIPPET = '<SurfyFloorLayout3dReact floorId={…} />';

interface Floor3dDemoPanelProps {
  readonly active: boolean;
  readonly tenant: string;
  readonly floorId: number | undefined;
  /** Optional catalog floor for label in controls; id must match floorId. */
  readonly floor?: DemoFloor;
  readonly title: string;
  readonly description: string;
}

/**
 * Floor 3D demo — API JS (`mountFloor3d`) or Surfy React Web.
 * Shares Layout3dDemoControls with building-3d (`scope="floor"`).
 */
export function Floor3dDemoPanel({
  active,
  tenant,
  floorId,
  floor,
  title,
  description,
}: Floor3dDemoPanelProps) {
  const [surfaceMode, setSurfaceMode] = useState<DemoSurfaceMode>('api-js');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayout | null>(null);
  const registered = SurfySdk.isKindRegistered('floor-3d');

  const floorsForControls = useMemo((): readonly DemoFloor[] => {
    if (floorId === undefined) return [];
    if (floor && floor.id === floorId) return [floor];
    return [{ id: floorId, name: `Floor ${floorId}`, level: 0 }];
  }, [floor, floorId]);

  const {
    themeId,
    pushApiLine,
    createMountListeners,
    resetOnUnmount,
    lastEvent,
    demoRoomId,
    randomBlinkOn,
    lastBlink,
    fillParent,
    setFillParent,
    colorDemoRoom,
    clearColors,
    toggleRandomBlink,
    apiLog,
  } = useLayoutDemoChrome({
    layoutRef,
    active: active && surfaceMode === 'api-js',
    entityId: floorId,
  });

  const apply3dOptions = useCallback(
    (patch: SurfyLayout3dOptions) => {
      layoutRef.current?.setOptions(patch);
      pushApiLine(snippetSetOptions(JSON.stringify(patch)));
    },
    [pushApiLine],
  );

  const updateRoom = useCallback((roomId: number, options: SurfyRoomUpdateOptions) => {
    if (!isRenderedDemoRoom(layoutRef.current, roomId)) {
      return;
    }
    layoutRef.current?.updateRoom(roomId, options);
  }, []);

  const fitToView = useCallback(() => {
    layoutRef.current?.fitToView();
    pushApiLine(snippetFitToView());
  }, [pushApiLine]);

  const zoomOnRoom = useCallback(
    (roomId: number) => {
      if (!isRenderedDemoRoom(layoutRef.current, roomId)) {
        return;
      }
      layoutRef.current?.zoomOn({ roomId, diameterMeters: 5 });
      pushApiLine(snippetZoomOnRoom(roomId));
    },
    [pushApiLine],
  );

  const logUpdateRoom = useCallback(
    (roomId: number, optionsLiteral: string) => {
      pushApiLine(snippetUpdateRoom(roomId, optionsLiteral));
    },
    [pushApiLine],
  );

  useEffect(() => {
    if (!active || surfaceMode !== 'api-js' || floorId === undefined || !registered) return;

    const container = containerRef.current;
    if (!container) return;

    const layout = SurfySdk.mountFloor3d({
      container,
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      floorId,
      fillParent: true,
      theme: getDemoThemeOptions(themeId),
      options: buildInitialFloor3dOptions(floorId),
      getAccessToken: () => getDemoProxyBearer(),
      ...createMountListeners(),
    });

    layoutRef.current = layout;

    return () => {
      resetOnUnmount();
      layout.destroy();
      layoutRef.current = null;
    };
  }, [
    active,
    surfaceMode,
    tenant,
    floorId,
    themeId,
    registered,
    createMountListeners,
    resetOnUnmount,
  ]);

  if (!active) {
    return null;
  }

  return (
    <LayoutDemoShell
      testId="demo-section-floor-3d"
      title={title}
      mountSnippet={surfaceMode === 'api-js' ? MOUNT_SNIPPET : REACT_SNIPPET}
      entityLabel={floorId !== undefined ? `floorId=${floorId}` : undefined}
      description={description}
      registered={registered}
      hasEntity={floorId !== undefined}
      mapHostRef={containerRef}
      surfaceMode={surfaceMode}
      onSurfaceModeChange={setSurfaceMode}
      mapChildren={
        floorId !== undefined ? (
          <DemoReactFloorHost kind="floor-3d" tenant={tenant} floorId={floorId} />
        ) : null
      }
      sidebar={
        <>
          <LayoutDemoCommonActions
            lastEvent={lastEvent}
            demoRoomId={demoRoomId}
            randomBlinkOn={randomBlinkOn}
            lastBlink={lastBlink}
            fillParent={fillParent}
            onColorRoom={colorDemoRoom}
            onToggleBlink={toggleRandomBlink}
            onClearColors={clearColors}
            onFillParentChange={setFillParent}
            onFitToView={fitToView}
            onZoomOnRoom={zoomOnRoom}
            extraSidebar={
              <Layout3dDemoControls
                scope="floor"
                floors={floorsForControls}
                demoRoomId={demoRoomId}
                onApplyOptions={apply3dOptions}
                onUpdateRoom={updateRoom}
                onFitToView={fitToView}
                onLogUpdateRoom={logUpdateRoom}
              />
            }
          />
          <ApiSnippetPanel value={buildApiSnippetBlock('floor-3d', apiLog)} />
        </>
      }
    />
  );
}
