# Theme A: Tonal Dock

Concept 4 "Glass Library" (`../../4-glass-library/`) re-skinned in theme A from `docs/research/14-floating-ui-themes.md`: **Material 3 Expressive on a neutral (grey) seed**. Layout, sizes, content and control counts match Concept 4. Only colors, surfaces, radii, shadows, type weights, icon stroke and control styling changed. Desktop dark mode, 1440×900 at 2×.

## Inspiration

- M3 Expressive floating toolbar, standard and vibrant schemes ([9to5Google](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/))
- Google Photos floating nav pill ([Gadget Hacks](https://android.gadgethacks.com/news/google-photos-floating-bottom-bar-is-now-live-on-android-782/))
- Google's expressive research ([Google Design](https://design.google/library/expressive-material-design-google-research))

## Key tokens (dark)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#131314` | Page and viewer base (surface) |
| `--tile` / `--cell` | `#1C1B1C` / `#201F20` | Type tiles / art cells |
| `--float` | `#2A2A2B` | Dock, capsules, panel, menus, folder tiles |
| `--row` | `#353536` | Search field, tonal pills, Info rows |
| `--text` / `--text-2` / `--text-3` | `#E5E2E3` / `#C4C7C5` / `#939694` | Text |
| `--seg` / `--seg-on` | `#3C4858` / `#D7E3F8` | Selected segment, ⓘ on, Copy |
| `--accent` / `--accent-on` | `#A8C7FA` / `#062E6F` | Download, selection ring and check |
| `--vibrant` / `--vibrant-on` | `#0842A0` / `#D3E3FD` | Selection bar |
| Radii | tile 28, cell 20, dock full, menu 16, row 16/4 | |
| Shadow | `0 1px 3px /.30, 0 6px 16px 4px /.30` | M3 level 3, alphas raised for dark mode |

Lowest text contrast in the rendered frames: `--vibrant-on` on the tinted ✕ button in the selection bar, 5.21:1. Others: text-3 on bg 6.22, text-2 on row 7.19, Download label 7.50, selection bar 7.04, segment 7.18.

**Font.** The spec's Google Sans Flex is not installed here, and nothing is downloaded. The stack is `"Google Sans Flex", "Google Sans", "Roboto Flex", Roboto, "Segoe UI Variable Text", system-ui`, so these PNGs render in **Segoe UI Variable**. Text is 400 for body, 500 for labels and 600 for names. Icons are Concept 4's SVGs at a 2px stroke, not Material Symbols Rounded.

## What is distinct from the glass baseline

- **Opaque surfaces only.** No blur, no hairlines, no gradient page. Surfaces are told apart by tone, so contrast no longer depends on the art underneath.
- **The dock changes scheme.** The library dock is grey with a slate segment pill. In selection mode the same toolbar turns **vibrant blue**, with a pastel Download button inside it.
- **Toolbar plus FAB in the viewer.** The Walk · East chip is its own 64px pill. Download GIF ▾ sits beside it as a 56px extended FAB with a 16px radius, in pastel blue with dark text (7.50:1, where the baseline's white on `#0A84FF` is 3.65:1).
- **Shape states.** ⓘ when on turns from round into a 12px rounded square with a filled icon. Selected cells round up from 20 to 32px and get a 3px pastel ring with a filled check.
- **Segmented Info list.** Separate tonal rows with 2px gaps, 16px outer corners and 4px inner corners. Copy is a tonal pill.
- **Tonal pills in the category dock.** ‹ Library and Select are filled, so they read as buttons next to the "Objects 21" title.

## Weaknesses

- **Flat and a bit dull at rest.** Without the glass glow, the home is grey on grey, and only the art carries it. That suits "art is the hero", but the first impression is plainer than the baseline.
- **Shadows barely work in dark mode.** Tone does most of the separating. The dock over the darker tiles still reads, but less strongly than glass.
- **Reads as Android.** The pastel FAB and the slate segment pill are unmistakably Material. On macOS it may feel foreign.
- **Not Google Sans.** Segoe UI Variable is less round than the spec's font, so the "soft" mood is mostly carried by shapes.
- **Motion is not shown.** The sliding segment, spring morphs and shape morph exist only on paper. Real springs need `linear()` tuning by hand.
- **The vibrant bar is the loudest thing on screen.** Over saturated art (the red potion, the gold ring) it competes. It is meant to signal a temporary mode, but it is heavier than the glass bar.
- **Unrendered frames** (02, 04, 08, 09, 10) are themed in CSS but were not shot or reviewed.

## Files

- `index.html#<frame>` renders one frame from `../../../shared/sample-data.js`. `app.js`, `art.js` and `bbox.js` are copies of Concept 4's. The only `app.js` changes: the `glass` class is renamed `float`, and the selection dock gets a `vibrant` class.
- `style.css` holds the theme.
- PNGs: `01-home`, `03-category-open`, `05-select-mode`, `06-detail`, `07-detail-info`, each a headless Edge screenshot at 1440×900 with deviceScaleFactor 2.
