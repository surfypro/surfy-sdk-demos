# Quality agent scripts — errors-only deposits

Agent-facing quality checks for **surfy-sdk-demos**. Goal: **never dump green output into the agent context**.

Ported from Surfy monolith `docs/dev/quality-agent.md` / `scripts/dev/quality/quality-agent*.ts` (alpha workflow), adapted to this repo:

| Surfy (alpha) | demos |
|---------------|-------|
| eslint typed | **oxlint** (`quality:agent:lint`) |
| `origin/alpha` merge-dry | **`origin/main`** merge-dry |
| Azure Test twin gate | GitHub Actions **Quality** twin (`pnpm quality`) |

Implementation: TypeScript under `scripts/dev/quality/quality-agent*.ts`, run via `pnpm exec tsx` (`package.json` → `quality:agent:*`).

## Commands

| Script | What | When |
|--------|------|------|
| `pnpm quality:agent:tsc` | `tsc` on `surfy-demo-auth`, `demo-server`, `react-web` | atomic / pulse down |
| `pnpm quality:agent:lint` | oxlint **autofix by default** (`--no-fix` for check-only) | atomic / pulse down |
| `pnpm quality:agent:code` | **lint** + **tsc** | **after each milestone** |
| `pnpm quality:agent:gate` | CI Quality twin (lint check-only + react-web build + demo-server typecheck) | mid-flight QC if needed |
| `pnpm quality:agent:ci` | merge-dry `origin/main` + `quality:agent:gate` | **before push / PR** |

Human / CI aliases (full logs OK):

| Script | What |
|--------|------|
| `pnpm quality` | same checks as gate, verbose (CI job **Quality**) |
| `pnpm quality:full` | `quality` + Playwright E2E |

Deposits on fail under `.surfy/quality-agent/` (gitignored):

| Composite | Summary file | Step deposits |
|-----------|--------------|---------------|
| `code` | `code.summary.json` | `lint.json`, `tsc.json`, … |
| `gate` | `gate.summary.json` | per-step JSON |
| `ci` | `ci.summary.json` | `merge-main.json` + gate deposits |

Stdout = **one line** per step (`OK tsc` / `FAIL lint n=3 → …`). On success the per-kind error file is **removed**.

## Ladder (orchestrator / developer)

```text
slice     → quality:agent:tsc / lint          → commit
milestone → pnpm quality:agent:code           → next work
feature   → pnpm quality:agent:ci             → push / PR
```

| Phase | Do | Don’t |
|-------|----|--------|
| Slice | Targeted `quality:agent:tsc` / `lint` | Full `quality:agent:ci` / `gate` |
| Milestone done | `quality:agent:code` | Wait until close to discover tsc/lint debt |
| Close / PR | `quality:agent:ci` | Raw `tsc` / `oxlint` / `pnpm quality` dump in chat |

## Agent rules

1. One-shot → `quality:agent:*` only — **not** raw `tsc` / `oxlint` / `pnpm quality` in agent chat.
2. **After milestone delivery** → `pnpm quality:agent:code` (oxlint autofix by default, then report remaining). On FAIL → `Read` `.surfy/quality-agent/code.summary.json` + linked deposits. Commit autofixed files with the milestone work.
3. **Before push / PR** → `pnpm quality:agent:ci`. On FAIL → `Read` `ci.summary.json` + deposits.
4. Do **not** run full `quality:agent:ci` / `quality:agent:gate` after every slice.
5. E2E stays `pnpm quality:full` / `pnpm test:e2e` when layout / SDK / Playwright surfaces change.

## Report shape

```json
{
  "ok": false,
  "kind": "tsc",
  "count": 2,
  "truncated": false,
  "errors": [
    { "file": "apps/react-web/src/a.ts", "line": 10, "col": 2, "code": "TS2322", "message": "…" }
  ]
}
```

Max errors deposited: **50** (`DEFAULT_MAX_ERRORS`).
