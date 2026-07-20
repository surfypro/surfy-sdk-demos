import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface FetchFloorsActionProps {
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

export function FetchFloorsAction({ disabled = false, onClick }: FetchFloorsActionProps) {
  const { t } = useDemoI18n();
  return (
    <button type="button" data-testid="demo-fetch-floors" disabled={disabled} onClick={onClick}>
      {t('data.fetchFloors')}
    </button>
  );
}
