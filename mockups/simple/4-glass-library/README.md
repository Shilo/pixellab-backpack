# Concept 4: Glass Library

Static storyboard for Vitrine (unofficial, view-only PixelLab gallery). Desktop dark mode, 1440×900 at 2×.

**Concept 4 = Concept 2's chrome + Concept 3's content.**

- **From Concept 2 "Home Screen":** the glass look and the floating UI. Content fills the window edge to edge. There is no top bar, sidebar or page chrome. Navigation, search and options float above the content as glass, in one dock at the bottom centre. Overlays (context menu, folder) blur the screen behind them.
- **From Concept 3 "Library Tiles":** the iOS App Library layout, at Concept 3's scale. The home shows six big category tiles with mosaic previews and counts (Characters, Objects, Images, Tilesets & tiles, Maps, UI), then Favorites and the folders as tiles of the same shape. Folders use the lighter frosted fill of an iOS folder, and types use a darker fill, so "mine" and "automatic" read differently.
- **The dock changes with context** instead of adding bars. On the home it holds Library, Search and "…". In a category it becomes a breadcrumb ("‹ Library | Objects 21") with Search, Select and "…". In selection mode it becomes the selection bar. In the viewer it becomes the viewer dock. One container, always in the same place.
- Download is the only accent colour, in the viewer and in the selection bar. The library screens have no accent.

## Layout and scale (1440×900)

- **Content fills the screen.** It starts 28 px from the top, runs to the bottom edge, and scrolls under the floating dock. Each grid has 160 px of bottom scroll padding so its last row can scroll clear of the dock. In every library screenshot the dock floats over tiles.
- **Home:** 3 tiles per row, each about 434×315 px, with 40 px side margins and 28 px gutters. Mosaic cells are about 205×146 px, so the art reads clearly. The two type rows fill the first screen, and the "Favorites and folders" header and the top of the folder row sit under the dock, which tells you the page scrolls.
- **Category grid:** 5 columns of square cells, about 259 px each, edge to edge with 32 px margins and 20 px gutters. A 32 px item draws at 11 device px per art px (5.5× in CSS px). The third row runs under the dock.
- **Viewer:** the stage fits the whole canvas to the whole window, because the controls float over the canvas's transparent margin. The 128 px Android Courier draws at 14 device px per art px (7× in CSS px), the largest integer scale that fits 900 px. It keeps 7× with the Info panel open.
- **Folder overlay:** a 1,160 px panel with 4 columns of about 252 px cells.
- **Menus and panels:** unchanged in size. They are text, not art.

## Storyboard

| # | Image | What the user pressed | What changed |
|---|---|---|---|
| 1 | `01-home.png` | Opened Vitrine | 6 big type tiles fill the screen. The "Favorites and folders" row (Favorites plus 5 folders) starts under the dock. Floating glass dock: **Library** (current, shown as the selected segment), **Search 75 assets** `/`, **…** |
| 2 | `02-search-focused.png` | Search pill (or `/`) | The pill expands into a focused field. Library and "…" collapse into one round Library button, and the library dims a little. A glass panel rises above the dock: Recent searches, Go to (types and folders as small tiles with counts), Recently added assets, and **Show all 75 assets**. Typing replaces the panel with results; types and folders still match as Go to rows |
| 3 | `03-category-open.png` | The Objects tile (on 01) | Full-screen grid of the 21 completed objects: square cells, integer-scaled art, quiet names, and states appended to look-alikes ("Treasure Chest · open"). The dock becomes **‹ Library** · "Objects 21" · Search · **Select** · **…**. The third row scrolls under the glass dock |
| 4 | `04-context-menu.png` | Right-click or long press on Crystal Oak Staff | The tile lifts and the rest of the screen (dock included) blurs. Glass menu: **Open · Favorite · Add to folder… · Download… (PNG) · Select** |
| 5 | `05-select-mode.png` | Select (in the menu or the dock), then 2 more cells | Selected cells get a white ring and a check, and the others show empty circles. The dock becomes the selection bar: **3 selected ▾ · Favorite · Add to folder · Download** (accent) **· ✕** |
| 6 | `06-detail.png` | ✕, then a click on Android Courier | Full-screen stage, Walk · East, mid-stride (frame 4 of 8), at 7× (the largest integer zoom that fits the window). Glass ✕ top left, a glass capsule top right (♡ ⓘ …), and the name "Android Courier · Character" at the top, which fades after about 2 s. The dock becomes the viewer dock: **Walk · East ▾** and **Download GIF ▾** |
| 7 | `07-detail-info.png` | ⓘ | A floating glass panel on the right with an Apple grouped list: name, type, size, directions, animations, frames, view and created; the prompt with **Copy**; In folders (rows that open each folder); and a quiet **Open in PixelLab ↗**. The art and the dock re-centre in the space left over |
| 8 | `08-download-menu.png` | The Download ▾ chevron | A glass menu above the button: **GIF** (Walk · East · 8 fps, the default, ✓), **Sprite sheet (ZIP)** (PNG + JSON), **All frames (ZIP)**, **PixelLab original (ZIP)**, then **Download options…** |
| 9 | `09-folder-open.png` | ✕ back to the home, scrolled to the folders, then the Hero party tile | An iOS-style folder overlay over the blurred library (large 4-column tiles): folder name with **…** (Download all, Rename, Delete folder), its 8 assets with names, the count, and a visible **✕** |
| 10 | `10-more-menu.png` | Dock **…** on the home | A glass menu above the dock: **Sort** (Newest, expands in place), **Grid size** S/M/L/XL, **Play previews** switch, **Download all 75…**, **Sync now** (Synced just now), **1 generating in PixelLab ↗**, **Keyboard shortcuts** `?`, **Settings…** |

