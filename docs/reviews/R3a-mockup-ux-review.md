# R3a: Mockup UX Review (options A, B, C)

Review date: 2026-10-18. Reviewer role: independent senior UX researcher (did not build the mockups).
Inputs: the three interactive mockups in `mockups/`, their READMEs, `docs/design/01`–`04` (04 §5 rubric), and `docs/reviews/R2-design-spec-review.md`.
Evidence: 186 screenshots captured during the walkthroughs. They are cited by filename only. The prefix is `{option}-{device}-{task}`: device `p` = phone portrait, `pl` = phone landscape, `tp` / `tl` = tablet portrait / landscape, `d` = laptop.

---

## Summary verdict

1. **Take forward a hybrid built on A's shell**: A's captioned grid, its modal viewer with a phone bottom sheet, the floating phone nav with bottom search, and the immersive phone-landscape viewer. Drop A's V1, so a click or tap opens the viewer at every size.
2. **From B, take the single-asset experience**: inline download presets with one-line descriptions, the wall-label info column, an inline compass, fps in the transport row, 2×2 folder covers, and the warm light palette.
3. **From C, take three things**: the selection-summary panel, the labelled "Open in PixelLab ↗" button and the non-blocking partial-failure toast. Drop C's always-on stage, filmstrip and captionless grid.
4. **No option wins outright** (A 75.5, B 74, C 72.5 of 100). A has the best phone and landscape model. B has the best asset page and the prettiest look. C has the fastest desktop browse → watch loop.
5. **Fix these before freezing**:
   - A's phone search trap (severity 4) and the floating-nav occlusion (severity 3)
   - R2's download, onboarding and terminology changes, which all three mockups still show

---

## 1. Method

**Devices (exact CSS viewports)**

| Device | Viewport | DPR | Input |
|---|---|---|---|
| Phone portrait | 390×844 | 2 | Touch (taps, 750 ms long-press, swipes) |
| Phone landscape | 844×390 | 2 | Touch |
| Tablet portrait | 820×1180 | 2 | Touch |
| Tablet landscape | 1180×820 | 2 | Touch |
| Laptop | 1440×900 | 1 (one DPR 2 scaling spot check) | Mouse + keyboard |

**Emulation**
- A private headless Microsoft Edge 155 instance, driven over the Chrome DevTools Protocol. It was killed after the session.
- `Emulation.setDeviceMetricsOverride` with mobile flag and orientation, plus `setTouchEmulationEnabled`, so the pages saw `pointer: coarse`.
- Input came from `Input.dispatchTouchEvent`, `dispatchMouseEvent` (including Ctrl-click and double-click) and `dispatchKeyEvent`. State was read with `Runtime.evaluate`.
- Screenshots were taken at CSS-pixel scale and corrected for document scroll.
- Colour scheme:
  - A and C ran in dark (their intended primary).
  - B ran in light, its intended primary. One B dark-mode screenshot was also taken (`B-pl-grid`).

**Procedure**
- Every task (T1–T9) was run end to end on phone portrait for all three options, with taps and surfaces counted live.
- On laptop, T1 (screen), T2, T3, T5, T8 and T9 were run for all three options. T4 was run on laptop for A.
- On phone landscape and both tablet sizes, the start screen and viewer were captured. The required controls were located (by geometry and accessible-name dumps) and the key flows were spot-run. Those cells are marked **(i)** in the matrix: the result is inferred from verified controls plus the same flow measured on another device.
- Demo shortcuts (`?demo=…`, `&state=` / `&flags=`) were used only to reach start states and fake error states, never to skip a step being counted.

**Measures**
- **Result**: Y / P (partial) / N.
- **Taps or clicks**: typing excluded; one swipe counts as one.
- **Surfaces**: the number of distinct UI surfaces visited, as a time-on-task proxy. Library, results, viewer, popover, sheet and dialog each count once.
- **Confusions**: errors and moments of doubt, as observed.

**Limits**
- No real devices, on-screen keyboards, safe-area insets or screen readers. The interaction between the iOS keyboard and A's bottom search bar is therefore unknown.
- 320 px reflow, 200% text and reduced motion were not re-tested.
- Downloads, clipboard and hand-offs are faked in all three mockups, so the result shown is the mockup's toast or sheet.
- The sample library has 71 assets, so scale behaviour was not assessed.
- Counts are for an informed tester who already knows the target. A first-time user adds search and hesitation time.

---

## 2. Task results matrix

Cell format: **result · taps/clicks · surfaces**. "—" means not applicable.

### T1 First run: connect (fake token) → first art

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 2 (4 with help) · 2–3 | Y · 3 (scroll to Connect) · 2 | Y (i) · 2 · 2 | Y (i) · 2 · 2 | Y · 1–2 · 2 |
| B | Y · 2 (4 with help) · 2–3 | Y · 3 (scroll) · 2 | Y (i) · 2 · 2 | Y (i) · 2 · 2 | Y · 1–2 · 2 |
| C | Y · 2 (4 with help) · 2–3 | Y · 3 (scroll) · 2 | Y (i) · 2 · 2 | Y (i) · 2 · 2 | Y · 1–2 · 2 |

**Moments of doubt in all three (4 each):**
- "token" is not PixelLab's word ("API key").
- The help steps are collapsed.
- The Remember choice comes before any value has been shown.
- The full-access / spending-credits warning sits beside "Unofficial".

The token field is also autofocused on touch, so the keyboard covers half the form (`A-p-T1-01-connect`, `B-p-T1-01-connect`, `C-p-T1-01-connect`).

**Option-specific:**
- **A:** the "Connected. Loading your library…" toast is still on screen after the status line says "Synced", and it covers the grid (`A-p-T1-05-library`).
- **B:** the Recent shelf reshuffles while cards stream in (`B-p-T1-04-sync` vs `B-p-T1-05-home`).
- **C:** the status chip is clipped to "2 in PixelLa" (`C-p-T1-04-library`).
- **Landscape (all three):** Connect sits below the fold (`A-pl-T1-connect`, `B-pl-T1-connect`, `C-pl-T1-connect`).

