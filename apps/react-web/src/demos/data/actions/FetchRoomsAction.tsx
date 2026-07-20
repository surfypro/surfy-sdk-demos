import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface FetchRoomsActionProps {
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

export function FetchRoomsAction({ disabled = false, onClick }: FetchRoomsActionProps) {
  const { t } = useDemoI18n();
  return (
    <button type="button" data-testid="demo-fetch-rooms" disabled={disabled} onClick={onClick}>
      {t('data.fetchRooms')}
    </button>
  );
}
