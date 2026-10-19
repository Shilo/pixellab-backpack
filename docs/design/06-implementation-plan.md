# 06 — Implementation Plan: Vitrine

Working name **Vitrine**. Status: plan baseline, 2026-10-18.

**Companion to:** `05-architecture.md` (how), `02-ux-spec.md` (behaviour), `01-product-brief.md` (scope and success criteria).

**Gate items come from:** R1 G1–G10 and research 09's "Still unverified" checks 1–8, mapped once in §2.3's "Maps to" column. Every other doc cites the P0 numbers (B-3).

**Sizes:** S ≤ ½ day · M = 1–2 days · L = 3–5 days, for one developer who knows Svelte 5.

**Lanes:** tasks marked with the same lane letter (A/B/C) can run in parallel once their dependencies are met.

---

## 1. Phase overview

| Phase | Goal | Exit gate |
|---|---|---|
| **0: Gate** (~½ day, owner-run, real token) | Answer the 10 R1 gaps and research 09's checks before any code depends on them. Phase 1 tasks that need no Phase 0 output may start first (§3.1, B-1) | §2.4 results recorded; 05 updated; `VITE_IMAGES` decided |
| **1: MVP** | Connect, sync the 7 REST families, library grid, viewer + player, inspector, favorites/folders, single-asset downloads | §3.2 acceptance + §3.3 demo |
| **2: MCP + exports** | Creator images (gated) and maps via MCP; GIF/sheet/frames/N× exports; multi-asset/bulk ZIP; org backup import/export | §4.2 + §4.3 |
| **3: Polish** | Help overlay, settings completeness, performance, a11y audit, device matrix, optional PWA manifest | §5.2 + release gate (§6.3) |

The visual direction is resolved: the "Quiet Studio, lifted" hybrid in `07-recommended-design.md` (F-1, F-3). `mockups/recommended/` illustrates it but ranks below the docs; the precedence order is at the top of `00-decision-log.md` (B-5). Shell tasks 1.10 and 1.13 build design 07 directly. All rulings are in `00-decision-log.md`.

---

## 2. Phase 0: Gate (owner-run, ~½ day)

### 2.1 Ground rules

1. **Who:** the owner, on their own account, in desktop Chrome. No agent or script runs these checks with the token. The same rule covers every real-key and real-device check in Phases 1–3 (tasks 1.22, 2.9, 3.3–3.5, the §3.2 real-key items and the demos): the builder writes the checklist, the owner runs it and signs it in the results doc (B-2).
2. **No tokens in files.** The token is typed into a `prompt()` box. It lives only in that tab's memory and never enters console history, files, commands, screenshots or notes.
3. **Record only** hosts, path patterns (ids replaced with `<uuid>`), field names and types, counts, sizes, timings, and pass/fail. **Never record** ids, full URLs, prompts, names, balances, the user id or account totals beyond order of magnitude.
4. **Results go to:**
   - `docs/research/10-phase0-results.md` (new).
   - Shape-only fixtures in `tests/fixtures/rest/` and `tests/fixtures/mcp/`, with values replaced by placeholders.
5. **Do not generate, edit, tag or delete anything in PixelLab** (any tab, any agent) between P0-1's baseline and P0-14, or the read-cost check is void.
6. **Stop on surprise.** Any spend, any write, or any non-allowlisted tool behaviour stops Phase 0. The design is revisited first.

### 2.2 Setup (P0-0)

1. In a terminal, create an empty scratch folder **outside the repository**. Run `python -m http.server 5173 --bind 127.0.0.1`, or any static server.
2. Open `http://localhost:5173` in Chrome. A localhost origin reproduces the app's CORS conditions (R1).
3. Open DevTools: Console, plus Network with "Preserve log" on.
4. Paste this helper. It contains no token and refuses every tool outside the app's allowlist (05 §4.2):

```js
// Phase 0 console helper. Paste once per tab. Contains no secret.
const T = prompt('PixelLab token (kept in this tab only)');
const API = 'https://api.pixellab.ai';
const RO = new Set(['list_images','get_image','list_maps','view_map','get_map','list_map_objects','get_isometric_tile','get_tiles_pro']);
const api = async (p, tok = T) => { const t0 = performance.now(); const r = await fetch(API + p, { headers: { Authorization: 'Bearer ' + tok } });
  const json = (r.headers.get('content-type') || '').includes('json'); return { status: r.status, ms: Math.round(performance.now() - t0), body: json ? await r.json() : await r.blob() }; };
const rpc = async (method, params = {}) => { const t0 = performance.now(); const r = await fetch(API + '/mcp', { method: 'POST',
  headers: { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); const text = await r.text();
  const res = JSON.parse(text.split(/\r?\n/).find(l => l.startsWith('data:')).slice(5)).result; return { ms: Math.round(performance.now() - t0), bytes: text.length, res }; };
const mcp = (name, args = {}) => { if (!RO.has(name)) throw new Error('not allowed: ' + name);
  if (name === 'get_image' && !/^gallery:(\d{13}|[0-9a-f-]{36})$/.test(args.job_id)) throw new Error('gallery refs only');
  return rpc('tools/call', { name, arguments: args }); };
const pat = (u) => { try { const x = new URL(u); return x.host + x.pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, '<uuid>').replace(/\d{10,}/g, '<n>') + (x.search ? ' ?' + [...x.searchParams.keys()].join('&') : ''); } catch { return 'not a URL'; } };
const shape = (v) => Array.isArray(v) ? (v.length ? [shape(v[0])] : []) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : v === null ? 'null' : typeof v;
const all = async (path, key, limit) => { const out = []; let off = 0, total = Infinity;
  while (off < total) { const b = (await api(`${path}?limit=${limit}&offset=${off}`)).body; total = b.total; out.push(...b[key]); if (!b[key].length) break; off += b[key].length; } return out; };
```

- `pat(url)` prints `host + path` with ids masked, plus parameter **names** only. It is safe to record.
- `shape(obj)` prints field names and types with no values. Use DevTools `copy(JSON.stringify(shape(x), null, 2))` for the fixtures.
- **Session end:** close the tab. Nothing persists.

### 2.3 Checks

Order matters: P0-1 opens the cost window and P0-14 closes it. P0-9 and P0-13 run only after the owner approvals in §2.5.

This numbering is canonical (B-3). The "Maps to" column is the only place R1's G-numbers and research 09's check numbers are mapped to P0 checks; every other reference uses the P0 number.

