# Surfy SDK Demos

[![CI](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml/badge.svg)](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml)

Monorepo for SDK integration demos:

- `apps/react-web` — **active** (React web + simulateur React Native WebView sur le même site)
- `apps/react-native` — cible device/Expo plus tard (voir README ; simulateur déjà dans react-web)
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
   - `apps/react-web/.env` from `.env.example` (public `VITE_*` only — no floor/building IDs)
   - `apps/demo-server/.env` from `.env.example` with **`SURFY_CONNECTION_STRING`**:
     `host=https://…;client_id=…;client_secret=…`
5. Start:
   - `pnpm dev` (Vite + demo-server)

The UI loads buildings / floors live from the API and shows a picker.

## Deploy on Netlify (alpha demo)

Yes — one React web app can expose all three demo tabs, talk to **alpha**, and stay reasonably safe if the API secret stays in **Netlify Functions** (not in `VITE_*`).

Full guide: **[docs/NETLIFY.md](docs/NETLIFY.md)**.

Summary:

1. Connect this repo to Netlify (`netlify.toml` is ready).
2. Set optional build var: `VITE_DEMO_GATE_KEY` (browser always uses site origin for `/api/*`).
3. Set function secret: `SURFY_CONNECTION_STRING=host=…;client_id=…;client_secret=…`.
4. Strongly recommended: `DEMO_GATE_KEY` + `VITE_DEMO_GATE_KEY`, and/or Netlify password protection.

### Local Netlify-parity (Docker)

Reproduce the remote build (Vite + function esbuild) and serve with injected env:

```bash
cp .env.docker.example .env.docker
# edit SURFY_CONNECTION_STRING

pnpm build:netlify          # same steps as Netlify build command
docker compose up --build   # http://localhost:8080
```

`pnpm build:functions` alone verifies that `@surfy/surfy-demo-auth` resolves for Netlify’s esbuild bundler.

## Documentation (intégrateurs)

Guide développeur officiel : [surfy-help — Surfy SDK](https://help.surfy.pro/entities/sdk/).

## Qualité de code (équipe Surfy)

Conventions demos (types SDK, couches, taille des fichiers, checklist PR) : **[docs/CODE_QUALITY.md](docs/CODE_QUALITY.md)**.

Avant une PR demos :

```bash
pnpm quality                # lint + build react-web + typecheck demo-server
pnpm scan:secrets
```

Voir aussi le script `quality` dans `package.json`.

## Versionnement & couverture SDK

- **Versions** : app démo (`DEMO_APP_VERSION`) vs bundle syncé (`packages/surfy-sdk/SDK_VERSION`) — voir **[docs/VERSIONING.md](docs/VERSIONING.md)**.
- **E2E 100 %** : manifeste [`apps/react-web/e2e/sdkFeatureManifest.ts`](apps/react-web/e2e/sdkFeatureManifest.ts) + `pnpm test:e2e` (gate `coverage-gate.spec.ts`).

```bash
pnpm quality:full   # lint + build + tous les E2E (credentials requis)
```

**CI GitHub Actions** (push / PR `main`) : voir **[docs/CI.md](docs/CI.md)** — secret `SURFY_CONNECTION_STRING` requis pour le job E2E.

## Security scanning (public-ready)

GitGuardian CLI (`ggshield`) is **required** — no fallback.

```bash
brew install ggshield
ggshield auth login
./scripts/setup-git-hooks.sh
```

See also [SECURITY.md](SECURITY.md).
