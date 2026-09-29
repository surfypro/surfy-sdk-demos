import { useCallback, useEffect, useRef, useState } from 'react';
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
import { DemoReactBuildingHost } from '../shared/DemoReactLayoutHost';
import { LayoutDemoCommonActions } from '../shared/LayoutDemoCommonActions';
import { LayoutDemoShell } from '../shared/LayoutDemoShell';
import { useLayoutDemoChrome } from '../shared/useLayoutDemoChrome';
import { Building3dDemoControls } from './Building3dDemoControls';
import { buildInitialBuilding3dOptions } from './building3dDemo.constants';

const MOUNT_SNIPPET = 'SurfySdk.mountBuilding3d({ buildingId })';
const REACT_SNIPPET = '<SurfyBuildingLayout3dReact buildingId={…} />';

interface Building3dDemoPanelProps {
  readonly active: boolean;
  readonly tenant: string;
  readonly buildingId: number | undefined;
  readonly buildingFloors: readonly DemoFloor[];
  readonly title: string;
  readonly description: string;
}

/**
 * Building 3D demo — API JS (`mountBuilding3d`) or Surfy React Web.
 */
export function Building3dDemoPanel({
  active,
  tenant,
  buildingId,
  buildingFloors,
  title,
  description,
}: Building3dDemoPanelProps) {
  const [surfaceMode, setSurfaceMode] = useState<DemoSurfaceMode>('api-js');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<SurfyLayout | null>(null);
  const registered = SurfySdk.isKindRegistered('building-3d');

  const chrome = useLayoutDemoChrome({
    layoutRef,
    active: active && surfaceMode === 'api-js',
    entityId: buildingId,
    tenant,
    pinFloorId: buildingFloors[0]?.id,
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
    pinsEnabled,
    pinBusy,
    pinOnRandomRoom,
    pinOnRandomPlan,
    clearPins,
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
    if (!active || surfaceMode !== 'api-js' || buildingId === undefined || !registered) return;

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
    surfaceMode,
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
      mountSnippet={surfaceMode === 'api-js' ? MOUNT_SNIPPET : REACT_SNIPPET}
      entityLabel={buildingId !== undefined ? `buildingId=${buildingId}` : undefined}
      description={description}
      registered={registered}
      hasEntity={buildingId !== undefined}
      mapHostRef={containerRef}
      surfaceMode={surfaceMode}
      onSurfaceModeChange={setSurfaceMode}
      mapChildren={
        buildingId !== undefined ? (
          <DemoReactBuildingHost tenant={tenant} buildingId={buildingId} />
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
            pinsEnabled={pinsEnabled}
            pinBusy={pinBusy}
            onPinRandomRoom={pinOnRandomRoom}
            onPinRandomPlan={pinOnRandomPlan}
            onClearPins={clearPins}
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
