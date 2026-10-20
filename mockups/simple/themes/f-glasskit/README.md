# Theme F: GlassKit

Concept 4 "Glass Library" (`../../4-glass-library/`) rebuilt on **GlassKit**, the MIT glassmorphism CSS library the owner asked to evaluate ([site](https://glasskit.jungherz.com/), [repo](https://github.com/JUNGHERZ/GlassKit)). The layout, sizes, content and control counts follow Concept 4. The screens use GlassKit's real classes and markup patterns from its `SKILL.md` and `docs.html`. A thin app stylesheet sets Vitrine's tokens, the layout, and what GlassKit lacks. Desktop dark mode, 1440×900 at 2×, all 10 frames. Full library review: [`docs/research/15-glasskit-review.md`](../../../../docs/research/15-glasskit-review.md).

## GlassKit version and license

- **GlassKit v1.27.0**, commit `c8558abb020a1c163f4aec07fbc0b3def7064fc2` (2026-10-18). The same bytes ship in npm `@jungherz-de/glasskit@1.27.0`.
- `vendor/glasskit/glasskit.css` (140,736 bytes, SHA-256 `7e0da50b…adb1113a`) and `vendor/glasskit/LICENSE` (MIT, © 2026 Jungherz GmbH) are copied unmodified from that commit.
- Not vendored: `glasskit-droplet.js` (the optional motion module; a static storyboard does not need it), `theme-override.css` (a template), and the minified build. Nothing loads from a CDN or the network. The renderer logged zero non-`file:` requests.

## What comes from where

| Piece | GlassKit (class, pattern) | App stylesheet (`app.css`) |
|---|---|---|
| Page | `.glass-bg` on `<body>`, `data-theme="dark"` on `<html>` | Background tokens re-pointed from GlassKit's teal and amber aurora to neutral graphite |
| Dock (all five roles) | `.glass-tab-bar-dock` › `.glass-tab-bar.glass-tab-bar--floating`, `.glass-tab-bar__item` / `__icon` / `__label`, active item as the 1.27.0 capsule (`--gl-tab-bar-active-bg`) | Items laid out in a row at 48 px with 15 px labels (GlassKit stacks a 10 px label under the icon); breadcrumb text and divider |
| Search pill and field | `.glass-search` + `.glass-search__icon` + `.glass-input`, focus ring | Width 300 / 520 px, the `/` and `esc` key hints |
| Download, selection Download | `.glass-btn.glass-btn--primary.glass-btn--auto`, height and radius set through the density tokens | Solid icon glyphs, because GlassKit fills every icon inside a primary button and stroke icons vanish |
| Split button (Download GIF ▾) | Two `.glass-btn--primary` buttons | **Missing in GlassKit:** joined radii and the divider |
| ✕ (viewer, folder) and folder "…" | `.glass-pill` (46 px; Concept 4 used 48 px) | Position only |
| ♡ ⓘ … capsule | A second `.glass-tab-bar--floating`, ⓘ as the active item on a white capsule | Fixed position, 42×40 items |
| Menus (04, 08, 10) | `.glass-popover.is-open` › `.glass-list.glass-list--bare` rows with `__title`, `__subtitle`, `__trailing`, `__value`, automatic dividers, `.glass-divider` between groups | Fixed position, 270 / 310 / 330 px width, 44 px rows through the list density tokens, highlighted "Open" row |
| Grid size, Play previews | `.glass-segmented` (`aria-pressed`), `.glass-toggle` | Smaller segments so the row fits; a white track instead of the blue one (the library has no accent) |
| Search panel (02) | `.glass-popover`, `.glass-list__section-header`, `.glass-badge--interactive` chips, Go to tiles as one-row `.glass-list` with `__leading--lg`, Clear as `.glass-btn--tertiary --sm` | Centred placement, the 4-column and 6-column grids, chip height 34 px |
| Context menu and folder backdrops | `.glass-modal-overlay.is-active` (dim plus 12 px blur) | z-order |
| Folder tiles and folder panel | `.glass-card.glass-card--glow` (frosted, lighter than the type tiles) | Mosaic padding, the 4-column folder grid |
| Info panel (07) | `.glass-sheet.glass-sheet--inline`, `__title`, grouped `.glass-list` with `__value`, Copy and Open in PixelLab as `.glass-btn--tertiary` | Side placement (GlassKit's sheet is a bottom sheet), 40 px rows, a darker sheet gradient |
| Selection checks (05) | `.glass-checkbox` with its tick | Corner position, the white selection ring on the cell |
| Type tiles, asset cells, pixel art | — | **Missing in GlassKit:** dark content tiles, square cells, `art.js` / `bbox.js` (integer scale, nearest neighbour), unchanged from Concept 4 |
| Readability layer | — | **Missing in GlassKit:** a dark base (`--vt-scrim`, 62% docks, 80% menus) under GlassKit's white glass, plus stronger muted text and placeholder tokens on that glass |
| Keyboard focus | — | **Missing in GlassKit:** a visible `:focus-visible` outline for buttons, pills, tab items, list rows, segments and chips (GlassKit sets `outline: none` and draws nothing back) |

Split of `app.css` (153 non-blank lines): 16 set GlassKit tokens and 7 are the readability layer. Section 3 has 123 lines. 77 of them are layout ported from Concept 4. The other 46 select GlassKit classes or set GlassKit tokens to resize or re-lay them out: row-layout dock items, menu sizes, the side sheet. The last 7 add the split button and the focus ring.

## Control counts

These are identical to Concept 4.

| Image | Visible controls | Count |
|---|---|---|
| 01 home | Library, Search, … | **3** |
| 02 search | Library, search field (esc), plus the panel's Clear, 3 recents, 4 Go to, 6 assets, Show all | **2** + panel |
| 03 category | ‹ Library, Search, Select, … | **4** |
| 04 context menu | Open, Favorite, Add to folder…, Download…, Select | **5 items** |
| 05 selection | 3 selected ▾, Favorite, Add to folder, Download, ✕ | **5** |
| 06 detail | ✕, ♡, ⓘ, …, Download GIF ▾ (one split button), plus Walk · East ▾ | **5 + 1** |
| 07 info | The same 6 (ⓘ on), plus Copy, 2 folder rows, Open in PixelLab | **6 + 4** |
| 08 download menu | The same 6, plus 5 rows | **6 + 5** |
| 09 folder | Folder …, ✕ | **2** |
| 10 more menu | The 3 dock controls, plus 8 rows | **3 + 8** |

## Measured contrast

The ratios are measured in the page. Each text run's colour, alpha included, is composited over the real rendered pixels behind it: the same frame is captured with all text transparent, and every second device pixel inside the run's box is sampled. The tables show the minimum ratio. "Stress" shifts the library down 430 px so the bright tileset and map row (saturated greens and dirt) sits under the dock. "Stock" removes the app's dark base and leaves GlassKit's own glass, with GlassKit's default muted text (60%).

| Frame | Lowest floating-UI text | Ratio |
|---|---|---|
| 01 home | Search placeholder / `/` hint | 5.06 / 5.32 |
| 01 stress | Placeholder / `/` / Library | 4.86 / 5.32 / 6.62 |
| 02 search | Focused placeholder / `esc` / Clear / Go to subtitle | 4.62 / 4.86 / 5.04 / 5.27 |
| 03 category | "21" in the breadcrumb | 5.17 |
| 04 context menu | "PNG" | 6.60 |
| 05 selection | Download (white on blue) | 6.01 |
| 06 detail | Download GIF | 5.93 |
| 07 info | Copy / Open in PixelLab | 5.52 / 6.47 |
| 08 download menu | Row subtitles / Download GIF | 6.42 / 6.02 |
| 09 folder | "· detailed robe" on the glow card | 6.23 |
| 10 more menu | Pressed "M" segment / placeholder | 4.78 / 5.13 |

- **Download fixed.** The primary is re-branded to `#0a6cdc` (white text: 5.01:1 at the lightest gradient stop, at least 5.93 measured), replacing the baseline's 3.65:1 `#0a84ff`.
- **GlassKit stock glass fails over this content.** 02 has 14 of 37 runs below 4.5:1 (worst 2.27, a Go to subtitle). 07 has 15 of 24 (worst 2.64, Copy). 10 has 9 (worst 3.38). 08 has 3 (worst 3.56). In 01 stress the placeholder measures 2.68 and Library 4.43. GlassKit's default placeholder (35% white) measures 2.47 even on the dark-based dock, and 1.81 on stock glass over bright art.
- **Not counted:** tile labels behind the 09 folder overlay and the 10 dim (inactive content; "4" reads 3.52 under the 25% dim, as in Concept 4).

## Weaknesses

- **The readability fix is not GlassKit.** GlassKit's glass is white 8–22% over a 24 px blur, tuned for its dark aurora background. Over pixel art it lets colour through (green and orange fringes in the stock renders) and white text falls below AA. The dark `--vt-scrim` base makes it work, but at 62–80% it is mostly a tinted panel with a blur behind it.
- **Many overrides for one layout.** The dock items, menu rows, sheet and segmented control all needed size or layout changes. GlassKit's defaults are phone-sized (56 px buttons, 10 px tab labels, 56 px list rows, full-width buttons), and Concept 4 is a desktop layout.
- **Blur everywhere.** GlassKit blurs nearly every control, nested ones included. Frame 05 has 22 backdrop-filter layers, one per selection checkbox plus the dock; Concept 4 had 1. A 200-asset grid in selection mode would have 200. A real build should switch off nested blur.
- **Look.** Docks and menus read as polished, generic iOS 26 glass. The 1.5 px white borders and the glow card's milky gradient are heavier than Concept 4's hairlines, and the folder panel turns grey rather than frosted. GlassKit's amber, its teal aurora and its spotlight all had to be switched off. What remains is close to Concept 4 with GlassKit's borders.
- **Static only.** These frames do not show hover, the 1.27.0 droplet motion (which needs the JS module), menu positioning or keyboard handling. GlassKit's popover is a class toggle with no positioning, no focus management and no ARIA.
- **Fonts.** GlassKit's stack (`-apple-system … 'Segoe UI'`) renders here in Segoe UI. Nothing is downloaded.

## Files

- `index.html#<frame>` renders one frame, for example `index.html#04-context-menu`. The `&stock` flag removes the readability layer and `&stress` shifts the library down (both are for contrast checks only).
- `app.js` builds the frames from `../../../shared/sample-data.js`. `app.css` is the app stylesheet. `art.js` and `bbox.js` are unchanged from Concept 4 (with theme-depth paths).
- `vendor/glasskit/` holds GlassKit's CSS and LICENSE, unmodified.
- Images load from `../../../shared/assets/`. Each PNG is a headless Edge screenshot at 1440×900 with deviceScaleFactor 2.
