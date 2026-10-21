# Phase 4 build log

Written from the build ledger when Phase 4 finished (on `main`). Rulings are decisions made during the build without asking; deferred items are known small issues left for later. Plan: [phase4-plan.md](phase4-plan.md).

## Outcome

- **Built:** favorites and folders stored on this device with zero API requests:
  - the org store with checked loads and atomic cross-tab writes, plus card snapshots;
  - the Favorites tile and grid, and folder tiles with the folder overlay, rename and delete;
  - the viewer ♡ and heart badges on cells;
  - the card menu (right-click, Shift+F10 or the menu key, and a 500 ms long press);
  - Add to folder, from cells and from the viewer's "…";
  - Favorites and folder rows in the search's Go to.
- **Also built:** next pages now go ahead of costly pictures in the request queue (R14). The temporary dev-only debug sign-in was removed after the live test.
- **Process:** Tasks 1–11 were each reviewed and fixed until clean. Group A ran in parallel; Groups B and E ran two tasks at once on separate files, with one Playwright run at a time.
- **Plan challenge, before building:** 12 Important and 10 Minor findings. All were applied. Two of them were ruled as follows:
  - one cell per character group, a recorded deviation from mockup 09;
  - wiping on an account switch, with the data-loss risk stated plainly in the plan.
- **Review fixes worth knowing:**
  - Two tabs could save the same folder name, and the next load dropped one folder with its items. The name is now re-checked inside the write.
  - Favorites could show a stale snapshot, or two cells for one character group. `pick` now resolves through the group.
  - Repeated identical announcements were silent. Now each one is read again.
  - A snapshot-only character state couldn't be un-favorited. The new `groupKeys` covers it.
  - The viewer's `aria-modal` hid the live region from VoiceOver.
  - A folder deleted in another tab under an open viewer stranded the tab.
- **Task 10 headed check found and fixed:**
  - Select showed on empty Favorites.
  - The folder "…" dimmed the overlay twice.
  - "Remove them" was 40 px tall on phone, under the 44 px minimum.
  - Rows stuck out of the rounded sheets.
  - The card menu sometimes didn't reopen right after Esc.
- **Heavy testing** fixed 6 bugs, each with a test that failed first:
  - Focus stayed on `<body>` after a route change; it now goes to the screen heading, never behind a viewer.
  - Unfavoriting from the menu in Favorites lost focus.
  - Forget key in another tab left this tab's card menu open over the key screen, a privacy leak.
  - A favorited character state deleted in PixelLab still showed as favorited.
  - Back with a search result's menu open left the menu open.
  - A count read "1 assets".
- **Challenge review:** 0 Critical, 0 Important and 11 Minor findings.
  - I proposed my own approach for two items, and the reviewer agreed:
    - C7: a Risks note instead of a code change, because a re-read on `key-changed` would run before the wipe;
    - C6: keep writing `at` but stop requiring it on load.
  - Every agreed fix landed:
    - never overwrite a saved record from another version;
    - reload org after an account switch;
    - one repeat-safe `say()` for announcements;
    - singular and empty copy fixed;
    - one shared sheet grip;
    - no Select flicker in category docks.
