# 09: Verification Follow-ups (read-only round)

Research for **PixelLab Gallery** (working name; unofficial, not affiliated with PixelLab). This round closes specific open questions from `01-pixellab-api-asset-inventory.md`, `02-browser-integration-and-security.md` and `03-pixellab-website-gallery-audit.md`.

- **Test date:** 2026-10-18 local (API server clock 2026-10-19 ~01:53 UTC).
- **Method:**
  - Unauthenticated `curl` against MCP `tools/list`, the REST v2 OpenAPI, PixelLab docs and media hosts. Only headers or error bodies were kept from media hosts.
  - A few **read-only** MCP calls through an authenticated agent session, all annotated `readOnlyHint: true`, with small limits: `list_characters`, `get_character` (`include_preview=false`), `list_images`, `list_ui_assets`, `get_ui_asset` (`include_preview=false`), `list_tiles_pro`, `get_tiles_pro`, `list_projects`, `search_knowledge`.
  - Static reading of PixelLab's public website JavaScript.
  - Reads of sibling-repo docs.
- **Not called:**
  - `get_image`, `get_map_object` and `search_help`, because they are annotated not read-only (see Q1).
  - Any create, edit, delete, save, tag or cancel tool.
  - `get_lip_sync` was attempted once, but the agent session's permission classifier denied it, so it never ran.
- **Redaction:** no tokens, user ID, asset IDs, signed query strings, git URLs, project names, balances or account counts are recorded. URLs appear as host + path pattern only.

Legend: **[live]** = observed in this round. **[contract]** = stated in the live OpenAPI or MCP tool definitions, not exercised. **[code]** = PixelLab production website JavaScript (build `xcvr59o5eI6jiFU9-n2Ll`, still current today). **[01]/[02]/[03]** = finding from that earlier doc, not re-run. **(inference)** = reasoning, not observation.

---

## Summary

1. **Annotations.** Every list/get tool a gallery needs is `readOnlyHint: true` except two: **`get_image`** (readOnly `false`; its description says a completed *job* "reports its gallery save" and retries it) and **`get_map_object`** (readOnly `false`; it "Retries saving finished pixels"). By the description, the save retry applies to raw-image job IDs. Gallery refs have no job, so a `gallery:<id>` read should not save anything (inference), but the annotation covers the whole tool, so the risk cannot be ruled out from outside.
2. **Input schemas.** All tools take flat, typed arguments with `additionalProperties: false`. Pagination is `limit` + `offset` everywhere. The limit maximum is 50 on most tools, 100 on `list_maps` and `list_sidescroller_tilesets`, and 200 on `list_map_objects`. Search exists only on images, maps, map placements, characters and objects. Full table in Q2.
3. **REST image fields.**
   - URLs: character and object `preview_url`, `rotation_urls`, frame URL arrays, object `storage_urls`, UI `image_url`, Tiles Pro `storage_urls`, plus job-result download URLs.
   - Base64: top-down tileset tiles, the isometric tile image, and stateless vocal visemes.
   - No image field at all on the tileset, isometric and Tiles Pro **lists**.
   - The documented example hosts are dead: `supabase.pixellab.ai` and `<project>.supabase.co` answer "Bucket not found", and `cdn.pixellab.ai` does not resolve. Live MCP URLs use `backblaze.pixellab.ai` (ACAO `*`).
4. **Default playback speed.** The best-supported default is **8 fps (125 ms per frame)**: the character-detail player, the Creator gallery player (labelled "8 FPS") and the Creator GIF export (`delay:125`) all use it. Exceptions: library-card hover 5 fps, object detail 150 ms (about 6.7 fps), VFX 12 fps by default, talking 90 ms. No public doc or API states an fps for characters, objects or gallery images.
5. **Projects.** REST v2 has no projects endpoint, no `project` filter and no project field on any response. MCP `list_projects` returns only ID, name, branch and a credential-bearing clone line. **No public tool says which assets belong to a project**, so a project filter cannot be built. Skip it and use local folders.
6. **Multi-frame gallery images.** `list_images` prints `<W>x<H>, <n> frames`, which evidence indicates is the **per-frame** size. The stored sheet is a **cols×rows grid in row-major order**: often a single row, but 3×3 and other grids exist [code]. The grid shape is not exposed by `list_images`, so use `get_image`'s per-frame inline images rather than slicing the sheet. `get_image` was not called this round.
7. **Rate limits.** Nothing is published for reads. 429 "Too many requests" is declared on 3 REST GETs. A burst of 40 unauthenticated reads gave 40 × 401, with no rate-limit headers. The only exposed header is `Content-Disposition`. Throttle to 2–4 concurrent requests with blind exponential backoff.
8. **VFX "My effects", fonts, portraits, vocal animations.** Still **no public list path** in REST or MCP. Website-made fonts, portraits and talking sheets probably appear as **untyped** Creator gallery images (inference from website code). UX: an honest "Not available through PixelLab's public API yet" card linking to the PixelLab page.

