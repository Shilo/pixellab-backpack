# 01 — PixelLab API Asset Inventory (read-only client)

Research spike for **PixelLab Gallery** (working name; unofficial, not affiliated with PixelLab).

- Research date: 2026-10-18 local (API server clock read 2026-10-19 ~01:35 UTC).
- Live contract snapshot: REST v2 OpenAPI `info.version: "dev"`, **102 paths / 275 schemas**. MCP docs page footer says "Generated: 2026-10-18 19:21". Unauthenticated MCP `tools/list` returned 103 tools. The authenticated session exposed more tools (sandbox, chat, and similar); the sibling repo counts 118 MCP tools.
- Method: unauthenticated `curl` against the OpenAPI, llms.txt, MCP docs, CORS preflights, and no-auth download URLs (headers only, or a few bytes); **live read-only MCP tool calls** through an authenticated agent session; reads of sibling-repo research. **No REST call carried a token** (the hard constraint forbade a token in any command), so REST response shapes below come from the OpenAPI contract, not from live REST bodies, unless marked otherwise.
- Personal values (names, prompts, IDs, balances, user ID, project names) are replaced with placeholders. Asset UUIDs are left out on purpose: several download URLs use the UUID as the only access key (see Summary).

Legend: **[live]** = verified on 2026-10-18 by a live call or fetch. **[contract]** = stated in the live OpenAPI or MCP docs fetched that day but not exercised. **[repo]** = claim from sibling-repo research, not re-verified.

---

## Summary

1. **REST v2 has JSON list and get routes for 7 asset families:** characters, objects, top-down tilesets, sidescroller tilesets, isometric tiles, Tiles Pro, and UI assets. Pagination is `limit` + `offset` with a `total` count. There are **no search, tag, status, or sort parameters** on any REST list. Map objects have a REST get but no REST list; they also appear in the objects list **[live via MCP]**. Fonts, portrait conversions, and vocal animations have only job-ID getters. **[contract]**
2. **Creator gallery images are MCP-only.** `list_images` returns paged text with `gallery:<id>` refs; `get_image("gallery:<id>")` returns inline base64 PNG frames plus a JSON line with `asset_id`, `frames`, and `download_url`. REST v2 has no images or gallery path (all 102 paths checked). **[live]**
3. **Maps (Map Workshop), map placements, Game Builder projects, and the active-jobs list are MCP-only.** Maps can be read as an ASCII grid (`get_map`) or a rendered image (`view_map`). There is no map JSON export. **[live]**
4. **No public read path at all:** VFX effects ("My effects"), font library, portrait library, the portrait attached to a character, uploads, UI screen layouts, and website "Tile groups". Fonts and portrait/vocal jobs can be read only by job ID, and job rows are deleted about 8 h after they finish. **[live + contract]**
5. **Most media is delivered as public, non-expiring, unsigned URLs** on `backblaze.pixellab.ai` (Cloudflare, `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=31536000`), with a `?t=` cache-buster. The exceptions are top-down tileset tiles and isometric tiles, which the REST getters return as **base64**, and Creator gallery downloads, which are **S3 presigned URLs** on `s3.eu-central-003.backblazeb2.com` with `X-Amz-Expires=604800` (7 days) and **no CORS headers**. **[live]**
6. **Official bundle exports exist and work without auth.** REST `GET /v2/characters/{id}/zip` and `/spritesheet` returned 200 with no token **[live]**; REST `GET /v2/objects/{id}/spritesheet` requires a bearer token (401 without one) **[live]**. MCP getters print no-auth links under `https://api.pixellab.ai/mcp/...`: character ZIP and spritesheet, object PNG or spritesheet, map-object PNG, tileset sheet PNG and metadata JSON, isometric tile PNG, Tiles Pro ZIP, and UI asset PNG. All returned 200 or 302 with CORS **[live]**.
7. **A browser can call both surfaces directly.** `api.pixellab.ai` reflects any `Origin` with `Access-Control-Allow-Credentials: true`, allows the `authorization` header (and the MCP headers on `/mcp`), and caches preflights for 600 s. It exposes **only `Content-Disposition`**, so JavaScript cannot read `Retry-After`. **[live]**
8. **MCP over HTTP is stateless JSON-RPC answered as SSE.** `tools/list` and `tools/call` work without `initialize`, and no `mcp-session-id` is issued. Responses are always `text/event-stream`, even with `Accept: application/json`. Tool results are human-readable **text** (no `outputSchema`/`structuredContent`) plus `image` blocks, so a browser client must parse text. `get_image` is the exception: it emits one JSON text block. **[live]**
9. **Metadata gaps that matter for the detail view:** animations have **no fps or per-frame timing** (characters, objects, gallery); characters and objects expose **no seed and no model/mode**; only characters have `updated_at`; only characters and objects have `tags`. The REST isometric-tile get returns **only the image**; metadata comes from the list summary or MCP. **[contract + live]**
10. **The cheapest token check is `GET /v2/balance`.** It is free, returns JSON, is CORS-enabled, and returns 401 `{"detail":"Not authenticated"}` without a token. There is **no user-info endpoint** (no email, username, or user ID); the user ID appears only inside storage URLs. **[live + contract]**
11. **Security facts the app must honour.** Asset UUIDs are bearer-like capabilities, because no-auth ZIP and PNG links accept the bare UUID. `list_projects` output contains a **git clone URL with a credential embedded in the userinfo part**, which must never be shown, logged, or cached. **[live]**
12. **Contract drift found live.** The REST docs still say map objects "auto-delete 8h after creation", but a map object created months earlier still resolves and the MCP docs call them permanent. One tileset ID appeared in **both** MCP top-down and sidescroller lists, and both getters "succeeded" with contradictory views. The REST docs' example hosts (`supabase.pixellab.ai`, `cdn.pixellab.ai`) differ from the live URLs (`backblaze.pixellab.ai`). **[live]**

---

## Asset-type matrix

Pagination maxima are schema limits. "No-auth link" means the URL works with no token; the UUID is the key.

