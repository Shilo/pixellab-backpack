# Option A — "Quiet Studio" mockup

Interactive mockup of Vitrine's design option A. Layout and tokens come from `docs/design/04-design-options.md` §0–§1, and behaviour and copy come from `02-ux-spec.md`. `03-mockup-requirements.md` is the acceptance checklist.

## Open it

Open `index.html` straight from disk (`file://`) in any evergreen browser. It has no build step, no server and no network requests. It loads `../shared/sample-data.js` and `../shared/pixel-utils.js` with classic scripts.

The first run shows **Connect**. Any non-empty value connects, and the literal value `bad` shows the invalid-token error. **Use sample library** skips the form. Nothing you type is stored, logged or shown.

## Demo shortcuts (query string)

| Query | Opens |
|---|---|
| `?demo=connect` · `?demo=welcome` | Connect (first run) · the welcome-back variant (`&error=1` shows the 401 inline error) |
| `?demo=sync` | First sync: skeletons, then cards streaming in, then "Synced" |
| `?demo=library` | Library, already synced |
| `?demo=inspector&asset=orb-mage` | Library with a current asset in the grid-side inspector (≥ 1200 px, fine pointer) |
| `?demo=viewer&asset=android-courier` | Viewer. Extras: `anim=0`, `dir=west`, `vstate=1`, `bd=checker`, `zoom=1`, `grid=1`, `sheet=half\|full`, `info=0`, `paused=1` |
| `?demo=select` · `?demo=export` | Selection mode with 12 objects · plus the multi export dialog |
| `?demo=export-single` · `?demo=export-folder` | Single export (GIF of Android Courier Walk) · the folder export ("Hero party") |
| `?demo=report` · `?demo=ready` | Partial-failure report · export ready sheet (touch) |
| `?demo=collections` · `?demo=favorites` · `?demo=folder&folder=ui-pack` | Collections · Favorites · a folder with an unavailable item |
| `?demo=settings` · `?demo=mockstates` · `?demo=help` · `?demo=reconnect` | Settings · the Mockup states section · the help overlay · the 401 reconnect dialog |
| `?demo=menu&asset=torch` · `?demo=addfolder&asset=torch` · `?demo=toast` | Card menu · Add to folder popover · an Undo toast |
| `&search=mage` · `&type=characters` · `&size=S\|M\|L\|XL` · `&theme=light\|dark` · `&animate=1` | Search text · type chip · grid size · theme · Animate previews |
| `&flags=offline,offlineEmpty,cors,partial,rate,empty,emptyFav,gate,exportFail` | State gallery flags (also available as toggles under Settings › Mockup states) |
| `&selftest=1` | Checks the 03 §2 counts, grouping and keys, and writes `data-selftest="pass"` on `<html>` |

Asset slugs are lowercase names, for example `bear-trap-open`, `hooded-orb-mage`, `meadow-ruins`, `dirt-grass`, `wooden-stairs-kit` or `fantasy-mmo-hud`. They exist only for these shortcuts. App URLs carry 12-character opaque keys, never sample ids.

## Real vs faked

**Real**
- Integer device-pixel scaling through `integerScale()`, refitted on resize and on DPR change. Art over the box gets a smooth "fit". Art is never sized with `transform`, `object-fit` or a background image.
- Canvas playback on `PixelTicker` at 8 fps:
  - picker, compass with disabled directions, `[` / `]`, and the state switcher
  - play, pause, step, scrub, an fps stepper (1–30) with reset, and loop or once
- Six backdrops, and zoom with Fit, 1:1, − and + (also wheel, double-click and `Z`). Pan works by drag or Shift+arrows.
- The grid overlay and tile info for tilesets. Tiles Pro variations show in √n columns.
- V1: at ≥ 1200 px with a fine pointer, a click makes a card current in the inspector, and a double-click, Enter or Space opens it. Arrow keys move the current card.
- Selection:
  - entry by the Select button, `x`, Ctrl/Cmd-click, Shift-click range, Ctrl+A, and long-press on touch
  - "N hidden by filter"
  - the top contextual bar, or a floating bar below 1200 px
  - the inspector summary mosaic
