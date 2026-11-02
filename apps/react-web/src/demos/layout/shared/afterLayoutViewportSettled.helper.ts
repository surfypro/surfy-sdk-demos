/**
 * Run after the layout host has settled (paint + short delay for ResizeObserver
 * bbox updates). Cancelling avoids stacking zooms on rapid room taps.
 */
export function afterLayoutViewportSettled(action: () => void): () => void {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let innerRaf = 0;
  const outerRaf = requestAnimationFrame(() => {
    if (cancelled) {
      return;
    }
    innerRaf = requestAnimationFrame(() => {
      if (cancelled) {
        return;
      }
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          action();
        }
      }, 60);
    });
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(outerRaf);
    cancelAnimationFrame(innerRaf);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  };
}