The PNGs carry no captions; this table is the caption.

## Visible controls per image

Content tiles and cells, section labels, the breadcrumb title and the asset name are not counted.

| Image | Visible controls | Count | Budget |
|---|---|---|---|
| 01 home | Library, Search, … | **3** | ≤ 4 |
| 02 search | Library, search field (with Esc), plus the panel's items (Clear, 3 recents, 4 Go to, 6 assets, Show all) | **2** + panel | — |
| 03 category | ‹ Library, Search, Select, … | **4** | ≤ 4 |
| 04 context menu | 5 menu items; the rest is inert | **5 items** | — |
| 05 selection | 3 selected ▾, Favorite, Add to folder, Download, ✕ | **5** | (mode) |
| 06 detail | ✕, ♡, ⓘ, …, Download GIF ▾ (one split button), plus Walk · East ▾ (only for assets with more than one animation, direction or state) | **5 + 1** | ≤ 5 + 1 |
| 07 info | The same 6 (ⓘ shown as on), plus Copy, 2 folder rows and Open in PixelLab in the panel | **6 + 4** | — |
| 08 download menu | The same 6, plus 5 menu rows | **6 + 5** | — |
| 09 folder | Folder …, ✕ | **2** | — |
| 10 more menu | The 3 dock controls, plus 8 menu rows | **3 + 8** | — |

## Where every hidden function lives

Every hidden route below also has a labelled, visible path.

| Function | Visible path | Accelerators |
|---|---|---|
| Asset types | Home tiles | Search "Go to" rows |
| All assets (one grid) | Search panel **Show all 75 assets** | Enter in an empty search |
| Favorites: view | Home **Favorites** tile | Search "Go to" |
| Favorites: toggle | Viewer ♡; context menu; selection bar | `L`; hover ♡ on a cell |
| Folders: open | Home folder tiles → overlay | Info panel folder rows; search "Go to"; Back closes |
| Folders: new, add, remove | **Add to folder…** (viewer …, context menu, selection bar); its picker ends with New folder; uncheck to remove | — |
| Folders: rename, delete, download | Folder overlay **…** | — |
| Search | Dock search pill | `/` |
| Sort, grid size, play previews | Dock **…** (home and category) | `+` / `-` for size |
| Download all, sync, generating, shortcuts, settings / API key | Dock **…** | `?` for shortcuts |
| Multi-select | Dock **Select**; context menu **Select** | Hover circle; Ctrl/Cmd/Shift-click; `x`; Esc exits |
| Download: default format | Viewer **Download GIF** (the label names the format) | `D` |
| Download: other formats and options | Download chevron menu (08) | Context menu **Download…** |
| Multi-asset ZIP | Selection bar **Download** | — |
| Animation, direction, state | **Walk · East ▾** chip | `[` / `]` |
| Playback (play/pause, frame step, fps, loop), zoom, backdrop | Viewer **…** (inline rows, no submenus) | Click the art or Space; `,` / `.`; wheel or pinch |
| Metadata, prompt, Open in PixelLab | ⓘ panel | `I` |
| Previous / next asset | ✕, then the next cell | ← / →; swipe |

