# 03: PixelLab Website Gallery Audit and Deep-Link Catalog

Research date: 2026-10-18. Researcher: browser and website-bundle audit. No account, generation, or download side effects.

## Summary

- **No live signed-in review was possible.** The built-in browser was not signed in to PixelLab, and every app page (`/create`, `/create-character`, `/create-object`, `/create-ui`, `/maps`, `/editor`, ...) redirects on the client to `/signin?redirect=<path+query>`. Signed-in UI findings below therefore come from **PixelLab's own production JavaScript bundles** (Next.js 13.1.5 pages router, build `xcvr59o5eI6jiFU9-n2Ll`, live on 2026-10-18), read in-page through `window.__BUILD_MANIFEST` and the public `/_next/static/chunks/...` files. These are strong code-level facts (labels, layout props, handlers, query parsing), but they are **not visual confirmation**. Severity ratings take that into account.
- **The biggest flaw is fragmentation.** A user's assets are spread across at least seven separate surfaces: the Creator gallery (`/create`), Characters, Objects, UI, Map Workshop (Maps, Tilesets and Tiles tabs), Create VFX, and Game Builder. There is no "all my assets" view, no cross-type search, no favorites, and only two sort orders. Bulk export is capped per selection and limited to one asset type at a time.
- **Touch and mobile are second-class.** In the Characters grid, animations play only on mouse hover and every card action (Add to project, Share, Export ZIP, Delete) is hidden until hover (`opacity:0`, `pointerEvents:none`). Animation rows on the detail page say "Hover to download". PixelLab's own docs say the Pixelorama editor does "not support mobile browsers."
- **Deep linking is good for managed assets and absent for Creator images.** Characters, objects, tilesets, Tiles Pro, and maps have stable id routes. Sibling research confirms the character, object, tileset, and tiles-pro ids in those URLs equal the public REST v2 asset ids. Several tool pages accept query params. Creator images have **no per-image URL**: `/create` reads only `tool` and `creatorCategory`.
- **One website route can preload an image:** `/editor` (Pixelorama) accepts `mode=edit&type=…&entityId=…&contentType=…&images=<comma-separated URLs | one data: URL>`. It is undocumented, works on desktop only, and saves back into the real PixelLab asset. Treat it as experimental.
- **Sign-in redirects keep the full path and query** (observed: `/create?tool=unzoom` → `/signin?redirect=%2Fcreate%3Ftool%3Dunzoom`). Deep links from our app should therefore still work for users who are signed out. Whether the page actually lands on the target after login was not verified.
- **There is no public community, explore, or shared gallery.** The route manifest has none. "Share" on a character downloads a showcase GIF rather than creating a link. No public REST or MCP route lists other users' assets.
- **What PixelLab does well (keep it):** pixel-crisp rendering (`image-rendering: pixelated` throughout), rich per-character exports (ZIP of all frames, sprite sheet PNG + JSON, Aseprite with tagged frames, showcase GIF, per-animation GIF), useful filters (camera view, directions, canvas size, tags, untagged only, project), honest empty and no-match states, copy-image and copy-agent-reference buttons, lazy rendering with fixed-size placeholders, and Escape to close the preview.

## What was reviewed

| Item | Detail |
|---|---|
| Date | 2026-10-18 |
| Signed in? | **No.** The browser profile had no PixelLab session. No sign-in was attempted. |
| Live pages viewed | `https://www.pixellab.ai/` (landing), `/docs`, `/docs/ways-to-use-pixellab`, `/docs/tools/rotate`, `/select-interface`. Sign-in redirects observed for `/create` and `/create?tool=unzoom`. |
| Viewports | Desktop pane (~800×600 CSS px); mobile preset 375×812 (Android UA emulation); landscape 812×375. Reset to desktop afterwards. |
| Code-level review (signed-in UI) | Route list from `window.__BUILD_MANIFEST`; page chunks for `/create`, `/create-character`, `/create-character/[id]` and sub-routes, `/create-object` and sub-routes, `/create-ui`, `/create-vfx`, `/create-tiles`, `/create-tileset`, `/maps` and sub-routes, `/map-editor/[id]`, `/editor`, `/chat/[[...params]]`, `/account`; shared chunks for the character card (`1961-…`), character detail (`7929-…`), object detail (`2022-…`), library sort/filter (`6753-…`), header/nav (`2543-…`), and Creator tool catalog (module `44659`). Regex extraction of UI strings, `router.query` destructuring, `URLSearchParams` construction, `onMouseEnter`/`onClick`/`aria-label` usage, `imageRendering`, and paging. |
| Sibling docs read | `../pixellab-pip/docs/pixellab/pixellab-surfaces-and-services.md`, `../docs/pixellab-website-endpoints-research.md` (June 2026 route/endpoint scan), `../pixellab-pip/docs/pixellab/pixellab-user-facing-term-backend-mapping.md` (URL list), `../pixellab-pip/docs/pixellab/pixellab-changelog-2026-07-01.md`, `../pixellab-pip/docs/pixellab/pixellab-mcp-vs-rest-route-parity.md` (gallery-route rows), `../docs/pixellab-seed-recovery-and-manifest-policy.md` (URL id = REST id evidence), and `../GameBuilder Chat - PixelLab.html`. The saved chat page showed only that Game Builder uses `/chat/<org>/<project>` URLs and a project git clone panel; it is mostly chat text with no app navigation. |
| External | Web searches on Reddit, Product Hunt, Trustpilot, AlternativeTo, and review sites; `pixellab.ai/llms-full.txt`; the SpriteCook comparison page (a competitor). |

