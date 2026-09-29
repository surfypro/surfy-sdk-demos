import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface PinActionsProps {
  readonly disabled?: boolean;
  readonly onPinRandomRoom: () => void;
  readonly onPinRandomPlan: () => void;
  readonly onClearPins: () => void;
}

/** Demo controls for {@link SurfyLayout.addPin} / clearPins. */
export function PinActions({
  disabled = false,
  onPinRandomRoom,
  onPinRandomPlan,
  onClearPins,
}: PinActionsProps) {
  const { t } = useDemoI18n();
  return (
    <>
      <button
        type="button"
        data-testid="demo-pin-random-room"
        disabled={disabled}
        onClick={onPinRandomRoom}
      >
        {t('layout.pinRandomRoom')}
      </button>
      <button
        type="button"
        data-testid="demo-pin-random-plan"
        disabled={disabled}
        onClick={onPinRandomPlan}
      >
        {t('layout.pinRandomPlan')}
      </button>
      <button type="button" data-testid="demo-clear-pins" onClick={onClearPins}>
        {t('layout.clearPins')}
      </button>
    </>
  );
}
