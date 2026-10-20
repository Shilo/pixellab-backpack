# Concept 1: "Just the Art"

Vitrine is an unofficial, view-only gallery for PixelLab assets. This concept follows the iOS 26 Photos and Unsplash model:

1. The first screen is only art: uniform square cells, integer-scaled pixel art, and no captions at rest.
2. The title is the navigation. "All assets ▾" switches between All, Favorites, the seven types and every folder.
3. There is no sidebar and no bottom pill. The whole first screen has 4 controls.
4. The asset opens on a calm dark stage, playing at the largest integer zoom that fits. Five floating controls, plus one chip when the asset is animated.
5. Everything else is one level away: a menu, the ⓘ drawer, hover, or a keyboard shortcut. Nothing is more than two levels deep.

Desktop dark mode, 1440×900 at 2×. One accent colour (blue), used only on the primary Download button.

## Images

| File | What it shows |
|---|---|
| `01-home.png` | Library grid, with one cell in its hover state |
| `02-detail.png` | Android Courier, Walk east, frame 4 of 8 |
| `03-detail-info.png` | The same screen with the ⓘ drawer open |
| `04-scope-menu.png` | The "All assets ▾" menu open: this menu replaces the sidebar |

Each image has a small HTML source (`01-home.html` and so on). They share `vitrine.css` and `vitrine.js`, and load `../../shared/` data and assets. These files exist only to render the PNGs.

## Visible controls per image

**01-home: 4 controls at rest**
1. "All assets ▾" (title and scope switcher)
2. Search field, with a `/` hint
3. Select
4. "…"

On hover (desktop only), a cell also shows a selection circle, a ♡ and the asset's name. This is an accelerator, not a fifth control.

**02-detail: 5 controls + 1 conditional = 6**
1. ✕ Close
2. ♡ Favorite
3. ⓘ Info
4. "…" More
5. "Download GIF ▾", a split button: the label downloads, the chevron opens the format menu. This is the only accent-coloured element.
6. "Walk · East ▾", shown only for assets with animations or directions.

**03-detail-info: the same 6, plus 4 inside the drawer**
The ⓘ button shows a filled "on" state. The drawer adds Copy (prompt), two folder rows (each opens that folder) and "Open in PixelLab ↗". Everything else in the drawer is read-only text in a grouped list.

**04-scope-menu: the same 4, plus 15 menu rows**
- All assets ✓ and Favorites
- Types: Characters, Objects, Images, Tilesets, Tiles, Maps, UI
- Folders: the 5 folders
- New folder…

Each row has a count. Each type and folder row leads with a tiny thumbnail of its own art, so the menu stays visual.

## Why folders live in the switcher, not a bottom pill

I chose the switcher. It keeps the first screen at 4 controls instead of 5. It also keeps "where am I" and "go somewhere else" in one place, the title. A desktop page with a bottom-centred tab pill is unusual (see research 11, Concept C), and a pill would be a second navigation surface beside the title. Folders still appear as a labelled section, so they can be discovered. They can also be reached by searching for a folder name ("Go to folder").

## Where every hidden function lives

| Function | Where it lives |
|---|---|
| Types | "All assets ▾" → Types section. Search also matches type names. VFX and fonts are grouped under Images, so the menu keeps the 7 types. |
| Folders | "All assets ▾" → Folders, and "New folder…". When a folder is the current scope, a "…" next to its title holds Download all / Rename / Delete folder. The asset's folders are also listed in the ⓘ drawer. |
| Add to folder | Detail "…" → Add to folder…, and the Select-mode bar |
| Favorites | ♡ on the detail screen, ♡ on hover in the grid, `F`; "All assets ▾" → Favorites |
| Sort | Library "…" → Sort by (Recent, Name, Type) |
| Grid size | Library "…" → Grid size (Small, Medium, Large); also `Ctrl/⌘ +/-` inside the grid only, never hijacking browser zoom |
| Animated previews toggle | Library "…" → "Play animations on hover" (on by default; still frames otherwise; off with reduced motion) |
| Settings / API key | Library "…" → Settings… (connection, API key, about) |
| Multi-select | "Select", Shift/Ctrl/⌘-click, or the hover circle. A floating bottom bar appears: "N selected · Download ▾ · Add to folder · ♡ · ✕". Esc exits. |
| All download formats | The "Download GIF ▾" chevron: GIF · Sprite sheet · All frames (ZIP) · PixelLab original. Only the formats an asset supports are listed. Stills default to "Download PNG". |
| Animation and direction | The "Walk · East ▾" chip: animation list plus a 4- or 8-way direction rose. Arrow keys ↑/↓ cycle directions. |
| Playback speed and frame step | Click the art or press Space to pause. While paused, ←/→ step one frame. The chip's popover also has a speed row (0.5× · 1× · 2×) and Pause / step buttons, as the visible twin of the shortcuts. |
| Backdrop | Detail "…" → Backdrop (Dark, Checker, Light) |
| Open in PixelLab | Quiet link at the bottom of the ⓘ drawer, and Detail "…" |
| Previous / next asset | `[` / `]` keys and edge hover arrows on desktop; swipe on phone. Listed under "…" → Keyboard shortcuts. |
| Keyboard shortcuts | Library "…" → Keyboard shortcuts (`?`) |

## Phone mapping

- **Library:** the same 4 controls. The title switcher sits top left. Search shrinks to an icon that expands into a field, and Select and "…" sit top right. The grid is 3 columns with no hover state. Tap opens an asset; long-press enters Select.
- **Scope menu:** opens as a medium-height bottom sheet with the same rows.
- **Detail:** ✕, ♡, ⓘ and "…" in the top bar. A full-width "Download GIF ▾" at the bottom, in the thumb zone. The "Walk · East ▾" chip sits just above it. Swipe left/right moves between assets. Direction is not bound to swipe, so the gesture means one thing.
- **Info:** a bottom sheet with a grabber, holding the same grouped list.

## Honest weaknesses

- **Folders are two clicks away and have no overview.** That is acceptable with 5 folders. With 30 or more, the menu needs its own search field or an "All folders…" row, and starts to grow back into the rejected sidebar.
- **No captions means look-alikes are ambiguous.** The two Bear Trap states, the two Hooded Orb Mage states and the twin goblin images are hard to tell apart without hover, and touch has no hover. A "Show names" option in the library "…" may be needed.
- **Thumbnails lose size and some detail.** Cropping each thumbnail to its content makes a 16×48 staircase look as big as a 192 px building. Atlases, UI kits and fonts shrink into confetti at cell size. Telling small from large needs the ⓘ drawer.
- **The detail screen does not show the asset name** (as briefed). You must open ⓘ to learn what you are looking at. A name shown briefly on open, then faded, would help.
- **Type filtering is buried.** Switching types takes a menu every time. If people switch types often, a quiet chip row would need to come back.
- **"…" menus are junk-drawer risks.** The detail "…" already holds Add to folder, Backdrop, Open in PixelLab, Copy link and shortcuts. That is at the 6-item ceiling.
- **Glass controls over busy art.** Large, bright assets (maps, UI sheets) under translucent controls need a stronger scrim than the dark character shown here.
- **Not shown in these mockups:** review and processing states, empty states, Select mode, and the Download menu.
- **Mockup shortcut:** thumbnail cropping reads pixel data. The render browser was allowed file access to do that; a real app would compute the bounds from the images it fetches.
