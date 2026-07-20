import type { ReactNode } from 'react';

import { useDemoI18n } from '../../../i18n/DemoI18nProvider';
import { ClearColorsAction } from '../actions/ClearColorsAction';
import { ColorRoomAction } from '../actions/ColorRoomAction';
import { FillParentToggle } from '../actions/FillParentToggle';
import { FitToViewAction } from '../actions/FitToViewAction';
import { RandomBlinkAction } from '../actions/RandomBlinkAction';
import { ZoomOnRoomAction } from '../actions/ZoomOnRoomAction';
import type { LayoutDemoBlink } from './useLayoutDemoChrome';

interface LayoutDemoCommonActionsProps {
  readonly lastEvent: string;
  readonly demoRoomId: number | undefined;
  readonly randomBlinkOn: boolean;
  readonly lastBlink: LayoutDemoBlink | null;
  readonly fillParent: boolean;
  readonly onColorRoom: (roomId: number) => void;
  readonly onToggleBlink: () => void;
  readonly onClearColors: () => void;
  readonly onFillParentChange: (value: boolean) => void;
  readonly onFitToView?: () => void;
  readonly onZoomOnRoom?: (roomId: number) => void;
  /** Extra actions after Clear / zoom (e.g. building-only controls). */
  readonly extraActions?: ReactNode;
  /** Extra sidebar blocks after fill-parent (e.g. Building3dDemoControls). */
  readonly extraSidebar?: ReactNode;
}

/** Color / blink / clear / zoom / fill-parent — same for floor-2d and building-3d. */
export function LayoutDemoCommonActions({
  lastEvent,
  demoRoomId,
  randomBlinkOn,
  lastBlink,
  fillParent,
  onColorRoom,
  onToggleBlink,
  onClearColors,
  onFillParentChange,
  onFitToView,
  onZoomOnRoom,
  extraActions,
  extraSidebar,
}: LayoutDemoCommonActionsProps) {
  const { t } = useDemoI18n();

  return (
    <>
      <p>
        {t('layout.lastEvent')}: <span data-testid="demo-last-event">{lastEvent}</span>
      </p>
      <div className="actions">
        <ColorRoomAction
          demoRoomId={demoRoomId}
          disabled={randomBlinkOn}
          onColor={onColorRoom}
        />
        <RandomBlinkAction active={randomBlinkOn} onToggle={onToggleBlink} />
        <ClearColorsAction onClear={onClearColors} />
        {onFitToView ? <FitToViewAction onFit={onFitToView} /> : null}
        {onZoomOnRoom ? <ZoomOnRoomAction demoRoomId={demoRoomId} onZoom={onZoomOnRoom} /> : null}
        {extraActions}
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
      <FillParentToggle checked={fillParent} onChange={onFillParentChange} />
      {extraSidebar}
    </>
  );
}
