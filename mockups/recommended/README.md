# Recommended mockup: "Quiet Studio, lifted"

The interactive mockup of the recommended Vitrine design (provisional name; an unofficial, view-only gallery for PixelLab assets). It is built on Option A's shell and applies the final rulings F-1 to F-15 and the editor calls E-1 to E-19 in `docs/design/00-decision-log.md`, with the layout and component values in `docs/design/07-recommended-design.md`. Behaviour and copy follow `docs/design/02-ux-spec.md`. `docs/design/03-mockup-requirements.md` is the acceptance checklist.

## Open it

Open `index.html` straight from disk (`file://`) in any evergreen browser. There is no build step, server or network request. It loads `../shared/sample-data.js` and `../shared/pixel-utils.js` as classic scripts.

The first run shows **Connect**. Pasting into the key field tests it at once; **Test key** is the fallback. Any value connects, and the literal value `bad` shows the invalid-key error. **Use sample library** skips the form. Nothing typed is kept, logged or shown.

## What it demonstrates

| Area | What to try |
|---|---|
| Shell (F-1) | Sidebar at ≥ 1200 px (collapsible), rail on tablets and phone landscape, floating Library · Folders pill + round Search on phone portrait. Content keeps bottom padding equal to the pill (or selection bar) plus the safe area, so nothing hides under it. |
| Grid (F-2, F-13) | Captioned uniform grid, S / M / L / XL. M below 840 px wide **or** 480 px tall, L otherwise. Click, tap, Enter or Space opens the viewer at every size. Card states: focused (outset ring + halo around well and caption) and selected (inset accent ring + check + tinted caption). |
| Theme (F-3) | R3b's token block, verbatim. Follows the system; Settings › Display overrides it. Light-gray wells in light mode; one shared 0.25 art surface in dark. |
| Viewer (F-4) | Modal viewer. Info panel docks right at ≥ 840 px in landscape, otherwise a bottom sheet (peek → half → full; opens at half on screens ≥ 1200 px tall). Phone landscape is immersive with fading capsules. Dock rows are capped at 960 px. Filmstrip replaces the scrubber; inline compass on tablets and desktop; `− 8 fps +` with a Reset button; zoom `− [Fit · 5×] +` (the readout toggles Fit ↔ 1:1, also `Z`); one labelled Backdrop button (a swatch of the current backdrop + "Backdrop"; its name is "Backdrop: Mid gray") that opens five swatches (Theme, Checker, Light gray, Mid gray, Black). Phone portrait (E-3): Play · filmstrip · "8 fps" button (−, +, Reset, Loop); Animation · Direction · Backdrop; step and zoom in ⋯. |
| Downloads (F-5, E-7, E-13) | Download tiles in the Info panel; a split button named for its output ("Download GIF"); menus of ≤ 4 items; the GIF says it uses the current speed; "Download options…" holds the extra formats (frame PNG, PixelLab sprite sheet), scope and Advanced. Multi-asset dialog: three described single-choice presets + collapsed Advanced (scale, GIF matte, file name). Faked progress chip, toasts and a non-blocking partial-failure toast with "View report". |
| Selection (F-6, E-1) | Select button, long-press (touch), checkbox / Ctrl / Shift click, `x`, Ctrl+A, Esc. Bottom selection bar on every size; at ≥ 1200 px the summary panel (mosaic, breakdown, actions) replaces the bar once 2 or more are selected. Select reads "Done" while selecting. |
| Naming, chips (F-7, F-8) | Library and Folders (Favorites pinned first). "Play previews". "PixelLab API key". Eight chips; "Images" carries the "Creator gallery" tooltip and subtitle. The "Other PixelLab content isn't in the public API yet" note ends the All results and sits in Settings › About. |
| Previews (F-9, E-14) | On by default; only in-view cards play; at most 8 at once, hover/focus play included; off under reduced motion or Save-Data unless the user turns it on. The toggle is the pause control. On phones it lives in the View sheet (E-8). |
| Connect (F-10, E-10, E-11) | One screen with the three "Get your API key" steps and a link to `https://www.pixellab.ai/account` (B-8); auto-test on paste; first sync streams in; then a one-time "Keep me signed in on this device?" banner. Settings › Account: status (no key characters shown), Test key, Keep me signed in, Forget key, rotate-key link. |
| Hand-offs (F-11) | "Open in PixelLab ↗" split button; its ▾ ("More in PixelLab") lists tools marked "May use PixelLab credits". New tab, `noopener noreferrer`. |
| Folders (F-12, E-18) | 2×2 cover mosaics at every size; create, rename, delete (confirm says assets stay); Add to folder is a popover on desktop and a bottom sheet on phones, with an inline "New folder" field that creates and files in one step. |
| Must-fixes (F-13) | Phone search docks above the pill with a visible Cancel; 44 px targets on touch (chips, sync status, filmstrip, compass, swatches…); safe-area insets; forced colors keep the swatches; refit on resize and DPR change; path-first hash routes (`#/characters/a/<key>?dir=east`); at 200% text the search stays and Info labels stack. |
| Delight (F-14) | First-sync reveal (static under reduced motion); animation and direction carried across prev/next; empty states show a small idle sprite; quiet "Synced just now". |
| Keys (F-15) | 02's keymap (`/ ? x L D + - Z , . [ ] I F`, arrows, Home/End, Space, Esc, Shift+F10, Ctrl+A); "Single-key shortcuts" switch; `?` help overlay with Keys and Gestures tabs. |