### T2 Android Courier → Walk facing east → slower → step frames

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 13 · 5 | Y (i) · 10 · 4 | Y (i) · 11 · 4 | Y (i) · 11 · 4 | Y · 12 · 6 |
| B | Y · 12 · 5 | **P** · 12 · 5 | Y (i) · 11 · 4 | Y (i) · 11 · 4 | Y (i) · 10 · 4 |
| C | Y · 12 · 5 | Y (i) · 12 · 4 | Y (i) · 11 · 4 | Y (i) · 10 · 3 | Y · 10 · 3 |

**A**
- Phone portrait: the fps control is the last item of a sideways-scrolling context row, off-screen at 390 px, and was found only by swiping the row (`A-p-T2-05-east`, `A-p-T2-06-ctxscroll`, `A-p-T2-08-4fps`).
- Laptop: a single click only makes the card "current", and the inspector shows a small static preview with no direction or speed controls. A double-click is needed to play it, which was a clear moment of doubt (`A-d-T2-02-current`, `A-d-T2-04-east4fps`).
- Landscape: the capsules include animation, direction and fps, but the zoom −/+ controls are clipped off the right edge (`A-pl-T2-viewer`).

**B**
- Phone portrait: fps is visible in the transport row (`B-p-T2-06-stepped`). The Direction button shows ↑ while South is selected (`B-p-T2-03-compass`).
- Landscape: direction and animation are reachable only through "Details ▾", which scrolls the art completely off-screen. The user can't watch while changing direction, hence P (`B-pl-T2-detail`, `B-pl-T2-details`).
- Laptop: the compass sits inline next to the transport. This is the best desktop control layout of the three (`B-d-T2-detail`).

**C**
- The filmstrip makes stepping tangible (tap a frame, then step).
- Phone portrait: the speed popover does not close on an outside tap and covers the filmstrip (`C-p-T2-06-stepped`).
- Landscape: direction is inside the Info sheet, and the transport bar covers the art's feet (`C-pl-T2-info`).
- Tablet landscape: the Loop button overlaps the compass (`C-tl-T2-stage`).
- Laptop: one click and it plays in the stage (`C-d-T2-01-stage`).

### T3 Download that walk as a GIF (and how to get a sprite sheet and a frames ZIP)

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 3 · 3 | Y (i) · 3–4 · 3 | Y (i) · 2–3 · 2 | Y (i) · 2 · 2 | Y · 1–2 · 2 |
| B | Y · 3 · 3 | Y (i) · 2–3 · 3 | Y (i) · 1–2 · 2 | Y (i) · 1–2 · 2 | Y · 1 · 1 |
| C | Y · 3 · 3 | Y (i) · 3 · 3 | Y (i) · 2–3 · 2 | Y (i) · 2–3 · 2 | Y · 1 · 1 |

**In all three:**
- Sprite sheet and frames ZIP come from the same 8-entry menu: GIF, PNG, two "Sprite sheet + JSON" items, Frames ZIP, PixelLab ZIP, PixelLab sprite sheet, and More options. The PixelLab look-alikes remain (`A-p-T3-01-menu`, `B-p-T3-02-menu`, `C-p-T3-01-menu`).
- No surface says whether the GIF will play at the 4 fps the user just set.
- The filename carries a silent "@2x" (`A-p-T3-06-advanced`).

**A**
- The split button's primary action is labelled only "Download". It is actually the current GIF, which is not obvious.
- Phone landscape: Download is missing from the immersive ⋯ menu and needs ⓘ first (`A-pl-T3-moremenu`, `A-pl-T3-details`).
- The ready sheet is compact and clear (`A-p-T3-02-gif`).

**B**
- The inline preset cards carry one-line descriptions ("Animated, transparent, sized for chat"). This is the most self-explanatory download UI of the three (`B-p-T3-05-inline`, `B-d-T3-gif`).
- The ready sheet is an almost empty full-height dialog (`B-p-T3-04-ready`).

**C**
- Same menu as A. The primary "Download" is unlabelled (it is the GIF) (`C-d-T3-gif`).
- The ready sheet is oversized, like B's (`C-p-T3-03-ready`).

### T4 Favorite two assets, create folder "Boss fight", add three assets, view the folder

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 14 (+3 recovery) · 7 | Y (i) · 14 · 7 | Y (i) · 12 · 6 | Y (i) · 12 · 6 | Y · 10 · 5 |
| B | Y · 17 · 8 | Y (i) · 17 · 8 | Y (i) · 15 · 7 | Y (i) · 13 · 6 | Y (i) · 11 · 5 |
| C | Y · 15 (+3 recovery) · 7 | Y (i) · 15 · 7 | Y (i) · 13 · 6 | Y (i) · 11 · 5 | Y (i) · 10 · 5 |

**A**
- Creating a folder and adding to it is one step in the Add to folder popover (`A-p-T4-05-created`).
- After any search, the phone's Library/Collections pill is replaced by a search bar. Only a hardware Esc brings it back; on touch, the user loses navigation (`A-p-T4-08-collections`).
- On Collections, a tap on a folder caption landed on the floating search button and navigated back to Library (`A-p-T4-10-collections`, `A-p-T4-11-folder`).
- Laptop: the "current" inspector kept showing Torch inside an empty folder (`A-d-T4-03-folder`).

**B**
- The tab bar is hidden on the detail page, so the user must go Back before reaching Collections.
- The Add to folder picker is a full-screen board grid. It is beautiful but heavy for a checkbox task (`B-p-T4-04-folderpick`).
- The folder page's search says "Search 71 assets" inside a 3-asset folder (`B-p-T4-10-folder`).