| # | Check | Maps to (R1 G / research 09 #) | Procedure | Pass / fail criteria | Unblocks / changes |
|---|---|---|---|---|---|
| **P0-1** | Read-cost baseline | G2 (with P0-14) | `await api('/v2/balance')`. Note credits and remaining generations **privately**, on paper. Record only "baseline taken" | Baseline only; verdict in P0-14 | D2, D26, R-4, R-6 |
| **P0-2** | Authenticated tool annotations | 09 #8 | `const tl = (await rpc('tools/list')).res.tools;` then `tl.filter(t => RO.has(t.name)).map(t => [t.name, t.annotations])` and `tl.length`. Record the 8 annotation sets and the total count. Note whether `tl` has a `nextCursor` | **Pass:** the 7 non-image tools have `readOnlyHint: true`; `get_image` has `destructiveHint: false`. **Fail:** any of the 7 is not read-only → that feature is off (05 §4.2 gate) and the design is reviewed | D3 gate values (05 §4.2); confirms single-page `tools/list` |
| **P0-3** | REST media hosts and CORS | G1; 09 #1 | 1. `const c = (await api('/v2/characters?limit=1')).body.characters[0]; pat(c.preview_url)`. 2. `const d = (await api('/v2/characters/'+c.id)).body; Object.values(d.rotation_urls).filter(Boolean).map(pat); pat(d.animations[0]?.directions[0]?.frames[0])`. 3. Repeat for `/v2/objects?limit=1` (`preview_url`; detail `rotation_urls`, `storage_urls`), `/v2/ui-assets?limit=1` (`image_url`) and one `/v2/tiles-pro/{id}` (`storage_urls`). 4. For one URL of each kind: `const r = await fetch(url, {credentials:'omit'}); [r.status, (await r.blob()).type]`. A CORS failure throws `TypeError`; success means readable. 5. Note whether `?t=` is present | **Pass:** every host is `backblaze.pixellab.ai` and every fetch resolves 200 `image/png`. **Other host with CORS:** add it to `safeMediaUrl`, `send()` and `connect-src` (05 §4.4). **Other host without CORS:** stop; that type needs another media path (redesign item) | CSP `connect-src`; `safeMediaUrl`; `rev` / staleness rule (`?t=` present?) |
| **P0-4** | REST bodies and errors | G6; 09 #2, #3 | 1. `shape(...)` of one page each: characters, objects (confirm **no** `group_id`), tilesets, tilesets-sidescroller, isometric-tiles, tiles-pro, ui-assets. Note whether the tileset, isometric and Tiles Pro rows carry `status` (B-15). 2. `shape` of `/v2/tilesets-sidescroller/{id}` (schema `{}`) and `/v2/tiles-pro/{id}`. 3. UI ghost rows: `(await all('/v2/ui-assets','ui_assets',100)).filter(u => u.status !== 'completed' \|\| !u.image_url).length` plus `shape` of one ghost row. 4. Invalid token: `await api('/v2/balance', 'invalid-test-value')` → record status and `detail` text. 5. In the Network panel, on one authenticated JSON response, record whether `ETag`, `Cache-Control` and `Last-Modified` are present | **Pass:** shapes match research 01/09 (05 §3.3). Differences are recorded and folded into `normalize.ts` before task 1.5. 401 body recorded (expected `{"detail":"Invalid API token"}`) | `normalize.ts` fixtures; 401 handling; whether JSON is cacheable (expected: no validators) |
| **P0-5** | Tileset list overlap | G7 | `const td = new Set((await all('/v2/tilesets','tilesets',100)).map(x=>x.id)); const ss = new Set((await all('/v2/tilesets-sidescroller','tilesets',50)).map(x=>x.id)); [td.size, ss.size, [...ss].filter(x=>td.has(x)).length]` | Record three counts. Either outcome passes; the rule "sidescroller membership wins, de-duplicate by id" (C22) holds both ways | Confirms 05 §5.1 order 4a → 4b and `classifyTileset` |
| **P0-6** | Object state-grouping signal | G8 | Pick an object the owner knows has ≥ 2 states. Compare the `ObjectSummary` keys of both rows for any group-like field. Fetch both details and compare `group_id` (detail only) | **Signal in the list:** record the field name. **No signal:** one card per state (R-7, default) | 05 §3.3 object row; object state switcher on or off |
| **P0-7** | Character detail size and latency | G10 | For 3 characters (few, average and most animations): `const r = await api('/v2/characters/'+id)`. Record `r.ms`, `JSON.stringify(r.body).length`, animation count, frames per direction, total frame URLs. Then fetch every frame of one animation × direction with `fetch(url,{credentials:'omit'})` and record total ms and the byte range per frame | **Pass:** detail p50 ≤ 800 ms. Above that, keep hover-play but show the static frame until frames decode (already specified); tune only the dwell. Record bytes per frame for LRU sizing | LRU caps (05 §5.5, §11.4); hover dwell; viewer-open target check |
| **P0-8** | Read throughput and rate limits. **Owner acknowledgment A3** | G3; 09 #4 | Run 40 × `/v2/characters?limit=1` at concurrency 2, then 4, then 8, with a small worker-pool loop (`Promise.all` over N workers pulling from a counter). Record status counts and p50/p95 ms per level. Then up to 100 × `/v2/characters/{id}` or `/v2/objects/{id}` at concurrency 4 (ids from `all(...)`). **Stop at the first 429**, wait 60 s, and record the level and the body text | **Pass:** no 429 at concurrency 4 → API lane stays at 4 (never above 4 without PixelLab's word; D31). 429 at 4 → lane default 2. 429 at 2 → also add a fixed 250 ms spacing between low-priority requests, **and Play previews defaults to off** | 05 §4.1 semaphore table (D25); `PREVIEWS_DEFAULT_ON` (05 §5.3; F-9) |
| **P0-9** | `get_image` side effects and shape. **Owner approval A1**. Sets `VITE_IMAGES` (with P0-14) | G4; 09 #5 | 1. `const before = (await mcp('list_images',{limit:5})).res;` note the total and top 5 refs (memory only). 2. Choose 1 multi-frame item (prefer a `3x3` 8-rotation item, and a vocal item if present) and 1 single-frame item. 3. Call `mcp('get_image',{job_id: ref})` **twice** per item. Record: image-block count, JSON `frames`, inline frame size (decode one block: `createImageBitmap(new Blob([Uint8Array.from(atob(b.data), c=>c.charCodeAt(0))]))`), `bytes`, `ms`. 4. Call `{job_id: ref, index: k}` for k past the inline set and record the behaviour. 5. Call `{job_id: ref, index: 0}` and record bytes and ms (thumbnail cost). 6. Re-list: `(await mcp('list_images',{limit:5})).res` → **total, order and top 5 refs must be unchanged**. 7. Open the Creator gallery on the PixelLab website and confirm nothing new or changed. **Do not open `download_url`** (R1 C1). Optional, owner's choice: overwrite an image on the website, then re-read to see whether bytes change under the same id | **Pass (all unchanged; P0-14 shows no spend):** `VITE_IMAGES=true`. **Fail or approval declined:** `VITE_IMAGES=false` → Images gate card (02 §8). Record frames-vs-listed-size agreement (expected: listed `WxH` = per-frame size; 09 Q6) | R-4; D19; 05 §5.4 image row (dwell 300 ms, `index:0`); 05 §5.2 staleness (no overwrite test → "Reload from PixelLab" stays the only fix) |
| **P0-10** | Map thumbnail cost | G5 | 1. `(await mcp('list_maps',{limit:5})).res` → total maps (order of magnitude only). 2. `view_map` on 3 maps (small, large, largest): record `mimeType`, decoded size, `bytes`, `ms`. 3. One call with a small crop (`x,y,width,height`) to see whether the payload drops | **Default kept** (lazy, 300 ms dwell, render lane 1, cancel on scroll) if p50 ≤ 2 s and ≤ 1 MB per render. **Otherwise:** name-only placeholder in the grid; render only in the viewer | R-6; 05 §5.4 map row |
| **P0-11** | MCP text-format fixtures | research 01/09 formats | Capture `res.content[0].text` from one page of `list_images` (only if A1 given), `list_maps`, `get_map`, `list_map_objects` (`limit:200`), `get_isometric_tile` and `get_tiles_pro`. Before saving, replace every id with `00000000-0000-4000-8000-000000000000` or `1700000000000`, every URL with `<url>`, and hand-edit names, prompts and descriptions to neutral placeholders. Save to `tests/fixtures/mcp/<tool>.txt` | **Pass:** every 05 §4.3 regex matches the captured layout (verified in task 2.1 tests). **Mismatch:** update 05 §4.3 before Phase 2 | `mcpText.ts`; 05 §4.3 |
| **P0-12** | Hand-off URL validity | G9 | For character, object, top-down tileset, Tiles Pro and map: open the 02 §3.11 route with a real id, (a) signed in, (b) in a private window signed out → sign in → note where it lands. Record per type: lands on asset / library page / error, and whether the post-sign-in redirect keeps the target | **Pass per type:** lands on the asset → keep the id route. **Fail:** use the type's library page (02 §3.11 fallback) | D21; `Inspector` link table |
| **P0-13** | Export timing metadata. **Owner approval A2** | 09 #7 | Download one character's no-auth sprite sheet: `const b = await (await fetch(API+'/v2/characters/'+c.id+'/spritesheet',{credentials:'omit'})).blob(); const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(b),download:'p0-sheet.zip'}); a.click();` (about 100 KB). Open it locally and inspect `<name>.json` for any fps/duration field. Optionally do the same with `/zip` and its `metadata.json`. Record field names only, then delete the files | **fps/duration present:** it becomes the timing source for that type, with `fpsSource: "pixellab"` in exports (02/05 updates). **Absent:** 8 fps default stands (R-1) | Player default source (05 §7.3); export metadata |
| **P0-14** | Read-cost verdict | G2 (with P0-1) | `await api('/v2/balance')` and compare with the P0-1 note | **Pass:** credits and generations unchanged → reads, `get_image` and `view_map` are free. **Fail:** stop. MCP thumbnails become viewer-only, Play previews defaults to off, and session-mode full sync on every start is reconsidered | Confirms D2/D26/R-4/R-6 as specified; `PREVIEWS_DEFAULT_ON` (F-9) |

