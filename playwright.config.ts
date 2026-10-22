import { defineConfig } from '@playwright/test';

// Managed Chromium is reproducible locally and in CI. Set PLAYWRIGHT_CHANNEL=msedge for an optional installed-Edge check.
const use = { channel: process.env.PLAYWRIGHT_CHANNEL };

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4291 --strictPort', url: 'http://localhost:4291', reuseExistingServer: false },
  use: { baseURL: 'http://localhost:4291' },
  projects: [
    { name: 'desktop', use: { ...use, viewport: { width: 1440, height: 900 } } },
    // Request counts, storage, timing and copy don't depend on the viewport: those specs run on desktop only (K3).
    // Their layout cases live in specs that run here too (t7's Settings layout is in t12).
    { name: 'phone', use: { ...use, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, testIgnore: /(t4-|t6-|t7-|t9-|t10-|security)/ },
  ],
});