**C**
- After Back from the stage, the search box closed but the "android" filter stayed active with no visible cue: the grid showed "1 asset". The field also has no clear button, so the user has to reopen search and delete the text (`C-p-T4-01-selected`, `C-p-T4-02-searchreopen`).
- The folder name is not shown in the phone folder view (`C-p-T4-08-folder`).
- The list-style Collections screen is the most scannable (`C-p-T4-07-collections`).

### T5 Select five mixed assets (including a tileset) and start a multi-asset download

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 9 · 4 | Y (i) · 9 · 4 | Y (i) · 9 · 4 | Y (i) · 8 · 4 | Y · 7 · 3 |
| B | Y · 9 (via See all) · 4 | Y (i) · 10 · 4 | Y (i) · 9 · 4 | Y (i) · 8 · 4 | Y · 7 · 3 |
| C | Y · 8 · 4 | Y (i) · 8 · 4 | Y (i) · 8 · 4 | Y (i) · 7 · 3 | Y · 7 · 3 |

**In all three:**
- The dialog is titled "Export 5 assets" (verb drift).
- The first preset is "Game-ready".
- The type summary reads "1 tileset · 1 tile set" (A) or "1 tileset · 1 tile" (B, C).
- File and size estimates disagree across the mockups (15–31 files). They are faked, so this is not scored.

**A**
- Selected cards lose their captions on every device (`A-p-T4-02-selected3`, `A-tp-T5-select`).
- Laptop: a card made "current" by a plain click shows a blue outline like a selection but isn't counted. The screen said "4 selected" for 5 outlined cards (`A-d-T5-01-ctrlclick`).

**B**
- Bulk work on the shelves home means horizontal scrolling per shelf. A duplicated card is ticked in both shelves (`B-p-T4-02-selectmode`, `B-d-T5-01-ctrlclick`).
- Presets carry descriptions but use checkboxes, which reads as multi-select (`B-p-T5-02-dialog`).

**C**
- With no captions, confirming that "Dirt → Grass" and not "Dirt → Grass (lineless)" is selected comes down to the art alone (`C-p-T5-01-selected`).
- The desktop summary pane (mosaic, counts, actions) is the best bulk surface (`C-d-T9-05-report`).

### T6 Find assets tagged dungeon; inspect a tileset's tile size and grid; copy the prompt

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 7 · 4 | Y (i) · 7 · 4 | Y (i) · 6 · 3 | Y (i) · 6 · 3 | Y (i) · 5 · 3 |
| B | Y · 6 · 3 | Y (i) · 7 · 4 | Y (i) · 6 · 3 | Y (i) · 6 · 3 | Y (i) · 5 · 3 |
| C | Y · 6 · 3 | Y (i) · 7 · 4 | Y (i) · 6 · 3 | Y (i) · 5 · 3 | Y (i) · 5 · 3 |

**In all three:**
- `#dungeon` returns the 4 tagged objects (no tileset carries that tag) (`A-p-T6-01-tag`, `B-p-T6-01-tag`, `C-p-T6-01-tag`).
- Nothing hints that `#` searches tags. The tag chips in the info panel are the discoverable path.
- A tileset's "prompt" is its Terrains row with a copy icon, not a "Copy prompt" button.
- Tile size (16×16 px) and grid (16 · 4×4 sheet) read clearly in all three (`A-p-T6-03-details`, `B-p-T6-03-tilemeta`, `C-p-T6-03-tilemeta`).

**Option-specific:**
- **A:** the phone grid overlay shows `wang_0…15` labels by default, which is noisy (`A-p-T6-03-details`).
- **C:** the results have no captions (`C-p-T6-01-tag`).

### T7 Open an object in PixelLab (hand-off)

| Option | Phone P | Phone L | Tablet P | Tablet L | Laptop |
|---|---|---|---|---|---|
| A | Y · 1 (icon) or 2 (text link) · 2 | Y (i) · 2 · 2 | Y (i) · 1 · 1 | Y (i) · 1 · 1 | Y (i) · 1 · 1 |
| B | Y · 1–2 · 2 | Y (i) · 2 · 2 | Y (i) · 1 · 1 | Y (i) · 1 · 1 | Y (i) · 1 · 1 |
| C | Y · 1 · 1 | Y (i) · 2 · 2 | Y (i) · 1 · 1 | Y (i) · 1 · 1 | Y (i) · 1 · 1 |

**Obvious and external:**
- All links open a new tab with ↗ and "(opens PixelLab in a new tab)" in the accessible name.
- A and C use `rel="noopener noreferrer"`. B's mockup shows a toast instead of navigating (`B-p-T7-02-clicked`).
- Only C's primary button carries a visible label ("Open ↗") (`C-p-T2-02-stage`). A and B use an icon-only ↗ square beside Download (`A-p-T2-03-viewer`, `B-p-T2-02-detail`).

**Safe:**
- Every option lists "Animate in PixelLab ↗" and "New state in PixelLab ↗" next to "Open". Both are generation tools that can spend credits.
- Only A's tileset page adds "May need a paid PixelLab plan" (`A-p-T6-03-details`). Characters and objects carry no cost note anywhere (`A-p-T7-01-handoff`, `B-p-T7-02-clicked`).

### T8 Keyboard only (laptop): browse grid → open → change direction or animation → close, with focus return

| Option | Result · keys | Notes (evidence) |
|---|---|---|
| A | Y · ~16 | Skip link → first card → arrows → Enter opens the viewer (focus on the title) → `]` changes direction → `.` steps → Esc closes, and focus returns to the card. Tab after the grid wraps to the top because the empty inspector has nothing focusable (`A-d-T8-01-gridfocus`, `A-d-T8-03-viewerkeys`). |
| B | Y · ~16 | Arrows move within a shelf and ArrowDown jumps shelves. Enter opens the page with focus on the h1. `]` and `.` work, and Esc returns focus to the card. Every shelf card is also a Tab stop: 17 Tabs to reach the first card, and up to 24 per shelf (`B-d-T8-01-shelf`, `B-d-T8-02-detailkeys`). |
| C | Y · ~16 | The skip link focuses the grid container, which ignores arrow keys, so arrows do nothing until an extra Tab. After that, arrows move "current" and the stage plays each asset live (the fastest keyboard QA loop). Enter moves into the stage, `]` and `.` work, and Esc returns focus to the card (`C-d-T8-01-gridfocus`, `C-d-T8-02-stagekeys`). |

