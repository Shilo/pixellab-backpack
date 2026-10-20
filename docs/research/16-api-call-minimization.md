# 16: API-call minimization

Research date: 2026-10-19. The PixelLab owner is worried about the API load Vitrine could add, so this round looks for the approach with the **fewest calls to PixelLab's API** for the MVP: the API-key screen, the home category tiles (Characters, Objects, Images, Tilesets & tiles, Maps, UI, each with a 2×2 mosaic and a count), and the category grids. Everything below is backed by live tests made with a tight budget: 16 read-only MCP calls, about 20 unauthenticated `curl` requests, and a calculator script built on the measured numbers (Appendix).

Legend: **[live]** = measured today. **[contract]** = live OpenAPI or MCP tool schema, not exercised. **[01]/[02]/[09]/[05]** = earlier doc. **(inference)** = reasoning, not observation.

## Summary and recommendation

**Recommendation: strategy D, "lazy + cached + derived image URLs".** At the owner's real account size (1,914 assets) it costs **17 API calls on a new device, 9 on each later open, 0 on a reopen within the hour, and 10 after 3 new assets**. Today's design (05: re-list everything on every open) costs about 48 on a new device and 35 on every open. The naive "sync everything" approach costs about 1,240.

What makes D cheap, in order of impact:

1. **Thumbnails almost never need the API.** Measured: characters, objects and UI carry a CDN image URL in the REST list. Top-down tilesets, sidescroller tilesets and Tiles Pro have a **predictable CDN path** built from the user ID plus the asset ID, and all three returned 200 from `backblaze.pixellab.ai` without any API call. The user ID can be read from any list `preview_url`. Design 05 instead loads tileset thumbnails through `api.pixellab.ai/mcp/tilesets/{id}/image`, which is served by the API server with `cache-control: no-cache`, so **every tileset thumbnail is an API request**. It also loads Tiles Pro thumbnails with one `GET /v2/tiles-pro/{id}` each. At the real account size that is 372 avoidable API requests for one full pass over the Tilesets grid.
2. **The home screen's change check and its mosaic are the same call.** On open, D sends one `limit=4` list request per family (7 REST + 2 MCP = 9). Each answer has `total`, which feeds the tile count and the change test, plus the 4 newest rows, which feed the mosaic. Up to 3 new assets in a family are already in that response, so a normal reopen never needs a second page.
3. **Nothing is fetched until it is on screen**, and nothing is fetched twice. List pages for a category are loaded as the user scrolls and then kept in IndexedDB. API-only art (Creator images, maps, isometric tiles) is fetched once per device and kept in the Cache API.
4. **No balance call.** The first list call already proves the key works (401 if not).

**Cost that D cannot avoid:** Creator images (819 on the real account) have no image URL anywhere. Each thumbnail needs one `get_image` MCP call, so scrolling the whole Images grid once costs about 836 calls (17 list pages + 819 thumbnails). That happens once per device, but it is by far the biggest single cost. Maps need one `view_map` each (9 maps). See Risks.

**Should Sync fetch everything or only what's on screen?** **Neither, exactly.**
- **On open: only a tiny check** (9 calls, or 0 if the last check was under an hour ago). The user sees new art at the top of each category without pressing anything.
- **Manual Sync: re-read the lists, never the art.** Sync re-reads the list pages Vitrine already holds (at most all 35 pages at the real size), because that is the only way to see deletions, renames and edits deep in a list. It never re-downloads thumbnails: CDN URLs change when the art changes, and API-only art is reloaded per item from the viewer's "Reload from PixelLab".
- **Art: only what is on screen, always.** No background prefetch.

## 1. Live contract (re-checked today)

`https://api.pixellab.ai/v2/openapi.json` (unauthenticated): `info.version: "dev"`, 102 paths, 275 schemas, unchanged from [01] **[live]**.

- **List query parameters:** only `limit` and `offset` on every list. No `sort`, `since`, `updated_after`, `ids` or search parameter. **[live contract]**
- **No batch endpoint.** No path contains `batch` or `bulk`, and no GET takes a list of IDs. **[live contract]**
- **MCP has no batching either.** A JSON-RPC batch (an array of two `ping` requests) sent to `/mcp` was rejected with a validation error ("Input should be a valid dictionary"). **[live]**
- **Every list response has `total`** (REST) or a `N total` header line (MCP). **[live contract + live MCP]**
- **Sort order:** documented as newest first only for sidescroller tilesets, Tiles Pro, UI assets and Creator images, and as most recently *edited* first for maps. Characters, objects, top-down tilesets and isometric tiles do not say. The MCP lists for characters and images showed the newest items first today (inference for the rest). **[contract + live]**
- **Caching headers on the API:** none useful. An unauthenticated list GET answers 401 from `uvicorn` with no `Cache-Control` or `ETag` [live]. [02] found no `ETag`/`Last-Modified` anywhere, and only `Content-Disposition` is exposed to JavaScript, so conditional requests are impossible.
- **Preflights:** REST and MCP preflights answer `access-control-max-age: 600` **[live]**. Each distinct REST URL needs its own preflight (browser preflight caches are keyed by URL); all MCP calls share one URL, so they share one preflight per 10 minutes. Preflights carry no token and need no database work (inference), so the calculator counts them separately.