## Current experience walkthrough

### Navigation and surfaces

- The signed-in header nav (from the shared header chunk) has: Docs, API, Vibe coding, Editor, Creator, Characters, Objects, UI, Maps, Team, Account. On mobile, Pricing, Enterprise, Editor, Creator, and Team are hidden from the top bar (`display:{base:"none",md:"inline-flex"}`) and an "Open menu" drawer is offered.
- `/select-interface` ("Choose How You Want to Create") presents the surfaces as separate products: Simple Creator ("Limited tools • Mobile support"), Character Creator ("Mobile support"), Map Workshop ("Requires Pixel Apprentice or higher"), Pixelorama ("In-browser • Advanced tools"), Aseprite Extension, Game Builder ("Requires Pixel Apprentice or higher"), Vibe Coding, and API.
- Each surface owns its own asset library:
  - Creator gallery at `/create`, labelled "Your gallery" (raw images, animations, fonts, UI, and so on).
  - Characters at `/create-character`.
  - Objects at `/create-object`.
  - UI at `/create-ui`.
  - Map Workshop at `/maps`, with tabs Maps, Tilesets (`?tab=tilesets`), and Tiles (`?tab=tiles`).
  - My effects in Create VFX at `/create-vfx`.
  - Game Builder projects at `/chat/<org>/<project>` and `/projects/<org>/<slug>`.

### Characters library (`/create-character`): code evidence

- **Grid card:** a `Box` with `onClick`, `cursor:"pointer"` and a hover lift (`translateY(-2px)` plus shadow). It is not an `<a>` or `<button>`.
  - The thumbnail renders at a **fixed `scale:2`** of the sprite's native size, so a 32 px character becomes a 64 px image.
  - It sits on a checkerboard of `rgba(255,255,255,0.015)` on a dark card, which is almost invisible.
  - The animation plays only when `animate: hovered && visible`, at a fixed `frameRate:5`.
  - Off-screen cards render a size-matched placeholder until an IntersectionObserver marks them visible.
- **Hover overlay:** a bottom-up dark gradient with four icon buttons: Add to project, "Share character showcase", "Export character as ZIP", and "Delete". It has `opacity: hovered?1:0` and `pointerEvents: hovered?"auto":"none"`.
- **Paging:** `&limit=100&offset=n` with an IntersectionObserver, so it is infinite scroll.
- **Sort ("Sort assets"):** only "Newest created" and "Last edited / animated".
- **Filters:** Project, Pending Reviews (Show All, Hide, Only), Camera View (Low Top-Down, High Top-Down, Side), Tags with "Search tags…", Untagged Only, Number of Directions (1 or 8), and Canvas Size (16–256 px).
- **Search:** typing in the search bar doubles as the create-prompt input. The empty state says: "Create your first character / Start typing in the search bar to describe your character idea". Typing pushes `/create-character/new?prompt=…`. It also shows "Filtering…", "Clear search", and "Clear filters".
- **Selection mode:** separate modes for download, add to project, and delete ("Select characters to download / …to add to a project / …to delete"). It offers "Select all (Max N)" and "Download (N)", which produces `selected_characters.zip`. Going over the cap shows the toast "Selection limit reached: Select N characters or fewer." Selected cards show a teal checkmark badge.
- **Drag and drop:** completed 8-direction cards are draggable, with the hint "Drop here to use this character as a style".

### Character detail (`/create-character/<id>`): code evidence

- Title "Character Details - PixelLab", with a "Back to Characters" link. It shows editable name and prompt ("Copy prompt", "Describe this character…"), Rotations, Animations (per direction), States, Portrait, Vocal Animation, Tags (max 20, "Add tag"), and "Use in game…" (Game Builder linkage).
- **Export menu:** "ZIP (all frames)", "Spritesheet (PNG + JSON)" (the toast says "PNG sheet + JSON layout downloaded"), and "Aseprite (tagged frames)" ("One layer, tagged frames per rotation and animation").
- **Share:** calls the website-only `GET api.pixellab.ai/character/{id}/share` and **downloads a showcase GIF**. No link is created.
- **Per animation:** "Download as GIF" and the hint "Hover to download • Drop GIF to add or replace". "Edit in Pixelorama" opens `/editor?…` in a new tab. Per-state "Download this state" and "Download PNG" are available. Rotations can be exported as a GIF.
- **Destructive and paid actions sit beside the viewing tools:** Delete character, Delete animation, Delete direction, Regenerate (replaces frames), Resize canvas, Create State, Add Animation, Animate, and Refresh.
- Seed and model are **not** surfaced. Sibling research found no seed in REST or MCP asset responses either.