### T9 Recover from states (laptop; fake states via the demo or state menus)

| State | A | B | C |
|---|---|---|---|
| Invalid token | Y: inline error under the field (`A-d-T9-01-badtoken`) | Y (`B-d-T9-01-badtoken`) | Y (`C-d-T9-01-badtoken`) |
| 401 reconnect | Y, but no "get a new key" link (`A-d-T9-02-reconnect`) | Y (`B-d-T9-02-reconnect`) | Y (`C-d-T9-02-reconnect`) |
| Offline | **P**: the banner says offline while the status line still says "Synced just now" (`A-d-T9-03-offline`) | Y: the status line says "Offline" (`B-d-T9-03-offline`) | Y: "Offline · saved library" (`C-d-T9-03-offline`) |
| Images gated | Y: honest card with "Open your Creator gallery in PixelLab ↗" (`A-d-T9-04-gate`) | Y (`B-d-T9-04-gate`) | Y, but a 490 px "Nothing selected" stage stays empty (`C-d-T9-04-gate`) |
| Export partial failure | Y: modal report + Retry failed (`A-d-T9-05-report`) | Y, but it offers Retry for a "may have been deleted" asset (`B-d-T9-05-report`) | Y: non-blocking toast "Exported 11 assets. 1 couldn't be exported. View report" (`C-d-T9-05-report`) |

T9 was not re-run on phone or tablet. The same components are used at every size.

### Phone measurements (art versus chrome)

| Measure | A | B | C |
|---|---|---|---|
| Phone P: top of first art | 144 px | 329 px (shelves) / 289 px ("See all") | ~150 px |
| Phone P: complete cards on first screen | 12 (3 columns, captioned) | ~4 (2.3 per shelf) | 24 (4 columns, no captions) |
| Phone L: top of first art · complete cards | 80 px · 4 | 170 px · ~4 (shelves); 193 px · **0** ("See all") | 96 px · 18 |
| Phone P viewer: share of height given to art | ~64% | ~46% | ~42% |
| Phone P viewer: visible tap targets | 22 | 20 | 34 |
| Laptop viewer: visible targets | 36 (modal) | 51 (page with inline presets) | 130 for the whole screen (grid + stage, not comparable) |

---

## 3. Heuristic findings

Severity uses Nielsen's scale: 1 cosmetic · 2 minor · 3 major · 4 catastrophic. H# is the Nielsen heuristic number.

### 3.1 Shared by all three mockups

| # | Sev | Finding | H# | Evidence |
|---|---|---|---|---|
| S1 | 3 | Onboarding: "token" instead of "API key"; help is collapsed; Remember is offered up front; a credits warning sits beside "Unofficial"; the field is autofocused on touch | 2, 10 | `A-p-T1-01-connect`, `B-p-T1-01-connect`, `C-p-T1-01-connect` |
| S2 | 3 | Download menu has 8 entries with look-alikes; "Export" and "Download" both name one action; "Game-ready" preset; "This animation / All animations / Everything" | 4, 8 | `A-p-T3-01-menu`, `A-p-T3-05-dialog`, `A-p-T5-02-dialog` |
| S3 | 2 | No surface says whether a GIF or sheet uses the user's fps override (4 fps in T2/T3) | 1 | `A-p-T3-06-advanced` |
| S4 | 2 | The "Animate" toolbar toggle shares a word with "Animate in PixelLab ↗", a generation tool that spends credits | 2, 4 | `A-p-T1-05-library`, `A-p-T7-01-handoff` |
| S5 | 2 | Generation hand-offs (Animate, New state) have no credit or plan note on characters and objects | 5 | `A-p-T7-01-handoff`, `B-p-T7-02-clicked` |
| S6 | 2 | 9 chips including "Other"; Tiles vs Tilesets is unclear; on phones half the chips start off-screen | 6, 8 | `A-p-T1-05-library`, `C-p-T1-04-library` |
| S7 | 2 | "2 in PixelLab" is cryptic | 2 | `A-p-T1-05-library` |
| S8 | 2 | Settings has 7 sections plus Mockup states, with "Change token" and a Protect button (also on the Collections backup tip) | 8 | `A-d-settings`, `B-d-settings`, `C-d-settings`, `A-p-T4-10-collections` |
| S9 | 1 | A "Portrait & voice: Not in PixelLab's public API" row on characters contradicts "hide empty fields" | 8 | `A-p-T3-05-dialog` (inspector text), `B-p-T6-meta` |
| S10 | 1 | The asset title takes a visible focus ring when the viewer opens on touch | 8 | `A-pl-T2-viewer`, `C-p-T6-03-tilemeta` |

### 3.2 Option A: Quiet Studio

