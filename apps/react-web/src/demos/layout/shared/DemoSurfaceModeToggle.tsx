import type { DemoSurfaceMode } from './demoSurfaceMode';
import { DEMO_SURFACE_MODES } from './demoSurfaceMode';

interface DemoSurfaceModeToggleProps {
  readonly value: DemoSurfaceMode;
  readonly onChange: (mode: DemoSurfaceMode) => void;
}

export function DemoSurfaceModeToggle({ value, onChange }: DemoSurfaceModeToggleProps) {
  return (
    <div className="demo-surface-toggle" data-testid="demo-surface-toggle" role="tablist">
      {DEMO_SURFACE_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          data-testid={mode.testId}
          aria-selected={value === mode.id}
          className={`demo-surface-toggle__btn${value === mode.id ? ' demo-surface-toggle__btn--active' : ''}`}
          onClick={() => onChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