Skipped on purpose: 09 #6 (`get_lip_sync`). Talking animations are a v1 non-goal (brief §5), so nothing depends on it.

### 2.4 Outputs and doc updates

| Output | Where |
|---|---|
| Results table (one row per check: result, numbers, decision) | `docs/research/10-phase0-results.md` |
| Shape-only REST fixtures | `tests/fixtures/rest/*.json` |
| Placeholder MCP text fixtures | `tests/fixtures/mcp/*.txt` |
| Doc edits | 05 §4.1 (permits), §4.4 (hosts), §5.3 (preview default), §5.4 (map/image rows), §3.3 (object grouping), §14; 02 §3.11 (hand-off table) if P0-12 changes it |
| Build flags | `VITE_IMAGES` default in `.env` (true only if P0-9 passes with A1 and P0-14 shows no spend); `PREVIEWS_DEFAULT_ON` (true unless P0-8 or P0-14 trips it). Before these land, every Phase 0 constant holds its failed or declined default (05 §14; B-1) |

### 2.5 Owner approvals required before Phase 0

| ID | Approval | Needed by | If declined |
|---|---|---|---|
| A1 | Accept the `get_image` gray area: it is annotated not read-only, though gallery refs are expected to only read (R1 C3, 09 Q1) | P0-9, and the `list_images` capture in P0-11 | `VITE_IMAGES=false`; Images ship as the honest gate card |
| A2 | One export download of the owner's own character sprite sheet (≈ 100 KB) | P0-13 | 8 fps default stands; timing labelled "not provided by PixelLab" |
| A3 | Acknowledge that the burst test may briefly rate-limit the account's reads (no writes, no spend) | P0-8 | Lane stays at the conservative 2 |

---

## 3. Phase 1: MVP

### 3.1 Scope and ordered tasks

**Scope:**
- Connect, plus session and remember modes.
- Sync of the 7 REST families.
- Library grid with chips, search and sort.
- Viewer with player for characters and objects; static viewers for tilesets, Tiles Pro, isometric tiles and UI.
- Inspector.
- Favorites, folders, selection.
- Single-asset downloads: PNG 1× and PixelLab originals.
- Settings v1 and the keymap.

**Out of Phase 1:** MCP (maps, images), worker exports, multi-asset ZIP, org backup.

