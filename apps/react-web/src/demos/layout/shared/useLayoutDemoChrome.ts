import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { IEmbedLayoutViewData, SurfyLayout, SurfySdkErrorDetail } from '@surfy/surfy-sdk';
import { fetchFloorLayoutData } from '@surfy/surfy-sdk';

import {
  snippetAddPin,
  snippetClearPins,
  snippetClearRoomColors,
  snippetSetRoomColors,
} from '../../../demoApiSnippets';
import { isRenderedDemoRoom, pickRandomItem, waitForDemoRoomId } from '../../../demoLayoutElement';
import { getDemoProxyBearer } from '../../../demoSession';
import { getDemoThemeOptions } from '../../../demoThemes';
import { getSurfyDemoBaseUrl } from '../../../surfyEnv';
import { useDemoTheme } from '../../../useDemoTheme';
import {
  API_LOG_MAX_LINES,
  DEMO_ROOM_COLOR,
  RANDOM_BLINK_INTERVAL_MS,
  RANDOM_ROOM_COLORS,
} from './layoutDemo.constants';
import { pickRandomPlanPin, pickRandomRoomPin, type LayoutPinSpec } from './demoPinHelpers';

export type LayoutDemoBlink = { readonly roomId: number; readonly color: string };

function pinSpecLiteral(spec: LayoutPinSpec): string {
  const parts = [
    `x: ${Number(spec.x.toFixed(2))}`,
    `y: ${Number(spec.y.toFixed(2))}`,
  ];
  if (spec.floorId !== undefined) parts.push(`floorId: ${spec.floorId}`);
  if (spec.label !== undefined) parts.push(`label: ${JSON.stringify(spec.label)}`);
  return `{ ${parts.join(', ')} }`;
}

/**
 * Shared chrome for floor-2d / building-3d / floor-3d demos: events, colors, blink, pins, snippets, theme.
 * Mount stays in each panel. Zoom / color / pin actions target the current layout.
 */
