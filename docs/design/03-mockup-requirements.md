# 03 — Mockup Requirements (recommended mockup)

This checklist accepts the recommended mockup at `mockups/recommended/`: the "Quiet Studio, lifted" hybrid specified in `07-recommended-design.md`, behaving as `02-ux-spec.md` describes, using `mockups/shared/sample-data.js` + `pixel-utils.js`. The mockup illustrates 07 and 02 and ranks below them (precedence at the top of `00-decision-log.md`; B-5): a detail that exists only in the mockup goes back into 07 or 02 before it is built. The three explored mockups (`mockups/option-a-quiet-studio/`, `option-b-gallery-wall/`, `option-c-soft-pixel-workbench/`) are frozen as the record behind 04 and the R3 reviews; they are not re-checked. Section refs (§) point to 02 unless noted.

## 1. Viewports (all must work; no horizontal page scroll)

| Viewport @ DPR | Class | Shell | Default size · columns |
|---|---|---|---|
| 360×780 @3 | Phone portrait | Floating pill + round Search | M · 3 |
| 412×915 @2.625 | Phone portrait | Floating pill + round Search | M · 3 |
| 780×360 @3 | Phone landscape (compact height) | Left rail 72 (R-2) | M · 6 |
| 768×1024 @2 | Tablet portrait | Rail 80 | M · 5 |
| 1180×820 @2 | Tablet landscape | Rail 80 | L · 6 |
| 1440×900 @2 | Laptop | Sidebar 240 | L · 7 |
| 1920×1080 @1 | Desktop | Sidebar 240 | L · 10 |
| 2560×1080 @1 | Ultrawide | Sidebar 240 | L · 14 |
| 3440×1440 @1 | Ultrawide | Sidebar 240 | L · 16 (cap) |
| 1080×1920 @1 | Portrait monitor | Rail 80 | L · 6 |

Viewer Info placement, selection container and stage sizes per viewport: 07 §2.2–2.3. Also check 320 px width (reflow), 844×390 (compact height must default to M), and 200% text.

## 2. Data rules

