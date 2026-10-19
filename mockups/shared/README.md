# Shared mockup dataset

Sample data and helpers for the PixelLab Gallery mockups (working name; unofficial, not affiliated with PixelLab). Everything here loads from disk (`file://`) with classic scripts:

```html
<script src="../shared/sample-data.js"></script>  <!-- sets window.SAMPLE_DATA -->
<script src="../shared/pixel-utils.js"></script>  <!-- integerScale, PixelTicker, checkerboardCSS -->
```

> **Provenance: review before publishing anywhere.** The images in `assets/` are copies of the user's own PixelLab outputs, made for these local mockups only. A few source frames started from user-supplied reference sprites. Review the images before you publish this folder or any screenshot of it. The four synthetic items listed below were drawn locally.

## Contents

- `assets/`: 178 PNGs, about 3.1 MB. Names are lowercase and descriptive, for example `char-orb-mage-south-east.png` and `char-android-walk-east-f03.png`.
- `sample-data.js`: `window.SAMPLE_DATA = { generatedAt, assets, folders, favorites }`. It has 77 assets, 5 folders and 10 favorites.
- `pixel-utils.js`: small shared helpers (see below).

| Type | Count | What it covers |
|---|---|---|
| `character` | 4 | Orb Mage (8 directions, 64 px), Hooded Orb Mage in two states of one group (8 directions, 128 px canvas), Android Courier (4 directions, plus a Walk animation of 8 frames per direction) |
| `object` | 23 | Bear Trap in open and closed states, with a 9-frame "Snap shut" animation; Treasure Chest in closed and open states; 16 inventory items at 32 px; Crimson Lance (48 px); one `review` object with 4 candidates; one `processing` object with no image |
| `map_object` | 3 | Ruined building (192×192), staircase (48×48), stone steps (16×48, tall and narrow) |
| `map` | 1 | Meadow Ruins, 768×512 (48×32 cells of 16 px). Larger than any thumbnail, so it tests smooth downscaling |
| `tileset_topdown` | 3 | Dirt → grass (two styles) and stone floor → wall. Each is a 4×4 sheet of 16 px tiles |
| `tileset_sidescroller` | 6 | Five 1-bit-style platform sets (4×4 sheets of 32 px tiles) and one dirt/grass set (16 px tiles) |
| `tiles_pro` | 3 | Wooden stairs kit (16 px tiles), and two skill-icon tile sets (32 px tiles) |
| `tile_isometric` | 2 | Grass block and stone slab, 32 px |
| `ui_asset` | 6 | Wide HUDs and kits (688×384 and 688×256), plus an icon-frame sheet (256×256) |
| `creator_image` | 23 | Atlases and sheets (512 and 256 px), a few single sprites, two edit results, and two multi-frame loops (8 frames each) |
| `vfx` | 2 | Meteor Strike (26 frames, 94×121, plays once) and Meteor Fall (9 frames, loops) |
| `font` | 1 | 10×8 glyph atlas, 12 px cells |

The set varies on purpose:

- **Size:** 16×48 up to 768×512.
- **Aspect ratio:** square sprites, a tall 1:3 map object, and wide 2.7:1 UI.
- **Background:** most images are transparent; the block textures and the fox walk loop are opaque.
- **Animation:** looping and one-shot sequences.
- **Status:** `completed`, `review` and `processing`.

## Asset model (draft)

Every asset has these fields:

| Field | Notes |
|---|---|
| `id` | Fake id with a type prefix (`chr_`, `obj_`, `mob_`, `map_`, `tds_`, `sss_`, `tpr_`, `iso_`, `ui_`, `img_`, `vfx_`, `fnt_`). These are **never** real PixelLab UUIDs, because real UUIDs work as access keys. |
| `type` | One of `character`, `object`, `map_object`, `map`, `creator_image`, `tileset_topdown`, `tileset_sidescroller`, `tile_isometric`, `tiles_pro`, `ui_asset`, `vfx`, `font`. |
| `name` | Display name. Character and object **states** reuse the group's name. Tell them apart by `meta.state_name`, and group them by `meta.group_id`. |
| `prompt` | Short neutral prompt. The real API calls this field `prompt` for characters, objects and UI assets, and `description` for the other types. |
| `width`, `height` | Pixel size of `thumb`: the canvas for characters and objects, one frame for VFX and multi-frame images, the whole sheet for tilesets, maps and fonts. |
| `createdAt` / `updatedAt` | ISO timestamps spread over 2026. Only characters have `updatedAt`, as in the API; every other type has `null`. |
| `tags` | API tags exist only on characters and objects. Every other type has `[]`. |
| `source` | `"rest"` or `"mcp"`. Maps and Creator gallery images are MCP-only. VFX and fonts have no list endpoint (they can only be read by job ID), so treat them as imported or job results. |
| `status` | `completed`, `review` or `processing`. |
| `thumb` | Static thumbnail path, relative to a mockup folder (`../shared/assets/…`). It is `null` while an asset is `processing`. |
| `meta` | Type-specific fields. Keys mirror the API's snake_case names: `view`, `directions`, `style_settings` (`outline`, `shading`, `detail`), `state_name`, `group_id`, `tile_type`, `kind`, `seed`, `glyph_px`, and so on. `meta` never holds an image path. |
| `synthetic` | Present (`true`) only on locally drawn items. |

