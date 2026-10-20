# Phase 2 plan: Settings and the asset viewer

Status: 2026-10-20. Builds on the MVP on branch `mvp` ([MVP plan](mvp-plan.md), [build log](mvp-build-log.md)). Where this plan and older design docs disagree, **this plan wins for Phase 2**; the MVP plan's rulings and Global Constraints still bind.

## Goal

Make the app safe for someone other than the owner (Settings: Forget key, Keep me signed in, About) and let a user open one asset full screen: play characters and objects, see stills for the rest, and read everything the API says about it, without raising the API load beyond one detail request per character or object per device.

## Scope

1. **Settings** (dialog, opened from the dock "…" menu's new third item **Settings**):
   - **PixelLab connection:** "Connected · API key ending ••••a1b2"; **Keep me signed in** (opt-in, off by default; on moves the key from the tab to `localStorage`; off asks "Stop keeping you signed in?" first); **Forget key** (confirm; clears the key and the saved library on this device); the rotate-key link.
   - **About:** name and version, unofficial disclaimer, privacy line, the not-in-the-public-API note with its PixelLab links, licences.
2. **Viewer for one asset** at `#/c/<category>/a/<key>` (key = the card's opaque 12-hex key, never a PixelLab id), over its grid:
   - ✕ close (Esc and browser Back too); a capsule with ⓘ and "…" (♡ hidden).
   - Characters and objects: animation player (8 fps default, play/pause, frame step, speed stepper 1–30, loop), the "Walk · East ▾" chip with animation list, state switcher (characters) and direction rose, loading and error states.
   - Tilesets, sidescroller tilesets, Tiles Pro, isometric tiles and UI: a still view.
   - Info panel (side panel on wide landscape screens, bottom sheet otherwise) with every field the list row and the one detail answer give for the type (02 §5).
   - Integer pixel scaling with Fit and zoom steps; 5 backdrops; prev/next with ←/→ and swipe; the name shows on open, then fades.
   - Viewer "…": Playback, Speed, Loop, Zoom, Backdrop, then **Open in PixelLab ↗**.
3. **Character states grouped into one card** (cheap: the characters list already carries `group_id` and `state_name`). The viewer's chip switches states. Objects stay one card per state: the objects list has no `group_id` (live OpenAPI, 2026-10-20).

## Out of scope (hidden, not disabled)

Favorites (♡), folders, downloads (the Download button and its menu), Select, Search, Copy image, Fullscreen, the tileset Grid overlay, "More in PixelLab ▾" tool links, Play previews, the filmstrip, persisted fps overrides, a default backdrop setting, theme, keyboard-shortcut settings and Help, storage and backup sections, Test key and Plan/balance rows (each costs an API request), Images and Maps, full refresh. Search and Select stay visible-but-inert in the dock exactly as in the MVP.

## Rulings made while planning

| # | Ruling | Why | Cost if wrong |
|---|---|---|---|
| R1 | "Stop keeping you signed in?" copy drops "and its saved copy of your library": turning it off deletes only the saved key. New copy: "**Stop keeping you signed in?** {APP_SHORT} will delete your saved API key from this browser. You'll stay connected in this tab. [Cancel] [Stop]" | MVP decision 1 keeps the saved list in "this tab only" mode too, so deleting it would only cost requests | Copy change |
| R2 | Forget-key confirm drops the folders checkbox (no folders yet): "**Forget your API key?** {APP_SHORT} will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected. *Your browser may still keep some images in its own cache. Clear your browsing data to remove them.* [Cancel] [Forget key]" | Nothing else to delete | None |
| R3 | Settings is a native `<dialog>` with no `#/settings` route | Esc and Android Back already close a modal dialog; no deep link is needed | Add the route later |
| R4 | "Open in PixelLab ↗" uses the id route for Character `/create-character/{id}`, Object `/create-object/{id}`, Top-down tileset `/maps/tilesets/{id}` and Tiles Pro `/maps/tiles/{id}` (research 03 marks these four "verified" against the REST ids); every other type uses its library page (B-1): sidescroller and isometric `/maps?tab=tilesets` / `/maps?tab=tiles`, UI `/create-ui`. All on `https://www.pixellab.ai`, new tab, `rel="noopener noreferrer"`, accessible suffix "(opens PixelLab in a new tab)" | 02 §3.11; ids go only to the data owner (S12) | A wrong route lands on PixelLab's library page |
| R5 | Info fields that need a request beyond the one character/object detail are left out: tileset transition/tiles/style/generation (metadata helper), isometric and Tiles Pro seed (MCP), Tiles Pro kind and placement rules | API-load rule: at most one detail request per asset, characters and objects only | Fewer fields for those types |
| R6 | Tiles Pro's still view shows its first tile (the saved picture); the variation sheet waits | Its other tile links are not saved today, and fetching the detail again would be a second request | Weaker Tiles Pro view |
| R7 | A detail request starts only after the asset has been on screen in the viewer for 0.3 s (the costly-art dwell, `COSTLY_WAIT_MS`); flipping past assets with the arrow keys sends nothing for them | Prevents a burst of detail requests while flipping | 0.3 s later animations |
| R8 | Speed, backdrop and the Info panel's open state last for the session only | No persisted prefs store yet (YAGNI) | Re-set per session |
| R9 | Viewer keys: ←/→, Esc, Space only. `,` `.` `[` `]` `I` `Z` `F` wait for the Help overlay and its single-key switch (02 §9.6) | Single-key shortcuts need the off switch first | Fewer shortcuts |
| R10 | The saved copy's schema goes to version 2 (cards gain `meta`, character fingerprints gain `updated_at` and `animation_count`); a device with version 1 is wiped once and reloads (one first open: 11 + 7) | Mixed old and new cards would show empty Info panels for up to 7 days | One extra first open per device |
| R11 | Fresh list rows always replace saved card data; only a resolved picture link (`thumb`) is carried over when the fingerprint matches | Tags, prompt and other non-fingerprint fields stay current at no request cost | None |
| R12 | No "API key forgotten." toast: the key screen appearing is the confirmation | No toast component yet | Add with the first toast |
| R13 | The daily-cap counter (`<APP_ID>:api-count`, request times only) survives Forget key | It is a safety limit, not user data | None |

## API-call budget for Phase 2

"Calls + checks": a request carrying the key also triggers one browser preflight per new URL (MVP plan concern 2). Image-host pictures cost no API call and are not counted here, but each shows in Activity.

| Scenario | API calls + checks | Image host |
|---|---|---|
| Open Settings, toggle Keep me signed in, read About | 0 | 0 |
| Forget key | 0 | 0 |
| New tab with Keep me signed in on, within the hour | 0 (no key test needed) | browser cache |
| New tab with Keep me signed in on, after the hour | 7 + 7 (the normal open check) | as MVP |
| Open a character or object, first time on this device | **1 + 1** (`GET /v2/characters/{id}` or `/v2/objects/{id}`) | frames of the shown animation × direction only (or one rotation) |
| Open the same asset again (fingerprint unchanged, detail < 7 days old) | **0** | browser cache |
| Reload while the viewer is open, within the hour | 0 | browser cache |
| Switch direction or animation | 0 | that animation × direction's frames |
| Switch state (grouped character) | 1 + 1 the first time per state, then 0 | that state's frames |
| Prev/next to a character or object | 1 + 1 for the asset landed on (after 0.3 s), 0 for assets flipped past; never for neighbours | shown frames only |
| Next at the last loaded card while the family has more | 1 list page (same as scrolling) | — |
| Open a tileset, sidescroller, isometric, Tiles Pro or UI asset | 0 (the grid already resolved its picture); if not yet resolved, the one existing costly-art request, never a second | 1 picture |
| Character changed in PixelLab (new animation, edit) | its next open re-asks once (the fingerprint changed at a first-page check) | — |
| Object changed in PixelLab | re-asked once within 7 days (objects have no `updated_at`; the saved detail expires after 7 days, like deep rows) | — |

Paths and fields verified against `https://api.pixellab.ai/v2/openapi.json` (unauthenticated, 2026-10-20): `GET /v2/characters/{character_id}` → `CharacterDetail` (`rotation_urls` 4 required + 4 nullable keys, `animations[].{animation_type, display_name, directions[].{direction, frame_count, frames[]}}`, `style_settings`, `guidance`, `ai_freedom`, `skeletons`, all summary fields); `GET /v2/objects/{object_id}` → `ObjectDetail` (`rotation_urls` all nullable, all null for 1-direction objects so use `storage_urls.unknown`; `animations[].{display_name, description, frame_count, directions[].{direction, storage_urls.frames[]}}`, `style_settings`). `CharacterSummary` carries `group_id`, `state_name`, `updated_at`, `animation_count`; `ObjectSummary` carries `state_name` but **no** `group_id`.

## Global Constraints (binding on every task)

- **Only `src/lib/api/http.ts` calls `fetch`.** Every request, including detail and frames, goes through `apiGet`/`publicGet` with an Activity `label` ("Characters · details", "Characters · frame"…). The layering test stays green.
- **Only `http.ts` and `store.ts` touch device storage.** Screens never import from `lib/api`; they use `library.svelte.ts`.
- **GET only, view-only guard unchanged.** No new host. The key goes only in the `Authorization` header to `api.pixellab.ai`.
- **Key handling:** "this tab only" (`sessionStorage`) is the default; `localStorage` only while Keep me signed in is on, never both; never in IndexedDB, URLs, logs, Activity, the DOM (only "••••" + last 4), error messages or exports. Forget clears every copy.
- **No PixelLab ids or picture links in the address bar or the Activity panel.** The viewer route uses the card's opaque key. Hand-off links to `www.pixellab.ai` may carry ids (R4).
- **API load:** at most one detail request per character/object per device, only when the viewer shows it for 0.3 s, cached in the saved copy; no neighbour, dwell or background prefetch; frames load from the image host only for the shown animation × direction; the MVP safety net (2 at a time, 2/s, daily cap, retries, stop) is unchanged.
- **GlassKit vendored and unmodified**; app CSS goes in `app.css` or component styles. Copy word for word from [02 §12](../design/02-ux-spec.md#12-microcopy) with "Vitrine" read as `APP_NAME`/`APP_SHORT` from `lib/app.ts`, except rulings R1/R2.
- **Mockup fidelity** at desktop 1440×900 and phone 390×844: `g1-settings`, `g1-confirm-forget`, `g1-confirm-stop-signed-in`, `06-detail`, `07-detail-info`, `g3-*` (shots in `mockups/full/base/shots/`, frame code in `mockups/full/base/frames-base.js`, `frames-g1.js`, `frames-g3.js`), minus the hidden controls above. Backdrop swatch values: `frames-g3.js` `SW`.
- **KISS/YAGNI:** smallest complete change; deferred means hidden; every deliberate shortcut gets a `// ponytail:` comment naming its limit and upgrade path.
- **Accessibility basics:** 44 px targets, visible focus, Esc closes the topmost layer, focus returns to the opener, dialogs are labelled, the viewer is a labelled modal.
- **Tests:** unit with Vitest (Node environment, pure modules and mocked modules as in `tests/unit/library.test.ts`); e2e with Playwright and the mocked PixelLab in `tests/fixtures/pixellab-mock.ts` only. **Never a real key.** `npm run check`, `npm test` and `npm run e2e` pass after every task.
- No personal or machine-specific data in any committed file.

## Shared types (added by Task 1; other tasks code against these)

```ts
// src/lib/types.ts
export type Dir = 'south' | 'south-east' | 'east' | 'north-east' | 'north' | 'north-west' | 'west' | 'south-west' | 'unknown';

export interface Card {
  // ...existing key, id, name, done, thumb, fp
  /** Whitelisted list-row fields as PixelLab sent them (never `id` or picture links). */
  meta: Record<string, unknown>;
}

export interface Anim {
  name: string;                 // display_name ?? sentence-cased animation_type (characters) / description (objects)
  type: string | null;          // animation_type (characters); null for objects
  description: string | null;   // objects only
  frames: Partial<Record<Dir, string[]>>;  // image-host links in order
}

export interface Detail {
  rotations: Partial<Record<Dir, string>>;
  animations: Anim[];
  /** Detail-only facts: style_settings, guidance, ai_freedom, skeleton (boolean). */
  extra: Record<string, unknown>;
}

export interface SavedDetail { fp: string; at: number; detail: Detail }
```

## Tasks and parallel groups

| Group | Tasks (run in parallel inside a group) | Needs |
|---|---|---|
| A | Task 1, Task 2, Task 3 | MVP |
| B | Task 4, Task 5, Task 6 | 4 needs 1 + 2; 5 needs 3; 6 needs 1 |
| C | Task 7, Task 8 | 7 needs 4; 8 needs 3 + 5 + 1 |
| D | Task 9 | 4–8 |
| E | Task 10 | 9 |

### Task 1: Card metadata, character groups and the detail adapter

**Group A** (parallel with 2, 3).

**Files owned:** `src/lib/types.ts`, `src/lib/api/families.ts`, `src/lib/data/check.ts`, `src/lib/data/store.ts`, `tests/unit/families.test.ts`, `tests/unit/check.test.ts`, `tests/unit/store.test.ts`, `tests/fixtures/rest/character-detail.json`, `tests/fixtures/rest/object-detail.json`, `tests/fixtures/pixellab-mock.ts`.

**Interfaces.**
```ts
// families.ts
interface Family { /* existing */ detail?(card: Card, signal?: AbortSignal): Promise<Detail> }  // characters and objects only
export function groupStates(cards: Card[]): Card[]   // keeps the first card per meta.group_id; ungrouped cards pass through; order kept
// store.ts
export const SCHEMA = 2;
export function loadFamilies(ids: FamilyId[]): Promise<Partial<Record<FamilyId, FamilyState>>>  // getMany('family:<id>'); first wipes once if meta:schema !== SCHEMA
export const loadDetail: (key: string) => Promise<SavedDetail | undefined>   // 'detail:<key>'
export const saveDetail: (key: string, v: SavedDetail) => Promise<void>
```

**Behaviour.**
- Types per "Shared types" above.
- `toCard` fills `meta` from a per-family whitelist (absent fields skipped):
  - characters: `name, state_name, prompt, size, directions, view, template_id, tags, created_at, updated_at, animation_count, group_id, status`
  - objects: `name, state_name, prompt, size, directions, view, tags, created_at, status`
  - ui: `name, prompt, size, created_at`
  - tilesets: `name, lower_description, upper_description, tile_size, view, created_at`
  - tilesets-side: `name, lower_description, transition_description, tile_size, created_at`
  - isometric: `name, description, size, tile_shape, created_at`
  - tiles-pro: `name, description, tile_type, tile_size, n_tiles, tile_view, created_at`
- Character `fp` also includes `updated_at` and `animation_count`.
- `name` is cut to 60 code points, not UTF-16 units (B3 deferred minor). Drop the unused `CATEGORIES` re-export (B6 deferred minor); tests import from `categories.ts`.
- `detail()`:
  - Throws for a card that is not done.
  - Characters: `apiGet('/characters/' + encodeURIComponent(id), { user: true, signal, label: 'Characters · details' })`. Objects: `/objects/…` with label `Objects · details`.
  - Normalizes to `Detail`. String links only. Character animation `name` = `display_name ?? sentence-cased animation_type`. Object animation `name` = `display_name ?? description ?? 'Animation'`, and object frames come from `directions[].storage_urls.frames`.
  - 1-direction objects with all-null `rotation_urls` get `rotations.unknown` = `storage_urls.unknown` (else `card.thumb`).
  - `extra` = `{ style_settings, guidance, ai_freedom, skeleton: skeletons != null }` (nulls dropped).
- `applyCheck`/`joinNextPage` (R11): a fresh card replaces the saved one, but when key and fp match it keeps the saved `thumb` (`{ ...fresh, thumb: old.thumb }`).
- `store.ts`:
  - Details live under `detail:<key>`. `wipe()` still clears everything.
  - `loadFamilies` reads only the family keys, so saved details are never loaded with the list.
  - Fix the order-dependent `store.test.ts:255` (B4 deferred minor).
- Mock:
  - Answers `GET /v2/characters/{id}` with 8 directions for even rows and 4 for odd rows. Rows divisible by 3 get a 4-frame `walk` and a 4-frame `breathing-idle` animation; the others get none.
  - Answers `GET /v2/objects/{id}`: object row 0 is 1-direction with `storage_urls.unknown` and one 3-frame animation; the rest are 4-direction stills.
  - All frame and rotation links go to the image host. Unknown and unfinished ids answer 404.
  - Character rows 6 and 7 share a `group_id`, with `state_name` null and "Armored". Pick rows no existing test names.
  - `Hit` gains `detail: boolean`.

**Tests.**
- families: `meta` whitelist per family (no `id`, no links); character fp changes with `animation_count`; `detail()` normalization from both fixtures (8-dir character, 1-dir object); `detail()` rejects unfinished cards; `groupStates` keeps the first per group.
- check: R11 merge keeps the resolved thumb and takes fresh meta.
- store: schema mismatch wipes once; `loadFamilies` ignores `detail:` keys.
- Existing tests are updated for the new Card shape, and all pass.

**Done when:** every unit test passes, and the mock serves detail answers that `detail()` turns into the documented `Detail`.

### Task 2: Key modes in the network module

**Group A** (parallel with 1, 3).

**Files owned:** `src/lib/api/http.ts`, `tests/unit/http.test.ts`.

**Interfaces.**
```ts
export function keptSignedIn(): boolean            // true while the key lives in localStorage
export function setKeepSignedIn(on: boolean): void  // moves the held key between sessionStorage and localStorage (never both); no-op without a key
export function keyHint(): string | null           // last 4 characters of the key, or null
// setKey(k): writes to the store the current mode uses; setKey(null) clears both stores
```

**Behaviour.**
- `KEPT_NAME = '<APP_ID>:key-kept'` in `localStorage`. On load, the key comes from `localStorage` first, then `sessionStorage`.
- `setKey(null)` also rejects every queued job that carries the key with `HttpError('key-lost')` before it is sent. Today a queued job would go out as "Bearer null" after Forget or sign-out (root fix).
- Storage failures fall back to memory, as today.

**Tests.**
- Mode round trip (on → `localStorage` only; off → `sessionStorage` only); load prefers the kept key.
- `setKey(null)` clears both and sends no queued auth job.
- `keyHint` never returns more than 4 characters.
- Existing safety-net tests stay green.

**Done when:** the unit tests pass and no request carries a missing key after `setKey(null)`.

### Task 3: Viewer route, zoom math and player stepping

**Group A** (parallel with 1, 2).

**Files owned:** `src/lib/router.svelte.ts`, `src/lib/render/fit.ts`, `src/lib/render/player.ts` (new, pure), `tests/unit/router.test.ts`, `tests/unit/fit.test.ts`, `tests/unit/player.test.ts` (new).

**Interfaces.**
```ts
// router.svelte.ts
export type Route = { name: 'home' } | { name: 'category'; id: CategoryId; key?: string };
parseRoute('#/c/characters/a/0123456789ab')   // → { name: 'category', id: 'characters', key: '0123456789ab' }; key must match /^[0-9a-f]{12}$/, else no key
export const pathOf: (r: Route) => string      // '#/', '#/c/<id>', '#/c/<id>/a/<key>'
export function closeViewer(): void            // history.back() when this tab opened the viewer from its grid; else replaceState(pathOf(category)) + update router.route
export function replaceViewer(key: string): void  // prev/next: replaceState + router.route update, no new history entry
// fit.ts
export const ZOOM_STEPS = [1, 2, 3, 4, 6, 8, 12, 16] as const;
export function zoomScale(artW: number, artH: number, m: number, dpr: number): Fit    // k = max(1, round(m·dpr)); css = art·k/dpr; smooth false
export function zoomStep(zoom: number | null, fitM: number, dir: 1 | -1): number | null  // null = Fit; stepping at or below Fit returns null
export function zoomLabel(zoom: number | null, fitK: number, smooth: boolean, dpr: number): string  // "Fit · 3×", "Fit" (smooth), "4×"
// player.ts
export const DEFAULT_FPS = 8, MIN_FPS = 1, MAX_FPS = 30;
export const clampFps: (f: number) => number;
export function advance(i: number, n: number, loop: boolean): { i: number; ended: boolean }
export function step(i: number, n: number, d: 1 | -1): number   // wraps
```

**Behaviour.**
- The router keeps a `pushed` flag, set when a hashchange moves from `#/c/<id>` to `#/c/<id>/a/<key>` in this tab. It drives `closeViewer`.
- `closeActivity` uses `pathOf` so an Activity panel over the viewer returns to the viewer route.

**Tests.**
- Router: viewer route round trips; invalid keys (`toString`, 11 or 13 chars, uppercase, an id-like UUID) give the category without a key; existing cases still pass.
- fit: `zoomScale` at dpr 1, 1.5, 2.625; `zoomStep` at both ends and around Fit; `zoomLabel` cases.
- player: `advance` loop vs once; `step` wraps both ways; `clampFps` bounds.

**Done when:** unit tests pass and `npm run check` is clean.

### Task 4: Library service: details, pictures, states, Forget and Keep me signed in

**Group B** (after 1 and 2; parallel with 5, 6).

**Files owned:** `src/lib/data/library.svelte.ts`, `tests/unit/library.test.ts`.

**Interfaces.**
```ts
library.shown(id)                  // characters: groupStates(done cards); others unchanged
library.states(card, familyId): Card[]          // done cards sharing card.meta.group_id, list order; [card] if ungrouped
library.items(categoryId): { card: Card; familyId: FamilyId }[]   // the flat list the grid shows, in grid order
library.find(categoryId, key): { card: Card; familyId: FamilyId } | null  // any done card of the category, states included
library.detail(card, familyId, signal?): Promise<Detail | null>
  // null for families without detail(); saved copy first (valid while saved.fp === card.fp and age < DEEP_TTL_MS);
  // else one family.detail() request, saved; one in-flight request per key; a failure is not cached and rejects with the HttpError
library.picture(url, familyId, signal?): Promise<Blob | null>   // image-host frame or rotation via publicGet, label '<family label> · frame'; memory cache by URL for the session
library.keepSignedIn: boolean       // reactive, from http.keptSignedIn()
library.setKeepSignedIn(on: boolean): void
library.keyHint(): string | null
library.forget(): Promise<void>     // setKey(null), wipe(), clear families/errors/loading/avoided, picture/art/detail memory caches, ran=false, hasKey=false
```

**Behaviour.**
- Pass the family ids to `loadFamilies`.
- `forget()` sends no request.
- `library.status` is unchanged.

**Tests** (mocked http and store, as the existing file does):
- First `detail()` calls `apiGet` once and saves; a second call (and a new "tab" via `vi.resetModules`) sends 0; a changed `fp` or an age over 7 days re-asks once.
- A failed detail is retried on the next call.
- `detail()` for a tileset returns null with no request.
- `items()` shows a grouped character once; `states()` returns both states.
- `forget()` empties the store and memory and sets `hasKey` false with 0 requests.
- `setKeepSignedIn` forwards to http.

**Done when:** unit tests pass and the layering test is green.

### Task 5: Pixel stage and player

**Group B** (after 3; parallel with 4, 6).

**Files owned:** `src/lib/render/PixelArt.svelte`, `src/lib/render/player.svelte.ts` (new).

**Interfaces.**
```ts
// PixelArt.svelte props (existing ones unchanged; existing callers need no edits)
{ blob?: Blob | null; frames?: Blob[]; frame?: number; zoom?: number | null; onmeasure?: (m: { k: number; smooth: boolean; artW: number; artH: number }) => void }
// player.svelte.ts
export function createPlayer(): {
  readonly index: number; readonly playing: boolean; readonly ended: boolean; readonly n: number;
  fps: number; loop: boolean;
  load(n: number, keepIndex?: boolean): void;
  play(): void; pause(): void; toggle(): void; step(d: 1 | -1): void; resetFps(): void; destroy(): void;
}
```

**Behaviour.**
- `frames`: decoded once to ImageBitmaps (`colorSpaceConversion: 'none'`). Frame `frame` is drawn on change without re-decoding; the canvas is sized to the first frame (`// ponytail:` mixed frame sizes). Bitmaps are closed on change and destroy.
- `zoom` set: CSS multiple via `zoomScale`. When the art is larger than the box, the container grows to the canvas size so a scrolling parent pans natively; without `zoom`, Fit as today.
- `onmeasure` reports the Fit `k` for the zoom readout.
- On destroy: `canvas.width = canvas.height = 0`.
- Fold B5's deferred minors: a draw error closes the bitmap, and `colorSpaceConversion: 'none'` is set on every decode.
- Player:
  - A requestAnimationFrame loop accumulates `dt = min(now − last, 250)` against `1000 / fps` and uses `advance`/`step` from `player.ts`.
  - It pauses while the tab is hidden, resumes its prior state, and opens paused under `prefers-reduced-motion`.
  - `step` pauses; `play` after `ended` restarts from 0.

**Tests:** behaviour is covered by Task 9's e2e (frame index advances at about 8 fps, step, loop off stops on the last frame). Visual crispness is covered by the existing `visual.spec.ts` check, which Task 9 extends to the viewer.

**Done when:** existing grids and tiles render unchanged (`visual.spec.ts` green), and `npm run check` is clean.

### Task 6: Info panel

**Group B** (after 1; parallel with 4, 5).

**Files owned:** `src/lib/info.ts` (new, pure), `src/lib/ui/InfoPanel.svelte` (new), `tests/unit/info.test.ts` (new).

**Interfaces.**
```ts
// info.ts
export interface InfoRow { label: string; value: string; mono?: boolean }
export function infoRows(familyId: FamilyId, card: Card, detail: Detail | null, timeZone?: string): InfoRow[]
export function textBlock(familyId: FamilyId, card: Card): { label: 'Prompt' | 'Description' | 'Terrains' | 'Terrain'; text: string } | null
export function kicker(familyId: FamilyId, card: Card): string        // "Character · Base", "Object · open", "Top-down tileset"
export function pixellabLink(familyId: FamilyId, card: Card): string  // R4
export const maskId: (id: string) => string                           // "3f2a…9c1e"
// InfoPanel.svelte props
{ card: Card; familyId: FamilyId; detail: Detail | null; detailState: 'none' | 'loading' | 'ok' | 'error' | 'offline'; checkedAt: number | null; onClose: () => void }
```

**Behaviour.**
- Fields per 02 §5 restricted to list `meta` and `Detail` (R5):
  - **Character:** State ("Base" when null), Canvas "64 × 64 px", Directions "8 · S, SE, E, NE, N, NW, W, SW" (names from detail rotations; count from meta until then), View, Animations (count from meta; after detail one row per animation "Walk · 8 frames · 4 directions", "8–9 frames" when they differ), Style rows from `style_settings`, Guidance, AI freedom, Template, Tags (plain chips), Created, Updated (hidden when equal to Created), Playback "8 fps (default)" + the timing note.
  - **Object:** State (hidden if null), Canvas, Directions ("1 (single view)"), View, Animations with description, Style, Tags, Created, Playback.
  - **Top-down tileset:** Terrains "Dirt → Grass", Tile size, View, Created.
  - **Sidescroller:** Terrain, Top edge, Tile size, View "Side (platformer)", Created.
  - **Isometric:** Description, Size "32 px", Shape, Created.
  - **Tiles Pro:** Description, Tile type, Tile size, Variations, View, Created.
  - **UI:** Prompt, Size, Created, and the note "PixelLab doesn't share the individual UI pieces."
- Formatting per 02 §5: dates "Feb 3, 2026, 09:20" (local time; `timeZone` only for tests), sentence-cased enums, grouped numbers, mono technical values, null or empty fields hidden.
- Layout: a side panel when the window is landscape and ≥ 840 px wide, otherwise a bottom sheet with a grip (58% height, scrolls; mockup `07-detail-info`).
  - Header: title, then `kicker`.
  - Facts group.
  - Text block with **Copy** (clipboard `writeText`; the icon becomes a check for 2 s and "Copied" is announced).
  - Technical details `<details>`: masked id + **Copy asset ID** with the 02 §12.4 warning; Status; "Last checked" from `checkedAt`; "Skeleton keypoints: included" when `extra.skeleton`.
  - Footer: **Open in PixelLab ↗** link (R4). The tier hint "Opening in PixelLab may need a paid plan." shows for tileset types and Tiles Pro.
- While `detailState` is 'loading', the Animations row reads "Loading animations…".
- No raw id anywhere except the masked id.

**Tests** (unit):
- `infoRows` per family on fixture-shaped cards: hidden nulls, date and size formats, Updated hidden when equal to Created, "Base" state, Directions with and without detail.
- `pixellabLink` for all 7 families (ids only on the 4 verified routes, always `https://www.pixellab.ai`).
- `maskId`.

**Done when:** unit tests pass and the panel matches `07-detail-info` desktop and phone (screenshots in Task 9).

### Task 7: Settings dialog

**Group C** (after 4; parallel with 8).

**Files owned:** `src/lib/ui/Settings.svelte` (new), `src/lib/ui/MoreMenu.svelte`, `src/lib/ui/Dock.svelte`, `src/App.svelte` (settings wiring only), `package.json` (`"version": "0.2.0"`), `vite.config.ts` (`define: { __APP_VERSION__ }` from `package.json`), `src/env.d.ts` (new, `declare const __APP_VERSION__: string`), `public/licenses.txt` (new: GlassKit MIT notice from `src/vendor/glasskit/LICENSE` + idb-keyval Apache-2.0 text from its package), `tests/e2e/t7-settings.spec.ts` (new).

**Interfaces.**
```ts
// Settings.svelte
{ open: boolean; onClose: () => void }
// MoreMenu.svelte gains onSettings: () => void and a third item "Settings" (subtitle "Key, privacy and about")
```

**Behaviour.** Native `<dialog>` with `showModal()` (R3), labelled "Settings", ✕ "Close settings"; it is a bottom sheet on phone (mockup `g1-settings`). Only two sections:
- **PixelLab connection:**
  - "Connected" + "API key ending ••••{keyHint}".
  - **Keep me signed in** switch with the 02 §12.1 helper texts for off and on. Turning it on applies at once. Turning it off opens the R1 confirm; Cancel leaves it on.
  - **Forget key** (danger row) opens the R2 confirm; **Forget key** calls `library.forget()`, closes everything and shows the key screen (R12).
  - Footer link "Need to revoke this key? Generate a new API key in your PixelLab account ↗" → `https://www.pixellab.ai/account`.
- **About:**
  - "{APP_NAME}" with "Version {__APP_VERSION__}".
  - The 02 §12.4 About disclaimer and About privacy lines with `APP_NAME`.
  - The not-in-the-public-API note with links, all library pages per R4: Fonts → `/create`, Effects → `/create-vfx`, Portraits and Talking animations → `/create-character`.
  - **Licences ↗** → `/licenses.txt`.
  - No Source-code row until a public repo exists (`// ponytail:`).
- Confirms are GlassKit alert modals (mockups `g1-confirm-forget`, `g1-confirm-stop-signed-in`).
- Focus returns to the "…" button.
- Hidden: Test, Plan, Library, Appearance, Keyboard, Folders & favorites, Storage.
- Dock: fix the Select button's accessible name, now "Select Select, coming soon" (B6 deferred minor). Search and Select stay inert.

**Tests** (e2e, mocked):
- The menu has three items; Settings opens and Esc closes, with focus back on "…".
- The key hint shows exactly the last 4 characters and never the key.
- Keep me signed in: on, then a new tab within the hour shows the library with **0** API requests and the key is in `localStorage` only; off with Cancel keeps it; off with Stop removes it from `localStorage`, the tab stays connected, and the saved library stays.
- Forget key: Cancel does nothing. Confirm shows the key screen without "Welcome back"; `deviceStorage()` holds no `family:`/`detail:` entries and no key; 0 requests are sent.
- About shows the version and the four links with `rel="noopener noreferrer"`.
- Desktop and phone, no sideways scroll, keyboard reaches every control.

**Done when:** `t7-settings.spec.ts` passes on both projects and the dialog matches the `g1-settings` / confirm mockups minus the hidden rows.

### Task 8: Animation chip and viewer menu

**Group C** (after 1, 3, 5; parallel with 7).

**Files owned:** `src/lib/viewer.ts` (new, pure), `src/lib/ui/AnimPicker.svelte` (new), `src/lib/ui/ViewerMenu.svelte` (new), `tests/unit/viewer.test.ts` (new).

**Interfaces.**
```ts
// viewer.ts
export const COMPASS: (Dir | null)[]   // 3×3, null centre: NW N NE / W · E / SW S SE
export function dirsFor(detail: Detail, anim: number): Dir[]           // anim -1 = Rotations
export function defaultAnim(anims: Anim[], prevType?: string | null): number  // prev type → /idle|breath/ → 0 → -1
export function pickDir(avail: Dir[], want?: Dir): Dir                // want → south → first available
export function chipLabel(detail: Detail, anim: number, dir: Dir, stateLabel: string | null, states: number): string
  // "Walk · East", "Rotations · South", "Detailed robe · South" (Rotations with > 1 state), "Snap shut" (1-direction)
export function chipVisible(detail: Detail | null, states: number): boolean   // > 1 animation option, direction or state
// AnimPicker.svelte
{ label: string; loading: boolean; anims: Anim[]; anim: number; dirs: Dir[]; allDirs: Dir[]; dir: Dir;
  states: { key: string; label: string }[]; stateKey: string;
  onAnim: (i: number) => void; onDir: (d: Dir) => void; onState: (key: string) => void }
// ViewerMenu.svelte
{ open: boolean; onClose: () => void; player: ReturnType<typeof createPlayer> | null;  // null hides Playback, Speed, Loop
  zoomLabel: string; onZoom: (d: 1 | -1) => void; onZoomToggle: () => void;
  backdrop: number; onBackdrop: (i: number) => void; link: string }
export const BACKDROPS: { name: string; css: string }[]   // Theme, Checker, Light gray, Mid gray, Black (frames-g3.js SW)
```

**Behaviour.**
- **Chip:** "{label} ▾" in the bottom dock opens one popover (desktop) or bottom sheet (phone), mockups `g3-picker` and `g3-states`. Sections:
  - **Animation:** Rotations first, subtitle "Still pose for each direction"; then "Walk · 8f".
  - **State:** a segmented control, only with > 1 state.
  - **Direction:** a 3×3 rose, centre names the direction, missing directions disabled; hidden for 1-direction assets.
  - It closes on Esc or outside click, and focus returns to the chip.
  - While loading, the chip reads "Loading animations…" and is disabled.
- **Menu** (mockup `g3-viewer-more`, minus Add to folder, Copy image, Fullscreen):
  - **Playback:** step back, play/pause, step forward, plus a screen-reader status "Frame i of n".
  - **Speed:** Reset (only when ≠ 8), −, "N fps", +, range 1–30.
  - **Loop:** switch.
  - **Zoom:** −, readout (toggles Fit ↔ 1:1), +.
  - **Backdrop:** a radiogroup of 5 swatches.
  - Divider, then **Open in PixelLab ↗**.
  - A popover under the capsule on desktop, a bottom sheet on phone. Esc closes it and focus returns to "…".

**Tests** (unit):
- `defaultAnim` (prev type carried, idle preferred, Rotations fallback).
- `pickDir` fallbacks; `dirsFor` for an 8-dir character, a 4-dir one and a 1-dir object.
- `chipLabel` for the four forms; `chipVisible`.

Rendering is covered by Task 9's e2e.

**Done when:** unit tests pass and `npm run check` is clean.

### Task 9: Viewer screen and wiring

**Group D** (after 4–8).

**Files owned:** `src/lib/ui/Viewer.svelte` (new), `src/lib/ui/AssetCell.svelte`, `src/lib/ui/CategoryGrid.svelte`, `src/App.svelte` (viewer overlay), `src/app.css` (viewer layout additions only), `tests/e2e/t8-viewer.spec.ts` (new), `tests/e2e/visual.spec.ts`.

**Interfaces.**
```ts
// Viewer.svelte
{ categoryId: CategoryId; assetKey: string }
// CategoryGrid.svelte gains: reveal: string | null   — scrolls that card's row into view and focuses its link
// AssetCell.svelte becomes <a class="cell" href={pathOf(viewer route)} title={card.name}> (keeps the measuring and art rules)
```

**Behaviour.**
- **Mounting:** App shows `Viewer` over `CategoryGrid` when `router.route.key` is set. The grid stays mounted, so its scroll is kept. While the viewer is open, the dock and notices under it are inert. The viewer is a full-window modal, labelled with the asset name, and focus moves to its title.
- **Resolving the key:** `library.find`. If the key is unknown while the open check runs, show a quiet loading state. If it is still unknown afterwards, `closeViewer()`.
- **Stage:** the backdrop, then the card's saved picture at once via `library.art`. Then:
  - Characters and objects, after 0.3 s on screen (R7): `library.detail` (aborted when the viewer moves on or closes).
  - Then `defaultAnim`/`pickDir`, then `library.picture` for exactly the shown animation × direction's frames (or the one rotation). The player loads them and autoplays at 8 fps.
  - The HUD shows "Loading frames i/n" until all are in.
  - Detail failure: "Couldn't load this asset's animations. [Try again]", static picture kept. Offline without a saved detail: "This animation isn't saved on this device. Connect to the internet to see it." (02 §6.4).
  - Clicking the art or Space toggles play.
- **Stills:** tilesets, sidescroller, isometric, Tiles Pro (first tile, R6) and UI show the saved picture with no chip and no Playback rows.
- **Chrome:**
  - ✕ top left.
  - Capsule top right: ⓘ (pressed state while Info is open) and "…".
  - Name and `kicker` top centre for about 2 s, then fading; shown again on prev/next; not animated under reduced motion.
  - Bottom dock holds only the chip (when `chipVisible`).
  - Phone layout per `06-detail-mobile` and `07-detail-info-mobile`: with Info open the art moves up and the dock hides.
- **Zoom:** `null` (Fit) by default. With zoom set the stage scrolls natively (`overflow: auto`) to pan.
- **Navigation:**
  - ←/→ and a horizontal swipe at Fit (> 50 px, mostly horizontal) go to prev/next in `library.items` order with `replaceViewer`. At the ends nothing happens, except that next at the last loaded card while the family has more calls `library.loadMore` and then moves.
  - Animation type and direction carry over when the next asset has them (F-14).
  - A grouped character's state switch: `replaceViewer(stateKey)`; prev/next steps over groups.
- **Closing:** ✕, Esc (when no menu or picker is open) or browser Back call `closeViewer()`. After closing, the grid gets `reveal` = the key last shown, so focus returns to that cell.
- **Not shown:** ♡, Download, Fullscreen, Copy image.

**Tests** (e2e, mocked, desktop and phone):
- Tapping a character cell opens `#/c/characters/a/<12 hex>`; the URL never contains an id.
- The player advances frames; Space pauses; step moves one frame; loop off stops on the last frame; speed + shows "9 fps" and Reset returns to 8.
- The chip lists Rotations + animations, and a direction change shows that direction.
- The grouped character shows one cell, and its chip switches to "Armored".
- A 1-direction object plays its animation with no direction rose.
- A tileset, Tiles Pro, isometric and UI asset each show a still with no chip.
- Info opens as a side panel (desktop) or sheet (phone) with the documented rows, Copy prompt works, and only a masked id appears.
- Detail 404 shows the error and Try again.
- ←/→ and swipe change the asset; Esc and browser Back close it with one Back step; focus returns to the cell; the grid scroll is kept.
- A deep link reload opens the viewer.
- `visual.spec.ts` adds viewer screenshots (character, Info open, "…" open, tileset) and passes the crispness check in the viewer at dpr 1, 1.5 and 2.625.

**Done when:** `t8-viewer.spec.ts` and the extended `visual.spec.ts` pass on both projects and the screenshots match `06-detail`, `07-detail-info` and `g3-*` minus hidden controls.

### Task 10: Request counter for the viewer and plan close-out

**Group E** (last).

**Files owned:** `tests/e2e/t6-request-counter.spec.ts`, `docs/plan/phase2-plan.md` (tick tasks, log rulings made during the build).

**Tests** (extend T6; the counts are exact):
- Opening a character the first time sends exactly **1** API request, `GET /v2/characters/<id>` (`Hit.detail`). Image-host requests are only the shown animation × direction's frames; no list request.
- Close and reopen the same character: **0** API requests.
- Reload on the viewer route within the hour: **0** API requests.
- ← / → to the next character sends 1 detail request for it after 0.3 s, and **none** for its neighbours. Three arrow presses within 0.3 s send a detail request only for the asset landed on.
- A direction change sends 0 API requests, and only that direction's frames.
- A grouped character's state switch sends 1 detail request the first time and 0 when switching back.
- Opening a tileset, Tiles Pro, isometric and UI asset after their grid was shown: 0 API requests.
- Every viewer request is a GET; no URL carries the key; the address bar never holds an id or a picture link.
- Activity lists each detail as "Characters · details" (or "Objects · details") with no id or link, and the entry count equals the sent requests.
- A detail request for an unfinished row never happens.

**Done when:** T6 passes x3 on both projects, every Phase 2 test is green, and this plan's tasks are ticked.