**Before Phase 0 results land (B-1):**
- Tasks 1.1–1.4, 1.6, 1.7, 1.9, 1.10 and 1.13 need no Phase 0 output. They may start before Phase 0 runs, on contract-shaped synthetic fixtures (research 01, 09).
- Every Phase 0-dependent value is one named constant held at its failed or declined default: `VITE_IMAGES=false`, the API lane at 2 permits, library-page hand-offs, and the rest of 05 §14.
- Task 1.5 builds `normalize.ts` from the P0-4 fixtures, so it and every task that depends on it (1.8, 1.11, 1.12, 1.14–1.21) start after the results are recorded. Task 1.22 runs last; its real-key and device items are owner-run (B-2).
- When `docs/research/10-phase0-results.md` lands: set the constants from it, swap in the real fixtures, and rerun the unit and e2e suites.

| # | Task | Depends | Lane | Size | Done when |
|---|---|---|---|---|---|
| 1.1 | Scaffold at the project root, beside `docs/` and `mockups/` (05 §2.1), after a local `git init` (B-4): `npm create vite` (svelte-ts); exact pins (05 §10.4); strict tsconfig; prettier (`.prettierignore` covers `docs/` and `mockups/`); svelte-check; vitest; Playwright projects (05 §12.3); `public/_headers` applied to `vite preview`; `theme.js`; `lib/app.ts` (`APP_ID`, `APP_NAME`; B-7); `scripts/guard.mjs` + `budget.mjs`; fixture generator skeleton. The 05 §12.5 gates run locally; the GitHub Actions workflow is added only once a remote exists | — (B-1) | — | M | The 05 §12.5 gates pass on an empty shell; `vite preview` serves the production CSP; budget script prints sizes |
| 1.2 | Strict-CSP build check: Svelte 5 under `style-src 'self'` with no inline output; Trusted Types trial | 1.1 | A | S | e2e sees zero `securitypolicyviolation`; TT decision recorded in 05 §10.2 |
| 1.3 | `key.ts`, `fit.ts` (+ dpr rune), slug helper, with unit tests | 1.1 | A | S | 05 §12.1 vectors pass |
| 1.4 | `http.ts`: request guard, priority semaphores, retry/backoff, refcounted dedupe, error classes, CORS probe | 1.1 | A | M | Unit tests: zero fetch on refused shapes; auth only on `/v2` + `/mcp`; backoff; 401 abort |
| 1.5 | `types.ts` + `normalize.ts` for the 7 REST families using P0-4 fixtures; character grouping + aliases; pending counts (incl. tile families, B-15); search text | 1.3; Phase 0 results (P0-4) | A | M | Unit tests per family incl. a base state arriving on a later page |
| 1.6 | `store.ts`, `media.ts` (L1/L2, quota), `session.svelte.ts` (test token, modes, Forget, 401) | 1.4 | A | M | Unit tests for mode transitions; Forget leaves no IndexedDB `lib`/`detail:*` keys, no cache, no token |
| 1.7 | Connect view (S1) + flows: auto-test on paste, Test key fallback, ok, 401, offline, CORS-blocked, welcome back, password-manager form; the post-sync "Keep me signed in" banner (S24) | 1.6 | A | M | e2e for each branch; token never in URL or storage outside its mode; banner shown once, never blocking |
| 1.8 | `sync.ts` (REST plan, page-0-first ordering, flush, progress, removal, `rev`) + `library.svelte.ts` | 1.5, 1.6 | A | L | e2e: streaming with delayed routes, viewer usable mid-sync, removal only after a complete family, partial-sync chip |
| 1.9 | `ticker.ts` + player state machine (05 §7.3); `PixelCanvas.svelte` (fit, both k cases, destroy release) | 1.3 | B | M | Player unit tests; component renders crisp at 5 DPRs in the e2e dpr project |
| 1.10 | `router.svelte.ts` (path-first routes), `prefs.svelte.ts`, shell per form factor (design 07 §2: pill + phone search bar, rail, sidebar; bottom padding for the pill; safe areas), skip link, live regions, scroll/focus restore | 1.1 | C | L | Router unit tests; layout project: no horizontal scroll, correct nav per viewport; phone search never hides the pill |
| 1.11 | `VirtualGrid.svelte` + `Card.svelte` (anatomy, default/focused/selected states, long-press per 02 §9.4, list semantics, roving focus) + `thumbs.ts` for REST types incl. Tiles Pro 2×2 and trim | 1.8, 1.9, 1.10 | — | L | e2e: pixel integrity at 6 DPRs and after a live DPR change + resize; ≤ 1,400 DOM nodes with 5,000 fixtures; arrow/Home/End focus; placeholder → art |
| 1.12 | Library header: 8 chips (radiogroup; 44 px on touch), search (150 ms debounce, `#tag`), sort menu (incl. Characters-only "Recently updated"), grid size, View sheet (phone), result/status line ("Synced just now"), sync popover, in-progress popover, empty/no-results/end states with the idle sprite, not-in-API note at the end of All | 1.11 | C | M | e2e for each state; search unit timing ≤ 50 ms |
| 1.13 | Viewer container (`<dialog>`) + navigation: open on click/tap/Enter/Space, close, prev/next (keeps animation + direction), Back, deep link, unknown key, focus return, crossfade/cut; zoom `− [Fit · N×] +` with the readout toggle, pan; one Backdrop button with 5 swatches; control rows ≤ 960 px; gestures | 1.10, 1.9 | B | L | e2e: Back closes in one step; replace inside the viewer; focus lands on the card; zoom stays integer |
| 1.14 | `detail.ts` + playback UI for characters/objects (picker, inline compass / phone compass popover, state switcher, transport with the filmstrip, fps stepper + reset, loop); static viewers for tilesets (grid overlay, tile info from H metadata), Tiles Pro (√n grid, rules), isometric, UI | 1.13, 1.8 | B | L | e2e: Android-Courier-style fixture walk; filmstrip seek; direction disable/fallback; fps override persists |
| 1.15 | `Inspector.svelte` (the Info panel) for REST types (02 §5.1, 5.2, 5.4–5.7, 5.9): header with **Open in PixelLab ↗** + **More in PixelLab ▾** (credit notes) per P0-12, Download tiles, hidden empty fields, copy prompt, tag chip → `#tag`, folder chips, Technical details (masked ID + Copy asset ID warning), labels stacking at 200% text | 1.14 | C | M | e2e field presence per fixture; hand-off links `noopener noreferrer`; no UUID visible outside the masked ID |
| 1.16 | Previews: Play previews on by default (≤ 8 playing, preview detail through the 1-permit gate, `PREVIEWS_DEFAULT_ON`); off at start under reduced motion or Save-Data unless explicitly on; hover/focus 300 ms play (fine pointer); pause on hidden | 1.11, 1.14 | B | M | e2e: ≤ 8 players and ≤ 1 preview detail in flight; reduced-motion and Save-Data start off; the toggle stops every player |
| 1.17 | `org.svelte.ts`; favorites (card, viewer, `L`); Folders page (Favorites pinned, 2×2 mosaic covers); Folder view; Add to folder popover / half sheet (tri-state, create-and-check); name dialog; delete confirm; undo toasts; unavailable-items line | 1.11 | C | L | e2e: org survives reload in both modes; orphans only after a complete sync |
| 1.18 | `selection.svelte.ts` + selection mode (Select, long-press, checkbox, Ctrl/Shift-click, `x`, Ctrl+A, Esc, Back via overlay entry) + bottom bar and the ≥ 1200 px summary panel for ≥ 2 selected (Favorite, Add to folder, Remove from folder; Download for exactly 1 selected) | 1.17 | C | M | e2e on fine and coarse projects; "N hidden by filter" note; panel ↔ bar switch at 2 |
| 1.19 | Single-asset downloads: Download menu (S8, ≤ 4 items; Phase 1 shows only its PNG and PixelLab original (ZIP) items; the primary for animated types reads "Download ZIP", B-11, and for an animated object with no rotation images "Download sprite sheet", the official object sheet, B-20) for PNG 1× (still view, single image, tileset sheet, tile, UI, isometric) and PixelLab originals (character ZIP, object sheet, Tiles Pro ZIP); `save.ts` (`<a download>`, compact S11 share sheet); slugged filenames | 1.14 | A | M | e2e: PNG byte-identical to the fixture; originals saved under slugged names |
| 1.20 | Settings v1: connection (status with last 4, balance, Test, Keep me signed in toggle + stop confirm, Forget key confirm, rotate-key link), library (Sync now, Play previews, grid size, default backdrop), appearance, keyboard toggle, about (with the not-in-API note) | 1.7, 1.17 | C | M | e2e: turning Keep me signed in off deletes snapshot and cache immediately; Forget dialog options |
| 1.21 | Keymap (02 §9.3, incl. Space opens a card) + single-key shortcuts off switch | 1.13, 1.18 | B | S | e2e: every ✓ key disabled when off; functions still reachable by controls |
| 1.22 | Phase 1 verification pass: network recorder on every e2e; storage assertions per mode; axe on Phase 1 screens; manual password-manager save prompt in Chrome/Firefox/Safari (S15); `sessionStorage` new-tab and session-restore behaviour (G18); iOS long-press callout (G20); DPR 1.25/1.5/2.625 snapping (G15); first-card time with a real token. The builder writes the checklist; the owner runs the real-key, browser and device items (B-2) | all | — | M | Checklist signed by the owner in `docs/research/10-phase0-results.md` §Phase 1 checks |

