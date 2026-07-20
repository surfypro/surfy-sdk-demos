# Netlify — Surfy SDK React web demo

This app can be deployed on **Netlify** and talk to **Surfy alpha** (or another env) while keeping the API secret server-side.

## What works on Netlify

| Surface | Status |
|---------|--------|
| React web demo (API mode) | Yes — session cookie + proxy; floor 2D / building 3D when SDK registers them |
| Auth mode selector | API now; OAuth / Entra OBO placeholder |
| Building / floor picker | Yes — reference buildings via proxy `POST /proxy/api/v1/data/entities` |
| Session `/api/session` | Yes — HttpOnly cookie; **no Surfy JWT in the browser** |
| Layout API via same-origin proxy | Yes — unique `/proxy/*` injects Bearer from connection string |
| React Native | Not on Netlify — use Expo/EAS; WebView loads e.g. `/api/react-web/floor-2d?embed=1` |

## Security model (important)

| Variable | Where | Public? |
|----------|--------|---------|
| *(none for API origin)* | Browser | Always uses **page origin** (`/api/session`, `/proxy/api/v1/…`) |
| Opaque bearer `surfy-demo-proxy` | Browser → proxy | Not a Surfy credential; proxy swaps it for the real JWT |
| `VITE_DEMO_GATE_KEY` | Build / browser | Optional shared gate password |
| `SURFY_CONNECTION_STRING` | Netlify Functions env | **Secret** — `host`;`client_id`;`client_secret` |
| `DEMO_GATE_KEY` | Netlify Functions env | Server; must match `VITE_DEMO_GATE_KEY` if set |

Floor / building IDs are **not** env vars — the UI loads them after opening a session.

**Do not** put `client_secret` in `VITE_*`. The Surfy JWT never enters JavaScript in API mode.

A public site that opens sessions is still an **open proxy** to your Surfy API user unless you add a gate:

1. Set **`DEMO_GATE_KEY`** + **`VITE_DEMO_GATE_KEY`** (same value), and/or  
2. Enable **Netlify site password** / Identity, and/or  
3. Use a **dedicated demo API user** with read-only rights on a sandbox tenant.

## Netlify UI — connect the repo

1. New site → import `surfy-sdk-demos` (this monorepo).
2. Build settings are in `netlify.toml` (no need to override unless you want).
3. **Environment variables** (Site settings → Environment):

### Build (optional public)

```
VITE_DEMO_GATE_KEY=optional-shared-gate
```

### Functions (secrets)

```
SURFY_CONNECTION_STRING=host=https://your-alpha-host.example;client_id=your-tenant;client_secret=***
DEMO_GATE_KEY=optional-shared-gate
```

4. Deploy. Open the site → mode **API** → pick a building / floor → tabs **Étage 2D** / **Bâtiment 3D**.

## How same-origin proxy works (API mode)

The demo server does **not** implement Surfy routes. It only relays:

```
Browser
  ├─ GET  /api/session                         → HttpOnly cookie + { tenant } (no JWT)
  ├─ POST /proxy/api/v1/data/entities          → forward + inject Bearer
  └─ POST /proxy/api/v1/layout/...             → forward + inject Bearer
         optional ?surfyApiOrigin=https://…     → override Surfy API host
```

SDK / `SurfyClient` `baseUrl` = `{siteOrigin}/proxy`. Opaque bearer `surfy-demo-proxy` is swapped for the real Surfy JWT from `SURFY_CONNECTION_STRING`.

## Local / Docker Netlify parity

Before pushing, reproduce the Netlify build (including function bundling):

```bash
pnpm build:netlify
# or: SKIP_PNPM_INSTALL=1 pnpm build:netlify   # after install
```

`build:functions` runs **esbuild** on `netlify/functions/*` the same way Netlify does — this catches missing workspace deps such as `@surfy/surfy-demo-auth`.

Docker (build args for `VITE_*`, runtime env for secrets):

```bash
cp .env.docker.example .env.docker
# set SURFY_CONNECTION_STRING=host=…;client_id=…;client_secret=…

docker compose up --build
# → http://localhost:8080
# → GET /api/health
# → GET /api/session
```

Compose injects `SURFY_CONNECTION_STRING` / `DEMO_GATE_KEY` at **container start** (not baked into the image layers unless you put them in build args).

## Prerequisites

- SDK bundle present: `pnpm sync:sdk` (from Surfy worktree `pnpm build:sdk`) before deploy, **or** commit/update `packages/surfy-sdk/` in CI.
- Surfy alpha reachable from Netlify Functions (egress HTTPS).
- Valid API user in `SURFY_CONNECTION_STRING` on that tenant.

## React Native note

Netlify hosts the **web** demo only. For RN, load the same deployed origin in a WebView (e.g. `/api/react-web/floor-2d?embed=1`) so the session cookie stays on that origin.
