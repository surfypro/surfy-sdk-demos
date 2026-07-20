import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface FitToViewActionProps {
  readonly onFit: () => void;
}

export function FitToViewAction({ onFit }: FitToViewActionProps) {
  const { t } = useDemoI18n();
  return (
    <button type="button" data-testid="demo-fit-to-view" onClick={onFit}>
      {t('layout.fitToView')}
    </button>
  );
}