### Objects (`/create-object`, `/create-object/<id>`)

- The library mirrors Characters: "Select all (Max N)", `selected_objects.zip`, and the same sort and filter component.
- The detail page has "Export" (ZIP all frames, or Spritesheet PNG + JSON), "Download as GIF", "Rotation GIF", drop-GIF replace, and "Edit in Pixelorama" via `/editor?mode=edit&type=creator_image&…&saveTarget=object_animation`.
- Sub-routes are `/animate`, `/expand`, and `/new-state`.

### Creator gallery (`/create`)

- The label is "Your gallery". It has a stage-and-rail layout ("Stage", "Gallery", "Pick an image from the rail, or hit Generate").
- **Filters:** Tool, Type, Size (up to 2048 px), Untagged only, Tags, plus a text search.
- **"Preview size" slider:** `min:192, max:480, step:16` px.
- **Empty state:** "Your creations will appear here… Everything you create stays in this gallery."
- **No-match state:** "No images match — N images are hidden by the search or filters." with a "Clear search & filters" button.
- **Item actions:** Open, Download ("Download image", "Download as GIF", "Download 3x upscaled"), an export menu ("Animation (GIF)", "Spritesheet (PNG)", "This frame (PNG)", "Font (.ttf)", "Image (.png)"), Copy image, "Copy agent reference — for an AI agent connected to PixelLab", Edit image, Pixel editor, Tags, Use in game, and Delete image.
- **Loading:** paged with `?limit=50` / `?limit=100` plus IntersectionObserver. Escape closes the preview. Rendering is `pixelated` with integer-capped zoom in the stage canvas.
- **No per-image URL.** Only `tool` and `creatorCategory` are read from the query.

### Maps, tilesets, tiles, UI, VFX

- `/maps` uses tabs (`tab=tilesets|tiles`, default Maps), "Load more" paging (`limit:200`), "Export map" → "PixelLab ZIP", and buttons to `/map-editor`, `/create-tileset`, `/create-tiles`, `/import-tiles`, and `/import-tilesets`. `/maps/<id>` shows "Export coming soon".
- `/create-ui` has "Download ZIP", "Download PNG", "Download UI", and Select all (Max). It has no per-asset route.
- `/create-vfx` (experimental) exports "GIF", "Spritesheet + JSON", "For a game (ZIP)", and "Every direction (ZIP)…". `?effect=<id>` opens a saved effect.

### Mobile and landscape (live, public pages only)

- **Landing at 375×812:** the hero stacks cleanly, CTAs are full width, and there is no horizontal overflow (`scrollWidth == clientWidth == 375`). Pricing and Enterprise are not visible in the top bar.
- **Docs at 375×812:** a hamburger menu, breadcrumb, and readable type. Pixel-art doc images (517 px native) are downscaled to 327 px with `image-rendering:auto`, so they look blurry.
- **Landing at 812×375:** the hero fills the whole viewport and the nav shows all items. Showcase GIFs (e.g. 416×240) sit in fixed 360×300 boxes with `object-fit:contain` and `pixelated`. That is a non-integer 0.865× downscale, which drops pixel rows and columns.
- **Signed-in surfaces on mobile could not be observed.** PixelLab says the Creator and Characters pages "work on desktop and mobile browsers" and that the Pixelorama editor has "No support for mobile browsers".

### Accessibility (code-level)

- **Cards are not focusable controls:** they use `onClick` on a `div`, so there is no Enter/Space activation, no focus ring, and no middle-click or open-in-new-tab.
- **Icon buttons are labelled:** the hover icon buttons do have `aria-label`s ("Export character as ZIP", "Delete", and others). Because they are invisible and not pointer-able until hover, keyboard and touch users cannot reach them in practice.
- **Thumbnails lack alt text:** no `alt:` strings were found in the `/create-character` chunk set, which suggests sprite thumbnails are canvas or background images with no alt.
- **Dark-only palette:** gray.400–500 text on near-black is used for secondary labels.

## Flaw list

Severity: High = blocks or seriously degrades a core browse, view, or download job. Med = noticeable friction. Low = polish. "Code" means evidenced in production bundles but not visually confirmed while signed in.

