# Qualité de code — surfy-sdk-demos

Guide pour **développeurs Surfy** et agents Cursor. Objectif : garder les démos lisibles, alignées sur l’API publique `@surfy/surfy-sdk`, et sûres (pas de secret client dans le navigateur).

## Périmètre

| Package | Rôle | Lint actuel |
|---------|------|-------------|
| `apps/react-web` | UI démo (onglets layout, thème, snippets) | **oxlint** (`pnpm --filter react-web lint`) |
| `apps/demo-server` | Session + proxy Bearer | `tsc --noEmit` |
| `packages/surfy-demo-auth` | Connection string + auth serveur | via consumers |
| `packages/surfy-sdk` | Bundle syncé (généré) | **ne pas éditer** — rebuild depuis le worktree Surfy |

> **Attention** — Ce monorepo **n’utilise pas** l’ESLint Surfy (`@surfy/*`, `eslint:typed`). Les conventions ci-dessous compensent ce gap. Le code **SDK** (`src/surfy-sdk/`, embed Cuby) reste dans le monolithe Surfy et doit passer `pnpm eslint` / `pnpm feature:close:check`.

## Commandes à lancer avant PR

Depuis la racine `surfy-sdk-demos` :

```bash
pnpm quality          # lint + build react-web + typecheck demo-server
# équivalent :
pnpm --filter react-web lint
pnpm --filter react-web build
pnpm --filter demo-server typecheck
pnpm scan:secrets
```

Après un changement SDK côté Surfy :

```bash
# worktree Surfy
pnpm build:sdk

# demos
pnpm sync:sdk
pnpm --filter react-web lint && pnpm --filter react-web build
```

## Règles dures

### 1. Types SDK — importer, ne pas recopier

Interdit de re-déclarer `SurfyLayout3dOptions`, `SurfyLayoutElement`, wall modes, etc. dans la démo.

```ts
// Prefer
import type {
  SurfyLayout3dOptions,
  SurfyBuildingLayout3dElement,
} from '@surfy/surfy-sdk';

// Avoid — drift silencieux dès que public.ts évolue
type SurfyLayout3dOptions = { floorSpace?: number; … };
```

### 2. Couches : UI démo ≠ logique SDK

| Couche | OK | Interdit |
|--------|----|----------|
| UI démo | `SurfySdk.mountFloor2d` / `mountBuilding3d`, `setOptions`, `setRoomColors`, `updateRoom`, `fitToView` | Accès Cuby, jotai Surfy, `cubyStore`, `document.createElement` pour les layouts |
| `demo-server` / Netlify functions | `parseSurfyConnectionString`, proxy `/api/v1` | Exposer `clientSecret` ou JWT Surfy au browser |
| Bundle syncé | consommer `@surfy/surfy-sdk` | Patcher `packages/surfy-sdk` à la main |

### 3. Fichiers courts, un job par fichier

Cibles indicatives :

| Fichier | Limite soft | Action si dépassé |
|---------|-------------|-------------------|
| Panel / page React | ~250 lignes | Extraire `*Controls.tsx`, `*helpers.ts` |
| Handler / effect lourd | ~80 lignes | Extraire helpers purs + tests si logique non triviale |

Exemple de découpage layout demos :

```text
demos/layout/
  floor-2d/Floor2dDemoPanel.tsx       — mountFloor2d seulement
  building-3d/Building3dDemoPanel.tsx — mountBuilding3d seulement
  building-3d/Building3dDemoControls.tsx
  building-3d/building3dDemo.constants.ts
  shared/LayoutDemoShell.tsx          — chrome section
  shared/LayoutDemoCommonActions.tsx  — couleurs / blink / clear
  shared/useLayoutDemoChrome.ts       — events, theme, snippets
  shared/layoutDemo.constants.ts
  actions/*                           — boutons unitaires

demoLayoutElement.ts                  — waitForDemoRoomId via SurfyLayout
demoApiSnippets.ts                    — snippets copiables
demoThemes.ts / useDemoTheme.ts       — presets thème
```

### 4. Hooks React

- Déclarer les `useCallback` **avant** de les utiliser dans d’autres callbacks / deps (évite TDZ / `ReferenceError`).
- Dépendances `useEffect` complètes (oxlint `exhaustive-deps`) ; si omission volontaire, commentaire **pourquoi**.
- Pas d’effet de bord dans `useMemo` (hydratation → `useLayoutEffect` ou seed synchrone documenté).

### 5. Auth & secrets

- Navigateur : session cookie + `SURFY_DEMO_PROXY_BEARER` uniquement (voir [SECURITY.md](../SECURITY.md)).
- Serveur : **`SURFY_CONNECTION_STRING`** (`host=…;client_id=…;client_secret=…`) via `parseSurfyConnectionString` — pas de trio `SURFY_BASE_URL` + `CLIENT_ID` + `SECRET` dans les nouveaux exemples.
- Jamais de `clientSecret` / JWT Surfy réel dans `VITE_*`, snippets, ou logs API.

### 6. Alignement doc publique

Chaque contrôle démo qui appelle une API SDK doit avoir :

1. Snippet dans `demoApiSnippets.ts`
2. Page correspondante dans `surfy-help/entities/sdk/` (voir [maintenance.md](https://help.surfy.pro/entities/sdk/maintenance) / repo `surfy-help`)
3. Types issus du package syncé, pas d’API « fantôme »

## Checklist PR (demos)

- [ ] `pnpm quality` vert (lint + build + typecheck serveur)
- [ ] Aucun type SDK recopié ; imports depuis `@surfy/surfy-sdk`
- [ ] Fichiers touchés restent sous les limites soft (ou split justifié)
- [ ] Snippets + surfy-help à jour si nouvelle API démontrée
- [ ] `pnpm sync:sdk` après rebuild SDK si le bundle a changé
- [ ] `pnpm scan:secrets` / hooks GitGuardian OK

## Anti-patterns déjà rencontrés

| Problème | Symptôme | Correctif |
|----------|----------|-----------|
| Types locaux vs `public.ts` | Démo compile, intégrateur casse | Import `@surfy/surfy-sdk` |
| `pushApiLine` après `apply3dOptions` | Crash TDZ au premier `setOptions` | Ordre de déclaration hooks |
| Blink 3D sans `data-room-id` | Random blink no-op | Registre rooms côté SDK embed (déjà dans le viewer 3D) |
| `setRoomColors` → re-render React complet | Blink saccadé / scène remontée | Mise à jour jotai sans remount WC |
| CubyHandler → `@/surfy-sdk/react/…` | Couche SPA dépend du package SDK | Atoms / sync dans `front/surfy/SimpleBuilding…` |

## Lien avec le monolithe Surfy

Qualité du **SDK lui-même** (pas de ce repo) :

```bash
# worktree feature SDK
pnpm eslint src/surfy-sdk src/front/surfy/SimpleBuildingLayoutViewer …
# avant PR
pnpm feature:close:check
```

Règles Cursor monolithe : `.cursor/rules/sonar-coding-style.mdc`, `sonar-local.mdc`, `ci-gate-before-pr.mdc`.

## Évolutions souhaitables

1. Découper layout demos en panels 2D / 3D séparés — **fait** (`Floor2dDemoPanel`, `Building3dDemoPanel`, `shared/`).
2. Types SDK importés depuis `@surfy/surfy-sdk` — **fait** (plus de doublons locaux).
3. Script racine `pnpm quality` — **fait**.
4. Renforcer oxlint (règles hooks / unused / eqeqeq) — **fait** (`.oxlintrc.json`) ; type-aware (`oxlint-tsgolint`) en option ultérieure.
