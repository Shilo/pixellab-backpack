# R6 — Review: API-call minimization (research 16)

Status: 2026-10-19. Role: skeptical reviewer. Scope: [research 16](../research/16-api-call-minimization.md) and its calculator, checked against research [01](../research/01-pixellab-api-asset-inventory.md), [02](../research/02-browser-integration-and-security.md), [09](../research/09-verification-followups.md), [17](../research/17-cross-device-sync.md), design [05](../design/05-architecture.md) §4–6 and design [08](../design/08-simplicity-redesign.md) §12. MVP = API-key screen, home category tiles, category grids. No viewer, search, settings, folders or favorites yet.

## Verdict

**The direction is right. The numbers are too rosy, and two parts are not safe for the MVP as written.**

What research 16 gets right, and what this review keeps:
- The home check and the mosaic come from the same list call.
- No balance call.
- No background prefetch and no polling.
- Lists and art are kept on the device, and the app does not check again within an hour.
- Art loads only for cards on screen.
- Never use the `?inline=true` tileset helper for thumbnails.

What has to change:

1. **The headline "9 calls per open" leaves out real requests.**
   - Design 05 sends one authenticated `tools/list` before any MCP call, in every session. That is a large response (about 218 KB even without auth). Research 16 does not count it.
   - Each open also sends 8 CORS preflights to the same API server. The doc counts them separately and leaves them out of the headline.
   - The honest figure for strategy D is **10 calls + 8 preflights = 18 requests per open**, not 9.
2. **The numbers assume a device cache that the default settings turn off.** The default key mode is "This session only" (02 §5.3). Under decision D15, the library cache follows the key mode. So by default, **every session is a first open**: 18 calls instead of 10, and Creator image thumbnails are fetched again in every session, not once per device. Over 30 days that is **540 calls, not 278**.
3. **Hand-built CDN URLs are fine technically but should not be in the MVP without PixelLab's OK.** They work: today's tests also covered the *oldest* tilesets and Tiles Pro. But they break the project's own rule to use only documented routes (02 §7). Use the documented helper once per tileset, save the URL it redirects to, and switch to derived URLs only if PixelLab says yes.
4. **Creator images and maps should not be in the MVP.** `get_image` is annotated as not read-only and is gated off until check P0-9 passes. `view_map` is a server-side render. The MVP has no viewer, so "placeholder until opened" has nothing to open. Leave both out, make the MVP REST-only, and the MVP needs no MCP at all.
5. **The folder cost is wrong.** Folder items are stored as one-way hashed keys (05 §3.1), so a folder cannot be filled with per-asset get calls. With a lazy, partial cache, showing a folder means listing every family: **36 calls at today's size and 156 at 10,000 assets**, not 0. The fix is a local card snapshot (§4.3).
6. **There is no client-side safety net.** Add a rate cap, a daily volume cap, a circuit breaker and fewer retries (§5.4).

**Corrected MVP cost at the real account size (1,914 assets):**

| When | API calls + preflights |
|---|---|
| First open on a new device | 11 + 7 |
| Each later open | 7 + 7 |
| Reopen within an hour | 0 |
| 30 days, one visit a day | 214 + 210 |

The open cost stays flat as the library grows.

## 1. Challenges

Severity: **High** = the recommendation is unsafe or misleading as written. **Medium** = wrong numbers or a correctness gap with a clear fix. **Low** = a small gap or a polish item.