| # | Area | Flaw | Severity | Evidence | Our improvement |
|---|---|---|---|---|---|
| 1 | Information architecture | Assets are split across 7+ separate libraries (Creator gallery, Characters, Objects, UI, Maps/Tilesets/Tiles tabs, VFX, Game Builder). There is no unified "all my assets" view or cross-type search. | High | Header nav labels; route manifest; `/select-interface` presents each as a separate product | One library with type chips (All / Characters / Objects / Images / Tilesets / Tiles / Maps / UI / …) and one search box that spans every type. |
| 2 | Touch / mobile | Animations play only on hover. All card actions (project, share, export ZIP, delete) are invisible and non-clickable until hover. The detail page says "Hover to download". | High (touch) | Code: `animate: hovered&&visible`; overlay `opacity: hovered?1:0`, `pointerEvents: hovered?"auto":"none"`; string "Hover to download • Drop GIF…" | Visible-by-default actions or a ⋯ menu on every card. Autoplay visible animations (respect `prefers-reduced-motion`, plus a global play/pause). Long-press opens the context menu. |
| 3 | Bulk download | Bulk export is capped ("Select all (Max N)", "Selection limit reached") and only works within one asset type (`selected_characters.zip`, `selected_objects.zip`). There is no "download my whole account". | High (our core use case) | Code: `/create-character`, `/create-object`, `/create-ui` chunks | Uncapped, cross-type bulk ZIP, streamed client-side, with progress, cancel, and resume, plus a folder structure per type/asset/animation/direction. |
| 4 | Deep links | Creator gallery images have no per-image URL. `/create` reads only `tool` and `creatorCategory`. You cannot bookmark, share, or return to a specific image. | High | Code: query keys on `/create` | A hash-routed detail view per asset in our app (e.g. `#/image/<id>`) that survives reload and Back. |
| 5 | Accessibility / navigation | Library cards are clickable `div`s: no keyboard focus or activation, no open-in-new-tab, no link preview. | Med-High | Code: card `Box … cursor:"pointer", onClick` | Cards are real `<a href>` elements (hash routes), with roving-tabindex arrow-key grid navigation, a visible focus ring, and Enter to open. |
| 6 | Mobile editing | The Pixelorama editor is desktop-only, and the "Edit in Pixelorama" / "Pixel editor" hand-offs go there. | Med (PixelLab limit; we only link to it) | Docs: "No support for mobile browsers" | On mobile, label editor hand-offs "desktop only" and offer the Creator tool (`/create?tool=…`) instead. |
| 7 | Organization | No favorites or stars at all. Organization is limited to Projects (per game) and Tags (max 20 per character). | Med | No "favorite" strings in any chunk; "Maximum 20 tags per character" | Local favorites and folders (IndexedDB), with nested folders, multi-assign, smart filters, and export/import of that organization. |
| 8 | Sorting | Only two sort orders: "Newest created" and "Last edited / animated". There is no oldest-first, name, size, direction count, or animation count. | Med | Code: sort component `6753-…` | Sort by created (asc/desc), name, canvas size, directions, frame count, and type. Remember the choice per view. |
| 9 | Thumbnail scaling | Character cards use a fixed 2× scale, so 16 px sprites are tiny and 256 px sprites are huge, making a ragged grid. The Creator "Preview size" slider runs 192–480 px in steps of 16, which gives non-integer magnification of pixel art. The landing page also downsizes pixel GIFs by 0.865×. | Med | Code: `scale:2`; slider `min:192,max:480,step:16`; live landing measurement | Uniform cells with **integer-only** scaling: pick the largest whole multiple that fits the cell, `image-rendering: pixelated`, and centre the art. The size slider snaps to whole multiples. |
| 10 | Transparency | The checkerboard behind sprites is `rgba(255,255,255,0.015)` on a dark card, effectively invisible, so transparent edges and halos can't be judged. Theme is dark only. | Med | Code: card `backgroundImage` | A clear but quiet checkerboard, with a toggle for checker / dark / light / custom colour, and light and dark themes. |
| 11 | Card animation preview | Card previews run at a fixed 5 fps and play the default sequence. Direction switching and fps control live only on the detail page. | Low-Med | Code: `frameRate:5` | Preview at each animation's native timing, with a quick direction and animation switcher in the viewer and on hover/focus. |
| 12 | Destructive-action placement | Delete sits next to Export in the same hover overlay. The detail page mixes Delete, Regenerate ("replaces current frames"), and Resize with the viewing tools. | Med | Code: overlay order Project / Share / Export ZIP / Delete | Our app is view-only, so it has no delete and no paid actions. Make that a visible promise. "Edit in PixelLab" is clearly marked as leaving the app. |
| 13 | Export consistency | Each asset type has a different export menu. Characters: ZIP / Spritesheet PNG+JSON / Aseprite / showcase GIF. Objects: ZIP / Spritesheet. Creator: PNG, GIF, sheet, frame, 3× upscaled. UI: ZIP/PNG. Maps: "PixelLab ZIP" on the list but "Export coming soon" on `/maps/<id>`. VFX: GIF, sheet+JSON, game ZIP. | Med | Strings in `7929-…`, `2022-…`, `/create`, `8835-…`, `/maps`, `/maps/[id]`, `/create-vfx` | One export dialog for every asset (PNG, sprite sheet + JSON, GIF, per-frame ZIP, scale ×1–×8), with sensible per-type defaults. |
| 14 | Sharing | "Share" downloads a showcase GIF; it does not create a link. There is no public asset page. | Low-Med | Code: `GET /character/{id}/share` → blob → `_showcase.gif` | Offer "Copy PixelLab link" (signed-in users only), "Copy image", and "Save GIF". Be honest that links work only for the asset owner. |
| 15 | Speed / first paint | App pages SSR only "Loading characters…" / "Loading…", then fetch the session and redirect. The `/create` page chunk alone is ~530 KB minified across 25 JS files. Data arrives in pages of 50–100. | Med (inferred) | Page-chunk size measured in-page; June 2026 SSR text in sibling research | Instant shell, cached listing (stale-while-revalidate in IndexedDB), virtualised grid, and thumbnail prefetch by viewport. |
| 16 | Search model | Characters search doubles as the create-prompt box: typing a non-matching term offers "Create Character" with that prompt. That is easy to confuse with filtering. | Low-Med | Code: `/create-character` pushes `/create-character/new?prompt=` | A pure search box with fuzzy matching over prompt, name, tags, and id. "Create in PixelLab" is a separate, explicit link. |
| 17 | Metadata | Seed and model are not shown, and the public API exposes no seed for completed assets. Size, directions, view, and date are spread across filters and cards. | Low-Med | Sibling seed research; detail-page strings | A metadata panel showing every field the public API returns (size, directions, view, created date, prompt, animation names, frames per direction, tags, project), with copy buttons. |
| 18 | Accessibility | Thumbnails have no alt text. Secondary text is gray.400–500 on near-black. Hover-gated controls are unreachable by keyboard. | Med | Code: no `alt:` in the Characters chunk set; Chakra gray tokens | Alt text from name or prompt, WCAG AA contrast, reachable controls, and `aria-live` progress for downloads. |
| 19 | Docs drift | Docs say the Simple Web Creator uses "PixFlux… and BitForge", but the current Creator lists Pixen, Pro Flash, and Pro tools. The docs nav says "Create S-L image (Pro)" while other places say S-XL. | Low | `/docs/ways-to-use-pixellab`; docs nav | Use PixelLab's current UI labels in our "Open in PixelLab" buttons, and keep one mapping table. |
| 20 | Gated tools | Many Creator tools are tier-gated (`minTier` 1–2) or Pro, so a deep link can land on an upsell. | Low | Code: tool catalog `minTier`, `isPro` | Show a small "may require a paid tier" hint on hand-off buttons for gated tools. |

