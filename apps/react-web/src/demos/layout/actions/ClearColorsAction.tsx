import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface ClearColorsActionProps {
  readonly onClear: () => void;
}

export function ClearColorsAction({ onClear }: ClearColorsActionProps) {
  const { t } = useDemoI18n();
  return (
    <button type="button" data-testid="demo-clear-colors" onClick={onClear}>
      {t('layout.clearColors')}
    </button>
  );
}
