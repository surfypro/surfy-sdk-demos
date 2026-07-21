import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator === -1) return null;
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  );
}

const viteEnv = loadEnvFile(path.join(__dirname, '.env'));
const demoServerEnv = loadEnvFile(path.join(__dirname, '../demo-server/.env'));
const mergedEnv = { ...demoServerEnv, ...viteEnv };

for (const [key, value] of Object.entries(mergedEnv)) {
  process.env[key] ??= value;
}

const reactPort = Number(process.env.PLAYWRIGHT_REACT_PORT ?? 5174);
const demoServerPort = Number(process.env.PLAYWRIGHT_DEMO_SERVER_PORT ?? 8788);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${reactPort}`;
const demoServerURL = process.env.PLAYWRIGHT_DEMO_SERVER_URL ?? `http://localhost:${demoServerPort}`;

/** E2E runs many parallel layout mounts — disable proxy rate limit unless explicitly configured. */
const demoServerE2eEnv = {
  ...process.env,
  ...mergedEnv,
  PORT: String(demoServerPort),
  DEMO_RATE_LIMIT_DISABLED:
    process.env.DEMO_RATE_LIMIT_DISABLED ?? mergedEnv.DEMO_RATE_LIMIT_DISABLED ?? '1',
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: 'pnpm --filter demo-server dev',
          url: `${demoServerURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: demoServerE2eEnv,
        },
        {
          command: 'pnpm dev',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            ...mergedEnv,
            PORT: String(reactPort),
            DEMO_SERVER_URL: demoServerURL,
          },
        },
      ],
});
