# Theme C: Quiet Graphite

Concept 4 "Glass Library" (`../../4-glass-library/`), re-skinned as theme C from `docs/research/14-floating-ui-themes.md`. Layout, sizes, content and control counts are Concept 4's. Only colour, surfaces, radii, shadows, type, icon stroke and control styling change. Desktop dark mode, 1440×900 at 2×.

**Summary.** Flat, warm, zero-hue graphite in the style of Linear and Raycast. Every floating surface is opaque with a 1px hairline and a soft shadow. Nothing is blurred. The only light object on screen is the inverted **Download** button (and the ⓘ-on state and the selection checks). Keyboard shortcuts are printed inline as mono chips.

**Inspiration.** [Linear's 2026 design refresh](https://linear.app/now/behind-the-latest-design-refresh) (warm greys, "structure should be felt not seen"); [Raycast's redesign](https://www.raycast.com/blog/a-fresh-look-and-feel) (one bottom action bar, printed shortcuts).

## Key tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#141413` | page, viewer stage (with a faint `#1C1C1B` centre lift) |
| `--tile` / `--cell` | `#1B1B1A` / `#212120` | home tiles / art cells (never pure black under art) |
| `--float` | `#252524` | dock, capsules, Info panel, menus |
| `--sel` | `#2F2F2D` | selected dock segment, menu highlight |
| `--border` | `#383734` | 1px hairline (decorative) and the Info list dividers |
| `--text` / `--text-2` / `--text-3` | `#EDEDEC` / `#A3A29D` / `#8F8E89` | labels / secondary / counts and shortcut chips |
| `--accent` / `--accent-on` | `#EDEDEC` / `#141413` | inverse Download, ⓘ on, selection checks |
| Radii | tile 14, cell 10, dock 14, controls 8 (inner) / 12 (48px floating buttons) | |
| Shadow | `0 0 0 1px rgb(0 0 0/.6), 0 8px 24px rgb(0 0 0/.45)` | every floating surface |
| Type | Inter / Geist if installed, else Segoe UI Variable; Geist Mono / Cascadia Mono / Consolas at weight 350 for counts, values, prompt and chips | system fonts only, nothing downloaded |

Contrast (WCAG 2.x, computed): text-2 on bg 7.21, text-3 on bg 5.62, text-3 on float 4.67, text-3 on the search field 5.25, Download label 15.74. Shortcut chips have no fill so they sit on `--float` or the field (≥ 4.67). The unselected-checkbox outline is 4.91:1 on its cell.

## What is distinct from the glass baseline

- **Opaque, hairlined surfaces instead of blur.** The dock and panels read the same over any art, which removes Concept 4's "glass edge over bright art" weakness and the blur cost.
- **No hue anywhere in the chrome.** The baseline's purple and teal background glows and blue accent are gone; the page is one flat warm grey.
- **Inverse primary.** Download is a light button with a dark label and a 1px dark split before the chevron, instead of blue with a glow.
- **Squarer geometry.** The dock is a 14px rounded bar, controls are 8px rectangles, and selection marks are rounded squares instead of circles.
- **Keyboard hints in the dock.** `/` in the search field and `S` on Select (and `?` on Keyboard shortcuts in the … menu, frame 10).
- **Info panel as a hairline definition list,** not grouped cards: labels in text-2, values and the prompt in mono, Copy as a plain underlined text button.
- **Mono counts** on tiles and in the breadcrumb.

## Weaknesses

- **Generic.** It looks like every dev tool's dark mode. There is little personality for a playful art library, and the home is nearly the baseline with the colour drained out.
- **Very low structure.** Tile (`#1B1B1A`) against page (`#141413`) and cell against tile are only a few steps apart, so the home mosaics read as loose squares more than grouped tiles, especially on dim or uncalibrated screens.
- **No Inter or Geist on this machine.** The UI falls back to Segoe UI Variable, which is the same face the baseline renders with on Windows, so the type difference rests on the mono details only. Shipping it needs self-hosted Inter or Geist (both OFL).
- **The `S` chip widens the category dock** by about 28px. It is the only geometric change, made because the spec asks for printed shortcuts.
- **Spec sizes not adopted.** Doc 14 proposes a 44px dock and 36px detail buttons, but this rendering keeps Concept 4's 48px controls so the layout stays identical.
- **Warm greys under cool art.** The blue Android Courier sits fine on `#141413`, but pushing the warmth further would muddy cool sprites (Linear's own warning).

## Files

- `index.html#<frame>` renders one frame from `../../../shared/sample-data.js`. Images load from `../../../shared/assets/`. Nothing loads from the network.
- `style.css` holds the theme. `app.js`, `art.js` and `bbox.js` are Concept 4's, with the `glass` class renamed to `float` and the two shortcut chips added.
- PNGs: `01-home`, `03-category-open`, `05-select-mode`, `06-detail`, `07-detail-info` (headless Chromium, 1440×900, deviceScaleFactor 2, dark).
