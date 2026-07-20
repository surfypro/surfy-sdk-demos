import { useCallback, useEffect, useRef } from 'react';
import type { SurfyLayout, SurfyLayout3dOptions, SurfyRoomUpdateOptions } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';

import {
  buildApiSnippetBlock,
  snippetFitToView,
  snippetSetOptions,
  snippetUpdateRoom,
  snippetZoomOnRoom,
} from '../../../demoApiSnippets';
import { getDemoProxyBearer } from '../../../demoSession';
import { getDemoThemeOptions } from '../../../demoThemes';
import type { DemoFloor } from '../../../fetchDemoCatalog';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { ApiSnippetPanel } from '../actions/ApiSnippetPanel';
import { LayoutDemoCommonActions } from '../shared/LayoutDemoCommonActions';
import { LayoutDemoShell } from '../shared/LayoutDemoShell';
import { useLayoutDemoChrome } from '../shared/useLayoutDemoChrome';
import { Building3dDemoControls } from './Building3dDemoControls';
import { buildInitialBuilding3dOptions } from './building3dDemo.constants';

const MOUNT_SNIPPET = 'SurfySdk.mountBuilding3d({ buildingId })';

interface Building3dDemoPanelProps {
  readonly active: boolean;
  readonly tenant: string;
  readonly buildingId: number | undefined;
  readonly buildingFloors: readonly DemoFloor[];
  readonly title: string;
  readonly description: string;
}

/**
 * Building 3D demo only — `SurfySdk.mountBuilding3d`.
 * No floor-2d branches.
 */
export function Building3dDemoPanel({
  active,
  tenant,
  buildingId,
  buildingFloors,
  title,
  description,
}: Building3dDemoPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayout | null>(null);
  const registered = SurfySdk.isKindRegistered('building-3d');

  const chrome = useLayoutDemoChrome({
    layoutRef,
    active,
    entityId: buildingId,
  });
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
  } = chrome;

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

  const zoomOnRoom = useCallback(
    (roomId: number) => {
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
    if (!active || buildingId === undefined || !registered) return;

    const container = containerRef.current;
    if (!container) return;

    const layout = SurfySdk.mountBuilding3d({
      container,
      tenant,
      baseUrl: getSurfyDemoBaseUrl(),
      buildingId,
      fillParent: true,
      theme: getDemoThemeOptions(themeId),
      options: buildInitialBuilding3dOptions(buildingFloors.map((floor) => floor.id)),
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
    tenant,
    buildingId,
    buildingFloors,
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
      testId="demo-section-building-3d"
      title={title}
      mountSnippet={MOUNT_SNIPPET}
      entityLabel={buildingId !== undefined ? `buildingId=${buildingId}` : undefined}
      description={description}
      registered={registered}
      hasEntity={buildingId !== undefined}
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
            extraSidebar={
              <Building3dDemoControls
                buildingFloors={buildingFloors}
                demoRoomId={demoRoomId}
                onApplyOptions={apply3dOptions}
                onUpdateRoom={updateRoom}
                onFitToView={fitToView}
                onLogUpdateRoom={logUpdateRoom}
              />
            }
          />
          <ApiSnippetPanel value={buildApiSnippetBlock('building-3d', apiLog)} />
        </>
      }
    />
  );
}
