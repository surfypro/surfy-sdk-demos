import { useEffect, useState } from 'react';

import { getDemoAssetsOrigin } from './demoSession';

/** Loads Surfy `assetsOrigin` from session for SDK `assetsBaseUrl` (bypass `/proxy`). */
export function useDemoAssetsBaseUrl(): string | undefined {
  const [assetsBaseUrl, setAssetsBaseUrl] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    void getDemoAssetsOrigin()
      .then((origin) => {
        if (!cancelled) {
          setAssetsBaseUrl(origin);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssetsBaseUrl(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return assetsBaseUrl;
}