## 2. Per-family endpoint table

"Thumbnail without API" = can a tile be drawn from the list response alone, with no per-item API request.

| Family (home tile) | List endpoint used | Page max | Measured total (real account) | Image in list? | Thumbnail without API? | Per-item call needed for a thumbnail | What a get call adds (for later viewer work) | Sort / filter params |
|---|---|---|---|---|---|---|---|---|
| Characters (Characters) | REST `GET /v2/characters` | 100 (MCP 50) | 478 | REST: `preview_url` (south). MCP list: **no** | **Yes** (REST) | none | rotations ×4/8, every animation frame URL, group/state, style | none (MCP only: `search`, `tags`) |
| Objects (Objects) | REST `GET /v2/objects` | 100 (MCP 50) | 213 | REST: `preview_url`. MCP list: **no** | **Yes** (REST) | none | rotation (`unknown` for 1-dir), animation frames, group | none (MCP only: `search`, `tags`, `status_filter`) |
| UI assets (UI) | REST `GET /v2/ui-assets` | 100 (MCP 50) | 19 | REST: `image_url`. MCP list: **no** | **Yes** (REST) | none | progress fields only (REST); MCP adds nothing new | none; newest first |
| Top-down tilesets (Tilesets & tiles) | REST `GET /v2/tilesets` | 100 (MCP 50) | 219 | **no** | **Yes, by derived CDN path** | none with the derived path. 05's helper `/mcp/tilesets/{id}/image` = 1 API request per load (`no-cache`) | terrain text, style, tile count, metadata link | none |
| Sidescroller tilesets (Tilesets & tiles) | REST `GET /v2/tilesets-sidescroller` | **50** (MCP 100) | 115 | **no** | **Yes, by derived CDN path** | none with the derived path. Helper `/mcp/sidescroller-tilesets/{id}/image` = 1 API request | tile count, metadata link | none; newest first |
| Isometric tiles (Tilesets & tiles) | REST `GET /v2/isometric-tiles` | 100 (MCP 50) | 4 | **no** | No | 1 request to `/mcp/isometric-tile/{id}/download` (API server, but `max-age=31536000`, so once per browser) | seed, shape | none |
| Tiles Pro (Tilesets & tiles) | REST `GET /v2/tiles-pro` | **50** (MCP 50) | 38 | **no** | **Yes, by derived CDN path** | none with the derived path. 05: `GET /v2/tiles-pro/{id}` = 1 API call | full description, kind, tile rules, every `tile_N` URL | none; newest first |
| Creator images (Images) | MCP `list_images` (no REST) | 50 | 819 | **no** (ref, description, size, frames, date) | No | 1 `get_image(index=0)` MCP call (inline PNG; annotated not read-only [09]) | inline frames, 7-day presigned URL (no CORS) | `search`; newest first |
| Maps (Maps) | MCP `list_maps` (no REST) | 100 | 9 | **no** (name, cell size, terrain count) | No | 1 `view_map` MCP call (server-side render) | ASCII grid (`get_map`), placements | `search`; most recently edited first |

Notes:
- **Tileset overlap [live]:** the newest sidescroller row's ID also appeared in the top-down list (same as [01]). Summing the four tileset totals for the home count can overcount by the overlap. The derived CDN path is the same for both lists, so thumbnails are unaffected.
- **REST `GET /v2/tilesets` says it lists "top-down and sidescroller"** [contract]. If Phase 0 confirms that, the separate sidescroller list (3 pages + 1 check) can be dropped.
- **MCP lists are not a cheaper substitute.** They lack the image URL for characters, objects and UI, and their page maximum is 50 where REST allows 100. MCP stays only for the two families that have no REST list.

## 3. Measured log

### 3.1 MCP calls (16 of the 30-call budget)

