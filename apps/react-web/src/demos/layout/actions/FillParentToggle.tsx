import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface FillParentToggleProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function FillParentToggle({ checked, onChange }: FillParentToggleProps) {
  const { t } = useDemoI18n();
  return (
    <label className="floor-plan-options">
      <input
        type="checkbox"
        checked={checked}
        data-testid="demo-fill-parent"
        onChange={(event) => onChange(event.target.checked)}
      />
      {t('layout.fillParent')}
    </label>
  );
}
