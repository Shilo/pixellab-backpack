# PixelLab Backpack

**Keep your PixelLab art packed in one place. Browse, search, play and organize images.**

**[Open the app](https://shilo.github.io/pixellab-backpack/)** · An unofficial, view-only gallery that runs entirely in your browser with your own API key. Open source under the [MIT License](LICENSE).

> **Unofficial.** PixelLab Backpack is not made by, affiliated with, or endorsed by PixelLab. It uses no PixelLab logo, mascot, colors or screenshots.

The name is decided ([name research](docs/research/naming/18c-name-ideas-professional.md)). Older design docs and mockups use an earlier working name; read it as PixelLab Backpack.

## Status

The app is built and works against the real PixelLab API. Four phases are done; each has a plan and a build log.

| Phase | What it added | Plan | Build log |
|---|---|---|---|
| MVP | Key screen, library home with category tiles, category grids, Activity panel, Refresh | [plan](docs/plan/mvp-plan.md) | [log](docs/plan/mvp-build-log.md) |
| 2 | Settings and the asset viewer (player, Info, zoom and backdrops) | [plan](docs/plan/phase2-plan.md) | [log](docs/plan/phase2-build-log.md) |
| 3 | Search and All assets | [plan](docs/plan/phase3-plan.md) | [log](docs/plan/phase3-build-log.md) |
| 4 | Favorites and folders, with the card menu | [plan](docs/plan/phase4-plan.md) | [log](docs/plan/phase4-build-log.md) |

A full project review followed (2026-10-21). What comes next, owner to-dos and known small issues: the [roadmap](docs/plan/roadmap.md).

## What it does

- **Key screen.** Paste your PixelLab API key. It stays in this tab only, unless you turn on **Keep me signed in**.
- **Library home.** Category tiles: Characters, Objects, Tilesets & tiles, UI.
- **Grids.** One grid per category, plus **All assets**. Pictures are drawn crisp at whole-pixel sizes.
- **Search.** Finds assets by name in what is already saved on your device.
- **Viewer.** Plays animated characters and objects and shows stills for the rest. **Info** lists everything the API says about the asset. Zoom and backdrops are one menu away.
- **Favorites and folders.** Kept on your device. Add them from the card menu.
- **Settings.** Keep me signed in, Forget key (wipes the key and the saved library from this device), About.
- **Activity panel.** Lists every request the app sends, so you can see it.
- **Refresh.** Checks PixelLab again on demand.

Not built yet: Creator-gallery Images, Maps, downloads, backup, and animated previews on cards.

## Light on the API

Reading your library should cost PixelLab as little as possible.

- **GET only.** Requests go to `api.pixellab.ai` (data) and `backblaze.pixellab.ai` (pictures). Nothing else is allowed, and nothing is ever created, changed or deleted.
- **One first-page check per category, at most once an hour.** That is 7 requests when you open the app. Coming back within the hour sends none. The key test is one of these checks, so there is no extra call.
- **Pages load as you scroll,** not before.
- **Costly pictures are fetched once per device.** Tileset, Tiles Pro and isometric-tile pictures need one extra request each, only after the card has been on screen briefly. The answer is saved.
- **Safety net.** At most 2 requests at a time, 2 per second and 1,000 per day.

Details: [MVP plan](docs/plan/mvp-plan.md) and [review R6](docs/reviews/R6-api-minimization-review.md).

## Run it

Use Node.js **24.22.1** (`.nvmrc`) and its bundled npm **11.19.1**.

```bash
npm ci
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run dev:agent` | AI agents only: dev server on :5281 that signs in with the `.env` key ([AGENTS.md](AGENTS.md)) |
| `npm run build` | Production build into `dist/`, then a check that no dev or agent-key code got in |
| `npm run preview` | Serves the build |
| `npm run check` | Type check (svelte-check) |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | Full end-to-end suite (Playwright, mocked PixelLab, desktop and phone) |
| `npm run e2e:smoke` | Bounded CI checks: key/library, viewer deep link and 320 px layout |

Install the matching managed browser once with `npx playwright install chromium`, then run `npm run e2e -- --workers=2`. Chromium is the default locally and in CI. An optional installed-Edge check uses `PLAYWRIGHT_CHANNEL=msedge` (PowerShell: `$env:PLAYWRIGHT_CHANNEL='msedge'`). Run only one Playwright run at a time: it serves the build on port 4291. Chromium results do not establish Firefox or Safari compatibility.

## GitHub Pages

Every push to `main` is checked, built and published to <https://shilo.github.io/pixellab-backpack/> by `.github/workflows/pages.yml` (Pages source: GitHub Actions). Pull requests are checked and built only. Repository description and topics: [docs/github-repo.md](docs/github-repo.md).

## Privacy and safety

- No backend and no telemetry. The key is sent only to `api.pixellab.ai` and never appears in URLs or logs.
- A strict content-security policy and other security headers are in `public/_headers` (served by `npm run preview`). The build also puts the CSP into `index.html`, because GitHub Pages ignores `_headers`.
- The saved library lives in your browser. Forget key removes it.

## Stack

Svelte `5.57.2`, Vite `8.3.4`, `@sveltejs/vite-plugin-svelte` `7.3.1`, TypeScript `6.0.3` (strict), `svelte-check` `4.7.7`, `@types/node` `24.19.2`, CSS-only `@jungherz-de/glasskit` `1.27.0` (MIT, see `public/licenses.txt`), `idb-keyval` `6.3.0`, Vitest `4.1.12` and `@playwright/test` `1.64.1`. Direct package versions are exact and the lockfile is committed. GlassKit is imported unchanged from npm; app overrides and the CSS-minification workaround remain in place.

## Design mockups

The design mockups (87 screens of the chosen design, plus earlier explorations) are kept locally and not tracked, because they hold PixelLab art and screenshots of it. Older docs still link to `mockups/`; earlier commits have those files.

## Open decisions (owner)

- Contacting PixelLab under their terms of service (section 2.2) before any public launch.
- Whether to ship a PWA manifest.

Every ruling so far is in the [decision log](docs/design/00-decision-log.md).

## Repository map

Start with the [product brief](docs/design/01-product-brief.md), then the [decision log](docs/design/00-decision-log.md). Where docs disagree, the decision log wins, then the newest plan for the phase in question.

**Plans and build logs** (`docs/plan/`)

| Doc | Purpose |
|---|---|
| [roadmap.md](docs/plan/roadmap.md) | What comes next, owner to-dos, known small issues |
| [mvp-plan.md](docs/plan/mvp-plan.md) · [mvp-build-log.md](docs/plan/mvp-build-log.md) | The MVP: concerns, API strategy, module map |
| [phase2-plan.md](docs/plan/phase2-plan.md) · [phase2-build-log.md](docs/plan/phase2-build-log.md) | Settings and the viewer |
| [phase3-plan.md](docs/plan/phase3-plan.md) · [phase3-build-log.md](docs/plan/phase3-build-log.md) | Search and All assets |
| [phase4-plan.md](docs/plan/phase4-plan.md) · [phase4-build-log.md](docs/plan/phase4-build-log.md) | Favorites and folders |

**Design** (`docs/design/`)

| Doc | Purpose |
|---|---|
| [00-decision-log.md](docs/design/00-decision-log.md) | Every decision and the precedence order |
| [01-product-brief.md](docs/design/01-product-brief.md) | Intent, users, goals, non-goals, scope |
| [02-ux-spec.md](docs/design/02-ux-spec.md) | Behavior: routes, flows, cards, Info fields, viewer, states, copy |
| [03-mockup-requirements.md](docs/design/03-mockup-requirements.md) | Acceptance checklist for the mockups |
| [04-design-options.md](docs/design/04-design-options.md) | Historical record of options A, B and C |
| [05-architecture.md](docs/design/05-architecture.md) | Modules, data model, API layer, rendering, security, deploy |
| [06-implementation-plan.md](docs/design/06-implementation-plan.md) | Original phased plan (the phase plans above win) |
| [07-recommended-design.md](docs/design/07-recommended-design.md) | The earlier hybrid; its tokens and accessibility rules still apply |
| [08-simplicity-redesign.md](docs/design/08-simplicity-redesign.md) | The simplicity redesign that shaped the current layout |

**Research** (`docs/research/`: 00–12 and 14–17, plus naming)

| Doc | Purpose |
|---|---|
| [00-research-report.md](docs/research/00-research-report.md) | Synthesis: feasibility, API shape, security, UX model, stack |
| [01-pixellab-api-asset-inventory.md](docs/research/01-pixellab-api-asset-inventory.md) | What REST v2 and MCP expose per asset family |
| [02-browser-integration-and-security.md](docs/research/02-browser-integration-and-security.md) | CORS captures, key storage, CSP, terms of service |
| [03-pixellab-website-gallery-audit.md](docs/research/03-pixellab-website-gallery-audit.md) | PixelLab's own gallery: flaws and strengths |
| [04-platform-gallery-apps-ux.md](docs/research/04-platform-gallery-apps-ux.md) | Apple, Google, Samsung and Microsoft photo apps |
| [05-creative-asset-gallery-ux.md](docs/research/05-creative-asset-gallery-ux.md) | AI-art and asset-manager galleries |
| [06-pixel-art-rendering-animation-and-export.md](docs/research/06-pixel-art-rendering-animation-and-export.md) | Integer scaling, canvas playback, export rules |
| [07-tech-stack-and-architecture.md](docs/research/07-tech-stack-and-architecture.md) | Stack choices and module layout |
| [08-visual-design-theming-responsive.md](docs/research/08-visual-design-theming-responsive.md) | Themes, tokens, responsive matrix, accessibility |
| [09-verification-followups.md](docs/research/09-verification-followups.md) | Read-only verification round |
| [10-apple-simplicity-patterns.md](docs/research/10-apple-simplicity-patterns.md) | Apple simplicity patterns |
| [11-home-screen-and-android-simplicity.md](docs/research/11-home-screen-and-android-simplicity.md) | Home screens, Google Photos and Drive, Material 3 |
| [12-simplicity-first-products.md](docs/research/12-simplicity-first-products.md) | Unsplash, Linear, Raycast and others |
| [14-floating-ui-themes.md](docs/research/14-floating-ui-themes.md) | Floating-UI theme concepts |
| [15-glasskit-review.md](docs/research/15-glasskit-review.md) | GlassKit library review |
| [16-api-call-minimization.md](docs/research/16-api-call-minimization.md) | Fewest API calls: strategies and caching (numbers corrected by R6) |
| [17-cross-device-sync.md](docs/research/17-cross-device-sync.md) | Folders and favorites across devices |
| [naming/](docs/research/naming/18c-name-ideas-professional.md) | Name research (18a, 18b, 18c) |

**Reviews** (`docs/reviews/`): [R1](docs/reviews/R1-research-cross-review.md) research cross-review · [R2](docs/reviews/R2-design-spec-review.md) design spec review · [R3a](docs/reviews/R3a-mockup-ux-review.md) mockup UX review · [R3b](docs/reviews/R3b-mockup-visual-a11y-review.md) visual and accessibility review · [R4](docs/reviews/R4-builder-check.md) builder check · [R5](docs/reviews/R5-final-qa.md) final QA · [R6](docs/reviews/R6-api-minimization-review.md) API minimization review · [R7](docs/reviews/R7-stack-standardization.md) stack standardization and regression evidence.

## License

[MIT](LICENSE). PixelLab is a trademark of its owners; this project is not affiliated with PixelLab.
