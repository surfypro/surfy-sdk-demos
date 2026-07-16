#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="/Users/pouya/dev/surfy/surfy-worktrees/wt-ado-389-surfy-sdk/dist/surfy-sdk"
TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/packages/surfy-sdk"

if [[ ! -f "${SOURCE_DIR}/index.js" ]]; then
  echo "Missing SDK bundle at ${SOURCE_DIR}/index.js"
  echo "Run pnpm build:sdk in wt-ado-389-surfy-sdk first."
  exit 1
fi

mkdir -p "${TARGET_DIR}"
cp "${SOURCE_DIR}/index.js" "${TARGET_DIR}/index.js"
cp "${SOURCE_DIR}/index.d.ts" "${TARGET_DIR}/index.d.ts"

echo "Synced local SDK bundle to ${TARGET_DIR}"
