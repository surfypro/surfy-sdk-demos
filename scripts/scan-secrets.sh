#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if ! command -v ggshield >/dev/null 2>&1; then
  echo "ERROR: ggshield (GitGuardian CLI) is required."
  echo "Install: brew install ggshield"
  echo "Then authenticate once: ggshield auth login"
  exit 1
fi

echo "Running GitGuardian secret scan..."

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && ! git diff --cached --quiet 2>/dev/null; then
  echo "-> scanning staged changes"
  ggshield secret scan pre-commit
else
  echo "-> scanning repository (honoring .gitignore, non-interactive)"
  # --use-gitignore skips local .env / node_modules / dist (secrets stay local)
  # --yes avoids interactive "N files will be scanned?" prompt
  ggshield secret scan path --recursive . --yes --use-gitignore
fi

echo "Secret scan passed."
