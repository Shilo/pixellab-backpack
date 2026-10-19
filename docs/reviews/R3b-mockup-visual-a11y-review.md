# R3b: Mockup visual and accessibility review (options A, B, C)

Review date: 2026-10-18. Reviewer role: independent senior visual designer and accessibility specialist. I did not build the mockups.

Inputs:
- The three interactive mockups (`mockups/option-a-quiet-studio/`, `mockups/option-b-gallery-wall/`, `mockups/option-c-soft-pixel-workbench/`) with their READMEs and demo shortcuts.
- `docs/design/04-design-options.md` (tokens, contrast tables, layouts), `docs/research/08-visual-design-theming-responsive.md` (themes, backdrops, layout matrix), `docs/research/06-pixel-art-rendering-animation-and-export.md` (crisp rendering rules R1–R7).

Scope: visual quality, pixel-art presentation, theming, responsiveness and accessibility. Behaviour and copy (02) are out of scope except where they change what the user sees.

---

## Summary verdict

1. **Build on A's shell and visual language, re-tuned:** lift the dark theme toward C's softer mid-dark, give art one neutral surface shared by the grid and the viewer, and use light-gray wells in light mode. A passed the most viewports and is the most intuitive. The proposed token block is in [Recommended direction](#recommended-visual-direction).
2. **Art comes first on C, but at a cost.** C shows 3–5× more art per screen and has the best inspection tools (always-on stage, filmstrip, selection summary). But its 88–96 px desktop cells turn 128 px characters into smooth, non-crisp overviews: 38 of the 72 visible thumbnails at 1920×1080@1, against 8 in A and 6 in B. Its amber accent and default checker backdrop also compete with the art.
3. **B is the prettiest page on a light desktop and the weakest gallery elsewhere.** Its phone shelves show 2–6 thumbnails under 34–49% chrome, it leaves about 700 px empty on each side at 3440 px, its plum accent turns candy pink in dark mode, and its fixed 44 px card labels clip at 200% text.
4. **Crispness is not a differentiator.** All three passed the in-page integer-scale audit: 0 violations in 204 page states. Device-pixel seams in screenshots appear only where art × k / DPR is not a whole CSS pixel, and they come from the shared engine and emulation behaviour, not from any one option.
5. **Accessibility basics hold:** 0 failing text-contrast pairs, 0 unlabeled controls, and correct reduced-motion behaviour. The real gaps are shared:
   - Some targets are smaller than 24 px, and some coarse-pointer targets are smaller than 44 px.
   - Safe-area insets are ignored in the landscape viewers.
   - 200% text breaks A's top bar and B's card labels.
   - "Current" and "focus" look the same in A and C.

---

## Method

**Engine.** I ran my own headless Microsoft Edge 155 instance, driven through the Chrome DevTools Protocol from a small Python script. It ran on a private port with a throwaway profile and was shut down afterwards. For every capture:
- `Emulation.setDeviceMetricsOverride` set the exact CSS viewport and device-pixel ratio (DPR).
- `Emulation.setTouchEmulationEnabled` set coarse-pointer phones and tablets. I confirmed with `matchMedia` that `(pointer: coarse)` matched and `(hover: hover)` did not.
- `Emulation.setEmulatedMedia` set `prefers-color-scheme` (light and dark through the system path, not `&theme=`), `prefers-reduced-motion` and `forced-colors`.
- `Page.setFontSizes` doubled the default font size (16 → 32 px) for the 200% text test.
- `Emulation.setSafeAreaInsetsOverride` set the notch insets: 47/34 in portrait, 47/47 left/right plus 21 bottom in landscape.

**Matrix.** 17 viewports × 3 options × {library, viewer/detail} × {light, dark} = **204 captures**, each with an in-page measurement pass. The demo URLs were:

| | Library | Viewer / detail |
|---|---|---|
| A | `?demo=library` | `?demo=viewer&asset=android-courier` |
| B | `?demo=home` (shelves) | `?demo=detail&asset=0` |
| C | `?demo=library` | `?demo=stage&asset=android-courier` |

Viewports (CSS px @ DPR; touch below 1366 wide): 320×640@2, 360×780@3, 390×844@3, 412×915@2.625, 844×390@3, 673×841@2.625, 768×1024@2, 820×1180@2, 1024×1366@2, 1180×820@2 (coarse), 1366×768@1.25, 1440×900@2, 1920×1080@1, 2560×1440@1, 3440×1440@1, 2560×1080@1, 1080×1920@1.

**Extra runs:**
- A viewer DPR sweep at 1280×800: DPR 1, 1.25, 1.5, 1.75, 2, 2.25, 2.625 and 3, for character, tileset, Tiles Pro and UI assets, on a solid Mid gray backdrop.
- A library thumbnail audit at 1366×768, DPR 1.25, 1.5 and 2.625.
- A live DPR change, without a reload.
- Animation cadence, through a `drawImage` timestamp hook, with and without reduced motion.
- Keyboard focus rings.
- The selected and current states.
- Forced colors.
- 200% text at 390×844 and 1440×900.
- 200% browser zoom (1440×900 → 720×450@2).
- Safe areas.
- Big assets (map, UI kit, Tiles Pro) on desktop and phone.
- A full rendered-contrast dump at 1440×900 in both themes.

**What the in-page script measured:**
- **Integer-scale audit:** every visible, unoccluded `<img>` and `<canvas>`. k = content-box size × DPR ÷ natural size.
  - OK: k is a whole number (±0.02) and `image-rendering` is `pixelated`.
  - Smooth overview: k < 1 with `image-rendering: auto`.
  - Bad: anything else (uneven scale, a blurred upscale, or a nearest-neighbour downscale).
- **Screenshot device-pixel audit:** for up to 3–10 art elements per capture (k ≥ 2), I took the share of colour edges that land on the k-pixel grid, in the central 70% × 60% of the element (the corners hold badges). A share below 0.98 counts as a seam, meaning one art row or column is k ± 1 device pixels.
- **Rendered contrast:** each text node's computed colour, composited over its chain of ancestor backgrounds (including opacity), normalized to sRGB through a 1 px canvas, then WCAG 2.x ratios.
- **Effective hit area:** `elementFromPoint` probing outwards from the element's centre. It covers pseudo-element hit areas and is capped at 81 px.
- **Other checks:** horizontal overflow and escaped elements, first-row column count, visible thumbnail count, accessible names of interactive elements, and the share of fixed/sticky chrome.

**Caveats (read before quoting numbers):**
- CDP's device-scale emulation lays out in CSS-pixel units: rects are quantized to 1/64 CSS px. Chrome on Windows and Android lays out in device pixels ("zoom-for-DSF"). The seam pattern below therefore needs confirming on real DPR 1.25 and 2.625 hardware (research 06 R3 already lists this as a gap).
- Under emulation, the `(resolution: Xdppx)` media query does not fire `change`. I confirmed this with a probe listener. The live-DPR refit behaviour could not be verified.
- Captures can catch a crossfade mid-way. One forced-colors capture showed "dimmed art" in A. A re-test with `paused=1` and a 3 s settle showed identical pixel values, so I discarded that observation.
- The pixel face file is absent, so C's "pixel numerals" render in Cascadia Mono. None of the three trims transparent padding (the known `file://` limit), so visual-weight findings assume untrimmed canvases.
- Screenshots are kept outside the repository. Only file names are cited below:
  - Matrix: `{option}-{lib|view}-{viewport}@{dpr}-{light|dark}.png`
  - Extra runs: `focus-…`, `state-…`, `forced-…`, `text200-…`, `zoom200-…`, `safe-…`, `asset-…`, `crisp-…`

---

## Per-option visual critique

### A — "Quiet Studio"

**5-second impression**
- *Phone* (`A-lib-390x844@3-dark.png`): "A photo-library app. Three columns of art and a floating pill, and I know how it works."
- *Desktop* (`A-lib-1440x900@2-dark.png`): "Calm and organized, but there's a big empty panel on the right."

**Strengths**
- **The most familiar, least surprising layout at every size.** It uses a sidebar ≥ 1200, a rail from 600 to 1199 and a pill on the phone. It passes 12 of the 17 viewports, against 8 each for B and C (see the [matrix](#responsiveness-matrix)).
- **Good hierarchy in the grid.** Caption (title 13–14/500) plus meta (12 px, text-3) under each card, tonal surfaces, hairlines instead of boxes, and no card shadows (`A-lib-1440x900@2-light.png`). It reads "designed", not "template".
- **The viewer is the best balanced of the three.** It has a large stage, the inspector docked at 340–360, a two-row dock, and nothing over the art (`A-view-1440x900@2-light.png`, `A-view-1440x900@2-dark.png`). In light mode the N8 stage beside the white panel looks like Apple Photos.
- **The one blue accent is used sparingly.** It appears on the checked chip, Download and the selected ring. On selection, the ring plus a filled check reads clearly in both themes (`state-A-light-1.png`, `state-A-dark-1.png`).
- **The floating pill and round search button on phones look modern** and stay out of the art's way (`A-lib-360x780@3-light.png`).

**Weaknesses**
- **The dark surfaces collide.**
  - The card stage (0.19) equals `--surface-1` (0.19): **1.00:1**.
  - The viewer's dark "Stage" (0.22) against the inspector (`--surface-2`, 0.23) is **1.03:1**, so the stage doesn't read as a lit area (`A-view-1440x900@2-dark.png`).
  - On a 0.16 page, black sprite outlines vanish into 0.19 cards (black on the card is 1.14:1). The Fuse Bomb and Iron Helmet lose their silhouettes (`A-lib-1440x900@2-dark.png`).
- **Light cards are white on near-white: 1.03:1.** The cards dissolve into the page, and white sprites lose their body fill: the White Bird on a 0.995 card (`A-lib-3440x1440@1-light.png`).
- **The empty inspector takes 340 px.** At 1366×768 it leaves 4 columns × 172 and 12 thumbnails (`A-lib-1366x768@1.25-dark.png`), and at 3440 px it is a tall empty column (`A-lib-3440x1440@1-dark.png`).
- **The viewer dock stretches to the full stage width.** At 3440 px the accent-filled scrubber is about 3,000 px long, and it is the most saturated thing on screen (`A-view-3440x1440@1-dark.png`). In general the blue scrubber fill competes with blue sprites, such as the Android Courier's navy armour.
- **Compact height uses the L size.** The default switches at 840 px wide, so 844×390 gets 4 cards × 181 and one visible row (8 thumbnails) (`A-lib-844x390@3-dark.png`).
- **The landscape viewer's right capsule clips the zoom − and + controls** at the edge of the capsule (`A-view-844x390@3-dark.png`).
- **On the phone Tiles Pro viewer, `tile_0…tile_15` labels sit over 16 px tiles.** This is chrome on the art (`asset-A-tp-phone-dark.png`).
- **At 320 px the title truncates to "Libr…"** and "2 in PixelLab" is clipped (`A-lib-320x640@2-light.png`).
- **At the 1080×1920 portrait monitor, the viewer docks the inspector on the right.** The stage is 612 px wide and the art is only 4× on a mostly empty, very tall stage (`A-view-1080x1920@1-dark.png`).

### B — "Gallery Wall"

**5-second impression**
- *Phone* (`B-lib-390x844@3-light.png`): "A nicely typeset page. Where is my art? Two small thumbnails."
- *Desktop* (`B-lib-1440x900@2-light.png`): "An exhibition or app-store shelf. Handsome and curated, but only 12 assets above the fold."

**Strengths**
- **The most editorial and premium look on a light desktop.** It has serif headings (Sitka on Windows), monochrome inverted chips and a warm paper wall. The detail page is the most beautiful screen in the review: kicker plus large serif title, download formats as tiles, an inline 3×3 compass, and the stage toolbar inside the stage (`B-view-1440x900@2-light.png`).
- **The whole-card focus ring (mat plus label, offset 4) is the clearest focus treatment** of the three (`focus-B-light-0.png`).
- **The phone detail page has a big, half-height stage** with a sticky actions row (`B-view-360x780@3-light.png`).
- **The flat grid ("See all", chips) is clean and well spaced** (`state-B-light-1.png`).

**Weaknesses**
- **The phone library is chrome-heavy and art-light.**
  - 320×640: 1 card per shelf row and 2 thumbnails on screen, with **49%** fixed/sticky chrome.
  - 390×844: 5 thumbnails, **37%** chrome (`B-lib-320x640@2-light.png`, `B-lib-390x844@3-light.png`).
  - A 128 px goblin sits at k = 1 in a 148 px mat.
- **Plum turns candy pink in dark mode.** The accent is `oklch(0.78 0.11 345)`, so the Download button, heart and selection are bubblegum on a warm brown-black. At 1024×1366 the full-width Download bar is the loudest object on the page (`B-view-1024x1366@2-dark.png`, `B-view-360x780@3-dark.png`). Contrast passes (8.69:1). The art no longer leads.
- **Content is capped at 2048 px while the nav spans the full width.** At 3440 px that leaves about 700 px empty on each side and the logo misaligned with the content. A 3-item shelf leaves a huge gap (`B-lib-3440x1440@1-light.png`).
- **Landscape tablets get a short stage.** The info column appears only at ≥ 1200, so at 1180×820 the stage is about 400 px tall and the title sits at the fold (`B-view-1180x820@2-light.png`).
- **The dark detail stage defaults to N5 mid gray.** That is colour-honest but a bright, heavy slab, 4.06:1 against the page (`B-view-1440x900@2-dark.png`).
- **The phone transport wraps:** "8 fps" drops to its own row at 360, and "7 / 8" wraps at 320 (`B-view-320x640@2-dark.png`).
- **The fixed 44 px card label clips the second line at 200% text** (`text200-B-lib-desk.png`, `text200-B-lib-phone.png`). See the [accessibility findings](#accessibility-findings).
- **The serif varies by operating system.** On Windows it falls to Sitka Text; on Apple systems it is New York or Charter. Mono captions in Cascadia under every card read "spec sheet" more than "wall label".

### C — "Soft Pixel Workbench"

**5-second impression**
- *Phone* (`C-lib-390x844@3-light.png`): "A sprite sheet. Lots of art at once, and the orange is loud."
- *Desktop* (`C-lib-1440x900@2-dark.png`): "A pro tool. My asset is huge on the right and everything else is dense. Busy, but powerful."

**Strengths**
- **The art is literally the hero on desktop.** The always-on stage shows the current asset at 3–6.5× with the compass and filmstrip beside it (`state-C-light-0.png`, `C-view-2560x1080@1-dark.png`). At 3440 px the stage pane grows to about a third of the width (`C-lib-3440x1440@1-light.png`), the best use of ultrawide space in the review.
- **The highest density everywhere.** On phones it shows 28 thumbnails against A's 15 and B's 5. At 844×390 it shows 9 columns and 36 thumbnails (`C-lib-844x390@3-dark.png`), the only landscape-phone layout where browsing works.
- **The filmstrip** (`C-view-390x844@3-light.png`) **and the selection summary** (mosaic, counts, stacked actions; `state-C-light-1.png`) are the two best new components in any option.
- **The mid-dark slate** (0.235) feels softer and more contemporary than A's near-black.
- **Portrait safe areas are handled best.** No viewer control falls inside the 47/34 insets.

**Weaknesses**
- **Density breaks crispness.** M cells of 88–96 px cannot fit an untrimmed 128 px canvas at k ≥ 1, so on DPR 1 desktops the goblin, the Android Courier, the Hooded Orb Mage and the skill sheets become smooth "FIT" overviews: 38 of 72 thumbnails at 1920×1080@1 and 20 of 57 at 1440×900@2. A smooths 8 and B 6, all of them 512 px atlases (`C-lib-1920x1080@1-dark.png`, `C-lib-2560x1080@1-dark.png`). At ultrawide sizes the spec's forced column counts (15 at M) shrink cells to 88 px even though space is plentiful.
- **The narrow stage pane is too small for big assets.** At 1440×900 the 768×512 map and the 688 px HUD render at 0.5× smooth, while A and B show them at 1× (`asset-C-map-desk-dark.png`, `asset-C-ui-desk-light.png`).
- **Amber is the loudest element in light mode.** The "All" chip and Download are saturated orange blocks (`C-lib-390x844@3-light.png`). Amber rings and hearts sit next to the torch, the coin pouch and the chest gold (`state-C-dark-1.png`). The light amber fill is 2.33:1 on the page, so the spec rightly moved text and rings to a brown (`oklch(0.47 0.11 58)`), which then reads as a different colour from the fill.
- **The default viewer backdrop is the checker.** It is busy behind small sprites, which research 08 warns against.
- **Square boxes everywhere** (3 px radius, 1 px borders on every control) look utilitarian rather than modern. On the 320 px stage screen the filmstrip overflows and "Open" wraps (`C-view-320x640@2-dark.png`).
- **The stacked tablet-portrait layout** (stage over sheet) leaves the grid only part of the screen at 673–820 px wide (`C-lib-673x841@2.625-dark.png`, `C-lib-768x1024@2-light.png`). At 1024×1366 the stage pane is about 390 px wide and the art is small (`C-view-1024x1366@2-light.png`). At 1080×1920 the tall stage leaves the art floating in empty checker (`C-lib-1080x1920@1-dark.png`).
- **The pixel numerals and the uppercase 11 px mono labels** (DESCRIPTION, FRAME SIZE) are fixed pixel sizes that don't grow with text size, and the face isn't actually pixel in the mockup.

---

## Pixel-crispness measurements

### Matrix: integer-scale audit and device-pixel seams

- **Bad** = in-page integer-scale violations, summed over library + viewer in both themes.
- **Seams** = sampled art elements whose share of on-grid edges is below 0.98.
- C's viewer column is omitted because its default checker backdrop pollutes the edge analysis. The solid-backdrop sweep below covers C's stage.

| Viewport | DPR | A bad | A seams (thumbs) | A seams (viewer) | B bad | B seams (thumbs) | B seams (viewer) | C bad | C seams (thumbs) |
|---|---|---|---|---|---|---|---|---|---|
| 320×640 | 2 | 0 | 2/6 ¹ | 0/2 | 0 | 0/0 | 0/2 | 0 | 0/6 |
| 360×780 | 3 | 0 | 0/6 | 2/2 | 0 | 6/6 | 2/2 | 0 | 0/6 |
| 390×844 | 3 | 0 | 6/6 | 0/2 | 0 | 6/6 | 0/2 | 0 | 6/6 |
| 412×915 | 2.625 | 0 | 4/6 | 0/2 | 0 | 6/6 | 2/2 | 0 | 2/6 |
| 844×390 | 3 | 0 | 0/6 | 0/2 | 0 | 4/6 | 0/2 | 0 | 0/6 |
| 673×841 | 2.625 | 0 | 0/6 | 2/2 | 0 | 2/6 | 0/2 | 0 | 0/8 |
| 768×1024 | 2 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 820×1180 | 2 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 1024×1366 | 2 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 1180×820 | 2 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 1366×768 | 1.25 | 0 | 2/6 | 0/2 | 0 | 6/6 | 2/2 | 0 | 0/8 |
| 1440×900 | 2 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 1920×1080 | 1 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| 2560×1440 | 1 | 0 | 0/6 | 0/2 | 0 | 0/4 | 0/2 | 0 | 0/8 |
| 3440×1440 | 1 | 0 | 0/6 | 0/2 | 0 | 0/2 | 0/2 | 0 | 0/8 |
| 2560×1080 | 1 | 0 | 0/6 | 0/2 | 0 | 0/4 | 0/2 | 0 | 0/8 |
| 1080×1920 | 1 | 0 | 0/6 | 0/2 | 0 | 0/6 | 0/2 | 0 | 0/8 |
| **Total** | | **0** | 14/102 | 4/34 | **0** | 30/88 | 6/34 | **0** | 8/126 |

¹ The floating phone pill overlaps the sampled Wooden Stairs Kit card at 320×640. This is an overlay artifact, not a scaling defect.

### Viewer DPR sweep (1280×800, Mid gray backdrop, character asset; k = device px per art px)

✓ = no seam; ✗ = seam, with the lowest on-grid share in brackets.

| DPR | A k | A | B k | B | C k | C | art × k / DPR whole CSS px? (A / B / C) |
|---|---|---|---|---|---|---|---|
| 1 | 4 | ✓ | 3 | ✓ | 2 | ✓ | yes / yes / yes |
| 1.25 | 5 | ✓ | 4 | ✓ ² | 3 | ✗ (0.62) | yes / no / no |
| 1.5 | 6 | ✓ | 5 | ✗ (0.54) | 3 | ✓ | yes / no / yes |
| 1.75 | 8 | ✗ (0.56) | 6 | ✓ ² | 4 | ✗ (0.63) | no / no / no |
| 2 | 9 | ✓ | 7 | ✓ | 5 | ✓ | yes / yes / yes |
| 2.25 | 10 | ✗ (0.54) | 8 | ✓ ² | 5 | ✗ (0.63) | no / no / no |
| 2.625 | 12 | ✗ (0.97) | 9 | ✗ (0.71) | 6 | ✗ (0.70) | no / no / no |
| 3 | 13 | ✗ (0.69) | 11 | ✗ (0.80) | 7 | ✗ (0.55) | no / no / no |

² The box is fractional but no seam was seen. The single shortened row fell outside the sampled central region.

**Reading the two tables**
- **The implementation is correct in all three.** There were 0 integer-scale violations across 204 states, plus the sweep.
- **A seam never appeared where the art's CSS size is a whole pixel.** Where the CSS size is fractional (DPR 1.25, 1.5, 1.75, 2.25, 2.625, or DPR 3 with k not divisible by 3), one art row or column often renders k ± 1 device pixels. This matches CSS-pixel snapping in the CDP emulation. The differences between options only reflect which k values each layout produces. Production check: verify on real Windows 125% and Android 2.625 devices. If seams appear there, draw the viewer stage on a canvas sized from `devicePixelContentBox`, at integer k inside (research 06 R3/R4).
- **On a live DPR change without a reload, all three left thumbnails at the old size:** 5–30 elements became uneven or nearest-neighbour downscales. Under emulation the `resolution` media query never fired, so this is unverified for real browsers. All three refit only on that event, so also refitting on `resize` is cheap insurance.

### Smooth overviews (k < 1) among visible thumbnails, default size

| Viewport | A | B | C |
|---|---|---|---|
| 1920×1080@1 | 8 (all ≥ 256 px atlases) | 6 (atlases, map, HUD, 232 px mage) | **38** (incl. 128 px goblin, courier, farming icons) |
| 1440×900@2 | 3 | 5 | 20 |
| 390×844@3 | 2 | 5 | 5 |

### Other presentation checks

- **Playback.** All three run at exactly 8 fps (mean frame interval 125.0, 125.0 and 124.7 ms; the 115–135 ms range is 60 Hz frame quantization). They redraw only when the frame changes: 24–25 draws in 3 s.
- **Visual weight.** Untrimmed canvases make characters look tiny next to 32 px items (k = 2 for the goblin against k = 10 for the torch on `A-lib-390x844@3-dark.png`). This affects all three and is worst in C, where those characters are also smoothed. Trimming (union bounding box) is required before shipping.
- **Backdrop neutrality.** Every card stage has chroma 0. In the viewer:
  - A: N8 in light, 0.22 in dark (too close to the panel).
  - B: N8 in light, N5 in dark (heavy).
  - C: checker (busy).

---

## Contrast measurements (rendered)

All values are WCAG 2.x ratios measured from the rendered colours at 1440×900@2 (the matrix covered every viewport). Values marked * are computed from the option's tokens because the role had no rendered sample in the captured states.

| Role (example) | A light | A dark | B light | B dark | C light | C dark |
|---|---|---|---|---|---|---|
| Primary text: page and asset titles, wordmark | 17.00 | 17.35 | 16.14 | 15.59 | 15.16 | 14.48 |
| Secondary: chips at rest, nav labels, meta | 7.64–8.11 | 7.85–9.05 | 8.60 | 9.64 | 9.03 | 9.54 |
| Tertiary, lowest seen: field labels, keycap, position | **4.96** | 5.83 | 5.30 | 6.06 | 6.19 | 6.66 |
| Badge chip on a card ("▶ 8 frames") | 7.03 | 6.79 | 9.07 | 9.05 | 7.33* | 6.44 |
| Accent / link text | 5.20 | 7.37 | 6.55* | 8.61* | 5.94* | 9.40* |
| Primary button label on accent (Download) | 5.62 | 8.24 | 6.87 | 8.69 | 6.81 | 10.30 |
| Checked chip / active row label | 12.85 | 11.69 | 16.14 | 15.59 | 12.29 | 9.78 |
| **Failing text pairs, all 204 captures** | **0** | **0** | **0** | **0** | **0** | **0** |

Non-text pairs (computed from tokens). These decide whether the art surface and the states read at all:

| Pair | A | B | C | Proposed (below) |
|---|---|---|---|---|
| Card art surface vs page, light | 1.03 | 1.06 | 1.13 | 1.09 |
| Card art surface vs page, dark | 1.05 | 1.07 | 1.09 | 1.14 |
| Card art surface vs adjacent panel, dark | **1.00** (0.19 vs surface-1) | — | — | 1.10 |
| Viewer stage vs adjacent panel or page, light | 1.53 | 1.57 | 1.13 (checker by default) | 1.55 |
| Viewer stage vs adjacent panel or page, dark | **1.03** | 4.06 (N5 slab) | 1.09 (checker by default) | 1.14 |
| Selected ring vs card surface, light | 5.70 | 6.94 | 6.68 | 4.67 (accent); current ring 15.5 |
| Selected ring vs card surface, dark | 8.09 | 8.03 | 8.63 | 7.49 (accent); current ring 14.3 |
| Accent fill vs page, light | 5.54 | 6.55 | **2.33** | 5.11 |
| Black sprite outline vs card, dark | 1.14 | 1.24 | 1.37 | 1.31 (Mid gray one tap away) |

**Focus rings.** All three draw a 2 px accent outline, offset 2, over a 6 px `--bg` halo (C uses a 4 px halo on cells). The ring is visible on every surface in both themes (`focus-A-*.png`, `focus-B-*.png`, `focus-C-*.png`), and under forced colors it switches to `Highlight`.

**Selected vs current.** "Selected" adds a filled check, so it never relies on colour alone in any option. But A and C draw "current" and "focus" as the same accent ring and differ only in geometry (inset vs outset), and B has no current state. The fix is in [component notes](#component-styling-notes).

---

## Responsiveness matrix

Each cell gives the verdict, the number of thumbnails visible in the first library viewport (dark theme), then a note.

| Viewport | A | B | C |
|---|---|---|---|
| 320×640@2 | **Issue** · 6 · the title truncates to "Libr…" and the in-progress chip is clipped | **Issue** · 2 · one card per row, 49% chrome, the result line wraps | **Pass** · 12 · the stage screen's filmstrip overflows and "Open" wraps |
| 360×780@3 | **Pass** · 15 | **Issue** · 5 · 40% chrome; the transport wraps "8 fps" | **Pass** · 28 |
| 390×844@3 | **Pass** · 15 | **Issue** · 5 · 37% chrome | **Pass** · 28 |
| 412×915@2.625 | **Pass** · 15 | **Issue** · 6 · 34% chrome | **Pass** · 45 (11 smooth) |
| 844×390@3 | **Issue** · 8 · L default (4 × 181, one row); the viewer capsule clips zoom | **Issue** · 5 · 44 px chips and the title fill the first screen | **Pass** · 36 · 9 columns; immersive stage |
| 673×841@2.625 (fold) | **Pass** · 20 · rail, 4 columns | **Pass** · 8 | **Issue** · 19 · the stacked stage leaves a small grid window |
| 768×1024@2 | **Pass** · 30 | **Pass** · 11 | **Issue** · 29 · stacked layout |
| 820×1180@2 | **Pass** · 48 | **Pass** · 11 | **Issue** · 36 · stacked layout |
| 1024×1366@2 | **Pass** · 30 | **Pass** · 18 · full-width pink Download bar in dark | **Issue** · 57 · stage pane about 390 px; small art |
| 1180×820@2 (coarse) | **Pass** · 18 · slider 16 px tall on coarse | **Issue** · 12 · single-column detail; short stage | **Pass** · 37 |
| 1366×768@1.25 | **Issue** · 12 · empty inspector → 4 columns | **Pass** · 12 | **Issue** · 50 · three cramped panes; 20 smooth |
| 1440×900@2 | **Pass** · 20 · empty inspector by default | **Pass** · 12 · best detail page | **Pass** · 57 · the HUD and map are smooth at 0.5× in the stage |
| 1920×1080@1 | **Pass** · 40 | **Pass** · 19 | **Issue** · 72 · 38 smooth thumbnails |
| 2560×1440@1 | **Pass** · 71 | **Issue** · 32 · 2048 cap; nav misaligned | **Issue** · 72 · 15 forced columns × 88 px |
| 3440×1440@1 | **Issue** · 71 · controls about 2,500 px apart; 3,000 px scrubber | **Issue** · 34 · about 700 px empty on each side | **Pass** · 72 · big stage pane |
| 2560×1080@1 | **Pass** · 60 | **Issue** · 22 · 2048 cap | **Issue** · 72 · 88 px cells, smooth |
| 1080×1920@1 (portrait monitor) | **Issue** · 54 · viewer stage 612 px wide, art 4× | **Pass** · 23 · tall detail stage | **Issue** · 72 · tall, narrow stage; small art |
| **Pass count** | **12 / 17** | **8 / 17** | **8 / 17** |

Other checks, all options:
- **No horizontal page overflow and no escaped elements** in any of the 204 captures, at 200% text, or at 200% browser zoom (720×450@2: A 13 integer-fit + 2 smooth, B 4 integer-fit, C 27 integer-fit + 6 smooth).
- **Column counts are sane** and never exceed the 16 cap. A: 2–16; B: 1–11; C: 3–16.

---

## Accessibility findings

Severity:
- **High**: an AA failure or likely AA failure, or a broken task for an assistive-technology user.
- **Medium**: a policy miss (44 px touch, safe area, forced colors) or confusing state.
- **Low**: polish.

| # | Severity | Finding | Where |
|---|---|---|---|
| 1 | High | **Targets below 24 px (WCAG 2.5.8).** Effective hit areas: the sync-status trigger in all three ("Synced…": A 38×18–20, B 38×23, C 38×18 and 81×18); A's grid-size slider, 16 px tall, plus its ± buttons at 28×28 on coarse tablets; B's breadcrumb "Library" link at 38×17; the B and C wordmark links at 22 px tall. Some may qualify for the spacing exception; enlarge them anyway. | Matrix a11y pass, coarse viewports |
| 2 | High | **200% text breaks layout (1.4.4).** A: the search field disappears from the 1440 top bar, inspector labels overlap their values ("Directions4 · S, E, N, W"), the phone title shrinks to "L." and the pill labels collide with the search button. B: the fixed 44 px card label cuts off the second line, and the phone result line overlaps the chip. | `text200-A-lib-desk.png`, `text200-A-view-desk.png`, `text200-A-lib-phone.png`, `text200-B-lib-desk.png`, `text200-B-lib-phone.png` |
| 3 | Medium | **The 44 px coarse-pointer policy is missed.** A's chips are 36 px effective (the spec promised a 44 px hit area; `margin` doesn't extend hits) and its inspector actions are 36 px. The scrubbers are 24–28 px tall in all three. C's filmstrip cells are 40 px and C's search is 30 px on tablets. | Matrix a11y pass |
| 4 | Medium | **Safe areas.** In landscape (47 px side insets, 21 px bottom inset), the stage-edge ‹ › buttons sit about 10 px from the edge, inside the notch inset, in all three viewers. A's dock capsules sit 12 px above the bottom edge, and C's top capsule is 13 px from the left edge (12 controls in A and 15 in C fall inside an inset). In portrait, A's viewer-sheet actions sit 18 px above the bottom edge (34 px inset), and A's and B's top bars don't pad `safe-area-inset-top` (C's do), which matters when the page runs standalone. | `safe-A-view-land.png`, `safe-B-view-land.png`, `safe-C-view-land.png`, `safe-A-view-port.png` |
| 5 | Medium | **Forced colors.** A's six backdrop swatches lose their fills, and only the checked ring stays visible. B and C keep theirs. In all three the stage itself keeps its backdrop (`forced-color-adjust: none`), and chips and cards keep their borders. | `forced-A-view.png` vs `forced-B-view.png`, `forced-C-lib.png` |
| 6 | Medium | **Current and focus look alike.** A and C both use a 2 px accent ring, so with the keyboard you can't tell the focused card from the current card when they differ. | `state-C-light-0.png`, `focus-C-light-0.png` |
| 7 | Low | **Fixed-pixel text doesn't follow text-only zoom.** Badges (11 px) in all three; C's pixel numerals, zoom readout and inspector labels (11 px). Page zoom still scales them. | `text200-C-lib-desk.png` |
| 8 | Low | **Refit on DPR change is unverifiable** (see [crispness](#pixel-crispness-measurements)). | — |
| 9 | Pass | **Text contrast:** 0 failing pairs; the lowest is 4.96 (A light text-3 on surface-2). | — |
| 10 | Pass | **Names:** 0 unlabeled interactive elements in all 204 states. Checked: `aria-label`, `aria-labelledby`, text, `title`. | — |
| 11 | Pass | **Reduced motion:** all three open the viewer paused ("Play" shown), draw 0 frames in 3 s and keep the grid static. | — |
| 12 | Pass | **Non-colour state cues:** selected = check + ring, favourite = filled heart, active chip = check + fill, in all three. | `state-*-1.png` |

---

## Recommended visual direction

**Recommendation: "Quiet Studio, lifted".** Take A's shell, interaction grammar, type and restraint, and change four things:

1. **Retune the surfaces.**
   - Dark mode moves from A's near-black (0.16) to a 0.195 neutral, between A and C. It feels softer and more current, and it lets sprite outlines read.
   - Art gets **one shared surface**, `--stage-theme`. In dark mode the grid wells and the viewer's "Stage" are the same 0.25 gray, so a colour judged in the grid looks identical in the viewer.
   - The inspector and sidebar sit on `--bg`, so the stage is the brightest (lit) area.
   - In light mode the canvas is near-white and the art sits in light-gray **wells** (0.955, recessed). This replaces white-on-white cards, so white sprites keep their silhouette. The viewer stays on N8.
2. **Keep A's ice-blue as the only accent.**
   - It is the hue least likely to collide with typical sprite palettes, which are mostly warm (fire, gold, skin, wood) and green.
   - It stays blue in both themes. Plum turned pink in B.
   - Its light fill passes for rings at 5.11:1. C's amber fill is 2.33:1 and needed a second, brown token.
   - It is clearly not PixelLab's teal.
3. **Borrow from C:**
   - Art-first density where height is short: on compact height, use M cells and 6–9 columns.
   - The immersive landscape stage.
   - The **selection-summary mosaic** in A's inspector.
   - The **filmstrip** in the viewer dock, if the scope call allows it.
   - The inline 3×3 compass on desktop (also in B).
   - Do **not** borrow the default checker, the 1 px-boxed 3 px-radius controls, the pixel numerals, or the forced column counts that push 128 px characters into smooth overviews.
4. **Borrow from B:**
   - The inspector's typographic hierarchy (kicker → large title → facts line), set in the system sans for cross-platform consistency.
   - **Download formats as tiles** in the inspector.
   - The **whole-card focus ring** around the stage and caption.

**Layout changes required by the measurements:**
- Compact height defaults to M.
- At ≥ 1200 px the grid-side inspector appears only once something is current, or it collapses to a narrow summary; it should not reserve 340 px of emptiness.
- The viewer dock content is capped at about 960 px wide and centred.
- At portrait aspect (height > width, from 1080×1920 to iPad Pro portrait), the viewer inspector goes **below** the stage.
- Content is not capped at 2048 px (that is B's problem; A already scales to 16 columns).

### Proposed `:root` tokens

Light and dark, OKLCH, wired with `light-dark()` as in 04 §0.1. Chrome neutrals use hue 255 and chroma ≤ 0.006. Art surfaces have chroma exactly 0. Every value is inside the sRGB gamut, and the ratios below are computed from these exact values.

```css
:root {
  color-scheme: light dark;

  /* Chrome: near-neutral, hue 255, chroma <= 0.006 */
  --bg:              light-dark(oklch(0.985 0.002 255), oklch(0.195 0.004 255)); /* page, sidebar; dark: inspector too */
  --surface-1:       light-dark(oklch(0.970 0.003 255), oklch(0.215 0.004 255)); /* light: inspector/panels */
  --surface-2:       light-dark(oklch(0.945 0.004 255), oklch(0.270 0.005 255)); /* chips, search, segmented at rest */
  --surface-3:       light-dark(oklch(0.920 0.005 255), oklch(0.310 0.006 255)); /* hover, pressed, controls on art */
  --surface-float:   light-dark(oklch(1 0 0),           oklch(0.290 0.006 255)); /* pill, popovers, toasts (+ shadow) */
  --border:          light-dark(oklch(0.885 0.004 255), oklch(0.330 0.005 255));
  --border-strong:   light-dark(oklch(0.600 0.006 255), oklch(0.550 0.006 255));
  --hairline:        light-dark(oklch(0 0 0 / 0.07),    oklch(1 0 0 / 0.07));
  --text-1:          light-dark(oklch(0.210 0.006 255), oklch(0.960 0.003 255));
  --text-2:          light-dark(oklch(0.410 0.006 255), oklch(0.800 0.004 255));
  --text-3:          light-dark(oklch(0.490 0.006 255), oklch(0.710 0.005 255));

  /* One accent: ice blue. Selected, focus, primary action, checked state only. */
  --accent:          light-dark(oklch(0.530 0.150 255), oklch(0.760 0.120 250));
  --accent-text:     light-dark(oklch(0.500 0.150 255), oklch(0.780 0.110 250));
  --accent-contrast: light-dark(oklch(0.990 0 0),       oklch(0.190 0.030 255));
  --accent-soft:     color-mix(in oklab, var(--accent) 16%, var(--surface-2)); /* ~ L 0.879 / 0.348 */
  --danger:          light-dark(oklch(0.520 0.190 27),  oklch(0.720 0.160 25));
  --success:         light-dark(oklch(0.480 0.120 150), oklch(0.760 0.140 150));
  --focus:           var(--accent);
  --select:          var(--accent);
  --current:         var(--text-1);                                           /* neutral "cursor" ring */
  --scrim:           light-dark(oklch(0.2 0.01 255 / 0.32), oklch(0 0 0 / 0.6));

  /* Art surfaces: chroma exactly 0 */
  --stage-theme:     light-dark(oklch(0.955 0 0), oklch(0.250 0 0));   /* grid wells; dark viewer "Stage" */
  --stage-viewer:    light-dark(oklch(0.830 0 0), var(--stage-theme)); /* "Stage" swatch: N8 light, shared surface dark */
  --checker-a:       light-dark(oklch(0.86 0 0), oklch(0.30 0 0));
  --checker-b:       light-dark(oklch(0.78 0 0), oklch(0.25 0 0));
  --stage-mid:       oklch(0.57 0 0);
  --stage-light:     oklch(0.83 0 0);
  --stage-black:     oklch(0 0 0);
  --stage-white:     oklch(1 0 0);

  /* Shape (A's, unchanged) */
  --radius-xs: 4px; --radius-sm: 8px; --radius-md: 10px; --radius-lg: 14px; --radius-pill: 999px;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
```

Type, spacing, motion and z-index tokens stay as in 04 §1.5. Below, s1 = `--surface-1`, float = `--surface-float` and stage = `--stage-theme`.

**Light: WCAG ratio of each text token on each surface (all ≥ 4.5)**

| Token | bg | s1 | s2 | s3 | float | stage |
|---|---|---|---|---|---|---|
| text-1 | 16.97 | 16.24 | 15.08 | 13.98 | 17.71 | 15.54 |
| text-2 | 8.45 | 8.09 | 7.52 | 6.97 | 8.83 | 7.74 |
| text-3 | 6.00 | 5.74 | 5.33 | 4.94 | 6.26 | 5.49 |
| accent-text | 5.81 | 5.56 | 5.17 | 4.79 | 6.07 | 5.32 |
| danger | 5.82 | 5.57 | 5.17 | 4.80 | 6.08 | 5.33 |
| success | 5.92 | 5.67 | 5.26 | 4.88 | 6.18 | 5.42 |

**Dark: WCAG ratio of each text token on each surface (all ≥ 4.5)**

| Token | bg | s1 | s2 | s3 | float | stage |
|---|---|---|---|---|---|---|
| text-1 | 16.28 | 15.60 | 13.41 | 11.71 | 12.56 | 14.25 |
| text-2 | 9.79 | 9.38 | 8.06 | 7.04 | 7.55 | 8.57 |
| text-3 | 7.11 | 6.81 | 5.85 | 5.11 | 5.48 | 6.22 |
| accent-text | 9.19 | 8.80 | 7.57 | 6.61 | 7.09 | 8.04 |
| danger | 6.88 | 6.59 | 5.67 | 4.95 | 5.31 | 6.02 |
| success | 8.99 | 8.61 | 7.41 | 6.47 | 6.94 | 7.87 |

**Derived pairs (light / dark)**
- `--accent-contrast` on `--accent` (button labels): 5.18 / 8.65.
- `--text-1` on `--accent-soft` (checked chip): 12.30 / 10.11.
- Focus and select ring (`--accent`, 3:1 needed): vs `--bg` 5.11 / 8.56; vs `--stage-theme` 4.67 / 7.49; vs the N8 viewer stage (light) 3.16, plus the 6 px `--bg` halo; vs `--surface-3` 4.21 / 6.16.
- Current ring (`--text-1`) vs `--stage-theme`: 15.54 / 14.25.
- `--border-strong` (3:1 needed): vs `--bg` 3.78 / 3.77; vs `--surface-2` 3.36 / 3.11; vs `--stage-theme` 3.46 / 3.30.
- Art surface separation: `--stage-theme` vs `--bg` 1.09 / 1.14 (A: 1.03 / 1.05). The light viewer stage vs the inspector (`--surface-1`) is 1.55; the dark viewer stage vs the inspector on `--bg` is 1.14 (A: 1.03).
- APCA is advisory: dark text-3 sits at roughly Lc 50, so keep it for metadata at 12 px and up, as in 04 §0.8.

### Component styling notes

- **Card**
  - Radius 10. `--stage-theme` well with `inset 0 0 0 1px var(--hairline)`. No shadow, no lift and no scale. The art inset follows 02 §4.1.
  - Caption at M and up: title 13–14 px/500 in `--text-1`, one line. At L and XL add a meta line: 12 px mono in `--text-3` ("Object · 32×32").
  - The caption must grow with text size (min-height, not a fixed height) and wrap to 2 lines at 200%.
  - Badges and icon buttons on the art are opaque `--surface-3`, 20–24 px visual, with a ≥ 24 px hit area (44 on coarse, through a `::before` inset, not `margin`). Badge text is in rem (0.6875rem), not px.
  - Desktop minimum cell: 136 px at M, so 128 px canvases fit at k ≥ 1 on DPR 1. Trim transparent padding in production.
- **Stage and backdrops**
  - The viewer's "Stage" is N8 in light and the shared 0.25 surface in dark. Mid gray, Checker, Light gray, Black and White are one tap away. The default is "Stage", not Checker.
  - Set `forced-color-adjust: none` on the stage **and** on the swatch row, and give each swatch a 1px `--border-strong` ring plus its label (in a tooltip and the accessible name).
  - Nothing overlays the art box. Prev/next buttons sit in the gutters and are inset by `env(safe-area-inset-left/right)`.
  - Cap the dock content at 960 px and centre it. Draw the scrubber fill in `--text-2`, not the accent, so a long fill never becomes the brightest element.
  - Tile labels show only when a tile is drawn at 48 CSS px or more, and the grid overlay is off by default.
- **States (three distinct signals)**
  - **Focus:** 2px `--focus` outline, offset 2, with the 6 px `--bg` halo, around the whole card (stage + caption, as in B).
  - **Current:** a 2 px **neutral** `--current` inset ring on the stage.
  - **Selected:** a 2 px `--select` inset ring, a filled accent check badge (top-left), and a 1px `--accent-soft` frame on the caption row.
  - In forced colors: focus = `Highlight` outline, selected = `Highlight` ring + check, current = `CanvasText` ring.
- **Chips**
  - 32 px visual on fine pointers, 36 px visual with a 44 px hit area on coarse. Radius 999, 14 px/500.
  - At rest: `--surface-2` fill, transparent border in dark, `--border` in light.
  - Checked: `--accent-soft` fill, a 1px accent border at 40% mix, and a leading check icon, with `--text-1` at weight 600.
  - Never a saturated fill (avoid C's amber block).
- **Top bar, rail and pill**
  - Top bar: 56 px desktop, 52 px phone, on `--bg`; a hairline appears after scrolling. The search field is 36 px (44 coarse) on `--surface-2`, and it must **never be squeezed out**: at narrow widths or 200% text it collapses to an icon button that expands.
  - Rail: 80 px (72 at compact height), labels always visible, left safe-area padding, and the bottom item clear of the bottom inset.
  - Phone pill: 56 px on `--surface-float` with a shadow, plus the round search button. Labels are allowed to truncate, but the search button keeps its own column. The bottom offset is `max(12px, env(safe-area-inset-bottom))`.
  - The phone top bar pads `env(safe-area-inset-top)`.
- **Inspector typography (from B, set in the system sans)**
  - Kicker: 12 px/600, uppercase, +0.06em, `--text-3` ("CHARACTER · BASE").
  - Title: 24–28 px/650, leading 1.15, `--text-1`.
  - Facts line: 14 px `--text-2` ("128 × 128 · 4 directions · 1 animation").
  - Actions row: the primary Download split button is 36 px (44 coarse); Favourite, Add to folder and Open in PixelLab each get 36 px (44 coarse).
  - Field list: `grid-template-columns: minmax(96px, max-content) 1fr`, labels 12.5 px `--text-3`, values 14 px `--text-1` with tabular numerals. Labels wrap and stack above values below a 300 px panel width, so they never overlap.
  - Prompt: 13 px/1.6 mono in `--text-2`, in a `--surface-2` well with radius 8 and a Copy button.
  - Download formats: 2-column tiles (1px `--border`, radius 10, title 14/600, description 12 `--text-3`).
  - On ultrawide screens, cap the panel's text measure at about 65ch.

---

## Top 15 visual and accessibility fixes, ranked

1. **Adopt the lifted surface tokens.**
   - Dark: `--bg` 0.195 and one 0.25 art surface shared by the grid wells and the viewer Stage, with panels on `--bg`. This fixes A's 1.00:1 and 1.03:1 stage–panel collisions and the black outlines that vanish.
   - Light: 0.955 wells on a 0.985 canvas. This fixes A's 1.03:1 white-on-white cards and the vanishing white sprites.
2. **Keep the single ice-blue accent.** Do not ship the plum (pink in dark mode, as on the 1024×1366 Download bar) or the amber (a 2.33:1 fill that needs a second brown token and fights warm sprites).
3. **Never smooth-downscale ordinary sprites by default.** Use a ≥ 136 px desktop M cell and union-bounding-box trimming. Today C smooths 38 of 72 thumbnails at 1920×1080@1, and every option draws characters tiny next to 32 px items.
4. **Fix the targets below 24 px**: the sync-status trigger in all three, A's grid-size slider and ± buttons on coarse pointers, B's breadcrumb, and the B and C wordmark links.
5. **Make text scale safely at 200%.** A: keep search reachable and wrap the inspector labels. B: let the card labels grow. All three: badges and labels in rem.
6. **Separate current, selected and focus visually**: a neutral current ring, an accent ring plus check for selected, and an outset ring with halo for focus. Today A and C use one accent ring for both current and focus.
7. **Honour safe areas.** Inset the stage-edge prev/next buttons and the immersive capsules by the left/right insets in landscape (all three). Keep A's viewer-sheet actions above the home indicator. Pad A's and B's phone top bars.
8. **Bring coarse-pointer controls to 44 px.** Use `::before` hit areas for A's chips (36 px today), the inspector actions, the scrubbers in all three and C's search field.
9. **Use M cells on compact height** (A shows one row of 8 at 844×390). Drop B-style shelves on phones (2–6 thumbnails under 34–49% chrome).
10. **Make big-screen layouts adaptive.** Cap the viewer dock at about 960 px instead of a 3,000 px scrubber (A at 3440). Put the viewer inspector below the stage at portrait aspect (A at 1080×1920: 612 px stage). Don't cap content at 2048 px under a full-width nav (B at 2560 and 3440).
11. **Don't reserve an empty 340 px inspector.** At 1366×768 A drops to 4 columns and 12 thumbnails because of it.
12. **Make A's backdrop swatches survive forced colors** (5 of 6 disappear). Add swatch rings and labels.
13. **Remove chrome from the art:** default the viewer backdrop to the theme Stage, not Checker (C); hide tile labels below 48 px tiles (A's phone Tiles Pro); keep long accent fills off the dock (A's scrubber).
14. **Give big assets room.** Let the 768×512 map and 688 px UI kits open the full viewer, or widen the pane, instead of rendering them at 0.5× smooth in a narrow stage pane (C at 1440×900). Fix the viewer control overflow: A's landscape capsule clips zoom, B's transport wraps "8 fps" at 360 and C's filmstrip and "Open" wrap at 320.
15. **Harden crispness:**
    - Confirm the fractional-CSS-size seams on real DPR 1.25 and 2.625 devices. If they appear, draw the viewer canvas from `devicePixelContentBox` at integer k inside it.
    - Also refit on `resize`, not only on the `resolution` media query (under emulation all three left thumbnails at the old size after a live DPR change).
