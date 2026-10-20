# Theme H: GlassKit + Material

Option 2b. Concept 4 "Glass Library" (`../../4-glass-library/`) on **GlassKit**, the foundation the owner chose, with theme G's Material 3 Expressive rules added as one override file. It starts as an exact copy of theme F ([`../f-glasskit/`](../f-glasskit/README.md)). `material.css` is loaded after GlassKit and `app.css` and brings in theme G's rules ([`../g-glass-material/`](../g-glass-material/README.md), [`docs/design/08-simplicity-redesign.md` §15](../../../../docs/design/08-simplicity-redesign.md)). Layout, sizes, content and control counts match theme F. Desktop dark mode, 1440×900 at 2×.

## Files

| File | State |
|---|---|
| `vendor/glasskit/glasskit.css`, `LICENSE` | GlassKit v1.27.0, byte-identical to theme F's copy (SHA-256 `7e0da50b…adb1113a` and `6d6cb76b…58eef1a`) |
| `app.js`, `app.css`, `art.js`, `bbox.js` | Byte-identical to theme F. The markup uses the same GlassKit classes |
| `index.html` | Theme F's, plus one `<link>` to `material.css` and a new title |
| `material.css` | **New: 44 lines** (40 non-blank, 31 of them rules and declarations) |

The relative paths are unchanged because the folder sits at the same depth as theme F. `index.html#<frame>` renders one frame. The `&stress` flag (from theme F's `app.js`) shifts the library 430 px down, so the bright tileset and map row sits under the dock.

## What GlassKit provides and what material.css changes

GlassKit still draws every floating surface and control: the floating tab bar (dock and ♡ ⓘ … capsule), `.glass-pill` ✕, `.glass-search`/`.glass-input`, `.glass-btn--primary` (Download and the split button), `.glass-btn--tertiary` (Copy, Open in PixelLab), `.glass-checkbox`, `.glass-sheet--inline` with `.glass-list` (Info panel), `.glass-popover` menus, `.glass-card--glow` folders and `.glass-modal-overlay`. Theme F's `app.css` still handles the layout, the dark base under the glass, the muted-text and placeholder tokens, and the split button.

`material.css` changes the following. "Token" means the change only sets custom properties, from GlassKit (`--gl-*`) or from the app (`--vt-*`). "Selector" means it sets ordinary CSS properties.

| # | Override | Type | What you see |
|---|---|---|---|
| 1 | `--gl-color-primary` `#a8c7fa`, `--gl-color-primary-dark` `#8fb3f0` | Token, global | Download, the split button and checked checkboxes turn pastel blue. GlassKit derives the glow, rim and focus shadow from them |
| 2 | `--gl-color-on-primary` `#062e6f` | Token, global | Dark label, icons and checkbox tick on the pastel fill |
| 3 | `--vt-scrim` 78% (`.vt-scrim`) and 88% (`.vt-scrim.hi`) | Token (app), on theme F's own classes | Darker base under the dock, capsule and ✕ (theme F: 62%), and under the menus and Info panel (theme F: 80%) |
| 4 | Selection dock: `--vt-scrim` `rgb(12 72 176 / .84)`, `--gl-icon-muted` white, `--gl-border-subtle` 26% white, scoped by `.vt-dock:has(.vt-count)` | Token, scoped by a selector | The selection bar becomes **vibrant**: accent-filled blue glass, white icons and labels. `app.js` is unchanged because the `:has()` hook finds the bar by its "3 selected" item |
| 5 | `--gl-inset-strong` on `.glass-btn--primary` | Token, scoped | A brighter white top rim on Download, as a glass edge |
| 6 | `--gl-radius-btn: 16px` in the viewer dock | Token, scoped | Download GIF becomes an extended button with 16 px corners instead of a pill. Height and width are unchanged |
| 7 | `--gl-tab-bar-active-bg` / `-color` on `.vt-caps` | Token, scoped | ⓘ on is a tonal blue-grey fill instead of a white capsule |
| 8 | `backdrop-filter: none` on `.glass-input`, `.glass-checkbox__box`, `.glass-btn--tertiary`, `.glass-list`, `.glass-badge`, `.glass-toggle__track`, `.glass-card` | Selector | Blur only on floating roots. GlassKit's 0 px blur tokens would still leave a `backdrop-filter`, and so a backdrop root, on every control |
| 9 | ⓘ on: `border-radius: 12px`, filled circle, dark glyph | Selector | ⓘ on becomes a rounded square with a filled icon |
| 10 | `.cell.sel .sq`: radius 24 → 32 px, 3 px accent ring, accent tint; `.cell.sel .nm` full white | Selector (app classes) | Selected cells round up and get a blue ring. The pastel check comes from #1 |
| 11 | Surface-3 fill on ‹ Library and Select | Selector | Tonal pills, so they read as buttons beside the "Objects 21" title |
| 12 | Split divider: no white seam, a dark divider at 32% | Selector | A clean seam on the pastel split button |
| 13 | Info lists: 2 px gaps, rows on `--gl-surface-1`, 16 px outer and 4 px inner corners, GlassKit's `::after` dividers hidden | Selector | The Info list becomes separate rounded rows instead of one card with hairlines |
| 14 | Focus: 3 px `#a8c7fa` outline at a 2 px offset on the same controls as theme F, plus the input and the checkbox box. White inside the vibrant bar. Dark `#062e6f` and 6 px inside on the split button halves | Selector | Visible focus rings. Theme F's were 2 px white |

Totals: 7 token overrides (#1–#7) and 7 selector groups (#8–#14). Wherever a token existed, the token was used. The ones that could not be done with tokens: GlassKit has no token that turns blur off (#8), and no token for the radius of the active tab item, for list-row gaps or dividers, or for focus outlines.

## Measured contrast

The method is the same as theme F's: each text run's colour, alpha included, is composited over the real rendered pixels behind it, captured again with all text transparent. The table gives the minimum ratio over every second device pixel. Stress frames and focus frames were checked but not shipped.

| Frame | Lowest text in 2b | Ratio (2b) | Same text in option 2 |
|---|---|---|---|
| 01 home | Search placeholder / `/` | 5.44 / 5.75 | 5.06 / 5.32 |
| 01 stress | Placeholder / `/` / Library | 5.09 / 5.73 / 7.20 | 4.86 / 5.32 / 6.62 |
| 03 category | "21" in the breadcrumb | 5.30 | 5.17 |
| 05 selection | Download (dark on pastel) / Add to folder (white on vibrant) | 6.27 / 6.70 | Download 6.01 (white on blue) |
| 05 stress | "3 selected" / Download | 6.21 / 6.27 | — |
| 06 detail | Download GIF | 6.20 | 5.93 |
| 07 info | Copy / Download GIF / Open in PixelLab | 5.74 / 6.20 / 6.53 | 5.52 / 5.93 / 6.47 |

No text run in any frame falls below 4.5:1. The pastel Download measures 6.2–6.3:1. That is below theme G's 7.4:1, because GlassKit's 135° gradient runs into the darker `#8fb3f0` stop and its blue glow sits under the label.

**Focus rings.** Ring pixels in the focused frame were compared with the same pixels unfocused, along the ring's centre line:

| Control | Minimum ratio | 5th percentile |
|---|---|---|
| Library item on the dock (pastel ring) | 4.77 | 6.89 |
| ✕ on the vibrant bar (white ring) | 5.93 | 5.93 |
| Selected checkbox (pastel ring) | 7.90 | 7.99 |
| Download GIF (dark inner ring) | 4.95 | 5.11 |

All four pass the 3:1 minimum.

## Blur layers per frame

These are the elements whose computed `backdrop-filter` is not `none`, counted in the page.

| Frame | Option 2 (theme F) | 2b (theme H) | What is left in 2b |
|---|---|---|---|
| 01 home | 8 | **1** | Dock (F also blurred the search input and the 6 folder cards) |
| 03 category | 1 | **1** | Dock |
| 05 selection | 22 | **1** | Dock (F also blurred 21 checkbox boxes) |
| 06 detail | 3 | **3** | ✕, capsule, dock |
| 07 info | 9 | **4** | ✕, capsule, dock, Info sheet (F also blurred 3 lists, Copy and Open in PixelLab) |

The renderer logged zero non-`file:` requests and no script errors.

## How fragile the overrides are against GlassKit updates

- **Low risk, the token overrides (#1–#7).** They use GlassKit's documented re-brand path (`--gl-color-primary`, `-dark`, `--gl-color-on-primary`, which GlassKit's own comments recommend for a light primary) and its role tokens. If a token is renamed, the override silently stops working and GlassKit's default comes back, for example the amber primary. Nothing breaks the layout. `--gl-tab-bar-active-bg` / `-color` are new in 1.27.0, the newest and least settled part of the API.
- **Medium risk, #8 (blur off).** It names 7 GlassKit classes. If a release adds blur to another nested component, or renames one, the blur comes back without any visible error. Re-run the blur-layer count on every upgrade.
- **Medium risk, #13 (Info rows).** It depends on GlassKit drawing list dividers as `.glass-list__item::after` and on the list's own background, border and shadow. If the divider moves to a `border` or another pseudo-element, the hairlines reappear inside the rounded rows.
- **Medium risk, #9, #12 and #14.** They rely on GlassKit's markup: active tab items as `.is-active`, the checkbox as `input + .glass-checkbox__box`, and outlines left free. GlassKit currently sets `outline: none` without `!important`. If it adds a focus style of its own, the two may stack.
- **No GlassKit risk, #3, #4, #10 and #11.** They target the app's own classes (`.vt-scrim`, `.vt-count`, `.cell.sel`, `.vt-back`).
- As with theme F: pin the version, read the CHANGELOG, and re-run the contrast, focus-ring and blur-count checks on every upgrade.

## Weaknesses

- **Most of the glass disappears over dark content.** At a 78% base, the dock looks almost the same as option 2 on the dark home and viewer. The difference shows only where bright art passes under the dock (01 stress, 05).
- **The vibrant bar is the loudest thing on screen.** As in theme G, the translucent blue picks up colour from the art underneath.
- **GlassKit's gradient fights the pastel.** The primary is a 135° light-to-darker gradient, not M3's flat tonal fill, so Download reads slightly shaded. A flat fill would need a selector override of GlassKit's `background`. It stays a token override for now (6.2:1 is enough).
- **The extended button sits inside a pill dock.** Option 2's layout keeps Walk · East and Download GIF in one dock, so the 16 px corners sit inside a fully round pill. Theme G split them into a chip and a 56 px FAB, which is not allowed here (sizes and layout follow option 2).
- **Unchecked checkboxes stay GlassKit's squares,** not theme G's circles. Checked ones turn pastel through the primary token.
- **The Info lists are 2 px per gap taller** (10 px for the six detail rows) because rows are separated by gaps instead of hairlines. The row height is unchanged.
- **The inner focus ring on the split button** has squarer corners than the button, because Chromium shrinks the outline radius with the negative offset.
- **Not shot:** 02, 04, 08, 09 and 10. `material.css` applies to them (pastel accent, darker menus, nested blur off, a pastel focus ring on the focused search field in 02), but they were not rendered or reviewed.
- **Static only,** as theme F: no motion, hover, `prefers-reduced-transparency` or `forced-colors` fallbacks.

PNGs: `01-home`, `03-category-open`, `05-select-mode`, `06-detail`, `07-detail-info`. Each is a headless Edge screenshot at 1440×900 with deviceScaleFactor 2 and `prefers-color-scheme: dark`.
