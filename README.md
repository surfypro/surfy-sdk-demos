# Surfy SDK Demos

[![CI](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml/badge.svg)](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml)

Monorepo containing integration demos for the Surfy SDK.

| App | Description |
|-----|-------------|
| `apps/react-web` | React web demo — floor 2D, building 3D, data API, React Native WebView simulator |
| `apps/demo-server` | Token proxy (local dev server) |
| `netlify/` | Token + API proxy for Netlify deployment |

## Developer documentation (SDK integrators)

Official guide: [help.surfy.pro — Surfy SDK](https://help.surfy.pro/entities/sdk/).

## Setup

1. Sync the SDK bundle (from the Surfy monorepo):
   ```bash
   pnpm build:sdk      # in the surfy-sdk worktree
   pnpm sync:sdk       # in this repo
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
pnpm quality          # lint + build + typecheck
pnpm quality:full     # + E2E Playwright (credentials required)
pnpm scan:secrets     # GitGuardian secret scan
```

GitHub Actions runs `quality` on every push and `test:e2e` on every PR/push to `main` (requires secret `SURFY_CONNECTION_STRING`). See [docs/CI.md](docs/CI.md).

## SDK versioning & E2E coverage

- **Versions**: demo app (`DEMO_APP_VERSION`) vs synced bundle (`packages/surfy-sdk/SDK_VERSION`) — see [docs/VERSIONING.md](docs/VERSIONING.md).
- **100% E2E coverage**: every public SDK capability is listed in [`apps/react-web/e2e/sdkFeatureManifest.ts`](apps/react-web/e2e/sdkFeatureManifest.ts) and covered by a Playwright test. The `coverage-gate.spec.ts` fails the CI if any entry is missing a test.

## Security

See [SECURITY.md](SECURITY.md). In short: `SURFY_CONNECTION_STRING` lives only in `apps/demo-server/.env` or Netlify Functions env — never in `VITE_*` or committed to the repo.
