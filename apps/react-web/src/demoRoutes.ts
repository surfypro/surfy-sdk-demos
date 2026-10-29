import type { DemoSectionId } from './demoSections';
import { DEMO_SECTIONS } from './demoSections';

export const DEFAULT_DEMO_SECTION: DemoSectionId = 'platform-3d';

export function buildDemoPath(section: DemoSectionId): string {
  return `/${section}`;
}

export const DEFAULT_DEMO_PATH = buildDemoPath(DEFAULT_DEMO_SECTION);

export function isDemoSectionId(value: string | undefined): value is DemoSectionId {
  return DEMO_SECTIONS.some((section) => section.id === value);
}

export function parseDemoRouteParams(params: {
  readonly section?: string;
}): { section: DemoSectionId } | null {
  const { section } = params;
  if (!isDemoSectionId(section)) {
    return null;
  }
  return { section };
}

/**
 * Legacy `/api|oauth/react-web|react-native/:section` → `/:section`.
 * Returns null when the path is not a known legacy demo deep-link.
 */
export function sectionFromLegacyDemoPath(pathname: string): DemoSectionId | null {
  const match = pathname.match(/^\/(?:api|oauth)\/(?:react-web|react-native)\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }
  const section = match[1];
  return isDemoSectionId(section) ? section : null;
}
