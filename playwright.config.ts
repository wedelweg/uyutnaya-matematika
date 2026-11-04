import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "";
const builtBase = existsSync("dist/manifest.webmanifest")
  ? JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8")).start_url
  : "/uyutnaya-matematika/";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.TEST_URL || `http://127.0.0.1:4188${builtBase}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 393, height: 852 },
    launchOptions:
      process.platform === "win32" && existsSync(chrome)
        ? { executablePath: chrome }
        : {},
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 393, height: 852 },
      },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4188 --strictPort",
    url: `http://127.0.0.1:4188${builtBase}`,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
