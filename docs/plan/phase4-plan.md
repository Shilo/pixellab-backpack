# Phase 4 plan: Favorites and folders

Status: **Draft** 2026-10-20, revised after the plan challenge (12 Important, 10 Minor; applied as the controller ruled). Builds on Phase 3 on branch `main` ([Phase 3 plan](phase3-plan.md), [build log](phase3-build-log.md)). Where this plan and older design docs disagree, **this plan wins for Phase 4**; the MVP, Phase 2 and Phase 3 rulings and Global Constraints still bind.

## Goal

Let a user keep favorites and folders of their PixelLab art **on this device**, open them with **zero API requests**, and reach them from home, the search and a card's menu. Clear the Phase 3 leftovers that still matter: next pages waiting behind pictures, the hidden failed-family hint while searching, the owner checks, and the temporary debug sign-in.

## Scope

1. **Favorites and folders** (mockups `01-home`, `g2-favorites`, `g2-favorites-empty`, `09-folder-open`, `04-context-menu`, `06-detail`, `g4-add-to-folder`, `g4-folder-name`, `g4-folder-menu`, `g4-confirm-delete-folder`, `g4-folder-empty`, `g4-folder-unavailable`, `g4-new-folder`):
   - **Home** gains the "Favorites and folders" section: a Favorites tile, folder tiles A–Z, and a "New folder" tile.
   - **Favorites** is a grid page at `#/fav` with the category dock "‹ Library · Favorites N · Search · Select (inert) · …", and "No favorites yet." when empty.
   - **A folder** opens as an overlay over home at `#/f/<id>`: name, "…" (Rename…, Delete folder…), ✕, the cells in a glass card, "N assets", the empty state and the unavailable-items note.
   - **The viewer's ♡** becomes visible and works. The viewer's "…" gains **Add to folder…**.
   - **A card's menu** (right-click, long press, ContextMenu key, Shift+F10) on every cell: Open · Favorite (or Unfavorite) · Add to folder….
   - **Add to folder**, the **folder name** dialog (create, rename, duplicate-name error) and the **delete folder** confirm.
   - **A small filled heart** on every favorited cell, in every grid.
   - **Go to rows** in the search for Favorites and folders.
   - **Forget key**, sign-out in other tabs, and another account's key wipe favorites and folders.
2. **Carry-over from Phase 3:**
   - Next pages go ahead of costly pictures in the safety net's queue (limits unchanged).
   - The search shows the failed-family hint for its own scope, with an empty field too.
   - Owner-run checks: real phones (search keyboard, long press), the live browser test.
   - Remove the temporary dev-only debug sign-in (commit `ad87010`), last, after the live browser test.

## Out of scope (hidden or inert exactly as now)

Select mode and the selection bar, downloads and ZIP (the menu's "Download…", the folder's "Download all N…"), backup export and import (and the backup tip), full refresh, Images and Maps, play previews, sort, grid size, Help and keyboard shortcuts (no `L` key), the hover ♡ and selection circle (`g2-hover`), toasts and Undo, the Add to folder filter field, Info's "In folders" rows, a "Remove from this folder" menu item, a check for deleted assets by listing everything, and the jump-to-bottom "one page per family per jump" limit from the Phase 3 live test.

## Rulings made while planning

