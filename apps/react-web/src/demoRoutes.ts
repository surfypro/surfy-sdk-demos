import type { DemoSectionId } from './demoSections';
import { DEMO_SECTIONS } from './demoSections';

export type DemoAuthMode = 'api' | 'oauth';

export type DemoHostId = 'react-web' | 'react-native';

export const DEMO_AUTH_MODES = ['api', 'oauth'] as const satisfies readonly DemoAuthMode[];

export const DEMO_HOSTS = [
  { id: 'react-web', label: 'React web', testId: 'host-tab-react-web' },
  { id: 'react-native', label: 'React Native (WebView)', testId: 'host-tab-react-native' },
] as const satisfies readonly { id: DemoHostId; label: string; testId: string }[];

export const DEFAULT_DEMO_AUTH: DemoAuthMode = 'api';
export const DEFAULT_DEMO_HOST: DemoHostId = 'react-web';
export const DEFAULT_DEMO_SECTION: DemoSectionId = 'floor-2d';

export const DEFAULT_DEMO_PATH = buildDemoPath(
  DEFAULT_DEMO_AUTH,
  DEFAULT_DEMO_HOST,
  DEFAULT_DEMO_SECTION,
);

export function buildDemoPath(
  authMode: DemoAuthMode,
  host: DemoHostId,
  section: DemoSectionId,
): string {
  return `/${authMode}/${host}/${section}`;
}

export function isDemoAuthMode(value: string | undefined): value is DemoAuthMode {
  return value === 'api' || value === 'oauth';
}

export function isDemoHostId(value: string | undefined): value is DemoHostId {
  return value === 'react-web' || value === 'react-native';
}

export function isDemoSectionId(value: string | undefined): value is DemoSectionId {
  return DEMO_SECTIONS.some((section) => section.id === value);
}

export function parseDemoRouteParams(params: {
  readonly authMode?: string;
  readonly host?: string;
  readonly section?: string;
}): { authMode: DemoAuthMode; host: DemoHostId; section: DemoSectionId } | null {
  const { authMode, host, section } = params;
  if (!isDemoAuthMode(authMode) || !isDemoHostId(host) || !isDemoSectionId(section)) {
    return null;
  }
  return { authMode, host, section };
}
