import { useCallback, useEffect, useRef } from 'react';
import type { SurfyLayout } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

import { buildApiSnippetBlock, snippetFitToView, snippetZoomOnRoom } from '../../../demoApiSnippets';
import { getDemoProxyBearer } from '../../../demoSession';
import { getDemoThemeOptions } from '../../../demoThemes';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { ApiSnippetPanel } from '../actions/ApiSnippetPanel';
import { LayoutDemoCommonActions } from '../shared/LayoutDemoCommonActions';
import { LayoutDemoShell } from '../shared/LayoutDemoShell';
import { useLayoutDemoChrome } from '../shared/useLayoutDemoChrome';

const MOUNT_SNIPPET = 'SurfySdk.mountFloor2d({ floorId })';

interface Floor2dDemoPanelProps {
  readonly active: boolean;
  readonly tenant: string;
  readonly floorId: number | undefined;
  readonly title: string;
  readonly description: string;
}

/**
 * Floor 2D demo only — `SurfySdk.mountFloor2d`.
 * No building-3d branches.
 */
export function Floor2dDemoPanel({
  active,
  tenant,
  floorId,
  title,
  description,
}: Floor2dDemoPanelProps) {
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
    active,
    entityId: floorId,
  });

  const fitToView = useCallback(() => {
    layoutRef.current?.fitToView();
    pushApiLine(snippetFitToView());
  }, [pushApiLine]);

  const zoomOnRoom = useCallback(
    (roomId: number) => {
      layoutRef.current?.zoomOn({ roomId, diameterMeters: 5 });
      pushApiLine(snippetZoomOnRoom(roomId));
    },
    [pushApiLine],
  );

  useEffect(() => {
    if (!active || floorId === undefined || !registered) return;

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
  }, [active, tenant, floorId, themeId, registered, createMountListeners, resetOnUnmount]);

  if (!active) {
    return null;
  }

  return (
    <LayoutDemoShell
      testId="demo-section-floor-2d"
      title={title}
      mountSnippet={MOUNT_SNIPPET}
      entityLabel={floorId !== undefined ? `floorId=${floorId}` : undefined}
      description={description}
      registered={registered}
      hasEntity={floorId !== undefined}
      mapHostRef={containerRef}
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
