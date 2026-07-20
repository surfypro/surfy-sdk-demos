import { useEffect, useRef, useState } from 'react';

import { useDemoI18n } from '../../../i18n/DemoI18nProvider';

interface ApiSnippetPanelProps {
  readonly testIdPrefix?: string;
  readonly titleKey?: 'layout.snippetTitle' | 'data.snippetTitle';
  readonly value: string;
}

export function ApiSnippetPanel({
  testIdPrefix = 'demo-api-snippet',
  titleKey = 'layout.snippetTitle',
  value,
}: ApiSnippetPanelProps) {
  const { t } = useDemoI18n();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [value]);

  return (
    <div className="demo-api-snippet" data-testid={testIdPrefix}>
      <div className="demo-api-snippet__header">
        <span>{t(titleKey)}</span>
        <button
          type="button"
          data-testid={`${testIdPrefix}-copy`}
          onClick={() => {
            void navigator.clipboard.writeText(value).then(
              () => {
                setCopyFeedback(t('layout.copied'));
                window.setTimeout(() => setCopyFeedback(null), 1500);
              },
              () => setCopyFeedback(t('layout.copyFail')),
            );
          }}
        >
          {copyFeedback ?? t('layout.copy')}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="demo-api-snippet__code"
        data-testid={`${testIdPrefix}-textarea`}
        readOnly
        spellCheck={false}
        value={value}
        rows={Math.min(14, Math.max(4, value.split('\n').length))}
      />
    </div>
  );
}
