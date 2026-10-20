# Theme D: Nothing Mono

Concept 4 "Glass Library" (`../../4-glass-library/`) with theme D from `docs/research/14-floating-ui-themes.md`. The layout, sizes, content and control counts are unchanged; only the visual theme differs. Desktop dark mode, 1440×900 at 2×.

Frames: `01-home.png`, `03-category-open.png`, `05-select-mode.png`, `06-detail.png`, `07-detail-info.png` (`index.html#<frame>`; the other Concept 4 frames also render, themed, but were not shot).

## Summary

Monochrome hardware look: a black page, solid floating surfaces that are separated by a 1px outline instead of shadow or blur, LED-style dot-matrix numerals, and one red signal. Red appears only on the Download fills.

**Inspiration:** Nothing OS's monochrome system and display-only dot matrix ([nothing.community](https://nothing.community/d/61774-nothing-os-evolution), [GSMArena Phone (4a) review](https://www.gsmarena.com/nothing_phone_4a-review-2948p4.php)); Teenage Engineering's monospace, constraint-driven style ([Blake Crosley](https://blakecrosley.com/guides/design/teenage-engineering), third-party). Inspired by, not a copy: no Nothing marks or glyph-light motifs.

## Key tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000` + faint `#1c1c1c` 16px dot grid | Page only, never directly under art |
| `--tile` / `--tile-border` | `#0f0f0f` / `#2a2a2a` | Type tiles (solid hairline) |
| `--cell` | `#141414` | Every art cell; the viewer stage is also `#141414` |
| Folder tiles | `#0a0a0a`, 1.5px dotted `#5a5a5a` outline, `#1a1a1a` cells | "Yours" versus "automatic" types |
| `--float` / `--float-border` | `#121212` / `#3d3d3d` | Dock, capsules, menus; the Info panel is `#000` with the same border |
| `--text` / `-2` / `-3` | `#fff` / `#a8a8a8` / `#8a8a8a` | Lowest pair is text-3 on cell, 5.34:1 |
| `--accent` | `#d71921` | Fill only; white label on it is 5.18:1 |
| Radii | tile 24, cell 16, dock pill, panel and menu 20 | |
| Shadows | none | Separation by outline |

**Type.** The spec asks for self-hosted Geist, Geist Mono and Doto. None of them is installed and nothing may be downloaded, so the stacks start with Geist and fall back to Segoe UI Variable (UI) and Cascadia Mono / Consolas (mono). The dot-matrix numerals are drawn as SVG dots by `dm()` in `app.js` (a 5×7 grid with digits and ×), used only at display size (21px tall): the tile counts, the dock's "21", the "3" in the selection bar, and the Info panel's "128×128".

## What's distinct from the glass baseline

- No translucency anywhere: an opaque dock with a 1px outline stays legible over bright art. This fixes the glass README's main weakness.
- The selected dock segment and the ⓘ on state invert to a white pill with black text. Search is an outlined inner pill, and group separators are a single 4px dot.
- Section labels, Info labels and the "Character" subtitle use 11px uppercase mono with +0.08em tracking. The Info panel uses dotted rules instead of grouped cards.
- Selection uses a 2px white ring and a white check; unselected cells show a grey outlined circle.
- The library icon is a 2×2 dot grid; icons are 1.5px strokes.

## Weaknesses

- **Fonts are substitutes.** Segoe UI and Cascadia Mono read more "Windows" than "Nothing"; the real look depends on bundling Geist and Doto. The SVG numerals cover only digits and ×.
- **Harsh and pastiche-prone.** Pure black with white outlines is high-contrast and can feel cold; the look leans heavily on one brand's identity.
- **Red Download competes with red sprites** (potions, ruby ring, lance). It is acceptable in these frames, but a white pill with a red dot is the fallback.
- **Dot numerals cost legibility.** They read well at 21px but are slower to scan than plain digits, and the background dot grid shows faintly behind the tile counts.
- **Folder versus type tiles are differentiated only by a dotted outline**, which is subtler than glass's lighter frosted fill.
- The 1px `#3d3d3d` outline is decorative (1.72:1); keyboard focus still needs the 2px white ring from the spec (not shown).
