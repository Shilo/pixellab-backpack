# Stack standardization review — 2026-10-22

## Scope and decisions

The owner authorized architecture, dependency and version alignment across the three apps, with no design changes. Backpack keeps its root-level application layout, Svelte single-page architecture, strict TypeScript settings, existing browser target, API budget, privacy controls and production CSP.

- Pin Node.js 24.22.1 in .nvmrc and CI, and npm 11.19.1 in packageManager. The engines fields describe compatibility within Node 24/npm 11 rather than duplicating exact selectors.
- Retain Svelte 5.57.2, Vite 8.3.4, the Svelte Vite plugin 7.3.1, TypeScript 6.0.3, svelte-check 4.7.7, Vitest 4.1.12, Playwright Test 1.64.1 and idb-keyval 6.3.0. Align Node type definitions to 24.19.2. Direct package versions remain exact; Rolldown stays transitive.
- Replace the vendored GlassKit 1.27.0 stylesheet with the same version from npm. Keep all app CSS rules, accessibility overrides, distributed MIT notice and the documented cssMinify workaround. No optional GlassKit JavaScript is imported.
- Use Playwright-managed Chromium by default for a reproducible browser version; retain optional installed Edge through PLAYWRIGHT_CHANNEL=msedge. This does not establish Firefox, WebKit or real-device compatibility.
- Run a bounded CI browser smoke using three existing functional cases: key/library privacy, viewer deep-link reload, and narrow 320 px layout. Keep the complete mocked browser suite available as the local release check.

## Challenges resolved

Cross-project review rejected matching browser compilation targets to the development Node version: those are separate compatibility concerns. The existing ES2022 target remains unchanged.

Review also rejected forcing identical styling dependencies across all apps. PixelDoll retains custom CSS. Backpack's package replacement was accepted only after comparing the committed vendored stylesheet against the npm package.

The initial Windows checkout comparison differed because Git checked out CRLF line endings and npm shipped LF. Comparing the committed Git blob with the npm stylesheet proved exact byte equality. A production-build comparison then confirmed equal CSS after normalizing line endings and the explanatory vendored-to-npm comment; compiled JavaScript content had the same SHA-256. No CSS declarations or application behavior were changed.

Review challenged putting the slow complete browser suite into each CI run. The selected smoke is bounded, exercises actual user flows, and was enumerated with --list to confirm exactly three selected cases; the full suite is still required for this migration.

## Validation

| Check | Evidence |
|---|---|
| Baseline type check | OBSERVED, local: zero errors and warnings |
| Baseline unit suite | OBSERVED, local: 353 tests in 17 files passed |
| Baseline production build | OBSERVED, local: build and dist guard passed |
| Exact Node/npm versions | OBSERVED, local: 24.22.1 / 11.19.1 |
| Revised type check | OBSERVED, local: zero errors and warnings |
| Revised unit suite | OBSERVED, local: 353 tests in 17 files passed |
| Revised production build | OBSERVED, local: build and dist guard passed |
| Stylesheet provenance | VERIFIED: committed vendored CSS and npm CSS are byte-identical |
| Production style parity | OBSERVED, local: generated CSS equal after newline/comment normalization |
| Production script parity | OBSERVED, local: generated JavaScript content SHA-256 unchanged |
| CI smoke selection and execution | OBSERVED, local: exactly three existing cases selected; all three passed in managed Chromium |

## Full-suite failure investigation and final scope

OBSERVED, local: the complete managed-Chromium suite ran once with two workers: 275 passed, one desktop-only touch test was intentionally skipped, and one invalid-deep-link test failed with ERR_ABORTED at page.reload. The unchanged test reproduced against the saved original production build in four of five repetitions, confirming that the package migration did not introduce the race.

The test assigned location.hash and immediately reloaded, racing an unfinished same-document navigation. It now sets the cold-load URL synchronously with history.replaceState before reloading; all original invalid-key, unknown-key, landing-page and no-dialog assertions remain. No application code, timeout, retry or assertion was relaxed. After the fix, five desktop and five phone repetitions all passed. CI also rejects focused tests, and the full suite defaults to two workers; the smoke explicitly uses one.

Final clean-install verification used an isolated archive of commit 37743e2 with Node.js 24.22.1/npm 11.19.1: npm ci, type check (zero errors/warnings), all 353 unit tests, production build/dist guard and the three-case CI-mode smoke passed. The earlier complete run covers the unchanged 275 successful browser cases; the corrected case was rechecked separately rather than repeating the entire slow suite.

Unrelated owner edits appeared in the shared checkout during final validation. They were preserved and excluded from these commits. Production CSS/JavaScript parity measurements above describe this migration's before/after checkout, and the final clean-install result is scoped to the committed migration rather than the concurrently edited worktree.

The browser fixtures mock PixelLab; no real API key, paid generation or user artwork was needed. Browser output stays in ignored test directories. No push or deployment is part of this change.
