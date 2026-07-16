#!/usr/bin/env bash
# Local / Docker parity with Netlify production build.
# 1) install (optional)  2) react-web build  3) esbuild functions
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ "${SKIP_PNPM_INSTALL:-}" != "1" ]]; then
  echo "==> pnpm install"
  pnpm install --frozen-lockfile
else
  echo "==> skip pnpm install (SKIP_PNPM_INSTALL=1)"
fi

echo "==> build react-web (Vite)"
pnpm --filter react-web build

echo "==> verify Netlify functions bundle"
bash "${ROOT_DIR}/scripts/build-netlify-functions.sh"

echo "==> Netlify-parity build OK"
echo "    static: apps/react-web/dist"
echo "    functions: .netlify-build/functions"
