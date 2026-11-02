import { useEffect, useState } from 'react';

/**
 * Compact = phone portrait/landscape (and short viewports).
 * Width &lt; 768 OR (width ≤ 960 and height &lt; 500) so landscape phones stay compact
 * without flipping every short desktop window that is still wide.
 */
export const DEMO_COMPACT_MEDIA_QUERY =
  '(max-width: 767.98px), ((max-width: 960px) and (max-height: 499.98px))';

export function useDemoCompactLayout(): boolean {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(DEMO_COMPACT_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(DEMO_COMPACT_MEDIA_QUERY);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return compact;
}
