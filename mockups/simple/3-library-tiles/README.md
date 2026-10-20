# Concept 3: Library Tiles

Modelled on the iOS App Library and the iCloud.com tile home. The first screen has no grid, sidebar or toolbar. It shows six big category tiles (Characters, Objects, Images, Tilesets & tiles, Maps, UI), then Favorites and the user's folders as tiles of the same kind.
Each tile is a mosaic preview of its contents: four big cells when it holds 4 assets or fewer, otherwise three big cells plus a 2×2 mini cluster, as in the App Library. Each tile has a label and a count.
Opening a tile shows a calm square grid with at most 4 controls. Opening an asset shows the art large and centred, with 5 floating controls plus one chip for animated assets.
The only accent colour is the Download button in the viewer. The home and grid screens have no accent at all, because there the primary action is clicking the art.
Everything else is one level away: in a "…" menu, the Download chevron, the animation chip, the ⓘ panel, a hover cue, or a keyboard shortcut.

## Images (1440×900, dark, 2× device scale)

| Image | Screen | Visible controls | Count |
|---|---|---|---|
| `01-home.png` | Library home | Search field, "…" | **2** |
| `02-category.png` | A category opened (shown: All assets) | Back ‹, Search, Select, "…" | **4** |
| `03-detail.png` | Asset viewer (Android Courier, Walk, East, frame 4 of 8) | ✕, ♡, ⓘ, "…", **Download GIF ▾** (a split button: two hit areas, one control), "Walk · East ▾" chip (animated assets only) | **5 + 1** |
| `04-detail-info.png` | Viewer with Info open | The same 6, with ⓘ shown as active, plus Copy (prompt) and "Open in PixelLab ↗" in the panel | **6 + 2** |

Not counted as controls: the tiles and grid cells (content), the "Vitrine" wordmark, the asset title, and the section label "Favorites and folders". In `02`, one cell shows its hover state (select circle, ♡, name). Only the cell under the pointer shows these.

`02` shows All assets rather than Characters, because the sample library has only 4 characters and a one-row grid would not show the grid's density. The header is the same for every category and folder: back, title and count, Search, Select, "…".

## Where every hidden function lives

| Function | Where |
|---|---|
| Types | The home tiles. Search also matches type names as "Go to Characters" rows. |
| All assets | Home "…" → All assets, or press Enter in an empty Search. |
| Folders | Tiles under "Favorites and folders" on the home screen. Inside a folder, its "…" has Rename, Download all (ZIP) and Delete folder. Add to folder… is in the viewer "…" and the selection bar. New folder is at the end of the Add to folder picker. |
| Favorites | A home tile. ♡ in the viewer, ♡ on grid hover, ♡ in the selection bar, and `F`. |
| Sort | Grid "…" → Sort: Newest, Oldest, Name. |
| Grid size | Grid "…" → Thumbnail size: Small, Medium, Large. Browser zoom is left alone. |
| Previews toggle (animate on hover) | Grid "…" → Animate previews. The default is set in Settings. |
| Settings / API key | Home "…" → Settings: PixelLab API key and connection, default backdrop, animate previews, reduced motion. The same menu has Keyboard shortcuts (`?`) and About. |
| Multi-select | The Select button, the hover circle, Shift/Ctrl-click, or long press on touch. The header is replaced by a bar: count, ♡, Add to folder, Download ▾ (ZIP of GIFs, ZIP of sprite sheets, ZIP of frames), ✕. Esc exits. |
| All download formats | The Download chevron lists only the formats this asset supports: GIF, Sprite sheet PNG, Frames ZIP, Current frame PNG, All directions ZIP. The button names its default ("Download GIF", or "Download PNG" for stills). |
| Direction and animation | The "Walk · East ▾" chip opens a 4- or 8-way direction rose and an animation list. ↑/↓ cycle directions. |
| Playback speed, frame step | Click the art or press Space to pause and play. While paused, `,` and `.` step one frame. Viewer "…" → Playback… opens one small popover with speed and frame step. |
| Backdrop | The same Playback… popover: checkerboard, dark, light. |
| Previous / next asset | ← / →, edge arrows on hover, swipe on touch. |
| Open in PixelLab | A quiet text link at the bottom of the ⓘ panel. |
| Prompt, IDs, metadata | The ⓘ panel. Copy is next to the prompt. |

The viewer "…" holds only Add to folder…, Playback…, Copy link and Keyboard shortcuts. No menu opens another menu.

## Phone mapping

- **Home:** large title, Search field under it, "…" at the top right. Tiles in 2 columns, with the same mosaic and labels. Folders follow after the six types.
- **Category:** a nav bar with back ‹, title and count, a search icon that expands into a field, Select and "…". 3-column grid. Tap opens an asset; long press selects.
- **Viewer:** ✕ at the top left; ♡, ⓘ and "…" at the top right. A full-width **Download GIF ▾** sits at the bottom in the thumb zone, with the "Walk · East ▾" chip above it. A horizontal swipe moves to the previous or next asset. Info, download formats and the folder picker open as medium-height bottom sheets.
- **Selection:** the bar is pinned to the bottom with the same items.

## Honest weaknesses

- **An extra click before any asset.** Opening the app never shows art at full size, only mosaics. Nothing recent is on the home screen, so "the sprite I made five minutes ago" means a tile click plus a scan of the grid, or a search.
- **All assets is hidden.** It lives in "…" or behind an empty search. Anyone who browses everything at once will keep reaching for it, and its home is not visible.
- **Small libraries look padded.** A tile with 4 characters is as big as one with 25 images. Six tiles for a new user with 5 assets look empty, so the tile layer should be skipped until a library is large enough. That rule hides the concept's main idea from new users.
- **Mosaics need a picking rule.** Which assets appear (newest, favourites, most varied) is a real product decision. Sheets and atlases crop into busy noise next to single sprites (see the UI tile and the atlas cells in `02`).
- **Mine and automatic look alike.** Folders differ from type tiles only by a faint stacked edge and the "Favorites and folders" label.
- **Mixed categories.** "Images" holds Creator images and VFX together. "Maps" holds one map and three map objects. These groupings are reasonable, but users have to learn them.
- **No filter inside a category.** Search is the only way to narrow a grid. That is simple, but it is weaker than a filter chip once a category holds hundreds of assets.
- **Hover cues don't exist on touch.** Long press and the Select button are the touch equivalents.
- **The split-button chevron is a small target.** It is also the only visible way to reach the other formats.
- **Playback controls are a click away** (the art or "…" → Playback…). Animators who step through frames often will want them visible.

## Files

- `01-home.html`, `02-category.html`, `03-detail.html` (screen 04 is `03-detail.html#info`), `style.css`.
- `art.js` draws integer-scaled pixel art using `integerScale` from `../../shared/pixel-utils.js`.
- `bbox.js` holds the opaque bounding box of each shared asset, so sprites can be trimmed. It was generated with Pillow.
- Images load from `../../shared/assets/`. There are no network requests.
