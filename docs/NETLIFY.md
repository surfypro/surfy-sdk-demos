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
| `DEMO_SESSION_SECRET` | Netlify Functions env | Optional server secret to sign session cookies (defaults to `client_secret`) |
| `DEMO_RATE_LIMIT_*` | Netlify Functions env | Optional per-IP + global proxy rate limit (see below) |

Floor / building IDs are **not** env vars — the UI loads them after opening a session.

**Do not** put `client_secret` in `VITE_*`. The Surfy JWT never enters JavaScript in API mode.

A public site that opens sessions is still an **open proxy** to your Surfy API user unless you add a gate:

1. Set **`DEMO_GATE_KEY`** + **`VITE_DEMO_GATE_KEY`** (same value), and/or  
2. Enable **Netlify site password** / Identity, and/or  
3. Use a **dedicated demo API user** with read-only rights on a sandbox tenant.

### Enable the shared gate (recommended before sharing the link)

The gate is a shared password, **not** a Surfy credential — it only stops anonymous
visitors from opening a session against your proxy. Both variables must hold the
**same** value: `DEMO_GATE_KEY` (server, checked by `/api/session`) and
`VITE_DEMO_GATE_KEY` (build, sent by the browser as `?key=` / `X-Surfy-Demo-Key`).

1. Generate a random value:

```bash
openssl rand -hex 32
```

2. In Netlify → Site settings → Environment, set both to that value:

```
DEMO_GATE_KEY=<generated-value>        # Functions (server)
VITE_DEMO_GATE_KEY=<generated-value>   # Build (baked into the browser bundle)
```

3. Redeploy. Just share the normal link — the browser bundle already carries
   `VITE_DEMO_GATE_KEY` and sends it automatically (as `?key=` / `X-Surfy-Demo-Key`).

Without a matching key, `GET /api/session` returns `401` and the proxy stays closed.

**What this gate does and does not do.** Because `VITE_DEMO_GATE_KEY` is baked into
the public JS bundle, anyone who loads the page can read it — so it is a speed bump,
not real authentication. It stops the fully anonymous open-proxy case (bots or scripts
hitting `/api/session` / `/proxy/*` directly, without ever loading your app), but it
does **not** stop a person you gave the link to from extracting the key. For real
restriction, use Netlify site password / Identity (2) or a read-only sandbox API user (3).
Rotate the value if it leaks, and keep it out of git.

### Signed session cookie (how the gate reaches the proxy)

`GET /api/session` checks the gate, then sets an **HMAC-signed, expiring** session
cookie (not the old literal `1`). The proxy (`/proxy/*`) **verifies that signature**
before relaying, so a hand-forged `surfy_demo_session=…` cookie is rejected and the
only way to obtain a valid one is to pass the gate. This is what ties `DEMO_GATE_KEY`
to actual API access.

The signing secret is `DEMO_SESSION_SECRET` if set, otherwise it derives from the
server-only `client_secret` — so this works with **zero extra config**. Set
`DEMO_SESSION_SECRET` (any random string, e.g. `openssl rand -hex 32`) only if you
want cookies to survive a `client_secret` rotation, or to invalidate all sessions on
demand by changing it. It is server-only — never a `VITE_*`.

### Proxy rate limit (protect upstream Surfy)

The proxy applies a token-bucket rate limit so a single client — or the demo as a
whole — can't flood the Surfy API. It is **on by default** with sensible values; tune
via Functions env (all optional):

```
DEMO_RATE_LIMIT_PER_MIN=120        # sustained requests/min per client IP (default 120)
DEMO_RATE_LIMIT_BURST=120          # burst capacity per IP (default = PER_MIN)
DEMO_RATE_LIMIT_GLOBAL_PER_MIN=600 # cap across ALL clients (default max(PER_MIN*5, 600))
DEMO_RATE_LIMIT_DISABLED=1         # turn the limiter off
```

Over-limit requests get `429` + `Retry-After`. **Serverless caveat:** on Netlify the
counters live per warm function instance, so the effective cap is per-instance, not
strictly site-wide — it blunts floods but isn't exact. The **durable** guarantee is a
Surfy-side quota / rate limit on a dedicated read-only demo API user. The long-running
demo-server (Docker / local) enforces the limit exactly (single process).

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
