# 13: Phase 0 results (read-only live check)

Date: 2026-10-21. Checked by hand with a real PixelLab key during Phase 3 and Phase 4: about 21 read-only requests from a terminal, then every screen in a real browser. Nothing was created, changed or spent. This file records shapes and behaviours only: no ids, links, names, counts of the owner's art, or key material.

Questions come from the Phase 0 list in the [MVP plan](../plan/mvp-plan.md#phase-0-checks-owner-run-real-key). Sources: [Phase 3 build log](../plan/phase3-build-log.md) ("Live check") and [Phase 4 build log](../plan/phase4-build-log.md).

## Results

| Question | Result | What it means for the app |
|---|---|---|
| **Q2 List row shapes** | **Answered.** All 7 lists use the row keys and fields the adapters expect. Real answers also carry a top-level `usage` key the app does not read. Unfinished rows show statuses `processing`, `failed`, and (objects only) `review` | The adapters need no change. Everything that is not `completed` stays hidden and costs no picture request, as designed. The mock should add `usage`, `failed` and `review` rows |
| **Q3 Pictures load in the browser** | **Answered.** Character, object, UI and Tiles Pro pictures load from the image host, and real art showed on every screen in the live browser tests | The plain picture path works with no extra step. No proxy or download worker is needed |
| **Q4 Tileset helpers** | **Partly answered.** The top-down helper redirects once to the image host and the picture loads. Not recorded: the sidescroller helper, the isometric download, and the answer for a failed tileset (expected 423) | Top-down pictures are confirmed to cost one API request per tileset, once per device. If the isometric download answers directly instead of redirecting, the saved link is an API link and each isometric picture costs one API request per session. Needs the second-session check below |
| **Q5 Sort order** | **Answered.** Every list comes newest first | "Recently added" and the one-row overlap rule rest on a verified order. Mixing tilesets and tiles by date is still not planned (deep pages would reshuffle) |
| **Q1 Reads are free** | **Open.** Not recorded | Owner check: note the credit balance before and after a session |
| **Q6 Tileset overlap** | **Open.** Not recorded | If the top-down list already includes the sidescroller tilesets, the sidescroller list can go: 6 requests per open instead of 7 |

## Also learned

- Most characters carry the default state name "Idle" in a group of their own, and objects carry "base" or automatic names. The app therefore shows a state name only for a character with sibling states on this device, never for objects.
- The first live attempt answered HTTP 500 on every signed-in route, including with a made-up key, so the cause was on PixelLab's side. Later attempts worked.

## Still to do (owner)

1. Q1: balance before and after one full session; expect no change.
2. Q4: in a second session, open Tilesets & tiles and check that the Sidescroller and Isometric pictures show "Image host" in Activity.
3. Q6: compare the top-down and sidescroller lists in PixelLab, or allow one read-only key check.
4. T7: the real-key request count, below.

## T7 owner checklist: count requests in Activity

Use the production build (`npm run build`, then `npm run preview`) and a normal browser window. Open the "…" menu, then Activity. The two numbers that matter are "API requests this session" and "API requests today". Pictures from the image host are counted apart and do not count against PixelLab's API.

1. **First open.** Paste the key. Open Activity. Expect 7 API requests: one first-page request per family, the Characters one doubling as the key test. Add up to 4 more for the tileset pictures that have been on screen for 0.3 s. The log's "Hidden browser permission checks" line adds about 7 more estimated, which the browser sends on its own.
2. **Reopen within the hour.** Go home and back in the same tab, or open a new tab with "Keep me signed in" on (the log starts empty there, so read "API requests today" before and after). Expect no new list requests (a new tab without a saved key costs 1, the key test).
3. **Next day.** Open it again. Expect 7 API requests (plus a few for newly appearing tilesets). "Today" restarts from 0.
4. **Scrolling.** Each grid page you scroll to adds one request, once per device. Expect no more for pages already saved.
5. **Balance (Q1).** Note the credit balance on pixellab.ai before step 1 and after step 3. Expect no change.
6. **Second session (Q4).** In a new tab, open Tilesets & tiles. Expect the Sidescroller and Isometric pictures to appear as "Image host", not "PixelLab API". Any "PixelLab API" picture entry means that helper answers directly and costs one request each per session.

Compare the counts with the "Recommended MVP" row in the [MVP plan](../plan/mvp-plan.md#concern-2-api-load-critical). Small differences from new assets are normal; a first open far above 11 or a reopen within the hour above 0 is a bug to report with "Copy log".
