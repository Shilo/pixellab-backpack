# PixelLab Backpack

PixelLab Backpack is an unofficial, view-only gallery for a person's own PixelLab (pixellab.ai) art. The user pastes their PixelLab API key, and the app lists, searches, plays and organizes their characters, objects, tilesets, tiles and UI assets.
It runs entirely in the browser: no backend, no accounts, no telemetry. It never creates, changes or deletes anything in PixelLab, and it sends only GET requests, to api.pixellab.ai (data) and backblaze.pixellab.ai (pictures).
Live at https://shilo.github.io/pixellab-backpack/ (GitHub Pages, deployed from main). MIT license. Not affiliated with or endorsed by PixelLab.
Features: key screen, library home with category tiles, category grids and All assets, search, viewer (animation player, Info, zoom, backdrops), favorites and folders, Settings, Activity panel (every request the app sends), Refresh.
Design: iOS-like simplicity with progressive disclosure. One dock, few visible controls, everything else in menus and sheets. Pixel art is drawn crisp at whole-pixel sizes. Keyboard, screen reader, 4.5:1 text contrast and 44 px touch targets are required.
Stack: Svelte 5 runes, Vite 8, TypeScript, plain CSS on a vendored GlassKit theme, idb-keyval (IndexedDB), Vitest, Playwright with the installed Microsoft Edge.

## Rules

API budget: every request costs PixelLab. Opening the app costs 7 first-page GETs (one per asset family), at most once an hour. Next pages load only on scroll. Costly pictures are fetched after 0.3 s on screen, once per device. Safety net: 2 requests at a time, 2 per second, 1,000 per day. Any new request needs a budget in its plan (decision P-16).
Network: only src/lib/api/http.ts calls fetch; a unit test enforces it.
Key: sent only as a Bearer header to api.pixellab.ai, never in URLs, logs or exports. It is stored in sessionStorage, or in localStorage only while "Keep me signed in" is on.
Remembered keys use localStorage pixellabApiKey, shared with PixelDoll on the same origin. The old app-specific key migrates on load; an existing shared key wins. Other open apps read the saved key on their next load.
Local data: the saved library, favorites and folders live in IndexedDB. Forget key and switching accounts wipe them.
Privacy and security: no new hosts and no analytics. The CSP lives in public/_headers and is copied into index.html at build.
GlassKit: src/vendor/glasskit stays byte-identical; override it in src/app.css.
Art: never commit PixelLab art or screenshots of it (mockups/ is gitignored for this reason).
KISS and YAGNI: make the smallest complete change and reuse before adding. Write no speculative code. Mark deliberate limits with a "ponytail:" comment.

## Where things are

App shell and hash routes: src/App.svelte, src/lib/router.svelte.ts
Network, queue, rate limits, key storage: src/lib/api/http.ts
PixelLab families and cards: src/lib/api/families.ts, src/lib/categories.ts
Library state, open check, account check, paging: src/lib/data/library.svelte.ts, src/lib/data/check.ts
Saved copy in IndexedDB: src/lib/data/store.ts
Favorites and folders: src/lib/data/org.svelte.ts
Search: src/lib/search.ts, src/lib/ui/Search.svelte
Viewer and player: src/lib/ui/Viewer.svelte, src/lib/viewer.ts, src/lib/render/
UI components: src/lib/ui/
Styles: src/app.css
Unit tests: tests/unit/
End-to-end tests and PixelLab mock: tests/e2e/, tests/fixtures/pixellab-mock.ts
Roadmap, owner to-dos, known issues: docs/plan/roadmap.md
Decisions and doc precedence: docs/design/00-decision-log.md
Behavior spec: docs/design/02-ux-spec.md
Architecture: docs/design/05-architecture.md
Past phase plans and build logs: docs/plan/
PixelLab API shapes: docs/research/01-pixellab-api-asset-inventory.md, docs/research/13-phase0-results.md

## Validate

Run npm run check, npm test and npm run build; the build ends with the dist guard, scripts/dist-guard.mjs.
Then run npx playwright test --workers=2, which takes about 15 minutes. Run one Playwright run at a time: it serves the build on port 4291 and fails if that port is taken. The e2e tests mock PixelLab and need no key.
For UI changes, also look at the running app at 1440, 390 and 320 px wide.

## Agent testing with the real key

npm run dev:agent (http://localhost:5281, launch config app-dev-agent) serves PIXELLAB_API_KEY_AGENT_DEV from the git-ignored repo-root .env to same-origin localhost requests. The app signs in through the normal key check, keeps the key in memory only and shows an "Agent mode" badge.
Humans use npm run dev, which has no key endpoint. vite build --mode agent refuses to run, and the dist guard keeps agent code out of dist.
Never open, print, log, screenshot or commit the key or .env. Never expose the agent server beyond localhost (no --host, tunnels or port forwards).
For keyless runs on the agent server, set the localStorage item backpack.agentKey to "off" before the app loads. The switch is read at page load and covers every tab of that origin, so keep it set for the whole run.
Real-key use stays read-only: the open check is the test, so add no other calls.

## Deploy

.github/workflows/pages.yml checks, tests and builds every push and PR, and deploys main to GitHub Pages. CI has no secrets and never sees the key.

## Commits

Follow the Conventional Commits standard: type(scope): description.
