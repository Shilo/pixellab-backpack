# R1 — Research Cross-Review (spikes 01–08)

Review date: 2026-10-18. Reviewer role: skeptical senior reviewer (product + engineering).
Inputs: `docs/research/01` … `08`, all read in full.

Spot checks run for this review (all unauthenticated, no token, no credits, no writes):

| Check | Result |
|---|---|
| `OPTIONS https://api.pixellab.ai/v2/balance` from `https://example.pages.dev` | 200. Origin reflected, `allow-credentials: true`, `max-age: 600`. Same as 02. |
| `GET https://backblaze.pixellab.ai/file/pixellab-characters/<nonexistent>.png` with an `Origin` header | 404 still carries `Access-Control-Allow-Origin: *`. Consistent with 01/02. |
| `GET /v2/openapi.json` | 102 paths and 275 schemas, matching 01. Every list route takes only `limit`/`offset`. `/characters/{id}/zip` and `/spritesheet` declare no security. `/objects/{id}/spritesheet` requires `HTTPBearer`. Timing fields exist only on lip-sync and talking-GIF schemas, plus `VfxRequest.sprite_fps`. Example hosts: `supabase.pixellab.ai` ×18, `cdn.pixellab.ai` ×6, `backblaze.pixellab.ai` ×0. **`ObjectSummary` has no `group_id`** (only `CharacterSummary` and `ObjectDetail` do). |
| MCP `tools/list` (unauthenticated) | 103 tools. `get_image` is `readOnlyHint:false, destructiveHint:false, idempotentHint:true`. Its description ties the save retry to "a completed job" (a raw job id), not to `gallery:` refs. `list_images`, `list_maps`, `get_map`, `view_map`, and `list_map_objects` are all `readOnlyHint:true`. |

---

## Verdict summary

- **The plan is feasible as specified: no backend is needed.** API, CORS, and token research (01, 02) is live-verified and strong. Rendering and export research (06) is rigorous. The UX spikes (03, 04, 05, 08) rely partly on bundle reading and secondary sources, which is acceptable for pattern choices.
- **Five corrections change the design:**
  1. **Image CORS is not a risk.** The "untested / top risk" claims in 06 and 07 are stale. 01 and 02 proved `ACAO: *` on backblaze. The one real exception is the Creator-gallery presigned S3 URL; use `get_image`'s inline frames instead.
  2. **Fonts and VFX ("My effects") are not browsable through the public API** (01). Remove the chips, viewers, and glyphs that 04, 05, 06, and 08 planned for them.
  3. **Animated previews have a hidden network cost.** Character animations exist only in the detail response (01), so every animated card means a detail GET plus N frame GETs against unpublished read limits. That settles the preview debate in favour of **static by default**.
  4. **Asset UUIDs are permanent no-auth download keys.** They must stay out of URLs, including the hash (02 overrides 07). A session-only token is also hollow if the library cache persists, because the cached URLs never expire and survive token rotation. Cache persistence must follow the "Remember" choice.
  5. **Objects cannot be grouped by state from the list.** 01 overstated this: `ObjectSummary` lacks `group_id`.
- **Scope:** about 30 spike suggestions go beyond a view-only, KISS gallery and should be cut or deferred (see Scope check). Nothing the user explicitly asked for was cut by any spike, but two requested items are under-specified: whole-account bulk export on iOS, and "max metadata" per type.
- **Phase 0 (real token, about half a day) must answer 10 questions before implementation starts** (Gaps, class a). The most consequential are the REST image hosts, read cost and rate limits, and the cost of Creator-gallery and map thumbnails.

---

## Contradictions & resolutions

