# Versionnement — surfy-sdk-demos

Deux numéros de version coexistent :

| Artefact | Où | Règle |
|----------|-----|--------|
| **App démo** | `apps/react-web/src/demoVersion.ts` (`DEMO_APP_VERSION`), racine `package.json` | Semver indépendant — bump à chaque release démo (UI, E2E, docs). |
| **Bundle SDK** | `packages/surfy-sdk/SDK_VERSION` (généré par `pnpm sync:sdk`) | Copie de `SURFY_SDK_VERSION` du monolithe Surfy (`src/surfy-sdk/constants.ts`). |

## Release démo

1. Mettre à jour `DEMO_APP_VERSION` et `package.json` (`version`).
2. Entrée dans [CHANGELOG.md](../CHANGELOG.md).
3. `pnpm sync:sdk` si le bundle SDK a changé — noter la compat SDK dans le changelog.
4. `pnpm quality:full` (lint, build, E2E avec credentials).
5. Tag Git : `v1.0.0` sur `surfy-sdk-demos`.

## Couverture SDK (E2E)

Le fichier [`apps/react-web/e2e/sdkFeatureManifest.ts`](../apps/react-web/e2e/sdkFeatureManifest.ts) liste **toutes** les capacités publiques SDK démontrées dans cette app.

- Entrée avec `coveredBy` → spec dédiée (`sdk.spec.ts`, `room-color.spec.ts`, …).
- Entrée sans `coveredBy` → test dans `sdk-coverage.spec.ts`.
- `coverage-gate.spec.ts` échoue si une entrée du manifeste n’a pas de test associé.

**Ajouter une API SDK au produit :**

1. L’exposer dans la démo (bouton + snippet).
2. Ajouter une ligne au manifeste.
3. Implémenter le test E2E (spec dédiée ou `sdk-coverage.spec.ts`).
4. `pnpm test:e2e` doit rester vert.

## Commandes

```bash
pnpm sync:sdk          # copie bundle + SDK_VERSION
pnpm test:e2e          # Playwright (démarre demo-server + Vite)
pnpm quality           # lint + build + typecheck serveur
pnpm quality:full      # quality + test:e2e
```