| Asset type | REST list | REST get | MCP list / get | Pagination | Media delivery | Key metadata | Notes |
|---|---|---|---|---|---|---|---|
| **Characters** (one row per state) | `GET /v2/characters` | `GET /v2/characters/{id}` | `list_characters` / `get_character` | REST `limit` 1–100 (def 50), `offset`; MCP `limit` 1–50 (def 10), `offset`, `search`, `tags` (ANY) | Rotation and frame PNG URLs on `backblaze.pixellab.ai`; ZIP `GET /v2/characters/{id}/zip` (no auth, all states, `?states=` filter); spritesheet ZIP `GET /v2/characters/{id}/spritesheet` (no auth, this state only); MCP `/mcp/characters/{id}/download` and `/spritesheet` | id, name, state_name, group_id, prompt, size, directions 4/8, view, template_id, status, created_at, **updated_at**, animation_count, tags, style_settings, guidance, ai_freedom, skeletons, animations[] | Animations, with every frame URL, are **detail-only**; the list gives `animation_count` and `preview_url` (south) |
| **Character animations** (child) | — (inside character detail) | inside `GET /v2/characters/{id}` → `animations[]` | inside `get_character` text | — | One PNG per frame per direction | animation_type, display_name, animation_group_id, per-direction frame_count + frames[] | **No fps/duration.** Each direction has its own storage row UUID in the URL path |
| **Objects** (1/4/8-dir, states, review) | `GET /v2/objects` | `GET /v2/objects/{id}` | `list_objects` (+`search`, `tags`, `status_filter`) / `get_object` | REST 1–100 (def 50); MCP 1–50 (def 10) | Rotation URLs (1-dir: all null; use `storage_urls.unknown`); animation frames in `storage_urls.frames`; spritesheet ZIP `GET /v2/objects/{id}/spritesheet` (**auth**); MCP `/mcp/objects/{id}/download` (1-dir: PNG) and `/spritesheet` (ZIP, no auth) | id, name, state_name, group_id, prompt, size, directions 1/4/8, view, status (pending/processing/completed/review/failed), progress_percent, eta_seconds, tags, style_settings, frame_urls (review), animations[] | `status=review` objects carry candidate `frame_urls` |
| **Map objects** | — (they appear in `GET /v2/objects` / `list_objects` as 1-dir objects **[live via MCP]**) | `GET /v2/map-objects/{id}` | — / `get_map_object` | — | `download_url` (no auth); MCP `/mcp/map-objects/{id}/download` (PNG, `max-age=28800`); image under the objects storage path | status, object_id, description, width, height, view, created_at | REST says "auto-delete after 8h"; live evidence contradicts this (see Open questions) |
| **Maps** (Map Workshop) | **none** | **none** | `list_maps` (+`search`) / `get_map` (ASCII), `view_map` (rendered image) | MCP `limit` 1–100 (def 20), `offset` | `view_map` returns an inline image; no download URL, no JSON | name, cell bounds, tile size, terrain legend, painted cells | **MCP-only**; no structured export |
| **Map placements** | none | none | `list_map_objects(map_id)` | 1–200 (def 50), `offset`, `search` | — | placement_id, asset_id, name, stands_on (x,y), size_cells, layer, status | Text table; the same asset can be placed many times |
| **Top-down tilesets** | `GET /v2/tilesets` | `GET /v2/tilesets/{id}` | `list_topdown_tilesets` / `get_topdown_tileset` | REST 1–100 (def 50); MCP 1–50 (def 10) | REST get = **every tile as base64** + metadata; MCP no-auth `/mcp/tilesets/{id}/image` (302 → backblaze sheet PNG; `?inline=true` serves the bytes), `/mcp/tilesets/{id}/metadata` (JSON with `bounding_box` per tile) | lower/upper/transition descriptions, tile_size, view, transition_size, total_tiles (16 or 25), terrain_prompts, style_settings, generation_parameters, base_tile_ids, per-tile corners/pattern_4x4 | REST list doc says it lists "top-down **and** sidescroller" |
| **Sidescroller tilesets** | `GET /v2/tilesets-sidescroller` | `GET /v2/tilesets-sidescroller/{id}` | `list_sidescroller_tilesets` / `get_sidescroller_tileset` | REST 1–**50** (def 10), newest first; MCP 1–100 (def 20) | REST get schema **undocumented** (`{}`); MCP no-auth `/mcp/sidescroller-tilesets/{id}/image` (302 → backblaze) and `/metadata` | name, lower_description, transition_description, tile_size, status, base_tile_id; per-tile corners, connections, pattern_4x4, bounding_box | REST get answers 404 for top-down IDs |
| **Isometric tiles** | `GET /v2/isometric-tiles` | `GET /v2/isometric-tiles/{id}` | `list_isometric_tiles` / `get_isometric_tile` | REST 1–100 (def 50); MCP 1–50 (def 10) | REST get = **base64 PNG only**; MCP no-auth `/mcp/isometric-tile/{id}/download` (PNG) | list: name, description, size, tile_shape (thin/thick/block), created_at, status; MCP get adds seed | REST get has no metadata |
| **Tiles Pro** (incl. path tiles, building kits, coastline, Wang tileset kind) | `GET /v2/tiles-pro` | `GET /v2/tiles-pro/{id}` | `list_tiles_pro` / `get_tiles_pro` | REST 1–**50** (def 10), newest first; MCP 1–50 (def 10) | `storage_urls` `{tile_0…tile_n}` → backblaze PNGs; MCP no-auth `/mcp/tiles-pro/{id}/download` (ZIP) | list: name, description, tile_type, tile_size, n_tiles, tile_view, status; get: **kind** (tiles/paths/tileset/coastline/building), **tile_rules** (bitmask placement rules) | MCP get also shows description, type, view, seed |
| **UI assets** (structured panels) | `GET /v2/ui-assets` | `GET /v2/ui-assets/{id}` | `list_ui_assets` / `get_ui_asset` | REST 1–100 (def 50), newest first, **includes ghost rows** for jobs still running; MCP 1–50 (def 10) | `image_url` (backblaze `.../ui/{user_id}/{id}/full.png?t=`); MCP `/mcp/ui-assets/{id}/download` (PNG) | id, name, prompt, size, status, created_at, progress_percent, eta_seconds | No pieces/elements metadata is exposed |
| **Creator gallery images** (website Creator plus MCP raw-image results: Pixen, PixFlux, Pro, Pro Flash, edit, inpaint, animate, cleanup, normal maps, …) | **none** | **none** | `list_images` (+`search`) / `get_image("gallery:<id>")` | MCP 1–50 (def 10), `offset`, newest first | Inline base64 PNG per frame + `download_url` = **S3 presigned, 7-day expiry, no CORS** | gallery ref, description, size, frame count, date | **MCP-only**. Website-made IDs are 13-digit numbers; API/MCP results are UUIDs |
| **Fonts** (Pro) | none | `GET /v2/generate-font-pro/{job_id}` | — / `get_font(job_id)` | — | `download_atlas_url`, `download_ttf_url` (no auth) | status, glyph_px | **No list**; job-ID only |
| **Portrait ↔ character conversions** | none | `GET /v2/portrait-character-pro/{job_id}` | — / `get_portrait_character(job_id)` | — | `download_url` (no auth) | status, width, height, seed | **No list**; job-ID only |
| **Vocal animations** (visemes) | none | `GET /v2/vocal-animation/{job_id}` | — / `get_vocal_animation(job_id)`; per character: `get_lip_sync(character_id, text)` returns the stored grid URL | — | `grid_url` spritesheet (one column per viseme, one row per mood); stateless jobs return `visemes` base64 | mood, viseme_count, moods_on_character, viseme_order | Job rows expire about 8 h after finishing; `get_lip_sync` is free and annotated read-only (not called in this spike) |
| **Character portrait** (attached) | none | none (no field on `CharacterDetail`) | none | — | — | — | **No read path** |
| **VFX effects** ("My effects") | none | job result only (`GET /v2/background-jobs/{id}` → `last_response.files`, `effect_id`, `fps`, …) | none (`vfx_workbench` has no list command) | — | GIF, spritesheet PNG + JSON, game ZIP, normals PNG (no-auth links in the job result) | effect_id, name, edit_url, canvas, frames, fps, loop, anchor, parts | **No list path**; only visible for about 8 h after a REST job |
| **Normal maps** | none | job result (`last_response.image` base64) | via `get_image(job_id)`; probably saved to the Creator gallery | — | base64 / gallery | — | Gallery save inferred from the `get_image` description |
| **Game Builder projects** | none | none | `list_projects` | none (returns all) | — | project id, name, branch, **git clone URL with an embedded credential** | Organization data, not media |
| **Background jobs** | none | `GET /v2/background-jobs/{id}` | `list_jobs(include_recent)` | — | — | id, status, created_at, last_response | MCP list shows active jobs plus the last 30 min; rows are purged 8 h after finishing |

