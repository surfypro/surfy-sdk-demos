import { useCallback, useEffect, useRef, useState } from 'react';
import type { SurfyLayout } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

import { buildApiSnippetBlock, snippetFitToView, snippetZoomOnRoom } from '../../../demoApiSnippets';
import { isRenderedDemoRoom } from '../../../demoLayoutElement';
import { getDemoProxyBearer } from '../../../demoSession';
import { getDemoThemeOptions } from '../../../demoThemes';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { ApiSnippetPanel } from '../actions/ApiSnippetPanel';
import type { DemoSurfaceMode } from '../shared/demoSurfaceMode';
import { DemoReactFloorHost } from '../shared/DemoReactLayoutHost';
import { LayoutDemoCommonActions } from '../shared/LayoutDemoCommonActions';
import { LayoutDemoShell } from '../shared/LayoutDemoShell';
import { useLayoutDemoChrome } from '../shared/useLayoutDemoChrome';

const MOUNT_SNIPPET = 'SurfySdk.mountFloor2d({ floorId })';
const REACT_SNIPPET = '<SurfyFloorLayout2dReact floorId={…} />';

interface Floor2dDemoPanelProps {
  readonly active: boolean;
  readonly tenant: string;
  readonly floorId: number | undefined;
  readonly title: string;
  readonly description: string;
}

/**
 * Floor 2D demo — API JS (`mountFloor2d`) or Surfy React Web.
 */
export function Floor2dDemoPanel({
  active,
  tenant,
  floorId,
  title,
  description,
}: Floor2dDemoPanelProps) {
  const [surfaceMode, setSurfaceMode] = useState<DemoSurfaceMode>('api-js');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayout | null>(null);
  const registered = SurfySdk.isKindRegistered('floor-2d');

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

  useEffect(() => {
    if (!active || surfaceMode !== 'api-js' || floorId === undefined || !registered) return;

    const container = containerRef.current;
    if (!container) return;

    const layout = SurfySdk.mountFloor2d({
      container,
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      floorId,
      fillParent: true,
      theme: getDemoThemeOptions(themeId),
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
      testId="demo-section-floor-2d"
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
          <DemoReactFloorHost kind="floor-2d" tenant={tenant} floorId={floorId} />
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
          />
          <ApiSnippetPanel value={buildApiSnippetBlock('floor-2d', apiLog)} />
        </>
      }
    />
  );
}
