# 08 — Simplicity Redesign: "Just the Art" (PixelLab Backpack, formerly Vitrine)

> Note: `mockups/simple/` is kept only in the owner's local copy and is not committed, so its paths in this file are plain text, not links.

Working name **Vitrine**, *Unofficial gallery for your PixelLab assets*. Status: canonical layout, visual-structure and control spec, 2026-10-19. The decisions are rows S-1 to S-17 in `00-decision-log.md`, which also holds the precedence order.

**What this document owns:** the screens, the visible controls on each, where every hidden function lives, the menus, the folder overlay, the selection bar, and the phone mapping.

**What it does not own:** behaviour, data, flows, copy, download semantics and the keymap (`02-ux-spec.md`); modules, security and engines (`05-architecture.md`); scope (`01-product-brief.md`); the plan (`06-implementation-plan.md`). Token values, contrast and the visual accessibility invariants stay in `07-recommended-design.md` §5 and §7 until a retuned token spec replaces them (§10 #6).

## Contents

1. Why the redesign
2. What the research says
3. The three concepts
4. Control counts
5. Comparison
6. The recommendation
7. Where every function lives
8. Phone mapping
9. Contradictions resolved
10. Open questions
11. What this supersedes

---

## 1. Why the redesign

The owner reviewed every earlier mockup (options A, B and C, and the recommended "Quiet Studio, lifted" hybrid in `mockups/recommended/`) and rejected all of them as **too busy**:

- **Sidebars full of folders.** The hybrid's laptop shell listed Library, Folders, Favorites, every folder, New folder, sync status and Settings.
- **Top bars full of buttons.** Search, Sort, a grid-size slider, Play previews, ⋯ and Select sat above a row of 8 type chips and a result line.
- **Dense viewer controls.** The viewer had a two-row dock (transport, filmstrip, fps stepper, Loop, animation and state pickers, zoom, Backdrop), an inline compass, and an Info panel that was open by default with download tiles.

The owner asked for **iOS-like simplicity with progressive disclosure**, possibly like a home screen. Nothing in scope changes: every function in 01 and 02 stays reachable. What changes is how many controls are visible at once.

## 2. What the research says

Three new spikes (2026-10-19) studied products that stay simple without dropping features.

| Finding | Source |
|---|---|
| **iOS 26 Photos is the reference.** The Library grid shows a handful of floating controls (Select, view options, tabs, Search). The viewer has about 5 controls, and metadata opens from ⓘ. macOS Photos (a sidebar plus about ten toolbar items) is the density to avoid. | [research 10](../research/10-apple-simplicity-patterns.md) §2 |
| **Minimalism fails when actions have no visible signifier.** The iOS 18 Photos single-screen redesign drew backlash and was partly reverted. Apple's HIG says to "always make context menu items available in the main interface, too". | research 10 §1, §6 |
| **Direct default + menu for variants.** iCloud.com puts Download on a button and the variants behind More. Quick Look gives a full preview with few, secondary controls. | research 10 §3–4 |
| **Home screens look simple because the content is the interface.** The tiles are the navigation; the rest is one search affordance and a press away. Each hidden layer has a visible route. | [research 11](../research/11-home-screen-and-android-simplicity.md) summary |
| **One input, one meaning.** Long press means a context menu on iOS and select on Google Photos. Vitrine must choose one meaning and keep it everywhere. Modes swap chrome instead of stacking it: Google Drive's selection bar replaces the filter row. | research 11 §3, §6 |
| **The home-screen metaphor breaks in three places:** assets are not uniform like app icons, a gallery needs selection rather than rearranging, and desktop has a mouse and keyboard. A home screen also suits 30–80 items, not 1,000+. | research 11 §5 |
| **Budgets: library 4 controls plus the grid; detail 5 plus 1 conditional.** A title-as-scope-switcher ("All assets ▾") replaces the sidebar. The Download button names its format, and is the only accent element. | [research 12](../research/12-simplicity-first-products.md) R1–R2, R6 |
| **Hover is an accelerator, never the only path.** "…" menus become junk drawers past about 6 items. Two disclosure levels at most; nothing opens a menu inside a menu. | research 12 R7, R9, pitfalls 1–2 |

Where the spikes disagree: research 10 suggests an "All / Collections" segmented control, and research 11 recommends a home grid with a dock and folder tiles ("Concept A"). Research 12 recommends the title switcher. The concepts below test all three ideas, and the recommendation takes research 12's switcher as its base.

## 3. The three concepts

All three are static desktop renders, dark mode, 1440×900 at 2×, built on the shared 77-asset sample. Each folder's README lists its controls, where hidden functions live, its phone mapping and its own weaknesses.

### 3.1 Concept 1 · "Just the Art" (Photos / Unsplash model)

The first screen is only art in uniform square cells, with no captions at rest. The title "All assets ▾" is the navigation: it switches between All, Favorites, the 7 types and every folder. There is no sidebar and no bottom pill. An asset opens on a calm dark stage with five floating controls, plus a "Walk · East ▾" chip for animated assets. (README, local only: `mockups/simple/1-just-the-art/README.md`)

*Screenshot (local only): Concept 1: library grid, one cell in its hover state, `mockups/simple/1-just-the-art/01-home.png`.*

*Screenshot (local only): Concept 1: the "All assets" menu replaces the sidebar, `mockups/simple/1-just-the-art/04-scope-menu.png`.*

*Screenshot (local only): Concept 1: detail view, Android Courier walking east, `mockups/simple/1-just-the-art/02-detail.png`.*

*Screenshot (local only): Concept 1: detail view with the Info drawer open, `mockups/simple/1-just-the-art/03-detail-info.png`.*

### 3.2 Concept 2 · "Home Screen" (iOS / Android home screen)

Assets are icon tiles with a name underneath, on a wallpaper. Folders are 2×2 tiles at the start of the grid and open as an iOS-style overlay. A floating glass dock holds Search, a type menu "All ▾" and "…". Right-click and long press open the same context menu everywhere. (README, local only: `mockups/simple/2-home-screen/README.md`)

*Screenshot (local only): Concept 2: home screen with folder tiles and the dock, `mockups/simple/2-home-screen/01-home.png`.*

*Screenshot (local only): Concept 2: a folder open as an overlay, `mockups/simple/2-home-screen/04-folder-open.png`.*

*Screenshot (local only): Concept 2: the context menu on right-click or long press, `mockups/simple/2-home-screen/05-context-menu.png`.*

*Screenshot (local only): Concept 2: detail view, `mockups/simple/2-home-screen/02-detail.png`.*

*Screenshot (local only): Concept 2: detail view with the Info sheet, `mockups/simple/2-home-screen/03-detail-info.png`.*

### 3.3 Concept 3 · "Library Tiles" (iOS App Library / iCloud.com)

The first screen has no grid: six big category tiles with mosaic previews, then Favorites and folders as tiles of the same kind. Opening a tile shows a calm grid with 4 controls. The viewer matches Concept 1. (README, local only: `mockups/simple/3-library-tiles/README.md`)

*Screenshot (local only): Concept 3: library home of category tiles, `mockups/simple/3-library-tiles/01-home.png`.*

*Screenshot (local only): Concept 3: a category opened (All assets), `mockups/simple/3-library-tiles/02-category.png`.*

*Screenshot (local only): Concept 3: detail view, `mockups/simple/3-library-tiles/03-detail.png`.*

*Screenshot (local only): Concept 3: detail view with the Info panel, `mockups/simple/3-library-tiles/04-detail-info.png`.*

## 4. Control counts

"Controls" are persistent chrome visible at rest. Content tiles, text, the wordmark and hover or focus cues on the tile under the pointer are not counted.

| Screen | Earlier hybrid (approx., from 02 §1.2, §6.1 at 1440×900) | Concept 1 | Concept 2 | Concept 3 | **Recommended** |
|---|---|---|---|---|---|
| First screen | about 26 (sidebar 11 with 5 folders, top bar 6, chips 8, status 1) | **4** | **3** | **2** (home), 4 (category) | **4** |
| Detail | about 19 outside the Info panel (top bar 5, transport 7, row 2 6, compass 1); about 30 with Info docked, which was the desktop default | **5 + 1** | **5 + 1** | **5 + 1** | **5 + 1** |
| Folder | folder header 3 + library header | in the menu | **1** (folder "…") | header 4 | **2** (folder "…", ✕) |
| Context menu | 7 items | — | 5 items | — | **5 items** |

## 5. Comparison

| Criterion | Concept 1 · Just the Art | Concept 2 · Home Screen | Concept 3 · Library Tiles |
|---|---|---|---|
| **Simplicity** | Very high. Art plus 4 controls; the title holds all navigation | Very high. 3 controls, but labels, folder tiles and badges add visual weight | Highest on the home screen (2), but it adds a whole layer before any asset |
| **Discoverability** | Good. Everything is behind a labelled menu. Types take a menu each time. No captions make look-alikes ambiguous, and touch has no hover | Good. Labels name every tile; folders are visible tiles. Sort, size and previews are buried in "…" | Good for types (big labelled tiles); poor for All assets (hidden in "…" or an empty search) and for recent work |
| **Scale to 1,000+ assets** | Good. A dense uniform grid, search, and a scope menu that stays short with a filter field | Weak. A home screen suits 30–80 icons: ~25 screens of unsectioned tiles, and folder tiles push assets down | Good for the overview; weak inside a category (no filter but search) |
| **Phone fit** | Good. Same 4 controls; sheets for menus; Download in the thumb zone | Good. Familiar 4-column home screen with a bottom pill | Fair. 2-column tiles show little; an extra tap before art |
| **Functionality kept** | All, two levels deep at most | All; review badges and progress rings go beyond 02 (D20 shows completed assets only) | All; All assets is a level deeper than elsewhere |
| **Main weakness** | No names; folders have no overview | Scale; icon-size integer scaling makes some art tiny | The extra click; small libraries look padded |

Concept 1 is the strongest base. Concept 2 solves its two named weaknesses (look-alikes, touch without hover) and supplies the folder overlay and the context menu. Concept 3's tiles are a good overview but cost a click on every visit.

## 6. The recommendation

> **Update (owner choice, S-18):** the owner chose **Concept 4 "Glass Library"** (§12) as the layout. The rules in §6.1 and the function map in §7 still apply; where §6 describes Concept 1's switcher-and-grid first screen, §12 wins. The visual theme is being explored separately.

**Base: Concept 1 "Just the Art"**, the Photos / Unsplash model. **Borrowed from Concept 2:** a quiet one-line name under each tile, the right-click / long-press context menu, and folders that open as an iOS-style overlay. **Kept from Concept 3 only as a possible future** empty-search or overview screen, not v1 (S-17).

### 6.1 Hard rules

| Rule | Detail | ID |
|---|---|---|
| First screen ≤ 4 visible controls | Exactly the 4 in §6.2. Any addition needs a new decision-log row. The only pre-approved growth is a quiet type chip row, if real use shows frequent type switching (research 12 R1) | S-2 |
| Detail ≤ 5 + 1 conditional | Exactly the controls in §6.4 | S-2 |
| Every hidden action is also in a labelled menu | No hover-only, gesture-only or keyboard-only action. The context menu, hover cues, swipes and shortcuts duplicate visible paths; they never replace them | S-3 |
| Two levels, no submenus | Level 0 is the visible budget. Level 1 is a menu, a popover, the Info drawer, a sheet or the selection bar. Long choices inside a menu are inline rows or in-place expansions, never a nested menu. Items that don't apply are hidden, not disabled (UX-19) | S-3 |
| Modes swap chrome | Selection hides the 4 top controls and shows one floating bottom bar | S-13 |
| Menus hold the rarely used | Playback speed, frame step, zoom, backdrop and the extra download formats live in menus | S-10, S-11 |
| The name appears, then fades | The viewer shows the asset name briefly on open | S-9 |
| One accent | Only the screen's primary action is accent-coloured: Download in the viewer and in the selection bar. The library has no accent; its primary action is clicking the art | S-15 |

### 6.2 First screen (Library): 4 controls

| # | Control | Behaviour |
|---|---|---|
| 1 | **"All assets ▾"** (page title and scope switcher) | Opens the scope menu (§6.3). The title always names the current scope ("Characters", "Favorites"). |
| 2 | **Search** field with a `/` hint | 02 §11. `/` focuses it. It also matches type and folder names and shows them as "Go to Characters" / "Go to Hero party" rows. |
| 3 | **Select** | Enters selection mode (§6.8). |
| 4 | **"…"** (library menu) | §6.6. |

Below the controls is the grid only: uniform square cells (D7), art at integer scale (D8), and under each cell a **quiet one-line name** (S-5). The name uses 02 §4.5's caption rules: ellipsis, the full title in a tooltip and the accessible name, and the state appended to separate look-alikes ("Bear Trap · open"). A small filled heart marks favorites at rest. On a fine pointer, the cell under the pointer also shows a selection circle and a ♡ toggle (pointer conveniences, `tabindex="-1"`, UX-14) and plays its preview (E-14). The type glyph, count badges and "fit" marker from 02 §4.5 move to the Info drawer.

Status text, not controls: during the first sync a quiet line under the title reads "Syncing… 340 of ~1,200", and offline it reads "Offline · saved library" (E-16). In All with no search, the not-in-the-public-API note still ends the results (F-8).

### 6.3 Scope menu ("All assets ▾")

| Group | Rows |
|---|---|
| Top | **All assets** ✓ · **Favorites** (count) |
| Types | Characters · Objects · Images (subtitle "Creator gallery", F-7) · Tilesets · Tiles · Maps · UI. Each row has a count and a tiny thumbnail of its own art. Types with no completed assets are hidden after a complete sync (F-8) |
| Folders | Every folder A–Z (UX-10), with a count and a tiny cover thumbnail (its newest item). Above 8 folders, a filter field heads the group (the S13 rule). **New folder…** ends the group |

Choosing All, Favorites or a type re-scopes the grid. Choosing a folder opens the folder overlay (§6.7). On phones the menu is a medium-height bottom sheet. This menu replaces the sidebar, the rail, the bottom pill, the Folders page and the chip row (S-4).

### 6.4 Detail screen (viewer): 5 controls + 1 conditional

The viewer stays a full-window modal over its parent grid (D12, UX-5), opening at the largest integer zoom that fits and autoplaying at the effective fps (02 §3.5).

| # | Control | Behaviour |
|---|---|---|
| 1 | **✕ Close** (top left) | Esc and Back also close (02 §1.1). |
| 2 | **♡ Favorite** | `L` (02 §9.3). |
| 3 | **ⓘ Info** | Toggles the Info drawer (§6.9). Shows a filled "on" state while open. `I`. |
| 4 | **"…" More** | The viewer menu (§6.5). |
| 5 | **"Download GIF ▾"** (split button; the only accent element) | The label part downloads the default and names it (E-13): "Download GIF", "Download PNG", and in Phase 1 "Download ZIP" or "Download sprite sheet" (B-11, B-20); "PNG (this direction)" leads while Rotations shows (B-12). The chevron opens the Download menu (§6.10). `D`. |
| +1 | **"Walk · East ▾"** chip (bottom centre), only for assets with more than one animation, direction or state | Opens one popover: the animation list (Rotations first, then "Walk · 8f"…), the state switcher (characters, and objects with R-7 grouping), and a 4- or 8-way direction rose whose centre names the direction (UX-9). Missing directions are disabled (02 §6.1). |

**Name on open (S-9):** the asset name (title + state) appears at the top centre for about 2 s, then fades (no fade under reduced motion). It reappears on previous/next. The name is always available in the Info drawer, the page title and the dialog's accessible name.

**Stage input** (02 unchanged): click the art or press Space to play/pause; `,` / `.` step a frame while paused; ←/→ or a swipe go to the previous or next asset (UX-25); on a fine pointer, edge arrows appear while the pointer moves over the stage. These are accelerators: the visible path to another asset is ✕ and the next tile. Tapping the stage toggles chrome on coarse pointers (B-9). Wheel, pinch and double-click zoom (02 §6.3).

### 6.5 Viewer "…" menu

| Group | Rows (shown only where they apply) |
|---|---|
| View (inline rows, no submenus) | **Playback** (animated assets): Play/Pause · Step back · Step forward · "− 8 fps +" with Reset · Loop. The fps range, per-animation override and the 8 fps default are 02 §3.5's (R-1). **Zoom:** − · "Fit · 3×" (toggles Fit ↔ 1:1, `Z`) · +. **Backdrop:** one row of the 5 F-4 swatches (Theme, Checker, Light gray, Mid gray, Black) |
| Actions | **Add to folder…** (S13) · **Copy image** · **Open in PixelLab ↗** · **Fullscreen** (where supported, `F`) · **Grid** (tilesets, Tiles Pro; B-10's toggle) or **Reload from PixelLab** (images, maps; UX-16) |

There are at most 5 action items: Grid and Reload never apply to the same type. Copy prompt lives in the Info drawer. Keyboard shortcuts live in the library "…" and on `?`. There is no Copy link item (R-9).

### 6.6 Library "…" menu

| Group | Rows |
|---|---|
| View | **Sort:** shows the current sort and expands in place to 02 §11.3's list · **Grid size:** inline S / M / L / XL (`+` / `-`) · **Play previews** switch (F-7, F-9) |
| Library | **Download all {n}…** (B-13) · **Sync now**, with "Synced just now" as its subtitle (opens S18 detail) · **{n} generating ↗** (S19; B-19), hidden at zero |
| App | **Keyboard shortcuts** (`?`; gestures on coarse pointers) · **Settings…** (S16: PixelLab API key, theme, storage, backup, About) |

This is the fullest menu in the product (three groups, up to eight rows); §10 #7 tracks it.

### 6.7 Folder overlay

A folder chosen from the scope menu or the Info drawer opens over the dimmed, blurred grid (Concept 2's `04-folder-open.png`). The overlay shows the folder name, a **"…"** (Download all {n}… · Rename… · Delete folder…) and a visible **✕ Close**. Esc, a click outside and Back also close it. The route stays `#/folder/<folderId>` (02 §1.1), so Back works. The tiles inside are the same tiles as the grid, with names, and they open the viewer, which returns to the overlay. The overlay scrolls inside itself, and on phones it grows to near full screen. Folder rules (A–Z, unique names, deleting never deletes assets, Undo) are unchanged (F-12, 02 §3.8). Removing an asset from a folder means unchecking it in **Add to folder…** (S13), from the viewer, the context menu or the selection bar.

### 6.8 Context menu

Right-click, long press (500 ms, 10 px slop; 02 §9.4), Shift+F10 or the ContextMenu key open the same menu on every grid and in the overlay (S-6):

**Open · Favorite** (or Unfavorite) **· Add to folder… · Download… · Select**

Every item duplicates a visible path. "Download…" replaces the menu with that asset's Download menu (§6.10); it is not a nested submenu. "Select" enters selection mode with this asset selected. A long press therefore means "menu" everywhere; it no longer selects directly.

### 6.9 Info drawer

ⓘ opens a right drawer when the window is landscape and at least 840 px wide, otherwise a bottom sheet with a grabber (E-4). It is closed by default at every size; after the user opens it, the choice persists. The content is an Apple-style grouped list:

1. **Header:** name, type (and "Creator gallery" for Images).
2. **Facts group:** 02 §5's fields for the type (size, directions, animations, frames, view, created…), including the badge facts that left the grid.
3. **Prompt** with **Copy**.
4. **Folders:** one row per folder that holds the asset; each opens the folder overlay.
5. **Technical details**, an in-place disclosure: masked asset ID with Copy asset ID and its warning (UX-17, R-9), source, status, last synced.
6. **Footer:** a quiet **Open in PixelLab ↗** link and, for types with tool links, **More in PixelLab** links, each tool marked "May use PixelLab credits". Labels, routes and link rules are 02 §3.11's (F-11).

The drawer has no download tiles: Download lives in one place (S-11).

### 6.10 Downloads

| Surface | What it offers |
|---|---|
| Viewer **Download** split button | Label = the default output (§6.4). Chevron = the asset's ≤ 4 formats from 02 §7.1, each with its one-line description, then a separated **Download options…** row that opens the S9 dialog (scope, scale, GIF matte, file name, PNG of the current frame, the character's PixelLab sprite sheet). |
| Context menu **Download…** | The same list as the chevron. |
| Selection bar **Download** | The S9 multi-asset dialog: 3 presets (Sprite sheets · All frames · GIFs) and collapsed Advanced, giving one ZIP, or parts on the Blob path (F-5, B-6, E-2). |
| Library "…" **Download all {n}…** · folder "…" **Download all {n}…** | The same multi-asset dialog for exactly what is visible (B-13). |

Formats, ZIP layout, naming, progress, cancel and partial-failure handling are unchanged (02 §7).

### 6.11 Selection mode

Entry: **Select**, the context menu's **Select**, the hover selection circle, Ctrl/Cmd-click, Shift-click, or `x` (02 §3.9). The 4 top controls are replaced by one floating bottom bar, at every size (S-13):

**"3 selected ▾" · Download · Add to folder · Favorite · ✕**

Download is the accent. "3 selected ▾" opens Select all in view (Ctrl/Cmd+A) and Deselect all, and reads "12 selected · 4 hidden by filter" when a filter hides some. Favorite reads Unfavorite when every selected asset is a favorite. ✕, Esc or Back exit. The selection survives scope and search changes and stays after an action (UX-11). There is no selection-summary panel.

## 7. Where every function lives

"Visible path" is the labelled route; accelerators duplicate it.

| Function | Visible path | Accelerators |
|---|---|---|
| Asset types | "All assets ▾" → Types | Search "Go to Characters" |
| Folders: open | "All assets ▾" → Folders → overlay | Info drawer folder rows; search "Go to folder"; Back closes |
| Folders: new | "All assets ▾" → New folder…; "New folder" row in Add to folder… | — |
| Folders: add / remove asset | Viewer "…" → Add to folder…; context menu; selection bar (uncheck to remove) | — |
| Folders: rename, delete, download | Folder overlay "…" | — |
| Favorites: toggle | Viewer ♡; context menu Favorite; selection bar Favorite | Hover ♡ on a tile; `L` |
| Favorites: view | "All assets ▾" → Favorites | — |
| Search | Search field | `/` |
| Sort | Library "…" → Sort | — |
| Grid size | Library "…" → Grid size | `+` / `-` in the grid |
| Play previews | Library "…" → Play previews (also in Settings) | Hover plays one preview (E-14) |
| Settings, PixelLab API key, theme, storage, backup | Library "…" → Settings… | — |
| Sync status, Sync now | Library "…" → Sync now (subtitle shows status) | First-sync and offline text under the title |
| Generating / review / failed counts | Library "…" → {n} generating ↗ | — |
| Multi-select | Select button; context menu Select | Hover circle; Ctrl/Cmd/Shift-click; `x`; Ctrl/Cmd+A |
| Download: default single format | Viewer Download button label | `D` |
| Download: other single formats (GIF, Sprite sheet (ZIP), All frames (ZIP), PixelLab original (ZIP), PNG, Sheet + metadata (ZIP), Tiles (ZIP), Sheet + JSON (ZIP)) | Viewer Download chevron (only the formats the type supports, 02 §7.1) | Context menu Download… |
| Download options (scope Everything, N× scale, GIF matte, file name, current-frame PNG, character PixelLab sprite sheet) | Download chevron → Download options… | — |
| Multi-asset ZIP | Selection bar Download | — |
| Download all visible / whole account | Library "…" → Download all {n}… (in All with no search = everything) | — |
| Folder ZIP | Folder overlay "…" → Download all {n}… | — |
| Folders and favorites backup | Settings → Folders & favorites | — |
| Playback: play / pause | Viewer "…" → Playback | Click the art; Space |
| Playback: frame step | Viewer "…" → Playback | `,` / `.`; Home / End |
| Playback: speed (fps), Loop | Viewer "…" → Playback | — |
| Animation, direction, state | "Walk · East ▾" chip | `[` / `]` turn direction |
| Zoom | Viewer "…" → Zoom | Wheel, pinch, double-click; `+` / `-`; `Z` |
| Backdrop | Viewer "…" → Backdrop (5 swatches); default in Settings | — |
| Grid overlay (tilesets, Tiles Pro) | Viewer "…" → Grid | — |
| Fullscreen | Viewer "…" → Fullscreen | `F` |
| Previous / next asset | ✕, then the next tile | ← / →; swipe; edge arrows on pointer movement |
| Open in PixelLab, tool links | Info drawer footer; viewer "…" → Open in PixelLab ↗ | — |
| Copy image | Viewer "…" → Copy image | — |
| Metadata, prompt, technical details | ⓘ → Info drawer | `I`; swipe up on phones |
| Keyboard shortcuts | Library "…" → Keyboard shortcuts | `?` |
| Not in the public API note | End of All results; Settings → About | — |

## 8. Phone mapping

The budgets and menus are the same on phones; only placement changes (S-14).

| Surface | Phone portrait | Phone landscape / compact height |
|---|---|---|
| Library top | Title switcher top left; a search icon that expands into a field with a visible Cancel (an active query keeps the field open); Select and "…" top right | Same, in one slim row |
| Grid | 3 columns at M (UX-13), names under tiles, no hover cues | 6 columns at M |
| Scope menu, "…" menus, Add to folder…, Download menu | Medium-height bottom sheets | Same |
| Context menu | Long press, anchored to the tile, with the rest of the screen dimmed | Same |
| Folder overlay | Near full screen, with ✕ and "…"; Back closes | Same |
| Selection | The bottom bar replaces the top controls; safe-area padded | Same |
| Viewer | ✕ top left; ♡, ⓘ, "…" top right; full-width **Download GIF ▾** at the bottom in the thumb zone; the chip just above it | Immersive stage; controls fade after 3 s of no input while playing; tap restores (02 §1.2) |
| Info | Bottom sheet with a grabber (medium, then large) | Right overlay sheet (E-4) |
| Gestures | Tap opens · long press = context menu · swipe ←/→ = previous/next asset only (never direction) · swipe ↓ closes the viewer · swipe ↑ shows Info · tap the stage toggles chrome (B-9) | Same |

Tablets use the desktop layout with touch input rules. Touch targets stay at least 44 px, and safe areas, 200% text and focus rules from F-13 still apply.

## 9. Contradictions resolved

| Conflict | Ruling | Why |
|---|---|---|
| Concept 1's keys (F favorite, `[` `]` previous/next, ↑/↓ direction, Ctrl/⌘ +/- grid size) differ from 02 §9.3 | 02 §9.3 stands (S-16): `L` favorite, ←/→ previous/next, `[` `]` direction, `,` `.` step, `+` `-` size and zoom, `F` fullscreen | Behaviour is 02's; browser keys are never taken (02 §9.3) |
| Concept 1 lists **Copy link** in the detail "…" | Not adopted | No copy-link feature: asset ids are permanent download keys (R-9, D13) |
| Concept 1: long press enters Select. The brief: long press opens the context menu | Context menu, with Select as its last item (S-6) | One meaning per input, matching iOS (research 11 §6) |
| Concept 1: speed as 0.5× / 1× / 2× | The fps stepper (1–30, Reset, per-animation override) moves into the viewer "…" | GIFs state the fps they use (F-5); PixelLab sends no timing (R-1) |
| Concept 1: 3 backdrops | F-4's 5 swatches, as one inline row | Keeps judging contrast; E-5, E-6 and forced-colors rules stand |
| Concept 1: a folder "…" beside the title | The "…" lives in the folder overlay | Keeps the first screen at 4 controls |
| Concept 1: no names at rest | A quiet name under each tile (S-5) | Look-alikes, and touch has no hover (Concept 1's own weaknesses) |
| 02 §3.6: Info open by default on desktop; F-5: download tiles in Info | Info closed by default; no tiles; Download options… moves to the Download menu (S-11, S-12) | One place for Download; the art gets the screen |
| F-6: summary panel at ≥ 1200 px with ≥ 2 selected | One bottom bar at every size (S-13) | One container; the brief's hard rule |
| Concepts 2 and 3 show review badges, progress rings and "Generating…" tiles | Not adopted; counts stay in S19 via the library "…" | The grid shows completed assets only (D20) |
| Download menu labels in the concepts ("PixelLab original", "Sprite sheet") | 02 §7.1 labels: "PixelLab original (ZIP)", "Sprite sheet (ZIP)" | Multiple files always say "(ZIP)" (F-5) |

## 10. Open questions

| # | Question | Default until decided |
|---|---|---|
| 1 | Should names under tiles be switchable ("Show names" in the library "…")? | Always on; no toggle (YAGNI) |
| 2 | A folder with hundreds of items in an overlay: does it still feel like an overlay at full window? | Overlay at every size; revisit after a real library |
| 3 | If people switch types often, the switcher costs a menu each time. Promote a quiet chip row? | No; the chip row is the only pre-approved growth (§6.1) |
| 4 | Sync and generating status now live only in the library "…" (plus first-sync and offline text). Is that visible enough? | As specified |
| 5 | Long press now opens the menu, so starting a selection on touch takes one more tap (long press → Select) | As specified |
| 6 | The concepts are dark only. Retune 07 §5 tokens (surfaces, scrim over bright art, chrome contrast) for the floating, low-chrome look, and render light mode | 07 §5 values, light and dark following the system (F-3) |
| 7 | The library "…" (three groups, up to eight rows) is at the junk-drawer limit (research 12 pitfall 2) | As specified; move Sort and Grid size to a "View" sheet only if testing shows strain |
| 8 | Translucent controls over bright, busy art (maps, UI sheets) need a stronger scrim than shown | Phase 1 visual check |
| 9 | Content-cropped thumbnails hide relative size (a 16×48 staircase looks as big as a 192 px building) | The size row in Info; revisit with a real library |
| 10 | Statics only: no interactive mockup or phone render of this design, and no render of selection, the Download menu, sync or empty states. 03's checklist covers the earlier mockup | Build an interactive mockup of 08 and a matching checklist before Phase 1 shell work (06 task 1.10) |
| 11 | Concept 3's library tiles as an empty-search or overview screen | Not v1 (S-17) |

## 11. What this supersedes

| Earlier doc | Superseded | Still stands |
|---|---|---|
| **07** recommended design | §1 hybrid composition, §2 layout per form factor, §3 wireframes, §4 components (shell, library header, card, viewer, Info panel, selection, folders), §6 motion where it animates removed controls, §8 #5–#6 and #9 (questions about removed controls) | §5 tokens (values), §7 accessibility invariants, §8 #1–#4 and #7, and the crispness rules, until the token retune (§10 #6) |
| **02** UX spec | §1.2 shell table, §1.3 library header, S3 Folders page, S5 folder page header, S6/S7 layout, S20 item list, S25 summary panel, S26 View sheet, §3.5 #3–#8 placement (dock, filmstrip, inline compass, fps stepper, zoom row, Backdrop button), §3.6 #1–#2 (Info default and peek), §3.9 container, §4.5 bottom chips and card buttons, §6.1 zones, §9.4 long-press meaning | Routes, sync, search, sort rules, Info fields (§5), playback behaviour and defaults, download semantics (§7), states (§8), keymap (§9.3), accessibility (§10), microcopy (§12) |
| **00** decision log | Rows marked "superseded by S-x" | Every other row |
| **03** mockup requirements | Its layout checks describe `mockups/recommended/` | Its behaviour and accessibility checks; a new checklist is §10 #10 |
| **05** architecture | §2.3 "Shell layout" row now reads this document | Everything else: data model, API layer, view-only guard, sync, rendering, downloads, security, tests, deploy |
| **06** implementation plan | Tasks 1.10 (shell), 1.11 (long-press meaning) and 1.12 (chip row, header) now read this document | Phases, Phase 0 checks, tasks, acceptance, owner decisions |
| **01** product brief | Principle 4's container examples (pill, rail, sidebar) | Scope, goals, non-goals, success criteria |
| Mockups | `mockups/recommended/` and options A, B and C become earlier explorations | `mockups/shared/` data and assets |

All data, security, privacy, view-only and export decisions (D1–D31, R-1 to R-10, B-1 to B-20, AR-1 to AR-7) still stand, except B-5 (precedence, now S-1) and B-10 (Grid placement, now S-10); B-19's wording stands and its chip moves into the library "…" (S-8).

## 12. Concept 4: Glass Library (added after owner feedback)

The owner asked for a mix of Concept 2 and Concept 3: Concept 2's glass theming and floating UI (all content full screen, navigation in a floating bottom dock) with Concept 3's App Library layout for the content. It is a candidate alongside the recommendation in §6; the owner decides. (README and storyboard, local only: `mockups/simple/4-glass-library/README.md`)

- **Home:** six category tiles with mosaic previews and counts, then Favorites and folders as tiles. One floating glass dock: Library, Search, "…" (3 controls).
- **Navigation:** the dock changes role by context: search panel, category breadcrumb (‹ Library · Objects, Search, Select, "…"), selection bar, viewer dock.
- **Detail:** same 5 + 1 controls as §6, all floating glass.
- **Trade-offs:** one extra click before full-size art (as in Concept 3); "All assets" is reached through the search panel; glass over bright art needs a stronger scrim in a real build.

| Step | What the user did | Image |
|---|---|---|
| 1 | Opens the app | *Screenshot (local only): , `mockups/simple/4-glass-library/01-home.png`.* |
| 2 | Presses Search or `/` | *Screenshot (local only): , `mockups/simple/4-glass-library/02-search-focused.png`.* |
| 3 | Clicks the Objects tile | *Screenshot (local only): , `mockups/simple/4-glass-library/03-category-open.png`.* |
| 4 | Right-clicks an asset | *Screenshot (local only): , `mockups/simple/4-glass-library/04-context-menu.png`.* |
| 5 | Presses Select, picks 3 assets | *Screenshot (local only): , `mockups/simple/4-glass-library/05-select-mode.png`.* |
| 6 | Opens a character | *Screenshot (local only): , `mockups/simple/4-glass-library/06-detail.png`.* |
| 7 | Presses ⓘ | *Screenshot (local only): , `mockups/simple/4-glass-library/07-detail-info.png`.* |
| 8 | Opens the Download menu | *Screenshot (local only): , `mockups/simple/4-glass-library/08-download-menu.png`.* |
| 9 | Opens a folder from home | *Screenshot (local only): , `mockups/simple/4-glass-library/09-folder-open.png`.* |
| 10 | Presses the dock "…" | *Screenshot (local only): , `mockups/simple/4-glass-library/10-more-menu.png`.* |

## 13. Inspiration links

| Inspiration | Used in | Link |
|---|---|---|
| iOS 26 Photos (Library and Collections, viewer) | Concepts 1, all detail views | [MacRumors: iOS 26 Photos app](https://www.macrumors.com/guide/ios-26-photos-app/) · [9to5Mac: everything new in Photos for iOS 26](https://9to5mac.com/2025/10/23/heres-everything-new-for-apple-photos-in-ios-26/) · [Apple: browse your photo library](https://support.apple.com/guide/iphone/browse-your-photo-library-iph7d24753a5/ios) · [Apple: browse your photo collections](https://support.apple.com/guide/iphone/browse-your-photo-collections-iph4f36c4148/ios) |
| iOS home screen, folders, Liquid Glass | Concepts 2, 4 | [Apple Newsroom: iOS 26 (Liquid Glass home screen)](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/) · [Apple: organize apps in folders](https://support.apple.com/guide/iphone/organize-your-apps-in-folders-iph822ece7dd/ios) · [Apple Newsroom: Liquid Glass design](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) |
| iOS App Library | Concepts 3, 4 | [Apple: find and use your apps in App Library](https://support.apple.com/guide/iphone/find-your-apps-in-app-library-iph87abad19a/ios) |
| iCloud.com tile homepage | Concepts 3, 4 | [Apple: customize and use the homepage tiles on iCloud.com](https://support.apple.com/guide/icloud/customize-and-use-the-homepage-tiles-mm048a5aa9cc/icloud) · [9to5Mac: redesigned iCloud web interface](https://9to5mac.com/2022/11/16/icloud-web-interface-redesign-beta/) |
| Unsplash photo page | Concept 1 download button | [unsplash.com](https://unsplash.com/) |

## 14. Theme options for Concept 4

The owner chose Concept 4's layout (S-18) and asked for themes beyond iOS glass. Research: [14-floating-ui-themes.md](../research/14-floating-ui-themes.md). Each theme keeps the layout, sizes, content and control counts identical; only the visual theme changes. Every theme uses solid floating surfaces (no blur), so text contrast no longer depends on the art underneath. Fonts in the renders fall back to system fonts (Segoe UI Variable, Cascadia Mono); each README names the intended font.

| Theme | Inspiration | Look | Folder |
|---|---|---|---|
| Glass (baseline) | Apple Liquid Glass | Dark translucent glass dock and panels | 4-glass-library (local only: `mockups/simple/4-glass-library/README.md`) |
| A · Tonal Dock | Material 3 Expressive | Opaque tonal greys, pill dock, pastel Download button, vibrant blue selection bar | a-tonal-dock (local only: `mockups/simple/themes/a-tonal-dock/README.md`) |
| B · Mica Command | Fluent 2 / Windows 11 | Tight 8 px cards, command-bar dock, split Download button, Settings-style info cards | b-mica-command (local only: `mockups/simple/themes/b-mica-command/README.md`) |
| C · Quiet Graphite | Linear / Raycast | Flat warm greys, hairlines, no colour; light inverted Download; shortcut hints | c-quiet-graphite (local only: `mockups/simple/themes/c-quiet-graphite/README.md`) |
| D · Nothing Mono | Nothing OS | Black, white outlines, dot-matrix numerals, single red Download | d-nothing-mono (local only: `mockups/simple/themes/d-nothing-mono/README.md`) |
| E · Pixel Bezel | Retro-modern hardware keys | Chamfered keys, hard shadows, pixel numerals, mint Download, marching-ants selection | e-pixel-bezel (local only: `mockups/simple/themes/e-pixel-bezel/README.md`) |

Note from research 14: the glass baseline's white-on-blue Download label is 3.65:1, below the 4.5:1 text minimum; any final theme must fix it.

## 15. GlassKit review and theme recommendation

**GlassKit** ([review](../research/15-glasskit-review.md), mockup (local only: `mockups/simple/themes/f-glasskit/README.md`)): MIT, v1.27.0, no dependencies. Verdict: **reference only, don't ship.**

- **Size:** about 13 KB gzip minified, though the README claims 6.5 KB, and roughly two-thirds of it is components Vitrine doesn't use.
- **Accessibility:** focus rings are removed or below 3:1, the default placeholder and muted text are below 4.5:1, and there is no forced-colors or reduced-transparency support.
- **Readability over pixel art:** its 8–22% white glass fails contrast; the mockup only passes because Vitrine's own dark base sits under the glass.
- **Blur cost:** up to 22 blur layers on one screen.
- **Missing pieces:** no split button, side panel, or popover positioning, focus handling or keyboard support.
- **Bus factor:** one maintainer, five releases in five days.

**Recommendation (orchestrator; owner decides): "Glass, built like Material".** Keep the iOS glass *look* the owner likes for every floating surface, built with Material 3 Expressive's *rules*:

| Take from glass (Concept 4 / GlassKit as reference) | Take from Material 3 Expressive (theme A) |
|---|---|
| Translucent, blurred dock, capsules, menus and info panel | A solid dark base under every glass surface (≥ 70% tint) so text contrast never depends on the art underneath |
| Soft white hairline and highlight, pill shapes | Standard dock for browsing, **vibrant** (accent-filled) bar for selection mode |
| Floating detail controls over full-screen art | One high-contrast primary action (Download), at least 4.5:1, plus visible focus rings of at least 3:1 |
| Blur only on the few floating surfaces (dock, open menu, panel), never per tile | Spring motion and shape change on press and on dock role switches |

Rendered: g-glass-material (local only: `mockups/simple/themes/g-glass-material/README.md`).

Implementation: write Vitrine's own small glass layer (about 150 lines of CSS custom properties, using GlassKit's tokens as a reference) instead of vendoring GlassKit. It keeps the look, stays light, and avoids GlassKit's accessibility gaps. If the owner still prefers vendoring, the fallback is the f-glasskit setup: v1.27.0 pinned and unmodified, its LICENSE next to it, plus a Vitrine override file, never loaded from a CDN.
