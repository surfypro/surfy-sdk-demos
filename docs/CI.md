# Intégration continue (GitHub Actions)

Workflow : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

Déclenché sur **push** et **pull request** vers `main`.

## Jobs

| Job | Contenu | Secret requis |
|-----|---------|---------------|
| **Quality** | `pnpm quality` — oxlint, build Vite, `tsc` demo-server | Non |
| **E2E** | `pnpm test:e2e` — 33 tests Playwright + gate couverture SDK | Oui |

## Configurer les secrets (une fois)

Dans **GitHub → Settings → Secrets and variables → Actions** :

| Nom | Type | Valeur |
|-----|------|--------|
| `SURFY_CONNECTION_STRING` | Secret | `host=https://…;client_id=…;client_secret=…` (utilisateur API **lecture seule**, tenant démo / alpha) |

Optionnel :

| Nom | Type | Usage |
|-----|------|--------|
| `SURFY_TLS_INSECURE` | Variable | `1` par défaut en CI si certificat alpha non reconnu |

Ne jamais committer la connection string — uniquement dans les secrets GitHub (ou Netlify Functions en prod).

## Badge sur le README

```markdown
![CI](https://github.com/surfypro/surfy-sdk-demos/actions/workflows/ci.yml/badge.svg)
```

Le badge reflète l’état du dernier run sur la branche par défaut (`main`).

## Branch protection (recommandé)

**Settings → Branches → Branch protection rules** sur `main` :

- Require status checks : **Quality** et **E2E (Playwright)**
- Require PR before merging

Les PR depuis un **fork** n’ont pas accès aux secrets : le job E2E est **skipped** via `if` (comparaison fork/repo uniquement — **ne pas** utiliser `secrets.*` dans un `if` de job, GitHub le refuse). Sans secret configuré sur le repo, le job E2E démarre puis **skip** les steps (notice). Les PR internes avec secret exécutent Quality + E2E.

## PRs depuis l’équipe

Avant merge :

```bash
pnpm quality:full   # local, avec apps/demo-server/.env
```

Équivalent CI : Quality + E2E (si secret configuré).

## Artifacts

En cas d’échec E2E, le rapport HTML Playwright est publié en artifact **playwright-report** (7 jours).
