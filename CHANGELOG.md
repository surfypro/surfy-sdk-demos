# Changelog — surfy-sdk-demos

Format basé sur [Keep a Changelog](https://keepachangelog.com/). Versioning semver de **l’app démo** (pas du bundle SDK).

## [1.0.0] - 2026-07-21

### Added

- Versionnement semver de la démo (`DEMO_APP_VERSION`, affichage dans l’UI).
- Manifeste de couverture SDK (`e2e/sdkFeatureManifest.ts`) — une entrée par capacité publique démontrée.
- Gate E2E `coverage-gate.spec.ts` : 100 % du manifeste doit être couvert.
- `sdk-coverage.spec.ts` : thème, fill-parent, events hover/select, options 3D, `updateRoom`, `setFetchFloorIds`, data API, meta `SurfySdk`.
- `layout-view.spec.ts` : `fitToView` + `zoomOn` (2D et 3D).
- Script `quality:full` (lint + build + E2E avec credentials).

### Changed

- Tests smoke / refresh alignés sur la nav actuelle (plus d’onglet « Étage 3D »).
- `sync:sdk` écrit `packages/surfy-sdk/SDK_VERSION` depuis le bundle Surfy.

### SDK compatibility

- Bundle syncé : **@surfy/surfy-sdk 0.2.0** (voir `packages/surfy-sdk/SDK_VERSION` après `pnpm sync:sdk`).

[1.0.0]: https://github.com/surfypro/surfy-sdk-demos/releases/tag/v1.0.0