---

## Q1. MCP tool annotations and side effects

**Method [live]:** one `POST https://api.pixellab.ai/mcp` with `Content-Type: application/json`, `Accept: application/json, text/event-stream`, and body `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`, with no auth and no `initialize`.
- The reply was HTTP 200 `text/event-stream` with one `data:` line (about 218 KB), carrying **103 tools**, the same count as in 01.
- Each tool has `name`, `description`, `inputSchema`, `annotations` and `_meta` (`{"fastmcp":{"tags":[]}}`).
- There is still **no `outputSchema`** and no annotation `title`.

| Tool | readOnly | destructive | idempotent | openWorld | Side-effect wording in the description (short quotes) |
|---|---|---|---|---|---|
| `list_images` | true | false | true | false | Read. Points to writes ("save_to_asset to save a fix over it") but does none. |
| **`get_image`** | **false** | false | true | false | "A completed job also reports its gallery save"; "while the save is being retried" |
| `list_maps` | true | false | true | false | none |
| `get_map` | true | false | true | false | none (mentions `edit_map` only as a next step) |
| `view_map` | true | false | true | false | "always shows the map's CURRENT state" (renders, no write) |
| `list_map_objects` | true | false | true | false | none (gives IDs that move/remove tools take) |
| **`get_map_object`** | **false** | false | true | false | "Retries saving finished pixels when B2 or database persistence failed." |
| `list_characters` | true | false | true | false | none |
| `get_character` | true | false | true | false | "failed (error+retry)" is a hint for the user, not an automatic retry |
| `list_objects` | true | false | true | false | none |
| `get_object` | true | false | true | false | "failed: error + retry hint" |
| `list_topdown_tilesets` | true | false | true | false | none |
| `get_topdown_tileset` | true | false | true | false | "Download: no auth, the UUID is the key." |
| `list_sidescroller_tilesets` | true | false | true | false | none |
| `get_sidescroller_tileset` | true | false | true | false | none |
| `list_isometric_tiles` | true | false | true | false | none |
| `get_isometric_tile` | true | false | true | false | none |
| `list_tiles_pro` | true | false | true | false | none |
| `get_tiles_pro` | true | false | true | false | none |
| `list_ui_assets` | true | false | true | false | none |
| `get_ui_asset` | true | false | true | false | none |
| `get_font` | true | false | true | false | none |
| `get_portrait_character` | true | false | true | false | none |
| `get_vocal_animation` | true | false | true | false | "On completion the set is saved onto the character" (describes the job, not the getter) |
| `list_projects` | true | false | true | false | Output includes "git clone URLs" (secret-bearing; see Q5) |
| `list_jobs` | true | false | true | false | Points to `cancel_job` ("stuck jobs you can cancel") but does no write itself |
| `get_balance` | true | false | true | false | none |

Other tools that came up:

| Tool | readOnly | idempotent | openWorld | Note |
|---|---|---|---|---|
| `get_lip_sync` | true | true | false | "FREE, and nothing is rendered." Not executed this round (blocked by the session permission classifier). |
| `search_help` | **false** | false | **true** | "A knowledge agent searches our docs". Not called. |
| `search_knowledge` | true | true | false | A Phaser/game-dev tips base. Called once (Q7). |
| `wait_for_jobs` | true | true | false | Not needed by a gallery. |
| `vfx_workbench` | false | false | false | Its export "saves it to the user's My effects". It has **no list command** (Q8). |

**`get_image` assessment:**
- **What it writes:** the description ties saving and save retries to **"a completed job"**, meaning a raw-image job ID from `create_image_*`, `edit_image`, `reduce_colors`, and so on. The `job_id` parameter description adds that `gallery:<id>` refs come from `list_images` and "images made on the website have no job id". Nothing in the text says a `gallery:` read caches, saves or retries anything.
- **Risk with `gallery:<id>`:** low (inference), because there is no job whose save could be retried. It is not provably zero: the annotation applies to the whole tool, and server internals are not visible. Doc 01 called it on gallery refs and saw only reads, but did not record before/after gallery state.
- **This round:** not called, as instructed, because the annotation and text show possible writes for job IDs.
- **Correction to 01:** 01 listed `get_map_object` among its "live read-only MCP calls". It is annotated **not read-only**. The gallery does not need it, because map objects appear in `list_objects` / `get_object` as 1-direction objects [01].