| # | Claim in 16 | Problem | Severity | Fix |
|---|---|---|---|---|
| C1 | "9 on each later open" | Leaves out 05's per-session authenticated `tools/list` (+1 large call), and puts the 8 preflights in a separate table. Real total: 10 + 8 | High | Report calls **and** preflights in every headline. Cache the `tools/list` result for 24 h and refresh it on Sync. The MVP needs no MCP, so neither cost applies there |
| C2 | "API-only art is fetched once per device"; "30 days = 278" | Only true in Remember mode. The default is session mode, and D15 drops the cache with it. Every session then costs a full first open, and the Images grid costs up to 836 calls per session | High | Owner decision (§6, Q1). Recommendation: keep the asset cache on the device in both key modes and let Forget wipe it. The token is the secret. The cache holds only the user's own read-only art links. If D15 stays, publish the session-mode numbers |
| C3 | Derive tileset and Tiles Pro CDN paths from the user ID + asset ID | Works today, even for the oldest assets (§3). But it is undocumented and goes against the project's own "documented routes only" rule (02 §7). It is **not** scraping: no enumeration, only the user's own IDs from the API, and the same file the documented helper redirects to. It also **exposes nothing new**: the user ID is already in every character `preview_url` and goes only to the CDN that serves it | High (process), Low (technical) | MVP: call the documented helper `/mcp/tilesets/{id}/image` (not `?inline=true`) **once per tileset per device**, take the final `response.url`, and save it with the list row. Later: derive the path only after PixelLab confirms in writing, with a per-item fallback to the helper and an automatic stop after 3 derive failures in a session |
| C4 | "On image error, fall back once to the API helper" | Lists include **failed** assets (§3). A failed tileset gets 404 from the CDN and 423 from the helper, so it would cost one wasted API call on every load | Medium | Read the row's status. Never request art for failed or unfinished rows. Show a "Failed" or "Generating" placeholder |
| C5 | Images: "show thumbnails, dwell-gated" or "placeholder until opened" | The MVP has no viewer, so there is nothing to open. `get_image` is not marked read-only and is off until P0-9 passes. Images are 43% of the account and the largest single cost: 836 calls for one full scroll, and 4,365 at 10,000 assets | High | MVP: no Images category. If the owner wants a tile anyway, make it a plain link to the PixelLab website with no count and no calls. Later: dwell-gated `get_image`, one at a time, at most 30 per minute, saved on the device under the gallery ID plus the row's text (so an overwritten image reloads) |
| C6 | Maps: `view_map` per thumbnail, including 4 on the home mosaic | The heaviest read there is (a server render), and renders go stale: maps are editable and have no version stamp | Medium | MVP: no Maps category. Later: render only in the Maps grid after the dwell, never on the home tile. A map that rises in the "recently edited first" list counts as edited, and its saved render is dropped |
| C7 | Change check = `limit=4` per family; compare "same total and same first row" | (a) A `limit=4` page costs the same single call as a full page, so the small page buys nothing and catches less. (b) It compares only the first row, so a pending asset that finishes stays "pending" forever. (c) It misses an add plus a delete deep in a list whose sort order is unknown | Medium | The check reads **page 0 at full page size** (one call). Compare a fingerprint (ID + name + status + image URL) of every row on page 0. Details in §5.2 |
| C8 | `pages: {offset: rows}`; load further pages by offset | Offsets shift when assets are added or deleted between page loads. Deletions skip items silently; additions duplicate them | Medium | Store each family as one ordered list. Fetch each next page starting **one row back**, and require the first row to match the last row already held. A mismatch reloads the family from page 0 |
| C9 | "S6 open folder of 8 = 0" | Only true if all 8 assets are already cached. Folder keys are one-way hashes with no family (05 §3.1), so per-asset gets are impossible. Showing an uncached folder needs **every family's full list**: 36 calls (156 at 10,000), in every session in session mode | High (later) | Keep a local card snapshot per folder or favorite item (§4.3). A folder opens with 0 calls on the device where it was made |
| C10 | "Sync never re-downloads thumbnails: CDN URLs change when the art changes" | Measured in 16 itself: object rotations and Tiles Pro tiles have **no `?t=`**. If that art is overwritten, the year-long browser cache keeps showing the old picture, even after Sync | Low | Accept for the MVP (the grid is a preview). Later: the viewer's "Reload from PixelLab" refetches with `cache: 'reload'` |
| C11 | Home count = sum of family `total`s | (a) Characters: the list returns one row per *state*, but cards are grouped by `group_id` (05 §3.1), so the tile count is higher than the grid. Four newest rows can also be four states of one character. (b) Tilesets: the top-down list may include sidescrollers (the overlap seen in 16) | Low | Dedupe the mosaic by `group_id`; page 0 has enough rows. Label counts as approximate until the family is fully loaded, or count cards. Phase 0 with a token: if `/v2/tilesets` includes sidescrollers, drop the sidescroller list (−1 call per open) |
| C12 | "Preflights are cheap … counted separately" | They are cheap (no auth, no database, by inference). But they reach the API server: no CDN headers were seen on `api.pixellab.ai` (§3). They are about **half of all requests**. Browsers cache a preflight per exact URL (query included) for at most `max-age` = 600 s, so opens hours apart always pay them again | Medium (honesty) | Count them. They cannot be avoided from the browser (§5.5). Ask PixelLab whether a longer `Access-Control-Max-Age` would help them (§6) |
| C13 | Retries: "keep 05's backoff" (5 attempts, 429/5xx/network) | During an outage, every request is tried 5 times. That multiplies load exactly when PixelLab is struggling, and retries are not counted anywhere | Medium | At most 2 retries for background work, retries count toward the budget, and a circuit breaker (§5.4) |
| C14 | "Tab visible again" triggers the check (with the 1 h cooldown) | Bounded, but a tab that stays open and is revisited every hour makes 7 calls/hour all day, which is polling in practice. Two tabs opened together each check | Low | Keep the 1 h rule. Run the check and Sync under `navigator.locks` so tabs share one check. Pause background loading while the tab is hidden |
| C15 | Manual Sync re-lists all held pages | Correct, but nothing stops repeated taps, and at 10,000 assets one Sync is up to 68 REST pages in a burst | Low | Disable Sync while it runs and for 60 s after. It goes through the same rate cap |
| C16 | Calculator: tileset thumbnails cost 0 with derived URLs | The approach the calculator models is not the one recommended for the MVP. With the documented helper, one full scroll of the Tilesets grid costs **376 calls once per device** (1,988 at 10,000), mostly tiny no-auth redirects | Medium | Shown honestly in §2. This is the main reason to ask PixelLab for an image URL in tileset list rows, or for permission to derive (§6) |

