import { useState } from 'react';
import './App.css';
import { DEMO_SECTIONS, type DemoSectionId } from './demoSections';
import { LayoutDemoPanel } from './LayoutDemoPanel';

function App() {
  const [activeSection, setActiveSection] = useState<DemoSectionId>('floor-2d');

  return (
    <main className="page">
      <h1>Surfy SDK React Demo</h1>
      <p className="page__intro">
        Testez les trois Web Components du SDK : plan 2D et vues 3D CubyV2 (étage et bâtiment).
      </p>

      <nav className="demo-tabs" role="tablist" aria-label="Composants SDK">
        {DEMO_SECTIONS.map((section) => {
          const selected = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`demo-tabs__tab${selected ? ' demo-tabs__tab--active' : ''}`}
              data-testid={`demo-tab-${section.id}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      {DEMO_SECTIONS.map((section) => (
        <LayoutDemoPanel key={section.id} section={section} active={activeSection === section.id} />
      ))}
    </main>
  );
}

export default App;
