import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface FetchBuildingsActionProps {
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

export function FetchBuildingsAction({ disabled = false, onClick }: FetchBuildingsActionProps) {
  const { t } = useDemoI18n();
  return (
    <button type="button" data-testid="demo-fetch-buildings" disabled={disabled} onClick={onClick}>
      {t('data.fetchBuildings')}
    </button>
  );
}