---

## Q2. Input schemas (for the app's MCP client)

All tools: JSON-RPC `tools/call` with `params.arguments`, `additionalProperties: false`. "≥0" means `minimum: 0`.

| Tool | Required | Optional (type, limits, default) | Pagination |
|---|---|---|---|
| `list_images` | — | `limit` int 1–50 (10), `offset` int ≥0 (0), `search` string\|null (matches description or ID, case-insensitive) | limit/offset; newest first |
| `get_image` | `job_id` string (`gallery:<id>` or a raw-image job ID) | `index` int\|null: return only that frame inline | `index` reaches frames past "the first few" |
| `list_maps` | — | `limit` 1–100 (20), `offset` ≥0, `search` string\|null (name contains) | limit/offset; most recently edited first |
| `get_map` | `map_id` | `x`, `y`, `width`, `height` int\|null (crop, in cells; may be negative) | — |
| `view_map` | `map_id` | `x`, `y`, `width`, `height` int\|null | — |
| `list_map_objects` | `map_id` | `search` string\|null, `limit` 1–200 (50), `offset` ≥0 | limit/offset |
| `get_map_object` | `object_id` | — | — (do not call; Q1) |
| `list_characters` | — | `limit` 1–50 (10), `offset` ≥0, `tags` comma-separated string (ANY), `search` (name + creation description) | limit/offset |
| `get_character` | `character_id` | `include_preview` bool (true) | — |
| `list_objects` | — | `limit` 1–50 (10), `offset` ≥0, `tags` (ANY), `status_filter` (`completed`\|`review`\|`pending`\|`processing`\|`failed`), `search` | limit/offset |
| `get_object` | `object_id` | `include_preview` bool (true) | — |
| `list_topdown_tilesets` | — | `limit` 1–50 (10), `offset` ≥0 | limit/offset |
| `get_topdown_tileset` | `tileset_id` | — | — |
| `list_sidescroller_tilesets` | — | `limit` 1–**100** (20), `offset` ≥0 | limit/offset |
| `get_sidescroller_tileset` | `tileset_id` | — | — |
| `list_isometric_tiles` | — | `limit` 1–50 (10), `offset` ≥0 | limit/offset |
| `get_isometric_tile` | `tile_id` | — | — |
| `list_tiles_pro` | — | `limit` 1–50 (10), `offset` ≥0 | limit/offset |
| `get_tiles_pro` | `tile_id` | — | — |
| `list_ui_assets` | — | `limit` 1–50 (10), `offset` ≥0 | limit/offset |
| `get_ui_asset` | `ui_asset_id` | `include_preview` bool (true) | — |
| `get_font` / `get_portrait_character` / `get_vocal_animation` | `job_id` | — | — (job rows expire ~8 h after finishing [01]) |
| `list_projects` | — | — | none (returns all) |
| `list_jobs` | — | `include_recent` bool (false; adds the last 30 min) | — |
| `get_balance` | — | — | — |

- **Output format [live]:** results are prose text (plus image blocks when previews are on). The list headers seen this round were `characters: N total`, `gallery images: N total` / `showing a-b of N`, `ui assets: N total`, `tiles_pro: N total`, plus a `next: <tool>(offset=…)` hint.
- **Payload size:** pass `include_preview=false` on `get_character`, `get_object` and `get_ui_asset` to keep responses small.
- **REST v2 list parameters [contract], for comparison:** `limit` + `offset` only. Defaults and maxima:
  - Characters, objects, isometric tiles, UI assets and `GET /tilesets`: default 50, max 100.
  - `GET /tilesets-sidescroller` and `GET /tiles-pro`: default 10, max 50.
  - No search, tag, sort or project parameters.

---

## Q3. REST v2 image-bearing fields and media hosts

**Method:** walked every `GET` path's `200` schema in `https://api.pixellab.ai/v2/openapi.json` (`info.version: "dev"`, 102 paths, 275 schemas, unchanged from 01) **[contract]**.

