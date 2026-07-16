# Surfy SDK Demos

Monorepo for SDK integration demos:

- `apps/react-web` — **active** (floor 2D, building 3D, floor 3D when registered)
- `apps/react-native` — next target (WebView → same SDK)
- `apps/demo-server` — local token proxy
- `netlify/` — production token + API proxy for Netlify

## Local setup

1. Build SDK in Surfy worktree:
   - `/Users/pouya/dev/surfy/surfy-worktrees/wt-ado-389-surfy-sdk`
   - run `pnpm build:sdk`
2. Sync bundle into this monorepo:
   - `pnpm sync:sdk`
3. Install deps:
   - `pnpm install`
4. Configure env:
   - `apps/react-web/.env` from `.env.example` (public `VITE_*` only)
   - `apps/demo-server/.env` from `.env.example` (**secrets** `SURFY_CLIENT_SECRET`)
5. Start:
   - `pnpm dev` (Vite + demo-server)

## Deploy on Netlify (alpha demo)

Yes — one React web app can expose all three demo tabs, talk to **alpha**, and stay reasonably safe if the API secret stays in **Netlify Functions** (not in `VITE_*`).

Full guide: **[docs/NETLIFY.md](docs/NETLIFY.md)**.

Summary:

1. Connect this repo to Netlify (`netlify.toml` is ready).
2. Set build vars: tenant, floor id, building id (`VITE_*`).
3. Set function secrets: `SURFY_BASE_URL`, `SURFY_CLIENT_ID`, `SURFY_CLIENT_SECRET`.
4. Strongly recommended: `DEMO_GATE_KEY` + `VITE_DEMO_GATE_KEY`, and/or Netlify password protection.

## Documentation (intégrateurs)

Guide développeur officiel : [surfy-help — Surfy SDK](https://help.surfy.pro/entities/sdk/).

## Security scanning (public-ready)

GitGuardian CLI (`ggshield`) is **required** — no fallback.

```bash
brew install ggshield
ggshield auth login
./scripts/setup-git-hooks.sh
```

See also [SECURITY.md](SECURITY.md).
