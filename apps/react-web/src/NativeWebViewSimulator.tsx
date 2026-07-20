import type { DemoAuthMode } from './demoRoutes';
import { buildDemoPath } from './demoRoutes';
import type { DemoSectionId } from './demoSections';

interface NativeWebViewSimulatorProps {
  readonly authMode: DemoAuthMode;
  readonly section: DemoSectionId;
}

/**
 * Fake React Native shell + WebView (iframe).
 * Iframe loads the react-web workbench for the same auth + section (`?embed=1`).
 */
export function NativeWebViewSimulator({ authMode, section }: NativeWebViewSimulatorProps) {
  const embedPath = buildDemoPath(authMode, 'react-web', section);
  const embedSrc = `${window.location.origin}${embedPath}?embed=1`;

  return (
    <section className="native-sim" data-testid="native-webview-sim">
      <header className="native-sim__intro">
        <h2>React Native · WebView</h2>
        <p>
          Même <code>DemoWorkbench</code> dans une WebView simulée (
          <code>
            {embedPath}?embed=1
          </code>
          ).
        </p>
      </header>

      <div className="native-sim__phone" aria-label="Simulateur téléphone">
        <div className="native-sim__notch" aria-hidden />
        <div className="native-sim__status-bar">
          <span>9:41</span>
          <span>Surfy RN</span>
          <span>100%</span>
        </div>
        <div className="native-sim__nav">
          <span className="native-sim__nav-title">Surfy SDK</span>
          <span className="native-sim__nav-hint">WebView</span>
        </div>
        <div className="native-sim__webview">
          <iframe
            title="Surfy SDK WebView"
            src={embedSrc}
            className="native-sim__iframe"
            data-testid="native-webview-iframe"
          />
        </div>
        <div className="native-sim__home-indicator" aria-hidden />
      </div>
    </section>
  );
}