| # | Sev | Finding | H# | Evidence |
|---|---|---|---|---|
| A1 | **4** | Phone: after any search, the Library/Collections pill is replaced by a search bar. Only hardware Esc with an empty field, or a route change, restores it, so touch users lose navigation | 3, 1 | `A-p-T4-08-collections`, `A-p-T4-09-afterscroll` |
| A2 | 3 | The floating pill and round search button cover the content. A tap on a folder caption activated search and left Collections | 5 | `A-p-T4-10-collections`, `A-p-T4-11-folder` |
| A3 | 3 | V1 click = current: a click shows a static inspector and a double-click is needed to play; the "current" outline looks like selection; the inspector stays stale in an empty folder | 4, 2 | `A-d-T2-02-current`, `A-d-T5-01-ctrlclick`, `A-d-T4-03-folder` |
| A4 | 2 | Phone: fps sits off-screen at the end of the sideways-scrolling context row | 6 | `A-p-T2-05-east`, `A-p-T2-06-ctxscroll` |
| A5 | 2 | Selected cards drop their captions (phone, tablet, desktop) | 6 | `A-p-T4-02-selected3`, `A-tp-T5-select` |
| A6 | 2 | The "Connected. Loading your library…" toast persists after "Synced" and covers the grid | 1 | `A-p-T1-05-library` |
| A7 | 2 | Phone landscape: the context capsule is clipped (zoom −/+ off-screen), and Download is missing from the ⋯ menu | 7 | `A-pl-T2-viewer`, `A-pl-T3-moremenu` |
| A8 | 2 | Offline: the banner and the status line contradict each other | 1 | `A-d-T9-03-offline` |
| A9 | 2 | Desktop first view: a 340 px empty inspector ("Select an asset…") makes the screen look unfinished | 8 | `A-d-library` |
| A10 | 1 | Folder header: two ⋯ menus, plus the library sync line repeated inside the folder | 8 | `A-p-T4-13-folder` |
| A11 | 1 | The reconnect dialog has no "get a new key" link | 10 | `A-d-T9-02-reconnect` |

**Strengths (keep)**
- The phone viewer gives about 64% of the height to art. The sheet peek offers Download, favorite, folder and hand-off one tap away (`A-p-T2-03-viewer`).
- Phone search sits at the bottom, within thumb reach (`A-p-T2-02-results`).
- The phone-landscape viewer is the best of the three: fading capsules that keep animation, direction and fps in view (`A-pl-T2-viewer`).
- Tablet grid and viewer look excellent (`A-tl-library`, `A-tp-T2-viewer`).
- Compact ready sheet, swipe left/right/down, and focus return on close.

### 3.3 Option B: Gallery Wall

| # | Sev | Finding | H# | Evidence |
|---|---|---|---|---|
| B1 | 3 | Phone: ~330 px of chrome before the first art (large title, search, chips, two status lines, Animate). In landscape, the "See all" grid shows zero complete cards | 8 | `B-p-T1-05-home`, `B-pl-grid` |
| B2 | 3 | Phone landscape: direction and animation sit behind "Details ▾", which scrolls the art out of view | 6, 7 | `B-pl-T2-detail`, `B-pl-T2-details` |
| B3 | 2 | Phone portrait page model: reading downloads or metadata scrolls the stage away | 6 | `B-p-T3-01b-scrolled` |
| B4 | 2 | Shelves make bulk selection awkward (horizontal scroll per shelf; duplicates appear in two shelves) | 7 | `B-p-T4-02-selectmode`, `B-d-T5-01-ctrlclick` |
| B5 | 2 | The phone Add to folder picker is a full-screen board grid; New folder is the last tile | 7 | `B-p-T4-04-folderpick` |
| B6 | 2 | The ready sheet is an almost empty full-height dialog | 8 | `B-p-T3-04-ready` |
| B7 | 2 | The folder page says "Search 71 assets" in a 3-asset folder, and the header has a double ⋯ | 4 | `B-p-T4-10-folder` |
| B8 | 2 | Keyboard: every shelf card is a Tab stop (17 Tabs to reach the first card) | 7 | `B-d-T8-01-shelf` |
| B9 | 1 | The search field has two clear buttons (native and custom) | 8 | `B-p-T2-01-results` |
| B10 | 1 | The Direction button shows ↑ while South is selected | 4 | `B-p-T2-03-compass` |
| B11 | 1 | Tablet landscape: chips are truncated ("UI" and "Other" hidden) because sort, size and Animate share their row | 8 | `B-tl-home` |
| B12 | 1 | The report offers "Retry failed" for an asset that "may have been deleted" | 9 | `B-d-T9-05-report` |

**Strengths (take)**
- Inline download presets with one-line descriptions (`B-p-T3-05-inline`).
- The desktop asset page (`B-d-T2-detail`):
  - a big stage with the compass inline
  - an info column with Download visible above the fold
  - wall-label metadata
- fps sits in the phone transport row (`B-p-T2-06-stepped`).
- Selected cards keep their captions (`B-p-T5-03-progress`).
- The offline status line is consistent.
- The fps override persists per animation (`B-pl-T2-detail` shows 4 fps after a reload).
- The most distinctive, premium look (`B-d-home`, `B-tl-home`).

### 3.4 Option C: Soft Pixel Workbench

| # | Sev | Finding | H# | Evidence |
|---|---|---|---|---|
| C1 | 3 | Closing search keeps the query active but invisible (only "1 asset" hints at it), and the field has no clear button | 1, 3 | `C-p-T4-01-selected`, `C-p-T4-02-searchreopen` |
| C2 | 3 | No captions anywhere in the grid. Similar assets are distinguishable only by small art or the status bar | 6 | `C-p-T1-04-library`, `C-p-T5-01-selected`, `C-p-T6-01-tag` |
| C3 | 2 | The phone folder view doesn't show the folder name (its h1 has zero size) | 1 | `C-p-T4-08-folder` |
| C4 | 2 | Phone Back from the stage puts focus on `<body>`, not the card | 3 | `C-p-T4-00-back` |
| C5 | 2 | The speed popover doesn't close on an outside tap and covers the filmstrip | 3 | `C-p-T2-06-stepped` |
| C6 | 2 | Phone landscape: the transport bar covers the bottom of the art | 8 | `C-pl-T2-info` |
| C7 | 2 | Tablet landscape: Loop overlaps the compass | 8 | `C-tl-T2-stage` |
| C8 | 2 | An empty stage pane ("Nothing selected") takes about 490 px when the view has no current asset | 8 | `C-d-T9-04-gate` |
| C9 | 2 | The phone stage is the densest screen (34 targets, including 8 filmstrip frames); art gets about 42% of the height | 8 | `C-p-T2-02-stage` |
| C10 | 1 | The skip link focuses a grid container that ignores arrow keys (an extra Tab is needed) | 7 | `C-d-T8-01-gridfocus` |
| C11 | 1 | Desktop hover actions are 20×20 px | 7 | `C-d-T4-01-hover` |
| C12 | 1 | Many "FIT" corner labels at the default size on DPR 1 add noise | 8 | `C-d-library` |

