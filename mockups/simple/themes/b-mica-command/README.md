# Theme B: Mica Command (Concept 4 layout)

Concept 4 "Glass Library" (`../../4-glass-library/`) re-skinned in theme concept B from [doc 14](../../../../docs/research/14-floating-ui-themes.md): Microsoft Fluent 2 / Windows 11, solid surfaces. Layout, tile and cell sizes, content and control counts are unchanged. Desktop dark mode, 1440×900 at 2×.

Inspiration: [Fluent 2 materials](https://fluent2.microsoft.design/material), [Fluent 2 elevation](https://fluent2.microsoft.design/elevation), [Windows 11 geometry](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry), and the Windows 11 Settings card layout.

## Images

`01-home.png`, `03-category-open.png`, `05-select-mode.png`, `06-detail.png`, `07-detail-info.png` (same frames as Concept 4; render any other frame with `index.html#<frame>`).

## Key tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#202020` + ~3% cool wash | Mica-like page base |
| `--tile` / `--cell` | `#2B2B2B` / `#323232` | Type cards and grid cells / mosaic slots |
| `--float` | `#2C2C2C` | Command bar, capsules, menus, info pane (opaque, no blur) |
| `--card` | white 5% | Settings cards inside the pane |
| `--stroke` | white 8%, white 14% top edge, plus a 1px black 35% outer edge on floating chrome | Surface stroke |
| `--text-1/2/3` | `#FFFFFF` / `#C5C5C5` / `#9D9D9D` | Text levels |
| `--accent` | `#60CDFF` on `#000000` | Download, selection, "current" pill, hyperlink |
| `--shadow-float` / `--shadow-menu` | shadow28 / shadow16 | Floating chrome / menus |
| Radii | 8px containers, 4px controls | Windows 11 geometry |
| Font | Segoe UI Variable Text / Display (system font, nothing loaded) | All UI |

Computed contrast: text-1/bg 16.29, text-2/bg 9.44, text-3/bg 6.01, text-2 on pane cards 6.90, search placeholder 6.59, kbd hint 5.38, accent link on pane 7.76, black on accent 11.67.

## What is distinct from the glass baseline

- **Solid, not glass.** No backdrop blur anywhere; contrast no longer depends on the art underneath. Overlays use a flat Smoke scrim.
- **Command bar, not a pill.** The dock is an 8px rectangle, 48px tall (glass: 62px pill), with 4px-radius subtle buttons. "Library" carries a 3×16px accent pill, as in Windows navigation. Search is a TextBox with a strong bottom stroke (2px accent when focused).
- **True SplitButton.** Download GIF and its chevron are two touching halves with square inner corners and a 1px divider. Walk · East is a ComboBox.
- **GridView selection.** Selected cells get a 2px accent ring with an inset gap and an accent square CheckBox; the others show empty square boxes (glass: white ring and round checks).
- **Settings-card info pane.** Every fact is its own 4px card, 2px apart; section headers are BodyStrong; Copy is a standard button; Open in PixelLab is an accent hyperlink.
- **ⓘ on** shows the Filled icon plus the accent pill (glass: inverted white disc).
- Fluent-weight 1.5px icon strokes, tighter type (14/20 body, Display cut for titles).

## Code changes beyond `style.css`

- `app.js`: the viewer's Download button became two buttons in a `.splitbtn` wrapper (still one control), and the 08 download menu anchors to `.splitbtn`.
- `index.html`, `art.js`: paths point to `../../../shared/`. `bbox.js` is unchanged.
- The `.glass` class name is kept as the markup hook; here it means a solid Fluent surface.

## Weaknesses

- **It looks like Windows Settings.** Precise and calm, but more utility than gallery; 8px cards feel boxy next to Concept 4's softness and do little to celebrate the art.
- **Same-tone surfaces.** The command bar (`#2C2C2C`) sits on cards of nearly the same grey (`#2B2B2B`); it separates only through the shadow and the dark outer edge. A slightly lighter bar would read faster but leaves the spec.
- **Accent creep.** The spec's "current" pill, selection ring, CheckBoxes and hyperlink add accent beyond doc 14's "Download and selection only" rule. The library home now shows one small accent mark.
- **Windows-only font.** Segoe UI Variable falls back to Segoe UI or system-ui on macOS, Linux and mobile; Selawik would be needed for identical metrics.
- **Flat Mica.** The 3% wash is barely visible; real Mica's wallpaper tint and Acrylic's noise are not reproduced.
- **Dock height changed** from 62px to the spec's 48px, so the bar is narrower and shorter than the glass dock (all other layout values match).
