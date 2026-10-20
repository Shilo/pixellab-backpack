# 12: Simplicity-first products (outside Apple and Google): patterns for a minimal Vitrine

Research date: 2026-10-19. Scope: products known for radical simplicity that keep most of their functionality. The goal is to pull out progressive-disclosure patterns for Vitrine, a view-only, dark-mode-first PixelLab asset gallery for desktop web that has to work on mobile too.

## Method and evidence quality

- **Sources.** Two live pages (Unsplash, Lospec) were fetched and inventoried on 2026-10-19. The rest comes from official docs, changelogs and blogs (Figma, Linear, Midjourney, Raycast, Cultured Code, Glass, Are.na, Aseprite, Adobe), plus a small number of third-party reviews and design critiques. A source that is secondary or old is labeled as such.
- **Not verified in this pass.** No reliable 2024–2026 sources turned up for Darkroom, Bear, Craft, Dia, Netflix, Steam Big Picture, itch.io, Pinterest's current close-up, Spotify's full-screen view, or Midjourney's Explore page. These are listed under "Gaps" and are not used as evidence below.
- **Data-extraction caveats.** Fetched pages were read through an HTML-to-text pass. Icon-only controls appear under their accessibility names, for example "A forward-right arrow" for Share. The Midjourney help article returned HTTP 403, so its facts come from search snippets of that official page.

---

## 1. Pattern catalog