**Strengths (take)**
- On tablet landscape and desktop, a click plays the asset at once in the stage, and arrow keys browse with a live preview (`C-tl-T2-stage`, `C-d-T2-01-stage`).
- The selection-summary pane (`C-d-T9-05-report`).
- The labelled "Open ↗" button (`C-p-T2-02-stage`).
- The non-blocking partial-failure toast.
- List-style Collections, efficient on phone (`C-p-T4-07-collections`).
- The most art per phone screen (24 complete cards).

### 3.5 First impression in five seconds ("pretty / modern")

| Device | A | B | C |
|---|---|---|---|
| Phone P | Clean and current. The floating pill and round search feel native, and art pops on charcoal tiles. Polished but slightly generic. | Warm paper, serif title, plum accent: distinctive and editorial. It reads as a magazine with the art below the fold. | A dense, crisp pixel contact sheet. You see lots of art at once, but it reads as a tool, not a gallery. |
| Phone L | Rail plus four huge cards. The immersive viewer with floating capsules is the most "app-like" moment in the review. | The header swallows the screen; the art barely appears. | Lots of art. The immersive stage is clean. |
| Tablet P | Very pretty: generous, captioned cards and calm spacing. | Gallery-wall charm; white cards make the sprites pop. | The stage-over-sheet split feels purposeful but busy. |
| Tablet L | The prettiest tablet screen in the review. | Lovely shelves, but the chips get truncated. | A pro "workbench": powerful and busy. |
| Laptop | Tidy sidebar and grid, but the empty right panel looks unfinished. | The most premium and modern. The asset page looks like a museum label. | IDE-like: three panes, amber and pixel numerals. Characterful, not minimal. |

### 3.6 Fit with the owner's core loop (browse → watch the animation → download or organize)

**Phone**
- **A is best.** One tap opens big art, the sheet peek holds Download, heart and folder, search is in thumb reach, and landscape is excellent.
- **C is second.** Everything is on one screen, but it is crowded and captionless.
- **B is third.** The chrome is heavy and the page scroll separates watching from acting.

**Desktop**
- **C has the fastest browse → watch** (one click, or arrow keys).
- **B has the best watch → download** (inline described presets).
- **A is slowest** because of V1's double-click.

A modal viewer with ←/→ through the list, opened by a single click and laid out like B's page, gives most of C's loop without a permanent pane or its empty state. That is the basis of the hybrid below.

---

## 4. R2 top-10 check

| R2 problem | A | B | C | Evidence |
|---|---|---|---|---|
| 1. Connecting is harder than claimed; "token" vs "API key" | **Confirmed** | **Confirmed** | **Confirmed** | `A-p-T1-01-connect`, `B-p-T1-02-help`, `C-p-T1-01-connect`, `C-d-settings` (Change token kept) |
| 2. "Animate" means two things; the grid never moves on phones | **Confirmed** | **Confirmed** | **Confirmed** | `A-p-T1-05-library` (toolbar "Animate"), `A-p-T7-01-handoff` ("Animate in PixelLab ↗") |
| 3. Viewer is a cockpit | **Confirmed** on desktop (36 targets; inline swatches; 5-part zoom). Phone partly fixed (backdrop behind one button) | **Confirmed** on desktop (51 targets on the page). Phone partly fixed | **Confirmed** (34 targets on the phone stage) | `A-d-T2-04-east4fps`, `B-d-T2-detail`, `C-p-T2-02-stage` |
| 4. Download menu and dialog read like a committee list | **Confirmed** | **Confirmed**; descriptions mitigate it | **Confirmed** | `A-p-T3-01-menu`, `B-p-T3-05-inline`, `C-p-T3-01-menu`, `A-p-T5-02-dialog` |
| 5. Nine chips, one fake; some off-screen | **Confirmed** | **Confirmed** (also truncated on tablet L) | **Confirmed** | `A-p-T1-05-library`, `B-tl-home`, `C-p-T1-04-library` |
| 6. Phone header doesn't fit | **Partly fixed**: 3 rows, 144 px, icon-only sort, size moved into the View sheet | **Confirmed**, worst (329 px) | **Partly fixed**: 3 rows, ~150 px, icon-only sort, a clipped chip | Phone measurements table |
| 7. Terminology drift | **Confirmed** (Collections/folder, Export/Download, token, "Stage" swatch, "fit") | **Confirmed** | **Confirmed** | `A-p-T4-13-folder`, `A-p-T3-05-dialog` |
| 8. Settings sprawl, duplicated controls | **Confirmed** (7 sections, ~36 controls) | **Confirmed** (~38 controls) | **Confirmed**; tabs hide the bulk | `A-d-settings`, `B-d-settings`, `C-d-settings` |
| 9. A's "click = current" is harder to learn | **Confirmed** | n/a | n/a. C's version (click = current with a live stage) is learnable because it plays at once | `A-d-T2-02-current`, `A-d-T5-01-ctrlclick` |
| 10. Too many special cases | **Confirmed**: "Recently updated" only on Characters; Portrait & voice row; Protect button | **Confirmed** | **Confirmed** | `A-p-T4-10-collections`, `B-p-T6-meta` |

**Net:** none of R2's ten problems is fixed in any mockup. Two are partly fixed (#3 on phone, #6 in A and C). R2's verdict holds in practice.

---

## 5. Rubric scores (04 §5 weights; points = score ÷ 5 × weight)

