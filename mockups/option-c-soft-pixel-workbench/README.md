# Option C — "Soft Pixel Workbench" mockup

Interactive mockup of Vitrine option C (docs/design/04-design-options.md §3): a three-pane contact sheet where the current asset always drives a live stage pane. Unofficial; not affiliated with PixelLab.

## Open it

Open `index.html` straight from disk (file://). No server, network, CDN, or web font. It loads `../shared/sample-data.js` and `../shared/pixel-utils.js`.

The first run shows **Connect**. Any non-empty token "connects" (the word `bad` shows the invalid-token error), or choose **Use sample library**. Both run a fake streaming sync. After that the tab remembers the session (a non-secret `sessionStorage` flag), so reloads go straight to the library.

## Demo shortcuts (query string)

| Query | Opens |
|---|---|
| `?demo=library` | Library, skips Connect and sync |
| `?demo=stage&asset=android-courier` | That asset on the stage (phone: the pushed stage screen). `asset` is a name slug, e.g. `hooded-orb-mage`, `bear-trap-open`, `meadow-ruins`, `dirt-grass`, `stone-steps`, `fantasy-mmo-hud` |
| `?demo=select` / `?demo=export` | 12 objects selected (summary pane) / plus the multi export dialog |
| `?demo=export1` | Single export dialog (Android Courier, Walk GIF) |
| `?demo=collections` · `favorites` · `folder` (`&id=fld_02`) | Collections, Favorites, a folder |
| `?demo=settings` (`&tab=library`) · `states` · `help` · `reconnect` · `dlmenu` · `search` | Settings, the "Mockup states" tab, shortcuts, 401 dialog, download menu, focused search |
| `?demo=sync` | Slow first sync (skeletons + streaming) |
| `?demo=connect` · `welcome` · `invalid` | Connect variants |
| `&state=offline,partial,ratelimit,empty,gated,cors,offline-empty,export-fail` | Combine any fake states |
| `&theme=light\|dark`, `&size=S\|M\|L\|XL`, `&q=mage`, `&pointer=coarse` | Theme, grid size, prefilled search, force touch sizing |

Hash routes work as in 02: `#/?type=characters`, `#/collections`, `#/favorites`, `#/folder/<id>`, and the stage route `…/a/<12-char key>?dir=&anim=&state=`. The mockup never puts a sample id in the URL or title.

The same states are also in **Settings › Mockup states** and in the toolbar's **⋯ › Mockup states…**.

## Real vs faked

**Real:**
- Integer device-pixel scaling through `integerScale()` on every card, filmstrip frame, mosaic cell, cover, and the stage canvas. It re-fits on resize and on DPR change, and k < 1 gets a smooth "FIT" overview.
- Canvas playback on the shared `PixelTicker` at 8 fps: compass (diagonals disabled when missing), animation and state switching, play/pause, step, scrub with frame ticks, an fps stepper (1–30) with reset, loop/once, and a filmstrip.
- Six backdrops; Fit / 1:1 / − / + zoom, wheel zoom around the pointer, double-click, drag and Shift+arrow pan; tileset grid overlay with tile info.
- Selection by click, Ctrl/Shift-click, hover checkbox, `x`, Ctrl+A, the Select button, and long-press on touch. The phone selection bar and the desktop selection-summary pane.
- Favorites and folders in memory: create, rename, delete with Undo, tri-state add/remove, unavailable-items line. Type list and chips, search (including `#tag`), and sorts.
- All 7 responsive shells, keyboard-first navigation, phone Back/Esc from the stage, reduced motion, and the light/dark/system theme.

**Faked:** token test, balance, sync timing, storage numbers, clipboard (a toast confirms), exports (progress, then a toast, a report dialog, or the ready sheet on touch), backup import/export, and the hand-off links. The links point at PixelLab library pages without ids. The mockup never logs or shows token text.

## Deviations from the docs (and why)

- **Single file:** 04 §0.3 asks for one self-contained file per option. The orchestrator brief asked for index.html + styles.css + app.js, and the brief wins.
- **Backdrops:** 6, per the orchestrator ruling (no "Dark").
- **Pixel face:** none is downloaded (ruling). `--font-pixel` falls back to `ui-monospace`. The wordmark and mark are inline SVG rects from 04 §6.3.
- **Option-level layout** (approved V2, V5, V7, V8, V9): always-on stage pane, filmstrip, pixel numerals, no card captions. Column counts follow 04 §3.2 (4 / 8 / 7 / 6 / 7 / 10 / 15 at M), not 02 §4.2.
- **Phone stage:** follows 04 C4: a pushed screen whose inspector scrolls below the controls, instead of 02's peek/half/full sheet. Compact height uses the immersive stage with a right Info sheet (`i`).
- **Selection with exactly 1 item** on desktop shows that item on the stage, plus "1 selected · Done" in the toolbar. The summary pane appears at 2 or more (04 §3.1).
- **Esc inside the desktop stage pane** returns focus to the current card. The stage never closes (V5), so this stands in for 02's "focus returns to the card on close".
- **Space on a focused card** (desktop, outside selection mode) plays or pauses the always-visible stage. This is an addition for C's keyboard loop.
- **Animation picker and state switcher** are segmented radiogroups, not dropdowns: there are few options in the sample.
- **Maps sort as undated** (02 §11.3), even though the sample map has a `createdAt`.

## Known issues / limits

- No grid virtualization or IntersectionObserver for the Animate cap: 71 cards and 4 animated ones never reach the limits. Same for the filmstrip (longest strip: 9 frames). Marked `ponytail:` in app.js.
- Character/object thumbnails are bottom-aligned but untrimmed: trimming needs canvas readback, which file:// taints (04 §0.3).
- Tiles Pro cards show the whole sheet, not the first 2×2 variations. Tile-info corner and rule data is derived from the tile index.
- No touch pinch-zoom on the stage. Use wheel, double-tap, or the buttons.
- Coarse-pointer layouts were checked with `&pointer=coarse` only, not on real touch devices.
- Shared data quirks, worked around: `chr_0002` lists `width/height` 232 while `meta.size` is 128 (the inspector shows `meta.size`; the art renders at its real 232 px). Its `updatedAt` is earlier than `createdAt`.
- Search follows 02 §11 literally: the type label is substring-searchable, so "mage" in All also matches every *image* ("image" contains "mage"). Inside Characters it gives 02's "2 results". This is a spec finding, not changed here.
- Headless screenshots can catch the 160 ms stage crossfade mid-way. It's a capture artifact, not a rendering bug.
