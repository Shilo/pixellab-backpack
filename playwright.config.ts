import { defineConfig } from '@playwright/test';

// channel 'msedge' uses the installed Microsoft Edge: no browser download.
const use = { channel: 'msedge' };

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run build && npm run preview -- --port 4291 --strictPort', url: 'http://localhost:4291', reuseExistingServer: false },
  use: { baseURL: 'http://localhost:4291' },
  projects: [
    { name: 'desktop', use: { ...use, viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...use, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
