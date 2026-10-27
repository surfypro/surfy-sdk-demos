import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';

import App from './App.tsx';
import { buildDemoPath, DEFAULT_DEMO_PATH, sectionFromLegacyDemoPath } from './demoRoutes';
import './index.css';

function LegacyDemoRedirect() {
  const { pathname } = useLocation();
  const section = sectionFromLegacyDemoPath(pathname);
  if (!section) {
    return <Navigate to={DEFAULT_DEMO_PATH} replace />;
  }
  return <Navigate to={buildDemoPath(section)} replace />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={DEFAULT_DEMO_PATH} replace />} />
        <Route path="/:section" element={<App />} />
        <Route path="/:authMode/:host/:section" element={<LegacyDemoRedirect />} />
        <Route path="*" element={<Navigate to={DEFAULT_DEMO_PATH} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