| Criterion | Weight | A | B | C |
|---|---|---|---|---|
| Intuitiveness / learnability | 25 | 3.5 → 17.5 | 4 → 20 | 3 → 15 |
| Art presentation | 20 | 4 → 16 | 4 → 16 | 4.5 → 18 |
| Mobile / touch parity | 15 | 4 → 12 | 3 → 9 | 3.5 → 10.5 |
| Accessibility | 10 | 4 → 8 | 3.5 → 7 | 3.5 → 7 |
| Bulk / organize efficiency | 10 | 4 → 8 | 3 → 6 | 5 → 10 |
| Implementation simplicity | 10 | 3.5 → 7 | 3 → 6 | 2.5 → 5 |
| Visual polish / modernity | 10 | 3.5 → 7 | 5 → 10 | 3.5 → 7 |
| **Total** | **100** | **75.5** (prelim. 89) | **74** (prelim. 74.5) | **72.5** (prelim. 76.5) |

**Intuitiveness**
- **A, 3.5:** the phone flows are textbook. On desktop, V1 broke the first click in T2, and the "current" outline was mistaken for selection in T5. The phone search trap (A1) is a real dead end.
- **B, 4:** click → page is the most familiar web model, and the described download presets need no learning. Points are lost on the split shelves/grid model and on scrolling between art and actions.
- **C, 3:** select-is-view is rewarding once seen. But without captions, with the invisible filter (C1) and the missing folder name, users were left guessing more than in A or B.

**Art presentation**
- **C, 4.5:** the always-visible stage, the filmstrip and the checker default favour judging animation. The grid thumbnails are small and often scaled down ("FIT").
- **A and B, 4:** A has big captioned cards and the largest phone stage. B has the best desktop stage page but the smallest phone art share among its own screens.

**Mobile / touch parity**
- **A, 4:** the strongest model: bottom search, sheet detents, immersive landscape with all playback controls. It is held back by bugs A1 and A2, which are trivial to fix but must be fixed.
- **C, 3.5:** dense and complete, but crowded, with a sticky popover and art occluded in landscape.
- **B, 3:** chrome-heavy portrait, an unusable landscape grid, and direction changes that hide the art.

**Accessibility**
- **A, 4:** skip link to the first card, roving grid, dialog focus handling, 44 px coarse targets. V1 changes link semantics, and selected cards hide their visible names.
- **B, 3.5:** good route focus (h1, focus return on Back), but a Tab stop for every shelf card.
- **C, 3.5:** excellent arrow-key loop, but a skip link that lands on an arrow-deaf container, 20 px hover targets, and identification by art alone.

**Bulk / organize**
- **C, 5:** dense sheet, summary pane, list Collections, non-blocking report.
- **A, 4:** contextual bar, mosaic summary, create-and-add.
- **B, 3:** horizontal shelves, a full-screen picker, and duplicated items.

**Implementation simplicity**
- **A, 3.5:** 02 plus an inspector, the pill morph and sheet detents.
- **B, 3:** route detail, shelves, boards, scroll-driven effects.
- **C, 2.5:** three panes, the filmstrip, seven shells. This follows 04, adjusted for the extra surfaces observed.

**Visual polish**
- **B, 5:** clearly the most designed.
- **A, 3.5:** clean, beautiful on tablet, generic on desktop.
- **C, 3.5:** cohesive pixel identity, but busy.

**Why the totals moved:** A lost about 13.5 points against its preliminary score, mainly on intuitiveness (V1) and observed mobile defects. B stayed level. C fell slightly on the captionless grid and the invisible filter.

---

## 6. Recommended hybrid

**Base: A's information architecture and phone/tablet shell, on the 02 baseline (no V1, no V6).**

### Take from A
1. The captioned grid (S/M/L/XL), with sidebar on desktop, rail on tablet and phone landscape, and floating Library/Collections pill plus bottom search on phone portrait. Fixes A1 and A2 apply.
2. The viewer: a modal dialog with the info panel open by default at ≥ 1180 px; a full-screen view with a peek/half/full bottom sheet on phone portrait. The peek holds Download · ♥ · Add to folder · Open in PixelLab.
3. The immersive phone-landscape viewer with fading capsules (animation, direction, fps and transport).
4. The compact "Your file is ready" sheet.
5. Selection: long-press, Ctrl/Shift-click and `x`, with a top contextual bar on desktop and a floating bar on phone.
6. One-step "New folder" inside the Add to folder popover, and the folder list in the desktop sidebar.
7. Swipe left/right to move between assets, swipe down to close, Esc/Back to close with focus returned to the card.

### Take from B
1. Download presets with one-line descriptions. They appear as inline cards in the desktop/tablet info panel and as the menu rows on phone.
2. The wall-label info column: small-caps labels and readable rows. The serif display face is optional and owner-tested.
3. The inline compass beside the transport on desktop and tablet (no popover).
4. fps in the always-visible transport row on phone portrait.
5. 2×2 mosaic covers for folders and Favorites on tablet and desktop.
6. Selected cards keep their captions.
7. The fps override persists per animation, and Back restores scroll and focus.
8. Status-line wording that reflects state ("Offline · saved library").
9. B's warm paper palette as the hybrid's light theme. A's charcoal is the dark theme, and the default follows the system.

### Take from C
1. The selection-summary panel (mosaic, counts by type, files and size, actions). It replaces A's empty inspector as the only use of a desktop side panel outside the viewer.
2. The labelled "Open in PixelLab ↗" button in the viewer's action row.
3. The non-blocking partial-failure toast with "View report", which opens A's report dialog.
4. Compact list rows for Collections on phone portrait. Tablet and desktop use B's mosaic tiles.
5. Segmented controls instead of a dropdown when an asset has 4 or fewer animations, as B and C both do.

### Drop
- **From A:**
  - V1 click = current, V6 dwell fetch, and the empty desktop inspector
  - a search mode that hides navigation
  - the icon-only hand-off
  - default `wang_n` labels on the tile grid
- **From B:**
  - the shelves home (V3), using the flat grid with chips instead
  - the full-page detail route (V4)
  - the full-screen board picker on phone
  - the large serif title row on phone, which costs height
