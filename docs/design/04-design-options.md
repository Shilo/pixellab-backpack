# 04 — Design options for Vitrine

> **Explored options; final direction in 07.** This document is the historical record of the three options built as mockups and reviewed in R3a/R3b. The recommended hybrid, "Quiet Studio, lifted", is specified in `07-recommended-design.md`, and every ruling is in `00-decision-log.md`. Where this document disagrees with 00, 02 or 07, they win. In particular: there are **5** backdrops, not 7 (F-4); the destination is **Folders**, not Collections (F-7); the toggle is **Play previews** (F-7, F-9); there is no "Other" chip (F-8); and V1, V3–V6 and V8–V10 were not adopted (F-1, F-2), while V7's filmstrip was (F-4).

Date: 2026-10-18 · Role: lead visual / interaction design · Status: three options specified for parallel mockup builds; superseded by 07 after mockup review.

"Vitrine" is a working name with the descriptor "Unofficial gallery for your PixelLab assets". The owner decides the final name and brand (§6). No option may imitate PixelLab's logo, mascot, colours or UI.

**Inputs**
- `docs/reviews/R1-research-cross-review.md` (binding D1–D31)
- Research 03, 04, 05, 06 and 08
- `mockups/shared/`
- The companion design docs: `01-product-brief.md`, `02-ux-spec.md` (behaviour) and `03-mockup-requirements.md` (the per-option mockup checklist)

**Ownership and precedence**
- `02-ux-spec.md` owns behaviour: routes, flows, card anatomy, inspector fields, viewer controls, export, states, keymap, accessibility, search, sort and copy. `03-mockup-requirements.md` is the checklist every mockup must pass.
- This document owns layout, visual language, tokens and motion. It also owns each option's **concept-level layout**: what the orchestrator brief defines as the option's distinctive model.
- Where a concept has to depart from 02, the departure is listed in §0.2 and applies to that option's mockup only. Everything not listed there follows 02 and 03 exactly.

**How to use this document.** A developer building option X reads §0 (shared) and the option's own section (§1 A, §2 B, §3 C), alongside 02 and 03. §4–§7 are for reviewers.

---

## 0. Shared foundation (binding for all options)

### 0.1 What every option inherits

| Topic | Rule | Source |
|---|---|---|
| Behaviour | Everything in 02. Navigation sits in a bar, rail or sidebar depending on width. The two destinations are **Library** and **Collections**, and their labels are always visible. | 02 §1–§12, D6 |
| Type chips | **All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI · Other**. Single-select. No counts on chips. "Other" opens the honest "not in the public API" card. | 02 §1.3, §8; D4 |
| Library header | Search · chips · result + status line ("71 assets · Synced just now · 2 in PixelLab") · Sort · Grid size · **Animate** (with a visible label) · Select · ⋯ ("Export all in view…", "Sync now", "Keyboard shortcuts"). Each option arranges these; none may drop one. | 02 §1.3 |
| Grid | Fixed row height and windowing. Semantics: a list of links. At most 16 columns. Sizes: S / M / L / XL. Column counts are per option (§0.2 V2). | 02 §4, D7 |
| Card anatomy | The zones and contents in 02 §4.5: hover checkbox, heart, ⋯, bottom-left badge chip, fit marker, caption. Each option styles them; C drops the caption (V9). | 02 §4.5 |
| Art | 02 §4.3 scaling rules plus §0.6 below. | D8 |
| Previews | Static grid. The Animate toggle is off by default. Fine-pointer hover/focus plays after a 300 ms dwell. The viewer autoplays at **8 fps** and opens paused under reduced motion. | 02 §4.8, ruling |
| Viewer controls | 02 §3.5 and §6. Controls that don't apply are hidden, not disabled (compass directions excepted). | 02 §6.1 |
| Backdrops | **Seven** in these mockups: Stage · Checker · Mid gray (N5) · Light gray (N8) · Dark · Black · White. The viewer choice lasts for the session. The default lives in Settings. **Superseded by F-4: five swatches (Theme, Checker, Light gray N8, Mid gray N5, Black) behind one Backdrop button (07 §5.3).** | ruling (02 §3.5 then listed 6: see V10) |
| Theme | One family per option: light, dark and system (default system), via `color-scheme` + `light-dark()`, with a `data-theme` override on `:root`. | D22 |
| Fonts | System stacks. B adds the system serif stack. C adds one optional self-hosted OFL pixel face (V8). No CDNs. | C16, ruling |
| Icons | Lucide (ISC), inline SVG, one set. The heart uses `fill="currentColor"` when on. | C16 |
| Bars | Opaque only. No `backdrop-filter`. | R1 scope |
| Copy | All microcopy comes from 02 §12. | 02 §12 |

### 0.2 Deviations from 02 (concept-level, per option)

| # | Option | What differs from 02 | 02 / R1 reference | Why | Guardrail |
|---|---|---|---|---|---|
| V1 | A | At ≥ 1200 px with a fine pointer, a **persistent inspector** sits next to the grid. A single click makes a card the **current** asset (shown in the inspector). Double-click, Enter or Space opens the viewer. | 02 §1.2 ("no persistent grid-side inspector"), §3.4 (click opens) | The orchestrator's A concept (Apple Photos / Eagle) | The inspector is the viewer's inspector component with identical content (02 §5). Selection mode (02 §3.9) is unchanged: "current" is not "selected". Below 1200 px, or with a coarse pointer, A behaves exactly as 02. |
| V2 | A, B, C | Column counts differ from 02 §4.2. A loses width to the inspector. B uses larger labelled cards. C uses dense cells plus a stage pane. | 02 §4.2 | Layout is what the three options compare | Zoom level names, the persisted size, the 16-column cap and fixed rows still follow 02. A uses 02's exact cell sizes and defaults. |
| V3 | B | Library "All" (no search) is a page of **shelves**: Recent, Favorites, then one shelf per type. | R1 C7, 02 §1.3 | B's thesis | At most 24 cards per shelf. Any chip, any search and "See all" open the flat 02 grid. |
| V4 | B | An asset opens as a **full-page route**, not a modal `<dialog>`. | D12, 02 §1.1 | Room for maximum metadata and inline downloads | Same route shape (`<parent>/a/<key>?dir=&anim=&state=`) and the same zones and controls as 02 §6.1. Focus goes to the page `<h1>`. Back restores scroll and returns focus to the card. ←/→ move through the list. |
| V5 | C | On desktop and tablet, the **current asset drives an always-visible stage pane**. There is no modal. | D12, 02 §1.2 | Keyboard-first review speed | The phone uses 02's full-screen viewer behaviour. F gives true fullscreen. Enter moves focus into the stage pane. |
| V6 | A, C | Detail-only data (animations, states, style) for the **current** asset loads after a 400 ms dwell, not only when the viewer opens. | R1 weak-claims row, 02 §3.4 | Instant animations without opening anything | Production: one request per dwell, deduped, cached, cancelled on move. Mockups use no network. |
| V7 | C | Frame **filmstrip** | 01 §8 ("filmstrip: deferred") | C's signature | Virtualized beyond 40 frames. Hidden for single-frame assets. |
| V8 | C | Self-hosted OFL **pixel face** for counts, frame numbers and size badges | R1 C16 (pixel webfont cut) | Allowed for C by the ruling | At most 3% of on-screen text. Falls back to `ui-monospace`. The wordmark stays an SVG. |
| V9 | C | **No caption** under cards at any size | 02 §4.1 (caption at M and up) | Contact-sheet density | The title appears in the status bar, the tooltip and the stage header. The accessible name is unchanged. The badge chip stays. |
| V10 | A, B, C | **Seven** backdrops (adds "Dark") | 02 §3.5 (six) | Orchestrator ruling | Resolved by F-4: five backdrops everywhere (00, 07 §5.3). |

### 0.3 Mockup build kit

**Files**
- `mockups/option-a/index.html`, `mockups/option-b/index.html`, `mockups/option-c/index.html`.
- Each is one self-contained file (inline `<style>`, classic `<script>`) loading `../shared/sample-data.js` and `../shared/pixel-utils.js`.
- Each must open from `file://`. That means no ES modules, no `fetch`, no network, no CDN, and no web font except C's optional local face.

**What to follow**
- **Routes, keys, data rules, required screens, real-vs-fake and acceptance checks:** 03 §2–§5 and 02 §1.1. Keys are 12-character opaque strings; precomputed is fine.
- **Option extras on top of 03:**
  - A: the inspector's three states (nothing current, one current, multi-selection summary).
  - B: shelves, the detail page, boards.
  - C: three panes, the stage-over-sheet tablet layout, the selection-summary pane.
- **Playback:** `PixelTicker.player(Array(n).fill(125), draw)` (8 fps).
- **Sizing:** `integerScale()` on every art element. Re-fit on `ResizeObserver` and on DPR change.
- **Element types:** static art in `<img>`; animated art in a `<canvas>` whose backing store is the frame size, with `imageSmoothingEnabled = false` after every resize.
- **Trimming** (02 §4.3 rule 4) is impossible from `file://` because canvas readback is tainted. Bottom-align characters and objects untrimmed, and label the gap in the review notes.

### 0.4 Viewport classes

Form factors follow 02 §0.

| Review viewport | 02 form factor | Default grid size (A; B and C: §2, §3) | Pointer to test |
|---|---|---|---|
| 360×780 | Phone portrait (w < 600) | M | coarse |
| 780×360 | Compact height (h < 480, any width) | M | coarse |
| 768×1024 | Tablet (600–1199) | M (< 840) | coarse |
| 1180×820 | Tablet (600–1199) | L (≥ 840) | coarse (iPad landscape), then fine |
| 1440×900 | Laptop (1200–1599) | L | fine |
| 1920×1080 | Desktop (1600–2559) | L | fine |
| 2560×1080 | Ultrawide (≥ 2560) | L | fine |

- Shell changes use window media queries in CSS px. Cards and panels use container queries.
- `(pointer: coarse)` → 44 px hit targets. `(hover: hover) and (pointer: fine)` → hover affordances. `(any-pointer: fine)` adds hover without shrinking targets.
- Set `viewport-fit=cover`. Every edge-anchored bar or rail pads with `env(safe-area-inset-*)`.
- The shell uses `min-height: 100svh`. Fullscreen viewers and sheets use `100dvh`.

### 0.5 Grid mechanics

```js
// JS owns the column count because fixed-row windowing needs it (02 §4.1 cap: 16).
const cols = Math.min(16, Math.max(1, Math.floor((W + gap) / (minCell + gap))));
const cell = (W - (cols - 1) * gap) / cols;   // fractional CSS px is fine; the art inside is integer-scaled
const rowHeight = cell + captionHeight;        // A: 0 / 24 / 44 / 44 (S/M/L/XL) · B: 44 · C: 0
// CSS: grid-template-columns: repeat(var(--cols), 1fr); gap: var(--gap-grid);
```

**Zoom levels.** Values are the minimum cell, then the art-box inset, in CSS px.

| Option | Phone / compact height | Tablet | Laptop and up | Default | Gap · gutter (phone / tablet / laptop+) |
|---|---|---|---|---|---|
| A (= 02 §4.1) | S 72·4 · M 104·4 · L 144·8 · XL 272·8 | same | same | M < 840, L ≥ 840 | 8·12 / 12·16 / 12·24 |
| B | S 100 · M 140 · L 220 · XL 328 (L = XL = 1 column at 360) · inset 10 | S 120 · M 152 · L 220 · XL 300 · inset 14 | S 136 · M 168 · L 240 · XL 320 · inset 14 | M everywhere (B's M ≈ 02's L) | 12·4vw / 20·4vw / 24·4vw (gutter `clamp(16px, 4vw, 64px)`) |
| C | S 60 · M 76 · L 104 · XL 156 · inset 6 | S 64 · M 88 · L 120 · XL 168 · inset 6 | same as tablet | M everywhere | 3·8 / 4·12 / 4·12 |

### 0.6 Art and backdrops (all options)

- **Scale.** Follow 02 §4.3 exactly: integer device-pixel k via `integerScale()`, `image-rendering: pixelated`, size set with `width`/`height`. k < 1 → smooth overview + fit marker. Never use `transform`, `zoom`, `object-fit` or `background-image` on art.
- **Card stage.** Always `--stage-theme`, which has chroma 0 and per-option lightness (02 §4.5; no checker in the grid).
  - **Restyle of 02's hover state:** card chrome never tints the art backdrop. Hover shows a ring instead of lightening the surface, so the backdrop stays identical while you judge colours.
- **Stage rules.** Set `forced-color-adjust: none`. Checker = `repeating-conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%) 0 0 / 16px 16px` (fixed 8 CSS px squares).
- **Art transitions.** Art only ever animates opacity. During a direct-manipulation swipe it may translate by whole device pixels (`Math.round(dx × dpr) / dpr`). It never scales.

**Backdrops (identical values in every option; chroma 0)**

| Swatch label | Token | Value |
|---|---|---|
| Stage | `--stage-viewer` | per option (below) |
| Checker | `--checker-a` / `--checker-b` | light `oklch(0.86 0 0)` / `oklch(0.78 0 0)` · dark `oklch(0.30 0 0)` / `oklch(0.25 0 0)` |
| Mid gray (N5) | `--stage-mid` | `oklch(0.57 0 0)` |
| Light gray (N8) | `--stage-light` | `oklch(0.83 0 0)` |
| Dark | `--stage-dark` | `oklch(0.22 0 0)` |
| Black | `--stage-black` | `oklch(0 0 0)` |
| White | `--stage-white` | `oklch(1 0 0)` |

What "Stage" means in the viewer, and the initial Settings value for "Default viewer backdrop":

| Option | "Stage" in the viewer | Initial default |
|---|---|---|
| A | Light gray (N8) in light mode, Dark in dark mode | Stage |
| B | Light gray (N8) in light mode, Mid gray (N5) in dark mode | Stage |
| C | `--stage-theme` | Checker |

### 0.7 Viewer control facts that shape the visuals (from 02 §3.5 and §6)

| Control | Fact to design for |
|---|---|
| Top bar | Close ×, title + state, ‹ › (fine pointer; on coarse pointers they sit at the stage edges), ⋯ (Copy image, Copy prompt, Reload from PixelLab, Fullscreen, Keyboard shortcuts), Info toggle (`I`) |
| Animation picker | A radiogroup. "Rotations" first, then "Walk · 8f". |
| Compass | A 3×3 radiogroup with N at the top. The **centre shows the current direction name and is not interactive**. Missing directions are disabled. Hidden for 1-direction assets. 44 px cells on coarse pointers. |
| State switcher | Segmented control, or a menu above 4 states. Shown only when there are > 1 state. |
| Transport | Play/Pause · step back / forward · native range scrubber ("3 / 8") · **"8 fps" button → popover stepper (1–30) + "Reset to 8 fps"** · Loop toggle (off = play once). Shows "Loading frames 3/8" while frames decode. |
| Zoom | **Fit · 1:1 · − · +** and a readout ("Fit · 3×", "4×"). Steps are CSS multiples {1, 2, 3, 4, 6, 8, 12, 16}, rendered as integer device px. |
| Backdrop | A button or swatch row with the seven swatches (V10; superseded by F-4: one button, five swatches) |
| Tilesets / Tiles Pro | A Grid toggle and a tile-info readout. Tiles Pro shows its variations in √n columns. |
| Inspector | 02 §5 order: title + subtitle → actions row (Download ▾ · Favorite · Add to folder · Open in PixelLab ↗) → "In folders" chips → per-type fields → PixelLab section → **Technical details** (collapsed; masked ID + Copy asset ID warning) |

### 0.8 Accessibility invariants owned by visual design

- **Focus ring**, two-tone so it shows on any backdrop:
  `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; box-shadow: 0 0 0 6px var(--bg); }`
  The shadow paints `--bg` beneath the outline's 2–4 px band. Under forced colours, only `outline-color: Highlight` remains.
- **Targets.** ≥ 44×44 hit area on coarse pointers; the visual may be smaller, with padding. Fine pointers: A 32, B 36, C 28 px (all ≥ 24).
- **Sticky chrome.** `scroll-padding-top/bottom` equals the sticky chrome heights (2.4.11).
- **Contrast.** Every text token passes 4.5:1 on `--bg` and on `--surface-1..3` in both modes (computed tables per option). APCA is advisory. Dark-mode `--text-3` sits at Lc 43–55, so it is reserved for non-essential metadata at 12 px or larger.
- **Never colour alone.** Selected = check + ring. Current = ring. Favorite = filled heart. Active chip = check + fill.
- **Everything else** (semantics, live regions, keyboard, touch) is in 02 §9–§10.

### 0.9 Surface map (02 §2 → where each option styles it)

