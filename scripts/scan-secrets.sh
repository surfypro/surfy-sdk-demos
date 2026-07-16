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

if git diff --cached --quiet 2>/dev/null; then
  echo "-> no staged changes, scanning full repository"
  ggshield secret scan path --recursive .
else
  echo "-> scanning staged changes"
  ggshield secret scan pre-commit
fi

echo "Secret scan passed."