**Parallelism:** after 1.1, lanes A (1.2–1.8), B (1.9) and C (1.10) run in parallel. 1.11 joins them. After that, lane B (1.13 → 1.14 → 1.16, 1.21) and lane C (1.12, 1.15, 1.17 → 1.18, 1.20) run side by side. 1.19 sits in lane A after 1.14.

### 3.2 Acceptance criteria

The owner verifies the real-key and real-device parts of items 1–2 from the builder's checklist (B-2).

1. A real API key connects on paste: 1 action after copying on desktop, ≤ 6 taps from landing on a phone (01 §9). 401, offline and CORS-blocked each show their 02 §12.2 copy.
2. First sync streams. The skeleton appears ≤ 100 ms after Connect, and the first real card ≤ 2 s on desktop broadband with the real account (p75 of 3 runs). The viewer, search and favorites work mid-sync.
3. All 7 REST families appear with the correct chips, counts, badges and in-progress chip. Characters are one card per group; objects one card per state (or grouped, if P0-6 found a signal).
4. Pixel integrity: 100 % of art canvases have an integer `cssWidth·dpr / canvas.width`, or the smooth flag, at DPR 1, 1.25, 1.5, 2, 2.625 and 3, and after a live DPR change + resize. No transform, zoom, object-fit or background-image on art.
5. Playback: autoplay at 8 fps; step, filmstrip seek, fps stepper + reset, loop/once, compass with disabled directions, state switcher. Reduced motion opens paused.
6. Favorites and folders persist across reload in both modes. Forget (with the box unticked) keeps them.
7. 1× PNG downloads are byte-identical to the source. PixelLab originals pass through.
8. View-only: the recorder sees 0 non-GET `/v2` requests, 0 MCP calls (none exist yet), and no token in any URL. The hash never contains a UUID.
9. Session mode leaves no `lib`, `detail:*` or Cache API data. Remember mode paints the cached grid on reload before any network response.
10. CI is green: svelte-check with no warnings, unit, e2e (5 projects + layout + dpr), budget (initial JS ≤ 60 KB gz), guard, axe 0 serious/critical on Phase 1 screens.

### 3.3 Demo script (≈ 10 min, real token, desktop then phone; the owner drives, B-2)

