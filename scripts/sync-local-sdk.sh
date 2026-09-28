#!/usr/bin/env bash
set -euo pipefail

# Prefer coordinator checkout dist; override with SURFY_SDK_DIST for a worktree.
SOURCE_DIR="${SURFY_SDK_DIST:-/Users/pouya/dev/surfy/surfy/dist/surfy-sdk}"
TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/packages/surfy-sdk"

if [[ ! -f "${SOURCE_DIR}/index.js" ]]; then
  echo "Missing SDK bundle at ${SOURCE_DIR}/index.js"
  echo "Run pnpm build:sdk in the Surfy checkout first (or set SURFY_SDK_DIST)."
  exit 1
fi

if [[ ! -f "${SOURCE_DIR}/client.js" ]]; then
  echo "Missing SDK client bundle at ${SOURCE_DIR}/client.js"
  exit 1
fi

if [[ ! -f "${SOURCE_DIR}/react.js" ]]; then
  echo "Missing SDK react bundle at ${SOURCE_DIR}/react.js"
  exit 1
fi

mkdir -p "${TARGET_DIR}"
cp "${SOURCE_DIR}/index.js" "${TARGET_DIR}/index.js"
cp "${SOURCE_DIR}/index.d.ts" "${TARGET_DIR}/index.d.ts"
cp "${SOURCE_DIR}/client.js" "${TARGET_DIR}/client.js"
cp "${SOURCE_DIR}/client.d.ts" "${TARGET_DIR}/client.d.ts"
cp "${SOURCE_DIR}/react.js" "${TARGET_DIR}/react.js"
cp "${SOURCE_DIR}/react.d.ts" "${TARGET_DIR}/react.d.ts"
if [[ -f "${SOURCE_DIR}/package.json" ]]; then
  cp "${SOURCE_DIR}/package.json" "${TARGET_DIR}/package.json"
fi

SDK_VERSION=$(node -e "const fs=require('fs');const s=fs.readFileSync('${SOURCE_DIR}/index.js','utf8');const m=s.match(/var SURFY_SDK_VERSION = \"([^\"]+)\"/);if(!m)process.exit(1);process.stdout.write(m[1]);")
echo "${SDK_VERSION}" > "${TARGET_DIR}/SDK_VERSION"

echo "Synced local SDK bundle to ${TARGET_DIR} (index + client + react, SDK ${SDK_VERSION})"