| # | Ruling | Why | Cost if wrong |
|---|---|---|---|
| R1 | **Storage.** One record, `org`, in the existing IndexedDB store, read and written only through `store.ts`: `{ v: 1, favorites: string[], folders: Folder[], cards: Record<key, Snap> }`. Lists hold opaque card keys, newest added first; every listed key has a snapshot. On load each entry is checked on its own (as Phase 2 C3): a bad key, folder or snapshot is dropped and the rest kept; a record that is not `v: 1` reads as empty. The saved copy's `SCHEMA` stays 2. A write runs only while `org` is enabled (a key is held, R4); it is one read-modify-write in one IndexedDB transaction (idb-keyval `update`), and the new memory state comes from inside the updater. A tab re-reads `org` when it becomes visible again | Same store: Forget and the account-switch wipe already clear it. Per-entry checks never throw away folders over one bad entry. Atomic writes: two tabs never overwrite each other | A change made in another tab shows here only after this tab is focused (`// ponytail:`) |
| R2 | **Card snapshot** (R6 §4.3). Favoriting or adding to a folder saves the card as the screen holds it (`$state.snapshot(card)` and its family), once per key. It stays on this device: never in an address, history state, Activity, a log or (later) a backup. Screens show the **live** saved card when the saved copy has it, else the snapshot. Whenever a costly picture link resolves, `org.setThumb` writes it to a snapshot of that key (nothing when there is none), so a costly picture is asked once per device. A snapshot whose key is in no list is dropped | Deep rows expire after 7 days and pages load only on scroll; without a snapshot a folder needs every family's full list (36 requests today) | A snapshot keeps an old name until its card is live again |
| R3 | **Assets gone from PixelLab.** An item counts as gone only when its family is **fully saved** on this device (`cards.length >= total`) and holds no finished card with that key: 0 requests. Gone items are hidden and left out of every count. A folder with gone items shows "1 item in this folder isn't in your PixelLab library anymore." / "{n} items in this folder aren't in your PixelLab library anymore." with [Remove them] (02 §12.3, `g4-folder-unavailable`). Favorites hides them without a note. While the family is not fully saved the snapshot shows; opening a deleted one in the viewer behaves as Phase 2 (the detail fails: the existing message and Try again) | The only free, certain signal; orphan checks wait for a full Sync (05 §6.3) | A deleted asset can show until its family is scrolled to the end; gone favorites keep a few bytes each (`// ponytail:`) |
| R4 | **Privacy and accounts.** Forget key's `wipe()` clears `org` with the saved copy; its 'signed-out' message makes every other tab drop its memory copy (`signedOut()` calls `org.clear()`, which also disables writes, so nothing lands after Forget). A detected account switch in `connect` (no key of the new first Characters page among the saved ones) wipes it too, as it wipes the library: privacy on shared devices first. The Forget confirm drops 02's "☐ Also delete my folders and favorites" and reads: "{APP_SHORT} will disconnect on this device and delete its saved copy of your library, folders and favorites. Your PixelLab account isn't affected." A 401 keeps them (UX-23); a closed "this tab only" tab keeps them on the device (MVP decision 1) | Owner rule: Forget wipes them and another account must not see them | **Data loss:** the same account that made 100+ characters since its saved copy looks like a switch, and every folder and favorite is deleted (in "this tab only" mode `connect` runs each session). **Exposure:** an account with 0 saved Characters can't be told apart, so the previous account's folders stay. Rotating a key through Forget loses them. Mitigation: the later backup export (MVP backlog) |
| R5 | **Routes.** `#/fav`, `#/fav/a/<key>`, `#/f/<id>`, `#/f/<id>/a/<key>`. A folder id is 12 random hex characters made on this device (`crypto.getRandomValues`, no clash retry: 48 bits), checked like card keys; a folder **name** is never in an address. The overlay sits over home. Its ✕, Esc, a click outside, Back and Go to Library close it with `closeFolder()`: Back when this tab went from home to the folder, else the address is replaced with `#/`. The viewer nests under both with Phase 3's `pushed` rule. Once `org` has loaded, an unknown folder id calls `closeFolder()`. A search from these screens covers everything (`scopeOf` gives `'all'`); from Favorites its leading button reads "Back to Favorites", and a result that is not a favorite opens at `#/fav/a/<key>` (←/→ then do nothing after the search closes) | Phone Back closes overlays; no user text or PixelLab id in the address bar (D13) | None |
| R6 | **Order.** Favorites, a folder and their mosaics list items newest added first; a mosaic is the first 4 (02 §3.8). Folders sort A–Z (`localeCompare`, base sensitivity, numeric) after the Favorites tile, on home, in Add to folder and in Go to. Go to lists categories, then Favorites (when it has items), then every folder; typing matches category and folder names | Stable positions (UX-10); the panel already scrolls inside | None |
| R7 | **Character groups.** Membership is per group, as every grid since Phase 3 shows one card per group. The ♡ is filled and a folder is checked when **any** state of the group is in the list. Adding stores the key of the card acted on; removing removes every state's key of the group. Lists show **one cell per group**: the group's shown card when live, else the snapshot | Consistent with every grid; a new state on top of a group never drops a favorite | **Deviates from mockup `09-folder-open`**, which shows "Hooded Orb Mage" and "… · detailed robe" as two cells: a user can't keep two states of one character as separate items. Allowed difference in the compare step |
| R8 | **Limits.** Folder names are trimmed, 1–60 characters counted in code points (not the mockup field's `maxlength="60"`, which counts UTF-16 units), unique ignoring case ("You already have a folder with that name."). New folder starts prefilled "New folder", selected. No cap on folders or items | 02 §3.8; the data is tiny (research 17: about 6 KB for a heavy user) | Home shows every folder tile and the overlay renders every cell (pictures load only on screen) (`// ponytail:` add virtual rows or a filter if people make hundreds) |
| R9 | **Card menu.** Open · Favorite (Unfavorite when it is one) · Add to folder…; Download… and Select stay hidden. Every item repeats a visible path (S-3): click opens, the viewer's ♡ favorites, the viewer's "…" adds to a folder. It opens on every `.cell` (grids, the overlay, search results) from listeners set once in `App.svelte`: `contextmenu` (right-click, Android long press), `keydown` ContextMenu or Shift+F10 on a focused cell, and a 500 ms touch long press with 10 px slop (iOS fires no `contextmenu`; cells get `-webkit-touch-callout: none`). It is a native modal `<dialog>` mounted at App root (never under an `inert` wrapper), beside a lifted picture of the cell (desktop) or as a bottom sheet with a grip and 50 px rows (≤ 600 px). ↑/↓/Home/End move between items. Esc closes only the menu (its handler stops the event); focus returns to the cell | 08 §6.8, S-6; one listener set instead of one per cell | None |
| R10 | **Add to folder** replaces the menu in the same dialog and place (`g4-add-to-folder`); from the viewer it opens on its own under the capsule (desktop) or as a sheet. Checkboxes apply at once and persist (UX-10); Done closes. The New folder row opens the name dialog; Create makes the folder with this asset in it. **No toasts or Undo** (Phase 2 R12: no toast component yet). Changes show in place, and **one App-level live region** reads `org.said`: "Added to Favorites.", "Removed from Favorites.", "Added to {folder}.", "Removed from {folder}." (also after Remove them), "Deleted "{folder}"." Deleting a folder always asks first | 02 §3.8: Undo is a convenience. A live region inside a closing dialog or an inert subtree is never read | Add a toast with Undo later |
| R11 | **Viewer.** The ♡ is the first item in the top-right capsule (mockup `06-detail`): a toggle named "Favorite" with `aria-pressed`, filled when on. The viewer's "…" gains "Add to folder…" after Backdrop, before Open in PixelLab (08 §6.5). The open viewer never closes because a snapshot was dropped (unfavoriting a snapshot-only card): it keeps its last found item for the same key until it is closed; ←/→ then do nothing (Phase 3 R8 "not in the list") | Mockup and the 08 budget (5 + 1) | None |
| R12 | **Copy** (02 §12, frames): the section "Favorites and folders"; tiles "Favorites" / folder name with a count; "New folder" tile; "No favorites yet." / "Use the heart on any asset to keep it here."; the empty folder text changes, because Select is inert: **"This folder is empty."** / "Open an asset's menu in your library and choose Add to folder." / [Go to Library]; folder "…": Rename…, Delete folder…; confirm "Delete "{folder}"?" / "The {n} assets in it stay in your library. Only the folder goes away." / [Cancel] [Delete folder]; name dialog "New folder" / "Rename folder" with Create / Save; Go to subtitles "{n} assets" (Favorites) and "Folder · {n}"; the search hint (R15) Added in the build: a failed folder save says **"Couldn't save. Try again."**; the one-asset delete line reads **"The asset in it stays in your library."** | Word for word except where Select would be a false promise | Copy only |
| R13 | **Heart on cells.** A favorited cell shows a small filled heart top-right (`frames-g2.css` `.g2-fav`), decorative (`aria-hidden`); the link's name gains the screen-reader text ", favorite". In every grid, the overlay and the search | 08 §6.2 | None |
| R14 | **Request order** (carry-over). `list()` asks with `user: offset > 0`: next pages go ahead of pictures, while first-page checks keep their place behind a viewer's detail. The Tiles Pro picture drops `user: true` and waits with the tileset helpers. 2 at a time, 2 per second, the burst of 8, the daily cap and retries are untouched; no request is added or removed | A jump to the bottom of a big family waited about 15 s behind queued tileset pictures (Phase 3 live test) | Pictures appear a little later while pages load |
| R15 | **Failed family while searching** (carry-over). App passes `note` only for status notices (slowed, paused, stopped, offline). The search works out the hint itself from `library.errors` and `familiesOf(scope)`: "Some assets didn't load, so they can't be searched." in the idle and the typed panel, also after Search all types. A status note wins. Closing the search brings back the screen's notice and its Try again | Today the failure text reaches the search only for the screen's scope and only when typed | Copy only |
| R16 | **Reuse.** Favorites is the existing `CategoryGrid` over a given list (no next pages, no end block). The overlay is a plain CSS grid of `AssetCell`s. Home tiles reuse `CategoryTile`. Dialogs follow Settings' native `<dialog>` and GlassKit alert modal | KISS; no new dependency | None |
| R17 | **Debug sign-in removal** by hand (not `git revert`, which would also undo the later `cssMinify: false`), last, after the live browser test | It is the tool for that test | None |

## Rulings made while building

| Task | Ruling | Cost if wrong |
|---|---|---|
| 5 | Two copy lines join R12: "Couldn't save. Try again." and "The asset in it stays in your library." | Copy only |
| 7 | The folder title sits just above its card, which is centered in the window, so a short folder's title is lower than in `g4-folder-unavailable` (6 items); tall content still fits | None |
| 7 | Only finished assets can enter a folder or Favorites (unfinished ones have no cell) | None |
| 9 | Typing in the search also matches the Favorites Go to row by its label, like types and folders | None |
| 10 | A category dock with a count of 0 has no Select (mockup `g2-favorites-empty`: nothing to select) | None |
| 10 | "Remove them" is 44 px tall on phone, not the mockup's 40 px (Global Constraints: 44 px phone targets) | None |

## API-call budget for Phase 4

"Calls + checks" as in Phase 2. Phase 4 adds **no request path**: no new `apiGet`, `publicGet`, `loadMore` or `openCheck` caller; `library.art` is called only where pictures are drawn (cells, tiles, Go to rows, Add to folder rows, the lifted picture). The measured cases start after home has rendered. "A costly card" is a tileset, Tiles Pro or isometric card whose picture link was never resolved on this device.

| Scenario | API calls + checks | Image host |
|---|---|---|
| Favorite, unfavorite, add to or remove from a folder, create, rename, delete a folder, Remove them | **0** | — |
| Open or close a card's menu or Add to folder | **0**, unless a row shows a costly card: its one request, once per device | session cache, else 1 picture per row |
| Home tiles, Go to rows for Favorites and folders | **0**, unless a mosaic or row shows a costly card: its one request, once per device | first 4 pictures each, browser cache after the first time |
| Open Favorites or a folder whose pictures were seen once on this device | **0** | browser cache |
| …after a reload, or after the deep pages expired (snapshot only) | **0** | browser cache |
| A costly card in Favorites or a folder | its one request, after 0.3 s on screen, **once per device** (R2) | 1 picture |
| Scroll Favorites to the end | **0** (never a list page) | cells on screen |
| Open an item in the viewer | as Phase 2 (character or object: 1 detail the first time per device) | as Phase 2 |
| ←/→ in a viewer opened from Favorites or a folder | as Phase 2, **never a list page** | as Phase 2 |
| Gone check (R3), Forget key, another tab's Forget | **0** | — |
| Request order (R14) | the same requests, in a different order | — |

## Global Constraints (binding on every task)

- **Gate:** Group A starts only when the Phase 3 live-test fixes (L1–L4, uncommitted at planning time; they touch `Search.svelte`, `Settings.svelte`, `AssetCell.svelte`, `CategoryGrid.svelte`, `LibraryHome.svelte`, `InfoPanel.svelte`, `KeyScreen.svelte`, `ViewerMenu.svelte`, `app.css`, `app.ts`, `search.ts` and tests) are committed and `npm run check`, `npm test` and `npm run e2e` are green.
- **No new request path.** Only `src/lib/api/http.ts` calls `fetch` (layering test). New Phase 4 files never import `lib/api`. The review greps the diff: no new `apiGet`, `publicGet`, `loadMore` or `openCheck` call site; the only `lib/api` change is R14's two flags.
- **Device storage only through `store.ts`** (layering test). `org` is never written while disabled (R4).
- **Nothing private in addresses or logs.** Routes carry opaque card keys and random folder ids only. Folder names, raw PixelLab ids and picture links never appear in the address bar, `history.state`, the Activity panel, logs or error messages.
- **Layers in `App.svelte`:** the root `CardMenu` and the live region sit at App root beside Settings and Activity; `FolderOverlay` sits inside `inert={!!viewing}` and outside `inert={searching}`; the overlay's popover and `FolderDialog` live inside it; the Viewer's own `CardMenu` lives inside the Viewer (already at App root).
- **GlassKit vendored and unmodified.** Layout overrides go in component styles or `app.css`. Copy comes word for word from [02 §12](../design/02-ux-spec.md#12-microcopy) and the mockup frames (`frames-base.js`, `frames-g2.js`, `frames-g4.js`), with "Vitrine" read as `APP_NAME`/`APP_SHORT`, except rulings R3, R4, R12 and R15.
- **Mockup fidelity** at desktop 1440×900 and phone 390×844 for the frames in Scope (shots in `mockups/full/base/shots/`; markup in `frames-base.js`, `frames-g2.js`, `frames-g4.js`; styles in `mockups/full/base/app.css` (`.sec`, `.folder`, `.fopen`, `.ftitle`, `.fpanel`, `.fmeta`, `.fclose`, `.lifted`, `.vt-menu` and their phone rules), `frames-g2.css` (`.g2-fav`, `.g2-page`, `.g2-empty`, `.g2-idle`) and `frames-g4.css` (`.g4-atf`, `.g4-ph`, `.g4-fl`, `.g4-th`, `.g4-new`, `.g4-dlg`, `.g4-name`, `.g4-err`, `.g4-emptyp`, `.g4-idle`, `.g4-note`, `.g4-newm`, `.g4-newi`)), minus the hidden controls above. Phone: menus and Add to folder are bottom sheets with a grip; the overlay is full width with 3 columns and ✕ top right.
- **Real-browser check.** Every new screen is checked in a **headed** browser at both sizes, not only in headless screenshots (Phase 3 found native scrollbars that headless hid). Scrolling boxes inside rounded panels use an inner scroller (Phase 3 L1).
- **Reuse first:** `CategoryGrid`, `AssetCell`, `CategoryTile`, `PixelArt`, `library.art`, the Phase 3 router and viewer routes, the `MoreMenu` popover look and the Settings `<dialog>` pattern. No new dependency.
- **KISS/YAGNI:** smallest complete change; deferred means hidden; every deliberate shortcut gets a `// ponytail:` comment naming its limit and upgrade path.
- **Accessibility:**
  - 44 px phone targets (sheet rows 50 px, ✕ 48 px) and a visible focus ring.
  - Dialogs and the overlay have names; focus moves in on open and back to the opener on close; after a route change focus goes to the screen's heading (the overlay's own heading for a folder).
  - The ♡ is a toggle with `aria-pressed`; checkboxes are real `<input type="checkbox">`; the card menu is `role="menu"` with `menuitem` buttons.
  - Every change is read by the one live region (R10).
- **Tests:** unit with Vitest (Node, pure modules, mocked `idb-keyval` as in `tests/unit/store.test.ts`); e2e with Playwright on both projects against `tests/fixtures/pixellab-mock.ts` only. **Never a real key** in tests. `npm run check`, `npm test` and `npm run e2e` pass after every task. **Only one Playwright run at a time** (port 4173; it rebuilds `dist/`); final runs use `--workers=2`.
- No personal or machine-specific data in any committed file.

## Shared types (each added by the task named; other tasks code against them)

```ts
// src/lib/data/org.svelte.ts (Task 1)
export interface Snap { familyId: FamilyId; card: Card }
export interface Folder { id: string; name: string; at: number; items: string[] }   // items: card keys, newest added first
export const NAME_MAX = 60;
export const org: { favorites: string[]; folders: Folder[]; cards: Record<string, Snap>; ready: boolean; said: string };  // $state; folders A–Z
export function load(): Promise<void>;   // reads and checks the saved record, enables writes, ready = true
export function clear(): void;           // memory only, disables writes (wipe() clears the device)
export const isIn: (list: string[], keys: string[]) => boolean;   // any of the group's keys (R7)
export function setFavorite(it: Item, keys: string[], on: boolean): Promise<void>;
export function setInFolder(id: string, it: Item, keys: string[], on: boolean): Promise<void>;
export function createFolder(name: string, add?: Item): Promise<string>;   // the new id
export function renameFolder(id: string, name: string): Promise<void>;
export function deleteFolder(id: string): Promise<void>;
export function removeKeys(id: string, keys: string[]): Promise<void>;   // "Remove them" (R3)
export function setThumb(key: string, thumb: string): void;              // R2; nothing when there is no snapshot
export function nameError(name: string, exceptId?: string): string | null;   // R8 copy, or null when valid

// src/lib/data/store.ts (Task 1)
export const loadOrg: () => Promise<unknown>;
export function updateOrg(fn: (old: unknown) => unknown): Promise<void>;   // one transaction

// src/lib/data/library.svelte.ts (Task 4)
library.pick(keys: string[]): { items: Item[]; gone: string[] }   // R2, R3, R7
library.find(key: string): Item | null                             // also a snapshot that is not gone

// src/lib/router.svelte.ts (Task 2)
export type Route = { name: 'home'; key?: string } | { name: 'all'; key?: string } | { name: 'category'; id: CategoryId; key?: string }
  | { name: 'fav'; key?: string } | { name: 'folder'; id: string; key?: string };
export function closeFolder(): void;

// src/lib/ui/CardMenu.svelte props (Task 5)
{ item: Item | null; rect: DOMRect | null; href: string; start: 'menu' | 'folders'; onClose: () => void }
  // rect null: no lifted picture, placed under the viewer capsule (desktop) or as a sheet
// src/lib/ui/FolderDialog.svelte props (Task 5)
{ mode: { kind: 'new'; add?: Item } | { kind: 'rename'; folder: Folder } | { kind: 'delete'; folder: Folder } | null;
  onDone: (id?: string) => void; onClose: () => void }

// src/lib/ui/CategoryGrid.svelte props (Task 6)
{ screen: Route; items: Item[]; reveal?: string | null }   // was { scope }
// src/lib/ui/CategoryTile.svelte props (Task 6)
{ href: string; label: string; count: number; cards: Item[]; glow?: boolean }
// src/lib/ui/FolderOverlay.svelte props (Task 7)
{ folderId: string; reveal?: string | null; onClose: () => void }
// src/lib/ui/ViewerMenu.svelte gains (Task 8)
{ onAddToFolder: () => void }

// tests/fixtures/pixellab-mock.ts (Task 6)
export function ageSaved(page: Page, fam: Fam, o: { checkedMs?: number; deepMs?: number }): Promise<void>;
  // rewrites family:<fam> in IndexedDB: checkedAt and deepLoadedAt moved this many ms into the past
```

## Tasks and parallel groups

Tasks 6–9 are vertical slices: each wires its own part of `App.svelte` and lands with its own e2e spec.

| Group | Tasks (run in parallel inside a group) | Needs |
|---|---|---|
| Gate | Phase 3 live-test fixes committed and green | — |
| A | Task 1, Task 2, Task 3 | Gate |
| B | Task 4, Task 5 | 1 (Task 5 also 2) |
| C | Task 6 (Favorites slice) | 4 |
| D | Task 7 (Folders slice) | 5 + 6 |
| E | Task 8 (Card menu slice), Task 9 (Search slice) | 7 |
| F | Task 10 | 8 + 9 |
| G | Task 11 | 10 + the live browser test |

In Group E, Task 8 owns App's root `CardMenu` and listeners; Task 9 owns only App's `note=` line.

### Task 1: Org store

**Group A.** **Files owned:** `src/lib/data/org.svelte.ts` (new), `src/lib/data/store.ts`, `tests/unit/org.test.ts` (new), `tests/unit/store.test.ts`.

**Behaviour.**
- Imports only `store.ts`, `types.ts` and `categories.ts` (`familiesOf('all')` lists the known family ids). Never `lib/api` or `library`.
- **Check on load (R1):** a key is 12 lowercase hex; a folder has a 12-hex `id`, a trimmed name of 1–60 code points, a number `at` and an array of keys; a snapshot has a known `familyId` and a card that passes `store.ts`'s card check, with `card.key` equal to its record key. Keys without a snapshot are dropped; duplicate folder names keep the first; not `v: 1` → empty.
- **Mutations:** `if (!enabled) return;` then `let next; await updateOrg((o) => (next = apply(check(o))));` then memory = `next` and `said` = the R10 text. `load()` enables; `clear()` disables and empties memory.
- Adding puts the key first (no duplicates) and stores `{ familyId, card: $state.snapshot(card) }`. Removing drops every key in `keys`, then any snapshot no list uses.
- `createFolder`: id from `crypto.getRandomValues` (6 bytes to hex), trimmed name, refused when `nameError` is set. `nameError`: "You already have a folder with that name." for a case-insensitive clash (ignoring `exceptId`); a non-empty string for empty or over-long names (the dialog then only disables Create).
- `setThumb` writes only when the snapshot exists and its `thumb` differs.
- Header comment: what is stored, why the snapshot exists (R6 §4.3), and "a future saved-copy SCHEMA bump must keep the `org` key". `// ponytail:` on the focus re-read.

**Tests:**
- `check`: a valid record round-trips; a bad key, a 61-character name, a snapshot without `meta` and an unknown family are each dropped while the rest stays; `v: 2` and garbage read as empty.
- Favorites add and remove; a group: `isIn` true for another state's key; removing all group keys clears it and drops the unused snapshot.
- Folders: create (id format, A–Z order), rename (duplicate ignoring case refused, own name allowed), delete (a snapshot shared with Favorites is kept).
- Two module instances over one mocked store: both writes survive.
- After `clear()`, a mutation stores nothing (no `org` key appears).
- `said` reads the R10 text after each mutation.
- `store.test.ts`: `wipe()` clears `org`; `updateOrg` passes the stored value to the updater.

**Done when:** unit tests pass, `npm run check` is clean and the layering test is green.

### Task 2: Routes for Favorites and folders

**Group A.** **Files owned:** `src/lib/router.svelte.ts`, `tests/unit/router.test.ts`.

**Behaviour.**
- `parseRoute`: `#/fav`, `#/fav/a/<key>`, `#/f/<id>`, `#/f/<id>/a/<key>`. A bad folder id (not 12 lowercase hex) is home; a bad key gives the screen without a key.
- `pathOf` writes the four forms; `screenOf` keeps the folder id; `scopeOf` gives `'all'` for both.
- A `folderPushed` flag, set on `hashchange`: true from home with no key to a folder with no key; unchanged between entries of the same folder id; false otherwise. `closeFolder()`: `history.back()` when set, else `replaceState('#/')` and `router.route = { name: 'home' }`. Same `// ponytail:` as `pushed`.
- Header comment updated.

**Tests.**
- Round trips for the four forms; Phase 3 forms unchanged.
- Bad ids (`toString`, 11 or 13 characters, uppercase, a UUID), `#/favx`, `#/f/`, `#/fav/x` give home.
- `#/` → `#/f/<id>` → `closeFolder`: `history.back()`. Direct load on `#/f/<id>` → `replaceState('#/')`.
- `#/` → `#/f/<id>` → `#/f/<id>/a/<key>` → Back → `closeFolder` still uses `history.back()`.
- `closeViewer` on `#/f/<id>/a/<key>` pushed from `#/f/<id>`: `history.back()`.

**Done when:** unit tests pass and `npm run check` is clean.

### Task 3: Next pages before costly pictures

**Group A.** **Files owned:** `src/lib/api/families.ts`, `tests/unit/families.test.ts`.

**Behaviour (R14).** `list(offset)` passes `user: offset > 0`. The Tiles Pro picture's `apiGet` drops `user: true`. Details keep `user: true`.

**Tests:** `list(0)` passes no `user`; `list(99)` passes `user: true`; the Tiles Pro `art()` passes no `user`; details still pass `user: true`.

**Done when:** unit tests pass and the T6 counts in `t6-request-counter.spec.ts` are unchanged.

### Task 4: Library over favorites and folders

**Group B** (after 1). **Files owned:** `src/lib/data/library.svelte.ts`, `tests/unit/library.test.ts`.

**Behaviour.**
- `pick(keys)`, in list order: a done card with that key in any family → the group's shown card (`states(card, familyId)[0]`); else a snapshot whose family is not fully saved → the snapshot item; else → `gone`. One item per shown card key (R7). No request.
- `find(key)`: the current search over done cards, then a snapshot that is not gone.
- `openCheck`, after `adopt()` and only with a key: `await org.load()` (`connect` ends with `openCheck`, so it loads after its possible wipe). On `visibilitychange` to visible with a key: `org.load()`.
- `signedOut()` calls `org.clear()`; `connect`'s account-switch branch calls `org.clear()` before `wipe()`.
- `loadArt` calls `org.setThumb(card.key, thumb)` whenever a costly link resolves.

**Tests:**
- `pick`: a live key; another state's key gives one item, the shown card; a snapshot-only key in a partial family; a gone key in a fully saved family; order kept.
- `find` returns a snapshot for an unsaved deep card and null for a gone one.
- `forget()`, a signed-out message and an account switch clear `org` memory.
- A resolved costly link calls `setThumb`.
- These calls send 0 requests.

**Done when:** unit tests pass, `npm run check` is clean and the layering test is green.

### Task 5: Card menu and folder dialog components

**Group B** (after 1 and 2). **Files owned:** `src/lib/ui/CardMenu.svelte` (new), `src/lib/ui/FolderDialog.svelte` (new).

**Behaviour.**
- **CardMenu** (R9, R10): one native modal `<dialog>` with two views.
  - **menu:** Open (goes to `href`), Favorite / Unfavorite (`org.setFavorite` with `library.states(...)` keys; closes), Add to folder… (switches view in place). Icons and order from `04-context-menu`.
  - **folders** (`g4-add-to-folder`): "Add to folder" and the asset name, Done; a "New folder" row (blue + tile) opening `FolderDialog` `{ kind: 'new', add: item }`; one row per folder A–Z with its newest item's picture (from its snapshot through `library.art`, or the folder glyph), name, "{n} assets" and a GlassKit checkbox calling `org.setInFolder` at once.
  - With `rect`: a lifted picture at `rect` (a plain `aria-hidden` `div` with `PixelArt` from `library.art` and the name, never a second `a.cell`), and the panel beside it, flipped left when it would leave the window (`side()` in `frames-g4.js`). Without `rect`: under the viewer capsule (`top: 92px; right: 24px`).
  - ≤ 600 px: a bottom sheet with a grip and 50 px rows over a dimmed page.
  - ↑/↓/Home/End over the items; Esc closes with `stopPropagation`. Focus goes to the first item on open and back to `a[data-key="<key>"]` (else the screen's heading) on close. `::backdrop` dims and blurs as `.glass-modal-overlay`. No status element (R10).
- **FolderDialog** (`g4-folder-name`, `g4-confirm-delete-folder`): a native `<dialog class="glass-modal-overlay">` with a GlassKit alert modal, as in Settings.
  - **new / rename:** title "New folder" / "Rename folder"; a `glass-input` (no `maxlength`, R8) prefilled "New folder" or the current name, selected; the duplicate error under it (`glass-input--error`, `aria-invalid`, `aria-describedby`); Cancel and Create / Save (disabled while invalid); Enter submits. Create calls `org.createFolder(name, add)` then `onDone(id)`; Save calls `org.renameFolder`. The field has `autocomplete="off"`, no `name`, no `<form>`.
  - **delete:** the R12 confirm; Delete folder calls `org.deleteFolder` then `onDone()`.

**Tests:** wired and tested in Task 7 (FolderDialog) and Task 8 (CardMenu).

**Done when:** `npm run check` passes.

### Task 6: Favorites slice

**Group C** (after 4). **Files owned:** `src/lib/ui/Viewer.svelte`, `src/lib/ui/AssetCell.svelte`, `src/lib/ui/CategoryGrid.svelte`, `src/lib/ui/CategoryTile.svelte`, `src/lib/ui/LibraryHome.svelte`, `src/app.css`, `src/App.svelte`, `tests/unit/categorygrid.test.ts`, `tests/fixtures/pixellab-mock.ts` (`ageSaved`), `tests/e2e/t13-favorites.spec.ts` (new), `tests/e2e/t5-navigation.spec.ts`.

**Behaviour.**
- **Viewer (R11):** the capsule shows ♡, ⓘ, …; ♡ toggles `org.setFavorite` over `states` keys. `hit` keeps the last found item for the same key (`library.find(k) ?? (last?.card.key === k ? last : null)`), so a dropped snapshot never closes it. Esc calls `e.preventDefault()` (the overlay ignores a handled Esc).
- **AssetCell (R13):** heart badge and ", favorite" when `org.isIn(org.favorites, states' keys)`; `-webkit-touch-callout: none; user-select: none` (R9).
- **CategoryGrid** takes `{ screen, items, reveal }`: next pages only for `category`/`all`, the end block only on `all`; scroll memory keyed by `pathOf(screen)`; links `pathOf({ ...screen, key })`.
- **CategoryTile** takes `{ href, label, count, cards, glow }`; `glow` gives the glass glow mosaic and darker cells (mockup `.folder`); an empty glow tile shows the folder glyph.
- **LibraryHome:** after the category tiles, once `org.ready`: `<h2 class="sec">Favorites and folders</h2>` and the Favorites tile (`#/fav`, always shown, from `library.pick(org.favorites)`). `app.css`: `.sec`, `.folder` and their phone rules.
- **App:**
  - The grid is `{#key pathOf(screen)}<CategoryGrid {screen} items=… />{/key}` for category, All assets (`library.items(scope)`) and `fav` (the pick list).
  - On `fav`: the empty screen when the list is empty (`g2-favorites-empty`: first home mosaic picture as idle sprite, "No favorites yet.", "Use the heart on any asset to keep it here."); `errorCard`, `emptyGrid` and the failure notice are off; the category dock titled "Favorites" with the shown count; `h1` reads "Favorites".
  - Viewer `results`: the search's results while searching, else the pick list on `fav`.
  - The live region `<span class="vt-sr" role="status">{org.said}</span>` at App root.

**Tests** (`t13-favorites.spec.ts`, both projects):
- Viewer ♡ on a character: `aria-pressed` true, the grid cell shows the heart, the live region says "Added to Favorites.", home's Favorites tile counts 1, `#/fav` shows it; ♡ again removes it everywhere.
- Grouped character: favorite "Character 7 · Armored" in the viewer; the group cell shows the heart; Favorites shows one cell.
- Empty Favorites shows "No favorites yet."; reload keeps favorites; `h1` reads "Favorites".
- A favorite from page 2 (row 150), then `ageSaved(page, 'characters', { checkedMs: 2 h, deepMs: 8 days })` and a reload: it still shows in Favorites; opening it and unfavoriting keeps the viewer open.
- Search from Favorites: a result opens the viewer, and ←/→ step through the results.
- `t5`: Select stays inert with 0 requests on Favorites.

**Done when:** `t13-favorites.spec.ts` and every existing test pass on both projects.

### Task 7: Folders slice

**Group D** (after 5 and 6). **Files owned:** `src/lib/ui/FolderOverlay.svelte` (new), `src/lib/ui/LibraryHome.svelte`, `src/App.svelte`, `src/lib/ui/Settings.svelte` (Forget text only), `tests/e2e/t13-folders.spec.ts` (new), `tests/e2e/t7-settings.spec.ts`.

**Behaviour.**
- **FolderOverlay** (`09-folder-open`, `g4-folder-menu`, `g4-folder-empty`, `g4-folder-unavailable`): a fixed layer over home (dim and blur as `.glass-modal-overlay`, z-index between the dock (910) and the viewer (950)), `role="dialog"` named by its title; not a modal `<dialog>`, so the viewer opens on top.
  - Title row: the name as `h2` (focused on open) and a "…" pill (`aria-label="Folder actions"`) opening a small popover (`MoreMenu` look; phone: bottom sheet): Rename…, Delete folder… (danger), each opening `FolderDialog`; after a delete, `onClose`.
  - ✕ pill top-right (`aria-label="Close folder"`, 48 px on phone).
  - Body from `library.pick(folder.items)`: the glow card (1160 px, 4 columns; phone full width, 3 columns) of `AssetCell`s linking to `#/f/<id>/a/<key>`, in an inner scroller; "{n} assets" under it. The R3 note first when `gone` is non-empty, with Remove them (`org.removeKeys`).
  - Empty: the `g4-emptyp` card with the first home mosaic picture, the R12 copy and a primary "Go to Library" (`onClose`).
  - Closes on ✕, a click on the dim outside the card, and Esc unless `e.defaultPrevented` or a viewer, menu or dialog is open. `reveal` focuses and scrolls to a closed viewer's cell. `// ponytail:` no virtual rows (R8).
- **LibraryHome:** folder tiles A–Z (`#/f/<id>`, `glow`) after Favorites, then the "New folder" tile: a `<button>` with the dashed mosaic and round + (`g4-new-folder`) opening `FolderDialog` `{ kind: 'new' }`; Create goes to `#/f/<new id>`.
- **App on `folder`:** `LibraryHome` under `FolderOverlay`, placed per the Layers constraint; home inert; dock and notice hidden; `errorCard`/`emptyGrid` off; `h1` reads the folder name; `/` does nothing while the overlay is open; viewer `results` is the folder's pick list; an unknown id once `org.ready` → `closeFolder()`; `goFromSearch` skips its `h1` focus for a folder path (the overlay focuses its heading).
- **Settings:** the R4 Forget text.

**Tests** (`t13-folders.spec.ts`, both projects; t7):
- New folder tile → "New folder" → "Hero party" → Create → `#/f/<12 hex>`, "This folder is empty.", Go to Library → `#/`.
- Duplicate "hero PARTY" shows the error and disables Create.
- Rename… updates the tile; Delete folder… shows the confirm copy (Cancel keeps it); after delete `#/`, no tile, and the live region says "Deleted "Hero party"."
- A deep link to an unknown folder id lands on `#/`.
- t7: Forget key (new text) leaves no `org` in `deviceStorage()`, and a second tab loses its folder tiles at once; `OTHER_KEY` in a fresh connect wipes `org`.

**Done when:** `t13-folders.spec.ts`, `t7-settings.spec.ts` and every existing test pass on both projects.

### Task 8: Card menu slice

**Group E** (after 7). **Files owned:** `src/lib/ui/ViewerMenu.svelte`, `src/lib/ui/Viewer.svelte`, `src/App.svelte` (root `CardMenu` and listeners), `tests/e2e/t13-menu.spec.ts` (new).

**Behaviour.**
- **ViewerMenu:** a row "Add to folder…" (folder icon, 44 px) after Backdrop, before Open in PixelLab; closes the menu and calls `onAddToFolder`.
- **Viewer:** renders `CardMenu` with `start="folders"`, `rect={null}` for the current card; focus returns to the "…" button.
- **App (R9):** one `contextmenu`, one `keydown` (ContextMenu, Shift+F10) and one `pointerdown` (touch, 500 ms, 10 px slop; cancelled by `pointerup`, `pointercancel`, scroll) listener on `window`. Each finds the closest `a.cell[data-key]`, ignores events while a viewer, menu, Settings, Activity or dialog is open, calls `preventDefault()` and opens the root `CardMenu` with `library.find(key)`, the cell's rect and its `href`. After a long press the next click on that cell is swallowed; a second trigger while open is ignored.

**Tests** (`t13-menu.spec.ts`, both projects):
- Right-click a cell (desktop): Open, Favorite, Add to folder… only; Favorite toggles the heart; Esc returns focus to the cell.
- Shift+F10 on a focused cell opens it; ↓ and Enter pick Add to folder…; check "Hero party", Done; the overlay lists the asset with "1 asset"; unchecking removes it. The live region reads each change.
- The New folder row creates and checks in one step.
- Viewer "…" → Add to folder… adds the current card.
- Viewer from the overlay: Esc returns to the overlay with focus on the cell; Esc again closes it; browser Back does the same two steps.
- Unavailable: add `Object 12` to a folder; set `mock.counts.a.objects = 11`, `ageSaved(page, 'objects', { checkedMs: 2 h })`, reload: the note reads "1 item in this folder isn't in your PixelLab library anymore."; Remove them clears it; Favorites hides a favorited gone item.
- Phone: a 600 ms touch press opens the sheet and does not navigate; a short tap still opens the viewer.
- The menu opens in search results and in the overlay (above both).

**Done when:** `t13-menu.spec.ts` and every existing test pass on both projects.

### Task 9: Search slice

**Group E** (after 7). **Files owned:** `src/lib/ui/Search.svelte`, `src/App.svelte` (the `note=` line only), `tests/e2e/t11-search.spec.ts`.

**Behaviour.**
- **Go to (R6):** with everything in scope, after the category rows: Favorites (when it has items; "{n} assets"; its first item's picture) and every folder A–Z ("Folder · {n}"; newest item's picture or the folder glyph). Typing: categories and folders whose name `matches`, highlighted. Links `onGo('#/fav')` and `onGo('#/f/<id>')`.
- **Hint (R15):** from `library.errors` ∩ `familiesOf(scope)`, in the idle and typed panel; a status `note` wins; the announcement includes it. App passes `note` only for slowed, paused, stopped and offline.
- **Lead name (R5):** "Back to Favorites" on `fav`.

**Tests** (`t11`):
- Go to shows Favorites and an empty "Hero party" folder; "hero" shows only the folder row; Go to opens the overlay with focus on its heading.
- With `mock.fail` on the tileset family: the idle panel and a typed panel after Search all types from Characters show the hint.

**Done when:** `t11-search.spec.ts` and every existing test pass on both projects.

### Task 10: Request counter, security, screenshots, accessibility and close-out

**Group F** (after 8 and 9). **Files owned:** `tests/e2e/t6-request-counter.spec.ts`, `tests/e2e/security.spec.ts`, `tests/e2e/visual.spec.ts`, `tests/e2e/a11y.spec.ts`, `docs/plan/phase4-plan.md` (tick tasks, log build rulings), `docs/plan/mvp-plan.md` (tick the backlog line).

**Tests** (exact counts, all after home has rendered):
- **T6, organize:**
  - After the first open and a visit to every grid, favoriting 4 assets (character, object, UI piece, tileset), creating a folder, adding 2 assets, renaming it and deleting another folder: **0** API requests.
  - Then opening Favorites, the folder, Go to both, and the card menu: **0**.
  - Reload within the hour, then Favorites and the folder: **0**.
  - A character from page 2 favorited, then `ageSaved` (deep 8 days, checked 2 h) and reload: Favorites shows it; only the 7 first-page checks are sent.
  - A tileset favorited before its picture resolved: Favorites asks at most **1** costly request for it; after a reload, **0**.
  - → through a viewer opened from Favorites sends no list request, even at the last item.
- **T6, request order (R14):** with tileset helper answers delayed by a test route and 6 of them queued, scrolling to the end of Characters sends the next-page request before the remaining helpers (Activity order); totals unchanged.
- **Security:** a folder with a distinctive name and favorites: the name, raw ids and picture links never appear in `location.href`, `history.state`, the Activity panel or console output; new URLs hold only keys and 12-hex folder ids. After Forget key, `deviceStorage()` has no `org`, in this tab and a second tab.
- **Visual** (into `test-results/shots/`, both projects, dpr 1, 1.5 and 2.625):
  - Shots: `home-folders`, `favorites`, `favorites-empty`, `folder-open`, `folder-empty`, `folder-unavailable`, `folder-menu`, `card-menu`, `add-to-folder`, `folder-name` (duplicate error), `confirm-delete-folder`, `viewer-fav`.
  - The crispness check passes in Favorites and the overlay.
  - **Compare step:** each shot beside `mockups/full/base/shots/{01-home, g4-new-folder, g2-favorites, g2-favorites-empty, 09-folder-open, g4-folder-empty, g4-folder-unavailable, g4-folder-menu, 04-context-menu, g4-add-to-folder, g4-folder-name, g4-confirm-delete-folder, 06-detail}-{desktop,mobile}.png`. Allowed differences: the hidden controls (Download rows, Select item, Download all, hover ♡, filter field), sample art, R7's one cell per character group, and R12's empty-folder text. Any other difference in layout, spacing, type size, button style or copy is fixed before close-out.
  - **Headed check:** the same screens in a headed Edge at 1440×900 and 390×844 (mocked API): native scrollbars, missing blur, cut focus rings, sheets behind the dock. Findings are fixed before close-out.
- **a11y:** audit Favorites (full and empty), the overlay (full, empty, with the note), the card menu, Add to folder, the folder dialog and the confirm. Keyboard: Tab to a cell, Shift+F10, ↓, Enter on Favorite, Esc: focus back on the cell and the live region speaks. Phone targets ≥ 44 px: sheet rows, Done, ✕, the "…" pill, Remove them, Go to Library.

**Done when:** T6, security, visual and a11y pass with `--repeat-each=3 --workers=2` on both projects; the compare step and headed check find no unexplained differences; this plan's tasks are ticked.

**Owner checks (owner-run, not a builder Done-when):**
- Real iPhone and Android phone: long press opens the card menu (no system link preview), a short tap opens the viewer, sheets sit above the home indicator; Phase 3's search keyboard check (field, ✕, Cancel and the first panel row stay visible with the keyboard open).
- The live browser test with the owner's key through the dev-only `?devkey` sign-in: favorites and folders on real art, Forget key, reload.

### Task 11: Remove the temporary debug sign-in

**Group G** (after Task 10 and the live browser test). **Files owned:** `src/main.ts`, `src/env.d.ts`, `vite.config.ts`.

**Behaviour (R17).** By hand: drop the `?devkey` line and its `getKey`/`library` imports from `src/main.ts`; drop `__DEV_API_KEY__` from `src/env.d.ts`; drop `loadEnv` and the `__DEV_API_KEY__` define from `vite.config.ts` (back to a plain object config if nothing else needs `({ command, mode })`), keeping `cssMinify: false` and its comment. The git-ignored `.env` is never committed.

**Done when:** `npm run check`, `npm test`, `npm run build` and `npm run e2e -- --workers=2` pass, and `grep -r "DEV_API_KEY\|API_KEY_OVERRIDE\|devkey" src vite.config.ts` finds nothing.

## Risks

- **Account check (R4):** a false match after 100+ new characters deletes every folder and favorite; an account with 0 saved Characters keeps the previous account's folders. The owner accepts both for now; the mitigation is the later backup export.
- **iOS long press:** suppressing the link preview relies on `-webkit-touch-callout: none` and the 500 ms timer; only the owner's real-phone check proves it.
- **Shift+F10 in automation:** Chromium may not turn a synthetic Shift+F10 into `contextmenu`; the explicit `keydown` handler covers it.
- **Snapshot staleness (R2, R3):** a renamed or deleted deep asset can show its old snapshot until its family is saved again or scrolled to the end.
- **Large folders (R8):** no virtual rows in the overlay; fine for tens or a few hundred items.
- **Stale tab after an account switch (R4, challenge C7):** when another tab connects a different account (a kept key replaced, or two tab-only tabs), a tab still showing account 1 keeps its favorites and folders in memory until it is shown again (its visibility re-read then loads the wiped record). If the user favorites or files something in that visibly stale tab first, a fresh account-1 snapshot is saved into account 2's store. It needs a user action in a stale tab; the owner accepts it. The fix would be signing such tabs out on `key-changed`, which changes Phase 2's kept-tab behaviour.

## To-do list

- [x] Gate: Commit the Phase 3 live-test fixes and get check, unit and e2e green
- [x] Task 1: Build the org store with per-entry checks and atomic writes
- [x] Task 2: Add `#/fav` and `#/f/<id>` routes and `closeFolder`
- [x] Task 3: Send next pages ahead of costly pictures
- [x] Task 4: Teach the library `pick`, snapshot-aware `find` and org wiping
- [x] Task 5: Build the card menu and folder dialog components
- [x] Task 6: Ship the Favorites slice with `t13-favorites`
- [x] Task 7: Ship the Folders slice with `t13-folders`
- [x] Task 8: Ship the card menu slice with `t13-menu`
- [x] Task 9: Ship the search Go to rows and failed-family hint
- [x] Task 10: Prove 0 requests, security, screenshots, headed check and accessibility; tick the plan
- [ ] Task 10 (owner): Check long press and the search keyboard on a real iPhone and Android phone
- [ ] Task 10 (controller): Run the headed live browser test with the debug sign-in (`npm run dev`, `?devkey`) and fix what it finds
- [ ] Task 11: Remove the temporary debug sign-in (last, after the live browser test)
