# 07 — Recommended Design: "Quiet Studio, lifted"

Working name **Vitrine**, *Unofficial gallery for your PixelLab assets*. Status: canonical visual and layout spec, 2026-10-18.

**What this document owns:** the final layout per form factor, the visual language, the tokens, component values, motion, and the visual accessibility invariants of the one recommended design.

**What it does not own:** behaviour, flows and copy (`02-ux-spec.md`), and modules and engines (`05-architecture.md`). `04-design-options.md` is the historical record of the three explored options (A Quiet Studio, B Gallery Wall, C Soft Pixel Workbench); this document cites it instead of repeating it.

**Precedence:** as stated at the top of `00-decision-log.md` (B-5). This document owns visual and layout and ranks with 02 (behaviour), below the F rulings and B answers.

**Inputs:** `docs/reviews/R3a-mockup-ux-review.md` (task results, hybrid, top 15 fixes), `docs/reviews/R3b-mockup-visual-a11y-review.md` (measurements, token block, component notes), `docs/reviews/R2-design-spec-review.md`, and the final rulings in 00.

**Mockup:** `mockups/recommended/` illustrates this document and is checked against 03. It ranks below this document and 02: where they differ, the docs win and any detail that exists only in the mockup is written back here or in 02 before it is built (B-5).

---

## 1. What the hybrid takes, and why

### 1.1 Scores that set the base

| Measure | A Quiet Studio | B Gallery Wall | C Workbench | Source |
|---|---|---|---|---|
| Rubric total, after mockup review (preliminary) | **75.5** (89) | 74 (74.5) | 72.5 (76.5) | R3a §5 |
| Mobile / touch parity | **4** | 3 | 3.5 | R3a §5 |
| Viewports passed (of 17) | **12** | 8 | 8 | R3b responsiveness matrix |
| Phone viewer: share of height given to art | **~64%** | ~46% | ~42% | R3a phone measurements |
| Smooth (non-crisp) thumbnails at 1920×1080@1 | 8 | **6** | 38 | R3b smooth-overview table |
| Visual polish | 3.5 | **5** | 3.5 | R3a §5 |
| Bulk / organize | 4 | 3 | **5** | R3a §5 |

No option won outright. A has the best shell and phone model, B the best single-asset page and look, C the best bulk surface and frame inspection (R3a summary). A lost about 13.5 points against its preliminary score, mostly to its click-to-select inspector (V1), which the hybrid drops (F-2).

### 1.2 Taken

| # | Element | From | Evidence | Ruling |
|---|---|---|---|---|
| 1 | Shell: sidebar ≥ 1200 px, rail on tablet and compact height, floating pill + round search on phone portrait | A | Passes 12/17 viewports (R3b); "most familiar, least surprising layout at every size" | F-1 |
| 2 | Captioned uniform grid with 02's cell sizes | A | C's captionless grid was R3a's severity-3 finding C2; C's small cells smooth 38/72 thumbnails (R3b) | F-1 |
| 3 | Click or tap opens the viewer at every size; no "current" state; no dwell prefetch | 02 baseline | A's V1 broke the first click in T2 and was mistaken for selection in T5 (R3a A3, sev 3) | F-2 |
| 4 | Modal viewer: docked Info panel on desktop and tablet landscape, bottom sheet on phone | A | Phone viewer gives ~64% of the height to art with 22 targets (C: 34) (R3a) | F-1 |
| 5 | Immersive phone-landscape viewer with fading capsules | A | "Best of the three" (R3a §3.2); B's landscape hid direction behind a scroll (R3a B2) | F-1 |
| 6 | Inline compass beside the transport; fps always visible in the transport row | B | "Best desktop control layout of the three" (R3a T2); A's fps was off-screen on phones (R3a A4) | F-4 |
| 7 | Filmstrip as the only frame control (replaces the range scrubber) | C | "Makes stepping tangible" (R3a T2); one of "the two best new components" (R3b) | F-4 |
| 8 | Download options as tiles with one-line descriptions | B | "Most self-explanatory download UI" (R3a T3, `B-p-T3-05-inline`) | F-5 |
| 9 | Museum-label Info hierarchy (kicker → title → facts line), set in the system sans | B | B's detail page is "the most beautiful screen in the review"; the system serif varies by OS (R3b) | F-3 |
| 10 | Whole-card focus ring (stage + caption) | B | "Clearest focus treatment of the three" (R3b) | F-13 |
| 11 | 2×2 cover mosaics for folders and Favorites | B | R3a hybrid; R2 delight #5 | F-12 |
| 12 | Selection-summary panel (mosaic, counts, actions) | C | "The best bulk surface" (R3a T5); "best new component" (R3b) | F-6 |
| 13 | Labelled "Open in PixelLab ↗" button | C | Only C labelled it; A and B used an icon-only ↗ (R3a T7) | F-11 |
| 14 | Non-blocking partial-failure toast with "View report" | C | R3a T9 | F-5 |
| 15 | Lifted neutral surfaces, one shared art surface, one ice-blue accent | A, retuned by R3b | A's dark stage vs panel was 1.00:1 and 1.03:1, its light cards 1.03:1; B's plum turns pink in dark; C's amber fill is 2.33:1 (R3b) | F-3 |

### 1.3 Not taken

