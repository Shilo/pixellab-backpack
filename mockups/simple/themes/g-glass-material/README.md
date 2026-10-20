# Theme G: Glass, built like Material

Concept 4 "Glass Library" (`../../4-glass-library/`) re-skinned as theme G, the recommendation in [`docs/design/08-simplicity-redesign.md` §15](../../../../docs/design/08-simplicity-redesign.md). It keeps the iOS glass look on every floating surface and applies Material 3 Expressive's rules. Layout, sizes, content and control counts match Concept 4. The one exception is the viewer dock, which splits into a chip and an extended FAB, as in theme A. Desktop dark mode, 1440×900 at 2×.

The CSS is Vitrine's own, in one `style.css` file. GlassKit is not vendored. Its role-token idea (base, sheen, edge, blur) was the reference ([review](../../../../docs/research/15-glasskit-review.md)).

## What comes from where

| From glass (Concept 4) | From Material 3 Expressive (theme A) |
|---|---|
| A translucent, blurred dock, capsules, menus and Info panel (`backdrop-filter: blur(24px) saturate(1.4)`) | A dark base under every glass surface: 78% on the dock and capsules, 88% on menus and the panel. Text contrast comes from the base, not from the art behind it |
| A soft white top highlight, a 1px white hairline, and a faint top sheen gradient | A standard dock for browsing. In selection mode the same toolbar turns **vibrant**: an accent-filled blue glass bar with white labels |
| Pill shapes, the floating ✕ and capsule over the full-screen art, and the calmer graphite and indigo page glow | **One** high-contrast primary action: Download is a pastel tonal fill (`#A8C7FA`) with a dark label (7.4–7.5:1). In the viewer it is a 56px extended FAB with an 18px radius. It keeps a glass edge: a white rim, a top sheen and a soft blue glow |
| Blur on floating surfaces only: 1 layer in the library and selection frames, 3–4 in the viewer. Tiles and cells are plain translucent fills and are never blurred | Visible focus rings: 3px `#A8C7FA` with a 2px offset, and white inside the vibrant bar |
| Folders keep the lighter frosted fill, and types stay darker | Shape cues: ⓘ when on becomes a 12px rounded square with a filled icon. Selected cells round up from 26 to 34px and get a 3px accent ring and a filled check. The Info list is segmented: 2px gaps, 16px outer corners and 4px inner corners |
| | Tonal pills for ‹ Library, Select and Copy, so they read as buttons beside plain text |

## Key tokens (dark)

| Token | Value | Role |
|---|---|---|
| `--base` / `--base-hi` | `rgb(22 24 33 / .78)` / `rgb(24 26 35 / .88)` | Glass base: dock and capsules / menus and panel |
| `--sheen` | `linear-gradient(180deg, white .075 → 0 at 55%)` | Glass top sheen |
| `--edge` | `inset 0 1px 0 white/.16, inset 0 0 0 1px white/.09` | Highlight and hairline |
| `--blur` | `blur(24px) saturate(1.4)` | Floating surfaces only |
| `--text` / `--text-2` / `--text-3` | `#F4F5F9` / `rgb(232 236 246 / .76)` / `/ .58` | Text. Concept 4 used .62 / .40 |
| `--tonal` | `rgb(255 255 255 / .12)` | Selected segment, ‹ Library, Select |
| `--seg-on` / `--seg-on-text` | `rgb(215 227 248 / .20)` / `#E3ECFC` | ⓘ on, Copy, ticked menu row |
| `--accent` / `--accent-on` | `#A8C7FA` / `#062E6F` | Download, selection ring and check, toggle |
| `--vibrant` / `--vibrant-on` | `rgb(12 72 176 / .84)` / `#FFFFFF` | Selection bar |
| `--focus` | `#A8C7FA` (white inside `.vibrant`) | Focus ring, 3px, offset 2px |
| Radii | cell 26 → 34 when selected, tile 28, dock and pills full, menu 20, FAB 18, ⓘ on 12, rows 16/4 | |

## Measured contrast

The ratios are measured in the page, using the same method as theme F. Each text run's colour, alpha included, is composited over the real rendered pixels behind it: the frame is captured again with all text transparent, and every second device pixel inside the run's box is sampled. The table gives the minimum. "Stress" shifts the library down 330 px so the bright map tile (saturated green and dirt) and the UI icon sheet sit under the dock. That frame and the focus frames were rendered for checking only and are not shipped.

| Frame | Lowest text | Ratio |
|---|---|---|
| 01 home | Search placeholder / `/` hint | 6.80 / 7.05 |
| 01 stress | Placeholder / `/` / Library | 5.24 / 6.74 / 7.70 |
| 03 category | "21" in the breadcrumb / cell names | 8.19 / 9.03 |
| 05 selection | Download (dark on pastel) / Add to folder (white on vibrant) | 7.50 / 8.55 |
| 06 detail | Download GIF / "Character" | 7.43 / 9.23 |
| 07 info | Row labels ("Size") / Copy / Open in PixelLab | 6.67 / 8.18 / 9.03 |

- No text run in any frame falls below 4.5:1. For comparison, Concept 4's white-on-`#0A84FF` Download was 3.65:1.
- **Focus rings**, measured as ring pixels against the same pixels unfocused: the Library segment on the dock is at least 7.71:1, Download GIF at least 8.42:1, and the white ring on the vibrant bar's ✕ at least 6.63:1. All three pass the 3:1 minimum.
- **Art is unchanged:** `art.js` and `bbox.js` are Concept 4's, so the art keeps integer, nearest-neighbour scaling (11 device px per art px in the grid, 14 in the viewer). The renderer logged zero non-`file:` requests.

## Weaknesses

- **Less glass over dark content.** At a 78% base, the blur only shows where bright art passes under the dock (see the stress frame). Over the dark home and the viewer stage, the dock reads as a tinted pill with a highlight. That trade is intentional, but the look is quieter than Concept 4.
- **The vibrant bar is the loudest thing on screen.** As in theme A, the blue bar competes with saturated art. It is translucent enough to show colour beneath it, which looks glassy but makes it slightly busier than A's flat bar.
- **Pastel Download.** The tonal primary is legible and clearly the main action, but the pastel blue reads as Material more than iOS. Theme F's `#0A6CDC` with white text (5.01:1 or better) would feel more Apple, at a lower contrast margin.
- **Three icon-only controls** (✕, ♡, …) stay quiet glass. That suits the "art is the hero" rule, but they are less obvious than theme A's tonal shapes.
- **Static only.** These frames do not show spring motion, shape morphing on press, hover, `prefers-reduced-transparency` / `forced-colors` fallbacks, or the dock role switches.
- **Unrendered frames** (02, 04, 08, 09, 10) are themed in CSS but were not shot or reviewed.

## Files

- `index.html#<frame>` renders one frame from `../../../shared/sample-data.js`. `app.js`, `art.js` and `bbox.js` are copies of Concept 4's, with the image path fixed to `../../../shared/assets/`. The only `app.js` change is a `vibrant` class on the selection dock.
- `style.css` holds the theme.
- PNGs: `01-home`, `03-category-open`, `05-select-mode`, `06-detail`, `07-detail-info`. Each is a headless Edge screenshot at 1440×900 with deviceScaleFactor 2.