## Strengths to keep

- **Pixel-crisp rendering by default:** `image-rendering: pixelated` appears in dozens of components (26 hits in the `/create` bundle set, 21 in `/create-ui`). The stage canvas caps zoom with integer math.
- **Rich, game-ready exports per character:** ZIP of all frames, sprite sheet PNG + JSON layout, Aseprite with tags per rotation and animation, showcase GIF, per-animation GIF, and per-state PNG. Ours should match this and make it uniform across types.
- **Filters that match how game developers think:** camera view, number of directions, canvas size, tags, "Untagged only", project, and pending reviews.
- **Good empty and no-result states:** "N images are hidden by the search or filters" plus a one-click "Clear search & filters". The first-run empty state explains what to do.
- **Copy image to clipboard** and **"Copy agent reference"** for MCP-connected agents. That is a nice bridge we could mirror with "Copy asset id".
- **Lazy rendering with size-matched placeholders**, which avoids layout shift. Infinite scroll uses IntersectionObserver.
- **Selection mode** with clear checkmark badges, Select all, and a count on the Download button.
- **Escape closes the preview.** Drag a card onto a drop zone to reuse it as a style reference, using a custom MIME `application/x-pixellab-spritesheet`.
- **Deep links survive sign-in:** the redirect keeps the encoded path and query.
- **Tool switcher grouping** (Create image / Image to pixel art / Create UI / Edit image / Animate with text) with plain size hints ("16–768", "Best at 64+").

## Deep-link URL catalog

All app URLs are on `https://www.pixellab.ai`. "Sign-in" = Yes means signed-out users are redirected to `/signin?redirect=<encoded path+query>`. **None of these URL contracts are documented by PixelLab.** They come from the live route manifest and the query parsing in the 2026-10-18 bundles, so they can change without notice. Asset ids are the public REST v2 / MCP ids where marked "verified"; that is per sibling research, which matched website URLs to `GET /v2/characters|objects|tilesets|tiles-pro/{id}` → 200. Never put the API token in any URL.

