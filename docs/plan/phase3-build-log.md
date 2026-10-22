# Phase 3 build log

Written from the build ledger when Phase 3 finished (on `main`). Rulings are decisions made during the build without asking; deferred items are known small issues left for later. Plan: [phase3-plan.md](phase3-plan.md).

## Outcome

- **Built:** Search over the saved library (Recent, Go to, Recently added, results, no results), the All assets view, viewers over any screen, and the Phase 2 design fixes. Tasks 1–7, plus a Task 6b for a rule changed by live data.
- **Process:** each task was reviewed and fixed until clean. Group A (Tasks 1–4) ran in parallel, since each task owned separate files.
- **Plan challenge, before building:** 1 Critical, 7 Important and 13 Minor findings. All were applied, except two:
  - the "Rotations" picker fix was dropped, because the app's data can't reach it;
  - the All assets end line has no number, so it never disagrees with the count in the dock.
- **Heavy testing** fixed 7 bugs, each with a regression test. Each test failed before its fix.
  - On All assets, → at the end of a partly saved family skipped to the next family. It now loads that family's next page.
  - Info's "Open in PixelLab" button was taller than the mockup's.
  - On phone, the search field's padding cut off the placeholder.
  - During a 429 pause the search said "No matches".
  - Back didn't close a search opened over an old search history entry.
  - Enter and Esc while typing with a Japanese or Chinese input method left the field.
  - A long query with no spaces scrolled sideways.
- **Challenge review:** 0 Critical, 2 Important and 9 Minor findings.
  - I pushed back on two findings, and the reviewer agreed:
    - no extra guard on the temporary debug hook;
    - Go to pictures keep the home tile's budget rule.
  - The 2 Important fixes:
    - Go to from a scrolled grid sent list requests;
    - failures and pauses were silent while searching.
  - The re-review verified every fix and found no regressions.
- **Also found and fixed:**
  - Glass panels had no blur in Chromium since the MVP. Vite 8's CSS minifier merged `backdrop-filter` into its `-webkit-` twin. Fixed with `cssMinify: false`, and verified in Edge: computed `blur(24px)`, where it had been `none`.
  - Jumping straight to the bottom of a grid never loaded the families it skipped.

## Live check (owner's key, read-only)

The owner gave an API key for testing. It was used only for read-only GET requests from the terminal (about 21 in total), was never written to a tracked file, and was never typed into a page. A temporary debug hook signs in from a git-ignored `.env` on the dev server only; it is removed after the owner's live browser test.

- **First attempt:** every signed-in route answered HTTP 500. A made-up key got the same answer, so the problem was on PixelLab's side. Later attempts succeeded.
- **List shapes:** all 7 lists use the row keys and fields the adapters expect, and every list comes newest first. This settles the plan's "Recently added" risk and MVP Phase 0 Q5.
- **Details:**
  - The character, object and Tiles Pro detail answers match the adapters.
  - The tileset picture helper redirects once to the image host.
  - Statuses seen: completed, failed, and review (objects). Everything not completed stays hidden, as designed.
- **Ruling changed by live data (R6):** most characters carry the default state "Idle" in a group of their own, and objects carry "base" or automatic names. A state name is now shown and matched only for a character with sibling states on this device, and never for objects.

## Live browser test (owner's key, real browser)

The controller ran the app on the dev server with the dev-only debug sign-in. It shot every screen in a headed (visible) Edge window at 1440×900 and 390×844, compared each with the mockups, and clicked through the flows in the built-in browser. Search → result → Esc → Esc, Back and focus return all worked live. The fixes below went in with regression tests where meaningful, and the full suite was green afterwards (236 of 236).

- **Native scrollbars:** real desktop browsers showed light native scrollbars that clashed with the dark glass: on the home page edge, the grid, inside the Settings sheet (outside its rounded corners), the Info panel and the search panel. Headless screenshots hide them. Now every scroller gets a thin dark bar kept inside rounded sheets. Home itself never needed to scroll: its bottom padding was 160 px too tall.
- **Long names:** real PixelLab names are long prompts, so every search label was cut off before the matched words. Search results now show the part of the name around the first match ("…pixel-art **forest** ranger…"). Grid cells and screen-reader names are unchanged.
- **Info footer:** the "Open in PixelLab" button didn't line up with the column above it.
- **Keyboard scrolling:** after a click on blank panel space, the keys didn't scroll the results. The inner scroller now takes focus.
- **Link text:** Svelte 5 drops a leading space, so six external links read "Fonts↗(opens in a new tab)". One shared suffix now has its space.
- **Noted for Phase 4:** next pages wait behind costly picture requests in the shared queue. A jump to the bottom of a big family can take several jumps and about 15 s before "That's everything" shows.

## Rulings made during the build

- **Commits:** builders didn't commit. The controller committed each task after its review, because parallel agents shared one working tree.
- **Jump to the bottom:** at the last row of a grid, every family in its scope gets its next page, at most one page per family scrolled past.
- **Browser test runs:** only one agent runs Playwright at a time. Runs share port 4173 and rebuild `dist/`, so two at once break each other.
- **Workers:** final test runs use `--workers=2` while other apps keep the machine busy.
- **Task 7 review:** Task 7 only added tests, so its review was folded into the whole-phase challenge review.
- **State names in details:** the viewer subtitle and Info's State row keep the raw state name, since those are asset details. The mockup shows "Character · Base".
- **R1 from the repeat run:** a costly picture request that seemed to be sent twice was a test-timing problem, not an app bug. No code path cancels a costly request once it's sent, and a deliberately broken build reproduced the exact failure. The test now waits for every on-screen picture before counting.

## Deferred (minor)

- The search shows no hint about a failed family while searching, though the notice comes back when it closes.
- A viewer opened from Recently added steps through the screen's order rather than the 6 cells (consistent with R8).
- Names are cut at 60 characters (an MVP rule), so later words can't be found.
- Minor test gaps:
  - no lone "Idle" character in the mock;
  - no test for `states()` after a next page loads;
  - no test for a viewer opened from another screen.
- Activity and the More menu close on Esc without `preventDefault`. Two things could close at once, but only by typing `#activity` in the address bar while searching.
- Owner-run check (real phones, search keyboard): moved to the roadmap's [What the owner needs to do](roadmap.md#what-the-owner-needs-to-do).