| Family | Endpoint | Field | URL or base64 | Notes |
|---|---|---|---|---|
| Characters | `GET /characters` | `characters[].preview_url` | URL \| null | South sprite; null unless `completed` |
| | `GET /characters/{id}` | `rotation_urls.{south,west,east,north}` | URL | Diagonals URL \| null (8-dir only). The whole object is null unless `completed` |
| | | `animations[].directions[].frames[]` | URL[] | "Public URLs for each frame in order"; plus `frame_count` |
| Objects | `GET /objects` | `objects[].preview_url` | URL \| null | South, or `unknown` for 1-dir |
| | `GET /objects/{id}` | `rotation_urls.*` (8 keys, all nullable) | URL \| null | All null for 1-dir objects |
| | | `storage_urls` (raw map) | URL map | `unknown` for 1-dir; `frame_N` keys while `review` |
| | | `frame_urls[]` | URL[] \| null | Review candidates |
| | | `animations[].directions[].storage_urls.frames[]` | URL[] | Plus group-level `frame_count` |
| Map objects | `GET /map-objects/{id}` | `download_url` | URL \| null (no auth) | Doc still says "auto-delete after 8 hours" (contradicted by live evidence [01]) |
| Top-down tilesets | `GET /tilesets` | — | — | **No image field in the list** |
| | `GET /tilesets/{id}` | `tileset.tiles[].image` | **base64** (`{type:"base64", base64, format}`) | Every tile inline (16 or 25) |
| Sidescroller tilesets | `GET /tilesets-sidescroller` | — | — | No image field |
| | `GET /tilesets-sidescroller/{id}` | — | — | 200 schema is `{}` (undocumented) |
| Isometric tiles | `GET /isometric-tiles` | — | — | No image field |
| | `GET /isometric-tiles/{id}` | `image` | **base64** | The only field (plus `usage`) |
| Tiles Pro | `GET /tiles-pro` | — | — | No image field |
| | `GET /tiles-pro/{id}` | `storage_urls.{tile_0…}` | URL map | Plus `kind`, `tile_rules` |
| UI assets | `GET /ui-assets` and `/{id}` | `image_url` | URL \| null | Null while processing |
| Fonts (job) | `GET /generate-font-pro/{job_id}` | `download_atlas_url`, `download_ttf_url` | URL (no auth) | Only when `completed` |
| Portrait ↔ character (job) | `GET /portrait-character-pro/{job_id}` | `download_url` | URL (no auth) | |
| Vocal (job) | `GET /vocal-animation/{job_id}` | `grid_url` | URL | Spritesheet; columns = `viseme_order` |
| | | `visemes.{id}` | **base64** | Stateless (`portrait`) jobs only |
| Background job | `GET /background-jobs/{id}` | `last_response` | free-form object | VFX files appear here [01] |
| Exports | `/characters/{id}/zip`, `/characters/{id}/spritesheet`, `/objects/{id}/spritesheet` | — | binary ZIP | The export contract documents no fps or duration field |

**Implication:** a REST list gives a thumbnail only for **characters, objects and UI assets**. Tilesets, isometric tiles and Tiles Pro need a per-item fetch for a thumbnail. Cheapest options:
- Top-down tilesets: the no-auth MCP helper `/mcp/tilesets/{id}/image?inline=true`, which the live `get_topdown_tileset` description documents.
- Sidescroller tilesets: `/mcp/sidescroller-tilesets/{id}/image`.
- Isometric tiles: `/mcp/isometric-tile/{id}/download` [01].
- Tiles Pro: an authenticated `GET /tiles-pro/{id}` for `tile_0`.

**Documented vs live hosts [live].** Real URLs came only from read-only MCP calls. To test the REST example hosts, the path of a live backblaze file was replayed on each documented host.

| Host + path pattern | Where it appears | Result (`curl -sI -H "Origin: http://localhost:5173"`) | CORS |
|---|---|---|---|
| `backblaze.pixellab.ai/file/pixellab-characters/<user>/<character>/rotations/<dir>.png` (`?t=` = unix seconds) | MCP `get_character` | 200 `image/png`, `Cache-Control: public, max-age=31536000` (also without `?t=`) | `Access-Control-Allow-Origin: *` |
| `backblaze.pixellab.ai/file/pixellab-characters/<user>/<character>/animations/<row>/<dir>/<i>.png` (`?t=` = unix ms) | MCP `get_character` | same as rotations [02] | ACAO `*` [02] |
| `backblaze.pixellab.ai/file/pixellab-characters/ui/<user>/<ui>/full.png` (`?t=` ms) | MCP `get_ui_asset` | 200 `image/png`, max-age 1 year | ACAO `*` |
| `backblaze.pixellab.ai/file/pixellab-tiles/<user>/<tiles_pro>/tile_<n>.png` (no `?t=`) | MCP `get_tiles_pro` | 200 `image/png`, max-age 1 year | ACAO `*` |
| `supabase.pixellab.ai/storage/v1/object/public/pixellab-characters/…` | OpenAPI examples | **400**, JSON `"Bucket not found"` | ACAO `*` (on the error) |
| `<project>.supabase.co/storage/v1/object/public/pixellab-characters/…` | OpenAPI example | **400** `"Bucket not found"` | ACAO `*` |
| `cdn.pixellab.ai/objects/…` | OpenAPI examples | **DNS NXDOMAIN** | — |
| `s3.eu-central-003.backblazeb2.com/pixellab-generations/production/creator/…` (presigned, 7 days) | MCP `get_image` `download_url` [01] | Unsigned placeholder path: OPTIONS 403, HEAD 401 | **No ACAO** |
| `api.pixellab.ai/mcp/{characters,objects,tilesets,…}/…` helpers | MCP `get_*` text | 200/302 with reflected origin [01][02] | yes |

