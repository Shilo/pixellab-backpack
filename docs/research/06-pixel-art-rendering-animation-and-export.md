# 06 — Pixel-Art Rendering, Animation Playback, and Export

Researched 2026-10-18 for "PixelLab Gallery" (working name; unofficial), a client-side Svelte 5 + Vite
single-page app. Scope: crisp display, thumbnails, backdrops, playback, per-type viewers, export
formats, libraries, and browser downloads. Sibling-repo paths are relative to the gallery project
root (`../pixellab-pip/...`). Browser-support numbers come from MDN browser-compat-data (BCD) and
caniuse raw data fetched on the research date; library versions come from the npm registry on the
same date. Statements marked **Inference** are reasoning from the cited facts, not something a
source states.

## Summary

- **Use exactly one rendering rule: `image-rendering: pixelated`, integer scale computed in device
  pixels, size set with `width`/`height`, never with transforms, `zoom`, `object-fit`, or
  `background-image`.** `pixelated` ships in every target engine (Chrome 41, Firefox 93, Safari/iOS
  10). Unprefixed `crisp-edges` only reached Chrome in 148, and both values are explicitly allowed to
  produce uneven or smoothed pixels at non-integer scales. Safari has open bugs where `pixelated` is
  ignored under CSS transforms, on tiled backgrounds, and on bordered background images.
- **Fractional DPR (1.25, 1.5, 2.625...) is handled by choosing an integer number of device pixels
  per art pixel `k`, then setting the CSS size to `art × k / devicePixelRatio`.** Recompute when DPR
  changes (browser zoom, moving to another monitor). Safari cannot report exact device-pixel boxes
  (`devicePixelContentBoxSize` is unsupported), so the formula is the portable approach.
- **Draw animation frames on canvas, driven by one shared `requestAnimationFrame` ticker that uses
  per-frame millisecond durations.** Use static `<img>` for non-animated thumbnails. Reject CSS
  `steps()` sprite animation: it needs `background-image`, which runs into the Safari bugs, and it
  cannot express per-frame timing cleanly.
- **PixelLab gives no frame timing for character and object animations.** The REST OpenAPI exposes
  timing only for lip-sync and talking GIFs (`duration_ms`, `frame_ms`) and for VFX (`fps`, `loop`,
  per-frame durations in the sheet JSON). The gallery therefore needs a default FPS (this note
  recommends 10 fps / 100 ms) plus a per-animation override that it stores itself.
- **Exports:** original PNG bytes untouched at 1×; nearest-neighbour upscales at 2/4/8×; sprite
  sheets laid out like PixelLab's own `/spritesheet` (uniform cells, rows = animation × direction,
  columns = frames); one Aseprite-style JSON hash for sheet metadata; GIF89a through `gifenc` with
  an exact palette, 1-bit transparency, disposal 2, centisecond delays rounded cumulatively and
  clamped to ≥2 cs; PNG frame folders that mirror PixelLab's ZIP layout; ZIP through `client-zip`
  in store mode. APNG is optional. Skip animated WebP.
- **Downloads:** feature-detect in this order: `showSaveFilePicker` streaming (Chromium desktop
  86+, Chrome Android 132+), then Blob plus `<a download>` (everywhere; iOS 13+), then
  `navigator.share({files})` as the mobile "Save to Photos/Files" path (Safari/iOS 14+, Chrome
  Android 76+; never Firefox). Bundle many files into one ZIP, because browsers gate multiple
  automatic downloads. Budget memory for iOS, where community reports put the canvas area cap at
  16,777,216 px and total canvas memory at 224–384 MB.

## Crisp rendering rules (with code snippets)

### R1 — Use `image-rendering: pixelated` only