| Element | From | Why |
|---|---|---|
| Click-to-select persistent inspector (V1) and 400 ms dwell detail (V6) | A | F-2. Breaks the first click; adds a third card state; costs reads (R2 #9, R3a A3) |
| Empty 340 px inspector beside the grid | A | Leaves 4 columns at 1366×768 (R3b #11) |
| Inline row of backdrop swatches | A, B, C | Cockpit (R2 #3); one Backdrop button instead (F-4) |
| Shelves home (V3) and full-page detail route (V4) | B | 2–6 phone thumbnails under 34–49% chrome (R3b); page scroll separates watching from acting (R3a B3) |
| Serif display face; plum accent | B | OS-dependent serif (R3b); plum is "candy pink" in dark mode (R3b) |
| Always-on stage pane (V5), pixel numerals (V8), captionless cells (V9), default checker, 1 px boxed 3 px-radius controls | C | Cramped panes and smoothed sprites (R3b); identification by art alone (R3a C2); checker is busy behind small sprites (R3b) |
| Sixth and seventh backdrops (White, Dark) | 02, 04 | F-4 sets five |

---

## 2. Layout per form factor

### 2.1 Rules

| Rule | Value | Source |
|---|---|---|
| Form factors | Phone w < 600 · Compact height h < 480 (any width) · Tablet 600–1199 · Laptop 1200–1599 · Desktop 1600–2559 · Ultrawide ≥ 2560 | 02 §0 |
| Navigation | Phone portrait: floating pill. Tablet and compact height: rail (80 / 72). ≥ 1200 px: sidebar 240, collapsible to the 80 rail | F-1, R-2 |
| Default grid size | M below 840 px wide **or** below 480 px tall; L otherwise | 02 §4.1, F-13 |
| Columns | `min(16, floor((W + gap) / (minCell + gap)))`, cells S 72 · M 104 · L 144 · XL 272 | 02 §4.1–4.2 |
| Gap / gutter | Phone and compact height 8 / 12 · tablet 12 / 16 · ≥ 1200 12 / 24 | 02 §4.1 |
| Viewer Info placement | Docked right when width ≥ 840 and width > height. Bottom sheet when height ≥ width or width < 840. Compact height: right overlay sheet 320 | F-1; decision E-4 |
| Bottom-sheet first detent | Peek; half when the viewport is ≥ 1200 px tall | decision E-4 |
| Viewer control rows | Content max-width 960 px, centred | F-4 |
| Selection container | Floating bottom bar; at ≥ 1200 px with ≥ 2 selected, the summary panel replaces it | F-6; decision E-1 |
| Content cap | None. The grid fills the width up to 16 columns, then cells grow | R3b #10 |

### 2.2 Matrix

Columns and cell widths are computed from §2.1 (CSS px). The first seven rows are 02's mockup set; the rest extend it (03 §1).

| Viewport @ DPR | Class · pointer | Navigation | Library header | Default grid | Viewer Info | Selection |
|---|---|---|---|---|---|---|
| 360×780 @3 | Phone · coarse | Pill 56 (Library · Folders) + round Search 56 | App bar 52 (h1 · Select · ⋯ · Settings) · chip row 44 · result line + View (scrolls with grid) | M · 3 × 107 | Bottom sheet | Bottom bar (replaces pill) |
| 412×915 @2.625 | Phone · coarse | Same | Same | M · 3 × 124 | Bottom sheet | Same |
| 780×360 @3 (and 844×390) | Compact height · coarse | Rail 72; bottom: Search, Select, Settings | One row 44: chips · View · ⋯; result line leads the grid | M · 6 × 107 (844: 6 × 118) | Right overlay sheet 320 (Info) | Bottom bar |
| 768×1024 @2 | Tablet portrait · coarse | Rail 80 | Top bar 56 (h1 · search ≤ 320 · Select) · chip row 44 · toolbar 40 (result line · Sort · size · Play previews · ⋯) | M · 5 × 122 | Bottom sheet | Bottom bar |
| 1180×820 @2 | Tablet landscape · coarse | Rail 80 | Same; search ≤ 400 | L · 6 × 168 | Docked right 320 | Bottom bar |
| 1440×900 @2 | Laptop · fine | Sidebar 240 | Top bar 56 (h1 · search ≤ 480 · Sort · size · Play previews · ⋯ · Select) · chip row 48 · result line 28 | L · 7 × 154 | Docked right 340 | Bar (1 selected) / panel 340 (≥ 2): grid 5 × 153 |
| 1920×1080 @1 | Desktop · fine | Sidebar 240 | Same; search ≤ 560 | L · 10 × 152 | Docked right 360 | Bar / panel 360: grid 8 × 149 |
| 2560×1080 @1 | Ultrawide · fine | Sidebar 240 | Same | L · 14 × 151 | Docked right 360, text ≤ 65ch | Bar / panel 360 |
| 3440×1440 @1 | Ultrawide · fine | Sidebar 240 | Same | L · 16 (cap) × 186 | Docked right 360, text ≤ 65ch; dock 960 centred | Bar / panel 360 |
| 1080×1920 @1 | Portrait monitor (tablet class) · fine | Rail 80 | As tablet; search ≤ 400 | L · 6 × 151 | Bottom sheet, opens at half | Bottom bar |
| 344×882 folded / 673×841 @2.625 unfolded | Foldable · coarse | Folded: pill. Unfolded: rail 80 | Folded: phone. Unfolded: tablet | Folded M · 2 × 156; unfolded M · 4 × 131 | Bottom sheet | Bottom bar |

Notes:
- M gives 3 columns from 352 to 463 px wide. Below 352 (320 px reflow, folded cover screens) it gives 2.
- Dual-segment foldable layouts stay deferred (01 §8); width classes cover them.
- The sidebar collapses to the 80 rail on demand (persisted). At 1440 that gives L · 8 × 154.

### 2.3 Viewer geometry

| Viewport | Top bar | Dock (fine 96 = 2 × 48; coarse 136 = compass height) | Stage (art area before padding) |
|---|---|---|---|
| 360×780 | 52 | 2 rows × 52 = 104, + sheet peek 124 + bottom inset | 360 × ~500 (~64% before insets) |
| 780×360 | Capsule | Capsules; control zones 56 top, 64 bottom | Art box 748 × 240 with no insets; minus side insets in landscape |
| 768×1024 | 56 | 136 + peek 124 | 768 × 708 |
| 1180×820 | 56 | 136 | 860 × 628 (panel 320) |
| 1440×900 | 56 | 96 | 1100 × 748 (panel 340) |
| 1920×1080 | 56 | 96 | 1560 × 928 (panel 360) |
| 2560×1080 | 56 | 96 | 2200 × 928 (panel 360) |
| 3440×1440 | 56 | 96 | 3080 × 1288 (panel 360); dock content 960 centred |
| 1080×1920 | 56 | 96 + sheet at half (960) | 1080 × 808 (1080 × 1644 at peek) |

---

## 3. Wireframes

ASCII is not to scale. `[f3]` = a filmstrip frame (`[#4]` the current one), `( > )` = Play, `<3` = favorite, `[..]` = ⋯, `^` = ↗.

**W1 — Desktop library, 1440×900 (7 × L, no inspector)**

```text
+----------------------+-------------------------------------------------------------------------------------------------+
| [#] Vitrine     [<<] | Library  [Q Search 71 assets          / ]  Newest v  [-]-o-[+]  [>] Play previews  [..]  Select |
|                      | ----------------------------------------------------------------------------------------------- |
| [#] Library          | (All)(Characters)(Objects)(Images)(Tilesets)(Tiles)(Maps)(UI)                                   |
| [/] Folders          | 71 assets . Synced just now . (2 generating ^)                                                  |
|                      |                                                                                                 |
| FOLDERS              | +--------+ +--------+ +--------+ +--------+ +--------+ +--------+ +--------+                    |
| <3 Favorites      9  | |        | |[ ]   <3| |        | |        | |        | |        | |        |                    |
| [] 1-bit platf.   5  | |  art   | |  art   | |  art   | |  art   | |  art   | |  art   | |  art   |                    |
| [] Dungeon kit   10  | |>4d.1a  | |        | |>9 fr   | |    fit | |        | |>8 fr   | |    fit |                    |
| [] Hero party     7  | +--------+ +--------+ +--------+ +--------+ +--------+ +--------+ +--------+                    |
| [] UI pack        9  | Android C. Orb Mage   Bear Trap. Meadow Ru. Dirt > Gr. Goblin Br. Fantasy M.                    |
| + New folder         | Char. 128  Char. 64   Obj. 64    Map 768    Tileset 16 Image 128  UI 688                        |
|                      | +--------+ +--------+ +--------+ +--------+ +--------+ +--------+ +--------+                    |
|                      | |  art   | |  art   | |  art   | |  art   | |  art   | |  art   | |  art   |                    |
|                      | +--------+ +--------+ +--------+ +--------+ +--------+ +--------+ +--------+                    |
|                      | Name       Name       Name       Name       Name       Name       Name                          |
|                      |                                                                                                 |
| Synced just now      |                                                                                                 |
| [*] Settings         |                                                                                                 |
| Unofficial. Not      |                                                                                                 |
| affiliated with      |                                                                                                 |
| PixelLab.            |                                                                                                 |
+----------------------+-------------------------------------------------------------------------------------------------+
```

**W2 — Desktop viewer, 1440×900 (Info panel docked; dock content ≤ 960 and centred)**

```text
+--------------------------------------------------------------------------------------------------------------------------+
| [x]  Android Courier . Base          (<) (>)   3 / 71                                                       [..]  [i]    |
+--------------------------------------------------------------------------------------------+-----------------------------+
|                                                                                            | CHARACTER . BASE            |
|                                                                                            | Android Courier             |
|                                 +------------------------+                                 | 128 x 128 . 4 dir . 1 anim  |
|                                 |                        |                                 | [Open in PixelLab ^ | v]    |
|                                 |   art at integer k     |                                 |                             |
|                                 |   Fit . 5x             |                                 | [Download GIF v] [<3] [+F]  |
|                                 |                        |                                 |                             |
|                                 +------------------------+                                 | DOWNLOAD                    |
|                                                                                            | [GIF . Walk  ] [Sprite    ] |
|   stage 1100 x 748 . backdrop: Theme                                                       | [E . 8 fps   ] [sheet ZIP ] |
|                                                                                            | [All frames  ] [PixelLab  ] |
| ------------------------------------------------------------------------------------------ | [ZIP         ] [orig. ZIP ] |
|   [|<] ( > ) [>|]  [f0][f1][f2][f3][f4][f5][f6][f7]  4/8  [-] 8 fps [+]  [Loop] [ ][N][ ]  | Download options...         |
|   [Rotations|Walk 8f]  (state if > 1)  [-] [Fit . 5x] [+]  [o Backdrop]         [W] E [E]  |                             |
|                                                                                 [ ][S][ ]  | IN FOLDERS (Hero party)     |
|         dock rows: max 960 wide, centred . compass spans both rows                         | Canvas      128 x 128 px    |
|                                                                                            | Directions  4 . S E N W     |
|                                                                                            | Animations  Walk . 8 fr     |
|                                                                                            | Playback    8 fps (default) |
|                                                                                            | Prompt            [Copy]    |
|                                                                                            | > Technical details         |
+--------------------------------------------------------------------------------------------+-----------------------------+
```

**W3 — Phone library, 360×780: at rest, then searching (the pill stays; Cancel is visible)**

```text
+------------------------------------------+   +------------------------------------------+
| Library               Select  [..]  [*]  |   | Library               Select  [..]  [*]  |
+------------------------------------------+   +------------------------------------------+
| (All)(Characters)(Objects)(Images)(Til>  |   | (All)(Characters)(Objects)(Images)(Til>  |
| 71 assets . Synced just now     [View]   |   | 2 results for "mage"            [View]   |
| +---------+ +---------+ +---------+      |   | +---------+ +---------+                  |
| |         | |         | |         |      |   | |   art   | |   art   |                  |
| |   art   | |   art   | |   art   |      |   | |  >8 dir | |  2 st.  |                  |
| |  >4 dir | |         | |     <3  |      |   | +---------+ +---------+                  |
| +---------+ +---------+ +---------+      |   | Orb Mage     Hooded Orb..                |
| Android Co.. Orb Mage    Bear Trap ..    |   |                                          |
| +---------+ +---------+ +---------+      |   |                                          |
| |   art   | |   art   | |   art   |      |   |                                          |
| +---------+ +---------+ +---------+      |   |                                          |
| Name         Name        Name            |   |                                          |
| +---------+ +---------+ +---------+      |   |                                          |
| |   art   | |   art   | |   art   |      |   |                                          |
| +---------+ +---------+ +---------+      |   |                                          |
|                                          |   |  .-----------------------------------.   |
|    .------------------------.  .---.     |   |  | [Q mage                 (x)] Cancel|  |
|    | [#] Library [/] Folders|  | Q |     |   |  '-----------------------------------'   |
|    '------------------------'  '---'     |   |    .------------------------.  .---.     |
+------------------------------------------+   |    | [#] Library [/] Folders|  | Q |     |
                                               |    '------------------------'  '---'     |
                                               +------------------------------------------+
```

The View button opens a sheet with Sort, Grid size and Play previews (decision E-8). Bottom scroll padding = pill 56 + offset 12 + safe-area inset, plus 60 while the search bar shows (F-13).

**W4 — Phone viewer, 360×780: Info sheet at peek, then at half**

```text
+--------------------------------------------+   +--------------------------------------------+
| [x] Android Courier . Base           [..]  |   | [x] Android Courier . Base           [..]  |
+--------------------------------------------+   +--------------------------------------------+
|                                            |   |            +----------------+              |
|            +----------------+              |   |            | art (refits)   |              |
|  (<)       |  art, Fit k    |        (>)   |   |            +----------------+              |
|            |                |              |   | ( > )  [f2][f3][#4][f5][f6][f7]   [8 fps]  |
|            +----------------+              |   | [Rotations|Walk . 8f]  [E v]  [o Backdrop] |
|       stage: swipe < > to move, v to close |   | ------------------------------------------ |
|                                            |   |                   ====                [v]  |
|                                            |   | CHARACTER . BASE    [Open in PixelLab ^|v] |
| ------------------------------------------ |   | Android Courier                            |
| ( > )  [f2][f3][#4][f5][f6][f7]   [8 fps]  |   | 128 x 128 . 4 directions . 1 animation     |
| [Rotations|Walk . 8f]  [E v]  [o Backdrop] |   | [ Download GIF  v ]   [<3]   [+ Folder]    |
| ------------------------------------------ |   | DOWNLOAD                                   |
|                   ====                [^]  |   | [GIF . Walk . E   ] [Sprite sheet (ZIP)]   |
| CHARACTER . BASE    [Open in PixelLab ^|v] |   | [8 fps (current) ] [PNG + JSON        ]    |
| [ Download GIF  v ]   [<3]   [+ Folder]    |   | [All frames (ZIP) ] [PixelLab orig. ZIP]   |
+--------------------------------------------+   | Download options...                        |
                                                 | Canvas        128 x 128 px                 |
                                                 | Prompt                         [Copy]      |
                                                 +--------------------------------------------+
```

The title lives in the top bar, so the peek row carries the kicker and the hand-off button. `[8 fps]` opens the speed stepper (−, +, Reset, Loop); `[o Backdrop]` is the Backdrop button; step and zoom live in the top bar's ⋯, and pinch and double-tap also zoom (decision E-3). One ⋯ per screen. Sheet actions sit above `env(safe-area-inset-bottom)`.

**W5 — Phone landscape viewer, 780×360 (immersive)**

```text
+--------------------------------------------------------------------------------+
|  .------------------------------.                          .---------------.   |
|  | [x]  Android Courier . Base  |                          | [i]    [..]   |   |
|  '------------------------------'                          '---------------'   |
|                                   +------------+                               |
|   (<)                             |  art       |                         (>)   |
|                                   | Fit k=11   |                               |
|                                   +------------+                               |
|    .----------------------------------------------------------------------.    |
|    | ( > )  [f2][f3][#4][f5][f6]   [8 fps]   [Walk . 8f v]   [E v]        |    |
|    '----------------------------------------------------------------------'    |
+--------------------------------------------------------------------------------+
```

Capsules and ‹ › pad `env(safe-area-inset-*)` + 8. They fade after 3 s without input while playing, never while focus is inside them. `[..]` adds Download…, step, Loop, zoom and Backdrop, so every control fits within 780 px minus the insets (R3a A7).

**W6 — Selection summary panel, 1440×900 (≥ 2 selected)**

```text
+----------------------+----------------------------------------------------------------+-------------------------------+
| [#] Vitrine     [<<] | Library  [Q Search          / ]  Newest v  [>] Play pr.  Done  | 12 selected            [x]    |
|                      | -------------------------------------------------------------- | . 4 hidden by filter          |
| [#] Library          | (All)(Characters)(Objects)(Images)(Tilesets)(Tiles)(Maps)(UI)  | +-------+-------+-------+     |
| [/] Folders          | 71 assets . Synced just now                                    | |  th   |  th   |  th   |     |
|                      | +------+ +------+ +------+ +------+ +------+                   | +-------+-------+-------+     |
| FOLDERS              | |[v]   | |[v]   | |[ ]   | |[v]   | |[ ]   |                   | |  th   |  th   |  th   |     |
| <3 Favorites      9  | | art  | | art  | | art  | | art  | | art  |                   | +-------+-------+-------+     |
| [] Dungeon kit   10  | +------+ +------+ +------+ +------+ +------+                   | |  th   |  th   |  +4   |     |
| + New folder         | Torch    Bear T.. Chest    Fuse B.. Helmet                     | +-------+-------+-------+     |
|                      | (selected cards keep captions, tinted)                         | 3 characters (5 states)       |
|                      | +------+ +------+ +------+ +------+ +------+                   | 9 objects                     |
|                      | |[v]   | |[v]   | |[v]   | |[ ]   | |[v]   |                   | (counts only, no MB; B-6)     |
|                      | | art  | | art  | | art  | | art  | | art  |                   |                               |
|                      | +------+ +------+ +------+ +------+ +------+                   | [ Download...           ]     |
|                      | Name     Name     Name     Name     Name                       | [ Add to folder...      ]     |
|                      |                                                                | [ Favorite              ]     |
|                      | grid reflows: 7 -> 5 columns at L                              | [ Select all in view    ]     |
+----------------------+----------------------------------------------------------------+-------------------------------+
```

**W7 — Download dialog (multi-asset) and the per-asset Download menu (character)**

```text
+----------------------------------------------------------------+   +----------------------------------------+
| Download 12 assets                                         [x] |   | GIF . Walk . East                      |
| 3 characters (5 states) . 9 objects                            |   |   8 fps (current speed) . ~256 px      |
| -------------------------------------------------------------- |   | Sprite sheet (ZIP)                     |
| +------------------+ +------------------+ +------------------+ |   |   One PNG sheet + JSON frame data      |
| | (o) Sprite sheets| | ( ) All frames   | | ( ) GIFs         | |   | All frames (ZIP)                       |
| | A PNG sheet +    | | Every frame and  | | One GIF per anim | |   |   Every frame as its own PNG           |
| | JSON per asset;  | | still as its own | | and direction at | |   | PixelLab original (ZIP)                |
| | stills as PNG    | | PNG              | | its speed        | |   |   PixelLab's own file, unchanged       |
| +------------------+ +------------------+ +------------------+ |   +----------------------------------------+
| v Advanced                                                     |
|   Scale      [Auto] [1x] [2x] [4x] [8x]                        |
|   GIF matte  (o) Transparent  ( ) Backdrop colour              |
|   File name  [vitrine-selection-12-2026-10-18       ].zip      |
| 12 assets . saves straight to disk (Chromium)                  |
| -------------------------------------------------------------- |
|                                     [ Cancel ]  [ Download ]   |
+----------------------------------------------------------------+
```

**W8 — Folders, 1440×900, with the Add to folder popover**

```text
+----------------------+-------------------------------------------------------------------------------------------------+
| [#] Vitrine     [<<] | Folders                                                                                         |
|                      | ----------------------------------------------------------------------------------------------- |
| [#] Library          | +-----+-----+   +-----+-----+   +-----+-----+   +-----------+   + - - - - - +                   |
| [/] Folders          | | th  | th  |   | th  | th  |   | th  |     |   |           |   |           |                   |
|                      | +-----+-----+   +-----+-----+   +-----+-----+   | (folder)  |   |    [+]    |                   |
| FOLDERS              | | th  | th  |   | th  | th  |   |     |     |   |           |   |           |                   |
| <3 Favorites      9  | +-----+-----+   +-----+-----+   +-----+-----+   +-----------+   + - - - - - +                   |
| [] 1-bit platf.   5  | <3 Favorites     Dungeon kit [..] Hero party [..] Boss fight [..] New folder                    |
| [] Boss fight     0  | 9 assets         10 assets        3 assets         empty                                        |
| [] Dungeon kit   10  |                                                                                                 |
| [] Hero party     3  | Add to folder: popover on fine pointers (280 wide); half sheet on touch:                        |
| + New folder         |   +--------------------------------+                                                            |
|                      |   | + New folder                   |                                                            |
|                      |   | [-] Dungeon kit             10 |   [-] = some of the selected assets are in it              |
|                      |   | [v] Hero party               3 |                                                            |
|                      |   | [ ] Boss fight               0 |                                                            |
|                      |   |                       [ Done ] |                                                            |
|                      |   +--------------------------------+                                                            |
+----------------------+-------------------------------------------------------------------------------------------------+
```

Phone: the same mosaic tiles in 2 columns (min 152, gap 12); Add to folder opens as a half sheet, never full screen (F-12).

**W9 — Connect (phone) and the post-sync "Keep me signed in" banner**

```text
+--------------------------------------------+   +----------------------------------------------------------+
|                                            |   | (key) Keep me signed in on this device?                  |
| [#] Vitrine                                |   |       You won't need to paste your API key again         |
| Unofficial gallery for your PixelLab       |   |       in this browser. Don't use this on a shared        |
| assets                                     |   |       computer.                                          |
|                                            |   |                  [ Keep me signed in ]  [ Not now ]      |
| Your PixelLab art, all in one place        |   +----------------------------------------------------------+
| Vitrine shows everything in your           |
| PixelLab account. It only looks. It        |
| never creates, changes, or deletes.        |
|                                            |
| GET YOUR API KEY                           |
| 1. Open your PixelLab account page ^       |
|    (sign in if PixelLab asks).             |
| 2. Tap Copy API key. It's a secret         |
|    token, so keep it private.              |
| 3. Come back to this tab and paste it.     |
|                                            |
| PixelLab API key                           |
| [ Paste your API key        ] [ Show ]     |
| We test it as soon as you paste it.        |
| [              Test key              ]     |
|                                            |
| (key) PixelLab API keys give full          |
| access to your account, including          |
| spending credits. Vitrine only reads.      |
|                                            |
| Your API key goes only to PixelLab's       |
| API. No servers, no analytics.             |
| Unofficial. Not affiliated with or         |
| endorsed by PixelLab.                      |
+--------------------------------------------+
```

The banner sits at the top of the grid after the first sync completes. It never blocks or takes focus (F-10).

---

## 4. Components (exact values)

Sizes are CSS px. "fine / coarse" gives the value for `(hover: hover) and (pointer: fine)` and for `(pointer: coarse)`. Coarse hit areas are 44 × 44 even where the visual is smaller (a `::before` inset, never `margin`).

### 4.1 Shell

| Component | Spec |
|---|---|
| Sidebar (≥ 1200) | 240, `--bg`, 1px right `--border`. Header 56: mark (12 × 12 cells at 2 px) + "Vitrine" 17 px/600, collapse button 32 (`panel-left-close`). Rows 32, radius 8, padding 0 10, gap 8: icon 18 `--text-3` + label `--step-0` `--text-2`; count `--step--1` `--text-3` on Favorites and folders. Hover `--surface-2`; active (`aria-current`) `--surface-3` with label and icon `--text-1`/600. Section label "Folders" 0.75rem/600, uppercase, +0.06em, `--text-3`; Favorites first, folders A–Z, "+ New folder" last. Footer: sync status (button, ≥ 24 tall; opens the sync popover), Settings row, short disclaimer `--step--1` `--text-3`. Collapsed to the 80 rail: width snaps, labels stay visible. |
| Rail | 80 (tablet), 72 (compact height); `--bg`, 1px right `--border`. Items 64 × 56: icon 24 over a 0.75rem/500 label; active = 56 × 32 `--surface-3` pill behind the icon, label `--text-1`/600. Compact height adds Search, Select, Settings at the bottom. Pads `env(safe-area-inset-left)`; the bottom item clears `env(safe-area-inset-bottom)`. |
| Floating pill (phone portrait) | 56 tall, radius 999, `--surface-float`, `--shadow-float`, 1px `--hairline`. Two tabs 104 × 48 (icon 20 + label `--step--1`/500 side by side); active tab: `--surface-2` inner pill, `--text-1`/600. Round Search button 56 in its own column, gap 8 (labels may truncate; Search never does). Bottom offset `max(12px, env(safe-area-inset-bottom))`. Hidden while the selection bar shows. |
| Phone search bar | Opens directly above the pill, which stays visible: 52 tall, width 100% − 24, radius 14, `--surface-float`, `--shadow-float`. Field 44 on `--surface-2`, radius 10, `search` icon 16, clear ✕ 44 when filled; **Cancel** text button 44 at the right. With the on-screen keyboard up, the bar rides above it (`visualViewport`). Cancel clears and closes; blur with an empty field closes; a non-empty query keeps the bar visible, so an active filter is never hidden (F-13; R3a A1, C1). |
| Top bar | 56 (52 phone), `--bg`; a 1px `--border` hairline appears after scroll; pads `env(safe-area-inset-top)`. h1 `--step-2`/600. Search field 36 / 44 tall, radius 10, `--surface-2`, transparent 1px border → `--border-strong` on hover; icon 16 `--text-3`; keycap "/" 20 × 20, radius 4, 1px `--border`, mono 11 px (fine only); clear button when filled. Max width per §2.2. At 200% text, or with < 240 px free, the field collapses to a 44 icon button that expands over the title; it is never squeezed out (F-13). Buttons 32 / 44, radius 8, `--text-2`; hover `--surface-2` + `--text-1`; pressed `--surface-3`. In selection mode, Select reads "Done". |

### 4.2 Library header

| Component | Spec |
|---|---|
| Chips | 8 chips: All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI (F-8). Fine: 32 tall in a 48 row. Coarse: 36 visual in a 44 hit area, row 44 tall (F-8, F-13). Radius 999, padding 0 12, 0.875rem/500, gap 6. Rest `--surface-2`, `--text-2`, 1px border (transparent in dark, `--border` in light). Hover `--surface-3`, `--text-1`. Checked `--accent-soft`, `--text-1`/600, 1px `color-mix(in oklab, var(--accent) 40%, transparent)`, leading `check` 14. "Images" carries the tooltip and accessible description "Creator gallery" (F-7). Phone: one row that scrolls sideways (`scroll-padding-inline` = gutter); the checked chip scrolls into view. |
| Result + status line | 28 (laptop), `--step--1` `--text-2`: "71 assets · Synced just now". The status part is a button (24 / 44 tall) that opens the sync popover. During sync: "Syncing… 340 of ~1,200" with a 2px determinate bar in `--text-2` (not the accent). Offline: "Offline · saved library". In-progress chip "2 generating ↗" (B-19; popover lists generating, needs review and failed counts with links to PixelLab): 24 tall (44 hit on coarse), radius 999, `--surface-2`, static `loader-circle` 12. |
| Sort | Menu button "Newest ▾" 32 / 44. |
| Grid size | Tablet+: 120-wide 4-stop range between − and + (28 / 44); the range's hit area is 24 / 44 tall (R3b #1). Phone and compact height: inside the View sheet. |
| Play previews | `circle-play` 16 + the visible label "Play previews", `aria-pressed`; on = `--accent-soft` fill + `--text-1`. Phone and compact height: a labelled switch in the View sheet. |
| View sheet (phone, compact height) | Half sheet: Sort (radio rows 44) · Grid size (segmented S M L XL, 44) · Play previews (switch row 52 with label). |
| ⋯ menu | "Download all {n}…", "Sync now", "Keyboard shortcuts" (gestures on coarse pointers). |

### 4.3 Card

| Part | Spec |
|---|---|
| Well | Square, radius 10, `--stage-theme` (light-gray well in light mode, the shared 0.25 surface in dark), `inset 0 0 0 1px var(--hairline)`. Art inset 4 (S, M) / 8 (L, XL); art per 02 §4.3. No shadow, no lift, no scale. |
| Caption | M: title 0.875rem/500 `--text-1`, one line, ellipsis. L/XL: + meta 0.75rem mono `--text-3` ("Character · 64×64"). Uses `min-height` (24 / 44), wraps to 2 lines at 200% text; the row height comes from the measured caption, so rows stay uniform for windowing. Object states append the state ("Bear Trap · open"). |
| Overlays on the art | Opaque `--surface-3`. Top-left checkbox 20 visual (≥ 24 hit), radius 6, 1.5px `--border-strong` ring; checked = `--select` fill + `check` 12 in `--accent-contrast`. Top-right: filled heart 12 in an 18 circle when favorited; on hover, heart toggle + ⋯ (28 each). Bottom-left badge chip 18 tall, radius 999, mono 0.6875rem `--text-2`, ▶ prefix when animated, type glyph in mixed views. Bottom-right: "fit" marker when k < 1. Coarse pointers get no per-card buttons. |
| States (F-2) | **Default.** **Hover** (fine): inner edge 1px `--border-strong`, overlays fade in over `--dur-1`, the preview plays after 300 ms. **Focused**: 2px `--focus` outline, offset 2, with a 6px `--bg` halo, around the whole card (well + caption), radius 12. **Selected**: 2px `--select` inset ring on the well + filled check badge + the caption row on `--accent-soft` (radius 6); the caption stays. Focused + selected shows both. There is no "current" state. |
| Forced colors | Focus = `Highlight` outline; selected = `Highlight` ring + check; well border `CanvasText`. |

### 4.4 Viewer

| Component | Spec |
|---|---|
| Frame | `<dialog>` at 100dvh, `--bg`, opaque (no `::backdrop`). |
| Top bar | 56 (52 phone): × (32 / 44) · title `--step-1`/600 + state `--text-2` · ‹ › 32 (fine pointers; coarse: at the stage edges) · position "3 / 71" `--step--1` `--text-3` · ⋯ · Info toggle (`info`, `aria-pressed`, `I`) where the panel is docked or an overlay; with a bottom sheet, the handle and expand button are the control (`I` cycles peek ↔ half). |
| Stage | Current backdrop; padding 24 vertical / 64 horizontal (fine), 16 + gutters (coarse). Coarse ‹ › are 44 circles on `--surface-float` inside the side gutters, inset by `env(safe-area-inset-left/right)` (F-13). Nothing overlays the art box. `forced-color-adjust: none`; `touch-action: none`. Tilesets: grid overlay off by default; tile labels only when a tile is drawn at ≥ 48 CSS px (R3b). |
| Dock | Below the stage, `--bg`. Content max-width 960, centred (F-4); `grid-template-columns: 1fr auto`, padding 0 24. **Row 1 (48 / 52), transport:** step back 32 / 44 · Play/Pause, a 40 / 44 circle on `--surface-3` · step forward · filmstrip (flex) · frame readout "4 / 8" mono `--step--1` `--text-2` (≥ 840 only) · fps stepper · Loop (`repeat`, `aria-pressed`). **Row 2 (48 / 52), context:** animation picker · state switcher · spacer · zoom · Backdrop. Tilesets and Tiles Pro: a **Grid** toggle button (`aria-pressed`, label "Grid", 32 / 44) takes the animation picker's slot; it is also in ⋯ (B-10). **Right column:** inline compass spanning both rows. **Phone portrait (E-3):** row 1 = Play · filmstrip · fps value button; row 2 = Animation (Grid on tilesets and Tiles Pro) · Direction · Backdrop; step and zoom sit in the top bar's ⋯. Controls that don't apply are hidden (02 §6.1). |
| Filmstrip | Cells 40 × 40 (fine) / 44 × 44 (coarse), gap 4, radius 4, 1px `--hairline`; each frame integer-fit on the current backdrop. Current frame: 2px `--current` ring (neutral, so no long accent fill on the dock). Scrolls sideways (`scrollbar-width: thin`); the current frame stays in view (`scrollIntoView({inline: 'nearest', behavior: 'auto'})`). Virtualized beyond 40 frames. A radiogroup "Frame" of radios "Frame 4 of 8"; click, tap, arrows, Home/End seek and pause. Hidden whenever the transport is hidden (Rotations, single-frame assets). |
| fps stepper | `[−] 8 fps [+]`: buttons 28 / 44 ("Slower", "Faster"), readout mono `--step--1` `--text-1`, 6ch, tabular; range 1–30. When overridden, a Reset button (`rotate-ccw`, "Reset to 8 fps") appears. `role="group"` "Playback speed". **Phone portrait:** the "8 fps" value is a 44-tall button in row 1 that opens a popover with −, +, Reset and Loop (decision E-3). |
| Compass | 3 × 3, cells 28 (fine) / 44 (coarse), gap 2, radius 6; cells `--surface-2`, icon `--text-2`; checked = `--accent` fill + `--accent-contrast` icon; disabled = 35% opacity; centre = direction name `--step--1`/600 `--text-2`, not interactive. Radiogroup "Direction". Hidden for 1-direction assets. **Phone portrait and compact height:** a Direction button ("E ▾", 44) opens the same compass (44 cells) as a popover that closes on selection. |
| Animation picker | Segmented control 32 / 44 ("Rotations · Walk 8f") when ≤ 4 entries fit; otherwise a menu button "Walk · 8f ▾" (160 × 32 / 44). Checked segment `--surface-3` + `--text-1`/600. |
| State switcher | Segmented 32 / 44; a menu above 4 states. Only when the group has > 1 state. |
| Zoom | `−` · readout · `+` (F-4). Buttons 28 / 44. Readout is a button (mono `--step--1`, min 9ch): "Fit · 5×" at Fit, "4×" otherwise; it toggles Fit ↔ 1:1 (`Z`); name "Zoom fit, 5×. Toggle actual size". |
| Backdrop | One labelled ghost button, 32 / 44 tall: a 16 circle filled with the current backdrop (Checker drawn as 4 px squares so it reads as a checker; 1px `--text-3` ring) + the visible text "Backdrop" at every width where the dock shows it (it fits at 320); `aria-label` "Backdrop: Mid gray" (name of the current backdrop), `aria-haspopup="dialog"`. No icon: the swatch is the indicator. Compact height moves it into ⋯ as "Backdrop: Mid gray…" with the `contrast` icon. Popover: a radiogroup "Backdrop" of 5 swatches in a row, each a 28 circle (44 hit on coarse) with a 1px `--text-3` ring and its label underneath (`--step--1`): Theme · Checker · Light gray (N8) · Mid gray (N5) · Black (F-4). Checked = 2px `--focus` ring at offset 2 + `check`. Swatch fills use `forced-color-adjust: none`; labels stay in system colours (F-13). |
| Compact-height capsules | Opaque `--surface-float`, radius 999, `--shadow-float`, controls 44. Top-left: × + title. Top-right: Info + ⋯. Bottom: Play · filmstrip (5–6 cells) · fps value button · Animation ▾ · Direction ▾. ⋯ adds Download…, step, Loop, zoom and Backdrop (W5). |

### 4.5 Info panel

| Part | Spec |
|---|---|
| Container (docked) | 320 (840–1199), 340 (1200–1599), 360 (≥ 1600). Background `light-dark(var(--surface-1), var(--bg))`, 1px left `--border`, padding 20, own scroll, text measure ≤ 65ch. Sections 24 apart, no rules. |
| Container (sheet) | Same background, top radius 14, 1px top `--border`. Detents: peek (handle row 16 + kicker/hand-off row 44 + actions row 52 + 12 = 124, plus the bottom inset) · half 50dvh · full 100dvh − 52. Handle 36 × 4, radius 2, `--text-3` at 40%; a 44 expand/collapse button (`chevron-up` / `chevron-down`). No scrim. The stage refits once the sheet settles. Compact height: a right overlay sheet, 320 + `env(safe-area-inset-right)`. |
| Header | Kicker 0.75rem/600, uppercase, +0.06em, `--text-3` ("CHARACTER · BASE") · title 1.5–1.75rem/650, leading 1.15, `--text-1` · facts line 0.875rem `--text-2` ("128 × 128 · 4 directions · 1 animation") · **Open in PixelLab ↗** split button 36 / 44: main part `--surface-2`, 1px `--border`, label + `external-link` 14; ▾ part 28 / 44, named "More in PixelLab", lists tool links, each generation tool with "May use PixelLab credits" in `--text-3` (F-11). The ▾ is hidden when a type has no tools. Tier note `--step--1` `--text-3` ("Opening in PixelLab may need a paid plan") where 02 §3.11 lists one. In the phone peek the title is dropped (the top bar shows it). |
| Actions row | Download split 36 / 44: primary `--accent` / `--accent-contrast`, label names the default output ("Download GIF", "Download PNG", "Download tiles"); ▾ part 28 / 44 behind a 1px `oklch(0 0 0 / 0.15)` divider opens the ≤ 4-item menu. Favorite (heart, `aria-pressed`) 36 / 44. Add to folder (`folder-plus` + label where it fits) 36 / 44. |
| Download tiles | Header "Download" 0.75rem/600 uppercase `--text-3`. Grid of 2 columns (1 below a 300 px panel width), gap 8. Tile = a button: 1px `--border`, radius 10, padding 12 14, min-height 64; title 0.875rem/600 `--text-1`; description 0.75rem `--text-3` (02 §12.3). Hover `--surface-2`. The default comes first. Below the tiles: the text link "Download options…" (`--accent-text`). |
| Folder chips | "In folders": chips 28 / 44, `--surface-2`; tap opens the folder. |
| Fields | `<dl>`, `grid-template-columns: minmax(96px, max-content) 1fr`; labels 0.78rem `--text-3`; values 0.875rem `--text-1`, tabular numerals; technical values (sizes, seeds, counts, tile names) in `--font-mono`. A container query stacks labels above values below a 300 px panel width or when labels would wrap (200% text) (F-13). |
| Prompt | Mono 0.8125rem/1.6 `--text-2` in a `--surface-2` well, radius 8, padding 10 12; clamped to 6 lines + "Show more"; Copy 32 / 44 top-right. |
| Technical details | Collapsed `<details>` (02 §5). |

### 4.6 Selection

| Component | Spec |
|---|---|
| Selection bar | Pill 56, radius 999, `--surface-float`, `--shadow-float`, max 600, centred, bottom `max(16px, env(safe-area-inset-bottom) + 8px)`. × (Clear, Esc) · "3 selected" (+ "· 4 hidden by filter") · spacer · Favorite · Add to folder · Remove (folder view) · **Download** (primary 40 / 44). On phone it replaces the pill. At ≥ 1200 px it shows only while exactly 1 item is selected. |
| Summary panel (≥ 1200, ≥ 2 selected) | Slides in on the right: 340 (1200–1599) / 360 (≥ 1600); `light-dark(var(--surface-1), var(--bg))`, 1px left `--border`, padding 20. The grid reflows once (laptop L 7 → 5 columns), keeping the focused card in view. Header: "12 selected" `--step-2`/600 + "· 4 hidden by filter" `--text-2` + × 32. Mosaic: 3 × 3 cells of 96, gap 6, integer-fit thumbnails on `--stage-theme`; the 9th cell reads "+N" past 9. Breakdown rows `--text-2` ("3 characters (5 states) · 9 objects"; type words singular/plural: tileset/tilesets, tile/tiles); no file or size estimate (B-6). Actions: full-width 36 buttons, gap 8: **Download…** (primary) · Add to folder… · Favorite / Unfavorite · Remove from folder (folder view) · Select all in view. Slides out below 2. |

### 4.7 Downloads

| Component | Spec |
|---|---|
| Download menu | Popover base, 300 wide (fine); action sheet on coarse. ≤ 4 rows (F-5): title 0.875rem/600 + description 0.75rem `--text-3`, row 52 / 56. Contents per type: 02 §7.1. |
| Download dialog | Dialog base, 560. Multi: title "Download 12 assets" + breakdown `--text-2`; 3 preset radio cards (Sprite sheets · All frames · GIFs), each 1px `--border`, radius 10, padding 12 14, radio top-left, title 0.875rem/600, description 0.75rem `--text-3`; checked = 2px `--select` border + filled radio. Three across at ≥ 560, stacked (min-height 64) on phone. Single ("Download options"): radio rows of the type's formats + Scope segmented (This animation / Everything). Both: **Advanced** `<details>` collapsed: Scale (segmented Auto · 1× · 2× · 4× · 8×) · GIF matte (Transparent / Backdrop colour) · File name (mono field, slugged on save). Counts `--text-2`, plus the Blob-path notice "Large downloads may be saved in parts."; no MB estimate (02 §7.6; B-6). Footer: Cancel (ghost) · **Download** (primary 36 / 44). |
| Progress chip | Bottom-left of the content, 16 from the edges (phone: 12 above the pill or bar). 40 / 44 tall, radius 999, `--surface-float`, `--shadow-float`: "Downloading 132 / 480 · 41 MB", a 2px progress line in `--text-2`, Cancel. |
| Ready sheet | Auto-height sheet (never full height): file name + size, **Share or save…** (primary), Download file. |
| Report | Partial failure arrives as a toast with "View report"; the report is a dialog (name, type, reason, **Retry failed** for retryable reasons only). |

### 4.8 Folders

| Component | Spec |
|---|---|
| Folders page | h1 "Folders". Tiles use the grid formula with min 200 (fine) / 152 (phone), gap 16 / 12. Tile: square 2×2 mosaic (outer radius 10, gap 4, each quadrant integer-fit on `--stage-theme`, the 4 most recently added items; unused quadrants stay plain wells; an empty folder shows `folder` 32 in `--text-3`), name `--step-0`/600 (2 lines max), count `--step--1` `--text-3`, always-visible ⋯ 32 / 44 (Rename, Delete). Favorites tile first: the 4 newest favorites + a heart badge, no ⋯. "New folder" tile: dashed 1.5px `--border-strong` well with `folder-plus`. |
| Folder page | Header: Back (phone) · h1 name · count · **Download** (secondary) · one ⋯ (Rename, Delete). No library sync line inside a folder (R3a A10). |
| Add to folder | Fine: popover base, 280, anchored to the trigger. First row "New folder" (inline name field; Create adds the folder and checks it in one step). Tri-state checkbox rows 36 / 44 + count `--text-3`; a filter field above 8 folders; Done. Coarse: half sheet, never full screen (F-12). |

### 4.9 Overlays and states

| Component | Spec |
|---|---|
| Popover / menu base | Radius 14, `--surface-float`, 1px `--border`, `--shadow-float`, padding 6. Rows 32 / 44, radius 8, hover `--surface-2`, checked row with a leading `check`. On coarse pointers, menus open as bottom action sheets padded by the bottom inset. |
| Dialog base | `<dialog>`, radius 14, `--surface-float`, 1px `--border`, `--shadow-float`, `::backdrop` `--scrim`. Header 56 (title `--step-1`/600 + ×); body padding 24; footer 64, buttons right. Phone: bottom sheet 100dvh − 24 with a sticky footer above the inset. |
| Toast | Bottom centre, 16 above the edge (phone: 12 above the pill or bar). Min 280, max 480, 48 tall, radius 14, `--surface-float`, 1px `--border`, `--shadow-float`. Icon 16 + text + action in `--accent-text`. 5 s, or ≥ 10 s with an action; paused on hover or focus. |
| Keep-me-signed-in banner | Top of the grid, inline (not floating): `--surface-2`, radius 14, padding 12 16, `key-round` 16, text + **Keep me signed in** (secondary 36 / 44) + Not now (ghost). Polite announcement once; never takes focus (F-10). |
| Empty states | Centred, max 400. A tiny idle sprite (F-14): a 48 box (64 at ≥ 840), integer-scaled, from the newest character whose idle or breath frames are already decoded this session, else its static south preview, else the mark at 4 px cells in `--text-3`. It animates only when grid motion is allowed (Play previews on, no reduced motion). Headline `--step-1`/600; body `--step-0` `--text-2`; buttons 36 / 44. |
| Not-in-the-public-API note | End of All results (no search) and Settings › About: `--step--1` `--text-2` paragraph + four ↗ links as 44-tall rows on coarse pointers (F-8). |

### 4.10 Connect, Settings, Help

| Component | Spec |
|---|---|
| Connect | `--bg`, centred column 400 (phone: 100% − 32). Mark 40 + wordmark `--step-3`/600 + descriptor. Heading `--step-1`/600; value line `--step-0` `--text-2`. "Get your API key": a visible numbered list (`--step-0`), step 1 holds the account link with `external-link` (F-10). Field label; password input 44 (16 px text), radius 10, `--surface-2`, + Show 44; helper `--step--1` `--text-3`; inline error in `--danger` with an icon. **Test key** (primary, 44, full width) sits directly under the field. Full-access note with `key-round`, `--step--1` `--text-2`. Privacy line and disclaimer at the bottom, `--step--1` `--text-3`. No autofocus on coarse pointers (decision E-11). Phone landscape: the column scrolls. |
| Settings | Dialog base 640 (phone: full-screen sheet); rows 52; sections per 02 §3.12. |
| Help overlay | Dialog base 560; tabs "Keys" / "Gestures" (coarse pointers open on Gestures); two-column rows (key in a keycap, action); the shortcuts-off banner on top when relevant (02 §9.5). |

### 4.11 Icons, type, mark

- **Icons:** Lucide, inline SVG, per 04 §0.10, with these changes: Folders `folders`; Play previews `circle-play`; Backdrop `contrast` (⋯ menu item only; the dock button shows a swatch); Open in PixelLab `external-link`; Reset speed `rotate-ccw`; no Other glyph (the "Other" chip is gone).
- **Type:** `--font-ui` (system sans) everywhere, including B's label hierarchy; `--font-mono` for technical values (sizes, counts, seeds, file names, frame and zoom readouts) (F-3). No serif and no pixel face. `font-variant-numeric: tabular-nums` on numbers; real × in sizes (04 §0.11).
- **Mark:** A's "frame + pixel" mark and wordmark (04 §6.1), provisional until the owner names the product.

---

## 5. Tokens

### 5.1 `:root` block (R3b "Quiet Studio, lifted", verbatim; F-3)

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

Theme: follows the system by default; Settings › Appearance sets `data-theme` (System / Light / Dark). No fallback declarations before `light-dark()`: the 05 §0 support floor includes it (B-16).

### 5.2 Carried tokens

Type, space, elevation, motion and layer tokens come from 04 §1.5 (Option A) unchanged: `--font-ui`, `--font-mono`, `--step--1` … `--step-3`, `--leading-*`, `--space-1` … `--space-8`, `--gap-grid`, `--pad-grid`, `--target`, `--shadow-float`, `--shadow-pop`, `--dur-1` … `--dur-4`, `--dur-fade`, `--ease-out`, `--ease-in`, `--ease-spring`, `--z-*`, and its `@media` overrides (gutters below 1200 and 600 px or 480 px tall, `--target: 44px` on coarse pointers, zero durations under reduced motion). The colour and art-surface declarations in 04 §1.5 are superseded by §5.1.

### 5.3 Roles

| Role | Token |
|---|---|
| Page, sidebar, rail, top bar, viewer frame and dock | `--bg` |
| Info panel and selection summary panel | `light-dark(var(--surface-1), var(--bg))` (R3b: the stage stays the lit area) |
| Chips, search field, segmented controls at rest, prompt well | `--surface-2` |
| Hover, pressed, controls on art | `--surface-3` |
| Pill, search bar, selection bar, menus, popovers, dialogs, toasts, capsules | `--surface-float` + `--shadow-float` |
| Card wells, mosaic quadrants, summary mosaic | `--stage-theme` |
| Selected ring, check, focus ring, primary button, checked chip | `--select`, `--focus`, `--accent`, `--accent-soft` |
| Current filmstrip frame | `--current` (decision E-12) |
| Progress bars and lines (sync, download) | `--text-2` |

**Backdrop swatches (F-4)**

| Swatch | Token | Light | Dark |
|---|---|---|---|
| **Theme** (default) | `--stage-viewer` | N8, oklch 0.83 | 0.25 (= `--stage-theme`) |
| Checker (8 CSS px squares, conic gradient) | `--checker-a` / `--checker-b` | 0.86 / 0.78 | 0.30 / 0.25 |
| Light gray (N8) | `--stage-light` | 0.83 | 0.83 |
| Mid gray (N5) | `--stage-mid` | 0.57 | 0.57 |
| Black | `--stage-black` | 0 | 0 |

`--stage-white` has no swatch (White was dropped by F-4); it stays only because the block is copied verbatim (§8, question 2).

### 5.4 Computed contrast

Recomputed for this document from the exact values above (OKLCH → OKLab → linear sRGB, WCAG 2.x). Every value is in gamut. They match R3b's tables. s1 = `--surface-1`, float = `--surface-float`, stage = `--stage-theme`.

**Light: text tokens on surfaces (all ≥ 4.5)**

| Token | bg | s1 | s2 | s3 | float | stage |
|---|---|---|---|---|---|---|
| text-1 | 16.97 | 16.24 | 15.08 | 13.98 | 17.71 | 15.54 |
| text-2 | 8.45 | 8.09 | 7.52 | 6.97 | 8.83 | 7.74 |
| text-3 | 6.00 | 5.74 | 5.33 | 4.94 | 6.26 | 5.49 |
| accent-text | 5.81 | 5.56 | 5.17 | 4.79 | 6.07 | 5.32 |
| danger | 5.82 | 5.57 | 5.17 | 4.80 | 6.08 | 5.33 |
| success | 5.92 | 5.67 | 5.26 | 4.88 | 6.18 | 5.42 |

**Dark: text tokens on surfaces (all ≥ 4.5)**

| Token | bg | s1 | s2 | s3 | float | stage |
|---|---|---|---|---|---|---|
| text-1 | 16.28 | 15.60 | 13.41 | 11.71 | 12.56 | 14.25 |
| text-2 | 9.79 | 9.38 | 8.06 | 7.04 | 7.55 | 8.57 |
| text-3 | 7.11 | 6.81 | 5.85 | 5.11 | 5.48 | 6.22 |
| accent-text | 9.19 | 8.80 | 7.57 | 6.61 | 7.09 | 8.04 |
| danger | 6.88 | 6.59 | 5.67 | 4.95 | 5.31 | 6.02 |
| success | 8.99 | 8.61 | 7.41 | 6.47 | 6.94 | 7.87 |

**Derived and non-text pairs (light / dark)**

| Pair | Ratio | Need |
|---|---|---|
| `--accent-contrast` on `--accent` (button labels) | 5.18 / 8.65 | 4.5 |
| `--text-1` on `--accent-soft` (checked chip, selected caption) | 12.30 / 10.11 | 4.5 |
| Focus / select ring (`--accent`) vs `--bg` | 5.11 / 8.56 | 3 |
| … vs `--stage-theme` (card well) | 4.67 / 7.49 | 3 |
| … vs the light Theme backdrop (N8) | 3.16 (+ the 6px `--bg` halo) | 3 |
| … vs `--surface-3` | 4.21 / 6.16 | 3 |
| `--current` ring vs `--stage-theme`; vs the dock `--bg` | 15.54 / 14.25; 16.97 / 16.28 | 3 |
| `--border-strong` vs `--bg` / `--surface-2` / `--stage-theme` | 3.78 / 3.36 / 3.46 · 3.77 / 3.11 / 3.30 | 3 |
| `--border-strong` vs `--surface-float` | 3.95 / **2.91** | 3 |
| Swatch ring `--text-3` vs `--surface-float` (decision E-6) | 6.26 / 5.48 | 3 |
| Art surface separation: `--stage-theme` vs `--bg` | 1.09 / 1.14 (A: 1.03 / 1.05) | — |
| Viewer Theme backdrop vs the Info panel (light s1 / dark bg) | 1.55 / 1.14 (A: 1.53 / 1.03) | — |
| Mid gray (N5) vs `--bg` | 4.28 / 4.10 | — |
| A black sprite outline vs the dark well | 1.31 (Mid gray is one tap away) | — |

The `--border-strong` ring fails 3:1 on the dark float surface, so swatch rings use `--text-3` instead. APCA is advisory: dark `--text-3` sits near Lc 50, so it stays on metadata at 12 px and up (04 §0.8).

---

## 6. Motion

Durations come from 04 §1.5 (`--dur-1` 120 ms, `--dur-2` 200 ms, `--dur-3` 280 ms; all 0 under reduced motion). Art only ever animates opacity. It never scales, and a swipe translates it by whole device pixels only.

| Moment | Spec | Reduced motion |
|---|---|---|
| First-sync reveal (F-14) | Each card fades 0 → 1 over `--dur-2` as its page arrives, once per card, only for cards entering the viewport | Static |
| Grid → viewer | `<dialog>` fades in over `--dur-2` (`--ease-out`); art fades in over `--dur-1` after `decode()`; no size morph | Cut |
| Viewer → grid | 160 ms fade; the card scrolls into view instantly and takes focus | Cut |
| Prev / next | 120 ms crossfade of two stacked stage layers; a swipe follows the finger in whole device px, then crossfades | Swap |
| Sheets | `translateY` over `--dur-3` with `--ease-spring`; the stage refits once after settling | Instant |
| Selection summary panel | `translateX(100% → 0)` over `--dur-3` (`--ease-out`); the grid reflows once at the start, never per frame | Instant |
| Phone search bar | Opacity + 8 px rise over `--dur-2` | Instant |
| Menus, popovers | Opacity + `translateY(4px → 0)` over `--dur-1` | Opacity, 100 ms |
| Checkbox check | Badge scales 0.6 → 1 over `--dur-2` (`--ease-spring`); never the art | Instant |
| Sidebar collapse | Width snaps; labels cross-fade over `--dur-1` | Instant |
| Toast, progress chip, banner | In: opacity + 8 px rise over `--dur-2`; out: 160 ms | Opacity only |
| Immersive capsules | Fade out after 3 s without input while playing, over `--dur-3` | Stay visible |
| Filmstrip | The current frame scrolls into view with `behavior: "auto"`, never smooth | Same |
| Grid previews | Play previews on: ≤ 8 cards play at their effective fps (02 §4.8) | Starts off |

---

## 7. Accessibility invariants

Behavioural accessibility (semantics, keyboard, live regions, focus order) is in 02 §9–§10. These are the visual invariants every screen must keep:

1. **Focus** is a 2px `--focus` outline, offset 2, over a 6px `--bg` halo, so it shows on every surface and backdrop. Under forced colors it becomes `Highlight`.
2. **Three distinct card signals:** focused = outset ring around well + caption; selected = inset ring + check + caption tint; hover = a 1px `--border-strong` inner edge only. No state relies on colour alone (F-13).
3. **Targets:** ≥ 24 × 24 everywhere; ≥ 44 × 44 on coarse pointers, including chips, the sync status, the size slider, compass cells, filmstrip cells, the fps stepper, zoom, swatches and the sheet's expand button (F-13).
4. **Safe areas:** `viewport-fit=cover`. The top bar, rail, pill, search bar, selection bar, sheet actions, landscape ‹ › and capsules pad `env(safe-area-inset-*)` (F-13).
5. **Nothing floats over content:** bottom scroll padding = pill height + offset + bottom inset (+ the search bar while open), and `scroll-padding` equals the sticky chrome, so focused cards are never hidden (WCAG 2.4.11; F-13).
6. **200% text:** no horizontal page scroll; search collapses to an icon button and is never squeezed out; captions grow; Info labels stack above values; badge text is in rem (F-13).
7. **Forced colors:** the stage and the swatch fills use `forced-color-adjust: none`; swatches keep their `--text-3` ring and visible labels; chips and cards keep system-colour borders (F-13).
8. **Contrast:** every text token is ≥ 4.5:1 on every surface it is used on, and UI parts and focus are ≥ 3:1 (§5.4).
9. **Art:** integer device-pixel scaling, refitted on container resize, window resize **and** DPR change; nothing overlays the art box (02 §4.3; F-13).
10. **Motion control:** "Play previews" pauses all grid motion (WCAG 2.2.2); the viewer's pause is always visible; reduced motion follows §6.
11. **Visible labels** on navigation, Play previews, Select, Download and Open in PixelLab; accessible names contain them (WCAG 2.5.3).

---

## 8. Open visual questions

| # | Question | Default until decided |
|---|---|---|
| 1 | In light mode the **Theme** and **Light gray (N8)** swatches are the same value (Theme follows the theme; N8 never changes). Keep both, or make light Theme the 0.955 well? That would bring back A's 1.03:1 stage-vs-panel collision. | Keep both (decision E-5) |
| 2 | `--stage-white` has no swatch. Drop it at token freeze, or restore White as a sixth swatch? | Unused; F-4 stands |
| 3 | Accent vs PixelLab's brand palette (owner, 01 §11; G23). | Ice blue |
| 4 | Fractional-DPR seams (R3b): one art row can render k ± 1 device px where art × k / DPR is not a whole CSS px. Verify on real Windows 125% and Android 2.625 hardware; if seen, size the viewer canvas from `devicePixelContentBox`. | Phase 1 device check |
| 5 | Phone portrait puts the fps stepper behind the "8 fps" value button (decision E-3) rather than a third dock row, which would cut the art share from ~64% to ~56%. Confirm in mockup review. | Popover |
| 6 | At ≥ 1200 px the selection container switches from the bar (1 selected) to the panel (≥ 2) (decision E-1). Confirm it reads as one mode. | As specified |
| 7 | R3b proposed a 136 px desktop M cell so 128 px canvases stay crisp at M on DPR 1. The desktop default is L (144), which already fits them; M on desktop still smooths 128 px art at DPR 1. | 02 cells unchanged |
| 8 | In-progress chip wording: "2 in PixelLab" was called cryptic (R2 #6, R3a S7); "still generating" mislabels review and failed items. **Resolved (B-19):** "2 generating ↗", with the popover naming generating, needs review and failed counts. | "{n} generating ↗" |
| 9 | Real-device checks: the iOS keyboard over the phone search bar, safe areas under the pill, Android back in sheets (R3a §8). | Phase 1 |
