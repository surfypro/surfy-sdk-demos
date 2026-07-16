# syntax=docker/dockerfile:1
# Netlify-parity image: install → Vite build → esbuild functions → serve static + handlers.
# Runtime secrets (SURFY_CONNECTION_STRING, DEMO_GATE_KEY) are injected via compose / -e.

FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

WORKDIR /app

# Public Vite env must be available at build time (never put client_secret in VITE_*).
ARG VITE_SURFY_BASE_URL=
ARG VITE_DEMO_GATE_KEY=
ENV VITE_SURFY_BASE_URL=$VITE_SURFY_BASE_URL \
    VITE_DEMO_GATE_KEY=$VITE_DEMO_GATE_KEY

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY netlify ./netlify
COPY netlify.toml ./
COPY scripts ./scripts
COPY docs ./docs
COPY README.md SECURITY.md ./

RUN pnpm install --frozen-lockfile
ENV SKIP_PNPM_INSTALL=1
RUN pnpm run build:netlify

# --- runtime: static + bundled functions (Netlify-parity) ---
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080

COPY --from=build /app/apps/react-web/dist ./apps/react-web/dist
COPY --from=build /app/.netlify-build ./.netlify-build
COPY --from=build /app/scripts/serve-production.mjs ./scripts/serve-production.mjs

EXPOSE 8080

# Inject SURFY_CONNECTION_STRING / DEMO_GATE_KEY at `docker compose up` time.
CMD ["node", "scripts/serve-production.mjs"]