| 02 surface | A | B | C |
|---|---|---|---|
| S1 Connect | Connect | Connect | Connect |
| S2 Library / S4 Favorites / S5 Folder | Top bar + chips + grid | Shelves page; grid view | Left pane + sheet |
| S3 Collections | Collections page | Boards | Left pane (desktop); list (compact) |
| S6 Viewer | Viewer (`<dialog>`) | Detail page (V4) | Stage pane (V5); phone stage screen |
| S7 Inspector | Inspector (grid-side at ≥ 1200 and in the viewer) | Detail info column | Stage-pane inspector |
| S8 Download menu | Popover base | Detail "Download" tiles + popover base | Download menu |
| S9 Export dialog · S10 progress chip · S11 ready sheet · S12 report | Export rows | Export rows | Export rows |
| S13 Add to folder · S14 Folder name · S15 Confirm | Folder sheet; dialog base | Add to folder (tiles); dialog base | Folder popover; dialog base |
| S16 Settings · S17 Help · S23 Import result | Dialog base | Dialog base | Dialog base |
| S18 Sync popover · S19 In-progress popover · S20 Card menu · S21 Sort menu | Popover base | Popover base | Popover base |
| S22 Toasts | Toast | Toast | Toast |
| §8 Other card / Images-gate card / empty states | Empty state | Empty state | Empty state |

### 0.10 Icons (Lucide, inline SVG)

Copy each SVG from the Lucide site for the version you pin, and keep the ISC notice in an HTML comment. Check names against that version, because Lucide renames icons from time to time.

| Function | Lucide name | Function | Lucide name |
|---|---|---|---|
| Library | `layout-grid` | Play / pause | `play` / `pause` |
| Collections | `folders` | Frame step | `step-back` / `step-forward` |
| Favorite | `heart` (fill when on) | Loop | `repeat` |
| Folder / add | `folder` / `folder-plus` | Zoom | `minus` / `plus`; Fit `scan`; 1:1 text |
| Search | `search` | Fit marker | `shrink` |
| Settings | `settings` | Backdrop button | `contrast` |
| Sort | `arrow-down-up` | Fullscreen | `maximize-2` / `minimize-2` |
| Select / checkbox | `square-check` / `square` | Directions | `arrow-up` … `arrow-up-left` (8) |
| Animate | `circle-play` | Prev / next | `chevron-left` / `chevron-right` |
| Download | `download` | Copy | `copy` |
| Open in PixelLab | `external-link` | Theme | `sun` / `moon` / `monitor` |
| More (⋯) | `ellipsis` | Keyboard shortcuts | `keyboard` |
| Close | `x` | Sync now | `refresh-cw` |
| Info | `info` | In progress (static) | `loader-circle` |
| Other chip / card | `circle-help` | Warning | `triangle-alert` |
| Rename / delete folder | `pencil` / `trash-2` | Token | `key-round` |
| Sidebar collapse (A) | `panel-left-close` / `panel-left-open` | Grid overlay | `grid-3x3` |
| Type glyphs | Characters `person-standing` · Objects `box` · Images `image` · Tilesets `grid-2x2` · Tiles `layers` · Maps `map` · UI `panels-top-left` · Other `circle-help` | | |

### 0.11 Font stacks

```css
--font-ui:   system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace;
/* B only */
--font-display: ui-serif, "New York", "Iowan Old Style", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif;
/* C only: optional local OFL face; a missing file falls back silently */
--font-pixel: "Departure Mono", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
```

- Apply `font-variant-numeric: tabular-nums` to every number in the UI.
- Write sizes with the real multiplication sign: `64×64` (U+00D7).
- In the mockup, C's `@font-face` points at `../shared/fonts/DepartureMono-Regular.woff2`. Production self-hosts a subset: 0–9, A–Z, `× / · : + − %`.

---

## 1. Option A — "Quiet Studio" (Library + Inspector)

### 1.1 Concept

| | |
|---|---|
| Promise | **Everything you've made in PixelLab, in one calm library: click to inspect, open to play.** |
| Best for | Most users. People fluent in Apple Photos, Finder or Eagle. Mixed desktop and phone use. Large libraries. |
| Information architecture | 02's shell, plus a persistent inspector on wide screens. **Desktop**: collapsible sidebar · grid · inspector. **Tablet**: rail · grid; the inspector lives in the viewer. **Phone**: floating pill bar; tap opens the fullscreen viewer with its inspector sheet. |
| Visual language | Dark-first, near-neutral cool grays (chroma ≤ 0.006), tonal surfaces, hairlines instead of boxes, and one ice-blue accent used only for current/selected, focus, the primary action and active state. |
| Interaction signature | V1: at ≥ 1200 px with a fine pointer, a click makes a card current and fills the inspector, and double-click, Enter or Space opens the viewer. Elsewhere a tap opens the viewer (02). Arrow keys move focus, and at ≥ 1200 the current card follows focus, as in Finder. |
| References | Apple Photos (Library/Collections, viewer), Eagle (inspector), Linear 2026 (restraint) |

### 1.2 Layout per viewport

