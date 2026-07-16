# Security notes for this demo repository

This repository is intended to become public / deployable (e.g. Netlify).

## Never commit secrets

- Do not commit `.env` files.
- Do not hardcode `client_secret`, API keys, JWTs, or private keys.
- Keep only template files like `.env.example` / `.env.netlify.example`.
- **Never** prefix Surfy API secrets with `VITE_` — Vite inlines them into the browser bundle.

## Connection string (server only)

```
SURFY_CONNECTION_STRING=host=https://app.example.surfy.pro;client_id=<tenant>;client_secret=<secret>
```

Used by `demo-server` and Netlify Functions. Floors / buildings are **not** in env — the demo lists them via API.

## Token flow

```
Browser  →  GET /api/surfy-token  →  demo-server / Netlify Function
         →  { token, tenant }
Browser  →  POST /api/v1/data/entities (buildings) → picker
Browser  →  POST /api/v1/layout/... (same origin) → proxy → Surfy
```

- The browser/mobile app must not contain `client_secret`.
- Prefer a **dedicated demo API user** with minimal rights on a sandbox / alpha tenant.
- On a public Netlify site, set **`DEMO_GATE_KEY`** (and matching `VITE_DEMO_GATE_KEY`) and/or Netlify password protection — otherwise anyone can mint tokens for your API user.

## Before pushing

- Run `pnpm scan:secrets` (GitGuardian CLI — required, `ggshield auth login` once).
- Verify no real tenant/customer identifiers are present in examples.
- Keep sample values generic (`sandbox`, `example`).

## Netlify

See [docs/NETLIFY.md](docs/NETLIFY.md) for env variable split (build vs functions).