| # | Topic | Positions | Verdict | Winning evidence |
|---|---|---|---|---|
| C1 | Image-host CORS | 06 OQ1 "blocking, untested"; 07 Risk 1 "high, untested"; 03 OQ5 "unverified" **vs** 01 §5 and 02 §2.4: backblaze sends `ACAO: *`, `max-age=31536000`, unsigned `?t=`; API no-auth exports reflect the origin. | **Resolved: not a risk** for `backblaze.pixellab.ai` or API-host downloads. 06 and 07 were written without 01/02's evidence. Three exceptions remain: **(a)** The Creator-gallery `download_url` is an S3 presigned URL (7-day expiry) with no ACAO, and its preflight returns 403. Never fetch it or render it. Use `get_image`'s inline base64 frames → `Blob` → `blob:` URLs, with `index` for long animations. This also keeps the S3 host out of CSP. **(b)** The REST `preview_url` / `rotation_urls` / `image_url` hosts are unverified. The OpenAPI examples name supabase/cdn, not backblaze → Phase 0 (G1). **(c)** Base64-only REST getters (top-down tileset get, isometric get) are avoided or decoded to `Blob`. | 01/02 live headers. Re-probed today: backblaze sends `*` even on 404, and the API still reflects the origin. |
| C2 | Thumbnail animation | 03: autoplay visible items + global pause. 05: capped in-view autoplay + hover. **04 does *not* lean to autoplay** (hover/focus on desktop + a "play all" toggle; the brief's premise is off). 06: static + hover/focus on fine pointers + optional in-view setting with a cap. 08: no grid autoplay; hover/focus, or a tap on a play badge for touch. | **Static by default (06/08).** The deciding factor is new: lists carry no frames (01), so in-view autoplay of a 50-card screen means about 50 detail calls plus hundreds of frame GETs. Policy: (1) static south rotation or first frame, with a ▶ badge and frame count; (2) fine pointer: play on hover and on keyboard focus after a short dwell, so scrolling past cards does not trigger fetch storms; (3) touch: **no per-card play target** (it collides with tap = open, long-press = select, and 2.5.8 sizing); the tap opens the viewer, which plays; (4) a visible grid-toolbar toggle "Animate previews", off by default and defaulting off under `prefers-reduced-motion`, enables in-view play with a cap on the shared ticker; the same toggle is the WCAG 2.2.2 pause mechanism; (5) the viewer autoplays with a visible pause control, and opens paused under reduced motion. Drop the `saveData` check: it is Chromium-only and redundant with default-off. | 01 (animations are detail-only); 06 (ticker, cap); 08 (2.2.2, touch). |
| C3 | `get_image` safety | 01 called it on `gallery:` refs and observed reads only. 02 avoided it because it is annotated non-read-only. | **Safe for `gallery:<id>` refs.** The write path (retrying a gallery save) is reachable only with a raw-image job id, which a gallery never holds. Even then the write is non-destructive and spends no credits. Guard it mechanically: the MCP client accepts `get_image` only when `job_id` matches `^gallery:(\d{13}\|[0-9a-f-]{36})$`. Phase 0 confirms that balance and gallery count are unchanged after N calls. | Annotation and description re-read today. 01 live calls. |
| C4 | Hash routes containing asset IDs | 03 `#/image/<id>`; 05 deep-link hash; 07 `#/asset/character/<id>` ("the fragment never reaches the server") **vs** 02 §5.4/§8.6 (no UUIDs in URL, query, or hash) and 01 §8. | **02 wins.** 07 is right that the fragment is not sent to servers or in Referer. But it still lands in history (synced across devices), copy-paste, screenshots, and extensions. A leaked character UUID gives permanent no-auth ZIP and spritesheet downloads that survive token rotation. Use an **opaque asset key**: `#/a/<key>`, where `key` = base64url(SHA-256(`type:uuid`)) truncated to about 12 characters. It is deterministic (survives reload, Back, and bookmarks on the same account), not reversible, and needs no mapping table. Non-sensitive view state (direction, animation index) can go in the hash query. | 02 threat table; 01 §6 no-auth exports. |
| C5 | Token storage default | 01/02/07: memory + `sessionStorage` by default, opt-in `localStorage`. 05 offers both with no default. | **Agree, with three corrections.** (a) The copy must not promise "cleared when you close the browser"; session restore may keep `sessionStorage` (02, unverified). Say "this tab". (b) Whether a middle-clicked or new tab inherits `sessionStorage` varies by browser and `noopener`, so in session mode a new tab may show the Connect screen. Accept that; no BroadcastChannel hand-off. (c) **Session-only means nothing if the library cache persists.** IndexedDB snapshots and Cache API entries hold UUIDs, never-expiring no-auth URLs, and the art itself. Persistence must follow the token mode (D15). Passphrase encryption, PasswordCredential, and non-extractable-key obfuscation: cut. | 02 §5 + this review's capability analysis. |
| C6 | Grid cell scaling | All spikes agree on uniform square cells with no cropping. Mechanisms differ: 04 `object-fit: contain` with integer scaling "where possible"; 07 integer scale in CSS px; 08 CSS-px `k` with an optional DPR refinement; 06 integer `k` in **device** px, sized by `width`/`height`, with object-fit, transforms, `zoom`, and background images banned. | **06 wins.** `object-fit` in a box that is not an integer multiple gives a silent fractional scale, and integer CSS px is uneven at DPR 1.25/1.5 (MDN). Safari bugs WebKit 185683, 177037, and 289023 rule out transforms and background images. For **k < 1** (maps, large Creator images, tall tile sheets in small cells), downscale the whole asset smoothly (`image-rendering: auto`) and show a small "fit" marker. Never crop, and never nearest-neighbour downscale (it drops rows). Trim transparent padding for characters and objects and bottom-align them (06). Tileset "demo patch" thumbnails are deferred; show the sheet as returned. | 06 R1–R3, CSS Images 3 spec, WebKit bugs. |
| C7 | Navigation | 04: Library/Collections tabs + search button, with type chips under the top bar. 03: one library + type chips + one search. 05: sidebar of per-type built-in views + folders + smart views. 08: four tabs (Library, Folders, Favorites, Search). 07: Library, Folders, and Settings views. | **Two destinations: Library and Collections (04)**, the model iOS 26 and Google Photos both converged on after backlash. Library is flat, newest first, with a single-select **type chip row** (03) and a search field scoped to the current view. Collections holds Favorites (pinned first) and folders. The same destinations appear in a bar, rail, or sidebar depending on width. Rejected: sectioned-by-type home (headers break fixed-row windowing, and reaching the last type takes more scrolling); 08's four-tab bar (Favorites and Search do not need tab slots; NN/g's cramped-bar critique); 05's smart views (YAGNI). Settings lives behind a top-bar button. | 04 citations (TechCrunch, MacRumors, Android Authority); 03 flaw #1. |
| C8 | Which asset types exist | 04 and 05 list Fonts and VFX chips or views. 06 has font and VFX viewers. 08 has font and VFX glyphs. | **01 wins.** Fonts (job-ID only, purged after about 8 h), VFX "My effects", portraits, and uploads have no public list path. Chips: **All · Characters · Objects (incl. map objects) · Images (Creator gallery) · Tilesets (top-down + sidescroller) · Tiles (isometric + Tiles Pro) · Maps · UI**. Add one quiet line: "Fonts, effects and portraits aren't available through PixelLab's public API — open PixelLab". | 01 matrix and Gaps. |
| C9 | State grouping | 01's org table says "`group_id` + `state_name` on both REST list and detail". 06 plans a state switcher for both characters and objects. | **01 is wrong for objects.** The OpenAPI check shows `ObjectSummary` has no `group_id`. Characters: one card per `group_id` (base state = `state_name` null, else the oldest), with states in the viewer. Objects: one card per state row until Phase 0 finds a cheap grouping signal. Do not fetch every object detail just to group cards. | OpenAPI re-check today. |
| C10 | Non-completed assets | 01 §Impl 6: show pending, processing, and review rows, and UI ghost rows with progress. 02 §6: show completed assets only. | **02 (KISS).** The grid shows completed assets. The header shows "N generating · N need review · N failed" with an "Open in PixelLab" link. Choosing review candidates is a write (`select_object_frames`), so it is out of scope. A 423 means "generating". | View-only scope; images are null until `completed` (01). |
| C11 | Grid → viewer transition | 04: zoom from the thumbnail. 07: `startViewTransition` morph. 06: crossfade only. 08: frame morph + art fade, and spike-test the naive morph. | **06/08.** Snapshots are rasters, WebKit 317712 reports blur, and whether `pixelated` applies to `::view-transition-*` is unverified. v1 uses an opacity crossfade (a cut under reduced motion). 08's frame morph is optional polish after the spike. 07's naive morph is rejected. | 06 R6, 08 Motion. |
| C12 | Large ZIP delivery | 05/06: stream to disk via `showSaveFilePicker` on Chromium, Blob fallback, size guard, split into parts. 07: in-memory Blob; streaming is YAGNI. | **06.** Whole-account export is a stated requirement, and the streaming branch is about 3 lines with client-zip. Other browsers get a Blob, using `predictLength` where sizes are known, plus a tunable per-part cap with numbered parts. Service-worker streaming: defer. | 06 download matrix; user requirement. |
| C13 | CSP | 02: `default-src 'none'`, no `data:`, `connect-src` limited to the API and backblaze. 07: `default-src 'self'`, `img-src data:`, `worker-src blob:`, `connect-src 'self'`. | **02 (stricter).** Inline base64 → `Blob` → `blob:`, so no `data:` is needed. Vite emits module workers as files, so no `blob:` is needed in `worker-src`. Set `build.assetsInlineLimit: 0`. Add 07's `Referrer-Policy: no-referrer`, `nosniff`, and `Permissions-Policy`. Hosts are revisited after G1. | 02 §5.5. |
| C14 | Default playback fps | 06: 10 fps, noting the website's speed is unknown. 03: the website card preview uses `frameRate:5` (code). | **Keep 10 fps** with a per-animation override. 03 fills half of the gap 06 flagged; the detail-page player fps is still unknown, so do a cheap bundle check before freezing. Label timing as "not provided by PixelLab". | 06 Playback; 03 card code. |
| C15 | Default backdrop | 06 and 03: quiet checker by default (global). 08: checker is an inspection mode; the grid uses the theme surface; the viewer uses a dark or light stage. | **08 for the grid default** (a checker competes with 16–32 px sprites). Checker, mid N5, light N8, black, and white are one tap away in the viewer. One global setting with a per-session viewer override (06). Use a chroma-0 stage, a conic-gradient checker, and `forced-color-adjust: none` on the stage. | 08 neutral-surround sources; 06 Safari tiling bugs (conic gradient avoids them). |
| C16 | Icons and fonts | 07: Lucide + system fonts. 08: Phosphor (fill variants) + Geist/Inter + Geist Mono + a Geist Pixel wordmark. | **07.** Lucide's heart and star accept `fill="currentColor"` for a non-colour on-state. Use the `system-ui` and `ui-monospace` stacks (0 KB, CSP-clean, full glyph coverage). Draw the wordmark as an inline SVG on a pixel grid, not a webfont. | 07 Q8; ladder: native first. |
| C17 | Keyboard map | `.` = favorite (04) vs `,`/`.` = frame step (06, 04). F = favorite (05) vs F = focus/fullscreen (05 itself, 08). ←/→ = previous/next asset (04, 08) vs frame step (06), with a focus-dependent switch (05). `[`/`]` = direction (06) vs frame step (04). | **One map:** ←/→ asset · `,`/`.` frame step · `[`/`]` direction · Space play/pause · I info · F fullscreen · L favorite · D download · Esc close · `/` search · `?` help · `+`/`-` zoom. Plus a **setting that turns single-key shortcuts off**, which WCAG 2.1.4 (Level A) requires and every spike missed. | WCAG 2.1.4; conflict analysis. |
| C18 | Grid semantics | 03/04: roving-tabindex arrow-key grid. 07: `role="list"` + `aria-setsize`/`aria-posinset`. 08: list semantics with optional arrow keys. | **07/08.** A list of links with set-size and position (it is virtualized), plus optional arrow-key movement without `role="grid"`. Column count changes with width, so it is not a true grid (Higley). | 08 a11y; 07 Q5. |
| C19 | Folder model | 03: nested folders + smart filters. 05: flat multi-membership folders, one level of groups, smart views. 07: flat folders. | **Flat, many-to-many folders + built-in Favorites.** Groups, nesting, and smart views are deferred. | User asked only for folders and favorites; 05/04 reference model. |
| C20 | Sort options | 03: created asc/desc, name, size, directions, frame count, type. 04: created, name, type + reverse. | **Created (newest first by default), name, canvas size, with reverse.** Frame count needs per-asset detail, so cut it. `updated_at` exists only for characters, so there is no "last edited" sort. | 01 field matrix. |
| C21 | Where UI prefs live | 06: backdrop in `localStorage`. 07: settings in idb-keyval. | **Theme, backdrop, and zoom in `localStorage`**, because they need a synchronous read before first paint to avoid a theme flash. Org data and the library cache go in IndexedDB. | Platform behaviour. |
| C22 | Tileset type detection | 01: one GET to `/tilesets-sidescroller/{id}` per tileset (404 means top-down). | **Classify by membership in the paged REST sidescroller list** (one sweep instead of N GETs). Each N GET also costs a preflight (see the last row of the Weak claims table). Verify list overlap in Phase 0. | Request count; preflight cache is keyed per URL. |
| C23 | Character bulk ZIP layout | 01/02: reuse official server ZIPs. 06: a client-built ZIP mirroring PixelLab's layout. Neither notes that client-zip cannot *read* ZIPs, so putting official ZIPs into a bulk ZIP means nesting them or adding an unzip library. | **Open issue O5.** Recommendation: single-asset "Download ZIP" passes the official ZIP through; bulk export builds the same layout client-side from frame URLs, with our `metadata.json`. No nested ZIPs and no unzip dependency. | 06 frame layout = OpenAPI `/zip` layout. |