---

## Per-asset detail

### Characters

**REST list** `GET /v2/characters?limit=&offset=` → `CharactersListResponse` **[contract]**

```json
{
  "characters": [{
    "id": "<uuid>", "name": "<name>", "state_name": "<state or null>",
    "prompt": "<prompt>", "size": {"width": 48, "height": 48},
    "directions": 8, "created_at": "<iso>", "updated_at": "<iso or null>",
    "animation_count": 3, "template_id": "mannequin", "view": "low top-down",
    "status": "completed|failed|pending",
    "preview_url": "<south PNG URL or null unless completed>",
    "tags": ["..."], "group_id": "<uuid or null>"
  }],
  "total": 0,
  "usage": {"type": "usd", "usd": 0.0}
}
```

**REST get** `GET /v2/characters/{id}` → `CharacterDetail` **[contract]**. It has all summary fields except `preview_url`, plus:
- `rotation_urls` (`CharacterRotationUrls`): `south`, `west`, `east`, `north` required; `south-east`, `north-east`, `north-west`, `south-west` nullable (8-dir only). Null unless `status == "completed"`.
- `style_settings` (object or null; for example `{"outline": "medium", "shading": "soft"}`), `guidance` (number), `ai_freedom` (int).
- `skeletons` (object or null): 2D keypoints with depth, `{direction: [keypoints]}`.
- `animations`: array of `AnimationGroup` `{animation_type, display_name, animation_group_id, directions: [{direction, frame_count, frames: [url,…]}]}`.
- `updated_at` doc: "Compare it (or the `?t=` stamp on the returned URLs) against your copy to sync only what changed."
- Errors: 401, 403 (another user's character), 404, 429, 422.

**MCP `get_character`** **[live]**. Text blocks:

```
status: completed
id / name / state_name / directions: 8 (south, east, …) / size: 48x48px / view: low top-down
style: -, -, -                  (outline, shading, detail; "-" = unset)
group: <group uuid> (N state[s])
rotations:
  south: https://backblaze.pixellab.ai/file/pixellab-characters/{user_id}/{character_id}/rotations/south.png?t={unix_seconds}
  … (8 lines)
animations (1 group, 8 total):
  <animation_type> — 8 dir (…), 8f <yyyy-mm-dd> [group: <animation_group_id>]
    north: https://backblaze.pixellab.ai/file/pixellab-characters/{user_id}/{character_id}/animations/{per-direction row uuid}/north/{i}.png?t={unix_ms} (i=0..7)
download: https://api.pixellab.ai/mcp/characters/{id}/download
spritesheet: https://api.pixellab.ai/mcp/characters/{id}/spritesheet (this state only …)
available_animations: <template animation ids…>
actions: …(write tools — ignore)
```

With `include_preview=true` (the default) the result also carries an inline south image. `list_characters` prints one row per character: `<uuid> | <name> | 8dir 48x48 | 8anim`, plus a header such as `characters: N total` and a `next: list_characters(offset=…)` hint.

**Exports** **[live]**:
- `GET /v2/characters/{id}/zip`: 200 with no auth, `application/zip`, `Content-Disposition: attachment; filename="<Name>.zip"`. Contents **[contract]**: `rotations/*.png`, `animations/{animation_type}/{direction}/frame_000.png…`, and `metadata.json` (character info, file structure, keypoints, export version and timestamp). Uncompressed. 423 while generating. `?states=id1,id2` limits the export to some states of the group.
- `GET /v2/characters/{id}/spritesheet`: 200 with no auth. ZIP containing `<name>.png` (row 0 = rotations, then one row per animation-direction; uniform cells sized to the largest frame, pivot-centred) and `<name>.json` (cell size, sheet size, column count, row map). This state only.
- MCP `/mcp/characters/{id}/download` and `/spritesheet` return the same files (identical `Content-Length` and filenames observed).

### Objects

**REST list** `GET /v2/objects` → `{objects: [ObjectSummary], total, usage}`. `ObjectSummary` = id, name, state_name, prompt, size, directions (1/4/8), created_at, view, `preview_url` (south, or "unknown" for 1-dir), tags, status. **[contract]**

**REST get** `GET /v2/objects/{object_id}` (UUID) → `ObjectDetail` **[contract]**: id, name, state_name, prompt, size, directions, created_at, view, `rotation_urls` (all keys nullable; **all null for 1-direction objects**, so use `storage_urls["unknown"]`), `storage_urls` (raw map; `frame_N` keys while `status='review'`), `frame_urls` (review candidates), style_settings, tags, status, group_id, progress_percent, eta_seconds, `animations: [ObjectAnimationGroup]`. Each group is `{animation_group_id, display_name, description, frame_count, directions: [{direction, storage_urls: {"frames": [...]}, created_at}]}`. Example style_settings in the docs: `{"detail": "medium detail", "outline": "single color black outline", "shading": …}`.

**MCP `get_object`** **[live]**: status, id, name, state_name, directions, size, view, group, `rotations: unknown: https://backblaze.pixellab.ai/file/pixellab-characters/objects/{user_id}/{object_id}/rotations/unknown.png`, `animations: none|…`, `download: https://api.pixellab.ai/mcp/objects/{id}/download` (1-dir: `image/png`, `inline`, `private, max-age=300`), and `spritesheet: …/mcp/objects/{id}/spritesheet` (ZIP, no auth). It branches on processing, review, completed, and failed.

**REST object spritesheet** `GET /v2/objects/{id}/spritesheet` requires auth: 401 `{"detail":"Not authenticated"}` without a token **[live]**. It returns 400 if the object has no rotation images yet.

### Map objects

- `GET /v2/map-objects/{id}` → `GetMapObjectResponse` `{status: processing|failed|completed, object_id, description, width, height, view, created_at, download_url, usage}`. Returns 423 + Retry-After while generating, 410 if failed permanently, and 404. **[contract]**
- MCP `get_map_object` **[live]**: description, size, view, `background: transparent`, `created`, download `…/mcp/map-objects/{id}/download` (PNG, `public, max-age=28800`), and image `backblaze …/pixellab-characters/objects/{user_id}/{id}/rotations/unknown.png`. It is stored like a 1-direction object, and `list_objects(search=…)` returned it as `1dir WxH` **[live]**.

### Maps and placements (MCP-only)

- `list_maps` **[live]**: `"<shown> of <N> maps:"`, then rows `<uuid>  <name>  <W>x<H> cells, <k> terrains`, plus a `next:` hint. Sorted most-recently-edited first. The tool description warns that "accounts reach four figures of maps", so use `search`.
- `get_map` **[live]**: `map: <name> (<id>)`, `bounds: x a..b, y c..d`, `tile size: 16px`, `painted cells: N`, a legend (`w=water | g=grass | .=empty`), and an ASCII overview with row rulers. The crop parameters are x/y/width/height (q/r on tile layers).
- `view_map` (annotated read-only; not called): returns a rendered image of terrain and objects.
- `list_map_objects` **[live]**: a summary of assets placed more than once, then a table `placement_id  asset_id  name  stands_on  size_cells  layer  status`.
- There is no public map JSON or export (Godot/Unity export is website-only per the sibling repo **[repo]**).

### Top-down tilesets

- REST list `GET /v2/tilesets` → `{tilesets: [TilesetSummary], total}`. A summary is `{id, name, lower_description, upper_description, tile_size {width,height}, view, created_at, status}`. The list doc says it lists "all tilesets (top-down and sidescroller)". **[contract]**
- REST get `GET /v2/tilesets/{id}` → `CreateTilesetResponse` `{tileset: {total_tiles, tile_size, terrain_types, tiles: [Tile]}, metadata: {edge_types, terrain_prompts, terrain_ids, transition_size, view, generation_parameters, created_at}}`. `Tile` = `{id, name ("wang_13"), image: {type:"base64", base64, format}, corners {NW,NE,SW,SE ∈ lower|upper|transition}, pattern_4x4 {row_0..row_3; 0=lower,1=upper,2=transition,255=wildcard}, original_position {row,col}, description, connections (deprecated)}`. Read `total_tiles` (16 standard, 25 at transition_size=1.0). 423 while generating. **[contract]**
- MCP `get_topdown_tileset` **[live]**: terrain (lower → upper), tiles, tile_size, view, style (outline, shading, detail), transition description, `download_png` (`/mcp/tilesets/{id}/image`, 302 → `https://backblaze.pixellab.ai/file/pixellab-tiles/{user_id}/{tileset_id}/spritesheet.png?t=…`), `download_png_inline` (`?inline=true`, 200 `image/png` from the API host), `download_metadata`, `base_tile_ids` (lower/upper), and an inline example-map image. A 25-tile tileset adds a note that the sheet is a **4×8 grid**.
- `/mcp/tilesets/{id}/metadata` (no auth) **[live]**: `{id, name, lower_description, upper_description, transition_description, tile_size, transition_size, view, style_settings {detail, outline, shading}, generation_parameters {tile_strength, tileset_adherence, text_guidance_scale, tileset_adherence_freedom}, base_tile_ids {lower, upper}, tileset_data: {tiles: [{id, name, corners, pattern_4x4, original_position, bounding_box {x,y,width,height}}]}}`. The tool text says to slice the sheet with `bounding_box`, **never** with `wang_N` or `original_position`.

### Sidescroller tilesets

- REST list `GET /v2/tilesets-sidescroller` (limit 1–50, default 10, most recent first) → `{tilesets: [{id, name, lower_description, transition_description, tile_size, created_at, status}], total}`. **[contract]**
- REST get `GET /v2/tilesets-sidescroller/{id}`: the 200 schema is **empty/undocumented**. It returns 423 + Retry-After while generating and 404 for top-down IDs. **[contract]**
- MCP `get_sidescroller_tileset` **[live]**: terrain, tile count, tile_size, `view: side (2D platformer)`, `background: transparent`, `/mcp/sidescroller-tilesets/{id}/image` (302 → backblaze `pixellab-tiles/{user_id}/{id}/spritesheet.png`), `/metadata`, and base_tile_id.
- Sidescroller metadata JSON **[live]**: `{id, name, tileset_data: {tiles: [{id, name, corners, connections {north,south,east,west: [tile ids]}, description, pattern_4x4, original_position, bounding_box}]}}`.

### Isometric tiles

- REST list `GET /v2/isometric-tiles` → `{tiles: [{id, name, description, size, tile_shape, created_at, status}], total}`. **[contract]**
- REST get `GET /v2/isometric-tiles/{id}` → `{image: Base64Image, usage}` and **nothing else**. **[contract]**
- MCP `get_isometric_tile` **[live]**: name, description, size, shape, `download: https://api.pixellab.ai/mcp/isometric-tile/{id}/download` (note the singular `isometric-tile`; PNG, `public, max-age=31536000`), seed, and an inline image.

### Tiles Pro (also path tiles, building kits)

- REST list `GET /v2/tiles-pro` (1–50, default 10, most recent first) → `{tiles: [{id, name, description, tile_type, tile_size, n_tiles, tile_view, created_at, status}], total}`. **[contract]**
- REST get `GET /v2/tiles-pro/{id}` → `{storage_urls: {"tile_0": url, …}, kind: "tiles"|"paths"|"tileset"|"coastline"|"building", tile_rules: {rule_type edge|corner|outline, arity 4|6, connectivity same|other, terrains [feature, background], tiles: {tile_N: bitmask}} | null, usage}`. Bit meanings: edge/4 bit0=N bit1=E bit2=S bit3=W; edge/6 = hex edges counter-clockwise from vertex 0; corner/4 = `NW<<3|NE<<2|SW<<1|SE`. Tiles missing from the rules map are stamp-only. **[contract]**
- MCP `get_tiles_pro` **[live]**: name, full description, type (`square_topdown`, `isometric`, …), size, kind, variations, view, `download: /mcp/tiles-pro/{id}/download` (ZIP), seed, and `storage_urls: tile_N: https://backblaze.pixellab.ai/file/pixellab-tiles/{user_id}/{tile_id}/tile_N.png`. The list row looks like `square_topdown 32x32px 16var`.

### UI assets

- REST list `GET /v2/ui-assets` (newest first, includes ghost rows for running jobs) → `{ui_assets: [{id, name, prompt, size, image_url, status, created_at}], total}`. REST get adds `progress_percent` and `eta_seconds`. **[contract]**
- MCP `get_ui_asset` **[live]**: `image: https://backblaze.pixellab.ai/file/pixellab-characters/ui/{user_id}/{id}/full.png?t=…` and `download: /mcp/ui-assets/{id}/download` (PNG, `private, max-age=300`).
- Neither surface exposes the pieces/elements used to generate the asset.

### Fonts, portrait conversions, vocal animations (job-ID getters)

- `GET /v2/generate-font-pro/{job_id}` → `{status: processing|stalled|finalizing|failed|completed, job_id, glyph_px, download_atlas_url, download_ttf_url}`. The atlas is a 10×8 row-major grid of 80 glyphs with no space glyph **[repo, from MCP docs]**. **[contract]**
- `GET /v2/portrait-character-pro/{job_id}` → `{status, job_id, width, height, seed, download_url}`. **[contract]**
- `GET /v2/vocal-animation/{job_id}` → `{status, job_id, mood, viseme_count, character_id, completed_visemes[], visemes (stateless only), moods_on_character[], grid_url, viseme_order[]}`. **[contract]**
- MCP errors for an unknown job **[live]**: `get_font` and `get_portrait_character` return an MCP error `error: job <id> not found`. `get_vocal_animation` returns the same message as a **normal (non-error) result**, adding "Completed jobs are removed after 8 hours — check the character instead".

---

## Creator gallery (MCP-only) details

**There is no REST equivalent.** None of the 102 OpenAPI paths references images, gallery, or creator. The website uses internal routes such as `GET /creator/images?limit=1000` and `/creator/images/{id}/data|frames` with a Supabase session token **[repo, 2026-06-23]**. Those routes are **not usable** by the app: they are private, need a website session, and are outside the public-API scope.

### `list_images` **[live]**

Request (`tools/call` arguments): `{"limit": 1-50 (default 10), "offset": >=0, "search": "<text or id>"|null}`. The tool is annotated `readOnlyHint: true`.

Response: one `text` content block.

```
gallery images: <N> total
showing <a>-<b> of <N>
  gallery:<id> | <description or "(no description)"> | <W>x<H>[, <k> frames] | <yyyy-mm-dd>
  …
next: list_images(offset=<b>)

download: get_image(job_id="gallery:<id>") · look: pixelart_workbench(…) · save a fix over it: save_to_asset(…)
```

- IDs come in two forms: **13-digit numeric** (looks like epoch milliseconds; images made on the website Creator) and **UUID** (API/MCP job results; for example cleanup outputs show the description "reduce colors").
- Descriptions are truncated with `...`. Ordering is newest first. The frame count is printed only when greater than 1.

### `get_image` **[live]**

Request: `{"job_id": "gallery:<id>" | "<raw-image job uuid>", "index": <int>|null}`. `index` returns a single frame inline, for long animations. **Annotated `readOnlyHint: false`**, because for a job it may retry a gallery save. Each call observed here only read.

Response: one `image` content block **per frame** (base64 PNG), then one `text` block holding JSON:

```json
{"asset_id": "<id>", "frames": 4,
 "download_url": "https://s3.eu-central-003.backblazeb2.com/pixellab-generations/production/creator/{user_id}/{asset_id}/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=…&X-Amz-Date=…&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=…"}
```

- `download_url` is an **S3 SigV4 presigned GET valid for 7 days**. The response has `Cache-Control: public, max-age=31536000` but **no `Access-Control-Allow-Origin`**, and an `OPTIONS` preflight returned 403. A browser can show it in `<img>` but cannot `fetch()` it, and drawing it to a canvas taints the canvas.
- For a 4-frame item listed as `23x92, 4 frames`, the presigned PNG header read **92×92** while 4 separate frame images arrived inline. The packing of multi-frame PNGs is undocumented, and the listed size may not equal the frame size. **Use the inline frames.**
- For raw-image jobs (not `gallery:` refs) the description says it returns progress or error until the job completes, then reports the Creator `asset_id` once the result is saved to the gallery.

### Calling it from a browser (MCP Streamable HTTP) **[live]**

```
POST https://api.pixellab.ai/mcp
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json, text/event-stream
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_images","arguments":{"limit":50,"offset":0}}}
```

- The response is always `Content-Type: text/event-stream`, with one `event: message` / `data: {jsonrpc result}` frame. Parse the SSE frame, then `result.content[]` (`{type:"text",text}` or `{type:"image",data,mimeType}`), plus `result.isError`.
- `initialize` succeeded (`protocolVersion` `2025-06-18`, `serverInfo` `PixelLab MCP Server 0.2.0`) but issued **no `mcp-session-id`**. `tools/list` and `tools/call` worked with no prior `initialize`, so the server is stateless.
- With no token, `tools/call` returned `isError: true` with the text `Error calling tool 'get_balance': 401: Missing Authorization header…`, still as HTTP 200.
- CORS on `/mcp`: the preflight allowed `authorization, content-type, mcp-session-id, mcp-protocol-version`, and the server reflects the origin.

---

## Organization data (projects / tags)

| Concept | Public read path | Notes |
|---|---|---|
| **Tags** | `tags: string[]` on REST character and object list/detail; MCP `list_characters` / `list_objects` filter with `tags=` (ANY) | Writes exist (`PATCH …/tags`, `update_*_tags`). The gallery must not call them. REST lists cannot filter by tag, so filter client-side. Other asset types have no tags. |
| **Character/object states (groups)** | `group_id` + `state_name` on both REST list and detail; MCP `get_*` prints `group: <id> (N states)` | Each state is its own row and ID; group the rows client-side. The REST ZIP exports every state by default. |
| **Animation groups** | `animation_group_id` per animation (characters), `ObjectAnimationGroup` (objects) | The website groups animations by this ID. |
| **Game Builder projects** | MCP `list_projects` only **[live]** | Rows are `<project_id> <name> [<branch>]` plus `git clone https://<credential>@api.pixellab.ai/git/<slug>.git`. **The clone URL embeds a credential: never render, log, or cache it.** No public tool lists which assets belong to a project; `add_to_project`/`remove_from_project` are writes. `chat_list_conversations(project_id)` exists but holds chats, not assets. |
| **Folders / favorites / collections** | **None** in REST or MCP | This matches the app plan: keep them local. |
| **Website project filter** | Internal `GET /characters?project_id=…`, `/objects?…`, `/maps/list?project_id=…`, `/ui-assets?project_id=…` **[repo]** | Private website routes; **not usable**. |

---

## Account & token-check calls

| Need | Call | Shape / notes |
|---|---|---|
| **Token check (cheapest)** | `GET https://api.pixellab.ai/v2/balance` | Free and read-only. 200 → `{"credits": {"type":"usd","usd": <number>}, "subscription": {"type":"generations","status":"active|trial|expired|none|enterprise","plan":"<plan name>","generations":<remaining>,"total":<allowance>}}`. Missing token → **401 `{"detail":"Not authenticated"}`** with `www-authenticate: Bearer` **[live]**. The invalid-token body is documented only as "Invalid API token" **[contract]**. |
| Balance (MCP) | `get_balance` | Text **[live]**: credits, `generations_remaining`, `generations_used`, `generations_total`, subscription status and plan, `generations_reset` date, `generations_today` (daily bonus), and notes on fractional billing. Richer than REST. |
| User info | **none** | No email, username, avatar, or user ID endpoint on either surface. The user ID appears only inside storage URL paths. |
| Job status | `GET /v2/background-jobs/{job_id}` → `{id, status: processing|completed|failed, created_at, last_response (object), usage}` | No REST job list. Jobs are "automatically cleaned up after completion" **[contract]**. |
| Active jobs | MCP `list_jobs(include_recent=false|true)` | Active jobs, plus the last 30 minutes when `include_recent` is set. Rows are deleted 8 h after finishing **[live]**. Not needed for a gallery; in-progress assets already show in the lists via `status` / ghost rows. |
| Auth header | `Authorization: Bearer <token>` on REST and MCP | Same token for both **[contract + live]**. Tokens come from `https://pixellab.ai/account` (REST docs) or `https://api.pixellab.ai/mcp` (MCP docs). |
| Error formats | REST is FastAPI: `{"detail": "<string>"}`, or 422 `{"detail": [{loc, msg, type, input, ctx}]}`. Statuses: 401, 403 (another user's asset), 404, 410 (generation failed permanently), **423 Locked + `Retry-After` while generating**, 429 "Too many requests"; generation routes also return 402 and 529 "Rate limit exceeded". MCP: HTTP 200 with `isError:true` text, or plain text starting `error:` | `Retry-After` is **not** in `Access-Control-Expose-Headers`, so JavaScript cannot read it **[live]**. |
| Rate limits | **No numeric read limits published.** 429 is declared on `GET /characters`, `GET /characters/{id}`, `PATCH …/tags`, and `GET /background-jobs/{id}` **[contract]** | No `X-RateLimit-*` headers on the unauthenticated responses observed **[live]**. Sibling repo: generation concurrency is per-tier (about 8 concurrent jobs observed on Tier 2) **[repo]**; that concerns jobs, not reads. |

---

## Gaps (no public read path)

These are flagged **website-only** for the gallery's purposes:

1. **VFX effects ("My effects").** REST `/vfx` and MCP `vfx_workbench` both save to My effects, but no tool or route lists or opens saved effects. The REST job result (files, effect_id, fps, edit_url) disappears with the job row. **[contract + live]**
2. **Fonts library.** Readable only through `GET /v2/generate-font-pro/{job_id}` / `get_font`, while the job exists. There is no list. **[contract]**
3. **Portrait conversions.** Job-ID getter only; no list. **[contract]**
4. **Portrait attached to a character.** It can be set (`POST /characters/{id}/portrait`), but `CharacterDetail` has no portrait field and the MCP `get_character` text showed none. **[contract]**
5. **Vocal visemes.** Past their job, they are reachable only per character through `get_lip_sync` (MCP, free, read-only annotation) → `grid_url`. There is no "which characters have visemes" list. REST `POST /lip-sync` exists, but it is a POST. **[contract]**
6. **Uploads** (`POST /uploads` refs, 3-day life). No list. **[contract]**
7. **Map JSON / Godot-Unity export, UI screen layouts, website "Tile groups", Game Builder project asset membership.** Website-internal only. **[repo]**
8. **Creator gallery via REST.** None. MCP is the only public path, so the app needs an MCP client for this one feature. **[live]**
9. **Public/community gallery or explore feed.** None in REST v2 or MCP. The website has a character share route (`GET /character/{id}/share`) **[repo]**; it is internal and **not usable**. No public explore feed was found in any source.
10. **Freeform UI (`POST /generate-ui-v2`) and REST raw-image outputs.** Whether these persist anywhere listable (for example the Creator gallery) is undocumented. MCP raw-image results do save to the gallery per the `get_image` description; REST ones are unverified.
11. **Animation timing.** No fps or frame duration for character, object, or gallery animations anywhere in the public contract. The exception is VFX job results (`fps`, `durations` in the spritesheet JSON). The character ZIP `metadata.json` content beyond "keypoints, structure, export version" is unverified.

---

## Implications for the gallery app

1. **Use REST v2 JSON as the primary data source** for characters, objects (map objects included), both tileset types, isometric tiles, Tiles Pro, UI assets, and balance. **Add a small MCP JSON-RPC client** only for the Creator gallery (`list_images`, `get_image`) and maps (`list_maps`, `get_map`, `view_map`, `list_map_objects`). Optionally use it for MCP-only metadata (isometric seed and name via `get_isometric_tile`) and for search (`list_characters`/`list_objects` `search` + `tags`). REST lists have no search, so the alternative is to sync everything and search locally.
2. **Write the MCP client as roughly 30 lines over `fetch`.** POST JSON-RPC, read the SSE body, take the `data:` line, `JSON.parse`. No session or `initialize` is needed. Wrap the text parsers in tests and treat them as **brittle**: the output is prose meant for LLMs and can change without notice. Prefer the JSON-bearing pieces (`get_image`'s JSON block, `/mcp/tilesets/{id}/metadata`).
3. **Sync strategy.** Page each REST list at its maximum (100, or 50 for sidescroller and Tiles Pro), using `total` to plan pages and low concurrency (2–4). A real account has hundreds of characters, about 200 objects, about 800 gallery images, and about 300 tilesets, so a full list sync is roughly 10–30 requests. Fetch character and object **detail lazily** (animations exist only in detail) and cache it in IndexedDB. For characters, refresh detail only when `updated_at` or the `?t=` stamp changes; other types have only `created_at`.
4. **Media loading.**
   - `backblaze.pixellab.ai` URLs send `ACAO: *`. Use `<img crossorigin="anonymous">` so frames can go to a canvas (GIF encoding) and be fetched into ZIPs.
   - **Gallery `download_url` has no CORS**, so for gallery downloads, GIFs, and ZIPs use the **inline base64 frames** from `get_image` (use `index` for long animations). Reserve the presigned URL for `<img>` display or a plain link, and re-request it after 7 days.
   - Top-down tilesets: avoid REST `GET /tilesets/{id}`, which returns base64 for every tile. Use the no-auth `/mcp/tilesets/{id}/image?inline=true` sheet and `/metadata` `bounding_box`, both CORS-enabled.
5. **Downloads.** Use the official exports where they exist: character ZIP and spritesheet (REST, no auth), object spritesheet (REST with auth, or MCP no-auth), the Tiles Pro ZIP, and the PNG download links. Build the rest client-side: per-frame PNGs, GIFs with a **user-adjustable fps** because the API gives none, multi-select ZIPs (for example with fflate or JSZip). Read `Content-Disposition` for filenames; it is the one exposed header.
6. **Status handling.** Show `pending`/`processing`/`review` rows and UI ghost rows with progress fields. Treat 423 as "still generating". JavaScript cannot read `Retry-After`, so back off with a fixed or exponential schedule on 423 and 429.
7. **Tileset classification.** De-duplicate tilesets by ID across the top-down and sidescroller lists. Decide the type with REST `GET /tilesets-sidescroller/{id}`, which answers 404 for top-down, rather than with the MCP getters, which both answered for the same ID.
8. **Secret and capability hygiene.**
   - Send the token only to `https://api.pixellab.ai`. Never put it in URLs.
   - Prefer `sessionStorage`, with an opt-in "remember" that writes `localStorage` and a clear warning.
   - Treat asset UUIDs and storage URLs as sensitive: they grant no-auth downloads and embed the user ID. Keep them out of analytics, shareable app URLs, and error reports.
   - Never surface `list_projects` clone URLs.
9. **Stay view-only.** Never call PATCH tags, delete, `save_to_asset`, `cancel_job`, or any `create_*` or POST route. Treat `get_image` as safe for `gallery:<id>` refs only (it is annotated non-read-only because a job lookup can retry a save). `create_talking_gif` and REST `POST /talking-gif` / `POST /lip-sync` are free and create nothing persistent per the docs, but they are POST "create" routes. Keep them out of the MVP unless the user accepts that gray area.
10. **Website handoff for editing.** Known entry points (from repo research; per-asset deep-link formats unverified): `https://www.pixellab.ai/create` (Creator), the character and object creators, Map Workshop, `/create-ui`, `/create-vfx`, and `/editor` (Pixelorama). VFX REST results carry an `edit_url`; no other asset exposes one.
11. **Token check.** On save in Settings, call `GET /v2/balance` and show the plan and remaining generations. Optionally show MCP `get_balance` for reset date and daily bonus.

---

## Open questions / risks

- **REST bodies were not verified live**, because no token could be placed in a command. Verify with a token in the browser app during the build: whether `preview_url` and `rotation_urls` use `backblaze.pixellab.ai` (live MCP) or the documented example hosts `supabase.pixellab.ai` / `cdn.pixellab.ai`, plus the exact sidescroller get body and the invalid-token 401 body.
- **Map object lifetime:** the REST docs say auto-delete after 8 h (and the download sends `max-age=28800`), but a map object from about three months earlier still resolved through MCP, and the MCP docs say "permanent". Treat it as permanent but tolerate 404/410.
- **Tileset list overlap:** one ID was listed by both MCP tileset lists, and both getters described it differently. Also unverified: whether REST `GET /tilesets` includes sidescroller tilesets, as its description says.
- **Multi-frame gallery PNG layout:** the presigned PNG size (92×92) did not match the listed `23x92, 4 frames`. The frame packing is undocumented.
- **Are REST raw-image and `generate-ui-v2` outputs saved to the Creator gallery?** Unknown.
- **MCP text formats are unversioned prose.** Any parser can break silently. The tools publish no `outputSchema`.
- **Rate limits for read traffic are unpublished.** A burst of 500 lazy detail fetches may hit 429. Throttle reads.
- **Unauthenticated `tools/list` showed 103 tools** versus about 118 in authenticated sessions. The tool inventory varies with auth and possibly tier, so discover the read-only tools after the token is set.
- **Staleness:** the sibling `../docs/*` research (website endpoints, SDKs, crosswalk) dates from **2026-06-23**, almost 4 months old. The `pixellab-pip` docs were reviewed 2026-10-19 and match today's contract counts (102 paths, 275 schemas).
- **ToS:** a third-party client using a user's own token is how the public API is meant to be used, but PixelLab's Terms of Service (`https://pixellab.ai/termsofservice`, referenced by the MCP server instructions) were not reviewed in this spike.

---

## Sources

| Source | Status |
|---|---|
| `https://api.pixellab.ai/v2/openapi.json` (102 paths, 275 schemas; fetched 2026-10-18) | **verified-live** |
| `https://api.pixellab.ai/v2/llms.txt` (auth line, endpoint index) | **verified-live** |
| `https://api.pixellab.ai/mcp/docs` (generated 2026-10-18 19:21) | **verified-live** |
| `https://api.pixellab.ai/mcp`: unauthenticated `initialize`, `tools/list` (annotations, no outputSchema), `resources/list`, `tools/call` 401 behaviour, SSE framing | **verified-live** |
| CORS preflights and headers on `api.pixellab.ai/v2/*`, `api.pixellab.ai/mcp`, `backblaze.pixellab.ai`, `supabase.pixellab.ai`, `s3.eu-central-003.backblazeb2.com` (presigned) | **verified-live** |
| No-auth exports: `GET /v2/characters/{id}/zip` and `/spritesheet` (200), `GET /v2/objects/{id}/spritesheet` (401), `/mcp/{characters,objects,map-objects,tilesets,sidescroller-tilesets,isometric-tile,tiles-pro,ui-assets}/…` (200/302) | **verified-live** |
| Live read-only MCP calls: `get_balance`, `list_projects`, `list_jobs`, `list_characters`, `get_character`, `list_objects` (incl. `search`), `get_object`, `list_images`, `get_image` (gallery refs), `list_isometric_tiles`, `get_isometric_tile`, `list_topdown_tilesets`, `get_topdown_tileset`, `list_sidescroller_tilesets`, `get_sidescroller_tileset`, `list_tiles_pro`, `get_tiles_pro`, `list_ui_assets`, `get_ui_asset`, `list_maps`, `get_map`, `list_map_objects`, `get_map_object`, and `get_font` / `get_portrait_character` / `get_vocal_animation` (unknown-ID error shapes) | **verified-live** |
| `../pixellab-pip/docs/pixellab/pixellab-mcp-vs-rest-route-parity.md` (reviewed 2026-10-19) | repo-claim; counts consistent with the live contract |
| `../pixellab-pip/docs/pixellab/pixellab-surfaces-and-services.md` (2026-10-19) | repo-claim |
| `../pixellab-pip/docs/pixellab/pixellab-user-facing-term-backend-mapping.md` (2026-10-19) | repo-claim |
| `../pixellab-pip/docs/pixellab/pixellab-terminology.md` | repo-claim (not needed beyond the above) |
| `../pixellab-pip/skills/pixellab-pip/references/mcp-platform-tools.md` | repo-claim (gallery/project safety rules) |
| `../pixellab-pip/skills/pixellab-pip/references/official-pixellab-documentation.md` | repo-claim (doc link table) |
| `../pixellab-pip/docs/pixellab/pixellab-api-pricing-model-list.md` (concurrency, no slot/usage API) | repo-claim |
| `../docs/pixellab-website-endpoints-research.md` (collected 2026-06-23) | repo-claim, **possibly stale**; website-internal routes are listed only as "not usable" |
| `../docs/pixellab-endpoint-crosswalk.md`, `../docs/pixellab-public-api-mcp-research.md`, `../docs/pixellab-github-sdk-surfaces.md` (all 2026-06-23) | repo-claim, **possibly stale**; superseded by the live contract where they differ |
