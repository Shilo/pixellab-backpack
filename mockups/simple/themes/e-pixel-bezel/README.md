# Theme E: Pixel Bezel

Concept 4 "Glass Library" (`../../4-glass-library/`) re-skinned in theme E from `docs/research/14-floating-ui-themes.md`. Layout, sizes, content and control counts are unchanged; only the visual theme differs. Desktop dark mode, 1440×900 at 2×.

**Summary.** A modern handheld console rather than frosted glass: solid chamfered panels with 2px borders, hard key shadows with no blur, recessed wells for "selected" and "pressed", pixel numerals, and one phosphor-mint accent. The chrome reads as part of a pixel-art tool, while the art stays the only saturated thing on screen.

**Inspiration.** [Teenage Engineering, depth without skeuomorphism](https://blakecrosley.com/guides/design/teenage-engineering) · [Geist Pixel](https://vercel.com/font?type=pixel) · [CSS `corner-shape: bevel`](https://groups.google.com/a/chromium.org/g/Blink-dev/c/OoX4xjqSPt4) · pixel-editor conventions (marching-ants selection).

## Key tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#17161C` | Page, wells, viewer stage (lifted to `#24232B` at the centre; never pure black) |
| `--tile` / `--cell` | `#201F27` / `#26252E` | Type tiles / art cells |
| `--float` + `--float-border` | `#2B2A34` + `#46445A` (2px) | Dock, capsules, panel, folder tiles |
| `--shadow-float` | `0 4px 0 #0A0A0D` | Hard key shadow |
| `--well` | `inset 0 2px 0 #0A0A0D` on `--bg` | Selected segment, search field, ⓘ on, Walk · East chip, prompt |
| `--accent` / `--accent-on` | `#8BE3B4` / `#0D2A1C` | Download keys only (edge `#2E6B4C`) |
| `--marquee` | `#F2F0E9` | Dashed selection outline and check |
| Radii (beveled) | tiles 14, cells 12, dock 14, keys 8, panel 14 | `corner-shape: bevel` |

Contrast (computed): text-2 on bg 8.46, text-3 on bg 5.99, text-3 on cell 5.05, text-2 on float 6.66, text-1 on float 12.41, Download label 10.07. All ≥ 4.5:1.

## Type and icons

- UI text: Segoe UI Variable (system). Geist Sans is not installed and nothing is downloaded, so the UI face is the same as the glass baseline on Windows.
- **Pixel numerals:** no pixel font is available offline, so `app.js` draws a 5×7 digit set as SVG rects (`pix()` / `pn()`) at 2 CSS px per pixel (4 device px at 2×, always crisp). Used for tile counts, the breadcrumb count and "3 selected".
- Section labels and Info values: Cascadia Mono (system), small caps-style uppercase labels with tracking. A real build would use Geist Mono and Geist Pixel.
- Icons: the baseline line icons with square caps and miter joins, plus pixel-grid ♡ and ✓ drawn the same way as the numerals.

## What is distinct from the glass baseline

- No translucency or backdrop blur: every floating surface is opaque, so contrast no longer depends on the art underneath.
- Chamfered (beveled) corners on every surface, key and cell instead of round pills.
- State is shown physically: the selected Library segment is a recessed well with a small lit "LED"; ⓘ on sits pressed into a well; the Download keys stand on a darker mint edge.
- Selection uses a dashed marching-ants marquee and square pixel checkboxes instead of white rings and circles.
- The Info panel is a spec sheet: dashed rules, mono values, uppercase mono section labels.
- Folders (yours) are raised, bordered keys with recessed slots; types (automatic) are flat tiles.
- A faint 16px dot grid on the page background hints at a pixel canvas.

## Weaknesses

- **Chromium only for chamfers.** `corner-shape` falls back to rounded corners elsewhere; the radii were chosen so both read as intended, but the identity is weaker without bevels.
- **Hard shadows vanish on a dark page.** The 4px `#0A0A0D` shadow is mostly invisible over the dark grid and only shows over bright art; the 2px border does most of the separation work.
- **Pixel digits are thin next to semibold text** (one pixel = 2px stroke), most visible in "3 selected". A Geist Pixel bold or 2-pixel stems would balance better.
- **Same UI face as the baseline** on Windows (no Geist), so typography alone does not mark the theme.
- **Wells repeat.** The selected segment and the search field are both wells on the home dock; the LED is what tells them apart.
- **Static frames.** Marching ants, key presses (translateY 2px over 60ms) and the stepped `steps(3)` panel drop are not shown; the dashed outline is the reduced-motion state.
- Only frames 01, 03, 05, 06 and 07 were rendered. Menus, the search panel and the folder overlay are themed in `style.css` but not checked visually.

## Files

`index.html#<frame>` renders one frame. `style.css` is the theme; `app.js` is Concept 4's frame builder plus the pixel glyph helper; `art.js` and `bbox.js` are unchanged copies. Images load from `../../../shared/assets/`; nothing loads from the network. PNGs are headless Edge screenshots at 1440×900, deviceScaleFactor 2.
