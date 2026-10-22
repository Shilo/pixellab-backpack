# Vitrine full mockups: shared base (GlassKit, option 2)

The base for the full feature mockup set of Vitrine, an unofficial view-only gallery for a user's PixelLab assets. Style: the owner's choice **option 2, f-glasskit** (S-21): GlassKit's own glass look, colours and shapes, and a thin `app.css` for layout, sizing, the dark base under the glass, the contrast-safe blue primary, the readable placeholder and the focus ring. No Material colours or shapes. Layout: Concept 4 "Glass Library" (S-18, 08 §12).

Every frame renders at two sizes: desktop 1440×900 and phone portrait 390×844.

## Frame registry

A frame is one static screen, picked by the URL hash: `index.html#<frame-id>`. No hash shows `01-home`. An unknown id shows "Unknown frame" and the renderer reports it as MISSING.

Each group owns one file and never edits another group's file:

| Files | Owner | Frame ids |
|---|---|---|
| `frames-base.js` | base | `01-home` … `10-more-menu` |
| `frames-g1.js`, `frames-g1.css` | G1 Connect, sync, settings, help and system states | `g1-…` |
| `frames-g2.js`, `frames-g2.css` | G2 Browse and find | `g2-…` |
| `frames-g3.js`, `frames-g3.css` | G3 Viewer per asset type and playback | `g3-…` |
| `frames-g4.js`, `frames-g4.css` | G4 Organize and download | `g4-…` |

`index.html` already lists every file (CSS after `app.css`); a file that doesn't exist yet is skipped. Register a frame with either form:

```js
// frames-g2.js
{ // a block keeps this file's helpers from colliding with other frame files
  const noResults = q => `<main class="grid">…No matches for "${q}"…</main>`;

  FRAMES['g2-search-no-results'] = () => add(noResults('slime'), dockHome);   // one root element per add() argument
  FRAMES['g2-favorites'] = () => {                                       // or build the page imperatively
    add(`<main class="grid">${D.favorites.map(id => cell(byId[id])).join('')}</main>`, dockHome);
  };
}
```

After the frame runs, the base fills every `[data-art]` element with integer-scaled pixel art and sets `<html data-ready="1">` once the images decode; the renderer waits for that.

Shared building blocks in `app.js` (all globals; read the source for the exact markup):

