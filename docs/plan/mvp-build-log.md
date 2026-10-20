# MVP build log

Copied from the build ledger when the MVP finished (branch mvp). Rulings are decisions made during the build without asking; deferred items are known small issues left for later.


Branch: mvp (from main @ 45fccae). Tasks use the plan's IDs (B1–B14, T1–T7).

## Preflight scan
| Pair / task | Shared file or interface | Finding |
|---|---|---|
| B2 ↔ B13 | http.ts counters | B13 reads counters/events from http.ts; B2 must expose an activity event stream (onActivity) — added to B2 brief |
| B3 ↔ B11 | families.ts art() | B11 implements costly art inside families.ts; B3 builds the adapter with art() for cheap families and stubs for costly ones |
| B6 ↔ B14 | Dock.svelte | B6 builds Dock with inert buttons; B14 makes "…" open a 2-item menu |
| B7 ↔ B14 | library.openCheck | B14 needs a force option (refresh) with 60 s cooldown — added to B7 brief |
| B9/B10 ↔ B5 | PixelArt.svelte | consumers only |
| T6 | request counts | "first open = 7 (+ up to 4 tileset helpers)" consistent with plan concern 2 |
| B1 | test that only http.ts calls fetch | consistent with layering rules |

Ruling: implementers do not commit; the controller commits each task after its review — parallel agents share one working tree and concurrent commits would race on the git index — cost if wrong: commit granularity is per task anyway, little lost.
Ruling: run independent [P] tasks in parallel despite the skill's sequential default — the owner explicitly asked for multiple subagents and each [P] task owns disjoint files — cost if wrong: occasional overlap fixed in review.
Ruling: no "### Task N" headings exist in the plan, so the controller writes task briefs by hand (task-<ID>-brief.md) from the plan's to-do list and interfaces — cost if wrong: a brief could miss plan text; mitigated by pointing each brief at the plan sections.
Ruling: no real API key is available; all build/test uses synthetic fixtures shaped like research 01 and the live OpenAPI; B12 and T7 stay owner-run — cost if wrong: field-name mismatches surface in Phase 0.