- **Live browser test (owner's key):** headed Edge at 1440×900 and 390×844 on the dev server with the dev-only sign-in.
  - Checked on real art: favorites (♡ and the card menu), Add to folder, folder creation, the Favorites grid, the folder overlay and its "…", Go to rows, and Forget key followed by signing in again (everything wiped, a clean start).
  - One defect fixed: a double divider between Rename and Delete in the folder menu.
- **Final verification after removing the debug sign-in:**
  - `npm run check`: 0 errors. Unit tests: 299 passed. The build works, and the key is not in the production build.
  - Full browser suite, run twice over: 637 passed and 2 skipped (the phone-only long-press test). One test failed once: `t12-edges.spec.ts:245`.
- **That intermittent failure:** about 2 in 20 runs, so not machine load. A debugger traced it to a race in the test, not the app, and it predates Phase 4.
  - **Cause:** the test stopped scrolling once "That's everything" appeared, but the last characters page could land between its scroll and its check. The grid only draws rows on screen, so the cell it then waited for never existed.
  - **Proof:** forcing that timing failed 6 of 6 runs on Phase 4 and 4 of 4 on the pre-Phase-4 build.
  - **Fix:** one more scroll after loading finishes. It now passes 20 of 20 runs twice and 6 of 6 forced runs, and the full suite passes 319 with 1 skip.

## Rulings made during the build

- **Commits and test runs:** builders didn't commit, and only one agent ran Playwright at a time. Runs used `--workers=2` while other apps kept the machine busy.
- **No second visibility listener in the library:** the org store already re-reads when a tab is shown.
- **Copy added to R12:** "Couldn't save. Try again." and "The asset in it stays in your library."
- **Asset details:** the viewer subtitle and Info keep raw state names. Typing in the search also matches the Favorites row by its label.
- **Folder overlay title position:** a deliberate fit for tall content; it centres the way mockup 09 does when the content is short.
- **Unfinished assets can't enter folders:** only done cards reach cells, the viewer and the menu.
- **Small diffs:** a trivial two-line diff (Task 3) got the controller's review instead of a separate reviewer.

## Deferred (minor)

- The 10 px long-press move tolerance has no test of its own; Chromium cancels the press through `pointercancel` first.
- A write can land just after another tab's Forget key (a timing gap in the design).
- An open check still running during a reconnect with another key can leave favorites unloaded until a reload.
- A tab still showing account 1 can save a fresh account-1 snapshot into account 2's store if the user favorites there (see Risks).
- The folder "…" menu has no arrow keys, like the other "…" menus.
- `Activity` and `MoreMenu` close on Esc without `preventDefault` (from Phase 3).
- Owner-run checks:
  - on a real iPhone and Android phone, a long press opens the card menu with no system link preview, and a short tap opens the viewer;
  - sheets sit above the home indicator;
  - Phase 3's search keyboard check.

## Leftovers sweep (after Phase 4)

A review of every plan, build log and doc found 39 actionable leftovers, 10 owner-only items and 26 already resolved. The fixes ran as separate tasks on separate files, each reviewed:

- **README:** rewritten to match the built app. It now links only committed files (it had 31 links into git-ignored mockups), and no longer claims features that aren't built.
- **Search:** it now matches and shows the full name. Real names are long prompts, and words past the 60-character cut couldn't be found. The cut stays in place for the picture cache, so nothing is re-requested. Info's tag chips now use one trimmed list.
- **Network and Activity:**
  - A failed save while replacing a kept key no longer leaves the old key saved.
  - Signing in waits for a check already running, then reloads favorites and folders; an older check stops if the key changed.
  - Activity's hidden-request estimate counts each request once.
  - Esc in Activity closes only Activity.
  - The licence file now has the full Apache-2.0 text.
  - The unused modulepreload polyfill is gone.
- **Keyboard:** ↑/↓/Home/End work in the "…" menus, the arrow keys move around the direction rose, and the More menu's Esc stays contained.
- **Tests:** the mock now uses real PixelLab shapes (B12): the `usage` key, failed and review rows, "Idle" and "base" state names, and newest-first lists, so the Recently added order is now tested. A new check confirms the production CSP never blocks the app. No request count changed.
- **Plan docs:** the Phase 0 results are recorded in [research 13](../research/13-phase0-results.md), the T7 owner checklist is written, and stale statuses are fixed.
- **Still open (owner-only):**
  - real-phone checks;
  - rotating the API key used in testing, and deleting the git-ignored `.env`;
  - deciding repo visibility (the committed mockup assets include real art);
  - the PixelLab questions Q1, Q4 and Q6, and the T7 counts.
- **Final verification of the sweep:** `npm run check` 0 errors, 311 unit tests, build OK. The first full double run had 5 failures, all test timing races exposed by heavy machine load, not app bugs. In each case the test now waits for the requests it owns; no count was loosened.
  - A count that started before the home's last paced picture request.
  - A test that held both request slots.
  - A second Esc that came before the viewer closed.
  - A crispness probe that measured a canvas before it was sized.
  - **Result:** after the fixes, the full suite run twice over passed 658, with 2 skipped (the phone-only test) and 0 failed.