| Viewport | Navigation | Header (search · chips · result line · toolbar) | Grid | Inspector | Viewer | Selection bar |
|---|---|---|---|---|---|---|
| 360×780 | Floating pill, 56 tall, labelled Library · Collections, centred, bottom 12 + safe area. A round 56 Search button sits beside it. | **Top bar 52:** title · Select · Settings. **Chips row 48** (sideways scroll). **Toolbar row 40:** result + status line · **Animate** · View (sort + grid size menu) · ⋯. All three collapse on scroll down and return on scroll up. Search morphs the pill into a full-width field. | M · 3 × 107 · gap 8 · gutter 12 · caption 24 | — | Full-screen `<dialog>`. Top bar 52. ‹ › at the stage edges. Dock 104 (56 + 48). Inspector sheet: peek (title + actions row) → half → full. | Floating bar replaces the pill (100% − 24, 56) |
| 780×360 | **Rail 72**, labelled: Library, Collections; bottom: Search, Select, Settings | One slim 48 row: chips (scroll) · Animate · View · ⋯. The result line leads the grid content and scrolls away. The row collapses on scroll down. | M · 6 × 107 · gap 8 · gutter 12 | — | Immersive full-bleed stage. Art box 748 × 240, excluding the 56 top and 64 bottom control zones. Opaque capsules fade after 3 s while playing. Info opens a right sheet, 320. | Floating bottom bar |
| 768×1024 | **Rail 80** (Library, Collections; Settings at the bottom) | **Top bar 56:** title · search (flex, max 320) · Select. **Chips row 48** (scroll if all 9 don't fit). **Toolbar row 40:** result line · Sort · size slider · Animate · ⋯. | M · 5 × 122 · gap 12 · gutter 16 | — | Full-screen `<dialog>`. Inspector = bottom sheet (02). Dock 100. | Floating bottom bar, 56, max 600 |
| 1180×820 | Rail 80 | Same as 768; search max 400 | L · 6 × 168 · gap 12 · gutter 16 | In the viewer: right panel 320, open by default (02 §3.6) | Stage 860 × 664 with the panel open | Floating bottom bar |
| 1440×900 | **Sidebar 240**: wordmark, Library, Collections, Favorites + folders (A–Z) inline, New folder; footer: sync status + Settings. Collapsible to the 80 rail (persisted). | **Top bar 56:** title · search (max 480, `/`) · Sort · size slider · Animate · ⋯ · Select. **Chips row 48** (all 9 fit). **Result line 28.** | L · 5 × 152 · gap 12 · gutter 24 (6 × 152 with the sidebar collapsed) | **Persistent right, 340** (V1) | Viewer: panel 340, stage 1100 × 744 | **Top contextual bar** replaces the top bar |
| 1920×1080 | Sidebar 240 | Same; search max 560 | L · 8 × 148 | Persistent, 360 | Panel 360, stage 1560 × 924 | Top contextual bar |
| 2560×1080 | Sidebar 240 | Same | L · 12 × 148 (S reaches the 16 cap) | Persistent, 360; text measure ≤ 65ch | Panel 360, stage 2200 × 924 | Top contextual bar |

### 1.3 Wireframes

**A1 — Desktop library, 1440×900. Orb Mage is the current asset (ring) and is shown in the inspector**

```text
+----------------------+----------------------------------------------------------------------+---------------------------+
| [#] Vitrine     [<<] | Library      [Q Search 71 assets          / ]   Newest v             |                           |
|                      | [-]--o----[+]   [>] Animate   [..]   Select                          |  +---------------------+  |
| [#] Library          +----------------------------------------------------------------------+  | preview  300 x 200  |  |
| [/] Collections      | (All)(Characters)(Objects)(Images)(Tilesets)(Tiles)(Maps)(UI)(Other) |  | viewer backdrop     |  |
|                      | 71 assets . Synced just now . (2 in PixelLab)                        |  |                     |  |
| COLLECTIONS          +----------------------------------------------------------------------+  +---------------------+  |
| <3 Favorites      9  |  +---------+  +=========+  +---------+  +---------+  +---------+     | Orb Mage                  |
| [] 1-bit platf.   5  |  |         |  |[ ]    <3|  |         |  |         |  |         |     | Character . Base          |
| [] Dungeon kit   10  |  |   art   |  |   art   |  |   art   |  |   art   |  |   art   |     | [Download v][<3][+F][^]   |
| [] Favorites t.   5  |  |>4dir.1an|  |         |  |         |  |     fit |  |         |     | (Hero party)              |
| [] Hero party     7  |  +---------+  +=========+  +---------+  +---------+  +---------+     |                           |
| [] UI pack        9  |  Android Cou  Orb Mage     Bear Trap .  Meadow Ruin  Dirt -> Gra     | Canvas      64 x 64 px    |
| + New folder         |  Char. 128x1  Char. 64x64  Obj. 64x64   Map 768x512  Tileset 64x     | Directions  8 . S SE E..  |
|                      |  +---------+  +---------+  +---------+  +---------+  +---------+     | View        Low top-down  |
|                      |  |         |  |         |  |         |  |         |  |         |     | Created     Jan 14, 2026  |
|                      |  |   art   |  |   art   |  |   art   |  |   art   |  |   art   |     |                           |
|                      |  |         |  |         |  |         |  |         |  |         |     | Prompt            [Copy]  |
|                      |  +---------+  +---------+  +---------+  +---------+  +---------+     | | young mage with     |   |
|                      |  Name         Name         Name         Name         Name            | | lavender hair ...   |   |
+----------------------+  Type . size  Type . size  Type . size  Type . size  Type . size     | Tags (hero)(mage)(party)  |
| Synced just now      |  5 cols x 152 (L), gap 12, gutter 24; caption 44                     | PixelLab: Animate ^       |
| [*] Settings         |                                                                      | > Technical details       |
| Unofficial . not     |                                                                      |                           |
| affiliated with      |                                                                      |                           |
| PixelLab             |                                                                      |                           |
+----------------------+----------------------------------------------------------------------+---------------------------+
  sidebar 240 (--bg)     content (--bg); cards on --stage-theme, ring = "current"                inspector 340 (--surface-2)
```

**A2 — Desktop viewer, 1440×900 (`<dialog>`, inspector panel open)**

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [x]  Android Courier . Base      (<) (>)      3 / 71                                                   [..]  [i]        |
+-----------------------------------------------------------------------------------------------+-------------------------+
|                                                                                               | Android Courier         |
|                                                                                               | Character . Base        |
|                                                                                               | [Download v][<3][+F][^] |
|                                   +------------------------+                                  | (Hero party)            |
|                                   |                        |                                  |                         |
|                                   |   art at integer k     |                                  | Canvas      128 x 128 px|
|                                   |   (Fit . 5x)           |                                  | Directions  4 . S E N W |
|                                   |                        |                                  | Animations  Walk . 8 fr |
|                                   +------------------------+                                  | View        Low top-down|
|                                                                                               | Playback    8 fps (defau|
|     stage 1100 x 744 . backdrop: Stage (A: N8 light / Dark dark)                              | Prompt            [Copy]|
|                                                                                               | slim android courier .. |
|                                                                                               | PixelLab: Animate ^     |
+-----------------------------------------------------------------------------------------------+ > Technical details     |
| [|<]  ( > )  [>|]   |--|--|--|--o--|--|--|--|   3 / 8      [ 8 fps ]   [Loop]                 |                         |
| [ Walk . 8f v ]  [ S v ]     (s)(#)(5)(8)(d)(B)(W)      [Fit] [1:1] [-] [+]  Fit . 5x         |                         |
|                                                                                               |                         |
|                                                                                               |                         |
+-----------------------------------------------------------------------------------------------+-------------------------+
  top bar 56 . stage . dock 52 + 48 (state switcher joins row 2 when > 1 state)                   inspector panel 360 (I)
```

**A3 — Phone library, 360×780**

```text
+--------------------------------------+
| Library          [>] [..] Select [*] |
|--------------------------------------|
| (All)(Characters)(Objects)(Images)(T>|
| 71 assets . Synced . (2 in PixelLab) |
|--------------------------------------|
| +---------+ +---------+ +---------+  |
| |         | |         | |         |  |
| |   art   | |   art   | |   art   |  |
| |  >4dir  | |         | |     <3  |  |
| +---------+ +---------+ +---------+  |
| Android Co..Orb Mage    Bear Trap..  |
| +---------+ +---------+ +---------+  |
| |         | |         | |         |  |
| |   art   | |   art   | |   art   |  |
| |         | |         | |         |  |
| +---------+ +---------+ +---------+  |
| Name        Name        Name         |
| +---------+ +---------+ +---------+  |
| |         | |         | |         |  |
| |   art   | |   art   | |   art   |  |
| |         | |         | |         |  |
| +---------+ +---------+ +---------+  |
| Name        Name        Name         |
|    .------------------------.  .---. |
|    | [#] Library  [/] Colls |  | Q | |
|    '------------------------'  '---' |
+--------------------------------------+
  3 cols x 107 (M), gap 8, pad 12; caption 1 line; floating pill 56 + round Search 56
```

**A4 — Phone viewer, 360×780: inspector sheet at peek, then at half**

```text
+--------------------------------------+   +--------------------------------------+
| [x] Android Courier . Base    [..]   |   | [x] Android Courier . Base    [..]   |
|--------------------------------------|   |--------------------------------------|
|                                      |   |          +----------------+          |
|          +----------------+          |   |          | art (refits)   |          |
|          |                |          |   |          +----------------+          |
| (<)      |  art, Fit k    |      (>) |   | ( > )  |--|--o--|--|   3 / 8  [S v]  |
|          |                |          |   |--------------------------------------|
|          +----------------+          |   |                ====              [^] |
|                                      |   | Android Courier . Character          |
|     stage (swipe < > v)              |   | [Download v] [<3] [+ Folder] [^]     |
|--------------------------------------|   | (Hero party)                         |
| ( > )  |--|--|--o--|--|--|   3 / 8   |   | Canvas      128 x 128 px             |
| [S v][Walk v][(s) Stage][Fit][8 fps] |   | Animations  Walk . 8 frames          |
|--------------------------------------|   | Prompt                      [Copy]   |
|                ====              [^] |   | slim android courier in navy ...     |
| Android Courier . Character          |   | > Technical details                  |
| [Download v] [<3] [+ Folder] [^]     |   |                                      |
| Details                              |   |                                      |
|                                      |   |                                      |
+--------------------------------------+   +--------------------------------------+
  viewer, sheet at peek (title + actions)     sheet at half (50dvh); handle + [^] button; full = 100dvh - 52
```

**A5 — Phone landscape viewer, 780×360**

```text
+------------------------------------------------------------------------------+
| .------------------------------.                        .------------------. |
| | [x]  Android Courier . Base  |                        | [i]  [..]        | |
| '------------------------------'                        '------------------' |
|                                +------------+                                |
|                                |  art       |                                |
|  (<)                           | Fit k=11   |                           (>)  |
|                                |            |                                |
|                                +------------+                                |
|                                                                              |
|     .------------------------------------------------------.  .------------. |
|     | [|<] ( > ) [>|]  |--|--|--o--|--|--|  3/8  [8 fps]   |  | (s) [Fit]  | |
|     '------------------------------------------------------'  '------------' |
+------------------------------------------------------------------------------+
  780 x 360 immersive: opaque capsules fade after 3 s while playing; art box 748 x 240 (control zones excluded)
```

**A6 — Selection mode and export dialog, 1440×900**

```text
+----------------------+--------------------------------------------------------------------------------------------------+
| [#] Vitrine     [<<] | [x]  12 selected . Select all          [<3] Favorite    [+F] Add to folder    [ Download ]       |
|                      +----------------------------------------------------------------------+---------------------------+
| [#] Library          | (All)(Ch+--------------------------------------------------+)(Other) |                           |
| [/] Collections      |  +======| Export 12 assets                                 [x]=+     |  +------+------+------+   |
|                      |  |   [v]| 3 characters (5 states) . 9 objects              |   |     |  | th   | th   | th   |   |
| COLLECTIONS          |  |   art|                                                  |   |     |  +------+------+------+   |
| <3 Favorites       9 |  |      | Presets   [x] Game-ready   [ ] Frames   [ ] GIFs |   |     |  | th   | th   | +6   |   |
| [] 1-bit platf.    5 |  +======| States    (o) All states   ( ) Base only         |===+     |  +------+------+------+   |
|                      |         | > Advanced  (scale, GIF background, loop, trim)  |         |                           |
|                      |  +------|                                                  |===+     |  12 selected              |
|                      |  |   [ ]| 412 files . about 38 MB                          |   |     |  3 characters . 9 objects |
|                      |  |   art| vitrine-selection-12-2026-10-18.zip              |   |     |  412 files . ~38 MB       |
|                      |  |      | Saves straight to disk (Chromium)                |   |     |  [ Download...         ]  |
|                      |  +------|                                                  |===+     |  [ Add to folder...    ]  |
|                      |         |                           [ Cancel ]  [ Export ] |         |  [ Favorite            ]  |
|                      |         |                                                  |         |  [ Clear (Esc)         ]  |
|                      |         |                                                  |         |                           |
|                      |         |                                                  |         |                           |
|                      |         +--------------------------------------------------+         |                           |
+----------------------+----------------------------------------------------------------------+---------------------------+
  selection mode: top contextual bar replaces the header rows; inspector shows the summary; dialog 560 on --surface-2 over --scrim
```

### 1.4 Components

| Component | Spec (A) |
|---|---|
| Sidebar (≥ 1200) | 240 wide, `--bg`, 1px right `--border`. **Header** 56: mark (12 cells at 2 px = 24) + wordmark; collapse button 28 (`panel-left-close`). **Rows** 32 tall, radius 8, padding 0 10, gap 8: icon 18 `--text-3` + label `--step-0` `--text-2` (+ count `--step--1` `--text-3` on Favorites and folders). Hover `--surface-2`. Active (`aria-current`) `--surface-3`, with label and icon `--text-1` at 600. **Section label** "Collections": 11 px / 600, uppercase, +0.06em, `--text-3`. **Footer**: sync status (`--step--1` `--text-2`; click opens S18), Settings row, short disclaimer (`--step--1` `--text-3`). **Collapsed** to the 80 rail: the width snaps with no tween, and labels stay visible under the icons (02: labels always visible). |
| Rail | 80 wide on tablet, 72 at compact height. `--bg`, 1px right `--border`. Items 64 × 56: icon 24 over an 11 px / 500 label. Active: a 56 × 32 `--surface-3` pill behind the icon; label `--text-1` at 600. Compact height adds Search, Select and Settings at the bottom. `padding-left: env(safe-area-inset-left)`. |
| Floating pill (phone) | 56 tall, radius 999, `--surface-3` (opaque), `--shadow-float`, 1px `--hairline` border. Two labelled tabs, each 104 × 48 (icon 20 + label `--step--1` / 500, side by side). The active tab gets a `--bg` inner pill, `--text-1` and weight 600. Search circle 56. Bottom offset `max(12px, env(safe-area-inset-bottom))`. Search morphs the pill into a 56 px field (100% − 24) over `--dur-2`, instantly under reduced motion. |
| Top bar | 56 tall (52 on phone), `--bg`. A 1px `--border` hairline appears only after the content scrolls. Title `--step-2` / 600. **Search**: 36 tall (44 on coarse), radius 10, `--surface-2`, 1px transparent border → `--border-strong` on hover; `search` icon 16 `--text-3`; keycap "/" 20 × 20, radius 4, 1px `--border`, mono 11 px (fine pointer only); clear button when filled. **Buttons** 32 tall (44 on coarse), radius 8, `--text-2`; hover `--surface-2` + `--text-1`; pressed `--surface-3`. **Animate**: `circle-play` 16 + the visible label "Animate", `aria-pressed`; on = `--accent-soft` background. |
| Chips row | 48 tall. Chips are 32 tall on fine pointers; on coarse, 36 visual inside a 44 hit area. Radius 999, padding 0 12, `--step-0` / 500, gap 6. Rest: `--surface-2`, `--text-2`, 1px border (transparent in dark, `--border` in light). Hover: `--surface-3`, `--text-1`. Checked: `--accent-soft`, `--text-1`, 1px `color-mix(in oklch, var(--accent) 40%, transparent)`, leading `check` 14. "Other" carries a leading `circle-help` 14. |
| Result line | 28 tall, `--step--1` `--text-2`: "71 assets · Synced just now". The in-progress chip "2 in PixelLab" (24 tall, radius 999, `--surface-2`, static `loader-circle` 12) opens S19. During sync it shows a 2px determinate bar along its bottom edge (`--accent`) and "Syncing… 340 of ~1,200". |
| Size slider | 120 wide, `<input type="range" min="1" max="4" step="1">` between `minus` / `plus` buttons (28). The phone uses a 4-option menu inside View. |
| Asset card | Square stage, radius 10, `--stage-theme`, inner edge `inset 0 0 0 1px var(--hairline)`, art inset per 02 §4.1. Opaque controls are `--surface-3`. **Top-left**: hover checkbox, 20 × 20, radius 6, 1.5px `--border-strong` ring; checked = `--select` fill + `check` 12 in `--accent-contrast`. **Top-right**: filled heart 12 in an 18 circle (favorites); on hover, heart toggle + ⋯, both 28, radius 8. **Bottom-left**: badge chip, 18 tall, radius 999, `--font-mono` 11 px `--text-2`; 02 short text at M, full text at L/XL; ▶ prefix when animated; type glyph in mixed views. **Bottom-right**: fit marker "fit" (M and up). **Caption**: M = title, `--step--1` / 500 `--text-1`, one line (24); L/XL = title + "{Type} · 64×64" in `--step--1` `--text-3` (44). **States:** hover → inner edge 1px `--border-strong`, controls fade in over `--dur-1`; **current** (≥ 1200) → `inset 0 0 0 2px var(--select)`; **selected** → current ring + filled checkbox; focus → the two-tone ring (outset). Never scale or lift. |
| Inspector (grid-side, ≥ 1200) | 340 wide (360 at ≥ 1600), `--surface-2`, 1px left `--border`, padding 20, own scroll; sections separated by 24 of space, no rules. **Preview** 300 × 200, radius 6, on the viewer's Stage backdrop, static integer-fit thumbnail (plays on hover, or when Animate is on). **Title** `--step-2` / 600, leading 1.25. **Subtitle** `--step--1` `--text-2` ("Character · Base"). **Actions row**: Download ▾ (primary split, 36: `--accent` / `--accent-contrast`, ▾ part 28 behind a 1px `oklch(0 0 0 / 0.15)` divider) · heart · `folder-plus` · `external-link` (36 each). **In folders** chips, 24 tall. **Fields** (`<dl>`): rows 28, label 96 px `--step--1` `--text-3`, value `--step-0` `--text-1`, tabular. **Prompt / description**: `--font-mono` 12.5 px / 1.6 `--text-2` in a `--surface-1` well, radius 6, padding 10 12, clamped to 6 lines with "Show more"; Copy top-right. **PixelLab** section: links with ↗. **Technical details**: a collapsed `<details>`. **Nothing current**: "Select an asset to see its details. Double-click to open it." in `--text-3`. **Selection mode with ≥ 2 selected**: a 3 × 3 mosaic of 96 cells (gap 6, "+N" last); "12 selected" `--step-2`; breakdown `--text-2`; estimate `--text-3`; stacked 36 buttons mirroring the selection bar. |
| Viewer frame | `<dialog>` at 100dvh, `--bg`, opaque (no `::backdrop`). **Top bar** 56 (52 on phone): × 32 · title `--step-1` / 600 + state `--text-2` · ‹ › 32 (fine pointer) · position "3 / 71" `--step--1` `--text-3` · ⋯ · Info toggle. **Stage**: viewer backdrop, padding 24 vertical / 64 horizontal. On coarse pointers ‹ › are 44 circles (`--surface-3`) inside the 64 px gutters, never over the art box. Inspector: the same component, docked right (≥ 840) or as a sheet. |
| Dock: transport row (52) | `step-back` 32 · Play/Pause, a 40 circle (`--surface-3`, icon `--text-1`) · `step-forward` 32 · scrubber (flex): track 4 px `--surface-3`, radius 2, filled part `--accent`, thumb a 14 circle in `--text-1` with a 2px `--bg` ring, ticks 1 × 6 px `--text-3` at 40% (≤ 48 frames) · readout `--font-mono` `--step--1` `--text-2` · "8 fps" button → stepper popover · Loop toggle. |
| Dock: context row (48) | Animation picker: a 160 × 32 dropdown "Walk · 8f ▾" (radiogroup listbox). State: segmented control, 32 tall, radius 8, checked `--surface-3` + `--text-1` at 600. Compass: an "S ▾" button that opens it. Backdrop: seven 20 circles (28 hit area, 44 on coarse), 1px `--border-strong` ring, checked = a 2px `--focus` ring at offset 2. Zoom: Fit · 1:1 · − · + (28 tall) + readout "Fit · 5×" in `--text-3`. |
| Compass | `popover="auto"` (it stays open while you click inside it). 3 × 3 grid of 36 cells (44 on coarse), gap 2, radius 8. Cells: `--surface-2`, icon `--text-2`. Checked: `--accent` fill + `--accent-contrast` icon. Disabled: 35% opacity. Centre: the direction name, `--step--1` / 600 `--text-2`, not interactive. |
| Inspector sheet (phone, tablet portrait) | `--surface-2`, top radius 14. Handle 36 × 4, radius 2, `--text-3` at 40%. Detents: peek (title + actions row) · half 50dvh · full 100dvh − 52. A 44 expand/collapse button (`chevron-up` / `chevron-down`) sits top-right. No scrim. The art refits into the space above the sheet once it settles. |
| Top contextual bar (≥ 1200, selection mode) | 56 tall, replacing the top bar. Background `color-mix(in oklch, var(--accent) 10%, var(--bg))`. Left: × (Esc) · "12 selected" `--step-1` / 600 · "· 4 hidden by filter" `--text-2` (when relevant) · "Select all" text button in `--accent-text`. Right: Favorite / Unfavorite · Add to folder… · Remove from folder (folder view) · Download (primary, 32). |
| Floating selection bar (< 1200) | Pill 56 tall, radius 999, `--surface-3`, `--shadow-float`, max 600, centred, bottom 16 + safe area. Contents: × · "12 selected" · spacer · heart · `folder-plus` · (remove, in folder view) · Download (primary, 40). On phone it replaces the nav pill. |
| Popover / menu base | Radius 14, `--surface-3`, 1px `--border`, `--shadow-float`, padding 6. Rows 32 (44 on coarse), radius 8, hover `--surface-2`, checked row with a leading `check`. Used by S8, S18–S21. |
| Dialog base | `<dialog>`, radius 14, `--surface-2`, 1px `--border`, `--shadow-float`, `::backdrop` `--scrim`. Header 56: title `--step-1` / 600 + ×. Body padding 24. Footer 64 with right-aligned buttons. Phone: bottom sheet at 100dvh − 24 with a sticky footer. Used by S9, S12–S17, S23. |
| Export dialog (S9) | Dialog base, 560 wide. **Presets** first. Single asset: radio cards 56 tall, radius 10, 1px `--border`; checked = 2px `--select` border + check. Multi: checkbox chips (Game-ready · Frames · GIFs) styled like the library chips. **Scope** rows as segmented controls. **Advanced** is a collapsed `<details>`. Estimate in `--text-2`, and the filename preview in `--font-mono` `--step--1` `--text-3`. Buttons: Cancel (ghost) · Export (primary, 36). |
| Export progress chip (S10) · ready sheet (S11) | Chip: bottom-left of the content area, 16 from the edges (phone: 12 above the pill). 40 tall, radius 999, `--surface-3`, `--shadow-float`, "Exporting 132 / 480 · 41 MB", a 2px `--accent` progress line, and Cancel. Ready sheet: a dialog-base sheet with "Share or save…" (primary) and "Download file". |
| Folder sheet (S13) | Fine pointer: popover base anchored to the trigger, 280 wide; "New folder" row; tri-state checkbox rows 36 + count in `--text-3`; a filter field when there are > 8 folders; Done. Phone: half-height sheet. |
| Toast (S22) | Bottom centre, 16 above the edge (phone: 12 above the pill). Min 280, max 480 wide, 48 tall, radius 14, `--surface-3`, 1px `--border`, `--shadow-float`. Icon 16 + `--step-0` text + an action in `--accent-text`. 5 s, or ≥ 10 s when it has an action; paused on hover or focus. |
| Empty state / Other / Images-gate cards | Centred in the grid area, max 400 wide. Mark at 4 px cells (48) in `--text-3`, headline `--step-1` / 600, body `--step-0` `--text-2`, buttons 36. The "Other" card lists its four ↗ links as 44-tall rows. |
| Connect (S1) | Full viewport on `--bg`, centred column 400 (phone: 100% − 32). Mark 40 + wordmark `--step-3` / 600. Heading and value line from 02 §12.1 (`--step-1` / 600 and `--step-0` `--text-2`). Password input 44 tall (16 px text), radius 10, `--surface-2`, plus Show. Disclosure, Remember toggle + helper, full-access note (`key-round`), and Connect (primary, 44, full width). Privacy line and disclaimer pinned to the bottom in `--step--1` `--text-3`. |
| Collections (S3) | Folder cards use the grid formula with min 200 and gap 16. Each card: a square cover (integer-fit on `--stage-theme`, radius 10), name `--step-0` / 600, count `--step--1` `--text-3`, and an always-visible ⋯. The Favorites tile comes first; folders follow A–Z. "New folder" is a dashed 1.5px `--border-strong` card. |

### 1.5 Theme tokens

```css
:root {
  color-scheme: light dark;   /* system by default; tuned dark first */

  /* Surfaces and text: hue 260, chroma <= 0.006 */
  --bg:              light-dark(oklch(0.985 0.002 260), oklch(0.16 0.003 260));
  --surface-1:       light-dark(oklch(0.995 0.001 260), oklch(0.19 0.003 260));
  --surface-2:       light-dark(oklch(0.965 0.003 260), oklch(0.23 0.004 260));
  --surface-3:       light-dark(oklch(0.935 0.004 260), oklch(0.28 0.005 260));
  --border:          light-dark(oklch(0.89 0.004 260),  oklch(0.32 0.005 260));
  --border-strong:   light-dark(oklch(0.62 0.006 260),  oklch(0.52 0.006 260));
  --hairline:        light-dark(oklch(0 0 0 / 0.06),    oklch(1 0 0 / 0.06));
  --text-1:          light-dark(oklch(0.21 0.004 260),  oklch(0.96 0.002 260));
  --text-2:          light-dark(oklch(0.42 0.005 260),  oklch(0.76 0.004 260));
  --text-3:          light-dark(oklch(0.52 0.005 260),  oklch(0.68 0.005 260));

  /* One accent, "ice blue": current/selected, focus, primary action, active state only */
  --accent:          light-dark(oklch(0.51 0.15 252),   oklch(0.74 0.12 245));
  --accent-contrast: light-dark(oklch(0.99 0 0),        oklch(0.18 0.03 250));
  --accent-text:     var(--accent);
  --accent-soft:     color-mix(in oklch, var(--accent) 16%, var(--surface-2));
  --danger:          light-dark(oklch(0.53 0.20 27),    oklch(0.70 0.17 25));
  --success:         light-dark(oklch(0.50 0.13 150),   oklch(0.74 0.14 150));
  --focus:           var(--accent);
  --select:          var(--accent);
  --scrim:           light-dark(oklch(0.2 0.01 260 / 0.32), oklch(0 0 0 / 0.6));

  /* Art backdrops: chroma exactly 0 (shared values, see 0.6) */
  --checker-a:       light-dark(oklch(0.86 0 0), oklch(0.30 0 0));
  --checker-b:       light-dark(oklch(0.78 0 0), oklch(0.25 0 0));
  --stage-theme:     light-dark(oklch(0.995 0 0), oklch(0.19 0 0));   /* grid cards */
  --stage-mid:       oklch(0.57 0 0);
  --stage-light:     oklch(0.83 0 0);
  --stage-dark:      oklch(0.22 0 0);
  --stage-black:     oklch(0 0 0);
  --stage-white:     oklch(1 0 0);
  --stage-viewer:    light-dark(var(--stage-light), var(--stage-dark));  /* the "Stage" swatch in the viewer */

  /* Type */
  --font-ui:   system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --step--1: clamp(0.75rem, 0.73rem + 0.10vw, 0.8125rem);   /* 12-13 px: meta, badges, captions */
  --step-0:  clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem);  /* 14-15 px: UI body */
  --step-1:  clamp(1rem, 0.96rem + 0.20vw, 1.125rem);       /* 16-18 px: dialog and viewer titles */
  --step-2:  clamp(1.25rem, 1.17rem + 0.40vw, 1.5rem);      /* 20-24 px: view titles, inspector title */
  --step-3:  clamp(1.5rem, 1.33rem + 0.80vw, 2rem);         /* 24-32 px: connect wordmark */
  --leading-tight: 1.25; --leading: 1.5; --leading-mono: 1.6;

  /* Shape and space */
  --radius-xs: 4px;    /* badges, keycaps */
  --radius-sm: 8px;    /* controls, inputs, menu rows */
  --radius-md: 10px;   /* cards, search */
  --radius-lg: 14px;   /* dialogs, sheets, popovers, toasts */
  --radius-pill: 999px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --gap-grid: 12px; --pad-grid: 24px;   /* 02 section 4.1 layout defaults */
  --target: 32px;

  /* Elevation: floating layers only */
  --shadow-float: 0 8px 24px light-dark(oklch(0 0 0 / 0.14), oklch(0 0 0 / 0.44)),
                  0 1px 2px  light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.32));
  --shadow-pop:   0 4px 12px light-dark(oklch(0 0 0 / 0.12), oklch(0 0 0 / 0.40));

  /* Motion */
  --dur-1: 120ms; --dur-2: 200ms; --dur-3: 280ms; --dur-4: 380ms; --dur-fade: 200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in:  cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: linear(0, 0.042, 0.143, 0.274, 0.415, 0.55, 0.671, 0.774, 0.857, 0.921, 0.968, 1.001,
                        1.022, 1.033, 1.038, 1.038, 1.035, 1.031, 1.025, 1.02, 1.015, 1.011, 1.007, 1.004, 1);
                        /* damped spring, zeta 0.72, peak +3.8% */

  /* Layers: dialogs, popovers and toasts use the top layer and ignore z-index */
  --z-grid: 0; --z-sticky: 10; --z-nav: 20; --z-panel: 30; --z-actionbar: 40;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
@media (width < 1200px) { :root { --pad-grid: 16px; } }
@media (width < 600px), (height < 480px) { :root { --gap-grid: 8px; --pad-grid: 12px; } }
@media (pointer: coarse) { :root { --target: 44px; } }
@media (prefers-reduced-motion: reduce) {
  :root { --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; --dur-4: 0ms; --dur-fade: 100ms; }
}
```

Production adds a plain fallback declaration before each `light-dark()` value for pre-2024 browsers. The mockups target evergreen browsers.

### 1.6 Contrast (computed)

Computed from the OKLCH values with the OKLab → linear sRGB matrices, WCAG 2.x relative luminance, and APCA-W3 0.0.98G-4g for Lc (advisory). Every value is inside the sRGB gamut, so no gamut mapping changes the result.

| Mode · token (WCAG ratio / APCA Lc) | `--bg` | `--surface-1` | `--surface-2` | `--surface-3` |
|---|---|---|---|---|
| light · `--text-1` | 16.97 / 102 | 17.47 / 104 | 16.01 / 98 | 14.64 / 92 |
| light · `--text-2` | 8.10 / 86 | 8.34 / 88 | 7.64 / 82 | 6.99 / 76 |
| light · `--text-3` | 5.28 / 75 | 5.43 / 77 | 4.98 / 71 | 4.55 / 65 |
| light · `--accent-text` | 5.54 / 75 | 5.70 / 77 | 5.22 / 71 | 4.78 / 65 |
| light · `--danger` | 5.61 / 74 | 5.77 / 76 | 5.29 / 70 | 4.84 / 65 |
| light · `--success` | 5.41 / 75 | 5.57 / 77 | 5.10 / 71 | 4.67 / 65 |
| dark · `--text-1` | 17.28 / 99 | 16.44 / 98 | 15.04 / 97 | 12.99 / 96 |
| dark · `--text-2` | 9.04 / 60 | 8.60 / 59 | 7.87 / 58 | 6.80 / 56 |
| dark · `--text-3` | 6.74 / 46 | 6.41 / 46 | 5.86 / 45 | 5.07 / 43 |
| dark · `--accent-text` | 8.51 / 57 | 8.09 / 57 | 7.40 / 56 | 6.39 / 54 |
| dark · `--danger` | 6.74 / 47 | 6.41 / 47 | 5.86 / 46 | 5.06 / 44 |
| dark · `--success` | 8.89 / 59 | 8.46 / 59 | 7.74 / 58 | 6.69 / 56 |

| Mode | `--accent-contrast` on `--accent` | `--border-strong` on `--bg` / `--surface-2` | `--focus` on `--bg` / `--surface-3` | `--accent` fill on `--bg` |
|---|---|---|---|---|
| light | 5.62 / Lc 81 | 3.49 / 3.29 | 5.54 / 4.78 | 5.54 |
| dark | 8.24 / Lc 58 | 3.52 / 3.07 | 8.51 / 6.39 | 8.51 |

Derived pairs: `--accent-text` on the selection-bar tint is 4.82 (light) / 7.62 (dark). `--text-1` on `--accent-soft` (checked chip) is 12.85 / 11.62.

### 1.7 Motion

| Moment | Spec | Reduced motion |
|---|---|---|
| Grid → viewer | The `<dialog>` fades 0 → 1 over `--dur-2` (`--ease-out`). The art fades in over `--dur-1` after `img.decode()`. No size morph (C11). | Cut |
| Viewer → grid | 160 ms fade. Focus returns to the card, which scrolls into view instantly. | Cut |
| Prev / next | 120 ms crossfade between two stacked stage layers. A swipe translates the stage by whole device px, then crossfades. | Swap, no drag-follow |
| Current asset → inspector | Instant, so arrow keys never wait on animation | — |
| Sheets (phone, tablet portrait) | `translateY` over `--dur-3` with `--ease-spring`. Sheets contain no art. The stage refits once, after the sheet settles. | Instant |
| Menus and popovers | Opacity + `translateY(4px → 0)` over `--dur-1` | Opacity, 100 ms |
| Checkbox check | The badge scales 0.6 → 1 over `--dur-2` with `--ease-spring` (the badge, never the art) | Instant |
| Sidebar collapse | The width snaps (no per-frame grid reflow). Labels cross-fade over `--dur-1`. | Instant |
| Pill → search field | Width over `--dur-2` (the pill holds no art) | Instant |
| Toast and progress chip | In: opacity + 8 px rise over `--dur-2`. Out: 160 ms. | Opacity only |

### 1.8 Signature details

1. **Live wall label.** The inspector updates the moment a card is clicked or arrowed to, so metadata never takes more than one click.
2. **Honest scale readout.** Every stage shows "Fit · 5×", and the badge chip shows the canvas in mono, so users know they are seeing whole pixels.
3. **Structure felt, not seen.** Tonal steps and one 6% hairline do the separating. There are no card shadows; shadows exist only on floating layers.
4. **One blue.** The accent appears only on current/selected, focus, the primary Download and checked chips, so the art carries all other colour.
5. **Thumb-zone pill.** On phones, a floating Library/Collections pill and a round search button morph into a search field: one-handed and out of the art's way.

### 1.9 Pros, cons, risks, complexity

- **Pros**
  - The most familiar model (Photos, Finder, Eagle).
  - Zero-click metadata on desktop.
  - Closest to 02 and R1: only V1 and V6 deviate.
  - The lowest accessibility risk.
  - One grid component scales from phone to ultrawide.
- **Cons**
  - Can read as "another dev-tool dark theme".
  - The inspector takes 340–360 px, so a 1440 laptop shows 5 columns at L, where 02 shows 7.
  - Click behaves differently across 1200 px: it makes a card current above, and opens the viewer below.
- **Risks**
  - Resizing across 1200 px changes what a click does. Mitigation: the empty-inspector hint "Double-click to open it".
  - Dwell reads (V6).
  - Cool grays can muddy warm palettes. Keep chroma ≤ 0.006 and re-check with warm sprites.
- **Complexity: M** (baseline): 02's shell plus one extra panel that reuses the inspector component.

---

## 2. Option B — "Gallery Wall" (showcase shelves + full-page detail)

### 2.1 Concept

| | |
|---|---|
| Promise | **Your PixelLab work, hung like an exhibition: every asset gets its own page.** |
| Best for | Browsing and showcasing. Small-to-medium libraries. People who think in projects ("boards"). Light-mode readers of prompts and metadata. |
| Information architecture | **Top navigation** on desktop and tablet (no sidebar). **Library "All" = shelves** (V3): Recent, Favorites, then one shelf per type. Chips, search and "See all" open the flat grid of labelled cards. An asset opens as a **full-page detail route** (V4): a big stage on top (narrow) or on the left (wide), with the inspector and the download tiles inline. Collections presents folders as **boards** with 2×2 cover mosaics. |
| Visual language | Light-first, warm off-white "wall". Serif display type for names and headings. Wall-label captions under every card. Thin rules. A deep plum accent used rarely: checked chips are inverted monochrome, not accent-coloured. |
| Interaction signature | Click opens the page. Back returns to the exact shelf position. Shelves scroll sideways (swipe, wheel or ‹ ›). |
| References | Apple TV / App Store (shelves), Steam library (collections), Dribbble shot pages, Are.na boards |

### 2.2 Layout per viewport

| Viewport | Navigation | Header | Library (shelves · grid at M) | Detail page | Selection bar |
|---|---|---|---|---|---|
| 360×780 | **Tab bar**, full width, 56 + safe area, labelled Library · Collections | **Large-title header** 96 → 52 on scroll: serif title `--step-3` · Select · Settings. Search field 44. Chips row 48. **Toolbar row 40:** result line · Animate · View (sort + size) · ⋯. | Shelves: 148 cards (2 + a peek), gap 12. Grid: 2 × 158 + label 44. | App bar 52 (‹ · title + state · ⋯). Stage 360 × 360, full-bleed, ‹ › at its edges. Dock 92 (48 + 44). Sections in one column. **Sticky actions row 64**: Download ▾ · Favorite · Add to folder · Open ↗. | The bar replaces the tab bar (64) |
| 780×360 | **Rail 72** labelled (Library, Collections; bottom: Search, Select, Settings) | One slim 48 row: chips · Animate · View · ⋯ | Shelves: 148 (4.1 visible). Grid: 4 × 152. | **Immersive first screen**: the stage fills 100dvh (rail hidden), with capsules that fade after 3 s while playing. "Details ⌄" or scrolling reveals the page body. | Floating bottom bar |
| 768×1024 | Top nav 56: mark + wordmark · Library / Collections tabs · search icon (expands over the tabs) · Select · Settings | Chip row 52 (sticky). Toolbar row 40: result line · Sort · Size · Animate · ⋯. | Shelves: 176 (3.7 visible). Grid: 4 × 162, gap 20. | Nav 56 + breadcrumb 44. Stage 707 × 560. Dock 96. Sections in one column. | Floating action bar, bottom centre, max 720 |
| 1180×820 | Top nav 64, search field max 400 | Chip row 52 with the toolbar on its right | Shelves: 176 (5.6). Grid: 6 × 164. | Stage 1086 × 508 (62svh). Dock 96. Sections in two columns: 1fr (inspector fields) · 400 (download tiles, folders). | Floating action bar |
| 1440×900 | Top nav 64, search 480 | Chip row 52 + toolbar; result line above the content | Shelves: 200 (6.0, ‹ ›). Grid: 7 × 169, gap 24. | **Two columns**: stage column 857 (sticky; stage 857 × 652 + dock 96) · gap 48 · info column 420, scrolling with the page | Floating action bar |
| 1920×1080 | Top nav 64, search 520 | Same | Shelves: 216 (7.6). Grid: 9 × 178. | Stage 1324 × 832 · info 420 | Same |
| 2560×1080 | The top nav spans the window. Page content max 2048, centred. | Same | Shelves: 216 (8.1). Grid: 10 × 170. | Stage 1452 × 832 · info 420 | Same |

Page gutter: `clamp(16px, 4vw, 64px)` inside `max-width: 2048px`. Shelf card width is fixed per form factor (148 · 176 · 200 · 216) and ignores the grid size.

### 2.3 Wireframes

**B1 — Desktop library (shelves), 1440×900**

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [#] Vitrine     Library    Collections        [Q  Search 71 assets _______________ ]              [ Select ]   [*]      |
|                 =======                                                                                                 |
+-------------------------------------------------------------------------------------------------------------------------+
|  [All] (Characters) (Objects) (Images) (Tilesets) (Tiles) (Maps) (UI) (Other)   Newest v  [S|M|L|XL]  [>] Animate [..]  |
+-------------------------------------------------------------------------------------------------------------------------+
|  71 assets . Synced just now . (2 in PixelLab)                                                                          |
|                                                                                                                         |
|  Recent                                                                                      See all 71 ->   (<) (>)    |
|  +------------+   +------------+   +------------+   +------------+   +------------+   +------------+                    |
|  |          <3|   |            |   |            |   |            |   |            |   |            |                    |
|  |    art     |   |    art     |   |    art     |   |    art     |   |    art     |   |    art     |                    |
|  |> 4dir.1anim|   |            |   | > 8 frames |   |        fit |   |            |   |        fit |                    |
|  +------------+   +------------+   +------------+   +------------+   +------------+   +------------+                    |
|  Android Courier  Bear Trap . open Goblin Brute Id. Meadow Ruins     Dirt -> Grass    Fantasy MMO HUD                   |
|  Char. 128x128    Obj. 64x64       Image 128x128    Map 768x512      Tileset 16 px    UI 688x384                        |
|                                                                                                                         |
|  Characters  3                                                                               See all 3 ->    (<) (>)    |
|  +------------+   +------------+   +------------+                                                                       |
|  |    art     |   |    art     |   |    art     |     all 3 shown: no end tile. Recent ends with a "See all 71" tile.   |
|  +------------+   +------------+   +------------+                                                                       |
|                                                                                                                         |
|  Objects  24                                                                                 See all 24 ->   (<) (>)    |
|                                                                                                                         |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
  top nav 64 . chip row 52 (sticky) . page gutter 4vw . shelf cards 200 + label 44, gap 24; shelves 40 apart
```

**B2 — Desktop detail page, 1440×900**

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [#] Vitrine     Library    Collections        [Q  Search 71 assets _______________ ]              [ Select ]   [*]      |
+-------------------------------------------------------------------------------------------------------------------------+
|  < Back    Library / Characters                                  3 of 3   (<)  (>)    [..]                              |
|  +------------------------------------------------------------------------+    CHARACTER . BASE                         |
|  |                                 (s)(#)(5)(8)(d)(B)(W)  [Fit][1:1][-][+]|    Android Courier                          |
|  |                                                                        |    128 x 128 . 4 directions . 1 animation   |
|  |                        +--------------------+                          |    (Hero party) (Favorites to export)       |
|  |                        |                    |                          |                                             |
|  |                        |   art, integer k   |                          |    [ Download v ] [<3] [+ Folder] [Open ^]  |
|  |                        |                    |                          |                                             |
|  |                        +--------------------+                          |    Download ----------------------------    |
|  |                                                                        |    +-----------------+ +-----------------+  |
|  |    stage 857 x 652 . Stage = N8 (light) / N5 (dark)                    |    | GIF . Walk . S  | | PNG . frame     |  |
|  |                                                                        |    +-----------------+ +-----------------+  |
|  +------------------------------------------------------------------------+    | Sheet+JSON walk | | Sheet+JSON all  |  |
|  ( > ) [|<] [>|]  ---|---|---o---|---|---  3 / 8  [8 fps]  Loop     [N]        +-----------------+ +-----------------+  |
|  [Rotations] [Walk . 8f]   (state pills when > 1)                [W] S [E]     More options...                          |
|                                                                     [S]        Prompt ------------------------------    |
|                                                                                | slim android courier in navy armor,    |
|                                                                                Details -----------------------------    |
|                                                                                                                         |
|                                                                                                                         |
+-------------------------------------------------------------------------------------------------------------------------+
  stage column 857 (sticky) | gap 48 | info column 420 (scrolls with the page); compass centre = direction label
```

**B3 — Phone library, 360×780**

```text
+--------------------------------------+
| Library                 [Select] [*] |
| [Q  Search 71 assets               ] |
| [All](Characters)(Objects)(I> [>][..]|
|--------------------------------------|
| 71 assets . Synced . (2 in PixelLab) |
|                                      |
| Recent                    See all -> |
| +------------+  +------------+  +----|
| |            |  |            |  |    |
| |    art     |  |    art     |  |    |
| |   > 4dir   |  |            |  |    |
| +------------+  +------------+  +----|
| Android Cour..  Bear Trap . op  Gobli|
| Char. 128x128   Obj. 64x64      Image|
|                                      |
| Characters  3             See all -> |
| +------------+  +------------+  +----|
| |    art     |  |    art     |  |    |
| +------------+  +------------+  +----|
|                                      |
|--------------------------------------|
|  [#] Library       [/] Collections   |
|   =========                          |
|                                      |
+--------------------------------------+
  shelf cards 148 (2 + peek), gap 12; tab bar 56 + safe area
```

**B4 — Phone detail page, 360×780**

```text
+--------------------------------------+
| [<]  Android Courier . Base     [..] |
|--------------------------------------|
|                                      |
|          +----------------+          |
|          |                |          |
| (<)      |  art, Fit k    |      (>) |
|          |                |          |
|          +----------------+          |
|      stage 360 x 360 (bleed)         |
|--------------------------------------|
| ( > ) ---|---|---o---|---|--- 3/8 [8]|
| [S v][Walk . 8f][(s) N8][Fit][1:1]  >|
|--------------------------------------|
| CHARACTER . BASE                     |
| Android Courier                      |
| 128 x 128 . 4 directions . 1 anim    |
| (Hero party)                         |
| Download ------------------------    |
| [ GIF . Walk . S ] [ PNG . frame ]   |
|--------------------------------------|
| [ Download v ] [<3] [+ Folder] [^]   |
|                                      |
+--------------------------------------+
  the page scrolls; sticky actions row 64 + safe area (Download, Favorite, Add to folder, Open in PixelLab)
```

**B5 — Phone landscape detail, 780×360**

```text
+------------------------------------------------------------------------------+
| .--------------------------------.                    .--------------------. |
| | [<]  Android Courier . Base    |                    | [Download v]  [..] | |
| '--------------------------------'                    '--------------------' |
|                                +------------+                                |
|                                |  art       |                                |
|  (<)                           | Fit k=11   |                           (>)  |
|                                +------------+                                |
|                                                                              |
|     .-------------------------------------------------.     .--------------. |
|     | ( > ) [|<] [>|]  ---|---o---|---  3/8  [8 fps]  |     | Details  v   | |
|     '-------------------------------------------------'     '--------------' |
+------------------------------------------------------------------------------+
  stage = first 100dvh of the page (rail hidden); scroll or "Details" reveals the page body; capsules fade after 3 s
```

**B6 — Selection mode and export dialog, 1440×900**

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [#] Vitrine     Library    Collections        [Q  Search 71 assets _______________ ]              [ Done ]     [*]      |
+-------------------------------------------------------------------------------------------------------------------------+
|  Characters  3          +------------------------------------------------------------------+                            |
|  +------------+   +-----| Export 12 assets                                              [x]|                            |
|  |[v]         |   |[v]  | 3 characters (5 states) . 9 objects                              |                            |
|  |    art     |   |    a| +------------------+ +------------------+ +------------------+   |                            |
|  +------------+   +-----| | Game-ready   [v] | | Frames       [ ] | | GIFs         [ ] |   |                            |
|  Orb Mage         Hooded| | sheets + JSON    | | every frame PNG  | | one per anim/dir |   |                            |
|                         | +------------------+ +------------------+ +------------------+   |                            |
|  Objects  24            | States   (o) All states   ( ) Base only                          |                            |
|  +------------+   +-----| > Advanced                                                       |                            |
|  |[ ]         |   |[v]  | 412 files . about 38 MB . vitrine-selection-12-2026-10-18.zip    |                            |
|  |    art     |   |    a|                                          [ Cancel ]  [ Export ]  |                            |
|  +------------+   +-----|                                                                  |                            |
|                         |                                                                  |                            |
|                         |                                                                  |                            |
|                         +------------------------------------------------------------------+                            |
|               .----------------------------------------------------------------------------------------.                |
|               | 12 selected . 0 hidden by filter   Select all   [<3]   [+ Add to folder]   [ Download ]   [x]           |
|               '----------------------------------------------------------------------------------------'                |
+-------------------------------------------------------------------------------------------------------------------------+
  select mode: checkboxes on mats; floating action bar (max 720) bottom-centre; export dialog 680 with preset tiles
```

### 2.4 Components

| Component | Spec (B) |
|---|---|
| Top nav (≥ 600) | 64 tall (56 below 840), `--bg`, 1px `--border` bottom after scroll. Left: mark 24 + "Vitrine" in `--font-display` 22 px / 400. **Tabs** Library / Collections: 40 tall text buttons, `--step-0` / 500, `--text-2`; active `--text-1` with a 2px `--text-1` bar on the nav's bottom edge, as wide as the label. **Search**: underline field 40 tall, `clamp(240px, 32vw, 520px)` wide, no fill, 1px `--border-strong` bottom; focus = a 2px `--text-1` bottom plus the focus ring; `search` 18. Right: Select (36 tall, 1px `--border-strong` outline, radius 6) and Settings 36. |
| Tab bar (phone) | Full width, 56 + safe area, `--bg`, 1px `--border` top. Two tabs: icon 22 over a label `--step--1` / 500. Active: `--text-1`, 600, and a 2 × 24 px bar under the label. |
| Chip row | Sticky under the nav, 52 tall, `--bg`. **Chips** 36 tall (44 hit on coarse), radius 6, padding 0 14, 1px `--border-strong`, `--text-2`, `--step-0` / 500, gap 8. Hover `--surface-2`. Checked: background `--text-1`, text `--bg`, border `--text-1`, leading `check` 14. **Toolbar** on the right (≥ 840): Sort "Newest ▾" · Size segmented S / M / L / XL (36) · Animate (36 outline, label always visible; on = inverted like chips) · ⋯. |
| Result line | `--step--1` `--text-3` line above the content: "71 assets · Synced just now", plus the in-progress chip (24 tall, radius 6, 1px `--border`). The page colophon under the last shelf holds the short disclaimer. |
| Shelf | **Header** 48: title `--font-display` `--step-3` / 400 `--text-1`, count `--step-0` `--text-3` 12 px after it, baseline-aligned; right: "See all 24 →" `--step-0` / 500 (underline offset 4 on hover); ‹ › 36 circles with 1px `--border-strong`, fine pointer only, labelled "Scroll Characters left" / "right". **Track**: `grid-auto-flow: column`, columns = card width, gap 24 · 20 · 12, `overflow-x: auto`, `scroll-snap-type: x proximity`, `scroll-snap-align: start`, `scroll-padding-inline` = gutter, `scrollbar-width: thin`. At most 24 cards (Recent: 12). Shelves are 40 apart (32 on phone). Types with no assets get no shelf. In selection mode each shelf header adds a "Select all in shelf" text button. |
| Shelf end tile | Only when a shelf holds fewer assets than its type (in the sample: Recent, 12 of 71). Same mat. A 2×2 mosaic of the next four assets (each integer-fit in its quadrant, gap 4) with the label "See all 71 →" `--step-0` / 600. It links to the grid. |
| Asset card | **Mat**: square, `--stage-theme`, 1px `--border`, radius 6, inset per §0.5. 02 zones are placed on the mat, with controls 24 tall, `--surface-1`, 1px `--border`: **top-left** hover checkbox (radius 4; checked = `--select` fill + `check` in `--accent-contrast`); **top-right** filled heart (favorites), plus heart and ⋯ on hover; **bottom-left** badge chip in `--font-mono` 11 px `--text-2` (02 text; ▶ prefix when animated); **bottom-right** "fit". **Label** 44, always shown at every size (V2): name `--step-0` / 500 `--text-1`, one line with ellipsis (state appended: "Bear Trap · open"); meta `--step--1` `--font-mono` `--text-3` "{Type} · 64×64". **States:** hover → mat border `--border-strong` + name underline, then hover play; selected → `box-shadow: 0 0 0 2px var(--select)` on the mat + checkbox; focus → the ring around the whole card (mat + label), offset 4, radius 10. |
| Grid view (chip, search, See all) | Title row 64: "‹ Library" link + title in `--font-display` `--step-4` + count `--text-3`. Then the labelled grid (§0.5) and the end-of-list line. |
| Detail: breadcrumb row | 48 tall (44 below 1200): "‹ Back" `--step-0` / 500 · crumbs in `--text-3` · position "3 of 24" `--text-3`, tabular · ‹ › 36 circles · ⋯ (02 viewer menu) · Info is implicit (always visible). |
| Detail: stage | Viewer backdrop, 1px `--border`, radius 0 (an exhibit edge), padding 32. A **stage toolbar** row 48 at the top, inside the stage, right-aligned: backdrop swatches (20 circles) + Fit · 1:1 · − · + (36 tall, `--surface-1`, 1px `--border`, radius 6) + readout. The art box excludes the toolbar. Nothing sits over the art. |
| Detail: dock (96) | `grid-template-columns: 1fr auto`. **Row 1** (48): Play 40 circle (1px `--border-strong`, icon `--text-1`) · steps 36 · timeline (track 2 px `--border-strong`, ticks 1 × 8 px, filled part `--text-1`, thumb a 12 circle in `--text-1`) · readout `--font-mono` · "8 fps" (stepper popover) · Loop. **Row 2** (48): animation pills (32 tall, radius 6: "Rotations", "Walk · 8f"; checked = inverted) and state pills, separated by 16 px + a 1px rule. **Right**: compass, 3 × 3 of 28 cells, radius 4, 1px `--border`; checked = inverted (`--text-1` fill, `--bg` icon); centre = the direction name in `--step--1`. On coarse pointers the compass becomes a Direction pill with a 3 × 3 × 44 popover. |
| Detail: info column (= inspector) | 420 wide (≥ 1200). **Kicker** `--step--1` / 600, uppercase, +0.08em, `--text-3`: "CHARACTER · BASE". **Title** `--font-display` `--step-4` / 400, leading 1.1. **Facts** `--step-0` `--text-2`. **In folders** chips, 28 tall, outline. **Actions row**: Download ▾ (primary, 44 tall, flex 1, `--accent` / `--accent-contrast`, radius 6) · Favorite 44 · Add to folder 44 · Open in PixelLab ↗ 44. Each **section** opens with a 1px `--border` rule + a header in `--font-display` `--step-2` / 400. **Download** section: the S8 items as tiles in two columns (1px `--border`, radius 6, padding 14; title `--step-0` / 600; description `--step--1` `--text-3`), default first, then "More options…" (S9). **Fields** per 02 §5: `<dl>` in two columns, small-caps labels 11.5 px +0.06em `--text-3`, values `--step-0` `--text-1`. **Prompt**: `--font-mono` 13 px / 1.65 `--text-2` on `--surface-2`, radius 4, padding 16, a 2px `--border-strong` left rule, Copy top-right. **PixelLab** links, then **Technical details** (collapsed). |
| Detail (phone) | App bar 52 (‹ 44, title + state `--step-1` / 600, ⋯ 44). Stage 1:1 at full width (height max 50dvh). Dock rows 48 + 44 (the pill row scrolls sideways; Direction pill → compass popover). Sections in one column, padding 16. Sticky actions row 64 + safe area. |
| Selection bar | Select or a long-press enters selection mode (checkboxes on every mat). **Floating action bar**: bottom 24 + safe area, centred, max 720, 56 tall, radius 12, `--surface-1`, 1px `--border`, `--shadow-float`. Contents: "12 selected" `--step-0` / 600 · "· 4 hidden by filter" · Select all · Favorite · Add to folder · Remove from folder (folder view) · Download (primary, 40) · ×. Phone: a full-width 64 bar replaces the tab bar. |
| Popover / menu base | Radius 8, `--surface-1`, 1px `--border`, `--shadow-pop`, padding 6. Rows 36 (44 on coarse), hover `--surface-2`, checked = a leading `check` + `--text-1` at 600. |
| Dialog base | `<dialog>`, radius 12, `--surface-1`, 1px `--border`, `--shadow-float`, `::backdrop` `--scrim`. Title `--font-display` `--step-3`. Body padding 28. Footer buttons right (Cancel outline · primary filled). Phone: full-screen sheet. Settings (S16) uses this base: 640 wide, section headers in serif `--step-2` with a rule, rows 52. |
| Export dialog (S9) | Dialog base, 680 wide. Presets as **tiles**: single = radio tiles, multi = checkbox tiles (Game-ready · Frames · GIFs), 200 × 88, check top-right, checked = 2px `--select` border. Scope rows. Advanced collapsed. Estimate + filename preview (`--font-mono`). Footer: Cancel · Export. |
| Progress chip (S10) · ready sheet (S11) | Chip bottom-left 24 (phone: above the tab bar): 44 tall, radius 6, inverted (`--text-1` background, `--bg` text), with a thin `--bg` progress line + Cancel. The ready sheet uses the dialog base. |
| Add to folder (S13) | Dialog base, 560. A grid of 120 folder tiles (a 96 mini mosaic + name `--step--1`), tri-state check top-left. A "New folder" tile opens S14. Done. UI copy always says "folder" (02 §12); "board" is only this document's name for the mosaic presentation. |
| Collections (folders as boards) | Page title `--font-display` `--step-4` "Collections". Folder cards ("boards") min 260, gap 24. Each: a square mosaic (2×2 quadrants on a `--surface-1` mat, gap 4, each integer-fit on `--stage-theme`), name `--font-display` `--step-1`, count `--step--1` `--text-3`, always-visible ⋯. Favorites first, then A–Z. "New folder" is a dashed 1.5px `--border-strong` tile. **Folder page**: title `--step-4` + count + Export (outline) + ⋯ (Rename, Delete), then the labelled grid. |
| Toast (S22) | Bottom-left 24 (phone: centred above the tab bar). Inverted (`--text-1` background, `--bg` text), radius 6, padding 12 16, `--shadow-float`. Underlined action. 5 s / ≥ 10 s with an action. |
| Empty / Other / Images-gate cards | Headline `--font-display` `--step-3`; body `--step-0` `--text-2`, max 44ch; outline buttons. Illustration: the vitrine mark at 6 px cells (72 × 60) in `--border-strong`. |
| Connect (S1) | **≥ 1200, split**: the left 50% is an editorial panel on `--surface-2`, with the vitrine mark at 12 px cells (144 × 120) in `--text-1` and 02's heading in `--font-display` `--step-4`. The right side is the 02 S1 form column, 400 wide. **Phone**: stacked (mark 48, heading `--step-3`). Inputs 44, radius 6, 1px `--border-strong`. Connect: primary, 44. |

### 2.5 Theme tokens

```css
:root {
  color-scheme: light dark;   /* system by default; tuned light first */

  /* Warm paper wall: hue 70-85, chroma <= 0.010 */
  --bg:              light-dark(oklch(0.975 0.004 85), oklch(0.20 0.006 70));
  --surface-1:       light-dark(oklch(0.995 0.002 85), oklch(0.23 0.006 70));  /* mats: brighter than the wall */
  --surface-2:       light-dark(oklch(0.955 0.005 85), oklch(0.27 0.007 70));
  --surface-3:       light-dark(oklch(0.925 0.006 85), oklch(0.32 0.008 70));
  --border:          light-dark(oklch(0.88 0.006 85),  oklch(0.36 0.008 70));
  --border-strong:   light-dark(oklch(0.60 0.010 80),  oklch(0.58 0.010 70));
  --text-1:          light-dark(oklch(0.22 0.010 70),  oklch(0.95 0.005 85));
  --text-2:          light-dark(oklch(0.40 0.010 70),  oklch(0.80 0.008 80));
  --text-3:          light-dark(oklch(0.50 0.010 70),  oklch(0.72 0.008 80));

  /* Accent "museum plum": primary Download, selection, focus. Chips and pills stay monochrome. */
  --accent:          light-dark(oklch(0.48 0.13 345),   oklch(0.78 0.11 345));
  --accent-contrast: light-dark(oklch(0.99 0.003 85),   oklch(0.20 0.02 345));
  --accent-text:     var(--accent);
  --accent-soft:     color-mix(in oklch, var(--accent) 12%, var(--surface-1));
  --danger:          light-dark(oklch(0.52 0.19 28),    oklch(0.72 0.16 28));
  --success:         light-dark(oklch(0.50 0.12 150),   oklch(0.76 0.13 150));
  --focus:           var(--accent);
  --select:          var(--accent);
  --scrim:           light-dark(oklch(0.25 0.02 70 / 0.36), oklch(0 0 0 / 0.6));

  /* Art backdrops: chroma exactly 0 (shared values, see 0.6) */
  --checker-a:       light-dark(oklch(0.86 0 0), oklch(0.30 0 0));
  --checker-b:       light-dark(oklch(0.78 0 0), oklch(0.25 0 0));
  --stage-theme:     light-dark(oklch(0.995 0 0), oklch(0.23 0 0));   /* grid mats */
  --stage-mid:       oklch(0.57 0 0);
  --stage-light:     oklch(0.83 0 0);
  --stage-dark:      oklch(0.22 0 0);
  --stage-black:     oklch(0 0 0);
  --stage-white:     oklch(1 0 0);
  --stage-viewer:    light-dark(var(--stage-light), var(--stage-mid));   /* the "Stage" swatch on the detail page */

  /* Type */
  --font-ui:      system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
  --font-mono:    ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --font-display: ui-serif, "New York", "Iowan Old Style", Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif;
  --step--1: clamp(0.75rem, 0.73rem + 0.10vw, 0.8125rem);    /* 12-13 px */
  --step-0:  clamp(0.9375rem, 0.91rem + 0.12vw, 1rem);       /* 15-16 px: editorial body */
  --step-1:  clamp(1.0625rem, 1.02rem + 0.20vw, 1.1875rem);  /* 17-19 px */
  --step-2:  clamp(1.25rem, 1.17rem + 0.40vw, 1.5rem);       /* 20-24 px: section headers (serif) */
  --step-3:  clamp(1.5rem, 1.33rem + 0.80vw, 2rem);          /* 24-32 px: shelf titles (serif) */
  --step-4:  clamp(1.875rem, 1.55rem + 1.50vw, 2.75rem);     /* 30-44 px: page and asset titles (serif) */
  --leading-tight: 1.1; --leading: 1.55; --leading-mono: 1.65;

  /* Shape and space */
  --radius-xs: 3px; --radius-sm: 6px; --radius-md: 6px; --radius-lg: 12px; --radius-pill: 999px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --gap-grid: 24px; --pad-page: clamp(16px, 4vw, 64px); --inset-art: 14px; --label-h: 44px;
  --target: 36px;

  /* Elevation: paper model, warm and very soft, floating layers only */
  --shadow-float: 0 12px 32px light-dark(oklch(0.30 0.02 70 / 0.12), oklch(0 0 0 / 0.40)),
                  0 1px 3px   light-dark(oklch(0.30 0.02 70 / 0.10), oklch(0 0 0 / 0.30));
  --shadow-pop:   0 6px 16px  light-dark(oklch(0.30 0.02 70 / 0.10), oklch(0 0 0 / 0.36));

  /* Motion: slow and graceful, no overshoot */
  --dur-1: 140ms; --dur-2: 240ms; --dur-3: 320ms; --dur-4: 420ms; --dur-fade: 320ms;
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in:  cubic-bezier(0.32, 0, 0.67, 0);

  /* Layers */
  --z-grid: 0; --z-sticky: 10; --z-nav: 20; --z-panel: 30; --z-actionbar: 40;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
@media (width < 1200px) { :root { --gap-grid: 20px; } }
@media (width < 600px), (height < 480px) { :root { --gap-grid: 12px; --inset-art: 10px; } }
@media (pointer: coarse) { :root { --target: 44px; } }
@media (prefers-reduced-motion: reduce) {
  :root { --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; --dur-4: 0ms; --dur-fade: 0ms; }
}
```

The accent avoids teal on purpose: PixelLab's own selection badge is teal (03 audit). Re-check against PixelLab's palette at token freeze (G23).

### 2.6 Contrast (computed)

| Mode · token (WCAG ratio / APCA Lc) | `--bg` | `--surface-1` | `--surface-2` | `--surface-3` |
|---|---|---|---|---|
| light · `--text-1` | 16.12 / 99 | 17.08 / 103 | 15.20 / 95 | 13.89 / 89 |
| light · `--text-2` | 8.58 / 86 | 9.09 / 90 | 8.09 / 82 | 7.39 / 77 |
| light · `--text-3` | 5.59 / 75 | 5.92 / 79 | 5.27 / 71 | 4.82 / 65 |
| light · `--accent-text` | 6.55 / 79 | 6.94 / 83 | 6.17 / 75 | 5.64 / 69 |
| light · `--danger` | 5.65 / 74 | 5.99 / 78 | 5.33 / 70 | 4.87 / 64 |
| light · `--success` | 5.28 / 73 | 5.59 / 77 | 4.98 / 69 | 4.55 / 63 |
| dark · `--text-1` | 15.65 / 96 | 14.60 / 95 | 13.03 / 94 | 10.97 / 91 |
| dark · `--text-2` | 9.69 / 66 | 9.04 / 65 | 8.07 / 64 | 6.79 / 61 |
| dark · `--text-3` | 7.30 / 52 | 6.81 / 52 | 6.08 / 50 | 5.12 / 47 |
| dark · `--accent-text` | 8.61 / 60 | 8.03 / 60 | 7.17 / 58 | 6.04 / 55 |
| dark · `--danger` | 6.82 / 50 | 6.36 / 49 | 5.68 / 48 | 4.78 / 45 |
| dark · `--success` | 8.87 / 62 | 8.28 / 61 | 7.39 / 60 | 6.22 / 57 |

| Mode | `--accent-contrast` on `--accent` | `--border-strong` on `--bg` / `--surface-2` | `--focus` on `--bg` / `--surface-3` | `--accent` fill on `--bg` |
|---|---|---|---|---|
| light | 6.84 / Lc 87 | 3.67 / 3.46 | 6.55 / 5.64 | 6.55 |
| dark | 8.65 / Lc 62 | 4.22 / 3.52 | 8.61 / 6.04 | 8.61 |

Derived pairs: an inverted chip, toast or progress chip (`--bg` on `--text-1`) is 16.12 (light) / 15.65 (dark).

### 2.7 Motion

| Moment | Spec | Reduced motion |
|---|---|---|
| Library ↔ detail page | Same-document View Transition with a root crossfade only (opacity on `::view-transition-old(root)` / `-new(root)`, `--dur-fade`, `--ease-out`). No named-element morph (C11). The swap is instant without View Transitions. Scroll is restored before the transition starts. | No transition |
| Prev / next on the detail page | 240 ms crossfade of the stage and the info column | Instant |
| Shelf ‹ › | `scrollBy({ behavior: "smooth" })`, one page of cards | `behavior: "auto"` |
| Hover | Border colour over `--dur-1`. No lift and no shadow change. | Same |
| Dialogs | Fade + 8 px rise over `--dur-2` | Fade, 0 ms |
| Sheets (phone) | Slide over `--dur-3` (`--ease-out`), no overshoot | Instant |
| Large-title header | Collapse driven by a scroll-driven animation (`animation-timeline: scroll()`) on opacity and font-size only | Static compact header |
| Immersive capsules (landscape) | Fade out after 3 s while playing, over `--dur-3` | Stay visible |

### 2.8 Signature details

1. **Shelves with serif headings.** Each type gets a named shelf with "See all", plus a mosaic end tile when the shelf is truncated, so the library reads like a curated wall.
2. **Wall labels.** Every card carries its name and a mono caption under the mat, like a museum label.
3. **The exhibit page.** One page per asset: a big N8-gray stage, a serif title, and every download format visible as a tile before you click.
4. **Boards.** Folders display as 2×2 integer-scaled cover mosaics, recognisable at a glance.
5. **Monochrome chrome, rare accent.** Chips and pills invert (ink on paper). Plum appears only on Download, selection and focus.

### 2.9 Pros, cons, risks, complexity

- **Pros**
  - The most distinctive and premium option; it works as a showcase.
  - The full page gives maximum metadata and inline downloads room.
  - Native Back and deep links come for free.
  - Light reading suits prompts.
  - Boards feel tangible.
- **Cons**
  - Shelves slow down scanning and bulk selection (you need "See all").
  - Larger labelled cards fit fewer assets per screen.
  - The library has two modes (shelves vs grid).
  - White or light sprites vanish on white mats, so the backdrop switch gets more use.
- **Risks**
  - V3 contradicts R1 C7. If reviewers bounce off the shelves, B collapses into "02 with a serif".
  - Horizontal scrollers have discoverability costs for mouse users; ‹ › and Tab order mitigate them.
  - Scroll restoration across routes must be exact.
  - The system serif varies by OS (New York / Charter on Apple, Cambria / Georgia on Windows).
- **Complexity: M.** Shelves are capped at 24, so they need no horizontal virtualization. Add the route-based detail page, the mosaics and the View Transition crossfade.

---

## 3. Option C — "Soft Pixel Workbench" (three-pane contact sheet)

### 3.1 Concept

| | |
|---|---|
| Promise | **Arrow through your whole library with the player always on.** |
| Best for | Game developers and power users reviewing many sprites. Animation QA. Keyboard users. Big libraries on desktop. |
| Information architecture | **Desktop**: three panes — a narrow left pane (types as a vertical chip list, then Collections) · a dense contact sheet · an always-visible stage pane (stage, transport, filmstrip, compass, inspector). The current asset drives the stage; there is no modal on desktop (V5). **Tablet**: two panes at 1180, stage-over-sheet at 768. **Phone**: grid, then a pushed full-screen stage screen (02 viewer behaviour). |
| Visual language | Mid-dark slate workbench. **Crisp 1px borders** on every surface. Small square radii (2–4). Hard 2px offset shadows on floating layers only. A signal-amber accent. A pixel face only for counts, frame numbers and size badges (V8). |
| Interaction signature | Arrow keys move focus, and the current asset, through the sheet; the stage updates in the same frame. Selection mode (02 §3.9: `x`, Ctrl/Shift-click, Select) with ≥ 2 selected turns the stage pane into a selection summary. |
| References | Lightroom Library (loupe + filmstrip), Finder column view + preview, Aseprite preview, Eagle |

### 3.2 Layout per viewport

| Viewport | Navigation | Header | Contact sheet (M) | Stage | Selection |
|---|---|---|---|---|---|
| 360×780 | **Bottom bar**, full width, 52 + safe area, 1px top border, labelled Library · Collections | **App bar 48:** pixel wordmark · Search (opens over the bar) · Select · Settings. **Chips row 44.** **Toolbar row 36:** result line ("71 assets" in pixel numerals) · Animate · Sort/size · ⋯. | 4 × 84, gap 3, gutter 8, no captions (V9) | **Pushed screen**: app bar 48 (‹ · title + state · ⋯), ‹ › at the stage edges, stage 360 × 328, transport 48, filmstrip 56, context row 48, then the inspector (scrolls) | The bottom bar becomes the selection bar (52) |
| 780×360 | **Rail 72** labelled (Library, Collections; bottom: Search, Select, Settings) | One 44 row: chips · Animate · Sort/size · ⋯ | 8 × 84 | **Immersive**: full-bleed stage, a bottom transport capsule 48 and top capsules, fading after 3 s while playing. "i" opens a right sheet 320 with the filmstrip, compass and inspector. | Floating bottom bar |
| 768×1024 | Rail 80 | App bar 44 (search 240 · result line · Settings). Under the stage block: chips row 44 + sheet toolbar 36 with a **Sheet / Info** segmented control. | **Stage over sheet**: 7 × 91, gap 4, gutter 12 | Stage block on top (540): header 44 · stage 688 × 360 · controls block 136. Info swaps the sheet area for the inspector. | The selection summary replaces the stage block |
| 1180×820 | Rail 80 | App bar 44 (search 280 · result line · Settings). Chips row 44 above the sheet. Sheet toolbar 36. | **Two panes**: 6 × 99 | Stage pane 462: header 44 · stage toolbar 36 · stage 438 × 400 · controls 136 · inspector ≥ 160 | Selection summary in the stage pane |
| 1440×900 | **Left pane 216** (types, then Collections) | App bar 44 across the window: wordmark · search 280 with "/" · result line · Settings. Sheet toolbar 36. Status bar 28. | **Three panes**: 7 × 98 | Stage pane 490: stage 466 × 480 | Selection summary |
| 1920×1080 | Left pane 216 | Same; search 320 | 10 × 96 | Stage pane 682: stage 658 × 660 | Same |
| 2560×1080 | Left pane 216 | Same | 15 × 88 (16 at S) | Stage pane 938: stage 914 × 660 | Same |

- Stage pane width ≥ 1200: `clamp(440px, 0.40 × (100vw − 216px), 1040px)`.
- Stage pane width at 840–1199: `clamp(400px, 0.42 × (100vw − 80px), 560px)`.
- Fixed controls = header 44 + stage toolbar 36 + controls block 136 = 216. Stage height = pane height − 216 − 160 (minimum inspector height).

### 3.3 Wireframes

**C1 — Desktop, three panes, 1440×900 (on desktop the stage pane is the viewer)**

```text
+-------------------------------------------------------------------------------------------------------------------------+
| [::] VITRINE   [Q Search             / ]                  71 assets . Synced . (2 in PixelLab)          [*]             |
+-------------------+-----------------------------------------------------+-----------------------------------------------+
| LIBRARY           | Characters 3     Newest v  [-] M [+]  [>]  [..] Sel.| Android Courier . Base     (<) (>)     [..]   |
| [::] All          |-----------------------------------------------------|-----------------------------------------------|
|>[ o] Characters   | +-----+ +-----+ +=====+ +-----+ +-----+ +-----+     | (s)(#)(5)(8)(d)(B)(W)   [Fit][1:1][-][+]  5x  |
| [[]] Objects      | |     | |     | |     | |     | |     | |     |     | +-------------------------------------------+ |
| [~~] Images       | | art | | art | | art | | art | | art | | art |     | |                                           | |
| [##] Tilesets     | |     | |     | |    >| |     | |     | |     |     | |              +-------------+              | |
| [<>] Tiles        | +-----+ +-----+ +=====+ +-----+ +-----+ +-----+     | |              | art, k=3    |              | |
| [/\] Maps         | +-----+ +-----+ +-----+ +-----+ +-----+ +-----+     | |              +-------------+              | |
| [==] UI           | |     | |     | |     | |     | |     | |     |     | |                                           | |
| [ ?] Other        | | art | | art | | art | | art | | art | | art |     | |       stage 466 x 480 . checker           | |
|                   | |     | |     | |     | |     | |     | |     |     | |                                           | |
| COLLECTIONS       | +-----+ +-----+ +-----+ +-----+ +-----+ +-----+     | +-------------------------------------------+ |
| <3 Favorites    9 |                                                     | [|<][>][>|] |-|-|-o-|-|-| 03/08 8FPS   [N]    |
| [] 1-bit plat.  5 |  7 cols x 98 (M), gap 4, gutter 12, no captions     | |f0|f1|f2|f3|f4|f5|f6|f7| filmstrip [W] S [E] |
| [] Dungeon kit 10 |                                                     | [ Walk . 8f v ]  (+ state when > 1)    [S]    |
| + New folder      |                                                     |-----------------------------------------------|
|                   |                                                     | [Download v] [<3] [+F] [Open ^]               |
|                   |                                                     | CANVAS      128 x 128 px                      |
| Synced 12:04      |                                                     | DIRECTIONS  4 . S E N W                       |
| [*] Settings      |-----------------------------------------------------| ANIMATIONS  Walk . 8 frames                   |
| Unofficial        | Android Courier - character . 128x128      3/71     | PROMPT      slim android courier ...          |
|                   |                                                     |                                               |
+-------------------+-----------------------------------------------------+-----------------------------------------------+
  app bar 44 . left pane 216 . contact sheet (+ status bar 28) . stage pane 490 (fixed controls 216, inspector >= 160)
```

**C2 — Tablet portrait, 768×1024 (stage over sheet)**

```text
+----------+--------------------------------------------------+
| [::]     | [Q Search /]        71 assets . (2 in PixelLab)  |
| Library  |--------------------------------------------------|
|          | Android Courier . Base       (<) (>)        [..] |
| [/]      |--------------------------------------------------|
| Collect. |                  +-------------+                 |
|          |                  | art, k=3    |                 |
| [*]      |                  +-------------+                 |
|          |                                                  |
|          |         stage 688 x 360 . checker                |
|          |--------------------------------------------------|
|          | [|<][>][>|] |-|-|-o-|-|-| 03/08 8 FPS v   [N]    |
|          | |f0|f1|f2|f3|f4|f5|f6|f7|              [W] S [E] |
|          | [ Walk . 8f v ]  (+ state when > 1)       [S]    |
|          |--------------------------------------------------|
|          | (All)(Characters)(Objects)(Images)(Tilesets)(T>  |
|          | Characters 3  [Sheet|Info]  Newest v [-]M[+] [>] |
|          | +----+ +----+ +====+ +----+ +----+ +----+ +----+ |
|          | |art | |art | | ar | |art | |art | |art | |art | |
|          | +----+ +----+ +====+ +----+ +----+ +----+ +----+ |
|          | +----+ +----+ +----+ +----+ +----+ +----+ +----+ |
|          | |art | |art | |art | |art | |art | |art | |art | |
|          | +----+ +----+ +----+ +----+ +----+ +----+ +----+ |
|          | 7 cols x 91 . sheet scrolls under the fixed stage|
+----------+--------------------------------------------------+
  768 x 1024: stage block on top (540 tall), sheet below; [Sheet|Info] swaps the sheet for the inspector
```

**C3 — Phone library, 360×780**

```text
+--------------------------------------+
| [::] VITRINE       [Q] [>] Sel. [*]  |
|--------------------------------------|
| (All)(Characters)(Objects)(Images)(T>|
| 71 assets . Synced . (2 in PixelLab) |
|--------------------------------------|
| +------+ +------+ +------+ +------+  |
| | art  | | art  | | art  | | art  |  |
| |     >| |      | |    <3| |      |  |
| +------+ +------+ +------+ +------+  |
| +------+ +------+ +------+ +------+  |
| | art  | | art  | | art  | | art  |  |
| |      | |      | |      | |      |  |
| +------+ +------+ +------+ +------+  |
| +------+ +------+ +------+ +------+  |
| | art  | | art  | | art  | | art  |  |
| |      | |      | |      | |      |  |
| +------+ +------+ +------+ +------+  |
| +------+ +------+ +------+ +------+  |
| | art  | | art  | | art  | | art  |  |
| |      | |      | |      | |      |  |
| +------+ +------+ +------+ +------+  |
|--------------------------------------|
| [::] Library      [/] Collections    |
+--------------------------------------+
  4 cols x 84 (M), gap 3, pad 8, no captions; bottom bar 52
```

**C4 — Phone stage screen, 360×780**

```text
+--------------------------------------+
| [<]  Android Courier . Base     [..] |
|--------------------------------------|
|          +----------------+          |
|          | art, Fit k     |          |
| (<)      | (checker)      |      (>) |
|          +----------------+          |
|        stage 360 x 328               |
|--------------------------------------|
| [|<] [>] [>|] |-|-|-o-|-|-| 03/08 [8]|
| |f0|f1|f2|f3|f4|f5|f6|f7|  filmstrip |
| [S v] [Walk . 8f v] [(#) Checker]    |
|--------------------------------------|
| [Download v] [<3] [+ Folder] [Open ^]|
| (Hero party)                         |
| CANVAS       128 x 128 px            |
| DIRECTIONS   4 . S E N W             |
| ANIMATIONS   Walk . 8 frames         |
| PROMPT       slim android courier .. |
|  ...inspector scrolls                |
|                                      |
|                                      |
|                                      |
+--------------------------------------+
  pushed screen; swipe < > = prev/next asset, v = back; buttons for both
```

**C5 — Phone landscape stage, 780×360**

```text
+------------------------------------------------------------------------------+
| .------------------------------.                        .-----------------.  |
| | [<]  Android Courier . Base  |                        | [i]  [..]       |  |
| '------------------------------'                        '-----------------'  |
|                                +------------+                                |
|                                |  art       |                                |
|  (<)                           | Fit k=11   |                           (>)  |
|                                +------------+                                |
|                                                                              |
|       .------------------------------------------------------------.         |
|       | [|<] [>] [>|]  |-|-|-|-o-|-|-|-|  03/08  8 FPS  (#)  Fit   |         |
|       '------------------------------------------------------------'         |
+------------------------------------------------------------------------------+
  780 x 360 immersive; [i] opens a right sheet 320 (filmstrip, compass, inspector); capsules fade after 3 s
```

**C6 — Selection summary and export dialog, 1440×900**

```text
+-------------------+-----------------------------------------------------+-----------------------------------------------+
| LIBRARY           | Objects 24       Newest v  [-] M [+]  [>]  [..] Done| 12 SELECTED . 0 hidden by filter         [x]  |
| [::] All          |-----------------------------------------------------|-----------------------------------------------|
| [ o] Characters   | +=====+ +=====+ +=====+ +-----+ +=====+ +=====+     | +------+------+------+------+                 |
|>[[]] Objects      | |  v  | |  v  | |  v  | |     | |  v  | |  v  |     | | th   | th   | th   | th   |                 |
|                   | | art | | art | | art | | art | | art | | art |     | +------+------+------+------+                 |
|    +----------------------------------------------------------------+   | | th   | th   | th   | +4   |                 |
|    |Export 12 assets                                            [x] |   | +------+------+------+------+                 |
|    |12 objects                                                      |   |                                               |
|    |----------------------------------------------------------------|   | OBJECTS     12                                |
|    |PRESETS      [x] Game-ready   [ ] Frames   [ ] GIFs             |   | FILES       412       SIZE  ~38 MB            |
|    |STATES       (row shown only when characters are selected)      |   |                                               |
|    |ADVANCED  >  scale . GIF background . loop . trim . spacing     |   | [ Download...                            ]    |
|    |ESTIMATE     412 files . about 38 MB                            |   | [ Add to folder...                       ]    |
|    |FILE         vitrine-selection-12-2026-10-18.zip                |   | [ Favorite                               ]    |
|    |----------------------------------------------------------------|   | [ Clear selection                   Esc  ]    |
|    |                                 [ Cancel ]   [ Export ]        |   |                                               |
|    |                                                                |   |                                               |
|    |                                                                |   |                                               |
|    +----------------------------------------------------------------+   |                                               |
|                   |                                                     |                                               |
+-------------------+-----------------------------------------------------+-----------------------------------------------+
  >= 2 selected: the stage pane becomes the selection summary; dialog 560, 1px border, hard 2px shadow
```

### 3.4 Components

| Component | Spec (C) |
|---|---|
| App bar (≥ 600) | 44 tall, `--bg`, 1px `--border` bottom, always. Left: mark (11 cells at 2 px = 22) + pixel wordmark SVG (37 × 7 cells at 2 px = 74 × 14) in `--text-1`. **Search**: 32 tall, 280 wide (320 at ≥ 1600, 240 on tablet portrait), radius 3, `--surface-1`, 1px `--border`; focus → `--border-strong` + ring; `search` 14; keycap "/" 18 × 18, radius 2, 1px `--border`, `--font-mono` 11 px. Right: result line (count in `--font-pixel` 11 px) + in-progress chip (22 tall, radius 3, 1px `--border`) · Settings 28. |
| Left pane (≥ 1200) | 216 wide, `--bg`, 1px right `--border`, padding 8. **Section header** 28: `--font-mono` 11 px / 600, uppercase, +0.08em, `--text-3`. **Type rows** = the 9 chips as a vertical radiogroup (no counts; 02 §1.3), 30 tall, radius 3, padding 0 8: glyph 16 `--text-3` + label `--step-0` `--text-2`. Hover `--surface-2`. Checked: `--surface-3`, label `--text-1` at 600, a 2px `--accent` inset-left bar. **Collections**: Favorites, folders A–Z (count in `--font-pixel` 11 px `--text-3`), "+ New folder". **Footer**: sync status (opens S18) · Settings · short disclaimer. |
| Rail (600–1199; compact height) | 80 wide on tablet, 72 at compact height. Items 64 × 52: icon 20 over an 11 px label. Active: `--surface-3` (radius 3) + a 2px `--accent` left bar. |
| Bottom bar (phone) | Full width, 52 + safe area, `--bg`, 1px `--border` top. Two labelled items. Active: `--text-1` at 600 + a 2px `--accent` bar on the top edge. In selection mode it becomes the selection bar. |
| Chips (< 1200) | 28 tall on fine pointers; on coarse, 36 visual inside a 44 hit area. Radius 4, 1px `--border`, padding 0 10, `--step-0` `--text-2`, no counts. Checked: `--accent` fill, `--accent-contrast` text, border `--accent`, leading `check` 12. |
| Sheet toolbar | 36 tall, 1px `--border` bottom. Title `--step-0` / 600 + count in `--font-pixel` 11 px `--text-3`. Right: Sort "Newest ▾" 28 · size − [M] + (28 buttons; the level letter in `--font-pixel`) · Animate 28 (`circle-play` + the label "Animate") · ⋯ 28 · Select 28. |
| Contact-sheet cell | Square, radius 3, `--stage-theme`, inner 1px `--border` (an `inset` box-shadow, so it never affects layout), art inset 6. The 02 zones use 16-tall controls (radius 2, `--surface-3`, 1px `--border`): **top-left** hover checkbox (checked = `--accent` fill + `--accent-contrast` check, 6.8:1 light / 10.2:1 dark); **top-right** filled heart 10 (favorites), plus heart and ⋯ on hover; **bottom-left** badge chip with the 02 short text in `--font-pixel` 11 px `--text-2` and a ▶ prefix when animated; **bottom-right** "FIT" in `--font-pixel` when k < 1. **No caption** (V9). **States:** hover → `--border-strong` + the title as a tooltip; **current** → `inset 0 0 0 2px var(--select)`; selected → current ring + checkbox; focus → outline 2px `--focus`, offset 1, + halo. Keys per 02 §9.3. Enter moves focus to the stage pane title, and F toggles fullscreen. |
| Status bar | 28 tall at the sheet's bottom, 1px `--border` top. `--step--1` `--text-2`: "Android Courier — character · 128×128 · 4 directions". Right: position "3/71" in `--font-pixel` 11 px, or the export progress (S10) while one runs. |
| Stage pane | `--bg`, 1px left `--border`. **Header** 44: title `--step-1` / 600 + state `--text-3` · ‹ › 28 · ⋯ 28 (02 viewer menu). **Stage toolbar** 36: seven 18 swatch squares, radius 2, 1px `--border-strong` (checked = a 2px `--focus` ring at offset 1) · Fit · 1:1 · − · + (24 tall, `--font-mono` 11 px) · readout in `--font-pixel` 11 px "5×". **Stage**: viewer backdrop (default Checker), 1px `--border`, radius 0, padding 16. **Controls block** (136): `grid-template-columns: 1fr 136px`. Left rows: transport 40 · filmstrip 56 · context 40 (animation select 28 · state segmented 28). Right: compass, 3 × 3 of 40 cells (36 when the pane is < 480), radius 3, 1px `--border`, `--surface-1`, icon `--text-2`; checked = `--accent` fill + `--accent-contrast` icon; centre = the direction name in `--font-mono` 11 px (not interactive). **Inspector**: its own scroll region, min 160, padding 12. It opens with the 02 actions row (Download ▾ primary split, 28: `--accent` / `--accent-contrast`, radius 3 · Favorite · Add to folder · Open ↗), then the fields: rows separated by 1px dotted `--border`, a 96 px label column in `--font-mono` 11 px uppercase +0.06em `--text-3`, values `--step-0` `--text-1`, tabular. Prompt: `--font-mono` 12 px / 1.6 `--text-2` in a `--surface-1` well with 1px `--border`, radius 3, padding 8, + Copy. Then PixelLab links and Technical details. |
| Transport | 40 tall: `step-back` 28 · Play 32 square (radius 3, `--surface-3`, 1px `--border-strong`) · `step-forward` 28 · scrubber (track 2 px `--border-strong`; ticks 2 × 8 px `--border-strong`, the current tick `--select`; thumb a 10 × 14 rect in `--text-1`) · readout "03/08" in `--font-pixel` 11 px · "8 FPS" (`--font-mono` 11 px) → stepper popover · Loop 28. |
| Filmstrip | 56 tall. Frame cells 40 × 40 (each integer-fit on the viewer backdrop), gap 4, 1px `--border`, radius 2. Current: inset 2px `--select`. Click or Enter seeks. Scrolls sideways; the current frame scrolls into view with `behavior: "auto"`. Virtualized beyond 40. Static multi-direction assets show their rotations. Single images collapse it to 0, and the stage grows. |
| Selection summary (≥ 2 selected) | Replaces the stage-pane content. Header 44: "12 SELECTED" (count in `--font-pixel` 22 px) + "· 4 hidden by filter" + × (Esc). Mosaic: 4 × 4 cells of 64 (at most 16; the last is "+N"). Breakdown rows (type · pixel count). Estimate. Full-width 32 buttons, gap 8: Download… (primary) · Add to folder… · Favorite / Unfavorite · Remove from folder (folder view) · Clear selection (Esc). |
| Popover / menu base | Radius 4, `--surface-3`, 1px `--border-strong`, `--shadow-float`, padding 4. Rows 30 (44 on coarse), radius 2, hover `--surface-2`, checked = a leading `check`. The Download menu (S8) and the folder popover (S13: checkbox rows + count in `--font-pixel` + an inline "New folder" row) use it. |
| Dialog base | Radius 4, `--surface-2`, 1px `--border-strong`, `--shadow-pop`. Header 40 (title `--step-1` / 600 + ×). Body rows: `grid-template-columns: 120px 1fr`, labels in `--font-mono` 11 px uppercase `--text-3`, 1px `--border` separators, rows ≥ 44. Footer 52. Phone: full screen. Settings uses it at 600 wide, with a segmented tab row 36 (the 02 §3.12 sections). |
| Export dialog (S9) | Dialog base, 560. PRESETS (single: radio rows; multi: Game-ready · Frames · GIFs checkboxes) · SCOPE · ADVANCED (collapsed) · ESTIMATE · FILE (filename preview in `--font-mono`). Footer: Cancel · Export. |
| Progress (S10) · ready sheet (S11) | Desktop: in the status bar — a 2px `--select` line across its top plus "Exporting 132/412 · 41 MB" (counts in pixel type) and Cancel. Phone: a 40 chip above the bottom bar. The ready sheet uses the dialog base. |
| Toast (S22) | Bottom-right of the sheet pane, 12 above the status bar (phone: bottom centre, above the bottom bar). 40 tall, radius 3, `--surface-3`, 1px `--border-strong`, `--shadow-float`. 5 s / ≥ 10 s with an action. |
| Phone stage screen | App bar 48 (‹ 44, title + state `--step-1` / 600, ⋯ 44). Stage at full width, height `min(42dvh, 100vw)`, ‹ › at its edges. Transport 48 · filmstrip 56 · context row 48 (Direction ▾ → compass popover 3 × 3 × 44, Animation ▾, State ▾, backdrop button). The inspector starts with the actions row. |
| Collections (phone, tablet) | List rows 56: cover 40 (integer-fit) + name `--step-0` / 500 + count in `--font-pixel` 11 px + ⋯. Favorites first, then A–Z. |
| Empty / Other / Images-gate cards | Mark at 4 px cells (44 × 44) in `--text-3`, headline `--step-1` / 600, body `--step-0` `--text-2`, outline buttons 32. |
| Connect (S1) | Centred panel 440 (phone: 100% − 24), `--surface-1`, 1px `--border-strong`, `--shadow-pop`. Pixel wordmark at 3 px cells (111 × 21) + mark. 02 S1 contents. Labels in `--font-mono` 11 px uppercase `--text-3`. Input 40 tall (44 on coarse), radius 3. Connect: primary, 40. |

**Pixel type budget (exhaustive).** Counts (result line, folders, selection) · frame readout · badge-chip text · fit and size badges · zoom readout and the size letter · status-bar position · progress counters. Nothing else uses `--font-pixel`: never prompts, names, buttons or field labels.

### 3.5 Theme tokens

```css
@font-face {   /* optional, local OFL file; a missing file falls back silently */
  font-family: "Departure Mono";
  src: url("../shared/fonts/DepartureMono-Regular.woff2") format("woff2");
  font-display: swap;
}
:root {
  color-scheme: light dark;   /* system by default; tuned mid-dark first */

  /* Slate workbench: hue 255, chroma <= 0.012 */
  --bg:              light-dark(oklch(0.94 0.006 255),  oklch(0.235 0.008 255));
  --surface-1:       light-dark(oklch(0.98 0.003 255),  oklch(0.265 0.009 255));
  --surface-2:       light-dark(oklch(0.91 0.007 255),  oklch(0.30 0.010 255));
  --surface-3:       light-dark(oklch(0.87 0.008 255),  oklch(0.35 0.011 255));
  --border:          light-dark(oklch(0.78 0.010 255),  oklch(0.42 0.012 255));   /* visible, crisp 1px */
  --border-strong:   light-dark(oklch(0.55 0.012 255),  oklch(0.62 0.012 255));
  --text-1:          light-dark(oklch(0.20 0.010 255),  oklch(0.95 0.004 255));
  --text-2:          light-dark(oklch(0.36 0.012 255),  oklch(0.82 0.006 255));
  --text-3:          light-dark(oklch(0.45 0.012 255),  oklch(0.74 0.008 255));

  /* Accent "signal amber": a fill with dark text in both modes; a darker token for text and rings in light mode */
  --accent:          light-dark(oklch(0.70 0.15 62),    oklch(0.82 0.14 78));
  --accent-contrast: light-dark(oklch(0.18 0.03 60),    oklch(0.20 0.03 70));
  --accent-text:     light-dark(oklch(0.47 0.11 58),    oklch(0.82 0.14 78));
  --accent-soft:     color-mix(in oklch, var(--accent) 18%, var(--surface-2));
  --danger:          light-dark(oklch(0.48 0.19 25),    oklch(0.74 0.15 22));
  --success:         light-dark(oklch(0.44 0.11 150),   oklch(0.78 0.14 150));
  --focus:           var(--accent-text);   /* the light amber fill is only 2.3:1 on --bg */
  --select:          var(--accent-text);
  --scrim:           light-dark(oklch(0.2 0.01 255 / 0.36), oklch(0 0 0 / 0.6));

  /* Art backdrops: chroma exactly 0 (shared values, see 0.6). Default viewer backdrop: Checker. */
  --checker-a:       light-dark(oklch(0.86 0 0), oklch(0.30 0 0));
  --checker-b:       light-dark(oklch(0.78 0 0), oklch(0.25 0 0));
  --stage-theme:     light-dark(oklch(0.98 0 0), oklch(0.265 0 0));
  --stage-mid:       oklch(0.57 0 0);
  --stage-light:     oklch(0.83 0 0);
  --stage-dark:      oklch(0.22 0 0);
  --stage-black:     oklch(0 0 0);
  --stage-white:     oklch(1 0 0);
  --stage-viewer:    var(--stage-theme);

  /* Type */
  --font-ui:    system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif;
  --font-mono:  ui-monospace, "SF Mono", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --font-pixel: "Departure Mono", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  --step--1: clamp(0.75rem, 0.74rem + 0.05vw, 0.78125rem);    /* 12-12.5 px */
  --step-0:  clamp(0.8125rem, 0.80rem + 0.08vw, 0.875rem);    /* 13-14 px: dense tool UI */
  --step-1:  clamp(0.9375rem, 0.90rem + 0.15vw, 1.0625rem);   /* 15-17 px */
  --step-2:  clamp(1.125rem, 1.06rem + 0.30vw, 1.375rem);     /* 18-22 px */
  --step-3:  clamp(1.375rem, 1.25rem + 0.60vw, 1.75rem);      /* 22-28 px */
  --pixel-1: 11px;   /* pixel face: native multiples only, never fluid */
  --pixel-2: 22px;
  --leading-tight: 1.2; --leading: 1.45; --leading-mono: 1.6;

  /* Shape and space */
  --radius-xs: 2px; --radius-sm: 3px; --radius-md: 3px; --radius-lg: 4px; --radius-pill: 999px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --gap-grid: 4px; --pad-grid: 12px; --inset-art: 6px;
  --target: 28px;

  /* Elevation: hard one-step "pixel" shadows, floating layers only (borders survive forced colours) */
  --shadow-float: 2px 2px 0 light-dark(oklch(0.2 0.01 255 / 0.22), oklch(0 0 0 / 0.5));
  --shadow-pop:   3px 3px 0 light-dark(oklch(0.2 0.01 255 / 0.26), oklch(0 0 0 / 0.55));

  /* Motion: snappy, stepped where it is decorative */
  --dur-1: 80ms; --dur-2: 120ms; --dur-3: 180ms; --dur-4: 260ms; --dur-fade: 160ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-step: steps(3, jump-end);

  /* Layers */
  --z-grid: 0; --z-sticky: 10; --z-nav: 20; --z-panel: 30; --z-actionbar: 40;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
@media (width < 600px), (height < 480px) { :root { --gap-grid: 3px; --pad-grid: 8px; } }
@media (pointer: coarse) { :root { --target: 44px; } }
@media (prefers-reduced-motion: reduce) {
  :root { --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; --dur-4: 0ms; --dur-fade: 0ms; }
}
```

Borders are 1 CSS px, so they can render unevenly at DPR 1.25 and 1.5. Accept this in the mockup, and judge it on a Windows 125% display during review (risk C-3).

### 3.6 Contrast (computed)

| Mode · token (WCAG ratio / APCA Lc) | `--bg` | `--surface-1` | `--surface-2` | `--surface-3` |
|---|---|---|---|---|
| light · `--text-1` | 15.18 / 93 | 17.09 / 101 | 13.86 / 87 | 12.22 / 80 |
| light · `--text-2` | 9.11 / 83 | 10.25 / 91 | 8.31 / 78 | 7.33 / 70 |
| light · `--text-3` | 6.24 / 74 | 7.02 / 82 | 5.69 / 68 | 5.02 / 61 |
| light · `--accent-text` | 5.94 / 72 | 6.68 / 80 | 5.42 / 67 | 4.78 / 59 |
| light · `--danger` | 6.07 / 71 | 6.83 / 79 | 5.54 / 65 | 4.88 / 58 |
| light · `--success` | 6.19 / 73 | 6.97 / 81 | 5.65 / 68 | 4.98 / 60 |
| dark · `--text-1` | 14.41 / 95 | 13.22 / 94 | 11.78 / 92 | 9.76 / 89 |
| dark · `--text-2` | 9.55 / 69 | 8.76 / 68 | 7.81 / 66 | 6.47 / 63 |
| dark · `--text-3` | 7.23 / 55 | 6.64 / 54 | 5.91 / 52 | 4.90 / 49 |
| dark · `--accent-text` | 9.40 / 68 | 8.63 / 67 | 7.69 / 66 | 6.37 / 62 |
| dark · `--danger` | 6.77 / 52 | 6.22 / 51 | 5.54 / 49 | 4.59 / 46 |
| dark · `--success` | 8.78 / 65 | 8.06 / 64 | 7.18 / 62 | 5.95 / 59 |

| Mode | `--accent-contrast` on `--accent` | `--border-strong` on `--bg` / `--surface-2` | `--focus` on `--bg` / `--surface-3` | `--accent` fill on `--bg` |
|---|---|---|---|---|
| light | 6.80 / Lc 50 | 4.07 / 3.71 | 5.94 / 4.78 | 2.33 |
| dark | 10.24 / Lc 70 | 4.58 / 3.75 | 9.40 / 6.37 | 9.40 |

### 3.7 Motion

| Moment | Spec | Reduced motion |
|---|---|---|
| Current asset → stage | Same frame, 0 ms, no crossfade. The static thumbnail appears at once and frames swap in once decoded. Production fetches detail after a 400 ms dwell (V6). | Same |
| Grid → phone stage screen | 160 ms opacity crossfade (no slide: art never moves under a transform) | Cut |
| Checkbox check | The badge appears with `--ease-step` over `--dur-2`: opacity 0 → ⅓ → ⅔ → 1, frame by frame, like a sprite | Instant |
| Menus and popovers | Opacity over `--dur-1` | Instant |
| Button press | Buttons only: `translate(1px, 1px)`, and the hard shadow shrinks to 1px over `--dur-1`. Never on art. | No translate |
| Filmstrip | The current frame scrolls into view with `behavior: "auto"` | Same |
| Immersive capsules (landscape) | Fade out after 3 s while playing, over `--dur-3`. Any input brings them back. | Stay visible |

### 3.8 Signature details

1. **Always-on stage.** Arrow through the contact sheet and the stage, compass and filmstrip follow instantly, like a loupe on a light table.
2. **Filmstrip + frame ticks.** Every frame is visible and seekable. `,` and `.` step frames, with the readout `03/08` in pixel numerals.
3. **Pixel numerals, nowhere else.** Counts, frame numbers and badges use an 11/22 px pixel face; everything you read stays in the system UI font.
4. **Crisp 1px workbench.** Borders do the structuring, aligned to whole pixels. Floating layers cast a hard 2px "pixel" shadow.
5. **Selection becomes a summary.** With two or more selected, the stage turns into a mosaic with counts and bulk actions, so the desktop needs no separate selection bar.

### 3.9 Pros, cons, risks, complexity

- **Pros**
  - The fastest review loop (arrow = see).
  - The best art inspection: always-on stage, filmstrip, inline compass, checker by default.
  - The best bulk work: a dense sheet plus the summary pane.
  - Speaks directly to game developers.
  - Distinctive without kitsch, as long as pixel type stays ≤ 3%.
- **Cons**
  - Dense and tool-like, so casual users face the steepest learning curve.
  - Three panes are cramped at 1200–1440.
  - The stacked tablet-portrait layout is unusual.
  - Adds a font file, and pixel faces have narrow glyph coverage (Latin digits and caps only).
- **Risks**
  - **C-1**: dwell reads (V6). Each arrow step that rests costs a detail GET plus a preflight. Mitigation: 400 ms dwell, dedupe, cache.
  - **C-2**: amber collides with gold and fire palettes. Mitigation: checkboxes and inset rings, never colour alone.
  - **C-3**: 1px borders and pixel numerals look uneven at DPR 1.25 / 1.5.
  - **C-4**: V5, V7, V8 and V9 depart from 02 or R1.
- **Complexity: L.** Three panes, a current-asset stage with debounce and cache, the filmstrip, the stacked tablet layout, the selection-summary mode, and the pixel face.

---

## 4. Side-by-side summary

| | A · Quiet Studio | B · Gallery Wall | C · Soft Pixel Workbench |
|---|---|---|---|
| Information architecture | 02's grid + a persistent inspector | Shelves + full-page detail | Three panes: types · sheet · stage |
| Desktop navigation | Collapsible sidebar (02) | Top nav tabs | Left pane + app bar |
| Opening an asset | Click = current (inspector); double-click / Enter / Space = modal viewer | Click opens a page | Selecting *is* viewing |
| Inspector lives in | Grid-side panel (≥ 1200) and the viewer | The detail page's info column | The stage pane |
| Phone navigation | Floating pill + round search | Full-width tab bar | Full-width bottom bar |
| Phone asset view | Full-screen dialog + inspector sheet | Scrolling page + sticky actions row | Pushed tool screen with filmstrip |
| Bulk bar | Top contextual bar / floating pill | Floating action bar | Selection-summary pane |
| Density at 1440×900 (default size) | 5 × 152 (L) | 7 × 169 (M, labelled) | 7 × 98 (M) |
| Theme | Dark-first cool neutral, ice blue | Light-first warm paper, plum | Mid-dark slate, amber |
| "Stage" backdrop / initial default | N8 or Dark / Stage | N8 or N5 / Stage | Theme / Checker |
| Type | System UI + mono | System UI + system serif + mono | System UI + mono + pixel numerals |
| Card radius | 10 | 6 | 3 |
| Deviations from 02 | V1, V2, V6 | V2, V3, V4 | V2, V5–V9 |
| Complexity | **M** | **M** | **L** |

## 5. Evaluation rubric, preliminary scores, recommendation

Each criterion is scored 1–5. Points = score / 5 × weight. These are preliminary scores based on the specifications. Rescore after the mockups are reviewed against §5.2 and the 03 acceptance checks.

| Criterion | Weight | A | B | C | Rationale |
|---|---|---|---|---|---|
| Intuitiveness / learnability | 25 | 5 → 25 | 3.5 → 17.5 | 3 → 15 | A reuses the Photos/Finder grammar on top of 02. B's two library modes and route detail are clear but split. C's dense three panes favour experts. |
| Art presentation | 20 | 4 → 16 | 4 → 16 | 5 → 20 | All three are pixel-exact. C keeps the stage, compass and filmstrip always visible. B's exhibit page is big and calm. A's needs a double-click on desktop. |
| Mobile / touch parity | 15 | 5 → 15 | 4 → 12 | 3.5 → 10.5 | A's pill, sheet and swipes follow platform norms. B's page model suits phones, but shelves cost density. C's tool screen is busy at 360 px. |
| Accessibility | 10 | 5 → 10 | 4 → 8 | 4 → 8 | A: the 02 modal viewer plus list semantics. B: horizontal scrollers and route focus management. C: excellent keyboard support, but dense 28 px targets and pixel numerals. |
| Bulk / organize efficiency | 10 | 4 → 8 | 2.5 → 5 | 5 → 10 | C's dense sheet and summary pane are fastest. B needs "See all" before bulk work. |
| Implementation simplicity | 10 | 4 → 8 | 3 → 6 | 2.5 → 5 | A is 02 plus one panel. B adds route detail, shelves and mosaics. C adds panes, the debounced stage and the filmstrip. |
| Visual polish / modernity | 10 | 3.5 → 7 | 5 → 10 | 4 → 8 | B is the most distinctive. C has character. A risks reading as generic. |
| **Total** | **100** | **89** | **74.5** | **76.5** | |

### 5.1 Preliminary recommendation

**Build all three mockups as specified, and expect A to become the base.** It scores highest on the heaviest criteria, stays closest to 02 and R1, and carries the lowest risk.

If the mockups confirm this, trial these borrowings in A before freezing:
- From C:
  - The **selection-summary** treatment in A's multi-select inspector (A already approximates it).
  - The **filmstrip** in A's viewer dock, if it costs ≤ 1 row (needs a scope call: 01 defers it).
  - **Pixel numerals** for counts only (V8 trial).
- From B:
  - **Wall-label typography** in A's inspector (small-caps labels, a serif title). Test it, don't ship it by default.
  - **2×2 cover mosaics** on A's Collections cards.

**Switch the base** if the review shows either of these:
- C's keyboard loop clearly beats A on the animation-QA task.
- B's shelves beat A's grid on the browse task without hurting the bulk task.

### 5.2 Review tasks (same for all three mockups, on top of 03 §5)

1. Find the Android Courier and play Walk facing west at 4 fps, frame by frame.
2. Compare the two Hooded Orb Mage states facing north-east.
3. Check whether the Stone Steps sprite has stray transparent pixels (switch backdrops).
4. Select 12 objects and export them as GIFs with metadata.
5. Create the folder "Boss fight", add three assets, then remove one.
6. View Meadow Ruins at 1:1 and pan to its right edge.
7. Repeat tasks 1, 4 and 5 at 360×780, at 780×360, and with the keyboard only.
8. Turn on reduced motion and check that nothing autoplays in the grid and that the viewer opens paused.

## 6. Branding (proposals; the owner decides)

**Name.** "Vitrine" (a museum display case) is the working name. The final name, trademark and domain checks belong to the owner (01 §11, G22). Don't lead with "PixelLab". Refer to PixelLab in plain text only. Never use PixelLab's logo, mascot, colours (including its teal selection colour) or UI screenshots as branding.

**Mark rules.**
- Monochrome `currentColor`.
- Drawn as an inline SVG of `<rect>`s with `shape-rendering="crispEdges"`, sized in whole CSS px multiples of its grid (2 px per cell in chrome).
- Favicon and app icon: the mark on `--bg`, redrawn per size (16 / 32 / 180 / 512) on an integer grid, never downscaled.
- Disclaimer copy comes from 02 §12 (Connect, About). Each option adds one persistent short placement, listed below.

### 6.1 Option A — "frame + pixel" mark (12 × 12)

```text
############
#..........#
#..........#
#..........#
#..........#
#..........#
#..........#
#......##..#
#......##..#
#..........#
#..........#
############
```
- **Wordmark.** The mark at 2 px cells (24 px) + "Vitrine" in `--font-ui` 600, 17 px, −0.01em, `--text-1`, gap 8. The 2×2 pixel may take `--accent`; everything else is `currentColor`.
- **Disclaimer placement.** Connect (under the form). Sidebar footer (short). Settings › About. The end-of-list line on phone (short).

### 6.2 Option B — "vitrine" mark (12 × 10): a display case on a plinth

```text
.##########.
.#........#.
.#........#.
.#...##...#.
.#...##...#.
.#........#.
############
############
.##......##.
.##......##.
```
- **Wordmark.** The mark at 2 px cells (24 × 20) + "Vitrine" in `--font-display` 400, 22 px, `--text-1`. On Connect, the descriptor sits underneath in small caps (`--step--1`, +0.08em, `--text-3`).
- **Disclaimer placement.** Connect (under the form). The Library colophon under the last shelf (short). Settings › About.

### 6.3 Option C — "contact sheet" mark (11 × 11) and pixel wordmark (5 × 7 glyphs)

```text
###.###.###
#.#.#.#.#.#
###.###.###
...........
###.###.###
#.#.#.#.###
###.###.###
...........
###.###.###
#.#.#.#.#.#
###.###.###
```
The filled middle-right cell (the "current" frame) may take `--accent`.

```text
V        I    T        R        I    N        E
#...#    ###  #####    ####.    ###  #...#    #####
#...#    .#.  ..#..    #...#    .#.  ##..#    #....
#...#    .#.  ..#..    #...#    .#.  #.#.#    #....
#...#    .#.  ..#..    ####.    .#.  #..##    ####.
.#.#.    .#.  ..#..    #.#..    .#.  #...#    #....
.#.#.    .#.  ..#..    #..#.    .#.  #...#    #....
..#..    ###  ..#..    #...#    ###  #...#    #####
```
- **Wordmark.** "VITRINE", with 1 cell between glyphs = 37 × 7 cells. 2 px cells in the app bar (74 × 14), 3 px on Connect (111 × 21). The mark sits to the left, gap 8.
- **Disclaimer placement.** Connect (under the panel). The left-pane footer (short). Settings › About. The Collections list footer on phone (short).

## 7. Open questions for the orchestrator and mockup review

1. **V10 (backdrops).** The ruling says 7 (with Dark); 02 §3.5 says 6. Pick one before token freeze. *Resolved by F-4: five.*
2. **V1 / V3 / V4 / V5 (concept deviations from 02's single modal viewer).** Do reviewers prefer A's grid-side inspector, B's page or C's stage pane enough to change 02's "no persistent inspector" decision?
3. **V6 (dwell fetch).** Is 400 ms right? Re-measure once Phase 0 publishes read limits (G3, G10).
4. **A's 1200 px switch.** Is "click = current" above 1200 and "click = open" below it confusing on 1180–1280 laptops?
5. **C at 1200–1440.** Is three panes too cramped? The fallback is to collapse the left pane into the 80 rail below 1440.
6. **Viewer default backdrop.** N8 / Dark vs N8 / N5 vs Checker: which do reviewers judge sprites on best (warm palettes, white sprites, glowing effects)?
7. **Accents.** Check ice blue, plum and amber against PixelLab's real palette before token freeze (G23, 01 §11).
8. **Pixel face (V8).** Is 11 px pixel type readable at DPR 1.25 / 1.5, and are the localization limits acceptable?