export function useLayoutDemoChrome(params: {
  readonly layoutRef: RefObject<SurfyLayout | null>;
  readonly active: boolean;
  readonly entityId: number | undefined;
  readonly tenant: string;
  /** Floor used to resolve layout coords for pins (required for building-3d). */
  readonly pinFloorId: number | undefined;
}) {
  const { layoutRef, active, entityId, tenant, pinFloorId } = params;
  const { themeId } = useDemoTheme();
  const [lastEvent, setLastEvent] = useState('none');
  const [demoRoomId, setDemoRoomId] = useState<number | undefined>(undefined);
  const [fillParent, setFillParent] = useState(true);
  const [randomBlinkOn, setRandomBlinkOn] = useState(false);
  const [lastBlink, setLastBlink] = useState<LayoutDemoBlink | null>(null);
  const [apiLog, setApiLog] = useState<string[]>([]);
  const [pinBusy, setPinBusy] = useState(false);
  const layoutDataCacheRef = useRef<{
    floorId: number;
    data: IEmbedLayoutViewData;
  } | null>(null);

  const pushApiLine = useCallback((line: string) => {
    setApiLog((prev) => [...prev, line].slice(-API_LOG_MAX_LINES));
  }, []);

  useEffect(() => {
    setDemoRoomId(undefined);
    setLastBlink(null);
    layoutDataCacheRef.current = null;
  }, [entityId, pinFloorId]);

  useEffect(() => {
    layoutRef.current?.setFillParent(fillParent);
  }, [fillParent, layoutRef]);

  useEffect(() => {
    layoutRef.current?.setTheme(getDemoThemeOptions(themeId));
  }, [themeId, layoutRef]);

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
  }, [randomBlinkOn, active, entityId, layoutRef]);

  const colorDemoRoom = useCallback(
    (roomId: number) => {
      if (!isRenderedDemoRoom(layoutRef.current, roomId)) {
        return;
      }
      layoutRef.current?.setRoomColors({ [roomId]: DEMO_ROOM_COLOR });
      pushApiLine(snippetSetRoomColors(roomId, DEMO_ROOM_COLOR));
    },
    [layoutRef, pushApiLine],
  );

  const clearColors = useCallback(() => {
    setRandomBlinkOn(false);
    setLastBlink(null);
    layoutRef.current?.clearRoomColors();
    pushApiLine(snippetClearRoomColors());
  }, [layoutRef, pushApiLine]);

  const toggleRandomBlink = useCallback(() => {
    setRandomBlinkOn((on) => {
      if (on) {
        layoutRef.current?.clearRoomColors();
        setLastBlink(null);
        pushApiLine(snippetClearRoomColors());
        return false;
      }
      return true;
    });
  }, [layoutRef, pushApiLine]);

  const loadPinLayoutData = useCallback(async (): Promise<IEmbedLayoutViewData | null> => {
    if (pinFloorId === undefined) return null;
    const cached = layoutDataCacheRef.current;
    if (cached && cached.floorId === pinFloorId) {
      return cached.data;
    }
    const data = await fetchFloorLayoutData({
      baseUrl: getSurfyDemoBaseUrl(),
      tenant,
      floorId: pinFloorId,
      getAccessToken: () => getDemoProxyBearer(),
    });
    layoutDataCacheRef.current = { floorId: pinFloorId, data };
    return data;
  }, [pinFloorId, tenant]);

  const pinOnRandomRoom = useCallback(() => {
    if (pinFloorId === undefined || pinBusy) return;
    const layout = layoutRef.current;
    if (!layout) return;
    setPinBusy(true);
    void loadPinLayoutData()
      .then((data) => {
        if (!data || !layoutRef.current) return;
        const spec = pickRandomRoomPin(data, layout.getRenderedRoomIds(), pinFloorId);
        if (!spec) return;
        layoutRef.current.addPin(spec);
        pushApiLine(snippetAddPin(pinSpecLiteral(spec)));
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'pin failed';
        setLastEvent(`surfy:error PIN ${message}`);
      })
      .finally(() => {
        setPinBusy(false);
      });
  }, [pinFloorId, pinBusy, layoutRef, loadPinLayoutData, pushApiLine]);

  const pinOnRandomPlan = useCallback(() => {
    if (pinFloorId === undefined || pinBusy) return;
    if (!layoutRef.current) return;
    setPinBusy(true);
    void loadPinLayoutData()
      .then((data) => {
        if (!data || !layoutRef.current) return;
        const spec = pickRandomPlanPin(data, pinFloorId);
        if (!spec) return;
        layoutRef.current.addPin(spec);
        pushApiLine(snippetAddPin(pinSpecLiteral(spec)));
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'pin failed';
        setLastEvent(`surfy:error PIN ${message}`);
      })
      .finally(() => {
        setPinBusy(false);
      });
  }, [pinFloorId, pinBusy, layoutRef, loadPinLayoutData, pushApiLine]);

  const clearPins = useCallback(() => {
    layoutRef.current?.clearPins();
    pushApiLine(snippetClearPins());
  }, [layoutRef, pushApiLine]);

  const createMountListeners = useCallback(
    () => ({
      onReady: () => {
        setLastEvent('surfy:ready');
        const current = layoutRef.current;
        if (!current) return;
        void waitForDemoRoomId(current).then((roomId) => {
          // Always bind chrome actions to a room on the current layout (étage / visible floors).
          setDemoRoomId(roomId);
        });
      },
      onRoomHover: (detail: { roomId: number; name: string } | null) => {
        setLastEvent(
          detail ? `surfy:room-hover ${detail.roomId} ${detail.name}` : 'surfy:room-hover leave',
        );
      },
      onRoomSelected: (detail: { roomId: number; name: string }) => {
        const rendered = layoutRef.current?.getRenderedRoomIds() ?? [];
        if (rendered.length === 0 || rendered.includes(detail.roomId)) {
          setDemoRoomId(detail.roomId);
        }
        setLastEvent(`surfy:room-selected ${detail.roomId} ${detail.name}`);
      },
      onError: (detail: SurfySdkErrorDetail) => {
        setLastEvent(`surfy:error ${detail.code} ${detail.message}`);
      },
    }),
    [layoutRef],
  );

  const resetOnUnmount = useCallback(() => {
    setRandomBlinkOn(false);
    setLastBlink(null);
    setDemoRoomId(undefined);
    setApiLog([]);
    setLastEvent('none');
    setPinBusy(false);
    layoutDataCacheRef.current = null;
  }, []);

  return {
    themeId,
    lastEvent,
    demoRoomId,
    fillParent,
    setFillParent,
    randomBlinkOn,
    lastBlink,
    apiLog,
    pushApiLine,
    colorDemoRoom,
    clearColors,
    toggleRandomBlink,
    pinsEnabled: pinFloorId !== undefined,
    pinBusy,
    pinOnRandomRoom,
    pinOnRandomPlan,
    clearPins,
    createMountListeners,
    resetOnUnmount,
  };
}