**Conclusion:** the REST example hosts are stale documentation, not live alternatives. Live media is `backblaze.pixellab.ai`. That REST bodies use it too is very likely (inference) but unverified until a tokened call (Phase 0).

---

## Q4. Default animation playback speed

**Method [code]:**
- Fetched `https://www.pixellab.ai/`; `buildId` is still `xcvr59o5eI6jiFU9-n2Ll`.
- Fetched `/_next/static/<build>/_buildManifest.js` and downloaded its 187 chunk references (164 unique files) for static grep. None were executed.
- Searched for `frameRate`, `fps`, `setInterval`, `requestAnimationFrame` and GIF `delay`.

| Website surface | Evidence | Timing |
|---|---|---|
| **Character detail → Animations card** | `7929-…` renders the shared `PixelArtCanvas` (module `17606` in `7606-…`) with `animate` but **no `frameRate`**. The component default is `frameRate:x=8`, advancing on rAF every `1e3/frameRate` ms | **8 fps / 125 ms** |
| Character library card (hover) | `1961-…` passes `frameRate:5` | 5 fps / 200 ms |
| **Object detail → Animations** | `2022-…`: a shared frame counter `setInterval(…,150)`, playing by default | ~6.7 fps / 150 ms |
| Rotation hover spin (character/object) | `7929-…`, `2022-…` `setInterval(…,220)`; another rotation cycle at 400 ms; card rotation previews at 300 ms (`6886-…`, `2022-…`) | 220–400 ms |
| **Creator gallery stage** (desktop and mobile) | `pages/create-…`: `setInterval(…,125)`; mobile counter label `"<i>/<n> · 8 FPS"` | **8 fps / 125 ms** |
| **Creator GIF export** | `pages/create-…`: `writeFrame(…,{…delay:125…})` | **125 ms per frame** |
| Template "Movement preview" | `4740-…`: `setInterval(…,125)` + label `"8 fps preview"` | 8 fps |
| Creator tool-result frame preview | `pages/create-…` `rF`: `setInterval(…,100)` | 10 fps |
| VFX Creator | `pages/create-vfx-…`: `fps` default **12** (slider 4–30 "Speed"); GIF delay `Math.round(1e3/fps)` | 12 fps (per-effect) |
| Talking / vocal | `2938-…`: "Speed · Nms / frame" slider 50–300 ms; MCP/REST `frame_ms` default **90** [contract] | ~11 fps |
| Character/object "Download as GIF" | Server-side, website-only routes (`/animation/<id>/direction/<dir>/export/gif`, `/object-animation/<id>/export/gif`) | Unknown; not usable |

- **Docs:** no fps or frame duration for character, object or gallery animations in `https://www.pixellab.ai/llms-full.txt`, `https://api.pixellab.ai/mcp/docs` (footer "Generated: 2026-10-18 19:12"), `https://api.pixellab.ai/v2/llms.txt`, or the OpenAPI export descriptions. The spritesheet JSON is documented as "cell size, sheet size, column count, and a row-by-row map". The REST/MCP docs give timing only for talking (90 ms) and VFX (job `fps`).
- **Sibling repo:**
  - `../pixellab-pip/skills/pixellab-pip/references/animation.md` states no playback fps.
  - `../pixellab-pip/docs/pixellab/` treats timing as an assembly choice: cinematics at 100 ms per frame; VFX recipes at 12 or 16 fps (`pixellab-vfx-workbench-research.md`).
  - pip's own preview-app plan defaults sheets to 12 fps. That is pip's choice, not a PixelLab fact.
- **Best-supported default:** **8 fps (125 ms per frame)** for characters, objects and Creator gallery animations. It matches PixelLab's character detail player, Creator player and Creator GIF export. For VFX use the effect's own `fps` when known (12 if unknown); for talking use 90 ms. Keep a user fps control, since the API gives no timing.

---

## Q5. Projects

- **REST v2 [contract]:**
  - No path contains `project`, and no list or get endpoint has a project query parameter.
  - No response schema has a project field: `CharacterSummary`, `CharacterDetail`, `ObjectSummary` and `ObjectDetail` have none.
  - `project_id` appears only in a few **request** bodies (write side, for example `CreateUIAssetRequest` and some Pro Flash requests). MCP create tools similarly take a `project_id`, described as "Internal Game Builder project context".
