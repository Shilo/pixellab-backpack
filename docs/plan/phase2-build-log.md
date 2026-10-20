# Phase 2 build log

Copied from the build ledger when Phase 2 finished (branch `mvp`). Rulings are decisions made during the build without asking; deferred items are known small issues left for later. Plan: [phase2-plan.md](phase2-plan.md).

## Outcome

- All 10 tasks built, each reviewed and fixed until clean.
- **Heavy testing** (commit 3dea88f) found and fixed 4 bugs:
  - a failed first check was never retried;
  - Try again was blocked by requests waiting to retry;
  - a double Esc on `#activity` went back two pages;
  - three phone buttons were under 44 px tall.
- **Challenge review** reported 0 Critical, 4 Important and 17 Minor findings. The controller accepted some, challenged others and debated until both sides agreed on one fix list (below). Three fix rounds followed (37d1dc6, 9965346, 8013ebc).
- The final re-review verdict at 8013ebc was "Ready to merge".
- Final verification:
  - `npm run check`: 0 errors.
  - Unit tests: 230/230.
  - Build: OK.
  - Playwright `--repeat-each=3`: 414/414, 0 flaky.

## Agreed challenge fixes

- C1: one BroadcastChannel (named from APP_ID) replaces the `storage` listener. Messages: 'signed-out' (posted by forget(); every tab, kept or tab-only, clears its key and in-memory library and shows the plain key screen, no "Reconnect" copy) and payloadless 'key-changed' (posted when keep-signed-in is turned on/off or the saved key is replaced; a kept tab re-reads localStorage inside http.ts and takes the new key or signs out). Never put the key in a message. A tab receiving a message must not post one back. Fixes open bug 2 (C9). e2e: two tab-only tabs — Forget in one signs out the other; a Refresh in the other then writes nothing back to the device.
- C2: the viewer's Try again first lifts the stop (`library.retry()`, or `keepLoading()` when paused), then re-runs; Try again reappears once back online. e2e: recovers after three 503s.
- C3: validate saved data on load — family: `cards` is an array, `total` and `checkedAt` are numbers; each card: `key`, `fp` strings, `done` boolean, `meta` object. One bad card drops that family's saved copy (re-checked next). Same in loadDetail: `fp` string and `detail.animations` array, else treat as missing. No new saved fields; keep the one-time wipe. Unit test: a card without meta loads as missing.
- C4: zoom steps by device scale in both directions; steps below Fit are reachable; each button disabled at its limit; matches docs/design/02-ux-spec.md §6.3. Unit tests + an e2e at a real window size (1440×900 and 390×844) with 16 px and 32 px art.
- C11: 30 s timeout per attempt (AbortSignal.timeout) on API and image-host fetches; counts as a retryable network failure (caps, backoff, 3-failure stop).
- C20: Settings closes only when the click lands outside the sheet's box.
- Licences: add the Svelte runtime notice (MIT) to public/licenses.txt.
- IMAGE_HOST: export from http.ts and use it in library.svelte.ts.
- clampFps: Infinity clamps to 30.
- Router: add the `ponytail:` comment on the `pushed` flag.
- Round 2: N1 (the viewer's Try again cancelled the 429 pause) and the same guard in the app's Try again; N2–N4 minors.
- Round 3: R1 (a broken costly picture was re-requested on every view). The fix is at the root: real "no picture" answers throw `HttpError` of kind `'http'`, and the cache drops only temporary failures. The key screen's Try again now respects the pause too.

## Ledger

Branch: mvp (Phase 2 starts at 11b93a7)
Ruling: implementers do not commit; the controller commits each task after its review (parallel agents share one tree) — cost if wrong: none
Ruling: parallel groups A–E per the plan; tasks inside a group own disjoint files — cost if wrong: overlap fixed in review

## Progress
Task 2: review spec ✅ quality needs fixes (1 Important: failed sessionStorage write leaves key in localStorage) → fix round 1 dispatched
Ruling: Forget must clear the key in other open tabs too (storage event) — otherwise a second tab can write a forgotten key back — cost if wrong: a few lines
Task 3: review spec ✅ quality needs fixes (1 Important: Activity over viewer breaks closeViewer/Back) → fix round 1 dispatched
Ruling: zoom label rounds to one decimal ('Fit · 3×'/'3.1×'), never '3.05×'; zoomStep and zoomLabel both take k (device px per art px) — cost if wrong: label wording only
Task 3: minor (deferred): replaceViewer accepts keyless route; clampFps(Infinity) → 8; pushed heuristic lacks ponytail comment
Task 2: fix round 1/5 (2 addressed, 0 open; commits 760104a..47088a9)
Task 2: complete (commits 11b93a7..6ea68d8 + 760104a..47088a9, review clean)
Task 2: minor (deferred): turning Keep off signs out other kept tabs (accepted: safer); narrow re-enable race loses a new key; replace branch doesn't clear key-lost; failed localStorage write in setKey leaves old kept key
Task 3: fix round 1/5 (2 addressed, 0 open; commits 47088a9..db7d5ba)
Task 3: complete (commits 6ea68d8..760104a + 47088a9..db7d5ba, review clean)
Task 3: minor (deferred, fix in challenge wave): closeActivity should set router.activity=false before history.back() (double Escape pops two entries); router test leaks globals on failure
Task 9 carry: the viewer's scroll parent must be the scroller and must not clip the zoomed PixelArt box (overflow visible); frame timing verified only by Task 9 e2e
Task 1: complete (commits db7d5ba..aac86bb, review clean)
Task 1: minor (deferred): see task-1-review.md (4 items); carry: Task 6 must never display meta.group_id; Task 4 passes family ids to loadFamilies (library.svelte.ts:173)
Task 5: review spec ✅ quality needs fixes (2 Important: player drift slows playback; single-blob cells keep ImageBitmaps alive) → fix round 1 dispatched (+ Promise.all bitmap leak)
Task 5: minor (deferred): draw error leaves frame blank; onmeasure needs stable callback (Task 8/9); reduced motion checked only in load
Task 5: fix round 1/5 (3 addressed, 0 open; commits 788df55..ebb695c)
Task 5: complete (commits aac86bb..788df55 + 788df55..ebb695c, review clean)
Task 6: complete (commits ebb695c..bb70571, review clean)
Task 6: minor (deferred): loading row index; untrimmed tag chips; sidescroller Terrain casing; 'Included' casing; same() needs string created_at; stacking breakpoint uses viewport; loading-row untested
Task 9 carry: InfoPanel z-index vs top bar; Esc stopPropagation vs viewer Esc; focus return; side panel vs Info toggle
Ruling: home URL is normalized to '#/' on load when the hash is empty (router replaceState) so history back from Activity lands on '#/' — fixes the t6 e2e expectation at the source; assigned to Task 9 (screen wiring owns router integration) — cost if wrong: one line
Task 9 carry: switch CategoryGrid to library.items(); router normalizes empty hash to '#/' on load; t6 e2e line 66 must pass
Task 4: review spec ✅ quality needs fixes (2 Important: kept flag desync after 401; forget hides wipe failure) → fix round 1 dispatched (+ picture() host check); Task 7 told to show the forget error
Task 9 carry: viewer Esc must be a bubble-phase listener (AnimPicker/ViewerMenu stop Esc in capture); AnimPicker renders its chip; check popover/sheet visuals in screenshots
Task 8: complete (commits 815c6f0..424b713, review clean)
Task 8: minor (deferred → challenge wave): picker lists Rotations when none exist; 'Name · 0f' for direction-less set; ViewerMenu opener from activeElement (Task 9 should pass opener); duplicated Esc/focus/backdrop code across menus; no focus trap/aria-modal; rose radio lacks arrow keys; defaultAnim null-type untested
Task 4: fix round 1/5 (3 addressed, 0 open; commits 424b713..07fbec8)
Task 4: complete (commits bb70571..815c6f0 + 424b713..07fbec8, review clean)
Task 4: minor (deferred): image-host name duplicated from http.ts IMAGE_HOST (export it in challenge wave)
Task 7: complete (commits 07fbec8..3c4a69a, review clean)
Task 7: minor (deferred → challenge wave): backdrop click fires on sheet padding; forget rejection branch untested; no busy guard on Forget; licenses.txt omits Svelte runtime
Task 9: review spec ❌ quality needs fixes (3 Important: focus return after state switch; touch-action none blocks pinch-zoom; aborted costly art re-requested) → fix round 1 dispatched
Task 10: complete (commits e363a1a..77ae67a, review clean)
Task 10: minor (deferred): three-press test timing-sensitive on slow CI; hash regex accepts UUID shape (ids() guard covers); state-button locator assumes 2 states; no single-press <0.3 s test
Task 9: fix round 1/5 (3 addressed, 0 open; commits 77ae67a..501e0bf)
Task 9: complete (commits 3c4a69a..e363a1a + 77ae67a..501e0bf, review clean)
Task 9: minor (deferred): Info 'Open in PixelLab' button light gray vs mockup dark outline; rose arrow keys (from Task 8)
All 10 tasks complete. Next: heavy testing, then challenge review.
Heavy testing: complete (commit 3dea88f): 4 bugs fixed (failed first check never retried; Try again blocked by retry-waiting requests; double Esc on #activity; 3 targets <44px); open: zoom + enabled above 16×, wrong copy in second tab after Forget, hanging request joins old check
Challenge review: 0 Critical, 4 Important (C1 Forget leaves tab-only tabs connected; C2 viewer Try again dead; C3 saved card w/o meta crashes; C4 zoom broken for small art), 17 Minor. Controller accepted C2, C4, 5 minors; challenged C1 (single mechanism), C3 (validate-on-load instead of stamping), C11 (timeout value/semantics) — awaiting reviewer reply
Debate concluded: agreed fix list in agreed-fixes.md (C1 single channel incl. payloadless key-changed; C3 validate-on-load incl. details; C11 30 s timeout incl. image host; + C2, C4, C20, licences, IMAGE_HOST, clampFps, ponytail comment)
Challenge fixes: committed 37d1dc6 (unit 226, e2e 134, repeat-3 402 green). Ruling: no AbortSignal.any fallback — 05-architecture's browser floor (Safari 17.5+, Chrome 123+, Firefox 125+) already supports it — cost if wrong: older browsers hang a request
Challenge re-review: all 10 addressed; new N1 Important (viewer Try again cancels the 429 pause) + N2–N4 Minor. Ruling: fix N1 (+ same guard in App.tryAgain) and N2–N4 now — each is a line or two and N3 leaves pictures blank for a session — cost if wrong: none
Challenge round 2 verified: N1, N2, N4 addressed; N3 regression R1 (costly 404 re-requested) + KeyScreen Try again cancels 429 pause. Ruling: fix R1 at the root (families.ts throws HttpError kind 'http' for real no-picture answers; cache drops only transient failures) instead of the reviewer's multi-clause condition — clearer error classification — cost if wrong: small refactor. Round 3 dispatched
Challenge round 3 verified at 8013ebc: all addressed, verdict "Ready to merge". Final pass: check 0 errors, unit 230, build OK, e2e --repeat-each=3 414/414.