---

## Weak or unverified claims

| Claim | Spike | Problem | Impact | Action |
|---|---|---|---|---|
| Image-host CORS is untested / high risk | 06 OQ1, 07 Risk 1 | Stale against 01/02 live evidence | Would drive needless fallback or proxy work | Retire. Keep only G1 (REST preview hosts). |
| "Reads are free" | 02 §5.1 | One data point (`list_characters`). `get_image`, `view_map`, and REST list/detail calls were not measured. | Paid-credit control. Whole-account sync plus gallery and map thumbnails means hundreds to thousands of calls. | G2: read balance and generations before and after a full sync. |
| API concurrency 4, media 8, drop to 2 on 429 | 02 §6 | Guesses. No read limits are published and `Retry-After` is unreadable. | Sync time, 429 storms, thumbnail strategy | G3 burst test |
| Objects carry `group_id` in the list | 01 org table | **False** (`ObjectSummary` has none; checked) | Card-per-group design | C9; G8 |
| "The hash fragment keeps asset IDs private" | 07 Q3, Impl 2 | True for servers and Referer only | UUID capability leak | C4 / D13 |
| VFX results carry `fps`/`loop` | 06 Playback | Not in the OpenAPI schema (only `VfxRequest.sprite_fps`). The job result is an untyped object. | None now, because VFX is not listable | Drop the VFX viewer |
| Fonts, VFX, and portraits are browsable types | 04, 05, 06, 08 | Contradicted by 01 | Chips, viewers, icon set | C8 |
| In-view autoplay is safe ("survey without perf collapse") | 05 | The evidence is about lazy video playback. No canvas or GIF benchmarks. Ignores per-character detail fetches. | Preview policy, rate limits | C2: static default; measure the cap |
| 10 fps is the right default | 06 | Reasoning only. 03 found the PixelLab card preview runs at 5 fps. | Perceived correctness of every animation and of GIF timing | Bundle check of the detail player; per-animation override |
| Website ids = REST ids ("verified") | 03 | Comes from sibling research dated 2026-06-23 (about 4 months old) | Hand-off links | G9: open one link per type |
| Signed-out deep links land on the target after login | 03 | Only the redirect URL was observed | Hand-off UX | G9 |
| iOS canvas cap of 16.7 MP and 224–384 MB | 06 | Community-reported | Export scale caps | Phase 1 device test; keep the guard |
| Aseprite-hash JSON imports into Phaser, PixiJS, and Godot | 06 | Untested (06 says so) | UI and marketing claims | Make no engine-support claims in v1 |
| Svelte 5 works under `style-src 'self'` and Trusted Types | 02, 07 | Unverified against a real build. Trusted Types likely needs a policy, because templates are created via HTML strings. | CSP strictness | Phase 1 build check; enable TT only if it passes |
| `sessionStorage` behaviour (session restore, new-tab copy) | 02 | Unverified | Token copy and new-tab UX | Test on Chrome, Firefox, and Safari |
| A gallery multi-frame PNG's listed size equals its frame size | 01 | One observation (listed 23×92, presigned PNG 92×92) | Frame slicing | Already mitigated: use the inline frames |
| Photo-app pattern evidence | 04 | Partly secondary or older (search summaries; 2018 Google Photos web write-up) | Low; affects pattern choices only | Accept. The Library/Collections choice rests on primary press coverage. |
| Contrast ratios for the token sets | 08 | Self-computed; approximate for chromatic pairs | AA compliance | Verify in a checker at token freeze |
| ToS §2.2 "own service" is acceptable for a BYO-token client | 02 §7 | Inference | Public launch | Contact PixelLab before public launch (D31) |
| "Creator gallery is cheap to add (~40 lines)" | 07 Impl 6 | The transport is cheap but the data is not: `list_images` returns no image or thumbnail URL, so you need one `get_image` per item. Descriptions are truncated, and items can be overwritten (`save_to_asset` "saves a fix over it"). | Sync cost, search quality, cache staleness | G4 |
| "Copy asset id / agent reference" is harmless | 03 | The asset id is a download capability | Leakage | Allow only as an explicit "Copy asset ID" in collapsed raw details |
| REST `/tilesets` also lists sidescroller tilesets | 01 | Doc text only. MCP showed one id in both lists. | Duplicate cards, wrong viewer | G7 |
| Website map id = MCP map id | 03 | Unverified | Map hand-off | G9 |
| npm versions and sizes | 06, 07 | Snapshot on 2026-10-18 | Low | Re-pin at scaffold time |
| **New:** each authenticated REST URL costs one extra preflight | not in any spike | The preflight cache is keyed per URL. Lazy `GET /v2/characters/{id}` calls each pay an OPTIONS round trip. MCP (one URL) caches well. Media GETs are simple requests (no preflight) as long as no custom headers are added. | Latency and possible rate-limit pressure for detail fetches | Fetch details on viewer open only (no background prefetch). Add no headers to media fetches. |