- **MCP `list_projects` [live], structure only (values redacted):**

  ```
  <N> projects:

  <project uuid> <project name> [<branch>]
    git clone <URL with a credential in the userinfo part — REDACTED>

  Push changes with: git push origin <branch>
  ```

  Fields: project ID, name and branch. The clone line embeds a credential [01] and must never be stored, shown or logged.
- **Asset membership:** no read path. `add_to_project` and `remove_from_project` are writes. No list tool takes a project filter, and the character/object REST and MCP outputs show no project.
- **Website:** it keeps `project_ids` and `filed_project_id` on gallery records and uses `?project_id=` on private routes [code][01]. Not usable.
- **Can the gallery show a project filter?** **No.** It could list project names without touching the git URL (parse only the `<uuid> <name> [<branch>]` lines and drop any line containing `git clone` or `@` before anything is stored). But with no membership data a filter would match nothing. Recommendation: leave projects out; local folders cover organization.

---

## Q6. Multi-frame Creator gallery images

`get_image` was **not** called (Q1). Evidence comes from `list_images`, earlier observations, and website code.

- **`list_images` [live]:** the row format is `gallery:<id> | <description> | <W>x<H>[, <n> frames] | <yyyy-mm-dd>`. In 30 recent rows, three were multi-frame: `23x92, 4 frames`, `192x216, 2 frames` and `12x24, 2 frames`. Odd single-frame sizes such as `256x1` also exist.
- **Earlier `get_image` observation [01]:** for the `23x92, 4 frames` item, four separate inline image blocks arrived, and the presigned `image.png` header read **92×92**. 92 = 4 × 23 wide by 92 tall, which is exactly a 4×1 strip of 23×92 frames. So the listed `WxH` is the **per-frame size**, not the sheet size. This reverses 01's "listed size may not equal frame size".
- **Website code [code]:**
  - Creator records carry `spritesheet_data` with `frames`/`frameCount`, `gridSize` (string `"<cols>x<rows>"`) and optional `moods`.
  - The website builds the sheet on a canvas of `frameW*cols × frameH*rows`, drawing frame `i` at `(i % cols * frameW, floor(i / cols) * frameH)`: **row-major grid**.
  - It derives frame size as `floor(width/cols) × floor(height/rows)`.
  - Known non-strip grids: `"3x3"` with 8 frames (8-rotation results), vocal-animation sheets with moods, and output grids of `2x2`, `4x4` and `8x8`.
- **Conclusion:** frame count and frame size come from `list_images`. The **sheet layout varies**: often one row, sometimes a square-ish grid with unused cells, and `list_images` does not expose `cols×rows`.
  - Display and export from `get_image`'s **one inline base64 PNG per frame**. Use `index` to fetch frames past "the first few".
  - Fallback if only the sheet is available: cols = sheetW / frameW, rows = sheetH / frameH, then take the first *n* cells row-major. The sheet's dimensions can be read from `<img>.naturalWidth/Height`, because the presigned host has no CORS and blocks pixel access.

---

## Q7. Read rate limits

| Source | Finding |
|---|---|
| OpenAPI [contract] | Read routes declaring 429 "Too many requests": only `GET /characters`, `GET /characters/{id}`, `GET /background-jobs/{id}`. Other 429/529 variants ("Too many concurrent jobs", "Rate limit exceeded", and so on) are on **generation** routes. No numbers, no `Retry-After` semantics for reads. |
| Docs [live] | `llms-full.txt`, MCP docs and `v2/llms.txt` contain no read rate limit (the only hit is an `animate_character` note about a "rate-limited call" landing 5/8 directions). |
| Observation [live] | 40 unauthenticated `GET /v2/characters?limit=1` at concurrency 8 → **40 × 401**, no 429. No `X-RateLimit-*`, `RateLimit` or `Retry-After` headers. `access-control-expose-headers: Content-Disposition` only. (The auth check may run before any limiter, so this says little about authenticated limits.) |
| MCP help | `search_help` not called (`readOnlyHint: false`, `openWorldHint: true`). `search_knowledge` (read-only) → "0 tips matched"; it covers Phaser/game-dev only. |
| Web / Discord | A web search found nothing PixelLab-specific. Discord was not accessible. |
| Sibling repo | About 8 concurrent **generation** jobs observed on Tier 2 (`../pixellab-pip/docs/pixellab/pixellab-16px-item-sprite-generation-spike.md`). This concerns jobs, not reads. |
| Website behaviour [code] | PixelLab's own client pages `GET /creator/images` at `limit=500` (up to 200 pages) and characters at `limit=100` (website-internal routes), which suggests bulk reads are tolerated (inference). |

