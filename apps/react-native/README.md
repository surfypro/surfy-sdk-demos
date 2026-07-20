# React Native demo (WebView path)

The **same** UI as React web lives in `apps/react-web/src/DemoWorkbench.tsx`.

On the Vite site:

1. `pnpm dev` → http://localhost:5173 → redirects to `/api/react-web/floor-2d`
2. Open `/api/react-native/building-3d` (or use the host tabs) → phone chrome + iframe
3. Iframe loads `/api/react-web/<section>?embed=1` (same workbench, embed chrome)

```text
/:authMode/:host/:section
  api | oauth
    react-web | react-native
      floor-2d | building-3d | data-api

RN shell (native UI)          ← simulated by phone chrome
  └─ react-native-webview     ← iframe
       └─ DemoWorkbench       ← shared with React web
```

No APK required. Real Expo app later can point `WebView` at e.g. `/api/react-web/floor-2d?embed=1` (Netlify or LAN).
