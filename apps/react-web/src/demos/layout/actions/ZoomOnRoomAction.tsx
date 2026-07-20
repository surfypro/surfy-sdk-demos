import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface ZoomOnRoomActionProps {
  readonly demoRoomId: number | undefined;
  readonly onZoom: (roomId: number) => void;
}

export function ZoomOnRoomAction({ demoRoomId, onZoom }: ZoomOnRoomActionProps) {
  const { t } = useDemoI18n();
  return (
    <button
      type="button"
      data-testid="demo-zoom-on-room"
      disabled={demoRoomId === undefined}
      onClick={() => {
        if (demoRoomId !== undefined) {
          onZoom(demoRoomId);
        }
      }}
    >
      {demoRoomId !== undefined
        ? t('layout.zoomOnRoomId', { id: String(demoRoomId) })
        : t('layout.zoomOnRoom')}
    </button>
  );
}
