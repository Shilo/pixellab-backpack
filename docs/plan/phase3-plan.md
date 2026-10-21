# Phase 3 plan: Search and All assets

Status: **Done** 2026-10-20 (Tasks 1–7 built; [build log](phase3-build-log.md)). Builds on Phase 2 on branch `main` ([Phase 2 plan](phase2-plan.md), [build log](phase2-build-log.md)). Where this plan and older design docs disagree, **this plan wins for Phase 3**; the MVP and Phase 2 rulings and Global Constraints still bind.

## Goal

Let a user find an asset by name and see everything in one grid, using only what is already saved on the device: **zero new kinds of API request**. Fix the Phase 2 leftovers that make the shipped screens look wrong next to the mockups.

## Scope

1. **Search** (the dock's Search control becomes real; mockups `02-search-focused`, `g2-search-results`, `g2-search-no-results`):
   - The dock turns into a search bar: leading button (Library icon on home and All assets, back chevron in a category), the field with ✕ clear and an `esc` hint (desktop), a visible **Cancel** (phone).
   - Panel above the dock over a dimmed screen:
     - **Empty field:** Recent (chips + Clear), Go to (category rows with counts), Recently added (6, phone 3), "Show all N assets".
     - **Typed:** Go to rows whose label matches, then "N results" as a grid with the matched text in bold.
     - **No results:** idle sprite, "No matches for…", Clear search / Search all types, the not-in-the-API hint.
   - `/` opens and focuses it (desktop); Esc, Cancel, the leading button, the dim or browser Back closes it.
   - Opening a result opens the existing viewer. Closing the viewer returns to the search with its query.
2. **All assets** at `#/all` (mockup `g2-all-assets`): dock "‹ Library · All assets N · Search · Select (inert) · …". It is the existing virtual grid over every category, with lazy pages as you scroll, and at the very end "That's everything" plus the "Other PixelLab content isn't in the public API yet" card with its links.
3. **Phase 2 gaps** (R11 lists what is skipped):
   - Info's Copy, Copy asset ID and Open in PixelLab buttons become the mockup's dark outline style (`glass-btn--tertiary`, not `--secondary`).
   - The animation picker shows "Walk", not "Walk · 0f", for a set with no frames.
   - A grid cell shows a state name ("Hooded Orb Mage · detailed robe") only when the character has sibling states on this device (R6).

## Out of scope (hidden or inert exactly as now)

Favorites, folders (no "Hero party" or "Favorites" Go to rows), Select (stays inert), Sort, Grid size, Play previews, downloads, full refresh, backup, Images and Maps, the hover heart, tag search (`#tag`) and tag chips that search, searching prompts, tags or descriptions, persisted recent searches, a results page, and mixing categories by date in any grid.

## Rulings made while planning

| # | Ruling | Why | Cost if wrong |
|---|---|---|---|
| R1 | **Counts.** The All assets crumb, Go to rows and "Show all N assets" use PixelLab's totals, the same numbers as the home tiles. The All assets end line reads "That's everything", with **no number**, and appears only once every family is fully saved. Search looks only at cards saved on the device. When every family in the scope has a saved first page but some are not fully saved, the panel ends with: "Only assets saved on this device are searched. Scroll through {All assets \| category label} to load the rest." When a family has no saved data (failed or still loading), the note is left out and the existing notice speaks | Totals count unfinished, failed, duplicate and grouped rows, so a cell count beside them would disagree on the same screen. The note gives only advice that can come true | A small departure from the mockup's "That's everything · 75 assets" |
| R2 | **Recent searches** are kept in memory for this tab only: never in device storage, at most 3, newest first, case-insensitive duplicates merged, queries under 2 characters ignored. A query is remembered on Enter or when a result is opened. Recent searches are cleared on reload, sign-out and Forget key | The mockup panel shows them. Memory only keeps typed words off the device | Lost after reload; move to `store.ts` (which `wipe()` already clears) if people ask |
| R3 | **Routes and Back.** All assets is `#/all`. The viewer nests under the screen it was opened from: `#/a/<key>` (over home), `#/c/<id>/a/<key>` or `#/all/a/<key>`, where the key is the card's opaque 12-hex key. Search text is never in the address bar (02 §1 rule 3). Opening the search adds a history entry with the **same URL** (`history.pushState({ search: <entry id> }, '', location.hash)`, the id this search keeps so Back closes only its own entry). Back from it closes the search. Esc, Cancel, the leading button and the dim call `history.back()` when this tab added that entry. Opening a result pushes `<screen>/a/<key>` on top, so the viewer's ✕, Esc or Back lands on the search entry with the query kept and focus on the result. The viewer finds its key in **every family**, so a result from another category opens over any screen (and survives a reload) | Phone Back dismisses overlays; same-URL entries fire no `hashchange`, so Phase 2's `pushed` rule is untouched | After Go to or Show all, the leftover search entry is one extra Back step (`// ponytail:`) |
| R4 | **Order.** All assets and results follow the home category order (Characters, Objects, Tilesets & tiles, UI). Inside each category the families stay family after family, each in PixelLab's list order: exactly the category grids' order, so next pages still load per family as you scroll. No mixing by date: deep pages would reshuffle the grid as they load, and date mixing is not needed: a live read-only check confirmed every list is newest first. **Recently added** (6 items) sorts saved cards by `meta.created_at`, newest first. It relies on the same newest-first lists the open check already assumes (MVP concern 2) | Smallest correct order with today's lazy loading | None found: live lists are newest first |
| R5 | **Matching:** case- and accent-insensitive substring; words separated by spaces must all match; only on the name and, per R6, the state name. Category labels match for Go to. No debounce. Prompts, tags and descriptions wait | The emphasized name line always shows why a card matched. One pure function to widen later | Fewer hits for prompt words |
| R6 | **Character groups:** one result per group. It matches when any of its states' name or state name matches. The cell shows, and opens, the group's shown card if that card matches, else the first matching state (so "armored" opens the Armored state). A state name is shown ("Name · state_name", in every grid) and matched only when the card has sibling states on this device: a character whose group has 2 or more saved cards. Objects never show or match one (their list has no group). | Live data: a read-only check of a real account found 94% of characters carry state_name "Idle" with a unique group, and objects carry "base" or auto names, so showing every state name would label nearly every cell. One rule in `search.ts` (`stateName`) drives the name line, the highlight and the match | An object's state name is not visible or searchable |
| R7 | **Scope.** From home or All assets the search covers everything. From a category grid it covers only that category ("No matches for "slime" in Characters."). **Search all types** widens it to everything. Go to rows, Recently added and "Show all" appear only when the search covers everything ("Show all" is also hidden on All assets itself). With everything in scope, the no-results text is "No matches for "{q}"." / "Try fewer words." with Clear search only. The hint "Looking for fonts or effects? They aren't in PixelLab's public API yet." always shows, as in the mockup | 02 §11.2 scope rule; the 02 copy assumes a type | Copy only |
| R8 | **At most 100 results** show in the panel, then the line "Showing the first 100. Type more words to narrow it down." A viewer opened from the search steps ←/→ through exactly the shown results, stops at the ends and never loads a list page. Opened from a screen, or after a reload (the search is gone), it follows that screen's order as in Phase 2. When the open card is not in the list (a state switched inside the viewer, a deep link), ←/→ do nothing | What you see is what you step through; the cap keeps a one-letter query from mounting thousands of cells | Add a results page if people need more |
| R9 | **Copy.** The focused field's placeholder is "Search assets and types" (there are no folders, and no number, see R1). The resting home pill keeps "Search your library" and gains the `/` hint on desktop. Leading button names: "Library" (home), "Back to {label}" (category), "Back to All assets". While the first check runs with nothing saved for the scope, the panel shows "Checking for new assets…" (02 §12.3 status line) instead of no results | The mockup's "…and folders" would be false; "No matches" would be false before anything has loaded | Copy only |
| R10 | The All assets note reuses the About copy and links. Settings' link list moves to `info.ts` as one constant | One copy of the rule (Phase 2 R4 routes) | None |
| R11 | **Phase 2 deferred items skipped:** the Rotations entry in the picker (unreachable: objects fill `rotations.unknown` from the thumb, and characters always send `rotation_urls`); second-tab copy after Forget (already fixed by challenge fix C1); zoom + above 16× (fixed by C4); rose arrow keys, menu focus trap and `aria-modal`, the shared Esc/focus code, the ViewerMenu opener (keyboard polish, not visible; one later accessibility batch); Info text minors (untrimmed tags, "Terrain"/"Included" casing, the stacking breakpoint, the loading-row index); network and test-timing minors (not on screen) | Only items that make the shipped UI wrong next to the mockups, or confusing, are in scope | Each stays on the build log's list |
| R12 | **Phone targets are at least 44 px** even where the mockup draws smaller ones: Recent chips (40 px), the field's ✕ (32 px), and every `glass-btn--sm` in the panel (Clear, Clear search, Search all types) and in the All assets note | Phase 2 accessibility rule | None |

## API-call budget for Phase 3

"Calls + checks" as in Phase 2. Phase 3 adds **no new request path**: no new `apiGet`/`publicGet` call and no new `loadMore` caller beyond the grid's lazy pages and the viewer's existing next-at-the-end step. The measured cases start after home has rendered.

| Scenario | API calls + checks | Image host |
|---|---|---|
| Open the search, type, clear, use Recent, see no results, close | **0** | pictures of cells on screen that this session has not loaded yet (cheap families) |
| A tileset, Tiles Pro or isometric cell (result or Recently added) whose picture was never resolved on this device | its one existing costly-art request, only after 0.3 s on screen, once per device (as in the grid) | 1 picture |
| Go to row pictures | the same request as the home tile (once per device): the category's first mosaic picture | — |
| Typing through cells that are on screen for less than 0.3 s | **0** | — |
| Go to a category | as opening it from home (0 within the hour) | as the grid |
| Show all → All assets, top of the grid | **0** | cells on screen, grid rules |
| Scroll All assets to the end of a family's saved cards | 1 list page for that family: the same request as scrolling that category | — |
| Scroll All assets to the very end | exactly the next pages that scrolling every category to its end costs; never more | — |
| → at the last saved card in a viewer opened from All assets | 1 list page, then the viewer moves on (Phase 2 rule) | — |
| Reload on `#/all`, `#/a/<key>` or `#/all/a/<key>` within the hour | **0** | browser cache |
| Open a result in the viewer | as opening it from its grid (Phase 2 table) | as Phase 2 |
| Prev/next through results | as Phase 2, but never a list page (R8) | as Phase 2 |
| Phase 2 gap fixes | 0 | 0 |

## Global Constraints (binding on every task)

- **No new request path.** Only `src/lib/api/http.ts` calls `fetch` (layering test). New or changed Phase 3 files never import `lib/api`. Search reads `library` state only. The review greps the diff: no new `apiGet`, `publicGet`, `loadMore` or `openCheck` call sites.
- **Search text stays in memory.** It never appears in the address bar, device storage (IndexedDB, `localStorage`, `sessionStorage`), form history, the Activity panel, logs or errors. The field is in a `<search>` element with no `<form>` and no `name`. It has `autocomplete="off" spellcheck="false" autocapitalize="off" enterkeyhint="search"`. Nothing new is stored on the device in Phase 3.
- **No PixelLab ids or picture links in the address bar or the Activity panel**; routes carry opaque keys only (R3).
- **GlassKit vendored and unmodified.** Layout overrides go in component styles or `app.css`. Copy comes word for word from [02 §12](../design/02-ux-spec.md#12-microcopy) and the mockup frames (`frames-base.js`, `frames-g2.js`), with "Vitrine" read as `APP_NAME`, except rulings R1, R7, R8 and R9.
- **Mockup fidelity** at desktop 1440×900 and phone 390×844: `02-search-focused`, `g2-search-results`, `g2-search-no-results`, `g2-all-assets` (shots in `mockups/full/base/shots/`; markup in `frames-base.js` and `frames-g2.js`; styles in `mockups/full/base/app.css` (search panel and phone rules) and `frames-g2.css`), minus the hidden controls above. Phone: the panel spans the full width above the dock, Go to has 2 columns, Recently added shows 3, Cancel is visible (mockup README "Phone layout").
- **Reuse first:** `CategoryGrid` (virtual rows, lazy pages, scroll memory, reveal), `AssetCell` (on-screen check, 0.3 s costly wait), `PixelArt`, `library.art`, the Phase 2 viewer and router. No new dependency.
- **KISS/YAGNI:** smallest complete change; deferred means hidden; every deliberate shortcut gets a `// ponytail:` comment naming its limit and upgrade path.
- **Accessibility:**
  - 44 px phone targets (R12) and visible focus.
  - `/` (default prevented) and Esc on desktop. The field is labelled "Search".
  - A polite status announces "{n} results" or "No matches" 500 ms after typing stops.
  - Focus returns to the opener on close. After a route change, focus goes to the screen's `h1`.
- **Tests:** unit with Vitest (Node, pure modules, mocked modules as in `tests/unit/library.test.ts`); e2e with Playwright on both projects against `tests/fixtures/pixellab-mock.ts` only. **Never a real key.** `npm run check`, `npm test` and `npm run e2e` pass after every task.
- No personal or machine-specific data in any committed file.

## Shared types (each added by the task named; other tasks code against them)

```ts
// src/lib/categories.ts (Task 3)
export type Scope = CategoryId | 'all';
export const familiesOf: (s: Scope) => readonly FamilyId[];   // 'all' = every category's families, home order
export const scopeLabel: (s: Scope) => string;                 // 'All assets' or the category label

// src/lib/types.ts (Task 3)
export interface Item { card: Card; familyId: FamilyId }

// src/lib/router.svelte.ts (Task 1)
export type Route = { name: 'home'; key?: string } | { name: 'all'; key?: string } | { name: 'category'; id: CategoryId; key?: string };
export const screenOf: (r: Route) => Route;                    // the route without its key
export const scopeOf: (r: Route) => CategoryId | 'all';        // the category id, else 'all'

// src/lib/ui/AssetCell.svelte props (Task 5)
{ card: Card; familyId: FamilyId; costly: boolean; href: string; terms?: string[] }
```

## Tasks and parallel groups

| Group | Tasks (run in parallel inside a group) | Needs |
|---|---|---|
| A | Task 1, Task 2, Task 3, Task 4 | Phase 2 |
| B | Task 5 | 1 + 2 + 3 |
| C | Task 6 | 1–5 |
| D | Task 7 | 6 |

### Task 1: Routes for All assets and viewers over any screen

**Group A.** **Files owned:** `src/lib/router.svelte.ts`, `tests/unit/router.test.ts`.

**Interfaces:** `Route`, `screenOf` and `scopeOf` as in "Shared types".
- `parseRoute`: `#/a/<key>` → `{ name: 'home', key }`; `#/all` → `{ name: 'all' }`; `#/all/a/<key>` → `{ name: 'all', key }`; category forms unchanged. A bad key gives the screen without a key; anything else is home.
- `pathOf`: `#/`, `#/a/<k>`, `#/all`, `#/all/a/<k>`, `#/c/<id>`, `#/c/<id>/a/<k>`.

**Behaviour.**
- `pushed` is set when a hashchange moves from a screen to the same screen with a key: `pathOf(screenOf(prev)) === pathOf(screenOf(next))`, and `prev` has no key or `pushed` is already set.
- `closeViewer()` and `replaceViewer(key)` work for every route that has a key. Without `pushed`, `closeViewer` replaces the address with `pathOf(screenOf(route))`.
- Update the file's header comment.

**Tests.**
- Round trips for all six forms.
- Bad keys (`toString`, 11 or 13 characters, uppercase, a UUID) on `#/a/` and `#/all/a/` give the screen without a key.
- `#/all/x`, `#/allx` and `#/a/` give home.
- `screenOf`/`scopeOf` for each form.
- `closeViewer` on `#/a/<key>`: `history.back()` when pushed from `#/`; otherwise `replaceState('#/')`. Existing cases pass.

**Done when:** unit tests pass and `npm run check` is clean.

### Task 2: Search rules (pure)

**Group A.** **Files owned:** `src/lib/search.ts` (new), `tests/unit/search.test.ts` (new).

**Interfaces.**
```ts
export const MAX_RESULTS = 100;
export const fold: (s: string) => string;            // NFD, combining marks removed, lower case
export const terms: (q: string) => string[];         // folded words, empty ones dropped
export const matches: (text: string, ts: string[]) => boolean;   // every term is a substring of fold(text); [] → false
export function highlight(text: string, ts: string[]): { text: string; mark: boolean }[];  // runs over the ORIGINAL text
export function search<T extends { card: Card }>(items: T[], q: string, statesOf: (it: T) => Card[]): T[];  // R5, R6
export function newestFirst<T extends { card: Card }>(items: T[], n: number): T[];   // meta.created_at desc, stable, undated last
export function remember(list: string[], q: string, cap?: number): string[];         // R2, cap 3
```

**Behaviour.**
- `highlight` folds code point by code point, so marks line up with the original characters: "Öbject" marked by "obj" gives `[{Öbj, mark}, {ect}]`. Overlapping and adjacent hits merge into one run.
- `search` folds each card's `name + ' ' + state_name` once per call, not once per term. It matches each of the item's states (`statesOf` returns `[card]` for an ungrouped card) and keeps input order. A grouped item comes back as `{ ...it, card }`, where `card` is the shown card if it matches, else the first matching state.

**Tests:**
- `fold("Ünïcode")`.
- AND of words, and a word split across name and state ("chest open").
- No match for an empty query.
- Accent-insensitive matching and highlighting, with code points outside the BMP intact.
- Group: match by the shown card, by another state only (returns that state), no duplicates.
- `newestFirst`: ties keep order, undated last.
- `remember`: dedupe ignoring case, cap, too short ignored, trimmed.

**Done when:** unit tests pass.

### Task 3: Library over a scope

**Group A.** **Files owned:** `src/lib/categories.ts`, `src/lib/types.ts`, `src/lib/data/library.svelte.ts`, `tests/unit/library.test.ts`, plus the `library.find` call sites in `src/lib/ui/CategoryGrid.svelte` and `src/lib/ui/Viewer.svelte` (one-line signature updates only).

**Interfaces.** `Scope`, `familiesOf`, `scopeLabel` and `Item` as in "Shared types". In the library:
```ts
library.items(scope: Scope): Item[]       // familiesOf(scope) in order, shown cards (unchanged rules)
library.find(key: string): Item | null    // any done card of any family, grouped states included (keys are unique across families)
library.count(scope: Scope): number       // sum of PixelLab totals (home tiles' numbers)
library.coverage(scope: Scope): 'full' | 'partial' | 'missing'
  // full: every family saved and cards.length >= total; partial: every family has a saved first page; missing: otherwise
```

**Behaviour.**
- `categories[].count` uses `count(id)`.
- `states(card, familyId)` reads a `$derived` `Map<group_id, Card[]>` per family instead of filtering every done card on each call, so a search over many grouped characters stays linear.
- No new saved state and no request.

**Tests:**
- `items('all')` equals the four categories' items joined in home order.
- `find(key)` finds a card in any family, including a non-shown grouped state.
- `count('all')` is the sum of the four categories.
- `coverage` for a missing, a short and a full family.
- `states` is unchanged for grouped and ungrouped cards.
- These calls send 0 requests.

**Done when:** unit tests pass, `npm run check` is clean and the layering test is green.

### Task 4: Phase 2 gap fixes

**Group A.** **Files owned:** `src/lib/viewer.ts`, `tests/unit/viewer.test.ts`, `src/lib/ui/AnimPicker.svelte`, `src/lib/ui/InfoPanel.svelte`.

**Interfaces.**
```ts
// viewer.ts
export function animLabel(a: Anim): string   // "Walk · 8f"; "Walk" when the first direction has no frames
```

**Behaviour.**
- AnimPicker's animation rows use `animLabel`, replacing its local `frameCount` text.
- InfoPanel's Copy, Copy asset ID and Open in PixelLab use `glass-btn--tertiary` (mockups `07-detail-info`, `g3-info-technical`). They keep their 44 px height, and Open in PixelLab stays full width.

**Tests:** `animLabel` with 0 and 8 frames.

**Done when:** unit tests pass, InfoPanel has no `glass-btn--secondary`, and `t8-viewer.spec.ts` passes.

### Task 5: Grid over a scope, the cell's name line and the fixture

**Group B** (after 1, 2, 3). **Files owned:** `src/lib/ui/CategoryGrid.svelte`, `src/lib/ui/AssetCell.svelte`, `src/lib/info.ts`, `src/lib/ui/Settings.svelte` (import the moved constant only), `src/App.svelte` (the `CategoryGrid` prop line only: `scope={category.id}`), `tests/fixtures/pixellab-mock.ts`, `tests/e2e/t5-navigation.spec.ts`.

**Interfaces.**
```ts
// CategoryGrid.svelte props
{ scope: Scope; reveal?: string | null }   // was categoryId
// AssetCell.svelte props: see "Shared types" (href replaces categoryId; terms highlights)
// info.ts
export const OTHER_CONTENT: readonly (readonly [label: string, url: string])[]  // moved from Settings: Fonts /create, Effects /create-vfx, Portraits and Talking animations /create-character, on https://www.pixellab.ai
```

**Behaviour.**
- **CategoryGrid** uses `library.items(scope)` and `familiesOf(scope)` for the family segments. Cell links are `pathOf({ ...screen, key })`, and scroll memory is keyed by scope. Lazy pages are unchanged (`dueFamilies` per family segment), so All assets loads a family's next page only when its saved end scrolls near.
- **End block (scope `'all'` only)**, shown when `library.coverage('all') === 'full'`: after the last row (full width), "That's everything" (R1), then a `glass-card` with the bold "Other PixelLab content isn't in the public API yet.", the About sentence with `APP_NAME`, "Find them in PixelLab:" and four `glass-btn--tertiary glass-btn--sm` links "Fonts ↗"… Each link opens a new tab with `rel="noopener noreferrer"` and the "(opens PixelLab in a new tab)" screen-reader suffix. Styles are ported from `frames-g2.css` `.g2-end`, `.g2-note` and `.g2-links` (desktop 640 px card; phone full width with 44 px links).
- **AssetCell**:
  - `href` is used as given.
  - The name line renders `highlight(name, terms)` with `<mark>` (`background: none; color: var(--gl-color-text); font-weight: 650`).
  - When the card has a `state_name` (R6), ` <small>· {state_name}</small>` follows (`--vt-text-3`, 13 px, phone 12 px; also highlighted).
  - The link's accessible name and `title` are the full visible text.
  - The art rules are unchanged.
- **Fixture:** one object row that no existing test names gets `state_name: 'open'`; under R6 its cell shows no state (objects never do).

**Tests:** `t5-navigation.spec.ts` asserts that the object cell shows no state and the grouped character cell shows "· Armored". The existing `categorygrid.test.ts`, `t5`, `t8` and `visual` stay green.

**Done when:** `npm run check`, `npm test` and every existing e2e test pass.

### Task 6: Search panel and wiring

**Group C** (after 1–5). **Files owned:** `src/lib/ui/Search.svelte` (new), `src/App.svelte`, `src/lib/ui/Dock.svelte`, `src/lib/ui/Viewer.svelte`, `index.html` (viewport meta), `src/app.css` (home pill `kbd` only, if needed), `tests/e2e/t11-search.spec.ts` (new), `tests/e2e/t5-navigation.spec.ts`.

**Interfaces.**
```ts
// Search.svelte
{ screen: Route; reveal?: string | null; onClose: () => void; onGo: (path: string) => void; results?: Item[] }
  // results: $bindable, the shown (capped) matches (R8)
export function clearRecent(): void   // module script
// Viewer.svelte props
{ scope: Scope; assetKey: string; results?: Item[] | null }   // was categoryId
// Dock.svelte gains onSearch: () => void; the Search controls carry data-search
```

**Behaviour.**
- **Viewer:**
  - It looks up `library.find(assetKey)`. `results ?? library.items(scope)` only orders prev/next, matched by key or group as today.
  - When the card is not in that list, ←/→ do nothing.
  - `loadMore` runs only without `results`.
  - The post-`loadMore` guard checks only `router.route.key !== card.key`, so it no longer requires a category route.
- **Dock:**
  - The home pill and the category icon become real Search buttons (named "Search your library" / "Search"); the home pill gets `<kbd aria-hidden="true">/</kbd>`, hidden on phone.
  - Select stays inert and "…" is unchanged.
  - All assets uses `mode="category"` with `scopeLabel('all')` and `library.count('all')`.
- **App:**
  - `screen = screenOf(route)` and `scope = scopeOf(route)`. A category or `all` screen renders `CategoryGrid scope`, and home renders `LibraryHome`.
  - `emptyCategory`, `failedHere` and `errorCard` use `familiesOf(scope)`. `h1` is `scopeLabel` (home: `APP_NAME`) with `tabindex="-1"`.
  - The Viewer shows whenever `route.key` is set, over the mounted screen, with `results` while the search is open with a query.
  - **Search state (R3):**
    - Opening pushes the same-URL `{ search: <entry id> }` entry.
    - A `popstate` landing on an entry without it closes the search.
    - Esc, Cancel, the leading button and the dim call `history.back()` when this tab pushed it, then focus `[data-search]` after `tick()`.
    - Go to and Show all close the search, navigate, and focus the new screen's `h1`.
  - `/` (no modifier, not typing in a field, with a key, and no viewer, menu, Settings or Activity open) calls `preventDefault()` and opens the search.
  - **Stacking:** dim 905 < dock = panel 910 < Viewer 950. The dim and panel are siblings of `.glass-tab-bar-dock`, never inside it (its `transform` would trap `position: fixed`). `Notice` is not rendered while searching. Everything stays inside the existing `inert={!!viewing}` wrapper, and the screen under the search is also inert.
  - **Focus return:**
    - `lastShown` is cleared when the search opens and when it closes.
    - `Search reveal` gets only the key of a viewer that closed while the search was open; `CategoryGrid reveal` gets it only while not searching.
    - `clearRecent()` runs when `library.hasKey` turns false.
- **Search.svelte:**
  - **Dock in search mode** (GlassKit `glass-tab-bar--floating vt-dock vt-scrim`, mockup `searchField`/`qdock`):
    - Leading button (R9).
    - `glass-search` field, 520 px on desktop, placeholder per R9, privacy attributes per Global Constraints, focused on open.
    - ✕ clear when the field has text (clears and keeps focus).
    - `esc` hint (desktop).
    - **Cancel** (phone only).
  - **Dim:** a `tabindex="-1"` button labelled "Close search".
  - **Scope** starts as `scopeOf(screen)`; **Search all types** sets it to `'all'` (R7).
  - **Panel** (`glass-popover`, 660 px, 100 px above the dock; phone 8 px side margins). It scrolls inside itself with `max-height: calc(100dvh - 140px)`. Sections, all hidden when empty:
    - **Recent:** chips (`glass-badge--interactive`, clock icon) fill the field; Clear empties the list. Shown only while the field is empty.
    - **Go to:** all-scope only. With an empty field, every category with a count; while typing, categories whose label `matches`. Each row is a `glass-list__item` link (`onGo('#/c/<id>')`) with the category's first mosaic picture (`library.art`, as the home tile), the label (highlighted) and "Type · {count}". 4 columns on desktop, 2 on phone.
    - **Recently added:** all-scope and an empty field only. `newestFirst(library.items('all'), 6)` as `AssetCell`s (6 columns; phone shows 3).
    - **"Show all {count('all')} assets ›":** all-scope, empty field, not on All assets; calls `onGo('#/all')`.
    - **Results:** "{n} result(s)", then up to `MAX_RESULTS` `AssetCell`s with `terms`, 4 columns (phone 3), then the R8 line when capped. `results` (bindable) holds the shown list.
    - **No results:** `glass-empty` with the first home mosaic picture as the idle sprite, the R7 copy and buttons, a divider, and the hint line. While `library.status === 'checking'` and `coverage(scope) === 'missing'`, "Checking for new assets…" shows instead (R9).
    - **Saved-only note** (R1) after the results or the no-results card, only when `coverage(scope) === 'partial'`.
  - Results and Recently added render `{#each … as it (it.card.key)}` (AssetCell never resets its picture).
  - **Result and Recently added links:** `href = pathOf({ ...screen, key })`. Clicking one remembers the query (R2).
  - **Keys:**
    - Esc inside the search root closes it.
    - Enter remembers the query and moves focus to the first result.
    - On a new `reveal`, focus moves to the result link whose key or `group_id` matches (as CategoryGrid does), else to the field.
  - **Status:** a `vt-sr` `role="status"` that reads "{n} results" or "No matches" 500 ms after the last change.
  - **Styles:** ported from `mockups/full/base/app.css` (`.vt-field`, `.vt-spanel`, `.vt-gh`, `.vt-recent`, `.vt-gotos`, `.vt-goto`, `.added`, `.dim`, `.vt-cancel` and their phone rules) and `frames-g2.css` (`.g2-clear`, `.g2-panel`, `.g2-res`, `.g2-empty`, `.g2-none`, `.g2-idle`, `.g2-hint`), in the component's `<style>`, with the z-indexes above. Use `:global` only for AssetCell's `.sq`/`.nm` inside the panel. Phone targets per R12.
  - `// ponytail:` on the 100-result cap and the missing debounce.
- **index.html:** the viewport meta gains `interactive-widget=resizes-content` (Chrome Android shrinks the page for the keyboard).

**Tests** (e2e, mocked, desktop and phone, `t11-search.spec.ts`):
- **`/` and phone basics:**
  - `/` focuses the search with an empty field on home, in a grid and on All assets, but not while Settings or the viewer is open.
  - Open the viewer from the grid, close it, press `/`: focus is in the field.
  - Phone: the Search button opens it, Cancel shows and closes it, and nothing scrolls sideways.
- **Empty field:**
  - Go to lists the 4 categories with counts; Go to Objects goes to `#/c/objects`, closes the search and focuses the `h1`.
  - Recently added shows 6 (phone 3).
  - "Show all N assets" goes to `#/all` with the crumb "All assets N".
- **Typing:**
  - "object 1" shows only matching cells, the count line and `<mark>` around "Object 1". "öbject 1" gives the same results.
  - Typing on to "object 12" leaves the remaining cell with a matching `data-key` and picture.
  - "open" does not match the object (R6); "armored" matches the grouped character and opens its Armored state.
- **Scope:**
  - In Characters, "slime" shows 'No matches for "slime" in Characters.'; Search all types widens it; Clear search empties the field.
  - In Characters, "object 1" → Search all types → open a result: the viewer stays open, and Esc returns to the search.
- **Groups:** "armored" shows one cell, "Character 7 · Armored", which opens the Armored state.
- **Recent:** Enter remembers, a chip refills the field, Clear empties it, and Recent is gone after a reload.
- **Viewer and Back:**
  - Opening a result from home goes to `#/a/<12 hex>`. Esc closes the viewer; the search is still open with its query and focus is on the result.
  - A second Esc closes the search: focus is on the dock's Search, and the grid's `scrollTop` is unchanged.
  - Browser Back does the same two steps, and from home the app stays open.
  - → steps to the next shown result, and stops at the last one.
- **Saved-only note and end line:**
  - With 250 characters (100 saved), the saved-only note shows. When a family's first page failed (`mock.fail`), the note is absent.
  - On All assets, scrolling to the end shows "That's everything" and the note card's four links with `rel="noopener noreferrer"`.
- **Deep links:** `#/all/a/<key>` and `#/a/<key>` open the viewer; an unknown key closes to the screen.
- **`t5-navigation.spec.ts`:** Search is no longer "coming soon"; Select stays inert with 0 requests.

**Done when:** `t11-search.spec.ts` and every existing e2e test pass on both projects.

### Task 7: Request counter, security, screenshots, accessibility and close-out

**Group D** (last). **Files owned:** `tests/e2e/t6-request-counter.spec.ts`, `tests/e2e/visual.spec.ts`, `tests/e2e/a11y.spec.ts`, `tests/e2e/security.spec.ts`, `docs/plan/phase3-plan.md` (tick tasks, log build rulings), `docs/plan/mvp-plan.md` (tick the backlog line).

**Tests** (exact counts, all after home has rendered):
- **T6, search:**
  - After the first open and a visit to every grid, opening the search, typing five queries (one with no results), using Recent, Clear search and Search all types, then closing sends **0** API requests.
  - In a fresh session, typing "t", "ti", "til" within 0.3 s and then clearing sends **0** API requests.
  - Letting "tileset" results sit on screen sends at most one costly-art request per visible tileset cell. Repeating the search sends **0**.
- **T6, All assets:**
  - Show all at the top of the grid: **0** list requests.
  - Scrolling to the bottom in steps: list requests equal exactly the next pages the mock's counts imply (characters 250 at 100 per page: 2; every other family: 0), and none while the scroll position is idle for 2 s.
  - On `#/all/a/<last saved character>`, → sends exactly 1 list request and moves to the next card.
  - Reload on `#/all` within the hour: **0** API requests.
- **T6, viewer from a result:**
  - The first open of a character sends exactly **1** detail request; reopening it sends **0**.
  - → through results sends no list request, even at the last result.
- **Security:**
  - Type a distinctive query, press Enter (`location.href` unchanged), open a result, close it and reload.
  - The query never appears in the address bar, in IndexedDB (`deviceStorage`), in `localStorage`/`sessionStorage` or in the Activity panel.
  - The field carries the privacy attributes. Every new URL holds only keys, and every request is a GET with no key in the URL.
- **Visual** (into `test-results/shots/`, both projects, dpr 1, 1.5 and 2.625):
  - Shots: `search-idle`, `search-results` ("object"), `search-none` (Characters, "slime"), `all-assets-end` and `viewer-info`.
  - The crispness check passes in the panel and on All assets.
  - With the offline notice active, opening the search shows no notice over the panel.
  - **Compare step:** the reviewer puts each shot beside `mockups/full/base/shots/{02-search-focused, g2-search-results, g2-search-no-results, g2-all-assets, 07-detail-info}-{desktop,mobile}.png` and lists every difference other than the hidden controls (Hero party/Favorites rows, ♡), sample art and R1's number-free end line. Differences in layout, spacing, type size, button style or copy are fixed before close-out.
- **a11y:**
  - Audit the search panel (empty and with results), the no-results panel and All assets with its end block.
  - Tab reaches every control with a visible ring.
  - Phone targets are ≥ 44 px, including every `glass-btn--sm`, the Recent chips and the ✕ (R12).

**Done when:**
- T6, security, visual and a11y pass with `--repeat-each=3` on both projects.
- The compare step finds no unexplained differences.
- Every Phase 3 test is green and this plan's tasks are ticked.

**Owner check (owner-run, not a builder Done-when):** on a real iPhone and Android phone, open the search and type. The field, ✕, Cancel and the first panel row must stay visible with the keyboard open. If iOS fails, the builder records it as a `// ponytail:` limit; no visualViewport code is added now.