- **From C:**
  - the always-on stage pane (V5)
  - the filmstrip (V7), which stays deferred per 01. The scrubber and step buttons covered T2 in A and B
  - pixel numerals (V8)
  - captionless cards (V9)
  - 98 px default cells
- **From all three:**
  - the "Other" chip
  - the "Portrait & voice" row
  - the Protect button
  - "Change token"
  - the inline row of backdrop swatches on desktop (use one Backdrop button)

---

## 7. Top 15 fixes for the recommended direction (ranked)

1. **Make a click or tap open the viewer at every size.**
   - Remove V1's "current" state, the empty inspector pane and V6.
   - At ≥ 1180 px, open the viewer with the info panel showing.
   - Evidence: `A-d-T2-02-current`, `A-d-T5-01-ctrlclick`, `A-d-T4-03-folder`.
2. **Never hide phone navigation while searching.**
   - Add a "Cancel" button to the search bar.
   - Exit search mode on Cancel, on blur with an empty field, and when the field is cleared.
   - Keep Library and Collections reachable throughout.
   - Evidence: `A-p-T4-08-collections`.
3. **Reserve space for the floating pill.** Add bottom padding equal to the pill height plus the safe area, so captions and ⋯ buttons are never under it and taps cannot fall through to the search button. Evidence: `A-p-T4-10-collections`, `A-p-T4-11-folder`.
4. **Name what Download produces, and shorten the menu.**
   - The primary button says "Download GIF" (or "Download PNG" for stills).
   - The menu becomes GIF · PNG · Sprite sheet (ZIP) · All frames (ZIP) · More options…, each with B's one-line description.
   - The PixelLab originals move into More options.
   - Evidence: `A-p-T3-01-menu`, `B-p-T3-05-inline`.
5. **Show the export timing.** Label animated outputs with the speed they will use, for example "GIF · Walk · East · 4 fps (your speed)", with a Reset link. Evidence: `A-p-T3-06-advanced`.
6. **Use one verb, "Download".** Rename "Export 5 assets", the folder header's "Export" and "Export report"; rename the preset "Game-ready" to "Sprite sheets"; make the scope "This animation / Everything". Evidence: `A-p-T5-02-dialog`, `A-p-T4-13-folder`, `A-d-T9-05-report`.
7. **Re-lay the phone portrait viewer.**
   - Row 1: transport with fps (B).
   - Row 2: animation and direction.
   - Zoom and backdrop move into ⋯, so nothing hides in a sideways scroll.
   - Evidence: `A-p-T2-06-ctxscroll`, `B-p-T2-06-stepped`.
8. **Simplify Connect.**
   - Say "API key".
   - Show the 3 steps inline, with a primary "Get my API key from PixelLab ↗".
   - Don't autofocus on coarse pointers.
   - Ask "Stay connected on this device?" after the first sync, not before.
   - Evidence: `A-p-T1-01-connect`.
9. **End first sync on the status line, not a stale toast.** Replace the persistent "Connected. Loading your library…" toast with the sync status line ending in "Synced". Evidence: `A-p-T1-05-library`.
10. **Keep captions on selected cards**, and use one selection style that cannot be confused with focus. Evidence: `A-p-T4-02-selected3`, `A-tp-T5-select`.
11. **Make the hand-off safe and obvious.**
    - Use a labelled "Open in PixelLab ↗" button (C).
    - Add a one-line "Uses PixelLab credits" note under every generation hand-off (Animate, New state), not only on tilesets.
    - Evidence: `C-p-T2-02-stage`, `A-p-T7-01-handoff`.
12. **Rename the cryptic labels:** the "Animate" toggle becomes "Play previews", and "2 in PixelLab" becomes "2 still generating". Evidence: `A-p-T1-05-library`.
13. **Fix the chips.**
    - Drop "Other"; its sentence goes into the end-of-list line.
    - Fix the "1 tileset · 1 tile set" wording (or merge Tiles and Tilesets, the owner's call).
    - On phone, open a single "Type" sheet instead of a 9-chip scroller.
    - Evidence: `A-p-T5-02-dialog`, `C-p-T1-04-library`.
14. **Fit the phone-landscape viewer.** All capsules fit within 844 px (zoom −/+ are clipped today), and Download is added to the ⋯ menu. Evidence: `A-pl-T2-viewer`, `A-pl-T3-moremenu`.
15. **Polish folders and states.**
    - One ⋯ in the folder header, and no library sync line inside a folder.
    - 2×2 mosaic covers (B).
    - Offline status reads "Offline · saved library".
    - The reconnect dialog links to "Get a new API key ↗".
    - Evidence: `A-p-T4-13-folder`, `B-p-T4-09-boards`, `A-d-T9-03-offline`, `A-d-T9-02-reconnect`.

---

## 8. Open questions

1. **Default theme.** Should the default follow the system, using B's warm light and A's charcoal dark? Or should the product pick one look for its identity?
2. **Desktop preview pane.** C showed the fastest QA loop. Is "click opens the viewer, then ←/→ inside it" enough, or should a C-style preview pane come back later as an opt-in layout? The recommendation is to defer it.
3. **Filmstrip.** It made frame stepping tangible in C, but 01 defers it. Confirm it stays out of v1.
4. **Shelves.** Drop them entirely, or keep a single "Recent" row above the All grid?
5. **Phase 0 and previews.** Do the Phase 0 read-cost results allow "Play previews" to default on? Every phone grid is static today.
6. **Export timing.** Should GIF and sprite-sheet timing follow the user's fps override (as 01 §9 "effective timing" implies), or always use 8 fps?
7. **Naming.** "Collections" or "Folders"? And should Tiles and Tilesets merge into one chip? Both are owner calls left open by R2.
8. **Real-device checks.** iOS Safari's keyboard over A's bottom search bar, safe-area insets under the floating pill, and Android back-gesture behaviour in the viewer sheet need real-device testing. Headless emulation cannot show them.