All tools annotated `readOnlyHint: true`. Not called: `get_image`, `get_map_object`, `list_projects`, `view_map`, any write. Names, prompts and IDs are left out.

| # | Tool | Arguments | Rows | Total reported | Image URL in result? | Fields seen |
|---|---|---|---|---|---|---|
| 1 | `list_characters` | `limit=2` | 2 | 478 | No | id, name, `8dir 48x48`, `8anim`; `next:` hint |
| 2 | `list_objects` | `limit=2` | 2 | 213 | No | id, truncated name, `1dir 96x96` |
| 3 | `list_topdown_tilesets` | `limit=2` | 2 | 219 | No | id, truncated terrain text, `chainable` flag |
| 4 | `list_sidescroller_tilesets` | `limit=2` | 2 | 115 | No | id, truncated text, `25tiles`/`16tiles`, `chainable` |
| 5 | `list_isometric_tiles` | `limit=2` | 2 | 4 | No | id, name, `32px block` |
| 6 | `list_tiles_pro` | `limit=2` | 2 | 38 | No | id, truncated description, `square_topdown 32x32px 16var` |
| 7 | `list_ui_assets` | `limit=2` | 2 | 19 | No | id, name, `448x312`, `completed` |
| 8 | `list_images` | `limit=2` | 2 | 819 | No | `gallery:<id>`, description, `WxH`, date (newest first) |
| 9 | `list_maps` | `limit=2` | 2 | 9 | No | id, name, `WxH cells`, terrain count |
| 10 | `get_character` | `include_preview=false` | — | — | Yes: 8 rotation URLs + per-direction frame URL patterns (backblaze, `?t=`) | status, state, directions, size, view, group, animations, download links |
| 11 | `get_object` | `include_preview=false` | — | — | Yes: 1 rotation URL (`unknown`, backblaze, no `?t=`) | status, directions, size, group, animations |
| 12 | `get_ui_asset` | `include_preview=false` | — | — | Yes: `image` (backblaze, `?t=`) | status, size, download link |
| 13 | `get_tiles_pro` | — | — | — | Yes: 16 `tile_N` URLs (backblaze, **no `?t=`**, path = user ID + asset ID + `tile_N.png`) | description, type, kind, variations, view, seed |
| 14 | `get_topdown_tileset` | — | — | — | Helper links only (`/mcp/tilesets/{id}/image`, `?inline=true`, `/metadata`) + one inline example image | terrain, tile count, style, base tile IDs |
| 15 | `get_sidescroller_tileset` | — | — | — | Helper links only | terrain, tile count, base tile ID |
| 16 | `get_isometric_tile` | — | — | — | Helper link + inline image | name, size, shape, seed |

Real account total: **1,914 assets** (478 + 213 + 219 + 115 + 4 + 38 + 19 + 819 + 9; tileset overlap not removed). A `limit=2` list costs the same single request as `limit=1`, so calls 1–9 are exactly the D-style change check.

### 3.2 Media hosting (unauthenticated `curl`, no token)