**Recommendation:** 2–4 concurrent requests, list pages at maximum size, lazy detail fetches, and exponential backoff with jitter on 429/529. JavaScript cannot read `Retry-After` because it is not exposed.

---

## Q8. VFX "My effects", fonts, portraits, talking/vocal animations

| Asset | REST list | MCP list | Other public read | Minimal honest UX |
|---|---|---|---|---|
| VFX "My effects" | none | none (`vfx_workbench` has no list; export only "saves it to the user's My effects") | Job result only, for about 8 h [01] | Card: "Effects aren't available through PixelLab's public API yet." → link `https://www.pixellab.ai/create-vfx` |
| Fonts | none | none | `get_font(job_id)` / `GET /generate-font-pro/{job_id}` while the job row lives | Same card → `https://www.pixellab.ai/create?tool=generate_font`. Website-made font atlases probably appear as ordinary Images (inference [code]) |
| Portrait ↔ character | none | none | `get_portrait_character(job_id)` / REST job getter | Same card → `https://www.pixellab.ai/create?tool=portrait_character` |
| Portrait attached to a character | none | none | none (no field on `CharacterDetail`) | On character detail: "Portrait not exposed by the public API" → link to `/create-character/<id>` |
| Talking / vocal animations | none | none | `get_vocal_animation(job_id)`; per character `get_lip_sync(character_id, text)` returns `grid_url` (free, read-only annotation; not executed this round) | Character detail could offer an opt-in "Load mouth sheet" via `get_lip_sync` after Phase 0 confirms it. Otherwise the same card → `https://www.pixellab.ai/create?tool=vocal_animation` |

The cross-check found no `list_effects`, `list_fonts`, `list_portraits` or `list_vocal*` in the 103 unauthenticated tools or the larger authenticated tool set, and no matching `GET` path among the 102 REST paths. Website Creator code saves vocal sheets to the gallery (`model:"vocal_animation"`, with `gridSize` and `moods`) and offers "Font (.ttf)" export from gallery items. So those website-made results likely show up in `list_images` as untyped images [code].

---

## Implications for the gallery app

1. **Gate MCP calls on annotations at runtime.** Fetch `tools/list` once, and call only tools whose `readOnlyHint === true`. The single explicit exception is `get_image` with arguments matching `^gallery:`. Never pass it a raw job ID. That is a few lines of code and enforces the view-only promise even if PixelLab re-annotates tools.
2. **Drop `get_map_object`.** Map objects come through `list_objects` / `get_object`.
3. **The Creator Images tab depends on `get_image`.** It is the only public path to gallery pixels. Keep it behind a clearly labelled setting ("PixelLab marks this tool as possibly writing; for gallery images it only reads, as far as we can tell") until Phase 0 check 5 passes.
4. **Thumbnails:**
   - REST lists give thumbnails only for characters, objects and UI.
   - Top-down and sidescroller tilesets: no-auth MCP helper URLs built from the ID.
   - Isometric tiles: `/mcp/isometric-tile/{id}/download`.
   - Tiles Pro: lazy authenticated `GET /tiles-pro/{id}` for `tile_0`.
5. **CSP `img-src` / `connect-src`:** `https://api.pixellab.ai`, `https://backblaze.pixellab.ai`, `https://s3.eu-central-003.backblazeb2.com` (display only), `data:`, `blob:`. Do **not** add `supabase.pixellab.ai` or `cdn.pixellab.ai`; they are dead documentation hosts.
6. **Default playback 8 fps (125 ms).** A user fps control is still needed. VFX uses its own fps (12 default); talking uses 90 ms.
7. **No project filter.** Do not call `list_projects` in the MVP. If it is ever used, parse only the ID, name and branch line and discard the clone line before storage.
8. **Multi-frame gallery images:** treat the listed `WxH` as frame size; use inline frames plus `index`; and slice a sheet only with cols = sheetW/frameW, rows = sheetH/frameH, row-major.
9. **Throttle reads:** concurrency 2–4 with blind exponential backoff.
10. **Unavailable types** (effects, fonts, portraits, vocal) get honest cards with deep links, not empty grids.

---

## Still unverified (Phase 0, with a real token in the browser app)

Run these in the dev build, with DevTools open and the token entered in the app (never in a URL or command):