| # | Pattern | Product (evidence) | What it hides | Discovery cue | How Vitrine should use it |
|---|---|---|---|---|---|
| P1 | **One labeled primary button, with a chevron for variants** | Unsplash photo page: a single "Download free" button plus a "Chevron down" toggle; Share, Info and More are icon-only and sit below the photo ([Unsplash photo page, fetched 2026-10-19](https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q); a green "Download free" button in the upper right is also described by the [CUNY guide](https://pressbooks.cuny.edu/studentguideopenimages/chapter/finding-images-on-unsplash/)) | Size and format variants | The text label plus a visible chevron | **Download (GIF) ▾** on the detail screen. The chevron opens Sprite sheet PNG, Frames ZIP, and Current frame PNG. This is the only text-labeled, accent-colored control on that screen. |
| P2 | **Secondary actions grouped as quiet icons** (Share / Info / More) | Unsplash: three icons below the photo. Stats, EXIF and similar data are not on the page itself ([Unsplash](https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q)) | Metadata, share, report, and other rare actions | Standard icon glyphs, each with a tooltip | One trailing cluster: ♡ Favorite, (i) Info, … More. Metadata never shows inline by default. |
| P3 | **Info on demand (drawer or modal)** | Unsplash "Info" icon. The page shows no views or downloads counts until Info is opened ([Unsplash](https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q)). Glass instead *foregrounds* EXIF because EXIF is its core content ([Glass help](https://glass.photo/help/what-is-glass)). | Dimensions, frames, directions, created date, prompt, IDs | (i) icon, also the `I` key | A right-side drawer on desktop and a bottom sheet on mobile. The drawer remembers its open or closed state. Its first lines are size · frames · fps · directions; the prompt and raw fields sit behind "Show all". |
| P4 | **Minimize chrome; the panel returns on selection** | Figma UI3 "Minimize UI" (Ctrl/⌘ Shift \\) collapses both side panels. Selecting an object expands the right panel temporarily, and deselecting minimizes it again. "Hide UI" (Ctrl/⌘ \\) also removes the toolbar and nav ([Figma Help](https://help.figma.com/hc/en-us/articles/41414918021271-Hide-or-minimize-the-UI)). UI3 offers no way to hide just one side ([Figma forum](https://forum.figma.com/t/new-ui-minimize-ui-functionality/87847)). | Navigation panels and properties | A sidebar toggle in the nav, plus the shortcut | Never show a persistent sidebar. Contextual UI (the bulk bar, the info drawer) appears only while something is selected or open. Offer a "Hide UI" key (`H` or `\`) for a pure-canvas viewing mode. |
| P5 | **Chrome that recedes rather than disappears** | Linear refresh (2026-03-12): sidebar "a few notches darker", fewer and softer borders, smaller icons, compact tab pills, header actions in predictable places. Principles: "Don't compete for attention you haven't earned" and "Structure should be felt not seen" ([Linear](https://linear.app/now/behind-the-latest-design-refresh)). The 2024 redesign also aimed at less sidebar and header clutter ([Linear changelog 2024-03-20](https://linear.app/changelog/2024-03-20-new-linear-ui)). | Nothing is removed; hierarchy comes from contrast | Controls stay visible but quiet | The top bar uses low-contrast neutral text and icons, with no borders between bar and grid. Only the art and the single primary button carry full contrast or accent color. |
| P6 | **Command palette as the "everything else" layer** | Raycast: ⌘K opens the Action Panel from anywhere, and Return always runs the primary action ([Raycast manual](https://manual.raycast.com/action-panel)). The action bar shows each contextual action *with its shortcut*, so users learn shortcuts over time ([Raycast blog](https://www.raycast.com/blog/a-fresh-look-and-feel)). | Every rare action, filter or navigation target | A visible "⌘K" hint inside the search field; shortcuts printed next to each action | Search and the palette share one field. Typing searches assets. Typing `>` or pressing ⌘K lists actions: go to folder, filter by type, download as…, grid size, toggle background. Each row shows its shortcut. |
| P7 | **Type-to-go navigation instead of a sidebar** | Things 3 Quick Find starts searching when you type, with no shortcut needed. It matches to-dos, projects, areas and tags, and Cmd-F also opens it ([Cultured Code support](https://culturedcode.com/things/support/articles/2803584/)). Since 3.11, built-in lists are reachable this way too ([The Sweet Setup](https://thesweetsetup.com/things-3-11-brings-big-improvements-to-quick-find-feature/)). | List and folder navigation | The search field is always visible; typing anywhere focuses it | Folders, Favorites and asset types appear in search results as "Go to…" rows, so the sidebar is unnecessary. |
| P8 | **One multipurpose control instead of many** | Things 3 Magic Plus: tap to add, or drag it onto a list, a position or a day to add there contextually ([Curtis McHale](https://curtismchale.ca/2020/10/26/magic-button-things-3); [Tools and Toys](https://toolsandtoys.net/things-3-for-ios-apple-watch-and-mac/)) | Several "add here" buttons | The always-visible button; drag is an optional accelerator | Vitrine has no "create" action. The analogue is drag-to-folder: drag one card or a selection onto the scope switcher to file it. The menu path stays the main route. |
| P9 | **Selection reveals a bulk action bar** | Midjourney Organize: Shift-click or click-and-drag selects. A bulk actions bar offers "More → Add to Folder", and drag-onto-folder also works. Hovering a folder shows "…", which contains "Download" ([Midjourney docs](https://docs.midjourney.com/hc/en-us/articles/33329462451469); folders launched ~Feb 2025 per [Geeky Curiosity](https://geekycuriosity.substack.com/p/midjourney-organizing-your-images)). In Things 3 on Mac, selecting items exposes a bottom toolbar with Move ([Cultured Code](https://culturedcode.com/things/support/articles/9651894)). | All bulk actions | Appears only once something is selected | A floating bottom bar: "N selected · Download · Add to folder · ♡ · ✕". It does not exist when nothing is selected. |
| P10 | **An explicit "Organize" mode for bulk work** | Pinterest boards: click "Organize", tick checkboxes, then Move, Copy or Delete. Bulk work is only possible inside a board, not from the feed, and bulk moves can't be undone ([Tailwind](https://www.tailwindapp.com/blog/?p=13778); sources disagree on whether the cap is 50 or 100 pins). | Checkboxes and bulk actions | An "Organize" button | A small **Select** button in the top bar is the discoverable entry point. Shift-click, Ctrl/⌘-click and long-press are accelerators into the same mode. |
| P11 | **Hover-revealed controls on items** | Notion shows the same ⋮⋮ handle on every block on hover, and the "/" menu hides 50+ block types behind one key ([Blake Crosley design study](https://blakecrosley.com/guides/design/notion), third-party). A KDE guideline thread adopts "hidden until hover on desktop; tap or drag handle on mobile", though one participant asks whether users can guess what the handle does ([KDE Phabricator T8749](https://phabricator.kde.org/T8749)). Midjourney reveals a folder's "…" on hover ([Midjourney docs](https://docs.midjourney.com/hc/en-us/articles/33329462451469)). | Per-item favorite, select and quick-download controls | Hover only, so there is no cue at rest | Use on desktop cards for the ♡ and the selection circle **only**. Every hover action must also exist somewhere visible (in detail view, the Select mode or the palette). On touch, a long-press selects. |
| P12 | **Edge-reveal sidebar** | Arc auto-hides its sidebar until the cursor reaches the left edge, and drops the top toolbar while the sidebar is in use ([Orion feedback thread](https://orionfeedback.org/d/4945-make-focus-mode-more-like-the-arc-browser)). Arc went into maintenance mode in May 2025 as the company moved to Dia ([SupaSidebar](https://supasidebar.com/blog/how-to-replicate-arc-features-any-browser-mac), third-party). | Folder and tab navigation | Effectively none; it relies on learned behavior | **Do not use.** Nothing hints that it exists, and it breaks on touch. P7 combined with a scope dropdown covers folder access. |
| P13 | **Automatic by default, with one deliberate step to manual** | Halide was framed as a middle ground between the stock camera and "cockpit"-style pro apps. Auto is the default and one tap switches to manual; on iPad, a downward swipe reveals more options ([Lux](https://www.lux.camera/introducing-halide/); [MacStories](https://www.macstories.net/reviews/lux-delivers-an-ipad-version-of-halide-that-addresses-the-unique-challenges-of-ipad-photography/)). It won an Apple Design Award in 2022 for hiding pro controls behind gestures, per a [third-party study](https://blakecrosley.com/guides/design/halide). | Pro playback controls | One clearly placed toggle | The animation autoplays at its native fps and integer zoom. Speed, frame-step, onion-skin and background live in a single "playback" popover reached from a small control on the canvas. |
| P14 | **Focus mode** | iA Writer launched with essentially two options, Full Screen and Focus Mode. Focus dims everything except the current sentence and full screen removes the chrome ([dbushell, 2011](https://dbushell.com/2011/05/28/simplicity-in-ui-design-ia-writer-for-mac/); [Hack Design](https://www.hackdesign.org/toolkit/ia-writer/)). In Lightroom Classic, Tab hides the side panels, Shift-Tab hides all panels and F goes full screen ([Adobe shortcuts](https://helpx.adobe.com/ph_en/lightroom-classic/help/keyboard-shortcuts.html)). | All chrome | A shortcut and a menu item | `F` makes the detail canvas fill the screen (Fullscreen API) with only the art and a close affordance. `H` hides the top bar in the grid. |
| P15 | **No vanity metrics; content first** | Glass shows no public like counts, uses a chronological feed, and keeps appreciations private ([Glass help](https://glass.photo/help/what-is-glass); [Glass appreciations](https://Glass.photo/highlights/appreciations-are-here)). VSCO Grid was positioned with "no follower counts, no likes, no comments" ([liisten via Pixel Envy](https://pxlnv.com/linklog/vsco-grid-wants-to-be-a-museum/), ca. 2014). Are.na has no like, share or comment buttons ([Pratt IxD critique, 2025](https://ixd.prattsi.org/2025/02/design-critique-are-na-ios-app/)). | Social counters | n/a | Vitrine is private and view-only, so it shows no counts or badges on cards at all, just the art. |
| P16 | **Content as the focal point; wide canvas** | Dribbble's shot page went "almost full width", up to 1400px, with the shot as the main focus ([Dribbble, 2020-10-14](https://dribbble.com/stories/2020/10/14/new-improved-shot-pages)). Older and pre-2024, but still the pattern. | Surrounding UI | n/a | The detail screen gives most of the viewport to the canvas at the largest integer scale that fits. All UI hugs the edges. |
| P17 | **Single "Connect" verb for organization** | Are.na: one "Connect" action from any block opens a dialog to add it to channels. Hovering a connection previews the channel ([Are.na help](https://help.are.na/getting-started/connections)). Midjourney also lets an image live in several folders ([Midjourney docs](https://docs.midjourney.com/hc/en-us/articles/33329462451469)). | The folder tree | One labeled verb | Use one verb, **"Add to folder…"**: a searchable picker with recent folders first and "New folder" at the bottom (Pinterest's old board picker also shows recent boards first, with search: [TechCrunch](https://techcrunch.com/?p=1140287)). An asset can be in several folders. |
| P18 | **Plain list of download formats** (counter-example) | Lospec palette page: a "Downloads" heading followed by 9 plain links (Open In App…, PNG 1x/8x/32x, PAL, ASE, Paint.net TXT, GIMP GPL, HEX) ([Lospec Sweetie 16](https://lospec.com/palette-list/sweetie-16), fetched 2026-10-19) | Nothing | n/a | Readable on a dedicated page, but a wall of options for Vitrine. Put formats inside the P1 chevron menu instead. |
| P19 | **Simplest sprite preview** | Aseprite Preview window: F7 or View > Preview toggles it. It has a play button, and Shift+Enter plays the animation (or the current tag) ([Aseprite docs](https://www.aseprite.org/docs/preview-window/)) | Timeline and editing UI | One play button | The canvas *is* the preview. Click or Space toggles play and pause, ←/→ steps frames while paused, and there is no visible timeline. |

### Which patterns stay discoverable and which hide too much

- **Stay discoverable.**
  - A labeled primary button with a chevron (P1).
  - A recognisable icon trio (P2).
  - A search field that shows its ⌘K hint (P6, P7).
  - Contextual bars that appear in response to the user's own action, i.e. selection (P4, P9).
  - An explicit Select button (P10).

  In each case the user either sees the trigger or caused the UI to appear. This matches NN/g's guidance that the trigger for advanced features belongs "in a clearly visible spot" with a label that gives strong information scent, and that disclosure should stop at two levels ([NN/g, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Hide too much.**
  - The edge-reveal sidebar (P12).
  - Hover-only actions with no visible duplicate (P11 used alone).
  - Gesture-only features such as Things' drag targets (P8), unless a tap path also exists.

  NN/g's hidden-navigation study (179 participants, six sites) found worse discoverability and slower task times when main navigation was hidden behind an icon. One summary reports 39% slower on desktop and 15% slower on mobile ([NN/g video](https://www.nngroup.com/videos/hamburger-menus/); [Smart Insights summary](https://www.smartinsights.com/digital-marketing-strategy/are-hamburger-menus-hidden-navigation-good-for-ux/)). The reported discoverability drop differs between summaries ("almost in half" vs. "20%"), so read the original before quoting a number.

---

## 2. Element inventories (visible controls)

"Visible" means rendered at rest, with no hover, selection or open menu.

### A. Unsplash (photo page, fetched 2026-10-19)

**Main / header bar (shared with grid pages), as extracted.** The extraction lists about 14 labeled items:
- Logo
- Photos, Illustrations, Explore
- Collections icon
- Download, Bookmark, Account
- Language
- Menu
- Visual search
- "Get Unsplash+", "Log in", "Submit an image"

Several of these are probably responsive duplicates rather than items shown together at one breakpoint. Sources: [Unsplash photo page](https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q) and the [Unsplash+ page](https://unsplash.com/photos/a-set-of-colorful-buttons-with-different-symbols-Qd1pOWAcdfI). For a free product, the header is the busy part.

**Detail.**
- Above the photo: creator avatar + name, Bookmark, "Edit image" (Unsplash+ upsell), **"Download free"** with a chevron (the primary action).
- Below the photo: "Featured in" link, Share, Info, More Actions, published date, license link.

There are no on-page stats, likes or tags for that photo. Unsplash+ items swap the primary button for a locked "Download" and drop the chevron.

**Lesson:** about 6 controls carry the page. The single text-labeled primary control is a download with variants, and everything about the photo sits behind (i).

### B. Midjourney Organize (docs, 2025)

**Main.** The Organize page is reached from the left sidebar. It shows a folder menu (with "New Folder"), the image grid, and filters. On hover, a folder shows "…" with Download.

**Selection state.** Shift-click or drag selects. A bulk actions bar appears with "More → Add to Folder", and items can also be dragged onto folders. One image can belong to several folders.

Source: [Midjourney docs](https://docs.midjourney.com/hc/en-us/articles/33329462451469). A complete at-rest inventory couldn't be built because the page returned 403. **Lesson:** downloading a whole folder is one hover menu away, and bulk actions exist only while something is selected.

### C. Figma UI3, minimized (Help Center, undated page)

**Main (minimized).**
- The canvas.
- The toolbar.
- A minimized nav/left-sidebar affordance, where the left sidebar can be clicked to expand.

**With a selection.** The right properties panel expands temporarily and collapses again on deselect. "Hide UI" leaves only the canvas.

Source: [Figma Help](https://help.figma.com/hc/en-us/articles/41414918021271-Hide-or-minimize-the-UI). **Lesson:** panels belong to the selection, not to the layout.

### D. Raycast (manual and blog)

**Main.** A search field, then the results list. The bottom action bar shows the primary action (Return) and an "Actions ⌘K" hint, with shortcuts displayed.

**Detail (⌘K).** The Action Panel is a filtered list of every action for the selected item, each with its shortcut.

Sources: [Raycast manual](https://manual.raycast.com/action-panel), [Raycast blog](https://www.raycast.com/blog/a-fresh-look-and-feel). **Lesson:** two visible things (a field and a hint) unlock everything, and the UI itself teaches the shortcuts.

### E. Lospec palette page (fetched 2026-10-19), a dense counter-example

**Detail.**
- Title, 16 swatches.
- Hashtag share links for BSKY, MSTDN, INSTA and X.
- "Downloads", with 9 links and a "How to import palettes" link.
- Four example artworks, plus "Submit" and "Queue" links.
- "Art Using This Palette".
- Tags.
- A like count.

That adds up to about 20 interactive items. Source: [Lospec](https://lospec.com/palette-list/sweetie-16). **Lesson:** this is functional and well liked in the pixel-art community, but it is exactly the "wall of buttons" Vitrine should fold into a single Download ▾.

(Additional reference: Things 3 at rest is the list plus a Magic Plus button, with a bottom toolbar (Move and so on) appearing after selection on Mac ([Cultured Code](https://culturedcode.com/things/support/articles/9651894)). A full at-rest inventory for the Things window wasn't sourced.)

---

## 3. Recommendations for Vitrine

### R1. Visible-by-default budget for the library (first) screen: 4 controls plus the grid

| Visible control | Notes |
|---|---|
| 1. **Scope switcher**, shown as the page title with a chevron, e.g. "All assets ▾" | Opens a short menu: All · Favorites · each asset type · Folders (recent folders, then "All folders…"). This replaces the sidebar (P7, P17). |
| 2. **Search field** with a "⌘K" hint | Searches names and prompts, matches folders and types as "Go to…" rows, and `>` or ⌘K turns it into the command palette (P6). |
| 3. **Select** button (text) | The explicit entry into multi-select (P10). |
| 4. **"…" menu** (or an avatar) | Account/connection, grid density, background, shortcuts list, about. Low traffic. |
| Grid | Thumbnails only: no names, counts or badges at rest (P15). Pixel-art thumbnails are drawn at integer scale. |

**Hidden but reachable:**
- On card hover (desktop), show ♡ and a selection circle (P11), plus the name as a caption.
- An animated asset (character/object animation) plays on hover. At rest it shows its first frame (see Pitfalls).
- Type filters live in the scope switcher and the palette. If usage data later shows type switching is frequent, *then* promote a quiet segmented chip row, which is the only allowed growth of this budget.

### R2. Visible-by-default budget for the asset detail screen: 5 controls plus 1 conditional

| Visible control | Notes |
|---|---|
| 1. **Close / Back** (top left; Esc) | |
| 2. **Asset name** (title text, not a control) | |
| 3. **Download (GIF) ▾**, the only accent-colored control | The chevron offers Sprite sheet PNG · Frames ZIP · Current frame PNG · (for multi-direction characters) All directions ZIP (P1). The label states the default format so the click is predictable. |
| 4. **♡ Favorite** | |
| 5. **(i) Info**, which toggles the right drawer | The drawer shows a summary line (size, frames, fps, directions, type, created) and "Show all" for the prompt, IDs and raw fields (P3). |
| 6. **"…" More** | Add to folder…, Copy link, Open in PixelLab, Previous/Next hints. |
| Conditional: **animation/direction pill** under the canvas, e.g. "Walk · South ▾" | Rendered only for assets with more than one animation or direction. It opens a compact picker with a 4- or 8-way direction rose plus an animation list. Arrow keys cycle directions. |

**The canvas itself:**
- Autoplays at native fps and the largest integer zoom that fits (P13, P16, P19).
- Click or Space toggles play and pause. While paused, ←/→ steps frames.
- A small playback control appears on canvas hover (speed, onion skin, background checker/solid, zoom) in **one** popover.
- `F` is focus/fullscreen (P14). Previous and next asset are reached with the [ and ] keys or swipe.

### R3. Organization without a sidebar

- Folders are reached three ways, all labeled:
  - the scope switcher (R1-1);
  - search/palette "Go to folder";
  - "Add to folder…" in the detail "…" menu and the bulk bar.
- The picker lists recent folders first, has a search box, and ends with "New folder" (P17).
- Dragging cards onto the scope title is an optional accelerator (P8, P9).
- Favorites is a built-in scope, not a separate page.
- Folder-level actions (Download all, Rename, Delete folder) sit in the "…" next to the folder name when the folder is the current scope. This is Midjourney's folder "… → Download" (P9), with the "…" visible rather than hover-only.

### R4. Multi-select and bulk download

- **Entry:** the Select button, Shift/Ctrl/⌘-click, drag-marquee (desktop), or long-press (touch). All of these enter the same mode (P9, P10).
- **In selection mode:**
  - A floating bottom bar shows **"N selected · Download ▾ · Add to folder · ♡ · Select all · ✕"**.
  - The top bar stays unchanged so the user keeps their place.
  - Esc exits.
- **Bulk Download ▾:** "ZIP: GIFs" / "ZIP: sprite sheets" / "ZIP: frames". The default is labeled. One click produces one ZIP with a progress toast. Never open a dialog with many checkboxes.

### R5. Make the command palette the single home for rare actions, and show shortcuts in it

Every action in a menu also appears in the palette, with the **same label** and its shortcut shown beside it. That way the palette is an accelerator, not a second, differently named path (Raycast P6; NN/g warns against multiple paths unless every path is clearly labeled, [NN/g](https://www.nngroup.com/articles/progressive-disclosure/)). The "…" menu ends with "Keyboard shortcuts (?)".

### R6. Recede the chrome instead of removing it

- Top bar: neutral, low-contrast text and icons, no divider line, no background fill until the page scrolls (P5).
- Full contrast goes to the art, and the accent color goes to **only** the one primary action on screen.
- This is how "one primary action per screen" looks in practice:
  - Library: open an asset, by clicking a card. The grid *is* the primary action, so the library has no accent button.
  - Detail: Download.
  - Selection: Download in the bulk bar.

### R7. Hover is an accelerator, never the only path

Each hover-revealed control has a visible twin:

| Hover control | Visible twin |
|---|---|
| Card ♡ | Detail ♡ |
| Card selection circle | Select button |
| Canvas playback popover | Palette "Playback speed…" and the shortcuts |

On touch devices, cards show no hover affordances. Tap opens the asset and long-press selects (KDE / Notion precedent, P11).

### R8. Mobile translation (same budget, different placement)

- **Library:** scope title, a search icon that expands into a field, Select, and "…".
- **Detail:**
  - Close, ♡, (i) and … in the top bar.
  - A full-width **Download (GIF) ▾** at the bottom (thumb zone, like Halide's controls "under your thumb", [MacStories](https://www.macstories.net/reviews/lux-delivers-an-ipad-version-of-halide-that-addresses-the-unique-challenges-of-ipad-photography/)).
  - Info, the download-format menu and the folder picker open as bottom sheets.
  - The direction pill sits under the canvas. A horizontal swipe on the canvas moves to the previous or next asset. Avoid also binding swipe to direction changes, which would conflict.
- **Bulk bar:** pinned to the bottom, with the same items.

### R9. Two disclosure levels, no deeper

Level 0 is the visible budget. Level 1 is a chevron menu, the info drawer, a bottom sheet, the palette, or the bulk bar. Nothing opens a menu inside a menu. The only exception is the info drawer's "Show all", which is an in-place expansion, not a new layer ([NN/g: more than two levels "typically have low usability"](https://www.nngroup.com/articles/progressive-disclosure/)).

---

## 4. Pitfalls

1. **Hover-only and edge-only UI.** These have no cue at rest and don't exist on touch. Hidden navigation measurably slowed users in NN/g testing ([NN/g](https://www.nngroup.com/videos/hamburger-menus/)), and Arc's edge sidebar depends entirely on learned behavior ([Orion feedback](https://orionfeedback.org/d/4945-make-focus-mode-more-like-the-arc-browser)). Use them only as accelerators (R7).
2. **"…" as a junk drawer.** If "…" holds frequent actions, the split is wrong. NN/g: put what users frequently need up front, and use frequency data to decide ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)). Keep each "…" to 6 items or fewer.
3. **Removing a feature instead of hiding it.** Glass's no-likes stance pushed users toward comments that were "likes in disguise", adding friction ([Birchtree](https://birchtree.me/blog/i-think-glass-should-add-likes)). A critic left iA Writer because text size couldn't be changed ([Hack Design / review roundup](https://www.hackdesign.org/toolkit/ia-writer/)). The owner's requirements (folders, favorites, all download formats, metadata) must all stay reachable within two levels.
4. **Icon-only primary actions.** Unsplash text-labels only its primary button ([Unsplash](https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q)). Vitrine should do the same, and every icon needs a tooltip and an `aria-label`.
5. **Invisible keyboard power.** Shortcuts nobody sees don't simplify anything. Print them next to actions, as Raycast does ([Raycast blog](https://www.raycast.com/blog/a-fresh-look-and-feel)).
6. **Too much motion.** A grid where every character animates at once is visual noise and costs CPU. Animate on hover or in view only, and respect `prefers-reduced-motion`. (This is an inference: no sourced study on animated thumbnail grids was found.)
7. **Dimming chrome below legibility.** Linear's dimming is "a few notches" ([Linear](https://linear.app/now/behind-the-latest-design-refresh)), not invisibility. Keep text and icon contrast at WCAG AA or better even for "quiet" controls.
8. **Silent modes.** Selection mode must be unmistakable (the bar plus a count) and must exit with Esc or ✕. Pinterest notes bulk moves can't be undone ([Tailwind](https://www.tailwindapp.com/blog/?p=13778)). Vitrine's bulk actions are non-destructive, but "Remove from folder" should offer Undo in a toast.
9. **Ambiguous defaults on split buttons.** "Download" with no format named makes the click a gamble. Label the default ("Download GIF") and let the chevron change it.
10. **Gesture overloading on mobile.** One gesture should mean one thing per surface (R8). Things gets away with drag-to-place because tapping still works ([Tools and Toys](https://toolsandtoys.net/things-3-for-ios-apple-watch-and-mac/)).

---

## Gaps

- **Unsplash.** No 2024–2026 source describes the contents of the Info modal or the options in the Download chevron. Earlier versions showed a hover-only download arrow on grid cards ([App State tutorial](https://writing.appstate.edu/aportfolio/student-tutorials/designing/unsplash), undated).
- **Products with no current-version sources found.** Cosmos element view and organize UI (the homepage only shows nav, collections and a "Find similar elements" claim: [cosmos.so](https://www.cosmos.so/)), Pinterest's 2025 close-up, Midjourney's 2025 Explore layout, Darkroom, Bear, Craft, Dia's minimal-UI behavior, Netflix-style poster browsing, Steam Big Picture, itch.io page layout.
- **Spotify.** Only the 2023 desktop redesign (a resizable, hideable right "Now Playing" panel) was found ([Engadget](https://www.engadget.com/spotify-desktop-app-gets-a-new-look-and-upgraded-library-features-184540624.html); [Spotify newsroom](https://newsroom.spotify.com/tag/desktop-redesign)). The 2024–2025 full-screen view is unconfirmed.
- **Lightroom.** Web/"simplified" modes weren't found. Only Lightroom Classic's panel-hiding shortcuts are sourced.
- **Things 3.** No source confirms Mac multi-select gestures beyond the selection plus bottom-toolbar Move flow.
- **Data.** No quantitative study was found on hover-reveal discoverability specifically, or on animated thumbnail grids.

## Sources

- Unsplash photo page (fetched 2026-10-19): https://unsplash.com/photos/a-river-running-through-a-lush-green-forest-filled-with-trees-mWztzk66I7Q
- Unsplash+ page (fetched 2026-10-19): https://unsplash.com/photos/a-set-of-colorful-buttons-with-different-symbols-Qd1pOWAcdfI
- CUNY open-images guide: https://pressbooks.cuny.edu/studentguideopenimages/chapter/finding-images-on-unsplash/
- Midjourney Organizing Your Creations: https://docs.midjourney.com/hc/en-us/articles/33329462451469
- Geeky Curiosity (Feb 2025): https://geekycuriosity.substack.com/p/midjourney-organizing-your-images
- Linear, Behind the latest design refresh (2026-03-12): https://linear.app/now/behind-the-latest-design-refresh
- Linear changelog 2024-03-20: https://linear.app/changelog/2024-03-20-new-linear-ui
- Figma Help, Hide or minimize the UI: https://help.figma.com/hc/en-us/articles/41414918021271-Hide-or-minimize-the-UI
- Figma forum, minimize UI: https://forum.figma.com/t/new-ui-minimize-ui-functionality/87847
- Raycast manual, Action Panel: https://manual.raycast.com/action-panel
- Raycast blog, A fresh look and feel: https://www.raycast.com/blog/a-fresh-look-and-feel
- Cultured Code, Quick Find: https://culturedcode.com/things/support/articles/2803584/
- Cultured Code, moving to-dos: https://culturedcode.com/things/support/articles/9651894
- The Sweet Setup, Things 3.11 Quick Find: https://thesweetsetup.com/things-3-11-brings-big-improvements-to-quick-find-feature/
- Curtis McHale, Magic button: https://curtismchale.ca/2020/10/26/magic-button-things-3
- Tools and Toys, Things 3: https://toolsandtoys.net/things-3-for-ios-apple-watch-and-mac/
- Pinterest 2019 pin format: https://www.socialmediatoday.com/news/pinterest-begins-rolling-out-an-updated-pin-format/565628
- Pinterest board picker (TechCrunch): https://techcrunch.com/?p=1140287
- Tailwind, moving pins: https://www.tailwindapp.com/blog/?p=13778
- Pratt IxD Pinterest critique (2024): https://ixd.prattsi.org/2024/09/design-critique-pinterest-ios-app-2/
- Notion design study (third-party): https://blakecrosley.com/guides/design/notion
- KDE Phabricator T8749: https://phabricator.kde.org/T8749
- Orion feedback, Arc focus mode: https://orionfeedback.org/d/4945-make-focus-mode-more-like-the-arc-browser
- SupaSidebar, Arc features: https://supasidebar.com/blog/how-to-replicate-arc-features-any-browser-mac
- Lux, Introducing Halide: https://www.lux.camera/introducing-halide/
- MacStories, Halide for iPad: https://www.macstories.net/reviews/lux-delivers-an-ipad-version-of-halide-that-addresses-the-unique-challenges-of-ipad-photography/
- Halide design study (third-party): https://blakecrosley.com/guides/design/halide
- iA Writer simplicity (2011): https://dbushell.com/2011/05/28/simplicity-in-ui-design-ia-writer-for-mac/
- Hack Design, iA Writer: https://www.hackdesign.org/toolkit/ia-writer/
- Adobe Lightroom Classic shortcuts: https://helpx.adobe.com/ph_en/lightroom-classic/help/keyboard-shortcuts.html
- Glass help: https://glass.photo/help/what-is-glass
- Glass appreciations: https://Glass.photo/highlights/appreciations-are-here
- Birchtree, Glass should add likes: https://birchtree.me/blog/i-think-glass-should-add-likes
- VSCO Grid museum (Pixel Envy link): https://pxlnv.com/linklog/vsco-grid-wants-to-be-a-museum/
- Are.na connections help: https://help.are.na/getting-started/connections
- Pratt IxD Are.na critique (2025): https://ixd.prattsi.org/2025/02/design-critique-are-na-ios-app/
- Pratt IxD Are.na critique (2026): https://ixd.prattsi.org/2026/02/design-critique-are-na-ios-app-2/
- Dribbble, new shot pages (2020): https://dribbble.com/stories/2020/10/14/new-improved-shot-pages
- Lospec Sweetie 16 (fetched 2026-10-19): https://lospec.com/palette-list/sweetie-16
- Aseprite Preview window: https://www.aseprite.org/docs/preview-window/
- Cosmos homepage: https://www.cosmos.so/
- Spotify newsroom, desktop redesign: https://newsroom.spotify.com/tag/desktop-redesign
- Engadget, Spotify desktop (2023): https://www.engadget.com/spotify-desktop-app-gets-a-new-look-and-upgraded-library-features-184540624.html
- NN/g, Progressive Disclosure (2006): https://www.nngroup.com/articles/progressive-disclosure/
- NN/g, Hamburger menus video: https://www.nngroup.com/videos/hamburger-menus/
- Smart Insights NN/g summary: https://www.smartinsights.com/digital-marketing-strategy/are-hamburger-menus-hidden-navigation-good-for-ux/
- App State Unsplash tutorial: https://writing.appstate.edu/aportfolio/student-tutorials/designing/unsplash