---

## Gaps

Class key: **a** = must verify before implementation (Phase 0, real token, browser console on a localhost origin). **b** = design proceeds on the stated assumption. **c** = defer (YAGNI).

| # | Gap | Class | Assumption or plan |
|---|---|---|---|
| G1 | Hosts and CORS for REST `preview_url`, `rotation_urls`, UI `image_url`, Tiles Pro `storage_urls` (backblaze vs supabase/cdn) | a | Call one list per type and record the hosts. If any host is not backblaze, check its CORS and add it to CSP `img-src`/`connect-src`. |
| G2 | Read cost of a full sync including `get_image` and `view_map` | a | Snapshot `GET /v2/balance` and MCP `get_balance` before and after. Expect zero; any spend changes the design. |
| G3 | Read rate limits | a | Burst list and detail calls at concurrency 2/4/8 and record when 429 appears. Set the semaphore defaults from the result. |
| G4 | Creator-gallery thumbnail cost and staleness | a | Measure `get_image(index=0)` latency and payload for single- and multi-frame items. Check whether bytes change after an overwrite while the id stays the same. Decide: lazy per-viewport fetch, with bytes cached by gallery key in Remember mode. |
| G5 | Map thumbnails | a | Measure the `view_map` image size, format, latency, and whether a crop or downsample exists. Plan for four-figure map counts: lazy-load on viewport only, with a name-only placeholder. |
| G6 | Exact REST bodies: sidescroller get (schema is `{}`), isometric list fields, UI ghost rows, invalid-token 401 body | a | Record and freeze in `normalize.ts` fixtures. |
| G7 | Overlap between REST tileset lists | a | Diff ids from `/tilesets` and `/tilesets-sidescroller`, and de-duplicate by id. |
| G8 | A cheap object state-grouping signal | a | Check whether MCP `list_objects` or another field exposes the group. If not, one card per state. |
| G9 | Hand-off URL validity per type, and the signed-out redirect | a | Open one id route per type (character, object, tileset, Tiles Pro, map) signed in and signed out. Drop any that fail. |
| G10 | Character detail size and latency (frames per animation, bytes) | a | Size the ImageBitmap LRU and decide the preview dwell time. |
| G11 | Default fps | b | 10 fps, with a per-animation override stored locally. |
| G12 | Whether the frame-0 echo can be detected | b | Assume it cannot. No "hide frame 0" toggle in v1. |
| G13 | Trim bounding box | b | Each static thumbnail is trimmed to its own alpha bounding box. The viewer stays untrimmed. |
| G14 | Base state of a character group | b | `state_name` null, else the oldest `created_at`. |
| G15 | Fractional-DPR snapping | b | 06's formula is enough. Verify at DPR 1.25, 1.5, and 2.625 in Phase 1. |
| G16 | Crispness of view-transition snapshots | b | Crossfade only. |
| G17 | iOS blob download limits | b | Per-part cap of 300 MB on iOS and 1 GB on desktop (tuning values). Use the share sheet for single files. |
| G18 | `sessionStorage` in new tabs | b | A new tab may need to reconnect. The Connect screen handles it and explains why. |
| G19 | Gallery search (descriptions are truncated) | b | Search locally over whatever the list returns. Note the limitation. Server-side `search` can come later. |
| G20 | Long-press on `<a>` cards in iOS shows the link callout or preview | b | Use `-webkit-touch-callout: none` and suppress `contextmenu` in select mode. Test on device. |
| G21 | Inspector field map per type | b | Build it from 01's matrix. Hide empty fields. Fetch MCP-only extras (isometric seed, Tiles Pro description and seed) lazily when the viewer opens. |
| G22 | Product name and trademark | b | Keep the working name. The user decides (08 advises against "PixelLab" as the leading word). |
| G23 | PixelLab brand colours vs our accent | b | Use 08 Direction A's ice blue. Check before freezing tokens. |
| G24 | Engine importer compatibility | c | Defer. Claim nothing. |
| G25 | Multi-account org scoping | c | Defer. Org data from another account becomes orphaned keys (harmless). |
| G26 | Offline mode / service worker | c | Defer. |
| G27 | Demo maps beyond square Wang tilesets; UI 9-slice | c | Defer or cut. |
| G28 | Scoped tokens, exposed `Retry-After`, published limits | c | Ask PixelLab upstream (D31). Not app work. |
| G29 | PixelLab user sentiment (Discord) | c | Defer. |