## 2. Corrected call counts

Re-run of the doc 16 calculator with the corrections above (script in the Appendix). "Preflights" are CORS OPTIONS requests to the same API host.

### 2.1 Real account (1,914 assets)

| Scenario | 16 as published (D) | D corrected, Remember mode | D corrected, default session mode | **Recommended MVP** | Later: derived URLs (with PixelLab's OK) |
|---|---|---|---|---|---|
| First open, new device | 17 | 18 + 8 | 18 + 8 | **11 + 7** | 7 + 7 |
| Next day, no changes | 9 | 10 + 8 | 18 + 8 | **7 + 7** | 7 + 7 |
| After 3 new assets | 10 | 11 + 8 | 19 + 8 | **8 + 7** | 7 + 7 |
| Reopen within 1 h | 0 | 0 | 0 in the same tab; a new tab = full open | **0** | 0 |
| Browse Characters fully | 5 | 5 + 5 | 5 + 5 | **4 + 4** (page 0 already held) | 4 + 4 |
| Browse Tilesets fully | not modelled | — | — | **376 + 42, once per device** | 8 + 4 |
| Browse Images fully | 836 once | 836 + 1 once | 836 + 1 **per session** | not in MVP | (later) 836 once |
| Manual Sync, everything held | 35 | 36 + 18 | 36 + 18 | **17 + 17** | 17 + 17 |
| Open a folder of 8, not cached | 0 | 36 + 18 | 36 + 18 | — (snapshot: 0) | 0 |
| 30 days, one visit a day | 278 | 308 + 240 | 540 + 240 | **214 + 210** | 210 + 210 |

### 2.2 At 10,000 assets (same mix)

| Scenario | D corrected, Remember | D corrected, session mode | **Recommended MVP** | Later: derived |
|---|---|---|---|---|
| Each later open | 10 + 8 | 18 + 8 | **7 + 7** | 7 + 7 |
| Browse Characters fully | 25 + 25 | same | **25 + 25** | 25 + 25 |
| Browse Tilesets fully | — | — | **1,988 + 226, once per device** | 48 + 27 |
| Browse Images fully | 4,365 once | 4,365 per session | not in MVP | 4,365 once |
| Manual Sync, everything held | 156 + 69 | same | **68 + 68** | 68 + 68 |
| Folder not cached | 156 + 69 | same | — | 0 (snapshot) |

**How to read this:**
- Opening the app costs 7 calls at any library size, and nothing at all within an hour.
- Only scrolling and Sync grow with library size. Each page or thumbnail is paid once per device, and only when it actually reaches the screen.
- The two big once-per-device costs are Creator images and tileset thumbnails through the documented helper. PixelLab can remove both by adding an image URL to those list rows (§6).

## 3. What was checked live today

The budget was at most 8 read-only MCP calls plus unauthenticated HEAD requests, with no token anywhere. Used: **3 MCP calls**, all annotated `readOnlyHint: true` (09 Q1). Asset IDs and the account ID are left out of this report.

| # | Check | Result | What it proves |
|---|---|---|---|
| 1 | MCP `list_topdown_tilesets(offset=217, limit=2)` | The 2 oldest of 219. One is marked **failed** | Lists include failed assets (C4) |
| 2 | MCP `list_sidescroller_tilesets(offset=113, limit=2)` | The 2 oldest of 115 | IDs for the age test |
| 3 | MCP `list_tiles_pro(offset=36, limit=2)` | The 2 oldest of 38 (one isometric kind, one square top-down) | IDs for the age test |
| 4 | `HEAD /mcp/tilesets/{oldest}/image` (no auth) | 302, `cache-control: no-cache`, redirect to `…/pixellab-tiles/<account>/<id>/spritesheet.png?t=<ms>` | The documented helper resolves to the derived path, even for the oldest tileset. It is an API-server request every time |
| 5 | Same helper for the **failed** tileset | **423 Locked** | A fallback call for failed rows is wasted (C4) |
| 6 | `HEAD /mcp/sidescroller-tilesets/{oldest}/image` | 302 to the same path pattern, with no `?t=` | Same pattern for sidescrollers |
| 7 | HEAD on derived CDN paths: oldest top-down sheet, oldest sidescroller sheet, `tile_0` of both oldest Tiles Pro | All **200** from Cloudflare, `max-age=31536000`, `cf-cache-status: MISS` | The derived pattern holds across asset age and Tiles Pro kind (C3) |
| 8 | Derived CDN path for the failed tileset | **404**, CDN caches the 404 for 4 h | Failed assets have no art |
| 9 | `HEAD /v2/characters?limit=4` (no auth) | 405 `allow: GET`, `server: uvicorn`, no CDN headers | The API host shows no CDN in front, so preflights reach the app server (C12) |
| 10 | `OPTIONS /v2/characters?limit=4&offset=0` and `OPTIONS /mcp` | 200, `access-control-max-age: 600`, `server: uvicorn` | Preflight cache is 10 minutes, unchanged |

Request count: 3 MCP calls, about 7 unauthenticated requests to `api.pixellab.ai` (helpers, a HEAD and preflights), and 5 HEAD requests to the CDN.

**Not verified (needs Phase 0 with a token in the browser app):**
- The sort order of characters, objects, top-down tilesets and isometric tiles.
- Whether `/v2/tilesets` also lists sidescrollers.
- The REST body field for status, and the host of REST `preview_url`.
- Authenticated 429 behaviour.

## 4. Answers to the specific questions

### 4.1 Hand-built CDN thumbnail URLs (question 1)

- **Does it work?** Yes. It works for the newest and the oldest top-down tilesets, sidescroller tilesets and both Tiles Pro kinds. Isometric tiles have no CDN path (research 16).
- **Is it scraping or a ToS problem?** Probably not. Vitrine only builds URLs for IDs the API just returned for the user's own account. The request is byte-for-byte the one a browser makes after following the documented helper's redirect, so PixelLab cannot tell the two apart at the CDN. ToS §2.2 is about API access and says nothing about media URLs. The real risks are **breakage** (the path is undocumented) and **trust** (the project promised to use only documented routes).
- **Does it expose the user ID?** No new exposure. The account ID is already inside every character, object and UI URL the API returns, and it goes only to the CDN that serves those files. Keep the existing rule that URLs never appear in logs, routes or exports (02 §8).
- **Safer option with similar cost:** the **documented helper, resolved once and remembered**. Fetch `/mcp/tilesets/{id}/image` (or the sidescroller one) with no headers, so it is a simple request with no preflight. Read `response.url` (the final CDN URL) and save it with the list row. Every later display goes straight to the CDN.
  - Cost: one tiny no-auth API request per tileset, **once per device**, and only when the card is on screen.
  - For the home mosaic that is 4 calls, once.
  - A full Tilesets scroll is the expensive case: 376 at today's size.
- **Tiles Pro:** there is no documented helper, so use `GET /v2/tiles-pro/{id}` once per asset per device and save `storage_urls.tile_0..3`. That is 38 calls today, each with its own preflight.
- **MVP or later?** **MVP: helper resolved once.** **Later: derived paths**, only after PixelLab confirms in writing (one email), with a per-item helper fallback and an automatic stop after 3 failures in a session. Even better, PixelLab adds the image URL to the tileset, Tiles Pro and isometric list rows. Then all of these calls disappear and nothing is derived.

### 4.2 Creator images and maps (question 2)

The honest MVP choice is to **leave both categories out of the MVP.**
- *Placeholder until opened* means nothing in an MVP with no viewer.
- *Dwell-gated loading* would ship an unapproved, not-read-only tool (`get_image`, gated by P0-9) and the heaviest read there is (`view_map`).

Leaving them out also removes the whole MCP client from the MVP: no `tools/list`, no text parsing and no MCP preflight. That is simpler, and every MVP request goes to a documented, read-only REST route.

If the owner wants the tiles visible, show "Images" and "Maps" as plain links to the PixelLab website, with no count and no API calls.

When they ship (with the viewer), add them like this:
1. P0-9 passes first.
2. Thumbnails load after 300 ms on screen.
3. `get_image` runs one at a time, at most 30 per minute. `view_map` runs one at a time and never on the home tile.
4. Results are saved on the device in both key modes. Images are keyed by gallery ID plus a hash of the row's text; maps are invalidated by edit order (C6).
5. The `tools/list` gate is cached for 24 h.

The full Images scroll stays expensive (836 calls once per device today), and that cost should be stated plainly to the owner.

### 4.3 Folders and favorites (question 3, post-MVP)

- **Today's design:** a folder stores one-way hashed keys with no family. Vitrine cannot ask PixelLab for "these 8 assets". It can only find them by listing.
  - With a partial cache, an uncached folder costs every family's full list: 36 calls + 18 preflights at today's size, and 156 + 69 at 10,000.
  - In session mode, that happens every session.
  - Per-asset gets would be 8 calls + 6 preflights for 8 items, but they are impossible with hashed keys.
- **Design that keeps it at 0:** an asset can only be added to a folder from a card that is on screen, so its card data is already in hand. Save a **local card snapshot** next to the folder entry: family, raw ID, name, status and thumbnail URL (or the media-cache key for API-only art).
  - Store it in IndexedDB on this device only, and wipe it with Forget.
  - Never put it in the backup file. Backups keep opaque keys only (05 §6.2, research 17 §10).
  - Opening the folder, and the folder's home mosaic, cost **0 calls**.
- **New device after a backup import:** the snapshot does not travel. Show "Finding your folder items…" and list only what is needed, once.
  - Without a family hint, that is every family, once per device: 36 calls today.
  - Optional: add the family name (not the ID) to backup entries, so only those families are listed. That reveals only asset types, so it is the owner's call.
- **Removed assets ("orphans"):** check only after a manual Sync that has listed everything (05 §6.3 already says this). Never check per item.
- **Favorites** are a folder for this purpose and get the same design.

### 4.4 Change detection (question 4)

**Recommended rule.** One call per family on open reads page 0 at full page size: 100 rows, or 50 for sidescroller tilesets and Tiles Pro.
1. **No change:** the same `total` and the same fingerprint (ID + name + status + image URL) for every row. Nothing else happens.
2. **Only new assets on top:** the old first row is still on page 0, and `total` grew by exactly the number of rows above it. Add those rows to the top.
   - This is exact for lists sorted newest first. Say *a* items were added, *m* existing items moved to the top and *d* items were deleted. The rows above the old first row number *a + m*, and the total changed by *a − d*. They can only be equal if *m = d = 0*.
   - Up to 99 new items fit, instead of 3.
3. **Rows changed in place** (renamed, finished generating, new image URL): update them in place.
4. **Anything else:** replace page 0 and drop the deeper pages held for that family. They reload when the user scrolls there.

| Case | What happens | Correct? |
|---|---|---|
| New assets, sorted newest first | Added on top (rule 2) or page 0 replaced (rule 4) | Yes |
| Deleted asset anywhere | `total` drops, so rule 4 | Yes |
| Asset renamed or re-rendered in the newest 100 | Fingerprint differs, so rule 3 | Yes (16's `limit=4` missed this) |
| Asset that was still generating at the last check | Status or URL changes, so rule 3 | Yes (16 left it "pending" forever) |
| Old asset edited deep in the list, order unchanged | Not seen | Stale until Sync, or until its page is older than 7 days |
| List sorted by last edit, old asset edited | It moves to the top: rule 2 fails, so rule 4 | Yes, at the cost of reloading pages |
| Unknown sort order with an add **and** a delete deep in the list | Same `total` and same page 0, so it looks like no change | **Missed** until Sync or 7-day expiry. Phase 0 should confirm the sort order |
| Another tab or the website deletes items while the user scrolls | One-row overlap check fails, so the family reloads | Yes (C8) |

- **Upper bound on staleness:** held pages older than 7 days reload when they are next shown. This cost is bounded by what the user actually scrolls.
- **How often manual Sync is needed:** rarely. Only after renaming or re-editing *old* assets on the website and wanting to see it at once. Even without Sync, nothing in the grid is more than 7 days stale.
- **Load worst cases:**
  - A user who adds more than 99 assets of one family per check interval: page 0 is replaced and the deeper pages reload as they scroll. That is the cost of a normal scroll.
  - An hourly tab revisit: 7 calls per hour.
  - A Sync at 10,000 assets: 68 calls, spread out by the rate cap.

### 4.5 Preflights (question 5)

- **Do they count?** Yes, as requests to the API server: no CDN headers were seen on `api.pixellab.ai`. They are light, though: Starlette's CORS middleware answers them with no token and no database work (inference). They make up about half of all requests to the API host, so they belong in every headline.
- **Can they be avoided?** Not for authenticated calls.
  - `Authorization` is never a CORS-safelisted header, so any request carrying the token is preflighted.
  - Putting the token in the URL is unsupported, and it would leak into logs. Never do it.
  - Browsers cache a preflight per exact URL (query included) for at most 600 s here, so `offset=0` and `offset=100` are separate preflights.
- **What does reduce them:**
  - Requests without headers are simple and get **no** preflight: the no-auth helpers and the CDN. The resolved-helper design uses only these.
  - Fewer distinct authenticated URLs: dropping the sidescroller list if `/v2/tilesets` already includes sidescrollers saves 1.
  - MCP shares one URL, so all MCP calls share one preflight every 10 minutes. Moving the 4 tileset checks to MCP would save 4 preflights per open, because those REST lists carry no image URL either. That would bring a text parser back into the MVP, so it is **not recommended**.
  - PixelLab could raise `Access-Control-Max-Age`. Chrome honours up to 2 h and Firefox up to 24 h. It only helps visits within that window.

### 4.6 Rate limits, backoff and a hard budget (question 6)

There are no published read limits, and `Retry-After` cannot be read from JavaScript (02 §2.2). Vitrine therefore has to limit itself. §5.4 gives the rules.

## 5. Final recommended API strategy

### 5.1 MVP (key screen, home tiles, category grids)

**Which PixelLab routes it uses** (all documented, all read-only):
- REST lists for characters, objects, UI, top-down tilesets, sidescroller tilesets, isometric tiles and Tiles Pro.
- `GET /v2/tiles-pro/{id}` once per Tiles Pro asset per device.
- The no-auth helpers `/mcp/tilesets/{id}/image`, `/mcp/sidescroller-tilesets/{id}/image` and `/mcp/isometric-tile/{id}/download`, each resolved or fetched once.
- **No** MCP calls, balance call, Creator images or maps.

**Key screen:** the first check call (characters, page 0) tests the key. A 401 means the key is wrong. No extra call.

**What is saved on the device** (both key modes, if the owner agrees; Forget wipes it all):

| What | Where | Refreshed by |
|---|---|---|
| Per family: `total`, the ordered rows loaded so far, when each page was loaded, last check time | IndexedDB | The open check, scrolling, manual Sync |
| Resolved CDN URL per tileset, `tile_0..3` URLs per Tiles Pro | IndexedDB, with the row | Never. The art does not change through the public API. Reloads if the row's image fingerprint changes |
| CDN images (characters, objects, UI, tilesets, Tiles Pro) | Browser HTTP cache (1 year) | New URL when the list gives one |
| Isometric PNG | Browser HTTP cache (1 year, set by PixelLab) | — |

**When it calls:**
1. **App open, or tab visible again:** if the last check was under 1 hour ago, make 0 calls. Otherwise run 7 checks (page 0 per family) at concurrency 2 inside a `navigator.locks` lock, and apply §4.4.
2. **Home mosaics:** draw from page 0. Characters, objects and UI need no calls. The Tilesets mosaic makes up to 4 helper resolutions, once per device.
3. **Category grid:** load the next page (one row of overlap) only when the scroll position needs it. Tileset and Tiles Pro thumbnails resolve after the card has been on screen for 300 ms, at most once per asset per device. Skip failed or unfinished rows.
4. **Manual Sync** (in the "…" menu): re-read every page held, in order, through the rate cap. Update names and URLs, and remove assets that are gone. Never re-download thumbnails. Disabled while running and for 60 s after.
5. **Never:** polling, background prefetch, detail calls just to draw a card, `?inline=true` helpers, or requests for failed assets.

### 5.2 Later (viewer, Images, Maps, folders, favorites)

- **Creator images and maps:** see §4.2. Images ship only after P0-9 passes and with the image cap. Maps never render on the home tile.
- **MCP gate:** `tools/list` is cached 24 h and refreshed on Sync, not fetched every session.
- **Folders and favorites:** use the local card snapshot (§4.3). Orphan checks happen only after Sync.
- **Viewer details:** one get per opened asset, saved on the device. No neighbour prefetch (05 §5.3 stands). The "Play previews" default stays tied to P0-14 and P0-8.
- **Derived CDN paths:** only with PixelLab's written OK, using a per-item helper fallback and an automatic stop after 3 failures.

### 5.3 Expected load per user (real account size)

- **Daily visit:** 7 calls + 7 preflights, and 0 if the user comes back within the hour.
- **First visit on a device:** 11 + 7.
- **Scrolling:** each list page and helper-resolved thumbnail is paid once per device, only when it reaches the screen.
- **30 days of one visit a day:** about 214 calls, versus about 37,000 for the naive "sync everything" approach (16 §5.1).

### 5.4 Safety nets (all in the one network module, `http.ts`)

| Net | Rule |
|---|---|
| Concurrency | 2 requests at a time to `api.pixellab.ai`, as 05 B-1 already says until P0-8 measures. User actions (open asset, key test) go first; thumbnails and pages go last |
| Rate cap | Token bucket: a burst of 8, then at most 2 requests per second (120 per minute). Per-tool caps later: `get_image` 30 per minute, `view_map` 10 per minute |
| Daily volume cap | Rolling 24 h count per device (in `localStorage`): at **1,000** API calls, background loading stops and a banner reads "Paused to go easy on PixelLab's servers. [Keep loading]". Each tap allows another 1,000. User-initiated single actions still work |
| Retries | 429, 5xx and network errors: full-jitter backoff, at most **2 retries** for background work and 3 for user actions. Retries count toward both caps. No retry on 401, 404, 410 or 423, or on a probable CORS failure |
| Circuit breaker | First 429: drop to 1 at a time and pause background work for 60 s. A second 429 within 5 minutes, **or** 3 failures (5xx or network) in a row: stop all API work for the session and show "PixelLab isn't answering right now. [Try again]" |
| Hidden tab | Pause and abort queued background work while `document.hidden` |
| Multi-tab | The open check and Sync run under `navigator.locks`, and the last-check time lives in IndexedDB |
| Kill switches | Build flags already planned in 05 (`VITE_IMAGES`, `PREVIEWS_DEFAULT_ON`), plus `DERIVE_CDN` (off by default). Each can be flipped and redeployed in minutes if PixelLab asks |
| Test | One unit test that drives the queue with fake 429s and 5xx responses and asserts the caps, the breaker and the retry limit |

## 6. Decisions for the owner and questions for PixelLab

**Owner decisions:**
1. **Keep the asset cache on the device in session mode?** Recommended: yes. It saves about 11 calls per session, and the whole Images grid per session later. Forget still wipes everything. The cost is that asset links stay on the device after the tab closes. If no, the session-mode column in §2 is the honest number.
2. **Leave Images and Maps out of the MVP** (recommended), or show them as link-only tiles?
3. **Add the family name to backup entries** to make folder recovery on a new device cheaper? This is optional, and it reveals asset types only.

**Questions for PixelLab** (one short email; each answer can only lower the load):
1. May Vitrine build tileset and Tiles Pro CDN URLs from the account ID and asset ID? Better: could the tileset, Tiles Pro and isometric **list rows** carry an image URL, and `list_images` rows a thumbnail URL? That alone removes about 1,200 once-per-device calls on this account.
2. Is `get_image` on a `gallery:` ref read-only? Would PixelLab re-annotate it, or split the read into its own tool?
3. Is there a read rate limit to respect? Could `Retry-After` be added to `Access-Control-Expose-Headers`?
4. Would `updated_at` on every list row, or a sort or `updated_after` parameter, be possible? That would make the change check exact.
5. Would a longer `Access-Control-Max-Age` help on your side?
6. (From 02) Are browser clients supported long term, and is a read-only token scope planned?

## Appendix: corrected calculator (`calc_review.py`)

Run it with `python calc_review.py`. `_check()` runs first. §2 is its output. Family totals and page sizes are research 16's measured values.

```python
"""R6 re-run of doc 16's calculator with corrected assumptions.

Counts per scenario: api = requests reaching api.pixellab.ai that do real work
(REST, MCP, no-auth helpers); pre = CORS preflights (OPTIONS, also reach the API host,
no auth, no database work by inference). http = api + pre.
Corrections vs doc 16:
  * MCP sessions pay one authenticated tools/list (05 sec 4.2 gate) unless it is cached.
  * Default key mode is "this tab only" and 05 D15 ties cache persistence to it,
    so every session is a first open and API-only art is re-fetched per session.
  * Recommended MVP: REST-only families, check = page 0 at full page size,
    documented helper resolved once per tileset and persisted, Tiles Pro via one
    REST get per asset once (own preflight each), pages overlap by one row.
"""
from math import ceil

FAM = {  # family: (total, page max)
    "characters": (478, 100), "objects": (213, 100), "ui": (19, 100),
    "topdown": (219, 100), "sidescroller": (115, 50), "isometric": (4, 100),
    "tiles_pro": (38, 50), "images": (819, 50), "maps": (9, 100),
}
REST = ["characters", "objects", "ui", "topdown", "sidescroller", "isometric", "tiles_pro"]
MCP = ["images", "maps"]


def scaled(n):
    real = sum(t for t, _ in FAM.values())
    return {f: (max(1, round(t * n / real)), p) for f, (t, p) in FAM.items()}


def pages(fam, f, held0=False):
    """Pages to read a whole family. held0: page 0 already came with the open check;
    later pages overlap the previous one by one row (drift check), so they carry p-1 new rows."""
    t, p = fam[f]
    if not held0:
        return max(1, ceil(t / p))
    return max(0, ceil((t - p) / (p - 1)))


def d16(fam, session_mode):
    """Doc 16 strategy D, corrected: +1 tools/list per session that touches MCP."""
    checks, mcp_pre, tl = 9, 1, 1
    s1_api = checks + 4 + 4 + tl                       # 4 get_image + 4 view_map mosaics + tools/list
    s2_api = s1_api if session_mode else checks + tl   # session mode: every session is S1
    imgs = fam["images"][0] + pages(fam, "images")
    return {
        "S1 new device": (s1_api, 7 + mcp_pre),
        "S2 next day, no change": (s2_api, 7 + mcp_pre),
        "S4b browse Images fully": (imgs, 1),           # once per device (Remember) / per session (session mode)
        "S7 Sync, all held": (sum(pages(fam, f) for f in fam) + tl, sum(pages(fam, f) for f in REST) + mcp_pre),
        "Folder of 8, not cached (05 opaque keys)": (sum(pages(fam, f) for f in fam) + tl, sum(pages(fam, f) for f in REST) + mcp_pre),
        "30 days, 1 visit/day": (s1_api + 29 * s2_api, 30 * (7 + mcp_pre)),
    }


def mvp(fam, derived=False):
    """Recommended MVP: 7 REST checks (page 0 each), persisted cache in both key modes."""
    checks = len(REST)
    mosaic_tiles = 0 if derived else 4                 # Tilesets mosaic = 4 top-down helper calls, once
    tiles_pro_gets = 0 if derived else fam["tiles_pro"][0]
    tileset_helpers = 0 if derived else fam["topdown"][0] - 4 + fam["sidescroller"][0]
    browse_tilesets_pages = sum(pages(fam, f, held0=True) for f in ["topdown", "sidescroller", "isometric", "tiles_pro"])
    sync_pages = sum(pages(fam, f) for f in REST)
    return {
        "S1 new device": (checks + mosaic_tiles, checks),
        "S2 next day, no change": (checks, checks),
        "S3 after 3 new (char, tileset, image)": (checks + (0 if derived else 1), checks),
        "S4 browse Characters fully": (pages(fam, "characters", held0=True), pages(fam, "characters", held0=True)),
        "S4t browse Tilesets fully (once/device)": (browse_tilesets_pages + tileset_helpers + tiles_pro_gets + fam["isometric"][0],
                                                     browse_tilesets_pages + tiles_pro_gets),
        "S7 Sync, all held": (sync_pages, sync_pages),
        "Folder of 8 (later, local card snapshot)": (0, 0),
        "30 days, 1 visit/day": (checks + mosaic_tiles + 29 * checks, 30 * checks),
    }


def show(title, rows):
    print(f"\n### {title}\n| Scenario | API calls | Preflights | All HTTP to API host |\n|---|---|---|---|")
    for k, (a, p) in rows.items():
        print(f"| {k} | {a:,} | {p:,} | {a + p:,} |")


def _check():
    m = mvp(FAM)
    assert m["S2 next day, no change"] == (7, 7)
    assert m["S4 browse Characters fully"][0] == 4          # 378 rows left / 99 new rows per page
    assert m["S4t browse Tilesets fully (once/device)"][0] == 4 + 215 + 115 + 38 + 4
    assert d16(FAM, False)["30 days, 1 visit/day"][0] == 18 + 29 * 10
    assert d16(FAM, True)["30 days, 1 visit/day"][0] == 30 * 18
    assert mvp(scaled(10000))["S2 next day, no change"][0] == 7   # open cost flat with size


if __name__ == "__main__":
    _check()
    for label, fam in [("real account (1,914)", FAM), ("10,000 assets", scaled(10000))]:
        show(f"Doc 16 D, Remember mode, corrected - {label}", d16(fam, False))
        show(f"Doc 16 D, default session mode (05 D15) - {label}", d16(fam, True))
        show(f"Recommended MVP (REST only, documented helpers) - {label}", mvp(fam))
        show(f"Later, derived CDN paths with PixelLab's OK - {label}", mvp(fam, derived=True))
```

Known limits of the model:
- The MVP "after 3 new" row has no image because Images is out of scope.
- Retries are not modelled. The caps in §5.4 bound them.
- The 10,000-asset row keeps today's family mix.
