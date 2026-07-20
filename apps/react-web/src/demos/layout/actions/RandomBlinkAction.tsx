import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface RandomBlinkActionProps {
  readonly active: boolean;
  readonly onToggle: () => void;
}

export function RandomBlinkAction({ active, onToggle }: RandomBlinkActionProps) {
  const { t } = useDemoI18n();
  return (
    <button
      type="button"
      data-testid="demo-random-blink"
      aria-pressed={active}
      onClick={onToggle}
    >
      {active ? t('layout.stopBlink') : t('layout.randomBlink')}
    </button>
  );
}
