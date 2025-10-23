import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "playwright/tests",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --port=3100 --hostname=127.0.0.1",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_DATA_MODE: "mock",
      NODE_ENV: "test",
    },
  },
});