| Target | URL pattern | Params accepted (observed) | Sign-in required | Hand-off strategy |
|---|---|---|---|---|
| Character page ("Open in PixelLab") | `/create-character/{character_id}` | none (id in path). **Id = REST/MCP character id (verified)** | Yes | Direct link, new tab. |
| Character: add animation | `/create-character/{id}/add-animation` | `direction`, `animationType`, `animationGroupId` | Yes | Direct link labelled "Animate in PixelLab". Nothing is spent until the user clicks generate there. |
| Character: generate animation (preset form) | `/create-character/{id}/generate-animation` | `animationType`, `direction`, `action`, `aiFreedom`, `outline`, `shading`, `detail`, `paddingX`, `paddingY`, `animationGroupId`, `displayName`, `canvasWidth`, `canvasHeight` | Yes | Optional prefill. Prefer the plain add-animation link unless a field is known. |
| Character: new state / outfit | `/create-character/{id}/new-state` | `edit`, `replace` | Yes | Direct link ("Create state in PixelLab"). |
| New character | `/create-character/new` | `prompt`, `mode`, `from`, `rotations` (e.g. `from=create&rotations=8`) | Yes | "Create similar" with `?prompt=` prefilled from the asset's prompt. URL-encode it, and never put personal data in it. |
| Characters library | `/create-character` | none | Yes | Fallback link. |
| Object page | `/create-object/{object_id}` | none. **Id = REST/MCP object id (verified)** | Yes | Direct link. |
| Object: animate | `/create-object/{id}/animate` | `direction`, `animationGroupId`, `animationName`, `displayName`, `description`, `frameCount`, `customFrames`, `keepFirstFrame`, `replaceExisting`, `engine` | Yes | Direct link ("Animate in PixelLab"). Do not pass `replaceExisting`. |
| Object: expand / new state | `/create-object/{id}/expand`, `/create-object/{id}/new-state` | new-state: `edit`, `replace` | Yes | Direct links. |
| New object | `/create-object/new` | `mode` read directly; library pushes `prompt`, `size`, `directions`, `view` (`from=gallery-staged`) | Yes | "Create similar" with `prompt`, `size`, `directions`, `view` (reading those keys is unverified). |
| Topdown tileset page | `/maps/tilesets/{tileset_id}` | none. **Id = REST tileset id (verified)** | Yes | Direct link. |
| Create connected tileset | `/create-tileset` | `autoPreselect`, `lower_base_tile_id`, `upper_base_tile_id`, `lower_source_tileset_id`, `upper_source_tileset_id`, `lower_source_terrain_type`, `upper_source_terrain_type`, `tileSize` | Yes; Map Workshop is tier-gated | "Continue this tileset in PixelLab": pass `lower_source_tileset_id={id}` (semantics inferred). |
| Tiles Pro page | `/maps/tiles/{tiles_pro_id}` | none. **Id = REST tiles-pro id (verified)** | Yes | Direct link. |
| Create tiles | `/create-tiles` | `prompt`, `tile_feature`, `tile_type` | Yes; subscription | Prefill link. |
| Map editor | `/map-editor/{map_id}` | none | Yes; tier-gated | Direct link. Whether the map id equals the MCP map id is **unverified** (see Open questions). |
| Map detail | `/maps/{map_id}` | none | Yes | Direct link (its export shows "coming soon"). |
| Map Workshop library | `/maps` | `tab=tilesets` or `tab=tiles` (default maps), `tileSize` | Yes | Type-specific fallback ("Open Tilesets in PixelLab" → `/maps?tab=tilesets`). |
| Import tiles / tilesets | `/import-tiles`, `/import-tilesets` | `extend` (import-tiles) | Yes | Not needed for a view-only app. |
| Creator gallery / tool | `/create` | `tool=<slug>`, `creatorCategory=create\|transform\|animate\|utility\|all` | Yes | **No image preload.** Open `/create?tool=<slug>`, then copy the asset PNG to the clipboard with a "Paste or drop the image into PixelLab" toast. The Creator advertises "Drop images here"; whether paste works is unverified. Download-then-upload is the fallback. |
| Creator `tool` slugs (main) | `/create?tool=…` | `create_image_pixen`, `create_image_pro`, `create_image_pro_flash`, `create_m_xl_image`, `create_s_m_image`, `image_to_pixel_art`, `image_to_pixel_art_pro`, `image_to_pixel_art_pro_flash`, `image_to_image`, `edit_image`, `edit_image_pixen`, `edit_image_pro`, `edit_image_pro_flash`, `unzoom`, `remove_background`, `reduce_colors`, `normal_map`, `pixel_art_correction`, `generate_8_rotations_v3` (Rotate), `create_8_directional_pro`, `animate_with_text` (v3), `animate_with_text_pro`, `interpolate`, `pixminimax`, `create_animated_pro`, `edit_animation_pro`, `transfer_outfit_pro`, `create_from_style_pro`, `create_tiles_pro`, `create_ui_pro`, `create_ui_basic`, `ui_template`, `portrait_character`, `generate_font`, `vocal_animation`. Internal ids are also accepted (e.g. `imagetopixelart`, `unzoom`). | Yes; many are tier/Pro-gated | Map our "Edit / Rotate / Animate / Cleanup" buttons to these slugs. **There is no Inpaint tool in the Creator**: inpaint lives in Pixelorama and Aseprite, so "Inpaint in PixelLab" → editor (desktop only) or `edit_image_pro`. |
| Pixelorama editor (preloaded) | `/editor?mode=edit&type=<t>&entityId=<id>&contentType=<ct>&images=<url1,url2,…>` | `mode`, `entityId`, `type`, `contentType`, `images` (comma-separated URLs or a single `data:image/…`), `directions`, `animationId`, `direction`, `objectId`, `tileSize`, `gridSize`, `saveTarget`, `assetKind=tileGroup\|uiAsset`, `storageKey` (same-origin localStorage, unusable from our origin) | Yes; **desktop only** | **Experimental.** The only observed external-style pattern is `type=character&contentType=rotation&entityId=<character_id>&images=<encoded preview URL>` (used by PixelLab's chat page). Saving in the editor writes back to the real asset through website-only `replace-png` routes. Label the button "Open in PixelLab editor (desktop)". Avoid `data:` URLs because of URL length. |
| Pixelorama editor (empty) | `/editor` | — | Yes | Safe generic fallback ("open editor, then drop or paste the image"). |
| UI assets | `/create-ui` (`?view=create` opens the generator) | `view` | Yes | No per-asset route. Link to the library plus copy image. |
| VFX effect | `/create-vfx?effect=<effect_id>` | `effect` | Yes; experimental | Direct link if our listed VFX id matches the website effect id (**unverified**). |
| Game Builder project | `/chat/<org>/<project>`, `/projects/<org>/<slug>` (`/infra`, `/tasks`) | `panel` (chat) | Yes; tier-gated | Only if the asset response carries project org and slug (it may not). |
| Account / credits | `/account` | `credits` | Yes | "Manage account / token" link. |
| Sign-in | `/signin?redirect=<encoded path+query>` | `redirect` | — | Not needed: app pages add it automatically and keep the query. |
| Public pages | `/`, `/docs/...`, `/select-interface`, `/pixellab-api`, `/mcp`, `/enterprise`, `/signup` | — | No | Help and about links. |

### Recommended hand-off (in order of preference)

1. **Managed assets with id routes** (characters, objects, tilesets, Tiles Pro, maps): link straight to the asset page or the specific sub-tool route (`/add-animation`, `/new-state`, `/animate`, `/expand`). The asset is already "preloaded" by id.
2. **Creator images, UI, fonts, raw images**: open `/create?tool=<slug>` in a new tab, **and** at the same moment copy the PNG to the clipboard (`ClipboardItem` image/png, which needs the image fetched with CORS; the CORS status of PixelLab asset URLs is unverified). Show a toast: "Image copied. Paste or drop it into PixelLab's tool." If clipboard write fails, download the PNG and say "drop the downloaded file into the tool."
3. **Pixel edits (desktop only)**: the experimental `/editor?…&images=` link for characters, behind a feature flag, with the generic `/editor` plus clipboard as fallback. On touch devices, hide it or label it "desktop only".
4. Always `target="_blank" rel="noopener noreferrer"`, and tell the user they are leaving the view-only app.

## Community/explore gallery availability

- **No public community, explore, or showcase gallery exists on the website.** The full 2026-10-18 route manifest (≈100 routes) has no `/explore`, `/community`, `/gallery`, `/share/…`, or public asset route. The docs nav item "Community" and the landing CTAs point to Discord ("Get inspired and build with the community").
- **Sharing is file-based.** The character "Share" button downloads a showcase GIF through the website-only `GET api.pixellab.ai/character/{id}/share`. Map records carry an `is_public` flag in website-only `maps/save` payloads, but no route renders public maps.
- **There is internal-only feedback tooling:** `/dev/likes` ("Like Ratio… sentiment by model") and other `/dev/*` admin routes are PixelLab staff tools. They are website-only and out of bounds.
- **Public API reach:** neither REST v2 nor MCP exposes other users' assets. For the user's own Creator gallery, MCP `list_images` reads it and has **no documented REST v2 counterpart** (per `../pixellab-pip/docs/pixellab/pixellab-mcp-vs-rest-route-parity.md`). A browser-only app using REST v2 alone therefore may not be able to list Creator-gallery images. That has to be confirmed by the API research track. Website root endpoints (`api.pixellab.ai/character/…`, `/get-account-data`, …) use Supabase session tokens and are not public; they must not be used.

## Implications for the gallery app

- **Unify first.** The one-library, one-search model is our clearest win over PixelLab, which ships 7+ siloed lists.
- **Touch parity is a requirement.** Every action must be reachable without hover: tap opens the detail view, a ⋯ menu or long-press gives quick actions, visible animations autoplay, and there is a global pause plus `prefers-reduced-motion` support.
- **Use integer pixel scaling everywhere.** Use a uniform cell grid where each sprite gets the largest whole-number scale that fits, rendered `pixelated`. Give the background a toggle (checker, dark, light, or a custom colour).
- **Bulk download is the headline feature.** It should be uncapped, cross-type, streamed ZIP with progress and cancel, and offer per-type export presets matching PixelLab's best (frames ZIP, sprite sheet + JSON, GIF, Aseprite-style tagged sheet if feasible client-side).
- **Deep links** should use the verified id routes for characters, objects, tilesets, and Tiles Pro. Map, UI, VFX, and Creator ids need verification. Hand off to Creator tools with `?tool=` plus a clipboard copy of the image.
- **Organization lives locally:** favorites, folders, and smart filters, plus PixelLab's own tags and projects where the API returns them.
- **Metadata panel and copy actions:** id, prompt, size, directions, view, created date, and animations with frame counts. Include a "Copy asset id" for agent workflows, mirroring PixelLab's "Copy agent reference".
- **View-only promise:** no delete and no paid actions, with "Edit in PixelLab" buttons that clearly leave the app and note tier or desktop limits.
- **Speed:** cache the asset index in IndexedDB, virtualise the grid, and prefetch thumbnails for the viewport. Avoid PixelLab's pattern of a heavy app bundle followed by a session redirect.

## Open questions

1. Live signed-in visuals were never observed: actual thumbnail sizes on screen, grid density at each breakpoint, and mobile behaviour of the Characters and Creator pages. A session where the user is signed in to the built-in browser would settle these. Only read-only viewing would be needed.
2. After login, does `/signin?redirect=…` land on the deep-link target with its query intact? The redirect is preserved; the landing behaviour was not tested.
3. Does the website map id (`/map-editor/{id}`, `/maps/{id}`) equal the MCP `create_map`/`get_map` id? Do the website effect id (`/create-vfx?effect=`) and UI asset ids match public API ids? Is there any website route for isometric tiles, sidescroller tilesets, fonts, or portraits beyond the Creator?
4. Is the `/editor?…&images=` hand-off stable for asset types beyond `type=character&contentType=rotation`? It is undocumented. What `saveTarget` does the editor assume when none is passed?
5. Does the Creator accept clipboard **paste** (not only drop) for input images? Do PixelLab asset image URLs send CORS headers that allow `fetch` → `ClipboardItem` from our origin?
6. What is the exact "Select all (Max N)" cap value? It is a runtime variable `eU` and was not determined statically.
7. Can REST v2 alone list Creator-gallery images, or is that MCP-only (`list_images`)? This decides whether the gallery can show Creator images at all.
8. User sentiment: no public Reddit, Product Hunt, Trustpilot, or AlternativeTo reviews of pixellab.ai's UI or asset management were found. Feedback likely lives in PixelLab's Discord, which was not accessible here.

## Sources

- PixelLab landing page (live, desktop, mobile, landscape): https://www.pixellab.ai/
- Choose Your Interface page (live): https://www.pixellab.ai/select-interface
- PixelLab docs index and nav (live): https://www.pixellab.ai/docs
- Ways to use PixelLab: mobile support and the Pixelorama desktop-only statement (live): https://www.pixellab.ai/docs/ways-to-use-pixellab
- Rotate tool docs (mobile rendering check): https://www.pixellab.ai/docs/tools/rotate
- Sign-in redirect observed: https://www.pixellab.ai/create?tool=unzoom → `https://www.pixellab.ai/signin?redirect=%2Fcreate%3Ftool%3Dunzoom`
- Next.js route manifest and page/shared chunks (build `xcvr59o5eI6jiFU9-n2Ll`, Next 13.1.5), read in-page on 2026-10-18 from `https://www.pixellab.ai/_next/static/…`. Key files:
  - `chunks/pages/create-5cd845ce8439fc0a.js`
  - `chunks/pages/create-character-d322eae12dc3d94e.js`
  - `chunks/pages/create-character/[id]-be876a58199096d8.js`
  - `chunks/1961-766336b71c587813.js` (character card)
  - `chunks/7929-ccc6ad1cc1b83b01.js` (character detail)
  - `chunks/2022-6aeff3c718338081.js` (object detail)
  - `chunks/6753-e8a028e87aaecff3.js` (sort/filter)
  - `chunks/2543-01a405318c74f0e7.js` (header nav)
  - `chunks/pages/editor-1e8ca83cbcc86880.js`
  - `chunks/pages/chat/[[...params]]-0f8ba43f346af473.js` (tool catalog module 44659; editor `images=` link)
  - `chunks/pages/maps-386c08bf70f751bd.js`
  - `chunks/pages/create-vfx-72f7b6a616678d81.js`
  - `chunks/pages/create-tileset-f02576b0ecdd128c.js`
  - `chunks/pages/create-object/[id]/animate-6afe8b8f98665ef6.js`
- PixelLab LLM docs (mobile support, exports): https://www.pixellab.ai/llms-full.txt
- Competitor comparison (claims unverified, competitor-authored): https://www.spritecook.ai/compare/pixellab
- Third-party directories (thin on user feedback): https://topai.tools/t/pixellab, https://www.cutout.pro/learn/pixellab/
- Sibling research (read-only, paths relative to the gallery repo root):
  - `../pixellab-pip/docs/pixellab/pixellab-surfaces-and-services.md`
  - `../docs/pixellab-website-endpoints-research.md` (June 2026 route/SSR evidence)
  - `../pixellab-pip/docs/pixellab/pixellab-user-facing-term-backend-mapping.md`
  - `../pixellab-pip/docs/pixellab/pixellab-mcp-vs-rest-route-parity.md` (`list_images` MCP-only)
  - `../docs/pixellab-seed-recovery-and-manifest-policy.md` (website URL id = REST asset id; no seed exposure)
  - `../pixellab-pip/docs/pixellab/pixellab-changelog-2026-07-01.md`
  - `../GameBuilder Chat - PixelLab.html`
