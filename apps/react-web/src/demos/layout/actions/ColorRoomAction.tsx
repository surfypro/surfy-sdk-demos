import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface ColorRoomActionProps {
  readonly demoRoomId: number | undefined;
  readonly disabled?: boolean;
  readonly onColor: (roomId: number) => void;
}

export function ColorRoomAction({ demoRoomId, disabled = false, onColor }: ColorRoomActionProps) {
  const { t } = useDemoI18n();
  return (
    <button
      type="button"
      data-testid="demo-color-room"
      disabled={demoRoomId === undefined || disabled}
      onClick={() => {
        if (demoRoomId !== undefined) onColor(demoRoomId);
      }}
    >
      {demoRoomId === undefined ? t('layout.colorRoom') : t('layout.colorRoomId', { id: demoRoomId })}
    </button>
  );
}
