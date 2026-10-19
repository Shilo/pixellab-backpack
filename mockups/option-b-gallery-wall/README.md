# Option B: "Gallery Wall" mockup

Interactive, high-fidelity mockup of design option B for Vitrine, the unofficial, view-only gallery for your PixelLab assets. Layout and tokens come from `docs/design/04-design-options.md` §0 and §2. Behaviour and copy come from `02-ux-spec.md`. The acceptance checklist is `03-mockup-requirements.md`.

## Open it

Open `index.html` straight from disk (`file://`) in an evergreen browser. Chromium/Edge 125+ is best, because the mockup uses `light-dark()`, the Popover API, View Transitions and scroll-driven animation (the last two degrade gracefully). It has no build step, no network requests, no CDN and no web fonts. It loads `../shared/sample-data.js` and `../shared/pixel-utils.js` with classic scripts.

First run shows **Connect**. Any non-empty token "connects" (the value is dropped immediately and never stored or shown). Type `bad` to see the invalid-token error, or choose **Use sample library**.

## Demo shortcuts (`?demo=` query; skips Connect)

| Query | Opens |
|---|---|
| `?demo=home` | Library shelves |
| `?demo=grid` · `?demo=chip&type=objects` | Flat grid: "See all" / a type chip |
| `?demo=detail&asset=N` | Detail page. N: 0 Android Courier · 1 Orb Mage · 2 Hooded Orb Mage · 3 Bear Trap (open) · 4 Goblin Brute Idle · 5 Dirt → Grass · 6 Wooden Stairs Kit · 7 Meadow Ruins · 8 Stone Steps · 9 Fantasy MMO HUD · 10 Fox Scout Walk · 11 Castle Battlements · 12 Grass Block · 13 Slime Menagerie. Add `&type=characters` to open it under a chip. |
| `?demo=export&asset=0` · `?demo=menu&asset=0` · `?demo=folderpick&asset=0` | Single export dialog · Download menu · Add to folder |
| `?demo=select` · `?demo=selectbar` | 12 objects selected, with or without the multi export dialog |
| `?demo=boards` · `?demo=folder&id=fld_01` · `?demo=favorites` | Collections boards · a folder page · Favorites |
| `?demo=connect` · `?demo=welcome` | Connect · "Welcome back" variant |
| `?demo=settings` · `?demo=help` · `?demo=sync` · `?demo=report` · `?demo=401` | Settings · shortcuts overlay · first sync · export report · reconnect dialog |
| `?demo=search&q=mage` · `?demo=tag` · `?demo=noresults` · `?demo=other` | Search · `#dungeon` · "dragon" no results · Other card |
| `?demo=empty` · `offline` · `offline-empty` · `cors` · `rate` · `partial` · `gate` · `export-fail` | State gallery entries |
| `&theme=dark` · `&theme=light` · `&size=S\|M\|L\|XL` | Force a theme or grid size |

Every state is also available in the app under **Settings › Mockup states**.

## Real vs faked

**Real:**
- Integer device-pixel scaling via `integerScale()` on every thumbnail, mosaic and stage, with a smooth "fit" for k < 1. Art refits on resize and on DPR change.
- Canvas playback on the shared `PixelTicker` at 8 fps: direction compass (missing directions disabled), animation picker, state switcher, play/pause, step, scrubber, fps stepper (1–30) with Reset, and loop/once. fps overrides persist per animation.
- Six backdrops; zoom (Fit, 1:1, −, +, wheel, double-click/tap, pinch steps) and drag/Shift+arrow pan; tileset Grid overlay with tile info; Tiles Pro variations in √n columns.
- Shelves with ‹ › and "See all", the flat grid, type chips, search (`#tag`, AND terms, diacritic-insensitive), sorts ("Recently updated" on Characters only), and S/M/L/XL sizes.
- Selection: Select button, click/Ctrl/Shift on desktop, long-press on touch, `x`, Ctrl+A, "Select all in shelf", and "N hidden by filter".
- Favorites and folders in memory: create, rename, delete (with Undo), tri-state add/remove, boards with 2×2 covers, and the unavailable-items line.
- Hash routes with 12-character opaque keys; Back/Esc returns from the detail page with scroll, shelf position and focus restored. Prev/next uses replace, so Back is always one step.
- Hover/focus preview after 300 ms; the Animate toggle (off by default) plays in-view cards.
- Keyboard: arrows, Home/End, Enter, Space, `/ ? x L D + − Z , . [ ] F`, Shift+F10, and the single-key shortcuts switch.
- Light/dark/system theme, `prefers-reduced-motion` (opens paused, cuts instead of fades) and coarse/fine pointer rules.

**Faked:**
- Token test and sync streaming (a timer-fed queue).
- Downloads and exports (progress chip, then a toast, report or touch ready sheet).
- Clipboard (a toast; only text is copied), balance and storage numbers, and the error states.
- PixelLab hand-off links show a toast instead of leaving the page.

Sort, size, Animate, theme, default backdrop, shortcuts, fps overrides and the last export presets persist in `localStorage`.

## Deviations from the docs, and why

- **6 backdrops** (orchestrator ruling) instead of 04's seven.
- **Three files** (`index.html`, `styles.css`, `app.js`), per the build brief, instead of 04 §0.3's single file.
- **Approved option-B deviations (04 §0.2):**
  - Shelves home (V3) and boards for Collections.
  - Full-page detail route (V4), so there is no bottom-sheet inspector. Phone uses page scroll plus a sticky actions row.
  - B's column counts and top navigation (V2, §2.2).
- **Phone toolbar:** 360 px can't fit result + Animate + View + ⋯ with visible labels. Sort and Grid size move into ⋯ on phone (compact height keeps View), and the status reads "Synced" as in wireframe B3. **Phone transport:** Loop moves into the scrolling pill row.
- **Search:** type labels match by word prefix, not substring. Otherwise "mage" matches every "Image" (26 hits instead of Mage Robe, Hooded Orb Mage and Orb Mage).
- **Settings** shows "token ending ••••" without the last four characters, because the mockup brief forbids displaying anything token-like.
- **Field labels** are 13 px all-small-caps instead of 11.5 px; 11.5 px small caps were hard to read.
- **Copy 02 doesn't define:**
  - "Saved {file}" for single quick downloads.
  - "Give the folder a name." for an empty name.
  - The tile-info corner/rule bits, which are derived from the tile index because the sample data has no per-tile metadata.
  - The map "Placed objects" rows, which are illustrative.
- **Simplified:**
  - No grid windowing (71 assets).
  - The Tiles Pro thumbnail shows the whole sheet, not the first four variations.
  - Settings is a dialog without a `#/settings` route.
  - Back exits a detail page but not selection mode (Esc or × does).
  - Character/object thumbnails are bottom-aligned but untrimmed, because canvas readback is tainted on `file://`.

## Known issues

- **Shared data quirk:** Hooded Orb Mage's base-state images are 232×232 px, but `meta.size` says 128. The mockup shows the real pixel size (232 × 232).
- Pinch, long-press and swipe were checked with CDP touch emulation only, not on real iOS or Android devices.
- At 200% text on a 360 px detail page, layout overflows by about 1 px from sub-pixel rounding.
- The wheel over the stage zooms (02 §9.2), so the page doesn't scroll while the pointer is over the stage.
- The large-title shrink on phone needs scroll-driven animations; other browsers show a static title.
