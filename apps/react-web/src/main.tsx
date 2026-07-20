import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import App from './App.tsx';
import { DEFAULT_DEMO_PATH } from './demoRoutes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={DEFAULT_DEMO_PATH} replace />} />
        <Route path="/:authMode/:host/:section" element={<App />} />
        <Route path="*" element={<Navigate to={DEFAULT_DEMO_PATH} replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