- [ ] Drop `vfx` and `font` items (R-5). Their ids in favorites and folders demonstrate the "unavailable items" line (Favorites, "UI pack", "Favorites to export").
- [ ] Grid shows completed only: `obj_0006` (review) and `obj_0023` (processing) feed the "2 generating ↗" chip and popover (§8).
- [ ] `chr_0002` + `chr_0003` = one card "Hooded Orb Mage", badge "2 states" (base `chr_0002`). Bear Trap and Treasure Chest stay **two cards each** with the state in the caption (R-7).
- [ ] `map_object` items appear under **Objects**.
- [ ] Expected counts: All 71 · Characters 3 · Objects 24 · Images 23 · Tilesets 9 · Tiles 5 · Maps 1 · UI 6.
- [ ] Playback default **8 fps / 125 ms** (R-1), overriding the sample README's 10 fps.
- [ ] URLs use a 12-char opaque key (a precomputed hash is fine), never the sample `id`; path first, query last (`#/a/<key>?type=characters&dir=south`; F-13).
- [ ] Image titles may use the sample `name` (the real app uses the description's first line).

## 3. Screens, states, interactions to demonstrate

| Area | Must show (sample assets) |
|---|---|
| Connect | API key field + Show; the three "Get your API key" steps visible (no disclosure) with the account link; the key tests itself on paste, **Test key** as the fallback; "Testing…"; invalid-key error; full-access note; disclaimer; welcome-back variant; no autofocus on coarse pointers (F-10) |
| First sync | Skeleton → cards fade in as pages stream (static under reduced motion) → status "Synced just now" (no "Connected" toast); sync popover with per-type progress; grid stays usable mid-sync; then the non-blocking "Keep me signed in on this device?" banner (F-10, F-14) |
| Library | 8 chips (no "Other"); "Images" tooltip "Creator gallery"; phone chip row scrolls sideways at 44 px on touch; result line; sort menu ("Recently updated" only on Characters); grid sizes S/M/L/XL with 07 §2.2 column counts; end-of-list line + the not-in-the-public-API note at the end of All (F-8) |
| Phone header | App bar (title · Select · ⋯ · Settings) + chip row; result line + View button (Sort, Grid size, Play previews) scroll with the grid; content never sits under the pill (bottom padding = pill + safe area) (E-8, F-13) |
| Search | "mage" (live results), `#dungeon` tag search, "dragon" no-results state with Clear / Search all types. Phone: the search bar opens above the pill, the pill stays reachable, **Cancel** is visible, and a non-empty query keeps the bar visible (F-13) |
| Cards | §4.5 anatomy at M and L: badges ("4 dir · 1 anim", "8 frames", "16 tiles", "48×32"), favorite heart, "fit" marker on Meadow Ruins and Fantasy MMO HUD, hover checkbox + heart + ⋯ (fine pointer), map thumbnail placeholder (title, then image). Focused (outset ring) and selected (inset ring + check + caption tint, caption kept) look different (F-2, F-13) |
| Previews | Play previews **on** by default: Android Courier, Bear Trap (open), Goblin Brute Idle, Fox Scout Walk play in view, never more than 8 at once; off when the toggle is off and at first load under reduced motion or Save-Data; desktop hover/focus play after 300 ms (F-9) |
| Viewer | Click/tap/Enter/Space opens it at every size (F-2). Android Courier: Walk; inline compass with diagonals disabled; play/pause; step; **filmstrip** seek (no range scrubber); fps stepper "− 8 fps +" + Reset; loop. Orb Mage: Rotations only, 8-way compass, transport and filmstrip hidden. Hooded Orb Mage: state switcher. Bear Trap (open): 1-dir, compass hidden, 9-frame Snap shut. Goblin Brute Idle: frame playback. Dirt → Grass: Grid overlay (off by default) + tile info. Wooden Stairs Kit: variations. Meadow Ruins: Fit (smooth) → integer zoom + pan. Stone Steps: tall 16×48. Fantasy MMO HUD: wide UI. Prev/next keeps Walk + east when the next asset has them (F-14) |
| Viewer chrome | One Backdrop button with 5 swatches (Theme, Checker, Light gray N8, Mid gray N5, Black); zoom `− [Fit · N×] +`, the readout toggling Fit ↔ 1:1; control rows ≤ 960 px centred at 2560 and 3440; prev/next (buttons, arrows, swipe); close (×, Esc, Back, swipe down); phone-landscape immersive with fading capsules inside the safe areas; phone bottom sheet peek → half → full; phone portrait dock = Play · filmstrip · "8 fps" (stepper popover) / Animation · Direction (compass popover) · Backdrop, with step and zoom in the top bar's ⋯ (F-4, E-3) |
| Info panel | Header: kicker, title, facts line, labelled **Open in PixelLab ↗** + **More in PixelLab ▾** (Animate and New state with "May use PixelLab credits"); actions row (Download GIF ▾, Favorite, Add to folder); Download tiles + "Download options…"; §5 fields for the character, object, image, tileset, Tiles Pro, map, and UI examples above; Copy prompt; tag chip → `#tag`; "In folders" chips; Technical details collapsed with masked ID + Copy asset ID warning; labels stack above values at 200% text (F-5, F-11, F-13) |
| Organize | Heart toggle (card, viewer, `L`); Folders page (Favorites pinned first, folders A–Z, 2×2 mosaic covers, counts); create, rename, delete folder (confirm says assets stay); Add to folder as a popover (desktop) or half sheet (phone), never full screen, from card menu, viewer, and selection (tri-state; New folder creates and checks in one step); remove from folder + Undo toast; unavailable-items line (F-12) |
| Selection | Select button, long-press (touch), checkbox click, Ctrl/Shift-click, `x`, Ctrl+A, Esc; bottom selection bar (phone, tablet, and desktop with 1 selected) with count, Download, Add to folder, Favorite, Remove (folder view); at ≥ 1200 px with ≥ 2 selected the summary panel (mosaic, count, breakdown, actions; no size estimate, B-6) slides in; "N hidden by filter" note (F-6, E-1) |
| Downloads | The word is always "Download". Character menu with exactly 4 items (GIF · Walk · East · 8 fps, Sprite sheet (ZIP), All frames (ZIP), PixelLab original (ZIP)), each described; the GIF states the current speed (set 4 fps and see "4 fps"); Info tiles; Download options dialog (single: formats, scope, Advanced); multi-asset dialog for folder "Hero party": 3 described presets (Sprite sheets, All frames, GIFs), Advanced collapsed (scale, GIF matte, file name), asset counts with the "Large downloads may be saved in parts." notice (no MB estimate; B-6); progress chip with Cancel; compact ready sheet on touch; non-blocking partial-failure toast → report (fake 1 failure) (F-5) |
| Settings | All §3.12 sections; connection = status (••••last 4), Test, Keep me signed in toggle with the stop confirm, Forget key confirm with "Also delete my folders and favorites", rotate-key link (no Change token); About shows the not-in-API note; theme System/Light/Dark (both themes render with the 07 §5 tokens) |
| Help | `?` overlay with the §9.5 list (Keys tab on fine pointers, Gestures tab on coarse); shortcuts-off banner |
| State gallery (debug menu is fine) | Offline cached banner + "Offline · saved library" status, offline nothing saved, 401 reconnect dialog with "Get a new API key ↗", CORS blocked, partial sync chip, rate-limit text, empty library, empty folder and empty favorites with an idle sprite, backup tip, Images gate-failed card |

## 4. Real vs fake

| Must be real | May be faked |
|---|---|
| Integer device-pixel scaling via `integerScale()`, refitted on resize **and** DPR change; smooth "fit" for k < 1; no `transform` / `zoom` / `object-fit` / `background-image` on art | Sync timing and streaming (a timer-fed queue) |
| Animation playback on the shared `PixelTicker`: direction, animation, and state switching; play/pause/step; filmstrip seek; fps override + reset; loop/once | Key test (any non-empty value succeeds; the literal value "bad" shows the 401 error) |
| Selection (all entry methods, bar and summary panel), favorites, and folder create/rename/delete/add/remove, in memory | Downloads (fake progress → toast/report; no files needed) |
| Responsive shells at all 10 viewports + the compact-height rule | Balance, storage usage, error states (triggered from the state gallery) |
| Keyboard basics: Tab order, focus ring, `/`, Esc, arrows in grid, Enter/Space opens, ←/→ prev/next, Space play, `,` `.` `[` `]`, filmstrip arrows, `Z`, focus return on close | Hand-off links (may point to `#`, but must open as a new-tab link with ↗) |
| Viewer open/close, swipe and arrow navigation, Back closes the viewer (hash route) | Clipboard writes (a toast is enough) |
| Search filtering and sorting over the sample data; phone search bar with Cancel | Persistence (in-memory is fine; Play previews and theme may use `localStorage`) |
| `prefers-reduced-motion`: crossfade becomes a cut, no first-sync fade, viewer opens paused, Play previews starts off unless the user turns it on | Save-Data (a debug flag is fine) |

## 5. Acceptance checks (run on `mockups/recommended/` before review)

1. DevTools DPR emulation at 1, 1.25, 1.5, 2, 2.625, 3: every art element's `cssWidth × DPR / naturalWidth` is an integer, or the element is flagged smooth. Change DPR live, then resize the window: art refits.
2. Sweep all 10 viewports: no horizontal page scroll; column counts match 07 §2.2 (= 02 §4.2) at the default size; 844×390 defaults to M.
3. Keyboard only: open Android Courier, change direction, step a frame, seek in the filmstrip, favorite it, close it; focus lands back on its card.
4. Screen reader spot check: card names read "{title}, {type}, {badge}"; the viewer announces its title; the filmstrip reads "Frame 3 of 8".
5. Touch emulation: long-press enters selection without a browser callout; swipe navigates; pinch never zooms the grid; every touch target (chips, sync status, compass, filmstrip cells, swatches) is ≥ 44 px.
6. Phone: run a search, then reach Folders without Esc (Cancel or the pill); no caption or ⋯ sits under the pill or the search bar.
7. Forced colors: backdrop swatches keep their fills, rings and labels; focus and selection stay visible.
8. 200% text at 390×844 and 1440×900: search reachable, Info labels stacked above values, captions not clipped.
9. Address bar and title never show a sample `id` or a media path.
10. First-run walkthrough (01 §9): landing → Walk facing east as a GIF in ≤ 15 taps on a phone viewport.