1. Open the app. The API key field is focused (desktop). Paste the key → it tests itself → skeleton → cards fade in → "Synced just now" → the "Keep me signed in" banner appears.
2. Tap Characters → type "mage" → open a character. It plays at 8 fps. Step with `.`, tap a filmstrip frame, rotate with `]`, set 12 fps on the stepper, reset, switch state.
3. Press Esc → focus returns to the card. Press Back → no extra history entry.
4. Heart it with `L`. New folder "Demo" → Add to folder. Reload → still there.
5. Download → PixelLab original (ZIP). Open a tileset → Download PNG (open the file: crisp, identical bytes).
6. On the tileset → Grid (in the Animation picker's slot; B-10) → click a tile → tile info.
7. Accept "Keep me signed in" → reload → the cached grid appears instantly with "Checking for new assets…".
8. Settings → Forget key (box unticked) → Connect screen. Folders remain after reconnecting.
9. Phone (real device): long-press selects without a callout; search, then reach Folders through the pill; swipe between assets; bottom sheet peek → full; on a tileset, tap a tile → tile info, tap the backdrop → chrome hides (B-9).

### 3.4 Risks (Phase 1)

| Risk | Mitigation |
|---|---|
| Svelte output violates `style-src 'self'` | Task 1.2 first; refactor to classes or `style:` directives; never add `'unsafe-inline'` |
| Play previews on by default trips read limits | ≤ 8 players; preview detail through the 1-permit gate at low priority; `PREVIEWS_DEFAULT_ON` flips with P0-8/P0-14 |
| Real-account size exceeds fixtures (DOM, flush time) | 5,000-asset fixture from task 1.1; flush ≤ 16 ms unit test |
| Hover-play detail fetches trip rate limits | Dwell plus the low/high priority split; P0-8 permits |

---

## 4. Phase 2: MCP families, exports, org backup

### 4.1 Scope and ordered tasks

**Scope:**
- MCP client.
- Maps (list, `view_map` thumbnails, viewer, inspector).
- Creator Images, only if `VITE_IMAGES=true`; otherwise the gate card.
- Download worker (export module): N× PNG, sprite sheet + Aseprite JSON, GIF, all frames.
- Download dialog (single "Download options" and multi-asset presets).
- Multi-asset/bulk ZIP with streaming or parts.
- Org backup export/import.
- Copy-image hand-offs.

| # | Task | Depends | Lane | Size | Done when |
|---|---|---|---|---|---|
| 2.1 | `mcp.ts` (rpc, SSE, `tools/list` gate, allowlist, `checkArgs`, `get_image` regex) + `mcpText.ts` against P0-11 fixtures | Phase 1 | A | M | Unit tests: refused calls make zero fetches; every parser passes on fixtures and fails soft on garbage |
| 2.2 | Maps: `list_maps` in `sync.ts`; map thumbnails (300 ms visible dwell, render lane 1, cancel on unmount, or the name-only placeholder per P0-10); map viewer (viewport canvas, integer zoom, pan, Fit smooth); inspector 02 §5.8 (`get_map`, `list_map_objects` without ids); "Reload from PixelLab" | 2.1 | A | L | e2e: thumbnail request aborted on fast scroll; zoom stays integer; placements list shows no ids |
| 2.3 | Images (flagged): `list_images` sync; `get_image` `index:0` thumbnails; frame loading (inline, then `index`); multi-frame playback; inspector 02 §5.3; Reload; gate card when the flag is off | 2.1 | A | L | e2e with the flag on and off; no `list_images` call when off; `download_url` never read (recorder: no S3 host requests) |
| 2.4 | `export.worker.ts` + `formats.ts`: upscale, sheet layout, Aseprite JSON, GIF (exact palette, quantize fallback, cumulative delays, disposal 2, threshold/matte, trim), canvas and working-set caps; vendored gifenc | Phase 1 | B | L | Unit tests (05 §12.1 formats); worker chunk ≤ 10 KB gz |
| 2.5 | `DownloadDialog.svelte` (single, "Download options"): formats, scope (This animation / Everything), Advanced `<details>` (scale, GIF matte, file name), counts (file and size figures only from details and media already loaded; never fetched to estimate, B-6), remembered choices; the Download menu gains GIF, Sprite sheet (ZIP) and All frames (ZIP) (≤ 4 items) and the Info tiles (02 §7.1) | 2.4 | B | M | e2e J1 (GIF in 3 clicks desktop / 4 taps phone) and J2 (Sprite sheet ZIP in 3 clicks); GIF delays follow the current speed (13,12,… at 8 fps); every multi-file output is one ZIP |
| 2.6 | Multi-asset download: the same dialog with 3 presets (Sprite sheets · All frames · GIFs); `plan.ts` (02 §7.5 layout, `metadata.json`, `manifest.json`), `run.ts` (lookahead, worker, cancel), client-zip, picker streaming, Blob parts closed by a running byte count (B-6), progress chip S10, compact ready sheet S11, non-blocking failure toast → report S12 + Retry failed, `beforeunload`, one-at-a-time; entry points: selection Download, folder Download, "Download all {n}…" | 2.4, 2.5 | B | L | e2e: ZIP entries match the layout; manifest lists injected failures; no UUID/URL in written JSON; cancel saves nothing; part split at the cap (cap lowered in test) |
| 2.7 | Org backup export/import (S23): validation, merge by name, favorites union, alias rewrite, report | Phase 1 | C | M | Unit + e2e round trip; invalid file copy |
| 2.8 | Copy image + Creator/UI hand-offs (`ClipboardItem` with a Blob promise; failure toast with Download PNG) | 2.3 | C | S | e2e (Chromium clipboard permission) + manual Safari |
| 2.9 | Phase 2 verification: iOS part-by-part save and share sheet; Android Chrome streaming; GIFs open animated in Discord/Photos (manual); P0-14 re-check after a full sync incl. images and maps (balance unchanged). Builder-written checklist, owner-run (B-2) | all | — | M | Checklist signed by the owner |

**Parallelism:** lane A (2.1 → 2.2, 2.3), lane B (2.4 → 2.5 → 2.6) and lane C (2.7, then 2.8 after 2.3) run in parallel.

### 4.2 Acceptance criteria

1. Maps and (if flagged) Images sync, stream, search and sort with the REST families. Map thumbnails never exceed 1 in-flight `view_map` and cancel on scroll.
2. The recorder sees only allowlisted tools. `get_image` is called only with `gallery:` refs. No request goes to the S3 presigned host. `list_projects` and `get_map_object` are never called.
3. A changed MCP text format shows "{Family} couldn't be loaded" without breaking the other families (fixture-injected).
4. Downloads:
   - GIF total duration within 10 ms of the effective timing (the current playback speed).
   - Sheets match the 05 §8.3 layout, and the JSON shape passes.
   - N× is integer nearest-neighbour.
   - Caps disable oversized options with the 02 copy.
5. Bulk export of the whole fixture library:
   - Streams to disk on Chromium.
   - Splits into parts at the (test-lowered) cap elsewhere.
   - Partial failures land in `manifest.json` and S12.
   - Cancel leaves nothing saved.
6. Org backup round trip preserves folders and favorites. Importing twice creates no duplicate folders.
7. Budgets: export chunk ≤ 10 KB gz, worker ≤ 10 KB gz, initial JS still ≤ 60 KB gz.
8. Real-account full sync incl. maps/images leaves balance and generations unchanged (P0-14 rerun).

### 4.3 Demo script (≈ 8 min)

1. Maps chip → placeholders turn into renders while scrolling slowly. Fling: no request storm (Network panel). Open a map → Fit → zoom 2× → pan → inspector placements.
2. Images chip (flag on) → open a multi-frame image → it plays at 8 fps → Download → GIF → open the file.
3. Character → Download options… → Sprite sheet (ZIP), Everything, Advanced → Scale 2× → inspect the JSON.
4. Folder "Demo" → Download → GIFs preset → Download. On Chromium the picker streams; on iPhone, parts each get a Share or save… tap. One fixture failure appears as a toast → View report → Retry failed.
5. Settings → Download backup → Forget key with "Also delete my folders and favorites" → reconnect → Import backup → folders are back.

### 4.4 Risks (Phase 2)

| Risk | Mitigation |
|---|---|
| MCP text drift between Phase 0 and Phase 2 | Re-capture one page per tool at Phase 2 start (5 min, owner); parsers fail soft |
| iOS memory during Blob builds | Part cap 300 MB; GIF working-set cap; manual device test in 2.9 |
| gifenc edge cases (palette, transparency) | Exact-palette path tested; quantize fallback noted in the manifest; vendored source audited once |
| `get_image` latency makes Images thumbnails slow | 300 ms dwell, `index:0`, Remember-mode cache; P0-9 numbers set expectations |

---

## 5. Phase 3: Polish

### 5.1 Scope and ordered tasks

| # | Task | Depends | Lane | Size | Done when |
|---|---|---|---|---|---|
| 3.1 | Help overlay S17, generated from the 02 §9 tables (keys first on fine pointers, gestures first on coarse; struck-through keys when shortcuts are off) | Phase 2 | A | S | e2e opens with `?`, from ⋯ and from Settings |
| 3.2 | Settings completeness: storage usage (`navigator.storage.estimate`), persistence status + Protect (`persist()`), Clear saved images (Remember only), backup tip (02 §8 rules), "Nothing is saved…" session copy | Phase 2 | A | M | e2e for each state; the tip appears at most weekly |
| 3.3 | Performance pass (device traces owner-run from the builder's checklist, B-2): 5,000-asset fixture on a Pixel 6a-class device (60 fps fling, no task > 50 ms, ≤ 1,400 nodes); Remember-mode LCP ≤ 1.2 s (Lighthouse mobile); viewer first frame ≤ 200 ms cached / ≤ 1.5 s uncached on 4G; tune LRU caps from P0-7 | Phase 2 | B | M | Trace artifacts attached; brief §9 numbers met |
| 3.4 | Accessibility audit (screen-reader and device passes owner-run from the builder's checklist, B-2): Lighthouse Accessibility 100 on every screen; axe 0 serious/critical; manual NVDA+Firefox, VoiceOver macOS/iOS and TalkBack across the 6 key flows (connect, browse+search, viewer+playback, favorite+folder, selection+download, settings); forced colours (backdrop swatches visible); 200 % text (search reachable, Info labels stacked); 320 px reflow; safe areas on notched phones; 44 px touch targets | Phase 2 | C | L | Findings fixed or logged with an owner-approved exception |
| 3.5 | Device matrix sign-off (owner-run from the builder's checklist, B-2): iOS Safari (downloads, share, canvas caps, long-press), Android Chrome (DPR 2.625, streaming save), Firefox desktop, Safari macOS | 3.3 | B | M | Matrix table in the results doc |
| 3.6 | **PWA manifest (owner-gated, A4):** `manifest.webmanifest` + 192/512/maskable icons; `manifest-src 'self'` is already in the CSP; **no service worker**. Benefit: Safari gives home-screen apps their own 7-day eviction counter (research 07 Q4). R1 deferred it and the brief lists "installable PWA" as a v1 non-goal, so it ships only on the owner's yes | Owner A4 | A | S | Installable in Chrome; no SW registered; CSP unchanged |
| 3.7 | Release prep: About › licenses (Svelte, idb-keyval, client-zip, gifenc MIT; Lucide ISC), README disclaimer + privacy statement, canonical URL, deploy per 05 §13.3, production header smoke test | Owner decisions §8 | — | S | `curl -sI` shows every 05 §13.2 header; Connect renders; no CSP violations |

### 5.2 Acceptance criteria

1. Every brief §9 success criterion is met, or has an owner-approved exception.
2. Lighthouse Accessibility 100 on every screen. Manual screen-reader passes are complete.
3. The device matrix has no open P1 defects.
4. Production headers match 05 §13.2. A console check on the deployed URL shows zero CSP violations.

### 5.3 Demo script (≈ 5 min)

1. Press `?` → help. Turn shortcuts off → `?` no longer opens it; the ⋯ entry still does.
2. Settings → Storage → Protect → status changes. Clear saved images → reload shows placeholders, then art.
3. VoiceOver on iPhone: open a character from the grid, play/pause, change direction, favorite it, close it.
4. If A4 is approved: install from Chrome and reopen standalone.

---

## 6. Definition of done and quality gates

### 6.1 Definition of done (every task)

1. Code merged with tests: unit for pure logic, e2e for user-visible flows. CI green (05 §12.5).
2. No new svelte-check warnings. Budget and guard scripts pass.
3. The network recorder passes on all e2e: view-only, no token in URLs, no UUID in the hash, zero CSP violations.
4. Touched UI passes axe (0 serious/critical) and the keyboard path for that feature.
5. Behaviour matches 02. Any deviation is recorded in 02 or 05 in the same change, so the docs never lag the code.
6. No raw PixelLab id or media URL leaves the library store, detail cache, `media.ts` or `http.ts` (reviewer check).
7. `// ponytail:` comments mark deliberate simplifications, with their ceiling and upgrade path.

### 6.2 Phase exit gates

| Gate | Requires |
|---|---|
| Phase 0 → 1 | §2.4 outputs recorded; 05 updated; A1–A3 answered. Gates task 1.5 and its dependents; the Phase 0-independent tasks may run before it (§3.1, B-1) |
| Phase 1 → 2 | §3.2 all pass; §3.3 demo run with the owner; task 1.22 checklist signed |
| Phase 2 → 3 | §4.2 all pass; §4.3 demo run; task 2.9 checklist signed |
| Release (public) | §5.2 all pass; owner decisions §8 items 1–4 and 6 made; **PixelLab contacted and answered (D31)** |

### 6.3 Release gate checklist

- [ ] Final name and trademark/domain check done.
- [ ] Host chosen, canonical URL live, headers verified.
- [ ] PixelLab ToS §2.2 contact answered; CORS stability, scoped tokens and `Retry-After` asked in the same message (S16).
- [ ] Source licence chosen; repository public (recommended anti-phishing measure, S14), with `mockups/shared/assets/` (the owner's real PixelLab art) removed or replaced before the first public push (B-4).
- [ ] README states the unofficial status and links the canonical URL.

---

## 7. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Trigger / owner |
|---|---|---|---|---|---|
| K1 | PixelLab tightens CORS (stops reflecting origins) | Medium | Critical: app unusable | CORS-blocked state with honest copy (02 §8); D31 contact asks for confirmation; fallbacks (Tauri wrapper, user-owned proxy; research 02 §4) documented, not built | e2e can't detect it; users report it. Owner contacts PixelLab |
| K2 | ToS §2.2 "building your own service" objection | Low–Medium | High: no public launch | Contact before launch (D31); keep the build private or self-hosted until answered; view-only, BYO-token, no-backend design is the strongest case | Owner, before release |
| K3 | Unpublished read rate limits | Medium | Medium: slow sync, 429 storms | P0-8 sets permits; per-host semaphores; full-jitter backoff; lazy details; no prefetch; Play previews capped (≤ 8 players, 1 preview detail in flight) and switchable to default off; rate-limited copy | ≥ 2 consecutive 429s → status line; tune permits; flip `PREVIEWS_DEFAULT_ON` |
| K4 | MCP text format drift (LLM-oriented prose, no `outputSchema`) | Medium–High | Medium: maps/images stop loading | Isolated pure parsers; fixtures; fail-soft family error; REST families unaffected; `structuredContent` upgrade path | Sync popover "couldn't be read" count > 0 → re-capture fixtures |
| K5 | `get_image` turns out to write, or tools are re-annotated | Low | High: breaks the view-only promise | P0-9; `gallery:` regex; per-session annotation gate; build flag off by default if in doubt | Annotation change → feature auto-disables |
| K6 | Safari 7-day storage eviction | High for infrequent users | Medium: folders/favorites lost | Backup export/import; weekly backup tip; Protect (`persist()`); optional manifest (3.6) | Owner chooses on A4 |
| K7 | iOS memory and download limits | Medium | Medium: big exports fail or reload the tab | Part cap 300 MB; canvas cap 16.7 MP; GIF working-set cap; share sheet per part; device tests 2.9/3.5 | Tab reload during export → lower caps |
| K8 | Svelte 5 incompatible with strict CSP / Trusted Types | Low–Medium | Low–Medium | Task 1.2 first; classes or `style:` only; TT optional | 1.2 result |
| K9 | Visual option decided late | — | — | Resolved: the hybrid in design 07 (F-1) | — |
| K10 | Token leak via XSS or a dependency | Low | Critical: full account | Strict CSP; 4 runtime deps + vendored gifenc; guard greps; text-only rendering; no telemetry | Any dependency update → diff review |
| K11 | Very large libraries (5,000+ assets, four-figure maps) | Medium | Medium: perf, thumbnail cost | Windowing; lazy, cancellable thumbnails; render lane 1; P0-10 fallback to name-only map cards | 3.3 trace fails → tune |
| K12 | REST shape change (fields renamed or added) | Low–Medium | Medium | P0-4 fixtures; invalid rows dropped and counted, never crash; unknown fields ignored | Dropped-row count > 0 |
| K13 | Scope creep from mockup reviews | Medium | Medium | Brief §8 table is the contract; additions go to a deferred list with an owner decision | Owner |

---

## 8. Decisions reserved for the owner

Items 1–6 are carried from `01-product-brief.md` §11 (same numbers); item 8 is 01 §11 item 7 and item 10 is 01 §11 item 8. Item 7 is resolved. Item 9 is this plan's own. The list matches ruling F-16 plus B-2, B-4 and B-7.

| # | Decision | Needed by | Default if undecided |
|---|---|---|---|
| 1 | Final product name and trademark/domain check (research 08 advises against "PixelLab" as the leading word) | **Before the first build real users touch** (B-7): the name is one constant (`APP_ID`, `APP_NAME`), but a later rename breaks backup imports and signs out Remember-mode users. Trademark check by release | Keep "Vitrine" as the working name |
| 2 | Accent colour vs PixelLab's brand palette (G23) | Visual token freeze (before 1.10 styling is final) | The ice blue in design 07 §5 |
| 3 | Public hosting: launch publicly or not, which host (must send real CSP headers; GitHub Pages rejected), canonical URL | Release (3.7) | Cloudflare static assets, private URL |
| 4 | ToS contact with PixelLab before public launch: timing, and what to do with the answer (D31) | Release | No public launch until answered |
| 5 | Phase 0 approvals: A1 (`get_image` gray area), A2 (one export download), plus A3 (burst-test acknowledgment, new) | Before Phase 0 | A1 declined → Images gate card; A2 declined → 8 fps stands; A3 declined → API lane 2 |
| 6 | Source licence and repository visibility, public vs private (open source recommended against phishing). `mockups/shared/assets/` holds the owner's real PixelLab art and must be removed or replaced before any public push (B-4) | Before the first public push (release at the latest) | Private until decided |
| 7 | ~~Which visual option (A/B/C) after mockup review~~ **Resolved:** the "Quiet Studio, lifted" hybrid (design 07; F-1, F-3) | — | — |
| 8 | A4, ship the PWA manifest (no service worker) in Phase 3 | Task 3.6 | Not shipped (R1 defer; brief non-goal) |
| 9 | Automate deploys from CI (requires storing a host deploy token in CI) | After item 3 | Manual owner deploy (05 §13.3) |
| 10 | Owner-run checks: who runs the real-key and real-device checks (Phase 0, §3.2 items 1–2, the demos, tasks 1.22, 2.9, 3.3–3.5) | Before Phase 0 | The owner, from checklists the builder writes; agents never handle the key (B-2) |

**Orchestrator defaults the owner may override (F-16):** "Folders" as the destination name (F-7); Play previews on by default (F-9); Tilesets and Tiles as separate chips (F-8).