## Phone mapping

- **Dock:** the same floating glass pill, in the thumb zone with safe-area padding. On the home: Library · search icon · …. The search icon expands into a full-width field with Cancel, and the search panel becomes a full-height sheet above the keyboard.
- **Home:** 2 columns of square tiles (the real iOS App Library), with types first and then "Favorites and folders". The content scrolls under the floating dock, as on desktop.
- **Category:** 2–3 columns with names under the cells. The dock becomes ‹ · Objects · search icon · Select · … (the title truncates first).
- **Input:** tap opens. Long press opens the context menu (one meaning everywhere), and its **Select** item enters selection. The selection bar replaces the dock, with icons only plus "3 ▾".
- **Folder overlay:** near full screen, with ✕ and …; swiping down closes it.
- **Viewer:** ✕ top left and the ♡ ⓘ … capsule top right. The dock becomes a full-width **Download GIF ▾** with the Walk · East chip just above it. Info and the Download menu open as bottom sheets.

## Honest weaknesses

- **Every visit costs an extra click before any full-size art.** The home only shows mosaics (Concept 3's main weakness). Recently added helps only once Search is open.
- **Folders sit below the fold.** With big tiles, the first screen shows the six types, and Favorites and folders need a scroll. Search "Go to" and the ⓘ folder rows are the shortcuts.
- **All assets has one visible path, behind Search.** It is labelled ("Show all 75 assets"), but it is not on the home. Anyone who browses everything will reach for it every time.
- **The dock carries a lot.** It changes role five times (home, search, category, selection, viewer). That keeps chrome in one place, but users must notice that the same pill now means something else. The category breadcrumb, with 4 controls plus a title, is the dock's widest and busiest state.
- **Glass over art costs contrast.** The dock (62% tint) and the menus (80%) read well over the dark grid and over the bright rows that scroll under them in 01, 03, 05 and 10. Very bright, saturated art (the map, the green tilesets) directly under a glass edge still muddies the blur and shows colour fringes (see the folder panel in 09). A real build needs a contrast check per backdrop, or a stronger scrim when bright art sits under glass.
- **The six types are fixed.** A library with 3 characters and 900 images gets tiles of equal size. Empty types must hide, which changes the layout. At 20 or more folders, the "Favorites and folders" row needs to scroll or become an "All folders" tile.
- **Atlases and UI sheets crop into busy noise** next to single sprites, even in big mosaic cells (see the Images and UI tiles). The mosaics also need a picking rule (newest, favourites or most varied).
- **Content under the dock must stay legible.** At 5 columns a whole cell can sit under the dock or the selection bar (05). That is acceptable while scrolling, and the bottom padding lets the last row clear the dock.
- **Fit-to-window art crowds the floating controls.** At 7× the Courier's head nearly touches the fading title, and its feet sit just above the dock. Tighter canvases (trimmed sprites, tall map objects) could run under the controls. A real viewer should drop one integer step when the opaque art would meet a control.
- **Grid size and Sort sit in the home "…" menu,** where they apply only after you open a category. The home's own layout ignores them.
- **Breaks with 08:** review badges, progress rings and "Generating…" cells are hidden here, as 08 rules (the grid shows completed assets only). The counts reflect that (75 assets, Objects 21), and the 1 generating asset lives in the "…" menu.
- **Static images only.** They do not show the tile-to-grid zoom transition, the dock morphing, the search panel while typing, hover cues, scrolling, or the cost of rendering backdrop blur over a large grid.

## Files

- `index.html#<frame>` renders one storyboard frame (for example `index.html#04-context-menu`) from `../../shared/sample-data.js`.
- `style.css` holds the styles. `app.js` defines the frames.
- `art.js` and `bbox.js` are copied from Concept 3. They draw integer-scaled, nearest-neighbour art trimmed to its opaque bounding box.
- Images load from `../../shared/assets/`. Nothing loads from the network.
- Each PNG is a headless Chromium screenshot at 1440×900 with deviceScaleFactor 2.
