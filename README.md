# Surfy SDK Demos

[![CI](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml/badge.svg)](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml)

Monorepo containing integration demos for the Surfy SDK.

| App | Description |
|-----|-------------|
| `apps/react-web` | React web demo — floor 2D, building 3D, platform 3D, data API (API session + proxy) |
| `apps/demo-server` | Token proxy (local dev server) |
| `netlify/` | Token + API proxy for Netlify deployment |

## Developer documentation (SDK integrators)

Official guide: [help.surfy.pro — Surfy SDK](https://help.surfy.pro/entities/sdk/).

### WI-429 — Platform demo (`platform-3d`) — Pilotage contexte SDK

In `apps/react-web`, the **sole** public MapLibre surface is **`platform-3d`** → `SurfyPlatformView3dReact` (same entry as product `building/3d-maplibre`).

- **Structure click** → Cuby pathfinding-style look (exploded floors, ground floor) **in the same MapLibre map**.
- **Host chrome / Pilotage contexte SDK** (sidebar): bâtiments + étages + inject geo are **demo host controls** — they call public hooks (`useBuildings`, `useFloors`, `useSetCurrentZoom` `enterBuilding`/`enterFloor`, `usePositionFromGeo`). They are **not** packaged SDK drawers / product `PlatformStructureBuildingList`.
- **Position by altitude**: `usePositionFromGeo` only (no calibration-edit API in this tranche).
- **Host focus**: `useSetCurrentZoom` (`enterBuilding` / `enterFloor`); MapLibre tiles use **browser cache only**.
- **Offline**: `offlineEnabled` defaults to **`true`** (SWR). Opt out with `false` for network-only.
- Demo nav: **no** `campus-3d` / `structure-cuby` — `SurfyStructureCubyView3dReact` is **removed** from the public contract → Platform only.

Help pages: [Platform view](https://help.surfy.pro/entities/sdk/platform-campus-3d), [Surfy React Web](https://help.surfy.pro/entities/sdk/surfy-react-web), [3D options](https://help.surfy.pro/entities/sdk/options-3d).

## Quick relaunch (local)

When the Surfy monorepo is a sibling (`../surfy`) and envs are already set:

```bash
cd ../surfy && pnpm build:sdk:sync   # skip if packages/surfy-sdk is already fresh
cd ../surfy-sdk-demos && pnpm dev
```

| Service | URL |
|---------|-----|
| React web demo | http://localhost:5173/ |
| Demo server (auth + API proxy) | http://localhost:8787 |

Full eng runbook (watch mode, scripts table, checklist): [`docs/surfy-sdk/demo-local-relaunch.md`](../surfy/docs/surfy-sdk/demo-local-relaunch.md) in the Surfy checkout.

## Setup

1. Sync the SDK bundle (from the Surfy monorepo):
   ```bash
   pnpm build:sdk:sync   # in surfy — build + copy into this repo’s packages/surfy-sdk
   # or: pnpm build:sdk && (cd ../surfy-sdk-demos && pnpm sync:sdk)
   pnpm build:sdk:watch  # optional — rebuild+sync on src/surfy-sdk changes (keep pnpm dev running here)
   ```
2. Install dependencies: `pnpm install`
3. Configure env files from the provided examples:
   - `apps/react-web/.env` from `apps/react-web/.env.example`
   - `apps/demo-server/.env` from `apps/demo-server/.env.example` with your `SURFY_CONNECTION_STRING`
4. Start: `pnpm dev`

## Deployment

- **Netlify** — see [docs/NETLIFY.md](docs/NETLIFY.md)
- **Docker** (local Netlify-parity) — see [docs/NETLIFY.md#docker](docs/NETLIFY.md#local-netlify-parity-docker)

## Quality & CI

```bash
pnpm quality:agent:code   # local / agents — oxlint + tsc (errors-only deposits)
pnpm quality:agent:ci     # before push/PR — merge-dry main + CI Quality twin
pnpm quality              # verbose lint + build + typecheck (same as CI Quality job)
pnpm quality:full         # + E2E Playwright (credentials required)
pnpm scan:secrets         # GitGuardian secret scan
```

Agent-facing checks deposit failures under `.surfy/quality-agent/` — see [docs/dev/quality-agent.md](docs/dev/quality-agent.md).

GitHub Actions runs `quality` on every push and `test:e2e` on every PR/push to `main` (requires secret `SURFY_CONNECTION_STRING`). See [docs/CI.md](docs/CI.md).

## SDK versioning & E2E coverage

- **Versions**: demo app (`DEMO_APP_VERSION`) vs synced bundle (`packages/surfy-sdk/SDK_VERSION`) — see [docs/VERSIONING.md](docs/VERSIONING.md).
- **100% E2E coverage**: every public SDK capability is listed in [`apps/react-web/e2e/sdkFeatureManifest.ts`](apps/react-web/e2e/sdkFeatureManifest.ts) and covered by a Playwright test. The `coverage-gate.spec.ts` fails the CI if any entry is missing a test.

## Security

See [SECURITY.md](SECURITY.md). In short: `SURFY_CONNECTION_STRING` lives only in `apps/demo-server/.env` or Netlify Functions env — never in `VITE_*` or committed to the repo.
