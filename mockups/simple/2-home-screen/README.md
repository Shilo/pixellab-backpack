# Concept 2: Home Screen

Static mockups for Vitrine (unofficial, view-only PixelLab gallery), modeled on the iOS/Android home screen. Desktop dark mode, 1440×900 at 2×.

## Concept

1. The first screen is a home screen: assets are icon tiles (art trimmed to its pixels, integer-scaled, nearest-neighbor) with a name underneath, on a calm wallpaper.
2. Folders are tiles with a 2×2 preview, placed at the start of the grid. Favorites is a built-in folder, and opening any folder shows an iOS-style overlay.
3. A floating glass dock holds the only persistent chrome: a labeled Search pill, a type menu ("All ▾") and "…".
4. Tile states use home-screen language: a progress ring means the asset is still generating, and a count badge means candidates are waiting for review.
5. The detail view shows only the art and a few floating glass controls. Actions sit in a bottom dock that echoes the home dock. Download is the only accent-colored element in the whole product.

## Images and visible controls

Content tiles are not counted as controls. Hover cues (the check circle and `⋯` on a tile) appear only on the tile under the pointer, so they are not shown or counted.

| Image | Visible controls | Count |
|---|---|---|
| `01-home.png` | Search pill (`/`), All ▾, … | **3** |
| `02-detail.png` | ✕, ♡, ⓘ, …, Walk · East ▾ (shown only for animated or multi-direction assets), Download GIF ▾ (one split button) | **5 + 1 conditional** |
| `03-detail-info.png` | The 6 above (ⓘ shows as on), plus inside the sheet: Copy, 2 folder rows, Open in PixelLab ↗ | **6 + 4 in the sheet** |
| `04-folder-open.png` | The folder "…" (Rename, Download all, Delete folder). Folder tiles are content. A click outside or Esc closes the overlay. | **1** |
| `05-context-menu.png` | Menu: Open, Favorite, Add to folder…, Download… (PNG), Select. The rest of the screen is inert. | **5 menu items** |

## Where hidden functions live

| Function | Primary home | Visible twin / accelerator |
|---|---|---|
| Asset types | Dock **All ▾** lists All, Characters, Objects, Tiles & maps, UI & images, and Effects & fonts, each with a count. Empty types are hidden. | Search matches type names as "Go to" rows |
| Folders | Tiles at the start of All. A click opens the overlay (04), and the URL changes so browser Back closes it. | Info sheet "In folders" rows; search |
| New folder / add to folder | Context menu or viewer "…" → **Add to folder…** (a picker that lists recent folders first and ends with New folder) | Selection bar |
| Favorites | The built-in **Favorites** folder tile (always first) | ♡ in the viewer, Favorite in the context menu, `F` key |
| Sort | Dock **…** → Sort (Newest, Oldest, Name, Type), as an inline list inside the menu, not a submenu | — |
| Grid size | Dock **…** → Icon size (S / M / L), as an inline segmented control | `-` / `=` keys (browser Ctrl +/- zoom is left alone) |
| Previews (animate tiles) | Dock **…** → Play previews: On hover / Always / Off | — |
| Settings / API key | Dock **…** → **Settings…** opens a sheet with the API key, connection status, sign out and About. It opens automatically on first run when no key is set. | — |
| Refresh, keyboard shortcuts | Dock **…** → Refresh, Keyboard shortcuts (`?`) | `?` key |
| Multi-select | Context menu **Select**, or dock **…** → Select. Selection mode swaps the dock for an accent bar: "N selected, ♡, Add to folder, Download ▾, ✕". | Hover check circle, Shift/Ctrl-click, Esc to exit |
| Download formats | The viewer **Download GIF ▾** chevron lists only the formats this asset supports: GIF (the default), sprite sheet PNG, frames ZIP, current frame PNG, all directions ZIP. Static assets show Download PNG. Tilesets show Sheet PNG and Tiles ZIP. | Context menu **Download…** (same list); bulk ZIPs in the selection bar |
| Direction / animation | **Walk · East ▾** chip opens a direction rose and an animation list | — |
| Playback speed / frame step | Viewer **…** → Playback (0.5×, 1×, 2×; step frames). Default is 10 fps, because PixelLab sends no timing. | Click the art or press Space to pause; `,` / `.` step frames while paused |
| Backdrop | Viewer **…** → Backdrop: Dark / Checker / Light (remembered) | — |
| Open in PixelLab | Info sheet footer link | Viewer **…** |
| Prev / next asset | ← / → keys | Edge arrows on hover; swipe on a phone |
| Review candidates | The tile badge shows the count. The viewer shows the candidates read-only, with "Review in PixelLab ↗". | — |

Every hidden input has a visible twin. Right-click and long press always open the same menu (05), on every grid.

## Phone mapping

- **Home:** 4 columns of icon tiles, with folders first, exactly like an iPhone page but as one vertical scroll. The dock becomes a floating bottom pill in the thumb zone (Search, All ▾, …).
- **Input:** tap opens. Long press opens the same context menu as desktop right-click, and its **Select** item enters selection mode, which keeps the home-screen meaning of long press. The selection bar replaces the pill.
- **Folder:** the overlay grows to near-full-screen and a back swipe closes it.
- **Detail:** ✕ top-left; ♡, ⓘ and … top-right; the chip and Download stay at the bottom, unchanged. Info becomes a bottom sheet with medium and large detents.

## Honest weaknesses

- **Scale to 1,000+ assets.** A home screen is built for about 30 to 80 icons. This grid shows about 40 tiles per screen with no sections, so 1,000 assets take about 25 screens of undifferentiated scrolling. It needs a transient "July 2026" / type pill while scrolling, a fast scroller, and strong search. Folders also push assets down: 20 folders already use 2.5 rows, so they would need to collapse into one row with an "All folders" tile.
- **One square icon size fights the art.** Strict integer scaling at icon size is uneven. A 32 px item gets 5×, but the 33×99 px Android Courier gets only 1× and looks tiny (see 04). Maps, UI kits (688×384) and 512 px atlases are smoothly downscaled into an 80 px square, which shows almost no detail.
- **Labels truncate** ("Round Wooden Shi…"), and same-name states (two "Hooded Orb Mage", two "Treasure Chest") look identical without a state suffix.
- **Folders vs assets:** only the lighter fill and the 2×2 layout set folders apart, and an atlas asset is also grid-like. The built-in "Favorites" folder next to a user folder called "Favorites to export" also reads awkwardly.
- **Discoverability:** sort, icon size, previews and backdrop are buried in "…", and switching types takes 2 clicks (Concept A in research 11 kept types visible as dock segments; this concept trades that for a 3-control budget).
- **The review badge** is the brightest thing on the home screen. That is intended ("needs you"), but it can read as a notification.
- **Navy art on a dark stage** (02) has low contrast until the user changes the backdrop. A smarter default (auto-checker for dark sprites) would help.
- These are static images, so hover, scroll, playback and the cost of backdrop blur over a large grid are not shown.

## Files

`01…05-*.html` render the screens from `../../shared/sample-data.js`, using `vitrine.css` and `vitrine.js`. Each PNG is a headless Chromium screenshot of its HTML file at 1440×900 with deviceScaleFactor 2. The browser needs `--allow-file-access-from-files` so tiles can trim transparent padding; without it, tiles fall back to the untrimmed image.