1. **REST media hosts:** `GET /v2/characters?limit=1`, `/v2/characters/{id}`, `/v2/objects?limit=1`, `/v2/ui-assets?limit=1` and `/v2/tiles-pro/{id}`. Record the **host and path pattern** of `preview_url`, `rotation_urls`, `frames[]`, `image_url` and `storage_urls` (expected: `backblaze.pixellab.ai`). Confirm each loads under the CSP with `crossorigin="anonymous"`.
2. **Sidescroller get body:** the JSON shape of `GET /v2/tilesets-sidescroller/{id}` (schema `{}`).
3. **Error and cache headers:** the invalid-token 401 body (use a deliberately wrong token), plus `ETag` / `Cache-Control` on authenticated JSON.
4. **Read throughput:** a full list sync at maximum page sizes with concurrency 4, then about 100 lazy detail fetches at concurrency 4. Log any 429/529, its body, and the request rate at which it appeared.
5. **`get_image` side-effect check** (only after the user accepts the gray area):
   - Before: `list_images(limit=5)` and note the total and the top 5 refs.
   - Call `get_image("gallery:<id>")` twice on a multi-frame item, then `list_images(limit=5)` again. **The total, order and top refs must be unchanged.** Also confirm the item still looks the same on the website.
   - While at it, record: the inline frame count vs the listed `n frames`; the inline frame size vs the listed `WxH`; the sheet size from `<img>.naturalWidth/Height` of `download_url` (derive cols×rows); how many frames arrive inline without `index`; and `index` behaviour. Prefer a `3x3` 8-rotation item and a vocal-animation item if present.
6. **`get_lip_sync`:** call it on a character that has a vocal animation and on one without. Confirm `grid_url`, `viseme_order` and row/mood metadata, and the error shape (free, annotated read-only).
7. **Export timing metadata:** whether the character ZIP `metadata.json` or the spritesheet `<name>.json` carries any fps or duration field. This needs a download the user approves.
8. **Authenticated `tools/list`:** confirm the gallery tools carry the same annotations as the unauthenticated list (the authenticated inventory is larger).

---

## Sources

| Source | Status |
|---|---|
| `POST https://api.pixellab.ai/mcp` `tools/list`, unauthenticated (103 tools; annotations, descriptions, inputSchema) | verified-live 2026-10-18 |
| `https://api.pixellab.ai/v2/openapi.json` (`dev`, 102 paths, 275 schemas) | verified-live |
| `https://api.pixellab.ai/v2/llms.txt`, `https://api.pixellab.ai/mcp/docs` (generated 2026-10-18 19:12), `https://www.pixellab.ai/llms-full.txt` | verified-live (searched for fps and rate limits) |
| Read-only MCP calls: `list_characters`, `get_character` (no preview), `list_images`, `list_ui_assets`, `get_ui_asset` (no preview), `list_tiles_pro`, `get_tiles_pro`, `list_projects`, `search_knowledge` | verified-live |
| `curl -sI -H "Origin: http://localhost:5173"` on `backblaze.pixellab.ai` (rotation, UI, Tiles Pro paths), `supabase.pixellab.ai`, `<project>.supabase.co`, `cdn.pixellab.ai` (DNS), `s3.eu-central-003.backblazeb2.com` (placeholder path, OPTIONS/HEAD) | verified-live |
| Unauthenticated burst: 40 × `GET https://api.pixellab.ai/v2/characters?limit=1` | verified-live |
| PixelLab website JS, build `xcvr59o5eI6jiFU9-n2Ll`: `chunks/7606-8b83e1e39c3045f5.js` (PixelArtCanvas), `chunks/7929-ccc6ad1cc1b83b01.js` (character detail), `chunks/1961-766336b71c587813.js` (character card), `chunks/2022-6aeff3c718338081.js` (object detail), `chunks/6886-814bf9fb6bc6df36.js`, `chunks/4740-b102bb2d06e284b7.js` (movement preview), `chunks/2938-04e946021ab01ffe.js` (talking), `chunks/9717-d5768d5abdc2147d.js` (Creator gallery records), `chunks/pages/create-5cd845ce8439fc0a.js`, `chunks/pages/create-vfx-72f7b6a616678d81.js` | verified-live (static read) |
| Web search "PixelLab API rate limit" | no PixelLab-specific result |
| `../pixellab-pip/skills/pixellab-pip/references/animation.md`, `references/vocal-animation.md`, `references/job-lifecycle.md` | repo-claim |
| `../pixellab-pip/docs/pixellab/pixellab-cinematic-spike.md`, `pixellab-vfx-workbench-research.md`, `pixellab-16px-item-sprite-generation-spike.md`, `../pixellab-pip/docs/plans/pixellab-preview-app-plan.md` | repo-claim |
| `01-pixellab-api-asset-inventory.md`, `02-browser-integration-and-security.md`, `03-pixellab-website-gallery-audit.md` (this repo) | prior research; cited as [01]/[02]/[03] |
