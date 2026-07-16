# Netlify — Surfy SDK React web demo

This app can be deployed on **Netlify** and talk to **Surfy alpha** (or another env) while keeping the API secret server-side.

## What works on Netlify

| Surface | Status |
|---------|--------|
| React web demo (3 tabs) | Yes — floor 2D + building 3D when SDK registers them; floor 3D when tag ships |
| Building / floor picker | Yes — live list via `POST /api/v1/data/entities` |
| Token mint `/api/surfy-token` | Yes — Netlify Function |
| Layout API via same-origin proxy | Yes — `/api/v1/*` → Surfy (`host` from connection string) |
| React Native | Not on Netlify — use Expo/EAS; point WebView token URL at this Netlify `/api/surfy-token` |

## Security model (important)

| Variable | Where | Public? |
|----------|--------|---------|
| `VITE_SURFY_BASE_URL` | Build / browser | Prefer **empty** on Netlify (same-origin) |
| `VITE_DEMO_GATE_KEY` | Build / browser | Optional shared gate password |
| `SURFY_CONNECTION_STRING` | Netlify Functions env | **Secret** — `host`;`client_id`;`client_secret` |
| `DEMO_GATE_KEY` | Netlify Functions env | Server; must match `VITE_DEMO_GATE_KEY` if set |

Floor / building IDs are **not** env vars — the UI loads them from the API after minting a token.

**Do not** put `client_secret` in `VITE_*`. Anyone can open DevTools and read Vite env.

A public site that mints tokens is still an **open proxy** to your Surfy API user unless you add a gate:

1. Set **`DEMO_GATE_KEY`** + **`VITE_DEMO_GATE_KEY`** (same value), and/or  
2. Enable **Netlify site password** / Identity, and/or  
3. Use a **dedicated demo API user** with read-only rights on a sandbox tenant.

## Netlify UI — connect the repo

1. New site → import `surfy-sdk-demos` (this monorepo).
2. Build settings are in `netlify.toml` (no need to override unless you want).
3. **Environment variables** (Site settings → Environment):

### Build (public)

```
VITE_SURFY_BASE_URL=
VITE_DEMO_GATE_KEY=optional-shared-gate
```

### Functions (secrets)

```
SURFY_CONNECTION_STRING=host=https://your-alpha-host.example;client_id=your-tenant;client_secret=***
DEMO_GATE_KEY=optional-shared-gate
```

4. Deploy. Open the site → pick a building / floor → tabs **Étage 2D** / **Bâtiment 3D** (and **Étage 3D** once registered).

## How same-origin proxy works

```
Browser
  ├─ GET  /api/surfy-token          → Netlify Function → Surfy /authentication/token
  ├─ POST /api/v1/data/entities     → list buildings + floors (picker)
  └─ POST /api/v1/layout/...        → layout for the selected WC
```

The SDK `base-url` is the Netlify origin. No Surfy CORS change required for the Netlify domain.

## Local parity

```bash
# Terminal 1 — SURFY_CONNECTION_STRING in apps/demo-server/.env
pnpm dev:server

# Terminal 2 — apps/react-web/.env with VITE_SURFY_BASE_URL= empty
# (vite.config reads host= from demo-server .env for /api/v1 proxy)
pnpm dev:react
```

See `apps/react-web/.env.example` and `apps/demo-server/.env.example`.

## Prerequisites

- SDK bundle present: `pnpm sync:sdk` (from Surfy worktree `pnpm build:sdk`) before deploy, **or** commit/update `packages/surfy-sdk/` in CI.
- Surfy alpha reachable from Netlify Functions (egress HTTPS).
- Valid API user in `SURFY_CONNECTION_STRING` on that tenant.

## React Native note

Netlify hosts the **web** demo only. For RN, reuse the same deployed `/api/surfy-token` URL from the device/simulator and load the WC inside a WebView (see Surfy SDK integration docs).