## Demo shortcuts (query string)

| Query | Opens |
|---|---|
| `?demo=connect` · `?demo=welcome` | Connect (first run) · the welcome-back variant. Add `&error=1` for the invalid-key error or `&checking=1` for the "Checking your key…" state. |
| `?demo=sync` · `?demo=library` · `?demo=keep` | First sync (streamed reveal) · Library, synced · Library with the keep-signed-in banner |
| `?demo=viewer&asset=android-courier` | Viewer. Extras: `dir=east`, `anim=0`, `vstate=1`, `fps=6`, `bd=checker\|light\|mid\|black`, `zoom=2`, `grid=1`, `sheet=half\|full`, `info=0`, `paused=1` |
| `?demo=download&asset=android-courier` · `?demo=download-multi` | "Download options" dialog (single) · multi-asset Download dialog over 5 mixed selected assets |
| `?demo=select` | 5 mixed assets selected (character, object, image, tileset, Tiles Pro): summary panel at ≥ 1200 px, bottom bar below |
| `?demo=folders` · `?demo=favorites` · `?demo=folder&folder=hero-party` · `?demo=emptyfolder` | Folders · Favorites · a folder (`ui-pack` shows the unavailable-items line) · a new empty "Boss fight" folder |
| `?demo=addfolder&asset=torch` · `?demo=menu&asset=torch` | Add-to-folder picker · card context menu |
| `?demo=settings` · `?demo=mockstates` · `?demo=help` · `?demo=reconnect` | Settings · its Mockup states section · help overlay · 401 reconnect dialog |
| `?demo=report` · `?demo=partial-toast` · `?demo=ready` · `?demo=toast` · `?demo=tip` | Download report · partial-failure toast · touch "Your file is ready" sheet · Undo toast · backup tip on Folders |
| `&flags=offline,offlineEmpty,cors,partial,rate,empty,emptyFav,noFolders,gate,exportFail` | State flags (also switches under Settings › Mockup states) |
| `&type=characters` · `&search=mage` · `&size=S\|M\|L\|XL` · `&theme=light\|dark` · `&previews=0\|1` | Chip · search text · grid size · theme · Play previews |
| `&selftest=1` | Checks the 03 §2 counts, grouping, keys, routes and menu size; writes `data-selftest="pass"` on `<html>` |

