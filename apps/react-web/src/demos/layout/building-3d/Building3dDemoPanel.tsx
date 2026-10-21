import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SurfyLayout, SurfyLayout3dOptions, SurfyRoomUpdateOptions } from '@surfy/surfy-sdk';
import { SurfySdk } from '@surfy/surfy-sdk';
import type { ISurfyBuilding3dLayoutApi } from '@surfy/surfy-sdk/react';

import {
  buildApiSnippetBlock,
  snippetClearRoomColors,
  snippetFitToView,
  snippetSetOptions,
  snippetSetRoomColors,
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
import { DEMO_ROOM_COLOR } from '../shared/layoutDemo.constants';
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

type BuildingDemoHandle = SurfyLayout | ISurfyBuilding3dLayoutApi;

function hasRenderedRoomIds(
  handle: BuildingDemoHandle | null,
): handle is SurfyLayout {
  return handle != null && typeof (handle as SurfyLayout).getRenderedRoomIds === 'function';
}

/**
 * Building 3D demo — API JS (`mountBuilding3d`) or Surfy React Web.
 * React mode: floor toggles + hover/select log stay on the host (WI-429 M2).
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
  const reactLayoutRef = useRef<ISurfyBuilding3dLayoutApi | null>(null);
  const registered = SurfySdk.isKindRegistered('building-3d');

  const initialLayout3dOptions = useMemo(
    () => buildInitialBuilding3dOptions(buildingFloors.map((floor) => floor.id)),
    [buildingFloors],
  );

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

  const activeHandle = useCallback((): BuildingDemoHandle | null => {
    return surfaceMode === 'react-web' ? reactLayoutRef.current : layoutRef.current;
  }, [surfaceMode]);

  const apply3dOptions = useCallback(
    (patch: SurfyLayout3dOptions) => {
      activeHandle()?.setOptions(patch);
      pushApiLine(snippetSetOptions(JSON.stringify(patch)));
    },
    [activeHandle, pushApiLine],
  );

  const updateRoom = useCallback(
    (roomId: number, options: SurfyRoomUpdateOptions) => {
      activeHandle()?.updateRoom(roomId, options);
    },
    [activeHandle],
  );

  const fitToView = useCallback(() => {
    activeHandle()?.fitToView();
    pushApiLine(snippetFitToView());
  }, [activeHandle, pushApiLine]);

  const zoomOnRoom = useCallback(
    (roomId: number) => {
      const handle = activeHandle();
      if (hasRenderedRoomIds(handle) && !isRenderedDemoRoom(handle, roomId)) {
        return;
      }
      handle?.zoomOn({ roomId, diameterMeters: 5 });
      pushApiLine(snippetZoomOnRoom(roomId));
    },
    [activeHandle, pushApiLine],
  );

  const logUpdateRoom = useCallback(
    (roomId: number, optionsLiteral: string) => {
      pushApiLine(snippetUpdateRoom(roomId, optionsLiteral));
    },
    [pushApiLine],
  );

  const onColorRoom = useCallback(
    (roomId: number) => {
      if (surfaceMode === 'react-web') {
        reactLayoutRef.current?.setRoomColors({ [roomId]: DEMO_ROOM_COLOR });
        pushApiLine(snippetSetRoomColors(roomId, DEMO_ROOM_COLOR));
        return;
      }
      colorDemoRoom(roomId);
    },
    [surfaceMode, colorDemoRoom, pushApiLine],
  );

  const onClearColors = useCallback(() => {
    if (surfaceMode === 'react-web') {
      reactLayoutRef.current?.clearRoomColors();
      pushApiLine(snippetClearRoomColors());
      return;
    }
    clearColors();
  }, [surfaceMode, clearColors, pushApiLine]);

  const reactListeners = useMemo(() => createMountListeners(), [createMountListeners]);

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
      options: initialLayout3dOptions,
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
    initialLayout3dOptions,
    themeId,
    registered,
    createMountListeners,
    resetOnUnmount,
  ]);

  useEffect(() => {
    if (surfaceMode !== 'react-web') return;
    return () => {
      resetOnUnmount();
      reactLayoutRef.current = null;
    };
  }, [surfaceMode, buildingId, resetOnUnmount]);

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
          <DemoReactBuildingHost
            ref={reactLayoutRef}
            tenant={tenant}
            buildingId={buildingId}
            layout3dOptions={initialLayout3dOptions}
            themeOptions={getDemoThemeOptions(themeId) ?? undefined}
            onReady={reactListeners.onReady}
            onError={reactListeners.onError}
            onRoomHover={reactListeners.onRoomHover}
            onRoomSelected={reactListeners.onRoomSelected}
          />
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
            onColorRoom={onColorRoom}
            onToggleBlink={toggleRandomBlink}
            onClearColors={onClearColors}
            onFillParentChange={setFillParent}
            onFitToView={fitToView}
            onZoomOnRoom={zoomOnRoom}
            pinsEnabled={pinsEnabled && surfaceMode === 'api-js'}
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