---

## Scope check

Items the user explicitly asked for are marked **(req)**. None of them may be cut.

| Item | Verdict | Why |
|---|---|---|
| Local folders (flat, many-to-many) **(req)** | Keep | Requested. |
| Favorites **(req)** | Keep | Requested. |
| Animation playback: play/pause, frame step, scrubber, FPS override, loop/once, compass direction picker, state switcher **(req)** | Keep | Requested. The FPS override is needed because PixelLab gives no timing. |
| Downloads: original PNG, sprite sheet + JSON, GIF, frames, single-asset ZIP, multi-asset/bulk ZIP **(req)** | Keep | Requested. |
| Open-in-PixelLab hand-offs **(req)** | Keep | Id routes for characters, objects, tilesets, and Tiles Pro; maps after G9. Creator images and UI open `/create?tool=` or the library, plus a copy of the image. |
| Maximum metadata in the detail view **(req)** | Keep | Per-type field map (G21), plus a collapsed raw-details section. |
| Desktop + mobile, all resolutions and orientations **(req)** | Keep | 08 layout matrix, phone portrait through ultrawide, plus a compact-height rule. |
| Token test, forget, and remember; balance shown | Keep | Security and UX baseline. Shows the plan and remaining generations (there is no user-info endpoint). |
| Org JSON export/import | Keep | Prevents data loss (Safari's 7-day eviction). |
| `navigator.storage.persist()`, storage usage, clear cache | Keep | One-line data control. |
| Aseprite-hash JSON for composed sheets | Keep | A sheet without geometry is unusable. One format, about 30 lines. |
| Integer upscale 2/4/8× on PNG, GIF, and sheet exports | Keep (minimal) | One option. A 1× GIF of 32–64 px art is unusable. PixelLab offers 3× itself. |
| `metadata.json` + `manifest.json`/errors in ZIPs | Keep | Supports max metadata and keeps output honest on partial failure. |
| Picker streaming for ZIPs | Keep | About 3 lines; whole-account export needs it. |
| Character trimming + bottom alignment | Keep | Otherwise same-size characters render at different visual weights (canvases 40–90% padded). |
| Tileset sheet view + tile grid overlay + corner info | Keep (minimal) | The metadata is part of "max metadata". |
| Map viewer pan and integer zoom | Keep | Maps exceed the viewport. |
| Light/dark/system | Keep | Cheap. Theme following the OS is expected. |
| Backdrop switcher (theme, checker, N5, N8, black, white) | Keep | Needed to judge pixel art. |
| 3–4 zoom levels (buttons, slider, `+`/`-`) | Keep | Discrete levels keep scaling integer. |
| "Animate previews" toggle | Keep | It is the WCAG 2.2.2 control (C2). |
| Setting to disable single-key shortcuts | Keep | WCAG 2.1.4. |
| `?` shortcut help | Keep | Cheap discoverability. |
| Scroll and tab restore on Back | Keep | NN/g failure mode. |
| Copy image, copy prompt | Keep | Creator hand-off; metadata. |
| Copy asset ID (raw details only) | Keep | Explicit, labelled agent workflow. |
| Selection: Select button, long-press, tap-toggle, Shift/Ctrl-click, Ctrl+A, Esc, no cap | Keep | Multi-asset download needs selection. |
| "Add to folder…" action | Keep | WCAG 2.5.7 requires a non-drag path anyway. |
| APNG export | Cut | GIF and PNG frames cover it. Unmaintained library. |
| Animated WebP; Godot, Unity, and TexturePacker formats | Cut | Already rejected by 06. |
| Naming-template editor | Cut | Use a fixed, slugged scheme. |
| Passphrase-encrypted token; PasswordCredential; CryptoKey obfuscation | Cut | Protects at rest only, or not cross-browser. |
| Font viewer, VFX viewer, VFX/font chips | Cut | No public list path (C8). |
| UI 9-slice preview | Cut | No insets in the API. |
| Onion skin | Cut | Authoring aid, not viewing. |
| Multiple themes (A/B/C) | Cut | 08 agrees. |
| Density modes (comfortable/compact) | Cut | Zoom levels plus container-query meta cover it. |
| Pixel webfont | Cut | SVG wordmark; system fonts. |
| Command palette (⌘K) | Cut | `/` search covers it. Ctrl/Cmd+K is a browser shortcut. |
| Local free-form tags; ratings/flags; colour search | Cut | Not requested. Folders and favorites cover organisation. PixelLab tags are shown read-only and are filterable (characters and objects only). |
| Experimental `/editor?…&images=` deep link | Cut | Undocumented and writes back into the asset. |
| "Copy link" / "Copy PixelLab link" | Cut | App links are useless to others and PixelLab links leak the capability. |
| Ghost or progress cards for generating assets | Cut | Counts only (C10). |
| Pinch to change grid density | Defer | Capturing pinch on the scrolling grid blocks browser pinch-zoom (low-vision users). Buttons and slider cover it. |
| Marquee selection; long-press-drag range select | Defer | Complex with virtualization. 04 itself shows the drag-select gesture is fragile. |
| Desktop drag-to-folder | Defer | "Add to folder…" covers it. |
| Smart views, folder groups, local hide | Defer | Not requested. |
| Nested folders | Cut | Touch-hostile; YAGNI. |
| List/table view; timeline scrubber; floating date pill; group headers | Defer | Not requested. Headers complicate fixed-row windowing. |
| Ping-pong loop; all-directions lockstep; hide frame 0; frame filmstrip; pixel-grid overlay; sprite-sheet viewer | Defer | Viewer polish beyond playback. |
| Tileset demo map, shuffle, sidescroller strip, demo-patch thumbnails | Defer | Wang semantics differ per family. First candidate for v1.1. |
| Minimap | Cut | 06 agrees. |
| Custom backdrop colour picker | Defer | The five fixed swatches suffice. |
| Translucent or blurred bars | Defer | Safari ignores `prefers-reduced-transparency`. Opaque bars are always legible. |
| Foldable viewport segments | Defer | Chromium-only. Width classes cover foldables. |
| Web app manifest + install hint | Defer | Not requested. Org export is the real protection against eviction. |
| Service worker, offline mode, SW-streamed downloads | Defer | Not requested. |
| Background detail prefetch | Defer | Costs reads and preflights. Fetch on open. |
| "Create similar" prefilled-prompt link | Defer | A create flow, not viewing, and it puts the prompt in a URL. |
| Frame-morph view transition | Defer | Polish after the spike (C11). |

---

## Security & privacy findings

| # | Finding | Severity | Required action |
|---|---|---|---|
| S1 | The PixelLab token is account-wide: it can spend credits, delete or retag everything, and reach git, sandbox, and chat tools via MCP. The app cannot shrink that blast radius. | High (structural) | Strict CSP, zero third-party runtime code, no telemetry, text-only rendering. Ask PixelLab for scoped or read-only tokens (D31). |
| S2 | Token placement | High | Send `Authorization` only from one fetch wrapper, and only when the URL origin is exactly `https://api.pixellab.ai`. Never send it to backblaze, MCP no-auth links, or pixellab.ai. Never put it in a URL. Never offer a "copy token" button; show the last 4 characters only. On a 401 "Invalid API token", clear it everywhere. |
| S3 | Mechanical view-only guard | High | The wrapper refuses any method other than GET on `/v2/*`, and allows POST only to `/mcp`. The MCP client allowlist is `list_images`, `get_image` (gallery-ref regex), `list_maps`, `view_map`, plus read-only metadata getters if used (`get_isometric_tile`, `get_tiles_pro`). Everything else is refused before any network call, including `list_projects`, every `create_*`/`edit_*`/`delete_*` tool, `save_to_asset`, and the sandbox, chat, and git tools. |
| S4 | UUIDs are bearer capabilities. Character ZIP/spritesheet and MCP download links need no auth, and backblaze URLs never expire. **Rotating the token does not revoke them.** | High | No raw UUID or storage URL in the URL (C4), in logs, in error text, or in the org export. Use the hashed asset key everywhere except the library cache. "Copy asset ID" is an explicit action only. |
| S5 | Persistent caches undermine session-only mode: snapshots and cached media give permanent read access to the whole library. | High | D15: persistence follows Remember. "Forget token" clears the token, the IndexedDB library, and the Cache API, and offers to keep folders and favorites (hashed keys). The copy should say that the browser's own HTTP cache may still hold images ("clear browsing data to remove"). |
| S6 | `list_projects` returns a git clone URL with an embedded credential. | High | Never call it: it is not needed, because projects do not map to assets. It is excluded by the S3 allowlist. Never parse or log MCP text from tools outside the allowlist. |
| S7 | CSP and headers | Medium | Adopt 02's CSP: `default-src 'none'`; `script-src`/`style-src`/`font-src`/`manifest-src`/`worker-src 'self'`; `img-src 'self' blob: https://backblaze.pixellab.ai`; `connect-src https://api.pixellab.ai https://backblaze.pixellab.ai`; `base-uri 'none'`; `form-action 'none'`; `object-src 'none'`; `frame-ancestors 'none'`. Add `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`. Send them as real headers, so pick a host with header control and reject GitHub Pages. Set `assetsInlineLimit: 0`. Enable Trusted Types only if the Svelte build passes. Revisit hosts after G1. |
| S8 | XSS and injection via API strings | Medium | Never use `{@html}`. Validate every URL taken from API or MCP text with `new URL()` and a host allowlist (backblaze, api.pixellab.ai) before using it in `img`, `fetch`, or `href`. This stops `javascript:` and foreign hosts and enforces CSP intent in code. |
| S9 | ZIP-slip and filename injection | Medium | Build ZIP entry paths and download filenames only from slugged `[a-z0-9-]` names plus a short key suffix. Never use raw names, which may contain `../`, `/`, or control characters. |
| S10 | Logs and error reports | Medium | No error-reporting SDK and no analytics (`connect-src` enforces this). Console output redacts `Authorization` and never prints request URLs with UUIDs. User-facing errors name the type and asset, not URLs. Any future "copy diagnostics" must strip URLs and ids. |
| S11 | Clipboard | Low | Writes only, on a user gesture: image PNG, prompt, and explicit asset ID. No clipboard reads. The token is never copyable. |
| S12 | Hand-off links | Low | `target="_blank" rel="noopener noreferrer"`. The URLs contain UUIDs, but they go only to pixellab.ai (the data owner), which is acceptable. No prompts in query strings (defer "create similar"). |
| S13 | Third-party code | Medium | Runtime: svelte, idb-keyval, @lucide/svelte, client-zip, gifenc. Use a committed lockfile, `npm ci`, `--ignore-scripts`, and pinned versions. **gifenc has had no release since 2021: vendor it** (about 4 KB, audit once). No CDNs and no font CDNs. |
| S14 | Phishing clones (PixelLab accepts every origin) | Medium (outside app control) | Publish one canonical URL, keep the source open, and advise rotating the token after trying third-party tools (rotation semantics are unverified, 02). |
| S15 | Password-manager form vs `form-action 'none'` | Low | The submit handler calls `preventDefault()`. Test that the save prompt still appears in Chrome, Firefox, and Safari. |
| S16 | ToS §2.2 "building your own service" | Medium (launch) | Contact PixelLab before public launch. In the same message, ask about CORS stability, scoped tokens, `Retry-After` exposure, and read limits. |

---

## Decisions so far

| ID | Decision | Rationale | Source |
|---|---|---|---|
| D1 | Pure client SPA calling `api.pixellab.ai` (REST v2 + MCP) and `backblaze.pixellab.ai` directly. No proxy. | Live CORS evidence, re-probed today | 01, 02 |
| D2 | REST v2 is primary for the 7 families. MCP (stateless, about 40 lines over fetch, SSE parse) is used only for the Creator gallery and maps. | REST has JSON and pagination; the gallery and maps are MCP-only | 01, 02, 07 |
| D3 | Mechanical view-only guard: GET-only wrapper plus MCP tool allowlist; `get_image` accepts `gallery:` refs only. | "Strictly view-only" enforced in code, not by convention | 01, 02, this review |
| D4 | Type chips: All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI. Fonts, effects, and portraits get a "not in API" note. | Only listable types | 01 |
| D5 | Vite 8 + Svelte 5 + TypeScript ~6.0 (pinned), plain CSS, native `<dialog>`/popover, hand-rolled hash router, idb-keyval, Lucide, client-zip + gifenc (lazy). No SvelteKit, Tailwind, UI kit, or MCP SDK. | Smallest stack that covers needs | 07 |
| D6 | Two destinations, Library and Collections (Favorites + folders), with type chips and search in Library. Bar, rail, or sidebar by width, same destinations. | Converged platform model; fixes PixelLab's 7-silo flaw | 04, 03, 08 |
| D7 | Uniform square cells, fixed row height, about 40-line windowing, list semantics with `aria-setsize`/`aria-posinset`, 3–4 zoom levels. | Zero-dependency virtualization; accessible | 07, 08 |
| D8 | Rendering: `image-rendering: pixelated`, integer device-pixel `k`, sizing via `width`/`height`. Never transform, `zoom`, `object-fit`, or background-image on art. k < 1 → smooth whole-asset overview. | Spec semantics and Safari bugs | 06 |
| D9 | Static thumbnails: south rotation or first frame. Characters and objects trimmed and bottom-aligned. Tilesets show the returned sheet. | Consistent visual weight; no re-sorting of tiles | 06 |
| D10 | Previews: static default; hover/focus play on fine pointers; no per-card play target on touch; a visible "Animate previews" toggle (off by default) for capped in-view play; viewer autoplays, or opens paused under reduced motion. | Detail-only frames; WCAG 2.2.2; touch parity | C2 |
| D11 | Player: canvas, one shared rAF ticker, per-frame `durations[]`, default 10 fps with per-animation override, loop/once, compass, state switcher. | No PixelLab timing; one clock | 06 |
| D12 | Viewer: modal `<dialog>` with focus return, Back closes it, swipe or arrow keys move between assets, integer zoom, side panel on desktop and bottom sheet on mobile, crossfade transition. | APG modal; pixel-safe motion | 04, 06, 08 |
| D13 | Hash routes use an opaque asset key (truncated SHA-256 of `type:uuid`). Raw UUIDs and storage URLs never appear in URLs. | UUIDs are permanent capabilities | 02 over 07 |
| D14 | Token held in memory + `sessionStorage` by default; opt-in Remember → `localStorage`. Test via `GET /v2/balance`, Forget button, full-access warning, password-manager-friendly form, last-4 display. | OWASP guidance; shared-computer threat | 02 |
| D15 | Cache persistence follows the token mode: Remember → IndexedDB snapshots + Cache API; Session → memory plus the browser HTTP cache. Forget clears both. Org data always persists, keyed by the asset key. | Otherwise the session default is hollow | This review (S5) |
| D16 | Org model: flat many-to-many folders, built-in Favorites, versioned JSON export/import that merges by key. | Requested scope; protects against eviction | 05, 07 |
| D17 | Exports: 1× = original bytes; N× by integer nearest-neighbour; GIF via gifenc (exact palette, cumulative centisecond delays ≥ 2, disposal 2, matte or threshold); sheets in PixelLab's layout + Aseprite-hash JSON; frames in PixelLab's ZIP layout; client-zip in store mode; picker streaming, else Blob with a part cap; manifest of failures. | Pixel-exact output and honest partial failure | 06 |
| D18 | Official exports are reused for single-asset downloads: character ZIP and spritesheet (no auth), object spritesheet (bearer). | Exact PixelLab format, zero re-encoding | 01, 02 |
| D19 | Creator-gallery media comes from `get_image` inline frames → Blob. The presigned S3 URL is never used. | No CORS; expires in 7 days | 01 |
| D20 | The grid shows completed assets only. The header counts generating, review, and failed items, with a hand-off link. | KISS; images are null until completed | 02 over 01 |
| D21 | Hand-offs go to verified id routes (maps after G9). Creator images and UI open `/create?tool=` or the library, plus a copied image. New tab, `noopener noreferrer`, tier and desktop-only hints. No editor deep link. | Undocumented routes, so only the most stable ones | 03 |
| D22 | One token set (08 Direction A), light/dark/system, chroma-0 stage, backdrop switcher, theme surface as the grid default, system fonts, SVG wordmark, opaque bars. | Art-first, lowest a11y risk | 08, 07 |
| D23 | CSP and security headers per S7, served as real headers by a host with header control. | Clickjacking and exfiltration limits | 02, 07 |
| D24 | No telemetry, analytics, error reporting, or CDNs. Text-only rendering. API URL host allowlist. Slugged filenames and ZIP paths. | XSS, exfiltration, and ZIP-slip defence | 02, this review |
| D25 | Networking: per-host semaphores (API 4, dropping to 2 on 429; media 8), exponential backoff with jitter (no `Retry-After`), 401 stops everything and prompts, 423 = generating, in-flight dedupe, `AbortController`. Media fetches add no headers and no credentials. | Unpublished limits; unreadable headers | 02 |
| D26 | Sync: lists paged at their maximum `limit`; details fetched lazily when the viewer opens; characters refreshed on `updated_at`/`?t=` change; tileset type decided by list membership. | Minimal reads and preflights | 01, 02, C22 |
| D27 | Keymap as in C17, plus a setting to turn single-key shortcuts off. | Resolves the collisions; WCAG 2.1.4 | C17 |
| D28 | WCAG 2.2 AA baseline: 2.5.7 alternatives (Add to folder…, buttons for every swipe), 2.5.8 targets (44 px policy on touch), 2.4.11 `scroll-padding`, 2.2.2 via the preview toggle, forced-colours outlines, reduced motion. | Never weaken accessibility | 08, 07 |
| D29 | Selection: Select button + long-press, tap-toggle; desktop click/Shift/Ctrl, Ctrl+A, Esc; no cap; count bar with Download, Add to folder, Favorite. | Requested bulk download | 04, 05, 08 |
| D30 | Tests: Vitest for pure modules (normalize, router, key hash, palette, GIF delays, ZIP manifest), Playwright with a mocked API on desktop and mobile, svelte-check, and a CI bundle budget. | Covers flows without a token or credits | 07 |
| D31 | Contact PixelLab before public launch (ToS §2.2, CORS stability, scoped tokens, `Retry-After`). | Launch risk outside app control | 02 |

---

## Open issues for design synthesis

1. **Phase 0 results gate implementation.** Run G1–G10 with a real token and feed the results back into D2, D9, D19, D25, D26, and CSP.
2. **Creator-gallery thumbnails** (G4): one `get_image` per item, the cache key, staleness after overwrites, and behaviour in session mode, where nothing persists.
3. **Map thumbnails** (G5): `view_map` per map against four-figure counts. Lazy loading with a name-only placeholder, or no thumbnail at all.
4. **Object state cards** (G8): one card per state, or a grouping signal if Phase 0 finds one.
5. **Character bulk ZIP** (C23): recommended client-built layout vs nested official ZIPs. Confirm.
6. **Session-mode startup cost:** a full list sync on every session (about 10–30 REST pages plus MCP pages). Measure it and decide whether a progress skeleton is enough.
7. **Inspector spec per type** (G21): fields, order, copy buttons, lazy MCP extras, and collapsed raw details including the explicit "Copy asset ID".
8. **Export matrix per type:** what "PNG / sheet / GIF / frames / ZIP" means for characters, objects, gallery images, tilesets, Tiles Pro, isometric tiles, maps, and UI. Includes the default GIF scale and naming scheme.
9. **Zoom levels and cell sizes** per breakpoint, plus the art-box inset. Work out integer `k` for common sizes (16/32/48/64/68/84/92/128 px) at DPR 1, 1.25, 1.5, 2, and 3.
10. **Phone landscape navigation:** compact rail (08) vs bottom bar (Android default; 04 left it open). Decide.
11. **Settings and Connect copy:** session vs remember semantics ("this tab"), what Forget clears (including the HTTP-cache note), the full-access warning, the rotation link, and the unofficial disclaimer.
12. **Empty, error, and edge states:** CORS-blocked (PixelLab changed access), 401, offline, partial sync, "not in API" types, generating/review counts, and a new tab without a token.
13. **iOS long-press on link cards** (G20): interaction spec for select mode vs the native callout.
14. **Search and sort spec:** searchable fields per type (name, prompt, tags, description), the gallery truncation note, and the sort set from C20.
15. **"Animate previews" under reduced motion:** default off only, or forced off? Recommendation: default off, and an explicit user opt-in wins.
16. **Name and branding** (G22) and **accent vs PixelLab brand** (G23). These are user decisions before visual freeze.
17. **Final keymap and help overlay** (C17), including what a "shortcuts off" setting disables.