Asset slugs are lowercase names (`orb-mage`, `hooded-orb-mage`, `bear-trap-open`, `goblin-brute-idle`, `dirt-grass`, `wooden-stairs-kit`, `meadow-ruins`, `stone-steps`, `fantasy-mmo-hud`, `grass-block`, `torch`, `slime-menagerie`…). They exist only for these shortcuts; app URLs carry 12-character opaque keys.

## Real vs faked

**Real:** integer device-pixel scaling through `integerScale()` on every thumbnail, mosaic, filmstrip frame and the stage (smooth overview below 1×), refitted on container resize, window resize and DPR change · canvas playback on `PixelTicker` at 8 fps with per-animation fps overrides, loop/once, step, seek, direction, animation and state switching · zoom and pan · selection (all entry methods), favorites and folders in memory · search (AND terms, `#tag`), chips and sorts ("Recently updated" on Characters only) · hash routes with Back closing the viewer and focus returning to the card · responsive shells, safe-area insets, reduced motion, forced colors, keyboard map.

**Faked:** the key test (700 ms delay), sync timing (a timer-fed queue), downloads (progress chip, toast, report; no file is written), clipboard (a toast), balance and storage figures, tile corner and rule bits (derived from the tile index). Hand-off links open PixelLab's library routes without ids because the sample ids are fake.

## Where each piece came from

| Piece | From |
|---|---|
| Shell, captioned grid, modal viewer, phone sheet, immersive landscape viewer, ready sheet, Add-to-folder popover, wordmark | Option A |
| Download tiles with one-line descriptions, museum-label Info hierarchy (in the system sans), inline compass, fps in the transport row, 2×2 folder mosaics | Option B |
| Filmstrip, selection-summary panel, labelled "Open in PixelLab ↗", non-blocking partial-failure toast, short-landscape density (M on compact height), immersive stage | Option C |
| Tokens and component values | R3b "Quiet Studio, lifted" and 07 |

## Deviations from 07 (kept on purpose)

- **Grid size is a segmented S · M · L · XL control**, not 07's 120 px range slider. Its stops are labelled, it is one tab stop with arrow keys, and every stop is a real 44 px target on touch.
- **Checked segments use `--surface-float` with a hairline shadow** instead of `--surface-3`. In light mode `--surface-3` on the `--surface-2` track is nearly invisible.
- **Chips are 44 px tall on touch** (F-8 literally), rather than 36 px visual inside a 44 px hit area.
- **Settings never shows key characters.** The decision log mentions "last 4"; the build rules for this mockup forbid displaying anything token-like, so the status reads "PixelLab API key: hidden".
- **The empty-state sprite is a 128 px box** using the sample "Goblin Brute Idle" loop, so its 128 px canvas stays integer-scaled. None of the sample characters has an idle animation, and a 48 or 64 px box would smooth it.
- **Phone headers:** the result line and View button scroll with the grid (E-8); the app bar holds h1 · Select · ⋯ · Settings.

## Not built (YAGNI for a 71-item mockup)

Grid windowing · pinch zoom (buttons, wheel, double-tap and `Z` exist) · sheet spring physics (detents snap) · prompt "Show more" (no sample prompt passes 6 lines) · the folder filter above 8 folders · thumbnail trimming (impossible from `file://`: canvas readback is tainted, so characters and objects are bottom-aligned untrimmed) · the search field collapsing to an icon at 200% text (the grid header gives it a 16em minimum instead, so it stays usable).

## Known issues

- `chr_0002` (Hooded Orb Mage, base) is a 232 × 232 image although its metadata says 128 × 128; the mockup shows the real size. `shared/README.md` says 10 fps; the mockup uses 8 fps (R-1).
- Fractional DPRs (1.25, 2.625) can show a one-row seam where art × k / DPR is not a whole CSS pixel; this is CSS-pixel snapping in the engine (07 §8 question 4) and needs a real-device check.
- Headless emulation cannot show the iOS keyboard over the phone search bar, real safe areas or Android Back in sheets (07 §8 question 9).
- Download size and file estimates are rough heuristics.
