import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { useDemoCompactLayout } from './useDemoCompactLayout';

export type DemoResponsiveSlotName = 'scope' | 'controls' | 'events';

interface DemoResponsiveContextValue {
  readonly isCompact: boolean;
  readonly menuOpen: boolean;
  readonly setMenuOpen: (open: boolean) => void;
  readonly closeMenu: () => void;
  readonly setSlotMount: (name: DemoResponsiveSlotName, el: HTMLElement | null) => void;
  readonly getSlotMount: (name: DemoResponsiveSlotName) => HTMLElement | null;
}

const DemoResponsiveContext = createContext<DemoResponsiveContextValue | null>(null);

export function DemoResponsiveProvider({ children }: { readonly children: ReactNode }) {
  const isCompact = useDemoCompactLayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounts, setMounts] = useState<Partial<Record<DemoResponsiveSlotName, HTMLElement | null>>>(
    {},
  );

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const setSlotMount = useCallback((name: DemoResponsiveSlotName, el: HTMLElement | null) => {
    setMounts((prev) => (prev[name] === el ? prev : { ...prev, [name]: el }));
  }, []);

  const getSlotMount = useCallback(
    (name: DemoResponsiveSlotName) => mounts[name] ?? null,
    [mounts],
  );

  const value = useMemo<DemoResponsiveContextValue>(
    () => ({
      isCompact,
      menuOpen: isCompact ? menuOpen : false,
      setMenuOpen,
      closeMenu,
      setSlotMount,
      getSlotMount,
    }),
    [isCompact, menuOpen, closeMenu, setSlotMount, getSlotMount],
  );

  return <DemoResponsiveContext.Provider value={value}>{children}</DemoResponsiveContext.Provider>;
}

export function useDemoResponsive(): DemoResponsiveContextValue {
  const ctx = useContext(DemoResponsiveContext);
  if (!ctx) {
    throw new Error('useDemoResponsive must be used within DemoResponsiveProvider');
  }
  return ctx;
}

/**
 * On compact, portals children into the named mount (drawer / events strip).
 * On desktop, renders children in place.
 */
export function DemoResponsiveSlot({
  name,
  children,
}: {
  readonly name: DemoResponsiveSlotName;
  readonly children: ReactNode;
}) {
  const { isCompact, getSlotMount } = useDemoResponsive();
  if (!isCompact) {
    return <>{children}</>;
  }
  const mount = getSlotMount(name);
  // Keep tree alive until mounts exist (first paint) or while events strip is collapsed.
  if (!mount) {
    return <div hidden>{children}</div>;
  }
  return createPortal(children, mount);
}
