export type DemoSurfaceMode = 'api-js' | 'react-web';

export const DEMO_SURFACE_MODES: readonly {
  readonly id: DemoSurfaceMode;
  readonly label: string;
  readonly testId: string;
}[] = [
  { id: 'api-js', label: 'API JS (mount*)', testId: 'demo-surface-api-js' },
  { id: 'react-web', label: 'Surfy React Web', testId: 'demo-surface-react-web' },
] as const;