Image paths live only in these top-level fields:

| Field | Used by | Shape |
|---|---|---|
| `directions` | `character`, `object` | `{ south, south_east, east, north_east, north, north_west, west, south_west }`. A 4-direction character has only `south`, `east`, `north` and `west`. A 1-direction object has a single `unknown` key, mirroring the API's `storage_urls.unknown`; hide the direction picker then. `review` and `processing` objects have `{}`. |
| `animations` | `character`, `object` | `[{ id, name, type, frameCount, fps: null, frames: { <direction>: [paths…] } }]`. PixelLab sends no fps or frame timing, so play at a default of 10 fps (100 ms per frame) and let the user override it. |
| `candidates` | `review` objects | Candidate image paths, like the API's `frame_urls`. |
| `frames` | multi-frame `creator_image`, `vfx` | One flat sequence. VFX carries real timing in `meta.fps` and `meta.loop`, plus segment ranges in `meta.tags`. |
| `sheet`, `tileSize`, `grid` | tilesets, `tiles_pro`, `map`, `font` | Sheet image, square tile size in px, and `{ cols, rows }`. Slice the sheet row-major. |

Simplifications compared with the real API:

- Tiles Pro sheets stand in for its per-tile `storage_urls`.
- The map is one rendered image. MCP `view_map` also returns a picture, not JSON.
- Creator `meta.ref` values are fake `gallery:<13-digit>` ids derived from `createdAt`.

`folders` is a list of `{ id, name, assetIds }`, and `favorites` is a list of asset ids. Both exist only in the app, because PixelLab has no folders or favorites.

## Synthetic items

These four items were drawn locally with Pillow because no source exists on disk. Each is marked `"synthetic": true`:

- `iso_0001` Grass Block and `iso_0002` Stone Slab: hand-drawn 32 px isometric tiles.
- `fnt_0001` Tiny Mono: a glyph atlas rendered from Pillow's built-in bitmap font, in the documented 80-glyph order.
- `map_0001` Meadow Ruins: painted cell by cell from the real `tds_0001` dirt → grass tileset (matching Wang corners), with copies of three real sprites placed on top.

Two other items are real outputs, only regrouped:

- `vfx_0002` reuses the first 9 frames of `vfx_0001`.
- The looping animations drop their last frame, which on disk duplicates frame 0.

## pixel-utils.js

- `integerScale(artW, artH, boxW, boxH, dpr = devicePixelRatio)` returns `{ scale, smooth, cssW, cssH }`. `scale` is the largest integer number of device pixels per art pixel that fits the CSS box. When the art is larger than the box, `scale` drops below 1 and `smooth` is true: use `image-rendering: auto` then. Size the element to `cssW × cssH` CSS px. The function returns `null` for an image that has not decoded yet (size 0).
- `PixelTicker.add(fn)` and `PixelTicker.remove(fn)` share one `requestAnimationFrame` loop. Each `fn` receives `(dtMs, nowMs)`, with `dt` capped at 250 ms. `PixelTicker.player(durationsMs, draw)` returns `{ play, stop, seek, step }`, a looping player driven by per-frame durations. Example: `PixelTicker.player(Array(8).fill(100), i => drawFrame(i)).play()`.
- `checkerboardCSS(size = 8, a, b)` returns a conic-gradient `background` value for a checkerboard of squares `size` CSS px wide.
- `pixelUtilsSelfTest()` throws on failure. To run it:

  ```sh
  node -e "const vm=require('vm'),fs=require('fs');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('pixel-utils.js','utf8'),c);console.log(c.pixelUtilsSelfTest())"
  ```
