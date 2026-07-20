#!/usr/bin/env bash
# Bundle Netlify functions the same way Netlify's esbuild bundler does.
# Fails fast if @surfy/surfy-demo-auth (or other imports) cannot be resolved.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

OUT_DIR="${ROOT_DIR}/.netlify-build/functions"
mkdir -p "${OUT_DIR}"

echo "-> bundling Netlify functions with esbuild (platform=node)"

pnpm exec esbuild \
  "netlify/functions/health.ts" \
  "netlify/functions/surfy-session.ts" \
  "netlify/functions/surfy-token.ts" \
  "netlify/functions/surfy-api-proxy.ts" \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=cjs \
  --outdir="${OUT_DIR}" \
  --log-level=info

echo "-> function bundle OK (${OUT_DIR})"
ls -la "${OUT_DIR}"