## Progress
Ruling: approve dev dependency @types/node — needed by vite.config.ts and the layering test for node:fs/path; dev-only, no runtime cost — cost if wrong: none
Ruling: Playwright uses the installed Edge channel (msedge) instead of downloading Chromium — avoids a browser download; CI needs Edge or 'npx playwright install msedge' — cost if wrong: CI setup step
Task B1: complete (commits 45fccae..909d6a1, review clean)
Task B1: minor (deferred): layering fetch regex matches comments/.fetch; node types apply to all src; 05 §10.2 modulePreload.polyfill:false + CSP-violation e2e check not applied; msedge channel needs Edge on CI
Ruling: controller added src/lib/types.ts (Card, FamilyState, Page, FamilyId) as the shared contract before the parallel batch — B3 and B4 both need Card and would otherwise race to define it — cost if wrong: one small file to adjust
Ruling: families.ts takes an injected Transport (createFamilies(t)) instead of importing http.ts — http.ts is built in parallel and injection keeps adapters testable — cost if wrong: one wiring line in library.svelte.ts
Ruling: B11's adapter half (costly art resolution) moves into B3; B10 keeps the 0.3 s dwell — both live in families.ts and splitting them would mean two agents editing one file — cost if wrong: none
Batch 2 BASE: (see next line)
2f43da5
Task B4: dropExpiredDeep got optional pageSize param (default 100); library must pass 50 for tilesets-side/tiles-pro — carried into B7
Task B5: complete (commits 2f43da5..e4a3dc0, review clean)
Task B5: minor (deferred): PixelArt success-handler errors unhandled (bmp not closed); createImageBitmap should use colorSpaceConversion:'none'; non-fill art below CSS size at fractional dpr; trimBox bare-alpha path unused
Task B5: ⚠️ resolved by controller: fractional-dpr crispness to be checked visually in the screens/e2e step; fill semantics (default = native cap, fill = grow) accepted — thumbnails pass fill
Task B4: review spec ✅ quality approved with 1 Important (dropExpiredDeep pageSize default) → fix round 1 dispatched to original implementer
Task B4: minor (deferred): store.test.ts:255 order-dependent; no test for prepend + in-place change on shifted row, or short-saved-cards guard check.ts:35
Task B7 carry: pass pageSize 50 for tilesets-side/tiles-pro; pass $state.snapshot(...) to saveFamily (IndexedDB can't clone proxies)
Ruling: Card.fp is computed once from the list row and never recomputed after art() resolves a picture; the library stores the resolved thumb on the saved card but compares only fp, and keeps the saved card objects when fp matches — otherwise costly families would look changed on every check — cost if wrong: one extra reload per family
Task B3: unverified helper paths for sidescroller (/mcp/sidescroller-tilesets/{id}/image) and isometric download — to confirm in Phase 0 / B12
Task B4: fix round 1/5 (1 addressed, 0 open; commits 581f1fd..3aed3db)
Task B4: complete (commits e4a3dc0..3aed3db, review clean)
Task B3: complete (commits 13de560..581f1fd, review clean)
Task B3: minor (deferred): helper URLs don't encodeURIComponent the id; name slice(0,60) can cut surrogate pairs; isometric thumb is the API /download URL (costs an API call per session unless the blob is kept); any status other than 'completed' hides the asset
Task B3: ⚠️ publicGet host allowlist — verify in B2 review; fingerprint comparison — covered by ruling carried into B7
Task B6: review spec ✅ quality changes needed (1 Important: CATEGORIES duplicated router vs families) → fix round 1 dispatched to original implementer
Task B6: minor (deferred): Select accessible name 'Select Select, coming soon'; unused .mosaic/.cell CSS until B9/B10; nav aria-label repeats Library; smoke.spec hardcodes localhost:4173
Task B6: fix round 1/5 (1 addressed, 0 open; commits 1288d9b..edcfc71)
Task B6: complete (commits 3aed3db..edcfc71 excluding B2's 1288d9b, review clean)
Task B6: minor (deferred): families.ts CATEGORIES re-export only serves tests; mvp-plan.md:350/:397 still say CATEGORIES lives in families.ts (doc update at the end)
Task B2: review spec ❌ quality changes needed (3 Important: online TypeError marked blocked w/o retry or failure count; Keep-loading allowance never expires for daily users; daily cap checked once before send loop) → fix round 1 dispatched to original implementer
Task B2: fix round 1/5 (3 addressed, 1 new open — status flips to ok while halted; commits edcfc71..49aeb97)
Task B2: fix round 2/5 (1 addressed, 0 open; commits 49aeb97..bd8f7cc)
Task B2: complete (commits b80f7f3..bd8f7cc, review clean)
Task B2: deferred (Important, out of scope of fix diffs): halted-implies-not-ok invariant still unguarded at http.ts:418 (online listener) and http.ts:66 (setKey clearing key-lost); netError/401 paths overwrite status while halted — Ruling: carry into the final-review fix wave rather than a 3rd round — same small edit, and the re-reviewer flagged it outside the fix diff — cost if wrong: a rare outage path shows 'ok' until then
Task B2: minor (deferred): see task-B2-review.md minors
Ruling: applyCheck dropping resolved costly-art thumbs when a list fits on page 0 is fixed at the root in check.ts (keep saved card objects whose key+fp match in every replace path) and the library's keep() workaround is removed — one rule in one place — cost if wrong: small refactor
Ruling: families.ts labels page 0 "first page" so the library's label-renaming wrapper can go — cost if wrong: none
Ruling: library exposes a reactive hasKey so App can choose KeyScreen without importing lib/api — cost if wrong: none
Task B7: review spec ✅ quality changes needed (3 Important: applyCheck replace paths drop thumbs → fix in check.ts + remove keep(); label wrapper → families.ts; missing reactive hasKey) → fix round 1 dispatched to original implementer
Task B7: minor (deferred): see task-B7-review.md (account check skipped when saved Characters empty; two tabs can overwrite saved thumbs; +4)
Ruling: Activity.svelte may import onActivity/getCounters from http.ts (read-only) — it is the developer view of the network module and routing them through library adds pass-through code — cost if wrong: one layering exception, documented
Task B7: fix round 1/5 (3 addressed, 0 open; commits a68f0d4..4be76c6)
Task B7: complete (commits bd8f7cc..4be76c6, review clean)
Task B9: review spec ❌ (1 Important: empty state shows when all family requests failed) → fix round 1 dispatched
Task B9: minor (deferred): empty-card button order/sync icon vs mockup; uniform 2x2 mosaic (allowed)
Task B13: review spec ✅ quality needs fixes (2 Important: menu focus lands on disabled Refresh; tests only static) → fix round 1 dispatched
Task B13: minor (deferred): preflight estimate counts picture/cap/cancelled entries; each key uses index; cancelled styled as warning; Refresh says 'Checked a moment ago' on no-op; no aria-modal/Tab trap/arrow keys
Task B9: fix round 1/5 (1 addressed, 0 open; commits c650e18..aabd2b8)
Task B9: complete (commits 4be76c6..aabd2b8 excluding B13's c650e18, review clean)
Task B8: review spec ❌ (1 Important: autocomplete off / no hidden username vs D14) → fix round 1 dispatched
Task B8: deferred to final fix wave: library.connect maps 429/5xx to 'blocked' (should be a 'server' failure with Try again, not 'PixelLab is blocking this browser')
Task B10: review spec ❌ (1 Important: dueFamilies loads off-screen families) → fix round 1 dispatched
Ruling: promote B10 minor 'grid stops asking for page 2 after a shift-reload with unchanged total' into fix round 1 — it stalls browsing until reopen — cost if wrong: small extra change
Task B10: minor (deferred): other minors in task-B10-review.md
Task B8: fix round 1/5 (1 addressed, 0 open; commits 01103b4..93ddfe3)
Task B8: complete (commits aabd2b8..93ddfe3 excluding B10's 01103b4, review clean)
Task B8: deferred to final fix wave: KeyScreen shows Welcome-back copy after a mid-session 401
Task B13: fix round 1/5 (2 addressed, 0 open; commits 93ddfe3..4ec03c8)
Task B13: complete (commits 6cf0d8c..c650e18 + 93ddfe3..4ec03c8, review clean)
Task B13: minor (deferred): Activity menu-item/Copy/refresh click wiring untested (no DOM env); preflight estimate still counts '· picture' entries
Task B10: fix round 1/5 (2 addressed, 0 open; commits 4ec03c8..d61a328)
Task B10: complete (commits 9ab6a24..01103b4 + 4ec03c8..d61a328, review clean)
Task B10: minor (deferred): given-up family stays given up until growth/reopen; retry rule untested (no pure helper)
Task B11: complete — adapter half in B3, dwell half in B10 (per ruling)
Task integration (B6-B14 wiring + T4-T6): complete (commits d61a328..036141b; e2e 36/36 x3, unit 131)
Integration note: one unmocked GET reached the real image host during debugging (no key, fake path, 404); mock now catches redirects via CDP
Integration deferred: 'reload = 0' depends on tileset helpers answering 302 to the image host — confirm in Phase 0; e2e gaps: all-failed card, empty category, mid-session slowed/stopped/blocked, focus after Activity
Final review: 0 Critical, 6 Important, 13 Minor (final-review.md)
Ruling: I4 (UX-7 no-cors probe) is dropped for the MVP — the probe costs an extra request and a browser can't reliably tell a CORS block from an outage; instead, an online failure after retries shows softer copy "Can't reach PixelLab right now. [Try again]" (the full-screen 'blocked' state keeps the mockup layout with that copy) — cost if wrong: users behind a real CORS block see a generic message
Ruling: one final fix wave covers I1, I2, I3 (+ M3 Welcome-back after mid-session 401), I5, I6 and M4 (encodeURIComponent) — the review's fix-before-merge list plus the cheap bundled item — cost if wrong: none
Final fix wave: complete (036141b..188d333, re-review clean); flaky T5 root-caused to http.ts wake() timer firing early — fixed + unit test; verified 144 unit, 44 e2e, T5 x10 = 100 passed