| Request | Host / server | Result | Cache | API load? |
|---|---|---|---|---|
| Character south rotation, **without** `?t=` | `backblaze.pixellab.ai`, `Server: cloudflare` | 200 `image/png`, ACAO `*` | `public, max-age=31536000` | No (CDN) |
| Object `rotations/unknown.png` | same | 200 | 1 year | No |
| UI `full.png` without `?t=` | same | 200 | 1 year | No |
| Tiles Pro `tile_0.png` for a **second** Tiles Pro asset, path built by hand (no get call made for it) | same | **200** | 1 year | No |
| Top-down sheet `pixellab-tiles/<user>/<id>/spritesheet.png`, built by hand | same | **200** | 1 year | No |
| Sidescroller sheet, same pattern, built by hand | same | **200** | 1 year | No |
| Same Tiles Pro tile, GET twice | same | 1st `cf-cache-status: MISS`, 2nd **`HIT`** (`Age: 0`) | edge-cached | No |
| `/mcp/tilesets/{id}/image` (05's tileset thumbnail) | `api.pixellab.ai`, `server: uvicorn` | 302 → backblaze sheet `?t=…` | **`no-cache`** | **Yes, every load** |
| `/mcp/sidescroller-tilesets/{id}/image` | `uvicorn` | 302 → backblaze sheet | `no-cache` | **Yes, every load** |
| `/mcp/isometric-tile/{id}/download` | `uvicorn` | 200 `image/png` | 1 year | Yes, first load per browser |
| Six guessed backblaze paths for an isometric tile | backblaze | all 404 | — | — |

Conclusions:
- **Thumbnails and frames are served by Cloudflare in front of Backblaze B2, not by the API server [live].** A repeat GET is a Cloudflare edge hit. That such loads do not count against PixelLab's API capacity is an **inference** from the separate host and server header; they do cost PixelLab storage bandwidth.
- **The two API "image" helpers are real API traffic [live]:** answered by `uvicorn` with `no-cache`, so a browser asks again on every uncached load.
- **The derived path is undocumented** and could change (Risks). Isometric tiles have no CDN path found; with 4 tiles the helper is fine.

## 4. Strategies compared

| | What it does on open | Thumbnails | Persistence |
|---|---|---|---|
| **A. Sync everything** | Balance + every page of every family, every open | Eagerly, every item, through 05's helpers and gets | none (browser HTTP cache only) |
| **B. Lazy per view** | Balance + one `limit=4` call per family for the home tiles; category pages as the user scrolls | Visible items only, 05's helpers | session memory only |
| **C. Snapshot + check** (05 plus a check) | First open: every list page. Later opens: `limit=1` per family; a changed family is re-listed in full | Visible only, 05's helpers, cached forever | IndexedDB lists + Cache API |
| **D. Recommended** | One `limit=4` call per family = change check + mosaic + count; new rows prepended from it; no balance call; skip the check if the last one was < 1 h ago | Visible only; **derived CDN URLs** for tilesets and Tiles Pro; API-only art cached forever | IndexedDB lists (only pages seen) + Cache API for API-only art |

Other ideas tested or considered:
- **MCP instead of REST:** loses image URLs and halves page size for most families; only sidescroller pages are bigger on MCP (100 vs 50, saving 1 call at the real size). Not worth a second text parser. Rejected.
- **Batching / coalescing:** no batch route and no JSON-RPC batch [live]. In-flight dedupe (05 D25) still matters within the app, but cannot merge calls on the wire.
- **Checks through MCP to save preflights:** all 9 checks over MCP would need 1 preflight instead of 8, but would lose the mosaic URLs and add parsing. Preflights are cheap (inference). Rejected.
- **Background prefetch:** off in every strategy except A. Already ruled out by 05 §5.3.

## 5. Results

Scenarios: S1 first open on a new device (lands on home). S2 reopen a day later, no changes. S3 reopen after 3 new assets (one character, one Creator image, one top-down tileset). S4 browse the Characters grid fully; S4b the Images grid fully (incremental, after home). S5 open home 30 minutes after the last visit and leave. S6 open a local folder of 8 known assets (3 characters, 2 objects, 1 image, 1 tileset, 1 UI). S7 manual Sync on a device that has seen everything. "30 days" = S1 + 29 × S2.

### 5.1 API calls, real account (1,914 assets)

| Scenario | A | B | C | **D** |
|---|---|---|---|---|
| S1 first open (new device) | 1,240 | 22 | 48 | **17** |
| S2 reopen next day, no changes | 1,235 | 21 | 9 | **9** |
| S3 reopen after 3 new assets | 1,237 | 21 | 36 | **10** |
| S4 browse Characters fully | 0 | 5 | 0 | **5** |
| S4b browse Images fully | 0 | 836 | 819 | **836** (once per device) |
| S5 home only, 30 min later | 1,235 | 21 | 9 | **0** |
| S6 open folder of 8 | 0 | 8 | 0 | **0** |
| S7 manual Sync | 1,235 | 21 | 35 | **35** (worst case) |
| 30 days, one home visit a day | 37,055 | 631 | 309 | **278** |

Reading the table:
- A's S4/S6 zeros are only because it already paid for everything on open.
- C's S4 zero is the same: it paid for the full list sync on S1 (35 pages). D pays 5 pages only if the user actually opens Characters.
- B and D both pay 836 for S4b. The Images grid is the dominant cost in every strategy that shows image thumbnails. D pays it once per device (Cache API); B pays it every session.
- D's S7 is a worst case. D re-lists only the pages it holds, so after a typical day (home + one category) Sync is about 9 + 5 calls.

### 5.2 Preflights and CDN image loads, real account

Format: preflights / CDN image requests. CDN loads are not API calls; repeat loads come from the browser HTTP cache or the Cloudflare edge.

| Scenario | A | B | C | D |
|---|---|---|---|---|
| S1 first open | 19 / 1,196 | 9 / 16 | 19 / 16 | 8 / 16 |
| S2 reopen, no changes | 18 / 0 | 8 / 0 | 8 / 0 | 8 / 0 |
| S3 after 3 new assets | 18 / 2 | 8 / 2 | 16 / 2 | 8 / 2 |
| S4 browse Characters | 0 / 0 | 5 / 478 | 0 / 478 | 5 / 478 |
| S5 home, 30 min later | 18 / 0 | 8 / 0 | 8 / 0 | 0 / 0 |
| S6 folder of 8 | 0 / 0 | 6 / 6 | 0 / 0 | 0 / 0 |
| S7 manual Sync | 18 / 0 | 8 / 0 | 18 / 0 | 18 / 0 |

### 5.3 API calls at scaled sizes (same family mix as the real account)

| Assets | Scenario | A | B | C | **D** |
|---|---|---|---|---|---|
| 100 (9 list pages) | S1 / S2 / S3 / S7 | 74 / 72 / 74 / 72 | 22 / 21 / 21 / 21 | 22 / 9 / 14 / 9 | **17 / 9 / 10 / 9** |
| | 30 days | 2,162 | 631 | 283 | **278** |
| 1,000 (22 pages) | S1 / S2 / S3 / S7 | 652 / 649 / 651 / 649 | 22 / 21 / 21 / 21 | 35 / 9 / 25 / 22 | **17 / 9 / 10 / 22** |
| | 30 days | 19,473 | 631 | 296 | **278** |
| 10,000 (155 pages) | S1 / S2 / S3 / S7 | 6,447 / 6,425 / 6,427 / 6,425 | 22 / 21 / 21 / 21 | 168 / 9 / 134 / 155 | **17 / 9 / 10 / 155** |
| | 30 days | 192,772 | 631 | 429 | **278** |
| | Browse Images fully (S4b) | 0 (paid on open) | 4,365 | 4,279 | **4,365 once** |

**D's open cost does not grow with library size:** 17 on a new device and 9 per later open, at 100 or 10,000 assets. Only browsing (pages scrolled, and Images or Maps thumbnails seen) and manual Sync grow with size.

## 6. Recommended caching design

| What | Where | Lifetime | Refreshed by |
|---|---|---|---|
| Per-family list state `{total, head: first 4 rows, pages: {offset: rows}, checkedAt}` | IndexedDB `lib` | Until Forget or Sync replaces it | Open check (prepend), category scroll (new pages), manual Sync (re-list held pages) |
| User ID for derived URLs | Taken from the first `preview_url` / `image_url` seen; stored with `lib` | Same as `lib` | Re-read on every list response |
| CDN thumbnails (characters, objects, UI, tilesets, Tiles Pro) | **Browser HTTP cache only** (`max-age=31536000`) | Browser-managed | New `?t=` in the list URL when the art changes. A miss costs the CDN, not the API, so no app copy is needed |
| API-only art: Creator image frame 0, map render, isometric PNG | Cache API `vitrine-media-v1`, keyed by asset key | Forever | Viewer "Reload from PixelLab" (per item) |
| "Already loaded this session" | Memory | Tab lifetime | Never re-requested on revisit within the session |

**Open (and tab visible again):**
1. If the last check was less than **1 hour** ago: draw from `lib`, make **no** request.
2. Otherwise send one `limit=4, offset=0` request per family (7 REST in parallel at concurrency 4, then 2 MCP). This first call is also the API-key test on the key screen.
3. Per family, compare with the cache:
   - Same `total` and same first row → unchanged.
   - New rows on top, with the old first row still in the response, and `total` grew by exactly that many → **prepend** them. No more calls.
   - Anything else (deletions, more than 3 new items, a map edited to the top, or an unknown sort order) → drop that family's held pages. They reload lazily when the category is opened. If that category is on screen, reload its first page now.
4. Draw tile counts from `total` and mosaics from the head rows. Tileset thumbnails use the derived CDN path; on an image error, fall back once to the API helper.

**Category grid:** load REST pages of 100 (50 for sidescroller and Tiles Pro; 50 for MCP images) only when the scroll position needs them. Start API-only thumbnails (Images, Maps) after the 300 ms visible dwell already in 05 §5.4, so fast scrolling costs nothing.

**Manual Sync** ("…" menu): re-list every page held in `lib`, plus the open category's first page. Remove assets that disappeared, update names and URLs. Do not touch thumbnails.

**Never:** a `/v2/balance` call on open, background prefetch, polling, detail calls to draw a grid, or the `/mcp/tilesets/…/image` helper for thumbnails when a user ID is known.

**Session-only key mode:** 05 keeps library cards in memory only when the key is not remembered, so every new session there costs S1 (17) instead of S2 (9). Keeping `lib` in IndexedDB in both modes would save 8 calls per session, at the price of leaving asset metadata on the device. That is a privacy decision for the owner (05 D15).

## 7. Risks and unknowns

1. **Read rate limits are unpublished.** 429 is declared on a few REST GETs, with no numbers and an unreadable `Retry-After` [09]. D's open burst is 9 requests at concurrency 4; the Images grid can produce one `get_image` per visible card. Keep 05's backoff and the drop to concurrency 2 after a 429.
2. **The derived CDN paths are undocumented.** They match what `get_tiles_pro`, `get_topdown_tileset` (redirect target) and `get_sidescroller_tileset` (redirect target) return today [live]. Keep the helper fallback on image error, and treat a burst of fallbacks as a signal to stop deriving. The derived top-down sheet path has no `?t=`; tilesets cannot be edited through the public API, so a stale cached sheet is unlikely (inference).
3. **Creator images have no URL in the list.** Each thumbnail is one `get_image` call, which PixelLab annotates as not read-only [09]. This family alone is 43% of the real account. Options for the owner: show Images thumbnails as designed (once per device, dwell-gated), or show a plain placeholder until the user opens an image. Phase 0 P0-9 must still pass before `get_image` is used at all.
4. **Maps need `view_map`, a server-side render**, for each thumbnail. There are only 9 here, but the tool text says some accounts have four-figure map counts. Dwell-gated and cached forever, as with images.
5. **MCP text parsing.** `list_images` and `list_maps` are prose; the header formats seen today match [01]/[09]. A format change breaks the Images and Maps counts. Fail soft per 05 §4.3.
6. **The change check only sees the head of each list.** Not detected on open: renames, deletions balanced by the same number of additions further down, and edits to old assets (for example a new animation on an old character). Manual Sync catches all of them. The grid shows only name and thumbnail, and a changed thumbnail arrives with the next list read that includes the item, so this is acceptable.
7. **Sort order is undocumented for characters, objects, top-down tilesets and isometric tiles.** The prepend rule only trusts a response whose old first row is still present. Any other result falls back to a re-list, so a wrong assumption costs calls, not correctness.
8. **Tileset overlap and the "top-down and sidescroller" REST list.** The home count can be off by the overlap until the lists are fully loaded. If REST `/v2/tilesets` really includes sidescrollers (Phase 0 with a token), drop the sidescroller list.
9. **Not measured live:** REST response bodies (no token in commands). The REST `preview_url` host is assumed to be `backblaze.pixellab.ai` like the MCP URLs [09]. Whether a CDN load costs PixelLab anything beyond bandwidth is inferred, not confirmed.

## Sources

| Source | Status |
|---|---|
| `https://api.pixellab.ai/v2/openapi.json` (dev, 102 paths, 275 schemas): list params, list schemas, descriptions, no batch | verified-live 2026-10-19 |
| 16 read-only MCP calls (table 3.1) | verified-live |
| `curl -sI` / `curl` on `backblaze.pixellab.ai` and the `api.pixellab.ai/mcp/...` helpers; preflights on `/v2/characters` and `/mcp`; JSON-RPC batch test on `/mcp` | verified-live, no token |
| `01-pixellab-api-asset-inventory.md`, `02-browser-integration-and-security.md`, `09-verification-followups.md`, `../design/05-architecture.md` §4–5, `../reviews/R1-research-cross-review.md` D25/D26 | prior docs |
| `../../mockups/full/base/README.md` and shots `01-home`, `03-category-open`, `g1-first-sync` | design reference |

## Appendix: calculator (`calc.py`)

Run with `python calc.py`. The `_check()` self-test runs first. The tables in §5 are its output.

```python
"""Vitrine API-call calculator. Counts authenticated/API-host calls per strategy x scenario.

Inputs are the values measured on 2026-10-19 (see doc 16): list totals, page maxima,
and whether a family's list row is enough to draw a thumbnail.
Output columns: api = requests that reach api.pixellab.ai (REST, MCP, no-auth /mcp helpers);
pre = CORS preflights (OPTIONS, no auth); cdn = backblaze.pixellab.ai image loads from network.
"""
from math import ceil

# family: (measured total, list page max on the surface used, thumbnail source)
#   'list'   -> list row has a CDN URL (REST preview_url / image_url)
#   'derive' -> CDN URL buildable from user id + asset id (measured); naive build hits an API helper/get
#   'helper' -> only an API-host URL exists (iso: max-age 1 year, browser-cacheable)
#   'call'   -> one MCP call per item (get_image / view_map), no URL
FAMILIES = {
    "characters":   (478, 100, "list"),
    "objects":      (213, 100, "list"),
    "ui":           (19, 100, "list"),
    "topdown":      (219, 100, "derive"),
    "sidescroller": (115, 50, "derive"),   # REST max 50 (MCP allows 100)
    "isometric":    (4, 100, "helper"),
    "tiles_pro":    (38, 50, "derive"),
    "images":       (819, 50, "call"),     # MCP only
    "maps":         (9, 100, "call"),      # MCP only
}
MCP = {"images", "maps"}
CATS = {  # home tiles -> families; mosaic shows 4 items from the first family
    "Characters": ["characters"], "Objects": ["objects"], "UI": ["ui"],
    "Tilesets": ["topdown", "sidescroller", "isometric", "tiles_pro"],
    "Images": ["images"], "Maps": ["maps"],
}
MOSAIC = 4
TP_TILES = 4  # Tiles Pro thumbnail = 2x2 of tile_N PNGs (05 sec 5.4)


def scaled(n_total):
    real = sum(t for t, _, _ in FAMILIES.values())
    return {f: (max(1, round(t * n_total / real)) if t else 0, p, k) for f, (t, p, k) in FAMILIES.items()}


def pages(fam, f):
    t, p, _ = fam[f]
    return max(1, ceil(t / p))


def item_api(kind, smart):
    """API calls to get ONE thumbnail the first time. smart = derived CDN URLs (strategy D)."""
    if kind == "list":
        return 0
    if kind == "derive":
        return 0 if smart else 1   # naive: /mcp/tilesets/{id}/image (302, no-cache) or GET /tiles-pro/{id}
    return 1                       # helper or MCP call


def item_cdn(f, kind):
    if kind == "call" or kind == "helper":
        return 0
    return TP_TILES if f == "tiles_pro" else 1


def all_pages(fam):
    return sum(pages(fam, f) for f in fam)


def rest_pre(fam, fams):  # one preflight per distinct REST URL; MCP = one shared URL
    return sum(1 for f in fams if f not in MCP)


def mcp_pre(fams):
    return 1 if any(f in MCP for f in fams) else 0


def home_items(fam):
    """[(family, kind)] for the 6 mosaics x 4 items."""
    return [(CATS[c][0], fam[CATS[c][0]][2]) for c in CATS for _ in range(MOSAIC) if fam[CATS[c][0]][0]]


def scenarios(fam):
    F = list(fam)
    every_item = [(f, fam[f][2]) for f in F for _ in range(fam[f][0])]
    home = home_items(fam)
    n_pages = all_pages(fam)
    full_pre = sum(pages(fam, f) for f in F if f not in MCP) + mcp_pre(F)
    check_pre = rest_pre(fam, F) + mcp_pre(F)
    R = {}

    def cost(items, smart, cached=False):
        api = 0 if cached else sum(item_api(k, smart) for _, k in items)
        cdn = 0 if cached else sum(item_cdn(f, k) for f, k in items)
        return api, cdn

    # ---------- A: sync everything on every open, eager thumbnails for every item ----------
    a_items = cost(every_item, smart=False)
    a_items_reopen = (a_items[0] - fam["isometric"][0], 0)  # iso helper is browser-cached; CDN from HTTP cache
    R["A"] = {
        "S1 first open (new device)": (1 + n_pages + a_items[0], 1 + full_pre, a_items[1]),
        "S2 reopen next day, no changes": (n_pages + a_items_reopen[0], full_pre, 0),
        "S3 reopen after 3 new assets": (n_pages + a_items_reopen[0] + 2, full_pre, 2),
        "S4 browse Characters fully": (0, 0, 0),
        "S4b browse Images fully": (0, 0, 0),
        "S5 home only, 30 min later": (n_pages + a_items_reopen[0], full_pre, 0),
        "S6 open folder of 8": (0, 0, 0),
        "S7 manual Sync": (n_pages + a_items_reopen[0], full_pre, 0),
    }

    # ---------- B: lazy per view, session memory only (05 thumbnails, no persistence) ----------
    home_lists = len(F)  # one limit=4 call per family (Tilesets tile needs 4 counts)
    hb = cost(home, smart=False)
    hb_reopen = (hb[0], 0)  # images/maps/tileset helpers hit the API again; CDN from HTTP cache
    pre_home = rest_pre(fam, F) + mcp_pre(F)
    ch, ci = fam["characters"], fam["images"]
    R["B"] = {
        "S1 first open (new device)": (1 + home_lists + hb[0], 1 + pre_home, hb[1]),
        "S2 reopen next day, no changes": (home_lists + hb_reopen[0], pre_home, 0),
        "S3 reopen after 3 new assets": (home_lists + hb_reopen[0], pre_home, 2),
        "S4 browse Characters fully": (pages(fam, "characters"), pages(fam, "characters"), ch[0]),
        "S4b browse Images fully": (pages(fam, "images") + ci[0], 0, 0),
        "S5 home only, 30 min later": (home_lists + hb_reopen[0], pre_home, 0),
        "S6 open folder of 8": (8, 6, 6),  # 3 char + 2 obj + 1 UI REST gets, 1 get_image, 1 tileset helper
        "S7 manual Sync": (home_lists + hb_reopen[0], pre_home, 0),
    }

    # ---------- C: 05 design + persistent snapshot + limit=1 change check per family ----------
    # first open = full list sync; thumbnails lazy (visible only), cached forever after.
    changed = ["characters", "images", "topdown"]  # S3: 1 new asset in each
    refetch = sum(ceil((fam[f][0] + 1) / fam[f][1]) for f in changed)
    refetch_pre = sum(ceil((fam[f][0] + 1) / fam[f][1]) for f in changed if f not in MCP)
    R["C"] = {
        "S1 first open (new device)": (1 + n_pages + hb[0], 1 + full_pre, hb[1]),
        "S2 reopen next day, no changes": (len(F), check_pre, 0),
        "S3 reopen after 3 new assets": (len(F) + refetch + 2, check_pre + refetch_pre, 2),
        "S4 browse Characters fully": (0, 0, ch[0]),
        "S4b browse Images fully": (ci[0], 0, 0),
        "S5 home only, 30 min later": (len(F), check_pre, 0),
        "S6 open folder of 8": (0, 0, 0),
        "S7 manual Sync": (n_pages, full_pre, 0),
    }

    # ---------- D: lazy + persistent cache + derived CDN URLs; check call = mosaic call ----------
    # Home: one limit=4 call per family is BOTH the change check and the mosaic source.
    # New items: prepended from the check page when (new total - old total) <= 4 - 1 overlap row.
    # 1 h cooldown: no check if the last one was < 1 h ago. Sync = re-list snapshot pages only.
    hd = cost(home, smart=True)
    R["D"] = {
        "S1 first open (new device)": (home_lists + hd[0], pre_home, hd[1]),
        "S2 reopen next day, no changes": (home_lists, pre_home, 0),
        "S3 reopen after 3 new assets": (home_lists + 1, pre_home, 2),  # +1 get_image for the new image
        "S4 browse Characters fully": (pages(fam, "characters"), pages(fam, "characters"), ch[0]),
        "S4b browse Images fully": (pages(fam, "images") + ci[0], 0, 0),
        "S5 home only, 30 min later": (0, 0, 0),
        "S6 open folder of 8": (0, 0, 0),
        "S7 manual Sync": (n_pages, full_pre, 0),  # worst case: everything was browsed before
    }
    return R


def month(R):  # first open + 29 daily reopens with no changes, home only
    return {s: R[s]["S1 first open (new device)"][0] + 29 * R[s]["S2 reopen next day, no changes"][0] for s in R}


def main():
    for label, fam in [("real account (1,914)", FAMILIES), ("100", scaled(100)),
                       ("1,000", scaled(1000)), ("10,000", scaled(10000))]:
        R = scenarios(fam)
        print(f"\n## {label} assets; full list pages = {all_pages(fam)}")
        print("| Scenario | A api/pre/cdn | B api/pre/cdn | C api/pre/cdn | D api/pre/cdn |")
        print("|---|---|---|---|---|")
        for s in R["A"]:
            print(f"| {s} | " + " | ".join("{}/{}/{}".format(*R[k][s]) for k in "ABCD") + " |")
        m = month(R)
        print("| 30 days, daily home visit | " + " | ".join(f"{m[k]} api" for k in "ABCD") + " |")


def _check():
    R = scenarios(FAMILIES)
    assert all_pages(FAMILIES) == 5 + 3 + 1 + 3 + 3 + 1 + 1 + 17 + 1 == 35
    assert R["D"]["S2 reopen next day, no changes"][0] == 9
    assert R["D"]["S1 first open (new device)"][0] == 9 + 8   # 4 get_image + 4 view_map
    assert R["D"]["S1 first open (new device)"][0] < R["C"]["S1 first open (new device)"][0]
    assert all(R["D"][s][0] <= R["C"][s][0] for s in R["D"] if not s.startswith("S4"))


if __name__ == "__main__":
    _check()
    main()
```