- In memory:
  - favorites
  - folders: create, rename (duplicate check), delete with confirm, add/remove with tri-state checkboxes, Undo toasts, unavailable-items line, covers
- Chips, search (AND terms and `#tag`), and sort ("Recently updated" on Characters only). Grid sizes S/M/L/XL follow the 04 §0.5 formula. Scroll-collapsing headers on phone and compact heights.
- Hash routes, so Back or Esc closes the viewer and focus returns to the card. Swipe left/right moves between assets and swipe down closes (pointer events).
- The phone search pill morph and the inspector sheet with its peek, half and full detents. Phone landscape is immersive, and its capsules fade after 3 s while playing.
- Light, dark and system themes. Reduced motion opens the viewer paused and turns crossfades into cuts. Coarse pointers get 44 px targets. Keyboard support covers the 02 §9.3 keymap, the single-key-shortcuts switch and the help overlay.

**Faked (clearly)**
- The token test, sync timing (a timer-fed queue), downloads and exports (fake progress chip, then a toast or report), clipboard writes (a toast) and balance or storage figures.
- Tile-info corner and rule bits, which are derived from the tile index.
- Hand-off links open the PixelLab route without an id, because the sample ids are fake.

## Deviations from the docs (and why)

- **Three files** (`index.html`, `styles.css`, `app.js`) instead of 04 §0.3's single file. Orchestrator ruling.
- **Six backdrops**, per the orchestrator ruling (02 §3.5). 04 lists seven. In A, "Stage" is Light gray in light mode and Dark in dark mode.
- **The viewer draws every type on one `<canvas>`**. 04 §0.3 puts static art in an `<img>`. One render path keeps zoom, tiles and Tiles Pro gaps identical, and it is still integer-scaled.
- **Search matches type words by word prefix.** Under a plain substring rule, "mage" matched every *image*. Everything else is substring matching, as in 02 §11.2.
- **The folder header gets its own row** above the sticky library header (same order as 02 S5). In the top bar it squeezed the search field to nothing at 1440 px.
- **The inspector pane is hidden on Collections**, because that page has no asset grid.
- **Settings shows "token ending ••••" with no characters.** Orchestrator rule: never display anything token-like.
- **Settings is a dialog with no `#/settings` route, and selection mode is not a history entry.** Esc and × exit selection. Back closes the viewer.
- **The phone viewer's context row scrolls sideways**, so that Fit, 1:1, −, + and speed all stay reachable at 360 px.

## Not built (YAGNI for a 71-item mockup)

Grid windowing (fixed row heights are kept) · sync scroll anchoring · pinch zoom (buttons, wheel and double-tap exist) · sheet spring motion (sheets snap so the art refits once) · prompt "Show more" (no sample prompt passes 6 lines, and the clamp is in CSS) · the folder-picker filter for more than 8 folders · scrubber ticks · V6 dwell fetch (no network) · trimming (impossible from `file://`, so characters and objects are bottom-aligned untrimmed).

## Shared-data notes

- `chr_0002` (Hooded Orb Mage, base) is a 232 × 232 PNG, but its `meta.size` says 128 × 128. The mockup uses the real image size.
- `shared/README.md` says to play at 10 fps. The mockup uses 8 fps per R-1.
- `map_0001` has a `createdAt`, but 02 §5.8 says maps are undated. The mockup sorts it as undated and hides its date.

## Known issues

- Headless Edge on Windows enforces a minimum window of about 500 px and subtracts window chrome, so `--window-size` screenshots aren't exact. The review screenshots used DevTools-protocol device metrics instead. The helper scripts live outside the repo.
- Export estimates (files and MB) are rough heuristics.
- The touch-only paths (the ready sheet after an export, and long-press) need a coarse pointer or DevTools touch emulation.