| Name | What it is |
|---|---|
| `D`, `byId`, `done`, `newest(list)`, `objects` | `../../shared/sample-data.js`, assets by id, completed assets only (the grid never shows others), newest first, the Objects grid |
| `I.<name>` | Stroke icons (`search`, `lib`, `back`, `chev`, `more`, `x`, `heart`, `info`, `down`, `folder`, `sync`, `gear`, …). Inside a `.glass-btn--primary` use the solid `I.downFill` / `I.caretFill` |
| `cell(asset, sel)` | Square asset cell with its quiet name; `sel` true/false adds the GlassKit checkbox |
| `tile([name, count, cells, folder])`, `T`, `M` | Library tile (type tiles `T`, favorites and folders `M`) |
| `dock(inner, cls)`, `item(inner, cls, attrs)`, `ico(svg)`, `lbl(text)`, `searchField(placeholder, key, focused)` | The floating GlassKit dock and its items; `dockHome`, `dockCat` are ready-made |
| `menu(groups, width)`, `row(title, trailing, cls, subtitle)`, `val(text)` | A GlassKit popover menu (returns an element; place it with `at(el, x, y)`) |
| `overlay(inner)` | GlassKit modal overlay (dim + blur) |
| `home()`, `category(selectedIds)`, `viewer(info)` | The library page, the Objects grid, the character viewer (Android Courier; write your own viewer variant in your group file for other types) |
| `add(...htmlOrElements)`, `h(html)` | Append to `<body>`; each argument must be ONE root element (a string with two roots drops the second) |
| `.vt-scrim`, `.vt-scrim.hi` | Add to every new floating glass root: the dark base (62% / 80%) that keeps text readable over art |
| `.vt-desk`, `.vt-phone` | Content for one form factor only (for example the phone's "Gestures" row instead of "Keyboard shortcuts") |

Rules for new frames:

- Use GlassKit classes and the blocks above. Put your CSS in your own `frames-g<n>.css`: desktop first, then the phone rules inside `@media (max-width: 600px)`. Prefix new classes `g<n>-`, and don't restyle shared classes; ask the base owner to change `app.css`.
- Use 02's microcopy word for word (02 §12) and 08's control budgets (home 3 controls, viewer 5 + 1).
- Check both renders of every frame you add.

## Phone layout (≤ 600 px)

Same controls, same GlassKit pieces, thumb-zone placement (08 §8, S-14). All rules live in section 5 of `app.css`.

| Surface | Phone |
|---|---|
| Library | Two tiles per row, 12 px side margins, square mosaics |
| Asset grid | Three columns, names under the cells |
| Dock | Full width, 12 px from the edges and above the bottom safe area; icon-only items (labels stay where the label is the control: Select, "3 selected", the animation chip); search pill fills the rest; `/` and `esc` hints hidden |
| Search | Panel full width above the dock, 2 Go to columns, 3 recent assets; the field gets a visible **Cancel** (F-13) |
| Menus (context, Download, library "…") | Bottom sheets with a grip, page dimmed behind; 50 px rows |
| Selection bar | "3 selected ▾" · ♡ · folder · **Download** · ✕ in one compact bar (Download drops its icon to fit) |
| Folder overlay | Full width, three columns, ✕ top right |
| Viewer | Full screen; ✕ top left, ♡ ⓘ … capsule top right, name under them, bottom dock with the animation chip and a stretched **Download GIF ▾** |
| Info | Bottom sheet with a grip (58% height, scrolls), replaces the side panel; the art moves into the top part and the dock hides |
| Touch | Every target ≥ 44 px (dock items 48, capsule 44, pills 46–48, rows 50) |
| Safe areas | `viewport-fit=cover`; top content, top controls, dock and sheets pad `env(safe-area-inset-*)` |

Desktop renders are pixel-identical to `../../simple/themes/f-glasskit/` (the phone rules sit only inside the media query).

## Render

The shared render script drives headless Edge with its own fresh profile (only its own processes are stopped afterwards) and writes two PNGs per frame into `<folder>/shots/`:

```sh
node render.js <folder> <port> [frame-id ...]
# example: node render.js mockups/full/base 9511 01-home g2-favorites
# no ids = every registered frame
```

- `<id>-desktop.png`: 1440×900 at 2×.
- `<id>-mobile.png`: 390×844 at 3×, mobile viewport with touch emulation.
- Dark colour scheme, focus emulation on (focused fields show their ring).
- Pick your own port so parallel renders don't collide (base: 9511). The script prints `ok`, `NOT READY` or `MISSING` per PNG plus any page errors, and exits 1 if a frame failed.
- The script is shared by the orchestrator, not checked in.

## Feature inventory

Every screen needed to show every feature in 08 §7 and 02 (§2 screens, §8 states, §12 copy). Existing frames keep their ids; the rest are to build.

### G1 Connect, sync, settings, help and system states

| Frame id | Shows | Source |
|---|---|---|
| `g1-connect` | Connect page: "Your PixelLab art, all in one place", value line, the 3 "Get your API key" steps, API key field (Show), Test key, full-access note, privacy line, disclaimer | 02 S1, §3.1, §12.1 |
| `g1-connect-testing` | Key pasted, button "Testing…", field read-only | 02 §8 |
| `g1-connect-invalid` | Inline error "That API key didn't work…" | 02 §12.2 |
| `g1-connect-welcome-back` | "Welcome back! Your API key was kept for one tab only…" | 02 §8 |
| `g1-connect-offline` | Offline error on Connect | 02 §12.2 |
| `g1-cors-blocked` | Full-width "PixelLab is blocking this browser" + Try again | 02 §8 |
| `g1-first-sync` | Skeleton tiles, streaming art, "Syncing… 340 of ~1,200" status | 02 §3.2, 08 §6.2 |
| `g1-keep-signed-in` | S24 banner "Keep me signed in on this device?" after the first sync | 02 §3.1 |
| `10-more-menu` | Library "…": Sort, Grid size, Play previews, Download all, Sync now, generating, Keyboard shortcuts (Gestures on phone), Settings | 08 §6.6 (exists) |
| `g1-sync-detail` | S18 per-type sync detail with Sync now and last synced | 02 S18 |
| `g1-partial-sync` | "Some assets didn't load" with per-type Retry | 02 §8 |
| `g1-rate-limited` | "PixelLab asked us to slow down. Continuing shortly…" | 02 §12.2 |
| `g1-generating` | S19 in-progress popover: per-type generating / review / failed, Open in PixelLab ↗ | 02 S19 |
| `g1-reconnect` | "Reconnect to PixelLab" dialog over the dimmed library, Get a new API key ↗ | 02 §8 |
| `g1-offline-cached` | Banner "You're offline. Showing your saved library.", "Offline · saved library" | 02 §8 |
| `g1-offline-empty` | Full state "You're offline" + Try again | 02 §12.3 |
| `g1-empty-library` | "Nothing here yet." (and the "Almost there." variant) | 02 §12.3 |
| `g1-images-unavailable` | Images opened while the gate is off: "Creator images aren't available yet" | 02 §8 R-4 |
| `g1-settings` | Settings: PixelLab connection (key ending, plan, Test, Keep me signed in, Forget key), Library, Appearance, Keyboard | 02 §3.12 |
| `g1-settings-data` | Settings: Folders & favorites backup, Storage, About (disclaimer, privacy, not-in-API note) | 02 §3.12, §12.4 |
| `g1-confirm-forget` | "Forget your API key?" confirm | 02 §12.4 |
| `g1-confirm-stop-signed-in` | "Stop keeping you signed in?" confirm | 02 §12.4 |
| `g1-help` | Help overlay: Keys tab (desktop), Gestures tab (phone), shortcuts-off banner | 02 S17, §9.5 |
| `g1-import-result` | Import result counts and orphans; invalid-file error | 02 S23 |
| `g1-backup-tip` | Backup tip with Download backup / Not now | 02 §12.3 |
| `g1-toast-storage` | Storage-full toast | 02 §12.2 |

### G2 Browse and find

| Frame id | Shows | Source |
|---|---|---|
| `01-home` | Library tiles (types, then favorites and folders), dock Library · Search · … | 08 §12 (exists) |
| `02-search-focused` | Search panel: Recent, Go to, Recently added, Show all | 08 §6.2 (exists) |
| `03-category-open` | Objects grid, dock ‹ · Objects 21 · Search · Select · … | 08 §12 (exists) |
| `g2-search-results` | Query "mage": Go to rows for matching types and folders, then results | 02 §11, 08 §6.2 |
| `g2-search-no-results` | "No matches for "slime"…" + idle sprite, Clear search, Search all types, not-in-API hint | 02 §8, §12.3 |
| `g2-all-assets` | Show all: every asset, "That's everything · 75 assets", not-in-API note at the end | 02 §8, F-8 |
| `g2-favorites` | Favorites grid with filled hearts | 08 §7 |
| `g2-favorites-empty` | "No favorites yet." | 02 §12.3 |
| `g2-category-tilesets` | Tilesets & tiles grid (sheets shown whole) | 02 §4 |
| `g2-category-ui` | UI grid (wide art, smooth downscale) | 02 §4 |
| `g2-sort` | Library "…" with Sort expanded in place (Newest, Oldest, Name A–Z / Z–A, Largest, Smallest) | 02 §11.3 |
| `g2-grid-size-xl` | Grid at XL (and S as a second state) | 02 §4.1 |
| `g2-hover` | Desktop pointer over a cell: selection circle, ♡ toggle, preview playing | 08 §6.2 |
| `g2-unknown-link` | Toast "That asset isn't in this library." | 02 §1.1 |

### G3 Viewer per asset type and playback

| Frame id | Shows | Source |
|---|---|---|
| `06-detail` | Character viewer: ✕, ♡ ⓘ …, name, Walk · East ▾, Download GIF ▾ | 08 §6.4 (exists) |
| `07-detail-info` | Info open (side panel on desktop, bottom sheet on phone) | 08 §6.9 (exists) |
| `g3-picker` | "Walk · East ▾" popover: animation list (Rotations first), state switcher, direction rose with missing directions disabled | 08 §6.4 |
| `g3-rotations` | Rotations selected (static pose per direction), "Download PNG" | 02 §7.1 B-12 |
| `g3-viewer-more` | Viewer "…": Playback (play, step, − 8 fps +, Reset, Loop), Zoom (− Fit · 3× +), Backdrop swatches, Add to folder…, Copy image, Open in PixelLab ↗, Fullscreen | 08 §6.5 |
| `g3-states` | Hooded Orb Mage "detailed robe" state | 02 §3.5 |
| `g3-object-animated` | Bear Trap "Snap shut", 1 direction | 02 §6.2 |
| `g3-object-still` | Inventory item, no chip, "Download PNG" | 02 §7.1 |
| `g3-image-animated` | Multi-frame Creator image, GIF default | 02 §5.3 |
| `g3-image-still` | Creator atlas, Info "Creator gallery", Reload from PixelLab in "…" | 02 §5.3, 08 §6.5 |
| `g3-tileset` | Top-down tileset with Grid on and tile info ("wang_13 · …") | 02 §5.4, §6.2 |
| `g3-tileset-side` | Sidescroller tileset | 02 §5.5 |
| `g3-tiles-pro` | Tiles Pro in √n columns, "Download Tiles (ZIP)" | 02 §5.7 |
| `g3-isometric` | Isometric tile | 02 §5.6 |
| `g3-map` | Map at Fit with pan/zoom, Info with placed objects | 02 §5.8 |
| `g3-ui` | UI asset, note "PixelLab doesn't share the individual UI pieces." | 02 §5.9 |
| `g3-info-technical` | Info with Technical details open (masked ID, Copy asset ID warning), More in PixelLab links with "May use PixelLab credits" | 08 §6.9, 02 §3.11 |
| `g3-zoomed` | Zoomed past Fit (1:1 / 4×), panned | 02 §6.3 |
| `g3-backdrop` | Checker backdrop | 02 §3.5 |
| `g3-loading` | "Loading frames 3/8" and "Couldn't load this asset's animations. [Try again]" | 02 §6.4 |
| `g3-offline-not-saved` | "This animation isn't saved on this device…" | 02 §6.4 |
| `g3-immersive` | Phone: chrome hidden after a stage tap | 08 §8 |

### G4 Organize and download

| Frame id | Shows | Source |
|---|---|---|
| `04-context-menu` | Context menu: Open, Favorite, Add to folder…, Download…, Select | 08 §6.8 (exists) |
| `05-select-mode` | Selection bar: 3 selected ▾, Favorite, Add to folder, Download, ✕ | 08 §6.11 (exists) |
| `08-download-menu` | Download menu: 4 formats + Download options… | 08 §6.10 (exists) |
| `09-folder-open` | Folder overlay with … and ✕ | 08 §6.7 (exists) |
| `g4-context-download` | Context menu replaced by that asset's Download list | 08 §6.8 |
| `g4-select-menu` | "3 selected ▾": Select all in view, Deselect all; "12 selected · 4 hidden by filter" | 08 §6.11 |
| `g4-add-to-folder` | Add to folder…: New folder row, folder checkboxes, Done (popover desktop, half sheet phone) | 02 S13 |
| `g4-add-to-folder-multi` | Tri-state checkboxes for a selection; filter field above 8 folders | 02 S13 |
| `g4-folder-name` | New folder / Rename dialog, with "You already have a folder with that name." | 02 S14 |
| `g4-folder-menu` | Folder "…": Download all 8…, Rename…, Delete folder… | 08 §6.7 |
| `g4-confirm-delete-folder` | "Delete "Hero party"?" confirm | 02 §12.4 |
| `g4-folder-empty` | "This folder is empty." + Go to Library | 02 §12.3 |
| `g4-folder-unavailable` | "1 item in this folder isn't in your PixelLab library anymore. [Remove them]" | 02 §12.3 |
| `g4-new-folder` | Where New folder… starts from the library (tile or menu row) | 08 §7 |
| `g4-download-options` | Single-asset dialog: format radios, Scope, Advanced (scale, GIF matte, file name) | 02 §7.6 |
| `g4-download-multi` | Multi-asset dialog: Sprite sheets / All frames / GIFs presets, counts, parts notice (selection, folder, Download all) | 02 §7.6 |
| `g4-download-progress` | Progress chip "Downloading 132 / 480 · 41 MB" + Cancel | 02 S10 |
| `g4-download-ready` | Phone ready sheet: Share or save…, Download file | 02 S11 |
| `g4-download-report` | Partial-failure report with Retry failed | 02 S12 |
| `g4-toasts` | Added to folder · Undo, Removed, Deleted, Added to Favorites, Download canceled, download busy | 02 §12.4, §12.2 |

## Files

- `index.html`: loads GlassKit, `app.css`, the shared data, `art.js`, `bbox.js`, `app.js`, then the frame files.
- `app.css`: 1 GlassKit tokens · 2 readability layer · 3 desktop layout · 4 what GlassKit lacks (split button, focus ring) · 5 phone layout. Details and measured contrast: `mockups/simple/themes/f-glasskit/README.md` (kept locally, not committed).
- `art.js`, `bbox.js`: integer-scale nearest-neighbour art from `../../shared/assets/`.
- `vendor/glasskit/`: GlassKit v1.27.0 (commit `c8558abb`), `glasskit.css` and `LICENSE` (MIT), byte-identical to f-glasskit's copy. Nothing loads from the network.
- `shots/`: renders.