- BCD versions:
  - `pixelated`: Chrome/Edge 41, Firefox 93, Safari 10, iOS Safari 10.
  - `crisp-edges`: Chrome 148 unprefixed (earlier `-webkit-optimize-contrast` from 13), Firefox 65
    (`-moz-crisp-edges` from 3.6), Safari 7 (alternative name `-webkit-optimize-contrast` from 6).
  - `smooth`: Firefox only.
  - Source: [BCD image-rendering](https://github.com/mdn/browser-compat-data/blob/main/css/properties/image-rendering.json).
    caniuse merges both values into one feature, shown supported from Chrome 41, Firefox 3.6, and
    Safari/iOS 10 ([caniuse css-crisp-edges](https://caniuse.com/css-crisp-edges)). The low Firefox
    number reflects prefixed `crisp-edges`. Use BCD's per-value data.
- Spec semantics ([CSS Images 3 §image-rendering](https://drafts.csswg.org/css-images-3/#the-image-rendering)):
  - `crisp-edges` "preserves contrast and edges, and … avoids smoothing colors". The spec warns
    that nearest-neighbour scaling at non-integer sizes aliases, so lines can come out a pixel
    thicker or thinner.
  - `pixelated`: "At integer multiples of the natural size, this gives the same results as
    crisp-edges". At non-integer factors the spec scales to the nearest integer multiple with
    nearest neighbour, then "the rest of the way" with smoothing. The property applies to `<img>`,
    background images, and other replaced content.
  - MDN describes both behaviours the same way ([MDN image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)).
- The 2021 "image-rendering paradox" (Chrome had only `pixelated`, Firefox only `crisp-edges`)
  produced the widespread two-declaration fallback ([Foster, DEV, 2021](https://dev.to/auroratide/pixelart-and-the-image-rendering-paradox-2p8k)).
  Firefox 93 resolved it. **Inference:** the fallback is now dead weight. Ship `pixelated` alone.

```css
/* Global pixel-art rules. One class, no fallbacks needed for 2026 targets. */
.px { image-rendering: pixelated; }
/* Downscaled overviews (asset larger than its box) intentionally smooth: */
.px-overview { image-rendering: auto; }
```

### R2 — Size with `width`/`height`, never with transforms, `zoom`, `object-fit`, or background images

Safari keeps a family of open bugs:

- [WebKit 185683](https://bugs.webkit.org/show_bug.cgi?id=185683) (open since 2018): canvases and
  images lose `pixelated` when a CSS transform scales them, on the element or on any ancestor. It
  depends on [WebKit 27684](https://webkit.org/b/27684): transformed elements do not respect
  `image-rendering`, and transitions use a stale low-resolution layer.
- [WebKit 177037](https://bugs.webkit.org/show_bug.cgi?id=177037) and its duplicate
  [271774](https://bugs.webkit.org/show_bug.cgi?id=271774) (2024, Safari 17, macOS and iOS): a
  background image tiled with `background-repeat` ignores `pixelated`.
- [WebKit 289023](https://bugs.webkit.org/show_bug.cgi?id=289023) (open, 2025, iOS Safari and STP): a
  background image on an element with any border, even a 0.0000000000001px one, is interpolated.
  The related [WebKit 285085](https://bugs.webkit.org/show_bug.cgi?id=285085) is also open.

Rules that follow (**Inference**):

- Display art only with `<img>` or `<canvas>` elements that have explicit integer-derived sizes.
- Never apply `transform: scale()` to pixel art, including hover zoom, pinch zoom, or a scaling
  animation on a parent.
- Zoom by re-sizing the element, or by redrawing a canvas at the new `k`.
- Never use `object-fit: contain` in a box whose size is not an integer multiple of the art. It
  silently produces a non-integer scale.
- `transform: translate()` by whole device pixels for panning is not covered by the bug reports.
  Still, panning a canvas map viewer by redrawing the source rectangle avoids the question.

### R3 — Integer scale in device pixels, then convert to CSS pixels

MDN notes that `pixelated` maps image pixels to CSS pixels. When `devicePixelRatio` is not an
integer, some device pixels are drawn larger than others; browser zoom triggers this too, for
example at 110% in Chrome ([MDN Crisp pixel art look](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look)).
The fix is to make `k` (device pixels per art pixel) an integer, not the CSS scale. Example: at DPR
1.5, a 32 px sprite with k = 3 is 96 device px, which is 64 CSS px. That is perfectly even, even
though 64/32 = 2 CSS px per art pixel.

```js
// fitPixelArt: integer device-pixel scale for art (artW×artH) inside a CSS box.
export function fitPixelArt(artW, artH, boxCssW, boxCssH, dpr = devicePixelRatio) {
  const devW = Math.floor(boxCssW * dpr), devH = Math.floor(boxCssH * dpr);
  const k = Math.floor(Math.min(devW / artW, devH / artH));
  if (k >= 1) return { k, smooth: false, cssW: (artW * k) / dpr, cssH: (artH * k) / dpr };
  // Art bigger than the box (maps, big images): no crisp integer option exists; smooth overview.
  const s = Math.min(devW / artW, devH / artH);
  return { k: s, smooth: true, cssW: (artW * s) / dpr, cssH: (artH * s) / dpr };
}

// Re-run layout whenever DPR changes (browser zoom, monitor switch). MDN's documented pattern.
export function watchDpr(onChange) {
  const mq = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
  mq.addEventListener('change', () => { onChange(devicePixelRatio); watchDpr(onChange); }, { once: true });
}
```

- The `matchMedia` resolution-change pattern comes from [MDN Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio).
- `ResizeObserver` with `{box: 'device-pixel-content-box'}` reports the exact device-pixel box, so
  canvases avoid blur and moiré ([web.dev, device-pixel-content-box](https://web.dev/articles/device-pixel-content-box)).
  BCD support: Chrome 84, Firefox 108 (93–107 returned wrong values), **Safari none**
  ([BCD ResizeObserverEntry](https://github.com/mdn/browser-compat-data/blob/main/api/ResizeObserverEntry.json);
  [WebKit 219005](https://bugs.webkit.org/show_bug.cgi?id=219005) is still open). Use it only as an
  optional Chrome/Firefox check. The formula above is the portable path.
- **Inference:** `getBoundingClientRect() × dpr` is "Convert it to real pixels. Ish."
  ([web.dev](https://web.dev/articles/device-pixel-content-box)). For elements the app sizes itself,
  compute from known inputs (art size, `k`, DPR) rather than measuring.
- **Gap:** I found no source showing how each engine pixel-snaps a CSS box whose CSS size is a
  non-terminating fraction (for example 256 device px / 2.625 = 97.52 CSS px). Verify on a DPR 2.625
  Android device. If edges look uneven, the residual cause is box positioning, not `k`.

### R4 — Canvas: native-resolution backing store, CSS upscaling, smoothing off

- MDN's recommended pattern: give the canvas the art's own resolution, scale it with CSS
  `width`/`height`, and set `image-rendering: pixelated`. Inside the canvas, keep each source pixel
  an integer number of canvas pixels, or `drawImage`/`scale()` blurs it ([MDN Crisp pixel art look](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look)).
- `imageSmoothingEnabled` is supported in Chrome 30, Firefox 51, and Safari 9.1. The `imageSmoothingQuality` property has no Firefox support
  ([BCD CanvasRenderingContext2D](https://github.com/mdn/browser-compat-data/blob/main/api/CanvasRenderingContext2D.json)).
- Assigning `canvas.width` or `canvas.height` resets the context to its default state, including
  smoothing ([HTML spec, set bitmap dimensions](https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions)).
  Re-set `imageSmoothingEnabled = false` after every resize.
- **Inference (memory):** a native-resolution canvas for a 64×64 frame holds 16 KB of pixels. A
  device-resolution canvas at k = 8 holds 1 MB. With dozens of animated thumbnails, native-resolution
  canvases plus CSS upscaling are the cheaper choice.
- Render grid lines and labels that must be 1 device px thick on a separate overlay (an SVG, or a
  second device-resolution canvas) rather than inside the art canvas.

```js
// One art canvas per player: backing store = frame size; CSS does the integer upscale.
function setupArtCanvas(canvas, frameW, frameH, fit /* from fitPixelArt */) {
  canvas.width = frameW; canvas.height = frameH;          // resets context state
  canvas.style.width = `${fit.cssW}px`; canvas.style.height = `${fit.cssH}px`;
  canvas.classList.toggle('px', !fit.smooth);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;                       // must follow every resize
  return ctx;
}
// Per frame: ctx.clearRect(0, 0, frameW, frameH); ctx.drawImage(bitmapOrSheet, sx, sy, frameW, frameH, 0, 0, frameW, frameH);
```

### R5 — Decoding

- `HTMLImageElement.decode()`: Chrome 64, Firefox 68, Safari 11.1. `decoding="async"`: Chrome 65,
  Firefox 63, Safari 11.1. `loading="lazy"`: Chrome 77, Firefox 75, **Safari 15.4**
  ([BCD HTMLImageElement](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLImageElement.json)).
  Before swapping a static thumbnail in, call `await img.decode()` to avoid a blank flash.
- `createImageBitmap`: Chrome 50, Firefox 42, Safari 15. Its `resizeQuality` option (which has a
  `"pixelated"` value) is supported in Chrome 54, Safari 15, and **Firefox only from 149**
  ([BCD createImageBitmap](https://github.com/mdn/browser-compat-data/blob/main/api/_globals/createImageBitmap.json)).
  Use `createImageBitmap(blob)` for animation frames: it can run in a worker and its result can be
  transferred. Do not rely on `resizeQuality: "pixelated"` for exports; upscale with `drawImage` and
  smoothing off instead.
- `OffscreenCanvas` with a 2D context, `convertToBlob`, and `transferControlToOffscreen`: Chrome 69,
  Firefox 105, Safari 16.4 ([BCD OffscreenCanvas](https://github.com/mdn/browser-compat-data/blob/main/api/OffscreenCanvas.json)).
  Export work can run fully in a Web Worker on every 2026 target.
- `ImageDecoder` (WebCodecs; decodes animated GIF frames): Chrome 94, Firefox 133, **Safari
  "preview" only** ([BCD ImageDecoder](https://github.com/mdn/browser-compat-data/blob/main/api/ImageDecoder.json)).
  This conflicts with the sibling spike's wording "absent in Safari < 26"
  (`../pixellab-pip/docs/pixellab-preview-app-research-spike.md`, Crux 3), which implies Safari 26
  shipped it. BCD says it did not. Do not depend on it.

### R6 — View Transitions

- `document.startViewTransition`: Chrome 111, Firefox 144, Safari 18 ([BCD Document](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json)).
- A WebKit bug reports blurry view-transition captures when the captured element has a CSS
  transform ([WebKit 317712](https://bugs.webkit.org/show_bug.cgi?id=317712)).
- **Gap:** I found no source on whether `image-rendering: pixelated` applies to the
  `::view-transition-old/new` snapshot pseudo-elements. A size-morphing transition scales a raster
  snapshot, which is exactly the transform-scaling case that blurs in R2.
- **Recommendation (Inference):** use only cross-fade (opacity) view transitions for pages that
  contain pixel art, or none. Do not morph a thumbnail into the viewer by size. If a "zoom from
  thumbnail" effect is wanted, test `::view-transition-new(*) { image-rendering: pixelated }` on
  Safari and Chrome first.

### R7 — Pixel-exact export pixels

- The HTML spec warns that converting to and from premultiplied alpha is lossy, so pixel values
  written to a canvas can read back differently ([HTML spec, pixel manipulation](https://html.spec.whatwg.org/multipage/canvas.html#pixel-manipulation)).
- **Inference:**
  - Pixels with alpha 0 or 255 survive `drawImage` → `getImageData`/`convertToBlob` exactly,
    except that fully transparent pixels lose their hidden RGB.
  - Semi-transparent pixels (PixelLab VFX and some animations contain them; see
    `../pixellab-pip/docs/pixellab/pixel-art-gif-friendly-disappearance.md`) can shift slightly.
  - Therefore: 1× downloads always serve the **original PNG bytes**, never a re-encode. N×
    upscales may go through canvas.
  - If bit-exact N× output matters for semi-alpha assets, decode and encode with a pure-JS PNG
    codec (UPNG.js) instead of canvas.
- A canvas tainted by cross-origin images throws on readback (`getImageData`, `toBlob`), while
  `drawImage` keeps working ([MDN CORS-enabled image](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image),
  as summarized in the sibling spike, Crux 2). Every exported pixel must come from a CORS-readable
  `fetch()` → `Blob` → `createImageBitmap` path (see Open questions).

## Thumbnail strategy

### Cell model

- Cells have one fixed CSS size per breakpoint (for example 128 CSS px on phones and 160 on
  desktop). The art box is 80% of the cell, leaving padding.
- Run `fitPixelArt` against the art box's device size.
- Worked examples at DPR 2, 160 CSS cell, 256 device-px art box (**Inference**, arithmetic):
  - 16×16 item: k = 16, 256 px, fills the box.
  - Trimmed 30×44 character: k = 5, 150×220.
  - Untrimmed 68×68 character canvas: k = 3, 204×204.
  - 400×400 map: k < 1, smooth overview.
- Letterbox inside the art box. Align the bottom for characters and objects so feet line up
  across a row; centre everything else.
- Downscaled assets (k < 1) switch to `.px-overview` (smooth). Nearest-neighbour downscaling "will
  skip every second pixel" ([CSS Images 3](https://drafts.csswg.org/css-images-3/#the-image-rendering)),
  which flickers and loses one-pixel details.

### Auto-trim transparent padding: worth it for characters and objects

- PixelLab character canvases are larger than the character. MCP docs used to state about 40%
  larger, for example 48 px character → ~68 px canvas, and observed v3 canvases at size 48 were
  84×84 and 92×92 (`../pixellab-pip/docs/pixellab/rpg-maker-character-sheet-formats.md`).
  Without trimming, same-size characters render at different visual weights depending on mode.
- For animations, trim to the **union** alpha bounding box across all frames that will play in the
  tile. Per-frame trimming introduces jitter. Pip's RPG Maker packaging uses the same rule: shared
  crop, one global nearest-neighbour scale, stable centre and baseline (same doc).
- Cost (**Inference**): one alpha scan per asset in a worker. A 64×64 RGBA frame is 16 KB, so this
  is negligible. Cache the bounding box with the asset record. Trim the display rectangle only
  (`drawImage` source rect or CSS crop); never alter downloaded bytes.
- Do not trim tilesets, tiles, maps, UI assets, or fonts. Their canvas size is meaningful.

### What to show per asset type

| Asset | Static thumbnail | Hover / in-view animation | Badge |
|---|---|---|---|
| Character (4/8 dir) | `south` rotation image (PixelLab ZIP and spritesheet row 0 start with rotations; Pip animates `south` first) | First animation whose name contains `idle`/`breath`, else first animation, `south` direction | `8-dir · 6 anims` |
| Object (1/8 dir, states) | Default state; `south` (8-dir) or the single view | First animation if any | `8-dir · 3 states` |
| Top-down / sidescroller Wang tileset | **Composed demo patch** (about 6×4 tiles, using a fixed mask that shows edges, corners, and both diagonals) via the dual-grid lookup in the viewer section; fallback to the raw sheet | none | `16 tiles · 32px` |
| Tiles Pro / path / building kit | First 4 or 9 variants in a 2×2 or 3×3 grid | none | count |
| Isometric tile | The tile | none | — |
| Map | Smooth downscaled full map (k < 1), or 1:1 if it fits | none | size |
| UI asset | The asset (integer fit) | none | — |
| Font | Glyph-atlas cells rendering "Aa1" (atlas order documented as 10×8 row-major `A–Z a–z .,!?:;'"-+()0–9/%*=_$`, no space glyph; `../pixellab-pip/docs/pixellab/pixellab-font-generation-spike.md`) | none | `16px` |
| VFX effect | Peak frame or frame 0 over the backdrop | Plays with its own fps/durations and loop flag | `12 fps · loop` |
| Generated image | Integer fit or smooth overview | none | size |

## Backdrops

- **Default: a low-contrast checkerboard drawn with a CSS conic gradient.** This is vector
  painting, not a scaled raster, so the Safari `pixelated` tiling bugs (R2) do not apply
  (**Inference**). `conic-gradient` is supported in Chrome 69, Firefox 83, and Safari 12.1
  ([BCD gradient](https://github.com/mdn/browser-compat-data/blob/main/css/types/gradient.json)).
  The sibling spike lists a checkerboard as baseline "professional" behaviour (sibling spike, "What
  'professional' means here").
- **Swatches:**
  - Checker (default)
  - Light `#eeeeee`
  - Mid-gray `#808080`: a neutral for judging outline and colour contrast
  - Dark `#1b1b1b`
  - Custom: native `<input type="color">`, no picker library
- **Game-like backdrops from the user's own tileset:** later. A tileset demo map already appears in
  the tileset viewer; offering "preview this character on tileset X" is a separate feature that
  needs a tileset picker (YAGNI for v1).
- **Scope:**
  - One global default, persisted in `localStorage` (wrapped in try/catch).
  - The viewer can override it for the session without changing the global.
  - Thumbnails always use the global.
  - The GIF export matte colour defaults to the current solid backdrop (see Export).
- Checker size is fixed in CSS px (8 CSS px squares) and does not scale with art zoom. That keeps
  it visually quiet. Aseprite-style checkers aligned to art pixels are not needed for a viewer.

```css
.bg-checker {
  --a: #d4d4d4; --b: #b8b8b8; --s: 16px;   /* --s = two 8px squares */
  background: conic-gradient(var(--a) 25%, var(--b) 0 50%, var(--a) 0 75%, var(--b) 0) 0 0 / var(--s) var(--s);
}
.bg-solid { background: var(--backdrop, #808080); }
```

## Playback engine & controls spec

### Frame timing available from PixelLab

- **Character and object animations carry no timing.** In the REST OpenAPI
  ([openapi.json](https://api.pixellab.ai/v2/openapi.json), fetched 2026-10-18), the only timing
  fields are `LipSyncFrameOut.duration_ms`, `LipSyncRequest.frame_ms`, and
  `TalkingGifRequest/Response.frame_ms`/`duration_ms`. Pip's cinematic spike states: "Playback
  delay (100 ms/frame) is an assembly choice; the endpoint sets no timing"
  (`../pixellab-pip/docs/pixellab/pixellab-cinematic-spike.md`).
- **VFX carries timing.** The REST `/vfx` result includes `fps` and `loop`, and its sheet JSON has
  per-frame durations, `pivot`, and `meta.anchor` (OpenAPI; also
  `../pixellab-pip/skills/pixellab-pip/references/vfx-workbench.md`). VFX sprite input defaults to
  "a GIF's own timing, else 12" fps (OpenAPI `sprite_fps`).
- **Frame counts:**
  - Raw v3 and PixMiniMax return `frame_count + 1` images; image 0 is the echoed input frame.
  - Managed v3 and PixMiniMax animations store the input reference as frame 0 by default
    (`keep_first_frame`), so `frame_count = 8` stores 9 frames.
  - The echo is not guaranteed to be pixel-identical.
  - Source: `../pixellab-pip/skills/pixellab-pip/references/animation.md`.
- **Real sequences can have variable delays.** The sibling spike's 295-frame cut had ten distinct
  delays (95–440 ms). Flattening it to 12 fps would play it in 24.58 s instead of 57.41 s, and "The
  FPS control may flatten them deliberately for inspection; it must not flatten them silently"
  (sibling spike).

**Decisions (Inference from the above):**

- The engine plays a `durations: number[]` array (milliseconds per frame). A uniform FPS is just
  `durations.fill(1000 / fps)`.
- Default for managed animations is **10 fps (100 ms)**. This matches Pip's established 100 ms
  assembly default and Aseprite's 100 ms frame default.
- VFX uses its returned durations or fps and its loop flag. Lip-sync and talking frames use
  `duration_ms`.
- Persist per-animation FPS overrides locally (keyed by animation id). Exported GIFs and JSON use
  the effective timing and say so.
- **Gap:** the PixelLab website's own preview speed for character animations was not found. If it
  is discoverable, match it as the default.

### Engine

- One module-level ticker drives every player. It runs only while at least one player is playing.
- Playback is time-based, so 60/90/120/144 Hz displays play at the same speed. Large deltas are
  clamped after tab switches.
- `requestAnimationFrame` callbacks pause in background tabs and hidden iframes
  ([MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)).
  Also pause explicitly on `visibilitychange` so players do not jump.

```js
// ticker.js — one rAF loop for all players.
const players = new Set(); let raf = 0, last = 0;
function tick(now) {
  const dt = Math.min(now - last, 250); last = now;       // clamp after stalls / tab return
  for (const p of players) p.advance(dt);
  raf = players.size ? requestAnimationFrame(tick) : 0;
}
export const play = (p) => { players.add(p); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
export const stop = (p) => players.delete(p);

// player.js — per-frame durations; redraw only when the frame index changes.
export function createPlayer({ durations, draw, mode = 'loop' /* 'loop' | 'once' | 'pingpong' */ }) {
  let i = 0, acc = 0, dir = 1, speed = 1;
  const p = {
    advance(dt) {
      acc += dt * speed; let changed = false;
      while (acc >= durations[i]) {
        acc -= durations[i]; changed = true;
        if (mode === 'pingpong' && (i + dir < 0 || i + dir >= durations.length)) dir = -dir;
        const n = i + dir;
        if (mode === 'once' && n >= durations.length) { stop(p); acc = 0; break; }
        i = mode === 'loop' ? n % durations.length : n;
      }
      if (changed) draw(i);
    },
    seek(n) { i = n; acc = 0; draw(i); },
    setSpeed(s) { speed = s; },
  };
  return p;
}
```

### Why canvas (and not CSS `steps()` or `<img>` swapping)

| Technique | Verdict | Reason |
|---|---|---|
| Canvas + `drawImage` from an `ImageBitmap` per frame or sheet | **Use** for every animated surface | Per-frame durations, scrubbing, sync across players, crisp with smoothing off; one cheap draw per frame change |
| CSS `steps()` on `background-position` | Reject | Needs a `background-image`, which hits the Safari `pixelated` bugs (R2). Only `transform` and `opacity` animate on the compositor ([web.dev animations guide](https://web.dev/articles/animations-guide)), so background-position repaints anyway. Variable durations need generated keyframes. No scrub API. |
| CSS `steps()` on `transform: translateX` of a strip | Reject | Transform on pixel art is the WebKit 185683/27684 risk zone. Same timing and scrub problems. |
| `<img>` `src` swapping across frame blob URLs | Reject for animation; use for static thumbnails | Each swap may re-decode or flash; per-frame DOM churn; no shared clock |

**Memory (Inference, arithmetic):**

- Decoded RGBA takes `w × h × 4` bytes.
- One 64×64 frame is 16 KB. An 8-direction character with 10 animations × 9 frames (720 frames)
  is about 11.5 MB decoded.
- Decode a player's frames only while it is visible or open.
- Keep an LRU of `ImageBitmap`s capped by bytes (for example 64 MB on mobile and 256 MB on
  desktop, as tuning values). Call `bitmap.close()` on eviction.
- Prefer decoding a single sheet over hundreds of frame bitmaps when a sheet is available.

### Thumbnail autoplay policy

- Default: **static**. On `(hover: hover) and (pointer: fine)` devices, play on hover and on
  keyboard focus, and stop on leave or blur.
- Optional setting "Animate thumbnails in view": an `IntersectionObserver` starts and stops
  players, with a concurrency cap as a tuning value (for example 8 on phones and 24 on desktop).
  Animations beyond the cap stay static.
- Disable autoplay entirely when:
  - `prefers-reduced-motion: reduce` is set (Chrome 74, Firefox 63, Safari 10.1;
    [BCD media](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json)). The
    viewer still plays on explicit Play.
  - `navigator.connection?.saveData` is true. This is a Chromium-only signal: Chrome 65, no
    Firefox or Safari ([BCD NetworkInformation](https://github.com/mdn/browser-compat-data/blob/main/api/NetworkInformation.json)).
- Skip the Battery Status API: Chrome only, and removed from Firefox at 52
  ([BCD Navigator](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)).
- Pause all players on `document.hidden`.

### Viewer controls

| Control | Spec |
|---|---|
| Play/pause | Button; `Space`/`K` |
| Frame step | `←`/`→` (or `,`/`.`); pauses playback |
| First/last | `Home`/`End` |
| Scrubber | Native `<input type="range" step="1">` (accessible, touch-friendly) plus a **filmstrip** of frame thumbnails at small integer scale; click a frame to seek. Virtualize the filmstrip beyond about 40 frames (PixMiniMax max is 41 images). Show `frame i / n · 100 ms`. |
| Speed | 0.25× / 0.5× / 1× / 2× segmented control, plus an "FPS override" field. Show when timing is overridden versus recorded (sibling spike rule: never flatten silently). |
| Loop mode | **Loop** (default) and **Once** (needed for VFX one-shots and attacks; follow VFX `loop` metadata). **Ping-pong** is a cheap view-only option (see the `pingpong` branch above, about three lines). Aseprite tags also use `pingpong`/`pingpong_reverse` ([Aseprite anidir.cpp](https://github.com/aseprite/aseprite/blob/main/src/doc/anidir.cpp)). Note that the sibling spike rejected ping-pong for its previewer as "editor" scope; for a game-asset gallery it is a common engine playback mode. Decide in design. |
| Direction switcher | **Compass rose**: a 3×3 grid of direction buttons with N at the top and play/pause in the centre. Disable directions the asset lacks. Use PixelLab names (`south`, `south-west`, `west`, ...). Keyboard: `[`/`]` rotate counter-clockwise/clockwise. Touch: horizontal swipe on the stage rotates, only when not zoomed past "fit" (otherwise the swipe pans). Keep frame index and play state when switching direction (sibling spike: "state-preserving asset switching"). |
| All directions | Toggle that renders all 4 or 8 directions in compass positions, **driven by one player clock** so frames stay in lockstep. High QA value: it shows direction drift side by side. |
| Frame 0 | Toggle "Hide reference frame 0" for managed v3/PixMiniMax animations, so loops do not stutter on the echoed input (see Open questions on whether metadata identifies such animations) |
| Onion skin | **Not in v1.** The sibling spike rejected it as an authoring aid ("even Aseprite disables it in its preview window"). If requested later, it is two `drawImage` calls with `globalAlpha`. |
| Zoom | Integer `k` steps only (R3); "Fit" button. No fractional zoom for upscales. |

## Per-asset-type viewers

All viewers share a stage: a canvas at native resolution with CSS integer upscaling, a backdrop
layer, and an overlay layer for grids and labels.

### Character / object viewer

- Layout: an animation list (rotations first, then animations, like PixelLab's spritesheet row 0),
  the compass, the player, the filmstrip, and an info panel (canvas size, frame count, effective
  timing, mode if known).
- States: object and character states appear as a state switcher. Preserve direction and frame
  when switching state.

### Sprite sheet viewer (any sheet, including PixelLab `/spritesheet` output and VFX sheets)

- Overlay lines go at `x = CW, 2·CW, … < W` and `y = CH, 2·CH, … < H`. This is the cell-grid rule
  in `../pixellab-pip/skills/pixellab-pip/references/local-asset-assembly.md`. It only shows the
  requested geometry and does not prove the art follows it.
- Hover highlights a cell and shows `row r · col c · #index` plus the row's animation and direction
  (from the layout JSON). Clicking a row plays it.
- Geometry comes only from metadata: PixelLab's layout JSON (cell size, sheet size, column count,
  row map) or the VFX frame JSON. The sibling spike forbids guessing: "A bare sheet still needs
  explicit frame geometry".

### Tileset viewer (top-down / sidescroller Wang, Tiles Pro)

- **Sheet tab:** show the sheet exactly as returned. Never re-sort by `wang_N`, `original_position`,
  or pattern, because "those layouts can scramble the usable sheet"
  (`../pixellab-pip/skills/pixellab-pip/references/tileset.md`). Add a grid overlay with tile
  coordinates and `wang_N` labels, plus a per-tile corner glyph (2×2 quadrants coloured lower or
  upper).
- **"How it works" panel:** each display tile samples four world-cell corners NW/NE/SW/SE. The key
  is `NW·8 + NE·4 + SW·2 + SE·1`, where 1 = upper terrain and 0 = lower. The compact sheet is
  `tileset15` 4×4 (16 tiles); top-down `transition_size > 0.5` with `shape_style`, or Pro tall
  walls, give 4×8 / 25 tiles
  (`../pixellab-pip/docs/pixellab/pixellab-dualgrid-tileset-export-system.md`).
- **Demo map tab (no painter):** a deterministic corner mask rendered through the dual-grid lookup.
  Ship a fixed curated mask that contains all 16 keys, including both diagonals (6 and 9), plus a
  "Shuffle" button that generates a seeded blob mask. Integer zoom and a grid toggle.

```js
// mask: (W+1)×(H+1) corner grid of 0 (lower) / 1 (upper). Tiles keyed by their returned `corners`.
// Prefer `corners`/`wang_N` over `pattern_4x4`, which local fixtures show can disagree (dualgrid doc).
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const key = mask[y][x] * 8 + mask[y][x + 1] * 4 + mask[y + 1][x] * 2 + mask[y + 1][x + 1];
  const t = tileByKey[key]; // { sx, sy } from the tile's bounding_box in the returned sheet
  ctx.drawImage(sheet, t.sx, t.sy, ts, ts, x * ts, y * ts, ts, ts);
}
```

- **Caveat:** Tiles Pro `corner/4` bits use `NW<<3 | NE<<2 | SW<<1 | SE`, with **set = the first
  terrain occupies that corner**. Hex sets use `edge/6`, and square sets can use `edge/4`
  (`../pixellab-pip/skills/pixellab-pip/references/tileset.md`). Normalize per family before
  lookup. In v1, the demo map covers square Wang sets only. Hex, isometric, oblique, and 25-tile
  tall-wall sets show the sheet with bit overlays (see Open questions).
- **Sidescroller:** show a demo strip of platforms (single, 3-wide, stepped), built with the same
  lookup on a side-view mask.

### Map viewer

- A canvas sized to the viewport in device pixels (well under the iOS area cap, R-memory). Draw the
  visible source rectangle at integer `k` (device px per map px). `k < 1` levels (½, ⅓, ¼) are
  smooth overviews.
- Input:
  - Pointer Events with `touch-action: none`.
  - One pointer pans. Two pointers pinch-zoom around the midpoint.
  - The wheel zooms at the cursor. Trackpad pinch arrives as `wheel` with `ctrlKey`.
  - Double-tap or double-click toggles Fit and 1:1.
  - Zoom snaps to the nearest integer level when the gesture ends.
- Minimap: skip in v1 (YAGNI). A "Fit" button and a zoom readout cover orientation for typical
  PixelLab map sizes. Revisit if maps exceed about 4× the viewport.

### Font viewer

- A sample-text input (default "The quick brown fox 0123"). Render glyphs by **blitting the
  documented 10×8 atlas cells** at integer `k` on canvas. This is deterministic and crisp. There is
  no space glyph, so advance by one cell for spaces.
- Optionally show "rendered as font" using the TTF through the `FontFace` API, at an integer
  multiple of `glyph_px`. Browsers antialias TTF outlines, so label this as how the font renders in
  apps. The font spike says to judge fonts by rendering text with the TTF, not by eyeballing the
  atlas.
- Highlight `suspect_glyphs` when present
  (`../pixellab-pip/docs/pixellab/pixellab-font-generation-spike.md`).

### UI asset viewer

- Integer zoom over the backdrop swatches.
- 9-slice preview only if PixelLab provides slice insets. None were found in the sibling research,
  so it is not in v1 (Open questions).

### VFX viewer

- Plays over the backdrop with its own durations and loop flag.
- Optionally mark `meta.anchor` / `pivot` with a crosshair overlay.
- "Play over a character" is a later feature: it needs the anchor semantics and character pairing.

## Export formats spec

General rules:

- Every export is generated from decoded source PNGs in a worker (`OffscreenCanvas` and pure-JS
  encoders).
- Exports never re-encode a 1× single image.
- Scale choices are 1×/2×/4×/8× nearest-neighbour (integer only).
- Filenames are slugged `[a-z0-9-]` plus a short id suffix for uniqueness.

| Format | Use | Settings | Library | Caveats |
|---|---|---|---|---|
| **PNG (original)** | Single image or frame, exactly as PixelLab produced it | 1× only; the original bytes from the fetched Blob | none (`fetch` → `Blob`) | Never re-encode at 1× (premultiplied alpha, R7) |
| **PNG (upscaled)** | Sharing, store pages, mockups | 2/4/8× nearest neighbour: `drawImage` with smoothing off on `OffscreenCanvas` → `convertToBlob({type:'image/png'})` | native | Check the output area against the iOS canvas cap (Download matrix). Semi-alpha pixels may shift slightly through canvas. |
| **Sprite sheet PNG** | Engines | Mirror PixelLab `/spritesheet`: uniform cell = the largest frame; frames centred, never rescaled; row 0 = rotations, then one row per animation × direction; columns = frames in playback order; unused cells transparent ([OpenAPI](https://api.pixellab.ai/v2/openapi.json)). Options: scope (one animation, all directions, or everything); spacing 0 (default) or 1–2 px; outer border 0. **No power-of-two padding by default.** | native canvas | Large sheets × scale can exceed canvas limits, so cap and warn. If PixelLab's own `/characters/{id}/spritesheet` ZIP is CORS-reachable, offer it as "PixelLab original sheet". |
| **Sheet JSON** | Engine import metadata | **One format: Aseprite JSON hash.** `frames` keys hold `{frame:{x,y,w,h}, rotated:false, trimmed:false, spriteSourceSize, sourceSize, duration}` (ms). `meta` holds `{app, version, image, format:"RGBA8888", size, scale:"1", frameTags:[{name:"walk_south", from, to, direction:"forward"}]}`. Field names verified in Aseprite's exporter source ([doc_exporter.cpp](https://github.com/aseprite/aseprite/blob/main/src/app/doc_exporter.cpp)). Phaser loads it directly via `load.aseprite` and `anims.createFromAseprite`, hash or array ([Phaser docs](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Animations.AnimationManager-createFromAseprite)). PixiJS reads the same `frames`/`meta` shape plus an optional `animations` name → frame-list map ([PixiJS sprite sheets](https://pixijs.com/7.x/guides/components/sprite-sheets)). Add `animations` to the same file so one JSON serves both. | hand-written (about 30 lines) | Do not emit TexturePacker, Godot `.tres`, or Unity formats in v1. Test that our JSON imports cleanly in Phaser, PixiJS, and one Godot importer (Open questions). Keep any PixelLab layout JSON alongside, unmodified. |
| **GIF** | Social sharing, chat, quick preview | **Delays:** centiseconds per GIF89a; round cumulatively to preserve total duration; minimum 2 cs. **Loop:** `repeat 0` (forever) by default, or once. **Disposal:** 2 for transparent frames. **Transparency:** 1-bit (transparent index 0). **Semi-alpha:** "Matte" (composite over the chosen backdrop colour, then opaque) or "Threshold" (alpha ≥ 128 opaque). **Palette:** exact global palette if ≤ 255 opaque colours, else `quantize()`. **Scale:** integer, default the smallest `k` with longest side ≥ 256 px, maximum 8×. | `gifenc` in a worker | GIF has only binary transparency (Aseprite community; `../pixellab-pip/docs/pixellab/pixel-art-gif-friendly-disappearance.md`). Browsers treat delays ≤ 10 ms as 100 ms (see below). gifenc has no dithering, and its own quantizer is rgb565-binned, so the exact-palette path avoids colour drift for pixel art. |
| **APNG** (optional) | Lossless animation with full alpha (VFX, soft edges) | `UPNG.encode(frames, w, h, 0 /* lossless */, delaysMs)` | `upng-js` (+`pako`) | Displays everywhere (Chrome 59, Firefox 3, Safari 8, Edge 79; [caniuse apng data](https://github.com/Fyrd/caniuse/blob/main/features-json/apng.json)). The library has been unmaintained since 2017, and the files are larger than GIF. Include only if GIF's 1-bit alpha is a real complaint. |
| **Animated WebP** | — | — | — | **Skip.** No native encoder; Safari cannot encode even still WebP via `toBlob` ([BCD HTMLCanvasElement](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLCanvasElement.json)). Needs a libwebp WASM port such as `wasm-webp` (animated encode; [npm](https://www.npmjs.com/package/wasm-webp)), which is a heavy dependency for no gain over APNG/GIF on pixel art. |
| **PNG frame sequence** | Engines and editors that want loose frames | Mirror PixelLab's ZIP: `rotations/{direction}.png`, `animations/{animation}/{direction}/frame_000.png` (zero-based, 3-digit) ([OpenAPI `/characters/{id}/zip`](https://api.pixellab.ai/v2/openapi.json)) | `client-zip` | Original bytes at 1×; upscaled frames at N× |
| **Single-asset ZIP** | "Download everything for this asset" | PixelLab ZIP structure + `metadata.json` (gallery-side: name, type, ids, timing used, export scale) + selected sheets and GIFs | `client-zip` (store) | PixelLab's own character ZIP is also uncompressed "for faster generation and compatibility" (OpenAPI), so store-only is consistent |
| **Bulk ZIP** | Multi-asset or whole account | `pixellab-export-YYYY-MM-DD/{type}/{slug}--{shortid}/…` plus a root `manifest.json` listing assets, sources, and any failures | `client-zip` streaming | Stream to disk where possible; on iOS, materialize in memory with a size guard (Download matrix) |
| **Tileset** | Engines | Sheet PNG exactly as returned, plus metadata JSON as returned; optional per-tile PNGs (`tiles/wang_00.png`, only on request); optional demo-map PNG | `client-zip` | Never re-sort tiles (tileset.md). Engine repacks (Godot 3×3, other Wang orders) are not in v1. |

### GIF details that matter

- **Units.** GIF89a delay time is in hundredths of a second. Disposal 2 restores the frame area to
  the background, and the transparency index is a per-frame flag in the Graphic Control Extension
  ([GIF89a spec](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)). Looping uses the Netscape
  application extension, not the core spec. gifenc writes it when `repeat >= 0`.
- **Minimum delay.** Firefox and WebKit/Chromium replace delays ≤ 10 ms with 100 ms
  ([WebKit r73295](https://trac.webkit.org/r73295) adopting Firefox's rule;
  [Gigazine 2022](https://gigazine.net/gsc_news/en/20220222-fastest-gif-animation)). Older IE
  clamped ≤ 50 ms ([Microsoft IEInternals](https://learn.microsoft.com/en-us/archive/blogs/ieinternals/trivia-animated-gif-timing)).
  Apple ImageIO documents its GIF delay property as clamped to a 100 ms minimum
  ([Apple docs](https://developer.apple.com/documentation/imageio/kcgimagepropertygifdelaytime)).
  Encode at least 2 cs (50 fps maximum). **Gap:** whether Apple native viewers (Photos, Quick Look)
  slow down 20–90 ms GIFs was not verified.
- **gifenc behaviour** (verified in [gifenc src/index.js](https://cdn.jsdelivr.net/npm/gifenc@1.0.3/src/index.js)):
  - `delay` is in ms and is converted with `Math.round(delay / 10)`.
  - `transparent: true` forces disposal 2 unless overridden.
  - `repeat` is 0 for forever, -1 for once, or a count.
  - The palette is required on the first frame.
  - Pass delays that are already cumulative-rounded multiples of 10 ms.
- **Rounding drift.** The sibling spike measured 57.41 s of source delays playing as 56.76 s after
  per-frame centisecond rounding. Cumulative rounding removes the drift:

```js
// ms durations -> GIF centiseconds; cumulative rounding keeps total length; >= 2 cs avoids the 100 ms clamp.
export function gifDelaysCs(durationsMs) {
  let t = 0, emitted = 0;
  return durationsMs.map((d) => { t += d; const cs = Math.max(2, Math.round(t / 10) - emitted); emitted += cs; return cs; });
}
// 12 fps (83.3 ms) -> 8, 9, 8, 8, 9, 8 ... instead of a flat 8 (which plays at 12.5 fps).
```

```js
// Exact palette for pixel art (most PixelLab animations have far fewer than 255 colours).
// Index 0 = transparent. Returns null when > 255 opaque colours -> fall back to gifenc quantize().
export function exactPalette(framesRGBA, alphaCut = 128) {
  const map = new Map(), palette = [[0, 0, 0]];
  const indexed = [];
  for (const px of framesRGBA) {
    const out = new Uint8Array(px.length >> 2);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      if (px[i + 3] < alphaCut) continue;                       // stays 0 (transparent)
      const key = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2];
      let idx = map.get(key);
      if (idx === undefined) {
        if (palette.length === 256) return null;
        idx = palette.length; map.set(key, idx); palette.push([px[i], px[i + 1], px[i + 2]]);
      }
      out[j] = idx;
    }
    indexed.push(out);
  }
  return { palette, indexed };
}
// Matte mode: before indexing, composite 0<a<255 pixels over the matte colour and set a=255.
// Encode: import { GIFEncoder } from 'gifenc'; const gif = GIFEncoder();
// indexed.forEach((idx, f) => gif.writeFrame(idx, W, H, { palette: f ? undefined : palette,
//   delay: cs[f] * 10, transparent: true, transparentIndex: 0, repeat: loop ? 0 : -1 }));
// gif.finish(); new Blob([gif.bytes()], { type: 'image/gif' });
```

- **Upscale before encoding.** GIFs are viewed unscaled, and many viewers smooth them. A 64 px
  sprite at 1× is tiny in chat apps. Upscale with nearest neighbour to the export `k` before
  palette mapping; this is cheap because the palette is unchanged.

### Sprite-sheet layout defaults (rationale)

- **Uniform cells, centred, never rescaled.** This matches PixelLab's own export, so the pivot is
  the cell centre (OpenAPI).
- **Rows = animation × direction, columns = frames.** This matches PixelLab and most engine
  importers. RPG Maker-style direction orders (Down, Left, Right, Up) are a separate preset family
  with cropping and rescaling rules (`../pixellab-pip/docs/pixellab/rpg-maker-character-sheet-formats.md`),
  so they are out of scope for v1.
- **No power-of-two by default.** **Inference:** modern engines and WebGL2 handle NPOT textures,
  and POT padding inflates file size. Add a POT toggle only if a user target needs it.
- **Spacing and extrusion off by default.** Offer 1–2 px spacing for engines that bleed
  neighbouring cells when filtering. Aseprite exposes the same knobs as `--shape-padding`,
  `--border-padding`, and `--inner-padding` ([Aseprite CLI](https://www.aseprite.org/docs/cli/)).

## Library recommendations

Versions, release dates, and licenses come from the npm registry (2026-10-18). Sizes are measured
from jsDelivr's minified `+esm` builds of each **whole package** (not tree-shaken) and gzipped
locally with `gzip -9`. Dependencies shown as separate imports are excluded (noted). The client-zip
README states 6.4 kB min / 2.6 kB gz.

| Job | Pick | Version (released) | Min / gz | License | Worker | Why / alternatives |
|---|---|---|---|---|---|---|
| GIF encode | **gifenc** | 1.0.3 (2021-03-07) | 8.8 KB / 3.9 KB | MIT | Yes (pure JS, no DOM; README shows a multi-worker pattern) | Smallest. ms delays, transparency, repeat, palette control; "more than twice as fast as GIF.js" ([repo](https://github.com/mattdesl/gifenc)). **Risk:** no release since 2021, marked "experimental"/WIP, no dithering (not needed for exact-palette pixel art). Alternative: **modern-gif** 2.1.0 (2026-04-16, MIT; 18.7/6.8 KB + `modern-palette` dependency; built-in `workerUrl`, also decodes; [repo](https://github.com/qq15725/modern-gif)). Avoid **gif.js** 0.2.0 (2016, unmaintained). **omggif** 1.0.10 (2019; 6.9/2.9 KB) encodes and decodes but has no quantizer. |
| GIF decode (only if a GIF-only asset must be scrubbed) | **gifuct-js** | 2.1.2 (2021-11-04) | 3.3 / 1.7 KB + `js-binary-schema-parser` | MIT | Yes | Prefer PixelLab PNG frames or VFX sheet JSON; `ImageDecoder` is not in Safari (R5) |
| ZIP | **client-zip** | 2.5.1 (2026-09-14) | 6.8 / 3.0 KB | MIT | Yes (IIFE build for ServiceWorker `importScripts`) | Streams (`downloadZip` → `Response`, `makeZip` → `ReadableStream`, `predictLength`), automatic Zip64, no dependencies; **store-only (no compression)**, which suits already-compressed PNG/GIF ([repo](https://github.com/Touffy/client-zip)). Alternative when compression is needed: **fflate** 0.8.3 (2026-05-16, MIT; 32.5/12.6 KB whole, tree-shakeable). Not **JSZip** 3.10.2 (121/37 KB; MIT or GPL-3.0) or **@zip.js/zip.js** 2.24.0 (220/91 KB; BSD-3-Clause), which are heavier for this job. client-zip's own benchmark: in Safari it was fastest on a 539 MB test; in Chrome fflate was faster. |
| APNG encode (optional) | **upng-js** | 2.1.0 (2017-12-12) | 18.7 / 7.0 KB + `pako` | MIT | Yes | Unmaintained. Only if APNG ships. |
| Animated WebP | none | — | — | — | — | Skip. `wasm-webp` 0.1.0 (2026-03, MIT, animated encode) and `@jsquash/webp` 1.5.0 (Apache-2.0) exist if ever needed. |
| Streaming save | native `showSaveFilePicker` → `FileSystemWritableFileStream` | — | 0 | — | — | Chromium only. Not **StreamSaver** 2.0.6 (2022, unmaintained); client-zip documents its own ServiceWorker streaming pattern instead. |
| Pixel scaling, decode, workers | native (`createImageBitmap`, `OffscreenCanvas`, `drawImage` with smoothing off) | — | 0 | — | Yes (Safari 16.4+) | No library needed |

## Browser download matrix

Support numbers are from BCD unless noted.

| Capability | Chrome / Edge desktop | Firefox desktop | Safari macOS | iOS / iPadOS Safari (and WebKit-based iOS browsers) | Android Chrome / Samsung | Firefox Android |
|---|---|---|---|---|---|---|
| Blob + `<a download>` | Chrome 14 / Edge 18. Cross-origin URLs ignore `download` since Chrome 65 and Edge 79, so always download a **blob:** URL. | 20 | 10.1 | **13+**. Saves to Files › Downloads after a prompt. Historic WebKit quirks: blob ZIP opened as a tab ([190351](https://bugs.webkit.org/show_bug.cgi?id=190351), fixed); some text types open in-tab ([263608](https://bugs.webkit.org/show_bug.cgi?id=263608)); revoking the URL too early broke downloads in 2020-era reports. Test on target iOS. | Yes (mirrors Chrome) | 20. Filename honoured only for `blob:`/`data:` URLs. |
| Multiple automatic downloads | Per-site "Automatic downloads" permission; Chrome asks after the first file by default ([How-To Geek](https://www.howtogeek.com/428416/how-to-enabledisable-multiple-file-downloads-in-chrome/)) | Prompts/varies | Prompts/varies | Unreliable | Prompts | Prompts |
| `showSaveFilePicker` + `createWritable` (stream to disk) | 86+ | No | No | No | **Chrome Android 132+** | No |
| `showDirectoryPicker` (write a folder tree instead of a ZIP) | 86+ | No | No | No | Chrome Android 132+ | No |
| `navigator.share({files})` | `share` full from Chrome 128 (89–127 only on ChromeOS and Windows); files param 89. Edge 93 (Windows). | No files support (`share` behind a flag) | 14+ | **14+**. Share sheet offers Save Image / Save to Files. Needs transient activation. | Chrome Android 76+, Samsung 11+ | No files support |
| ServiceWorker-streamed download (client-zip pattern) | Yes | Yes (the worker may be killed mid-download) | 15.4+ | 15.4+ | Yes | Yes |
| OPFS (`navigator.storage.getDirectory`) as spill space | 86 | 111 | 15.2 (`createWritable` 26) | 15.2 (`createWritable` 26) | 109 | 111 |
| Canvas limits to respect | Generous | Generous | Generous | Community-reported: **16,777,216 px canvas area** (backing store × DPR counts) and **224–384 MB total canvas memory** (varies by version and device) ([pqina area](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/), [pqina memory](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/), [Apple forums](https://developer.apple.com/forums/thread/687866)) | Device-dependent | Device-dependent |

**Transient activation.** `navigator.share()` rejects with `NotAllowedError` without transient
activation and consumes it. Chrome and Safari check activation before validating data
([WebKit User Activation API](https://webkit.org/blog/13862/the-user-activation-api/);
[W3C Web Share](https://www.w3.org/TR/web-share/)). `showSaveFilePicker` also needs a user gesture.
**Inference:** long async work between the tap and the call loses the activation. Use a two-step
flow: (1) "Export" builds the file, (2) a "Save / Share" button calls `share` or the picker
synchronously. For the picker, call it first, then generate into the stream.

```js
import { downloadZip } from 'client-zip';

// Streamed ZIP where possible; in-memory Blob otherwise. Call from a click handler.
export async function saveZip(files /* async iterable of { name, input, lastModified } */, name) {
  if (window.showSaveFilePicker) {
    const handle = await showSaveFilePicker({ suggestedName: name,
      types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }] });
    return downloadZip(files).body.pipeTo(await handle.createWritable()); // picker first, then stream
  }
  saveBlob(await downloadZip(files).blob(), name);
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000); // never revoke synchronously (Safari quirks)
}

// Mobile "Save to Photos/Files": file prepared earlier; this runs directly in the tap handler.
export function shareOrSave(file /* File */) {
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] });
  saveBlob(file, file.name);
}
```

**Memory guard (Inference):**

- Without streaming (Safari, Firefox, iOS), a ZIP is fully materialized as a Blob.
- Estimate the size from the known PNG byte sizes (client-zip `predictLength`) before starting.
  Above a threshold (a tuning value, for example 300 MB on iOS and 1 GB on desktop), split the
  export into numbered parts (`…-part1.zip`) or ask the user to choose fewer assets.
- Canvas-based exports must check `w × h × k² ≤ 16,777,216` on iOS. Example: an 8-direction × 16
  frame sheet of 128 px cells at 8× is 16,384 × 8,192 px, roughly 134 M px, which is far over the
  cap. Fall back to a lower scale and say so.

## Implications for the gallery app

1. **One `PixelImage` component and one `PixelCanvas` component.** Both take art size and box,
   call `fitPixelArt`, and set explicit CSS sizes. Ban `transform: scale`, `zoom`, `object-fit`,
   and `background-image` for art in code review and lint (Safari bugs, R2).
2. **A global DPR store** (Svelte rune) fed by `watchDpr`. Thumbnail and viewer layouts re-fit on
   change.
3. **Decode pipeline:** `fetch` (CORS) → `Blob` (cached in IndexedDB or Cache Storage, per the
   storage researcher) → `createImageBitmap` in a worker → transfer → LRU by bytes with `close()`
   on evict. Static thumbnails use `<img loading="lazy" decoding="async">` on blob URLs.
4. **One ticker module and a player factory** with `durations[]`, loop/once/(ping-pong), speed,
   seek, and a shared clock for "all directions". Per-animation FPS overrides persist locally.
   Default 10 fps. VFX and lip-sync use their own timing.
5. **Thumbnail policy:** static by default; hover/focus play; optional in-view autoplay with a cap;
   off under `prefers-reduced-motion` and `saveData`; pause on hidden. Characters show `south`
   rotation, trimmed to the union alpha bounding box and bottom-aligned. Tilesets show a composed
   demo patch.
6. **Export worker** (`OffscreenCanvas` + gifenc + client-zip):
   - 1× = original bytes; N× = nearest neighbour via canvas.
   - GIF: exact palette, cumulative centisecond delays ≥ 2 cs, disposal 2, Matte or Threshold for
     semi-alpha.
   - Sheet + Aseprite-hash JSON with an `animations` map.
   - ZIP layout mirrors PixelLab's.
7. **Downloads module:** picker streaming → Blob + `<a download>` → share on mobile. Two-step UI to
   keep user activation. Single ZIP for multiple files. Size estimate and part-splitting on iOS.
8. **No size-morph View Transitions** around pixel art; cross-fade only unless tested.
9. **Tileset viewer** keeps the returned sheet order and builds lookups from `corners`/`wang_N`,
   normalizing Tiles Pro bit semantics per family.
10. **Expected bundle cost of the export path:** roughly 7 KB gz (gifenc + client-zip), loaded
    lazily on first export.

## Open questions

1. **CORS (blocking for all exports).** Do PixelLab image URLs (CDN/backblaze links returned by
   getters) and the REST download routes (`/characters/{id}/zip`, `/spritesheet`) send
   `Access-Control-Allow-Origin` for a browser origin? If not, `fetch` fails, `<img>` still
   displays, and canvas readback is tainted (R7). Exports and trimming would then be impossible
   client-side without a proxy, which conflicts with "no backend". This needs a live check, owned
   by the API researcher.
2. **Default FPS.** What playback speed does the PixelLab website use for character animations?
   (Not found; 10 fps assumed.)
3. **Frame 0 echo.** Do getters expose whether a managed animation kept the reference frame
   (`keep_first_frame`), so the "hide frame 0" toggle can default sensibly per animation?
4. **View Transitions.** Does `image-rendering: pixelated` on `::view-transition-*` keep snapshots
   crisp in Safari 18+ and Chrome? Untested.
5. **Non-integer `pixelated`.** Does each engine implement `pixelated` as the spec's
   integer-then-smooth two-step, or as plain nearest neighbour? This is moot if integer-only sizing
   holds, but it matters for any accidental fractional box.
6. **Fractional-DPR snapping.** On DPR 2.625/2.75/3.5 Android devices and 1.25/1.5 Windows, do
   computed CSS sizes like 97.52 px snap to exact device boxes? Safari has no
   `devicePixelContentBoxSize` to verify. Also: does Safari page zoom change `devicePixelRatio`?
7. **iOS 26 download UX.** Reliability of blob `<a download>` for ZIP and GIF; share-sheet options
   for ZIP versus images; whether GIFs saved to Photos keep animation and timing; practical maximum
   in-memory ZIP before tab reload.
8. **Tilesets beyond square Wang.** Geometry for isometric, hex, and oblique demo layouts, and the
   semantics of 25-tile Pro tall-wall sets for a demo map.
9. **UI assets.** Does PixelLab return 9-slice insets for UI assets? If not, no 9-slice preview.
10. **Fonts.** Does the getter for stored fonts return the TTF (`ttf_base64`) and the atlas for
    gallery use?
11. **Importer compatibility.** Does the single Aseprite-hash JSON (with an added `animations` map)
    import cleanly in Phaser, PixiJS, and common Godot 4 and Unity Aseprite-JSON importers? Needs a
    test matrix before claiming engine support.
12. **gifenc maintenance risk.** It has had no release since 2021. Acceptable given its size (it
    can be vendored), or prefer modern-gif (maintained 2026) at about 2× the size?
13. **Apple GIF minimum delay.** Apple ImageIO documents a 100 ms clamp. Do Apple native viewers
    slow down 20–90 ms frames that browsers play correctly?

## Sources

Standards and browser data

- [CSS Images Module Level 3 — image-rendering](https://drafts.csswg.org/css-images-3/#the-image-rendering)
- [MDN — image-rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)
- [MDN — Crisp pixel art look with image-rendering](https://developer.mozilla.org/en-US/docs/Games/Techniques/Crisp_pixel_art_look)
- [MDN — Window.devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN — CORS-enabled image / tainted canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)
- [HTML spec — canvas set bitmap dimensions](https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-set-bitmap-dimensions); [pixel manipulation](https://html.spec.whatwg.org/multipage/canvas.html#pixel-manipulation)
- [W3C GIF89a specification](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)
- [W3C Web Share API](https://www.w3.org/TR/web-share/)
- MDN browser-compat-data (fetched 2026-10-18): [css/properties/image-rendering](https://github.com/mdn/browser-compat-data/blob/main/css/properties/image-rendering.json), [api/Navigator](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json), [api/Window](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json), [api/_globals/createImageBitmap](https://github.com/mdn/browser-compat-data/blob/main/api/_globals/createImageBitmap.json), [api/OffscreenCanvas](https://github.com/mdn/browser-compat-data/blob/main/api/OffscreenCanvas.json), [api/ImageDecoder](https://github.com/mdn/browser-compat-data/blob/main/api/ImageDecoder.json), [api/CanvasRenderingContext2D](https://github.com/mdn/browser-compat-data/blob/main/api/CanvasRenderingContext2D.json), [api/ResizeObserverEntry](https://github.com/mdn/browser-compat-data/blob/main/api/ResizeObserverEntry.json), [api/Document](https://github.com/mdn/browser-compat-data/blob/main/api/Document.json), [api/HTMLImageElement](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLImageElement.json), [api/HTMLCanvasElement](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLCanvasElement.json), [html/elements/a](https://github.com/mdn/browser-compat-data/blob/main/html/elements/a.json), [api/FileSystemFileHandle](https://github.com/mdn/browser-compat-data/blob/main/api/FileSystemFileHandle.json), [api/StorageManager](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json), [api/NetworkInformation](https://github.com/mdn/browser-compat-data/blob/main/api/NetworkInformation.json), [css/at-rules/media](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json), [css/types/gradient](https://github.com/mdn/browser-compat-data/blob/main/css/types/gradient.json)
- caniuse: [css-crisp-edges](https://caniuse.com/css-crisp-edges), raw data [apng](https://github.com/Fyrd/caniuse/blob/main/features-json/apng.json), [webp](https://github.com/Fyrd/caniuse/blob/main/features-json/webp.json)
- [web.dev — Pixel-perfect rendering with devicePixelContentBox](https://web.dev/articles/device-pixel-content-box)
- [web.dev — How to save a file](https://web.dev/articles/files/save-a-file)
- [web.dev — Animations guide](https://web.dev/articles/animations-guide)

Browser bugs

- WebKit: [185683](https://bugs.webkit.org/show_bug.cgi?id=185683), [27684](https://webkit.org/b/27684), [177037](https://bugs.webkit.org/show_bug.cgi?id=177037), [271774](https://bugs.webkit.org/show_bug.cgi?id=271774), [289023](https://bugs.webkit.org/show_bug.cgi?id=289023), [285085](https://bugs.webkit.org/show_bug.cgi?id=285085), [219005](https://bugs.webkit.org/show_bug.cgi?id=219005), [317712](https://bugs.webkit.org/show_bug.cgi?id=317712), [190351](https://bugs.webkit.org/show_bug.cgi?id=190351), [263608](https://bugs.webkit.org/show_bug.cgi?id=263608)
- [WebKit changeset r73295 (GIF ≤10 ms → 100 ms)](https://trac.webkit.org/r73295); [Gigazine — fastest GIF animation (2022)](https://gigazine.net/gsc_news/en/20220222-fastest-gif-animation); [Microsoft IEInternals — Animated GIF timing](https://learn.microsoft.com/en-us/archive/blogs/ieinternals/trivia-animated-gif-timing); [Apple ImageIO kCGImagePropertyGIFDelayTime](https://developer.apple.com/documentation/imageio/kcgimagepropertygifdelaytime)
- [WebKit blog — The User Activation API](https://webkit.org/blog/13862/the-user-activation-api/)
- [pqina — Canvas area exceeds the maximum limit](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/); [pqina — Total canvas memory use exceeds the maximum limit](https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/); [Apple Developer Forums 687866](https://developer.apple.com/forums/thread/687866)
- [How-To Geek — Chrome multiple file downloads](https://www.howtogeek.com/428416/how-to-enabledisable-multiple-file-downloads-in-chrome/)
- [Foster — Pixelart and the image-rendering Paradox (DEV, 2021)](https://dev.to/auroratide/pixelart-and-the-image-rendering-paradox-2p8k)

Libraries and formats

- [gifenc repo](https://github.com/mattdesl/gifenc) and [src/index.js @1.0.3](https://cdn.jsdelivr.net/npm/gifenc@1.0.3/src/index.js); [modern-gif](https://github.com/qq15725/modern-gif); [client-zip](https://github.com/Touffy/client-zip); [wasm-webp (npm)](https://www.npmjs.com/package/wasm-webp)
- npm registry metadata (2026-10-18) for gifenc, gif.js, modern-gif, omggif, gifuct-js, fflate, client-zip, jszip, @zip.js/zip.js, upng-js, @jsquash/webp, wasm-webp, streamsaver: `https://registry.npmjs.org/<package>`; size measurements from `https://cdn.jsdelivr.net/npm/<package>@<version>/+esm`
- Aseprite: [CLI docs](https://www.aseprite.org/docs/cli/), [doc_exporter.cpp](https://github.com/aseprite/aseprite/blob/main/src/app/doc_exporter.cpp), [anidir.cpp](https://github.com/aseprite/aseprite/blob/main/src/doc/anidir.cpp)
- [Phaser — AnimationManager.createFromAseprite](https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Animations.AnimationManager-createFromAseprite); [PixiJS 7 — Sprite sheets](https://pixijs.com/7.x/guides/components/sprite-sheets)

PixelLab and sibling repo (read-only)

- [PixelLab REST OpenAPI](https://api.pixellab.ai/v2/openapi.json) (fetched 2026-10-18: `/characters/{id}/zip`, `/characters/{id}/spritesheet`, `/objects/{id}/spritesheet`, `/vfx`, lip-sync timing schemas); [PixelLab MCP docs](https://api.pixellab.ai/mcp/docs)
- `../pixellab-pip/docs/pixellab-preview-app-research-spike.md` — file:// cruxes, tainting, per-frame delays, candidate selection, "professional" pixel-viewer traits
- `../pixellab-pip/docs/pixellab/pixel-art-gif-friendly-disappearance.md` — GIF 1-bit alpha, semi-alpha risk
- `../pixellab-pip/docs/pixellab/pixellab-dualgrid-tileset-export-system.md` — Wang/dual-grid keys, 4×4 and 4×8 layouts, `pattern_4x4` unreliability
- `../pixellab-pip/skills/pixellab-pip/references/tileset.md` — returned-order rule, Tiles Pro bit semantics
- `../pixellab-pip/skills/pixellab-pip/references/animation.md` — frame-0 echo, frame counts
- `../pixellab-pip/docs/pixellab/rpg-maker-character-sheet-formats.md` — canvas padding, shared-crop normalization, RPG Maker layouts
- `../pixellab-pip/docs/pixellab/pixellab-cinematic-spike.md` — endpoint sets no timing; 100 ms assembly default
- `../pixellab-pip/skills/pixellab-pip/references/vfx-workbench.md`, `../pixellab-pip/skills/pixellab-pip/references/local-asset-assembly.md` — VFX outputs and timing; grid-overlay rule; GIF disposal pitfalls
- `../pixellab-pip/docs/pixellab/pixellab-font-generation-spike.md` — TTF deliverable, 10×8 glyph atlas
