# 05: Creative-asset gallery UX patterns for a pixel-art gallery

Research date: 2026-10-18. Scope: how AI-generation galleries, asset managers, inspiration galleries, and game-asset sites present, organize, and export assets, and what "PixelLab Gallery" (an unofficial, client-side, view-only Svelte 5 + Vite app) should take from them.

How to read this: if a bullet has a link, the claim comes from that source. Labels such as **Recommendation**, **Inference**, or a verdict are design judgments built on the cited findings, not facts from the sources. If I could not verify a product's behavior during this pass, I say so (see "Not verified" and Open questions) and do not guess. Vendor docs and vendor-hosted blogs describe how the product is meant to work, so they are not independent reviews.

---

## Summary

1. **Generation tools now split "create" from "organize".** Midjourney's web app has both a Create page and an Organize page, and both share one Folders menu. Its folders support folder groups, membership in more than one folder, and downloading a whole folder ([Midjourney updates, Feb 2025](https://updates.midjourney.com/new-tools-for-organization/)). PixelLab Gallery is view-only, so the whole app is an "Organize page".
2. **Rule-based views are common.** Midjourney's "Saved Searches" (formerly Smart Folders), Eagle's Smart Folders, and Lightroom's Smart Collections all fill automatically from a saved query ([AI wiki guide, Oct 2025](https://artificial-intelligence-wiki.com/ai-tools/midjourney/midjourney-organize-images-guide/); [Eagle blog](https://eagle.cool/blog/post/how-traditional-folders-slow-down-your-design-workflow-a-deep-dive-into-eagles-smart-folders); [Adobe help](https://helpx.adobe.com/dk/lightroom-classic/help/smart-collections-criteria-in-lightroom-classic.html)). For metadata-rich generated assets, saved views cost little to build and are worth a lot.
3. **Folders work best as multi-membership collections, not exclusive file-system folders.** Midjourney ([source](https://updates.midjourney.com/new-tools-for-organization/)) and Scenario ([help](https://help.scenario.com/en/articles/collections)) both treat a folder or collection as a grouping. Deleting a Scenario collection leaves the assets in the library. **Recommendation:** use the same model, which also suits a local-only overlay on remote assets.
4. **Grid choice.** No sourced product solves "16px icon next to a 2048px map" with justified rows or masonry. Justified rows and masonry assume photo-like aspect ratios ([layout comparison](https://reference.wavecast.io/components/photos/listings/)). Masonry also has known keyboard and reading-order problems ([CSSWG #5675](https://github.com/w3c/csswg-drafts/issues/5675)), and in 2026 only Safari ships native support ([OpenReplay](https://blog.openreplay.com/css-grid-lanes-masonry-layout/)). **Recommendation:** use a uniform square grid with contain-fit (no cropping) on a neutral or checker cell, plus a list/table view.
5. **Pixel-art rendering needs integer scaling and `image-rendering: pixelated`.** Non-integer scaling makes pixels uneven, and browser zoom can reintroduce artifacts ([32bit.cafe thread](https://discourse.32bit.cafe/t/a-problem-with-image-rendering-pixelated/475); [modern-css](https://modern-css.com/reference/properties/image-rendering/); [W3C CSS archive](https://lists.w3.org/Archives/Public/public-css-archive/2021Jan/0055.html)).
6. **Animated thumbnails must play only in view.** The standard approach is an IntersectionObserver that plays or loads media in view and pauses it offscreen ([Chrome perf course](https://chrome.dev/f/learn_performance_video/4/); [GitHub engineering](https://github.blog/engineering/making-githubs-new-homepage-fast-and-performant/)). I found no benchmarks specific to many simultaneous GIFs.
7. **Bulk download is the most-requested missing feature across AI tools.** Recraft's bulk-download request was open from Aug 2024 until it was implemented in Nov 2025 ([Recraft feedback](https://feedback.recraft.ai/feature-requests/p/bulk-image-download)). Leonardo users turn to paid third-party Chrome extensions ([Gumroad listing](https://acepter.gumroad.com/l/Leonardoaibulkdownloader)). Adobe CC Libraries users have asked for batch download since at least 2019 ([Adobe community](https://community.adobe.com/questions-606/how-to-bulk-download-images-within-libraries-to-my-computer-579733)). For PixelLab Gallery, bulk export is a core differentiator.
8. **Exports should carry metadata.** Midjourney folder downloads reportedly include prompt and parameter metadata ([AI wiki guide](https://artificial-intelligence-wiki.com/ai-tools/midjourney/midjourney-organize-images-guide/)). Users asked Recraft whether prompts could be exported along with images ([Recraft feedback](https://feedback.recraft.ai/feature-requests/p/bulk-image-download)). **Recommendation:** put a `metadata.json` (or one JSON sidecar per asset) in every ZIP.
9. **Large archives hit hard caps.** Server-side services cap ZIPs: Drive splits archives into 2 GB parts ([Google Workspace blog, 2016, older](https://workspaceupdates.googleblog.com/2016/08/improvements-to-downloading-files-and-folders-in-Drive.html)), and Dropbox caps at 250 GB / 10,000 files ([Dropbox help](https://help.dropbox.com/desktop-web/download-entire-folders)). A client-side app can stream a ZIP to disk with fflate/client-zip plus `showSaveFilePicker` and fall back to a Blob download ([DEV article](https://dev.to/certosinolab/streaming-large-zip-archives-in-the-browser-with-vue-and-the-file-system-access-api-42ng); [fflate guide](https://github.com/101arrowz/fflate/wiki/Guide:-Modern-(Buildless))).
10. **The inspector sits in a right-side panel in asset managers.** Eagle's Inspector is on the right and shows the selected item's properties ([Eagle support](https://en.eagle.cool/support/article/interface-inspector)). It shows color swatches, and right-clicking a swatch finds similar-color items ([Eagle search snippet of inspector doc](https://en.eagle.cool/article/477-interface-inspector)). Scenario edits tags in an "info panel" ([Scenario help](https://help.scenario.com/articles/7782236276-tags)). **Recommendation:** use a side panel on desktop and a full-screen sheet on mobile.
11. **Lineage and "remix" hand-offs are expected on AI galleries.** Civitai's on-site "Remix" button pre-fills the generator from an image's generation data ([Civitai article, Jun 2025](https://civitai.com/articles/15955)). Midjourney's lightbox shows which folders an image belongs to ([Midjourney updates](https://updates.midjourney.com/new-tools-for-organization/)). For PixelLab, the equivalents are "Open in PixelLab" and "Animate in PixelLab".
12. **Power users expect ⌘K plus single-key shortcuts.** Command palettes should cover navigation, actions, and objects, show keyboard shortcuts next to commands, and toggle closed with the same key ([Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/); [Chameleon](https://www.chameleon.io/patterns/cmd-k-search)). Lightroom shows how far single-key triage can go: P/X/U for flags ([Lightroom Queen](https://www.lightroomqueen.com/flags-star-ratings/)).
13. **BYOK onboarding should say where the token lives.** The safest client-side pattern keeps the key on the device, offers a session-only option, and makes removal easy. Browser-stored keys are exposed to XSS ([OpenAI community](https://community.openai.com/t/bring-your-own-key-policy/446168); [TanStack BYOK](https://tanstack.com/ai/latest/docs/advanced/byok)).
14. **Local organization data needs an export/import path, and import must preserve structure.** Raindrop says imports keep the folder structure ([Raindrop help](https://help.raindrop.io/import)). A user report describes a re-import that put everything into one "imported bookmarks" collection ([WorldBrain community](https://community.worldbrain.io/t/raindrop-io-import-retain-collection-structure/936)).
15. **Sprite-sheet viewers share a standard control set:** a grid overlay with frame numbers, an FPS control (1–30 fps), frame stepping, and export to GIF ([imageonline.io](https://imageonline.io/sprite-sheet-animator/); [3ee overlay](https://3ee.itch.io/spritesheet-frame-overlay); [javainuse](https://www.javainuse.com/sprite-sheet-to-gif)). Aseprite's preview window (F7) plus onion skin is the reference for checking motion ([Aseprite docs](https://aseprite.org/docs/onion-skinning/)).

---

## Per-product notes

### AI generation galleries

**Midjourney web (Create / Organize)**
- Folders appear on both the Create and Organize pages. While a folder is open, new generations are filed into it automatically. Folders can be grouped. One image can belong to several folders, and the lightbox lists them. Right-click a folder and choose "Download" to get all its images. Images are added to folders by right-click, drag-and-drop, or a folder button in the lightbox ([Midjourney updates, 2025-02-20](https://updates.midjourney.com/new-tools-for-organization/)).
- "Saved Searches" (formerly Smart Folders) auto-update, and images that stop matching drop out. Search matches prompt words, parameters, reference images, personalization profiles, and model versions. A right-side filter toolbar covers date range, aspect ratio, and model version. A heart adds an image to a built-in Favorites folder. Bulk select works with Shift-click or click-drag marquee. A timeline scrubber appears when you hover the gray bar above the grid and jumps to a date ([AI wiki guide, 2025-10-11, third-party](https://artificial-intelligence-wiki.com/ai-tools/midjourney/midjourney-organize-images-guide/)).
- The website can only hide images, and hidden images stay public. Deletion works only via the ❌ reaction in Discord ([search summary of Midjourney docs](https://docs.midjourney.com/hc/en-us/articles/33329462451469); the docs page returned HTTP 403 to direct fetch, so this comes via search snippets).
- A third-party "Midjourney Archive Downloader" extension offered date-range bulk download. A reviewer reported it broke after a URL change ([Chrome Web Store](https://chrome.google.com/webstore/detail/midjourney-archive-downlo/galjoekncljjmianlpmjgcmaihjohndl)).
- **Takeaways:** auto-file into the open folder does not apply (view-only). Folder groups, multi-membership, folder download, the timeline scrubber, and marquee select all apply.

**Leonardo.ai**
- Collections support nested sub-collections for project-based organization ([Leonardo help](https://intercom.help/leonardo-ai/en/articles/9047341-collections)).
- I found no official bulk-download or ZIP feature. Paid Chrome extensions fill the gap and work best when images are already in collections ([Gumroad](https://acepter.gumroad.com/l/Leonardoaibulkdownloader); [extscope](https://www.extscope.org/extension/ocamdihnglddmocicgghjicbidakcfdl)).
- TechRadar notes "some clunkiness" in the UI without saying which screens ([TechRadar](https://www.techradar.com/pro/software-services/leonardoai-ai-image-generator-review)).

**Scenario (game-asset AI)**
- Tags are added in the info panel, one at a time or in bulk on a multi-selection, and are searchable with Ctrl/Cmd+F. Scenario calls tags essential once a library reaches hundreds or thousands of assets ([Scenario help: tags](https://help.scenario.com/articles/7782236276-tags)).
- Collections group images, models, textures, and canvas projects. Assets are added manually (Ctrl/Cmd-click multi-select, then "Add to Collection") or automatically: images generated from a model in a collection join that collection. Collection lists sort by Name, Modified, or Created, and the choice is remembered per browser. A format filter bar (Images, Textures, Skyboxes, Models, Canvas, Video, 3D) sits alongside "Filter by Type" (Generate, Enhance, Expand). Deleting a collection removes only the grouping ([Scenario help: collections](https://help.scenario.com/en/articles/collections)).
- **Takeaways:** a type chip bar plus a generation-method filter maps directly onto PixelLab asset types and tools. The sort choice should be remembered locally.

**Adobe Firefly**
- Generation history has a type filter (image/video/audio/all). On mobile: sort by Date created or reverse it, and multi-select to Download, Favourite, Add to projects, or Delete. The web docs describe single-item download from a context menu only. Docs were updated as recently as June 2026 ([Adobe help: web](https://helpx.adobe.com/firefly/web/access-your-files/view-generation-history.html); [Adobe help: mobile](https://helpx.adobe.com/firefly/mobile/view-generation-history/generation-history-overview.html)).
- **Takeaway:** the bulk-action parity gap between platforms is a cautionary example. Ship the same bulk actions on mobile and desktop.

**Recraft**
- Single export offers PNG/JPG/TIFF/PDF, plus SVG and Lottie for vectors ([Recraft docs](https://www.recraft.ai/docs/recraft-studio/exporting-and-sharing/how-to-export-an-image)).
- Multi-select export produces a ZIP named after the project title, so an "Untitled" project produces an unhelpful filename. A user reports export takes about 8–10 seconds ([Recraft feedback](https://feedback.recraft.ai/feature-requests/p/bulk-image-download)).
- **Takeaway:** derive ZIP names from the selection's context (folder or view name plus date), never a generic default.

**Civitai**
- The on-site "Remix" pre-fills the generator from an image's generation data. Off-site images need a paste-then-"Apply Parameters" workaround (user article, Jun 2025, [Civitai](https://civitai.com/articles/15955)). I could not verify Civitai's image-page metadata layout this pass.

**Retro Diffusion (pixel-art AI)**
- Animation output is a frame grid (sprite sheet) with low frame counts ([Replicate model page](https://replicate.com/retro-diffusion/rd-animation)). The MCP server offers GIF or sprite-sheet output ([mcpservers.org](https://mcpservers.org/servers/retro-diffusion/retro-diffusion-mcp)). I found no documentation of a web gallery or animation-preview UI.

**Not verified this pass:** Krea, Ideogram (no relevant results found).

### Asset managers

**Eagle (eagle.cool)**
- Smart Folders are rule-based virtual folders. Rules cover date imported, color (exact or similar), name (contains, starts with, and so on), one or more tags, source URL, dimensions, file type (e.g., GIF), rating and notes, and file size. The source does not specify AND/OR semantics or nesting ([Eagle blog](https://eagle.cool/blog/post/how-traditional-folders-slow-down-your-design-workflow-a-deep-dive-into-eagles-smart-folders); [Eagle smart folders doc](https://en.eagle.cool/article/559-smart-folders)).
- The Inspector is on the right side with "Category" and "Selection" tabs. It edits title, URL, and tags, has a notes area, and shows color swatches; right-clicking a swatch searches similar colors ([Eagle support](https://en.eagle.cool/support/article/interface-inspector); [search snippet](https://en.eagle.cool/article/477-interface-inspector)).
- A vendor-hosted review calls color filtering Eagle's strongest feature ([Eagle blog review](https://de.eagle.cool/blog/post/how-to-organize-media-library)).
- Eagle handles 100k+ files, but performance depends on hardware, and the guide suggests splitting libraries. Support responsiveness is the most common complaint ([HackDesign](https://www.hackdesign.org/toolkit/eagle/); [Capterra](https://www.capterra.com/p/184384/Eagle/reviews/)). A Trustpilot reviewer praises the one-time purchase ([Trustpilot](https://de.trustpilot.com/review/eagle.cool)).
- **Takeaways:** take the rule-based smart views and the right inspector. Treat palette/color search as a stretch goal: pixel art has small, exact palettes, so a "contains color" filter would be unusually precise. That is an inference and untested.

**Adobe Lightroom Classic**
- Smart Collection criteria include Rating (with range operators such as >= 3), Pick Flag (flagged/unflagged/rejected), Label Color, and Label Text ([Adobe help](https://helpx.adobe.com/dk/lightroom-classic/help/smart-collections-criteria-in-lightroom-classic.html)).
- P/X/U set flags, and rejected thumbnails are dimmed in the grid. Flags cannot be written to files or shared with other software ([Lightroom Queen](https://www.lightroomqueen.com/flags-star-ratings/); [jkost, 2024](https://jkost.com/blog/2024/06/applying-flags-stars-and-color-labels-in-lightroom-classic.html)).
- **Takeaways:** single-key toggles (F = favorite) work for triage. App-local organization does not travel with the files unless you export it.

**Raindrop.io**
- Import accepts HTML/CSV/JSON/TXT/ENEX, maps folders to collections, skips duplicates, and never overwrites ([Raindrop help](https://help.raindrop.io/import)). The API lists child-collection items via a `nested` flag. Exports come in csv/html/zip ([third-party skill summary of developer.raindrop.io](https://developer.raindrop.io/llms.txt)).
- A user reported a re-import that flattened everything into one collection ([WorldBrain community](https://community.worldbrain.io/t/raindrop-io-import-retain-collection-structure/936)).

**Google Drive / Dropbox (bulk ZIP)**
- Drive splits multi-item downloads into 2 GB ZIP parts with timestamped names and `-2` suffixes ([Google Workspace blog, 2016, older source](https://workspaceupdates.googleblog.com/2016/08/improvements-to-downloading-files-and-folders-in-Drive.html)).
- Dropbox cannot create a ZIP over 250 GB or 10,000 files, and nested files count toward the limit ([Dropbox help](https://help.dropbox.com/desktop-web/download-entire-folders); [Dropbox forum](https://dropboxforum.com/t5/View-download-and-export/Dropbox-limits-on-zipped-files-preventing-downloading-as-backup/m-p/702475)).
- I found no source describing Drive's "preparing download" progress UI.

**Frontify (enterprise DAM, for comparison)**
- Bulk select and bulk download are capped at 2,000 assets at a time (summary of [Frontify help](https://intercom.help/frontify/en/articles/2825263-bulk-curation-in-libraries)).

**Not verified this pass:** Pixave, Adobe Bridge, Figma/Spline file browsers.

### Portfolio and inspiration galleries
- **Masonry (Pinterest-style):** columns fill shortest-first, which gives a dense, ragged-bottom wall ([wavecast reference](https://reference.wavecast.io/components/photos/listings/masonry/)). The CSSWG discussion documents focus and reading-order divergence for keyboard, magnifier, and cognitive-disability users, and notes these problems are hard to catch because they vary by breakpoint ([CSSWG #5675](https://github.com/w3c/csswg-drafts/issues/5675)). In 2026, native `display: grid-lanes` is stable only in Safari 26.4+. Chrome, Edge, and Firefox have it behind flags or on older prototypes, and sources conflict on details ([OpenReplay](https://blog.openreplay.com/css-grid-lanes-masonry-layout/); [buildmvpfast](https://www.buildmvpfast.com/blog/css-grid-lanes-native-masonry-2026)).
- **Justified rows (Flickr-style):** a fixed row height with widths stretched to fill each row, so nothing is cropped; the last row may be ragged ([wavecast justified rows](https://reference.wavecast.io/components/photos/listings/justified-rows/)).
- **Uniform grid:** an orderly look, but images are usually cropped to a fixed ratio ([Clickbooq](https://support.clickbooq.com/hc/en-us/articles/211263283-Using-the-Grid-Gallery-Style); [visual-portfolio grid](https://www.mintlify.com/nk-crew/visual-portfolio/layouts/grid)).
- **Not verified this pass:** Dribbble, Behance, ArtStation, Unsplash, and Are.na specifics.

### Game-asset and pixel-art sites
- **itch.io:** game assets are browsed by stacked tag URLs (e.g., `tag-animated-sprites/tag-asset-pack`), and some listings carry a "GIF" badge on the thumbnail ([itch.io tag page](https://itch.io/game-assets/newest/tag-animated-sprites/tag-asset-pack); [itch.io gif tag](https://itch.io/game-assets/tag-gif)). I did not verify the individual asset-page layout.
- **Kenney.nl:** asset pages list tags, category, file count, license (CC0), and version next to the download button and an "All-in-1 bundle" upsell ([Kenney prototype kit](https://www.kenney.nl/assets/prototype-kit); [Kenney support](https://kenney.nl/support)). **Takeaway:** a "file count" badge is a useful honest signal before download.
- **Lospec palette list:** tag pages, per-item color count and download count, "Filtering Options", a result count, an explicit "no more palettes for your current selection" end state, plus Random and "Your Likes" entries ([Lospec 2bit tag](https://lospec.com/palette-list/tag/2bit)).
- **Sketchfab:** the Model Inspector opens from a bottom-right button or the I key and offers 3D view, 2D texture view, or both. Number keys switch render, materials, and wireframe. F toggles fullscreen and Esc exits ([Sketchfab help](https://help.sketchfab.com/en/articles/16152718); [Kildare guide](https://kildarelocalhistory.ie/a-brief-history-of-co-kildare/k3d-co-kildare-heritage-in-3d/k3d-tips-for-viewing/)). **Takeaway:** single-key view toggles inside the viewer (background, grid, fullscreen).
- **Aseprite:** the preview window (F7) and onion skinning (F3) are the core animation-checking tools, with configurable previous/next frame counts and tint ([Aseprite animation docs](https://aseprite.org/docs/animation/); [onion skinning](https://aseprite.org/docs/onion-skinning/)). Staff say Aseprite is not designed for sprite-sheet previewing ([Aseprite community](https://community.aseprite.org/t/request-spritesheet-animation-preview/3743)).
- **Online sprite-sheet viewers:** columns/rows or pixel-size slicing with out-of-tile dimming, 1–30 fps playback, frame stepping, a frame-number overlay, and GIF export, all running client-side ([imageonline.io](https://imageonline.io/sprite-sheet-animator/); [3ee](https://3ee.itch.io/spritesheet-frame-overlay); [javainuse](https://www.javainuse.com/sprite-sheet-to-gif); [spritecook slicer](https://www.spritecook.ai/sprite-sheet-slicer)).
- **Not verified this pass:** OpenGameArt, CraftPix, Unity Asset Store, Piskel.

---

## Pattern catalog

| Pattern | Examples | Verdict | Why |
|---|---|---|---|
| Create vs Organize split | Midjourney | Adopt (whole app is "Organize") | View-only scope. Hand-off links replace the Create side. |
| Uniform square grid, contain-fit, no crop | Uniform grid layouts; Lospec/itch listing cards | **Adopt (default)** | Pixel assets range from 16px to maps. Cropping hides content, so fit inside a fixed cell and keep rows aligned for keyboard and marquee. |
| Justified rows | Flickr-style galleries | Avoid as default | Normalizing row height makes wide tilesets huge and turns 1:8 sheets into slivers. Built for photo aspect ratios. |
| Masonry | Pinterest | Avoid | Reading and focus-order problems ([CSSWG #5675](https://github.com/w3c/csswg-drafts/issues/5675)). Native support only in Safari in 2026. Weak fit for marquee range-select. |
| List/table view | Asset managers, file browsers | Adopt (secondary view) | Metadata-heavy triage (sort by size, date, frame count). |
| Thumbnail size slider | Common in asset managers (not verified this pass) | Adapt | Snap to sizes that make integer upscaling possible for common asset sizes. |
| Integer upscale + `image-rendering: pixelated` | Pixel-art rendering guidance | **Adopt** | Prevents blurry or uneven pixels ([32bit.cafe](https://discourse.32bit.cafe/t/a-problem-with-image-rendering-pixelated/475)). |
| Checker / dark / light backdrop toggle | Sprite tools, editors (inference) | Adopt | Transparent sprites vanish on matching backgrounds. One global toggle. |
| Type badge on card | itch.io "GIF" badge; Scenario format filters | Adopt | Users scan by type (character, tileset, map, UI). |
| Count badges (directions, animations, frames, files) | Kenney file count; Lospec color count | Adopt | Signals richness without opening the asset. |
| In-view autoplay, pause offscreen | Chrome/GitHub IntersectionObserver patterns | **Adopt (with cap + reduced motion)** | Lets you survey animations at a glance without a perf collapse. |
| Hover-to-play only | Common pattern (inference) | Adapt (desktop setting) | Saves CPU, but touch has no hover. Use in-view play or a play-badge tap on mobile. |
| Right-side inspector panel | Eagle Inspector; Scenario info panel | **Adopt (desktop)** | Keeps grid context and allows arrow-key stepping. |
| Full-screen modal / sheet | Midjourney lightbox; Sketchfab fullscreen | Adopt (mobile; desktop "focus" mode) | Small screens need the whole viewport. |
| Deep-linkable detail URL | General web practice (inference) | Adopt | Back button and shareable state; hash routing works client-side. |
| Copy prompt / copy seed buttons | AI galleries generally; Civitai generation data | Adopt | Reproducing a generation is a top task for generated assets. |
| Lineage / related items | Midjourney lightbox folder list; Civitai Remix | Adopt (character → directions → animations) | PixelLab characters are composite assets. |
| Open-in-editor hand-off | Civitai Remix | Adopt ("Open in PixelLab", "Animate in PixelLab") | View-only scope; editing happens in the official app. |
| Multi-membership folders | Midjourney, Scenario collections | **Adopt** | A local overlay can't move remote assets, and one asset fits many projects. |
| Folder groups (one level) | Midjourney | Adopt | Covers "nested" needs without a deep tree. |
| Deep nested folders | Leonardo nested collections | Avoid (initially) | Hard to drag into on touch. One level of groups covers most needs (YAGNI). |
| Smart folders / saved views | Midjourney Saved Searches; Eagle; Lightroom | **Adopt** | Metadata-rich assets make rule-based views nearly free. |
| Built-in Favorites | Midjourney heart → Favorites | Adopt | Lowest-friction organization. |
| Free-form tags | Scenario, Eagle | Adapt (later / read-only remote) | Valuable at thousands of assets, but adds UI cost. Show PixelLab-side tags if the API exposes them (Open questions). |
| Color/palette search | Eagle | Avoid for MVP; stretch | High value in Eagle, but heavy to compute client-side for thousands of assets. |
| Ratings / pick-reject flags | Lightroom | Avoid | Favorites plus folders cover the need for a view-only gallery. |
| Faceted filter chips | Scenario type bar; Midjourney filter toolbar; Firefly type dropdown | Adopt | Type, animated, directions, size bucket, date, model. |
| Timeline scrubber | Midjourney | Adapt (later) | Useful at thousands of assets; date-sorted grid first. |
| ⌘K command palette | Superhuman, Linear, Slack | Adopt (desktop) | Jump to folder, asset, or action. Show shortcuts inline. |
| Single-key shortcuts | Lightroom P/X/U; Sketchfab I/F/number keys | Adopt | F favorite, Space play, arrows step, Esc close, D download. |
| Shift-click range + marquee drag select | Midjourney | **Adopt (desktop)** | Standard bulk selection. |
| Long-press to enter selection mode | Mobile convention (inference) | Adopt (touch) | No hover or shift on touch. |
| Sticky bulk-action bar with count | Scenario "Add to Collection" bottom-right | Adopt | The bulk-action target appears only when it is needed. |
| Folder-level download | Midjourney right-click → Download | Adopt | One click to export a project. |
| Server-side ZIP | Drive, Dropbox | Avoid (not available) | The app is client-only. Stream the ZIP in the browser instead. |
| Streaming client-side ZIP to disk | fflate / client-zip + `showSaveFilePicker` | **Adopt** | Avoids holding the whole archive in memory; Blob fallback outside Chromium. |
| Metadata sidecar in export | Midjourney downloads incl. prompt metadata | Adopt | Users asked Recraft for prompt export. |
| Project-titled archive name | Recraft | Adapt | Name from view/folder + date; never "Untitled". |
| Hide instead of delete | Midjourney web | Adapt (local "hide" only) | View-only: never delete remote assets. A local hide keeps the grid clean. |
| Explicit end-of-results state | Lospec "no more palettes for your current selection" | Adopt | Clarifies filter exhaustion. |

---

## Recommended card anatomy

These are design recommendations synthesized from the patterns above.

**Always visible**
- **Thumbnail cell:** square, contain-fit, centered on a backdrop (checker by default, user-toggleable). Scale by the largest integer factor that fits the cell, with `image-rendering: pixelated`. If the asset is larger than the cell (maps, big tilesets), downscale to fit and show a "fit" scale rather than cropping. Integer downscaling of pixel art drops pixels, so a pre-rendered fit thumbnail is safer. That is an inference to test.
- **Type icon badge** (top-left): character, object, tileset, map, UI, font, VFX, image.
- **Count badge** (bottom-left), type-specific: characters show `8 dir · 12 anim`, animations show `24 f`, tilesets show `16 tiles`, maps show dimensions. This follows the honest-signal badges at Kenney (file count) and Lospec (color count).
- **Animated indicator:** a small ▶ glyph when the asset has animation, even while paused.
- **Favorite heart:** visible only when favorited, otherwise revealed on hover or focus.

**On hover/focus (desktop) or in selection mode (touch)**
- **Selection checkbox** (top-right). Once any item is selected, all checkboxes stay visible until selection clears.
- **Quick actions:** favorite, download (default format), and open inspector. Keep it to three or fewer.
- **Title + native size** (e.g., `knight · 64×64`) on an overlay strip, or as a single line under the cell in "comfortable" density.

**Animation behavior**
- Characters show a south-facing idle or first frame statically. In-view autoplay is capped, for example to the N cards nearest the viewport center (an inference; tune N by device). Hover plays on desktop. Respect `prefers-reduced-motion` by turning autoplay off. Pause offscreen with IntersectionObserver ([Chrome perf](https://chrome.dev/f/learn_performance_video/4/)).
- Render animations from frames or sheets on canvas or with CSS `steps()` rather than decoding many GIFs. GIFs are an export format, not the display format. This is an inference; no GIF-specific benchmarks were found.

**Do not put on cards:** prompt text, seed, model, or long metadata. Those belong in the inspector and the list view.

---

## Recommended inspector anatomy

**Container:** a right side panel on desktop, resizable, with arrow keys stepping through the grid while it is open (Eagle model). On mobile it is a full-screen sheet with swipe left/right to step and swipe down to close. A "focus" mode expands to fullscreen (F key, Esc exits; Sketchfab model). Each open asset has a deep-linkable URL hash.

**Sections, top to bottom:**
1. **Viewer.** Integer zoom steps (1×, 2×, 4×, 8×, fit), a backdrop toggle (checker/dark/light), and an optional pixel-grid overlay.
   - Playback: play/pause (Space), frame step (←/→ when the viewer has focus; otherwise arrows step assets), an FPS control within the observed 1–30 fps range, and loop. Onion skin is optional and later (Aseprite F3 model).
   - **Direction picker** for 4/8-direction characters: a compass rose. Selecting a direction plays the current animation in that direction.
   - **Animation list** for characters: thumbnails or names (walk, idle, attack...) with frame counts.
   - Tilesets/maps: a pan-and-zoom canvas; tilesets can toggle a tile-index overlay (sprite-viewer frame-number pattern).
2. **Title and type**, with native size, frame count, and direction count.
3. **Actions row.** Favorite (F), Download ▾ (D, with format menu: PNG, sprite sheet, GIF, frames ZIP, integer scale), **Open in PixelLab** / **Animate in PixelLab** (external link, clearly marked as leaving the app), and Copy link.
4. **Generation metadata.** The prompt as a block with a **Copy** button (and negative prompt if present). Model/tool, size, seed (copy button), view/perspective, created date. Only fields the API actually returns appear; empty fields are hidden, never shown as "N/A".
5. **Lineage.** Parent (e.g., the character an animation belongs to) and children (directions and animations), as small clickable thumbnails. Where the API exposes it, also "generated from" (image-to-pixel-art source, edits).
6. **Local organization.** Folder membership chips (add/remove; the Midjourney lightbox shows folder membership), local tags if adopted, and hide from grid.
7. **Raw details (collapsed).** Asset ID and API fields for debugging and power users.

**Multi-selection in the inspector:** show a selection summary (count, types, total frames, estimated export size) and the bulk actions, instead of one asset (Eagle has a "Selection" tab).

---

## Recommended organization model (local-only)

All of this is design recommendation. The citations show which product validates each piece.

- **Source of truth.** Remote PixelLab assets are read-only. Local organization is a thin overlay keyed by stable PixelLab asset ID and stored in IndexedDB. It never moves, renames, or deletes remote assets (Midjourney "hide not delete" adapted).
- **Built-in views** (not user-deletable): All assets, Favorites, and one view per asset type (Characters, Objects, Tilesets, Maps, UI, Fonts, VFX, Images), plus Animated and Recently added. Hidden goes at the bottom.
- **Folders** are user-created, flat, with **multi-membership**: an asset can be in many folders (Midjourney, Scenario). **Folder groups** give one level of collapsible grouping (Midjourney). Defer deep nesting. A folder offers **Download folder** from its context menu.
- **Favorites** is a single boolean per asset, toggled by heart or the F key (Midjourney Favorites, Lightroom single-key triage).
- **Smart views (saved views)** save the current filter, sort, and search state under a name, and update live (Midjourney Saved Searches, Eagle Smart Folders, Lightroom Smart Collections). Rule fields come straight from metadata: type, animated, direction count, frame count, size range, model/tool, date range, prompt text, folder, favorite. MVP semantics are AND-of-chips. Add OR groups only on demand (Eagle's docs don't even specify).
- **Tags.** Show PixelLab-side tags read-only if the API returns them. The PixelLab MCP tool list includes `update_character_tags` and `update_object_tags`, which suggests server-side tags exist for characters and objects; verify via REST. Defer local free-form tags. Folders plus saved views cover most needs at first, and tags can come later if users ask (Scenario says tags matter at thousands of assets, so revisit then).
- **Drag-and-drop.** On desktop, drag cards (or the current selection) onto sidebar folders, as Midjourney does. On touch, use "Add to folder…" in the bulk bar or inspector, because drag targets in a collapsed mobile sidebar are unreliable. That is an inference.
- **Import/export of organization.** One versioned JSON file `{version, exportedAt, folders, groups, favorites, savedViews, hidden}`, keyed by asset ID. Import merges by ID, skips duplicates, never overwrites silently, and reports orphaned IDs (assets no longer in the account). Test round-trips explicitly to avoid the Raindrop flattening failure ([WorldBrain report](https://community.worldbrain.io/t/raindrop-io-import-retain-collection-structure/936)).
- **Multi-account.** Scope the overlay per account (or per token fingerprint, never storing the token in the export) so switching accounts doesn't mix organization.

---

## Bulk export UX recommendation

**Selection**
- Desktop: click a checkbox or Ctrl/Cmd-click to toggle, Shift-click for a range, drag a marquee on empty grid space (Midjourney), Ctrl/Cmd+A selects everything in the current view, and Esc clears.
- Touch: long-press enters selection mode, then tap to toggle. A "Select all in view" button sits in the bar.
- Selection survives filter changes. The bar shows "N selected (M hidden by filter)" so nothing is exported by surprise.
- A sticky bottom action bar shows the count plus Download, Add to folder, Favorite, and Clear (Scenario puts "Add to Collection" bottom-right). The same actions exist on mobile and desktop, avoiding the Firefly gap.

**Export dialog (one screen, sensible defaults, remembers the last choice)**
- **What:** for characters, all directions and all animations (default) or the currently filtered subset.
- **Format presets:** Original PNGs (default), Sprite sheets (row per animation/direction), GIFs, and Individual frames. More than one can be selected.
- **Scale:** integer only (1×, 2×, 4×, 8×), nearest-neighbor.
- **Naming:** a preview of resulting paths, e.g. `{folder}/{type}/{name}/{animation}_{direction}_{frame}.png`, with one editable template. The default archive name is `pixellab-{view-or-folder}-{YYYY-MM-DD}.zip` (Recraft lesson).
- **Include metadata:** on by default. Writes `metadata.json` with prompt, seed, model, size, dates, and IDs (Midjourney metadata in downloads; Recraft users asking for prompts).
- **Estimate:** file count and approximate size before starting.

**Packaging and progress**
- Stream the ZIP client-side, writing directly to disk with `showSaveFilePicker` where available and falling back to a Blob download ([DEV article](https://dev.to/certosinolab/streaming-large-zip-archives-in-the-browser-with-vue-and-the-file-system-access-api-42ng); [fflate guide](https://github.com/101arrowz/fflate/wiki/Guide:-Modern-(Buildless))). PNG/GIF are already compressed, so store-only ZIP (client-zip style) is fine ([client-zip overview](https://socket.dev/npm/package/client-zip/overview/1.6.5)).
- Progress shows "Fetching 132 / 480 assets · 41 MB", with a determinate bar, current item name, and **Cancel**. Cancel aborts in-flight fetches and closes the stream cleanly.
- Fetch concurrency is limited and retries back off. Respect PixelLab API rate limits (unknown; see Open questions).
- **Partial failure:** finish the archive, add an `errors.txt`, and show "478 exported, 2 failed: Retry failed". Never fail the whole export for one asset.
- **Fallback chunking:** on the Blob path (no streaming to disk), split very large exports into parts the way Drive does (`-part2`), because the whole archive is held in memory. The part size is TBD by testing; Drive uses 2 GB ([Google blog, older](https://workspaceupdates.googleblog.com/2016/08/improvements-to-downloading-files-and-folders-in-Drive.html)).
- **Single-asset quick download:** the card or inspector "Download" downloads the default format directly with no dialog. The ▾ menu exposes formats.
- Exports run in the background with a small persistent progress chip, so browsing continues. Warn before closing the tab while an export is running.

---

## Onboarding, connect-account, and empty states

- **Connect screen:** one token field, a link to where the token is obtained in PixelLab, and a plain statement: "Your token stays in this browser and is sent only to PixelLab's API." Offer **Remember on this device** (persistent) or **This session only** (memory), and a visible **Disconnect / forget token** in settings ([OpenAI community BYOK debate](https://community.openai.com/t/bring-your-own-key-policy/446168); [TanStack BYOK](https://tanstack.com/ai/latest/docs/advanced/byok)). Keep a strict CSP and no third-party scripts, because browser-stored tokens are exposed to XSS (same sources).
- **Validate immediately** with a cheap read call. On success, confirm with the account name or balance if available. On failure, show a specific message (invalid token, network, CORS) instead of a generic error.
- **First load:** a skeleton grid, then progressive fill by type with per-type counts as they arrive. Thousands of assets require virtualization; this is an inference.
- **Empty states:** "No assets yet: create in PixelLab" (external link) for an empty account. For a filter with no results, list the active filters, offer "Clear filters", and say explicitly that the end of results has been reached (Lospec).

---

## Cautionary tales

- **Missing bulk download pushes users to fragile third-party tools.** Leonardo relies on paid Chrome extensions ([Gumroad](https://acepter.gumroad.com/l/Leonardoaibulkdownloader)). The Midjourney Archive Downloader reportedly broke after a URL change ([Chrome Web Store](https://chrome.google.com/webstore/detail/midjourney-archive-downlo/galjoekncljjmianlpmjgcmaihjohndl)). Adobe CC Libraries had no batch download, with staff in 2019 citing format complexity ([Adobe community](https://community.adobe.com/questions-606/how-to-bulk-download-images-within-libraries-to-my-computer-579733)). Recraft took about 15 months from request to implementation ([Recraft feedback](https://feedback.recraft.ai/feature-requests/p/bulk-image-download)).
- **"Hide" can mislead.** Midjourney's web "hide" leaves images public ([Midjourney docs via search](https://docs.midjourney.com/hc/en-us/articles/33329462451469)). If PixelLab Gallery offers "hide", the label must say "Hide from this gallery (local only)".
- **Platform parity gaps.** Firefly documents bulk select on mobile but single download on web ([Adobe web](https://helpx.adobe.com/firefly/web/access-your-files/view-generation-history.html) vs [mobile](https://helpx.adobe.com/firefly/mobile/view-generation-history/generation-history-overview.html)).
- **Generic archive names.** Recraft names ZIPs after the project, so "Untitled" projects produce unhelpful names ([Recraft feedback](https://feedback.recraft.ai/feature-requests/p/bulk-image-download)).
- **Import that loses structure.** A Raindrop re-import flattened collections ([WorldBrain](https://community.worldbrain.io/t/raindrop-io-import-retain-collection-structure/936)).
- **App-local metadata doesn't travel.** Lightroom flags can't be written to files ([Lightroom Queen](https://www.lightroomqueen.com/flags-star-ratings/)). Local folders and favorites are lost on cache clear unless the user exports them. Prompt for a backup after meaningful organization work, and note that browsers may evict IndexedDB unless persistent storage is granted (inference; verify with `navigator.storage.persist()` docs).
- **Big-library performance.** Even native Eagle tells users to use an SSD and split libraries past 100k files ([HackDesign](https://www.hackdesign.org/toolkit/eagle/)). A browser app needs virtualization, lazy decode, and capped animation from day one.
- **Masonry accessibility.** Visual order diverges from DOM order, and the problems vary by breakpoint ([CSSWG #5675](https://github.com/w3c/csswg-drafts/issues/5675)).
- **Pixel art mangled by non-integer scaling and browser zoom** ([32bit.cafe](https://discourse.32bit.cafe/t/a-problem-with-image-rendering-pixelated/475)).
- **Archive caps.** Dropbox fails outright above 250 GB or 10,000 files ([Dropbox forum](https://dropboxforum.com/t5/View-download-and-export/Dropbox-limits-on-zipped-files-preventing-downloading-as-backup/m-p/702475)). Know your limits and split before you hit them.

---

## Open questions

- **PixelLab API facts** (out of scope here; likely covered by other research notes): which list endpoints return prompt, seed, model, view, and dates for each asset type? Are there rate limits, pagination, and CORS allowances for browser calls? Are server-side character and object tags readable via REST? (The MCP surface has `update_character_tags` and `update_object_tags`.) Are frame URLs or sprite sheets directly downloadable, or must frames be composed client-side?
- **Thumbnail strategy for large assets:** downscaling maps and tilesets with `pixelated` versus smooth versus pre-rendered fit thumbnails needs a visual test with real PixelLab assets.
- **Animation cap:** how many simultaneous in-view canvases or CSS-steps animations stay smooth on mid-range phones? I found no benchmarks; measure.
- **Not verified this pass:** Krea, Ideogram, Pixave, Adobe Bridge, Figma/Spline browsers, Dribbble, Behance, ArtStation, Unsplash, Are.na, OpenGameArt, CraftPix, Unity Asset Store, Piskel, and Civitai's image-page layout. Whether Midjourney/Eagle offer a thumbnail-size slider and how it behaves is also unverified, as is Midjourney's lightbox copy-prompt/"use image"/"use style" UI (official docs returned 403).
- **Eagle smart-folder semantics:** AND vs OR logic and nesting are unspecified in the sources found.
- **Storage durability:** behavior of `navigator.storage.persist()` across Safari/iOS for the local organization overlay.
- **Browser support for `showSaveFilePicker`:** current Firefox/Safari status was not verified, and the fallback path must be designed and tested.
- **User-research signal:** Reddit and Product Hunt complaint mining returned little directly relevant material (no Reddit threads surfaced for Midjourney organize or Leonardo library). A targeted pass on r/PixelArt and r/gamedev about managing generated assets would add evidence.

---

## Sources

AI generation galleries
- Midjourney, "New Tools for Organization" (2025-02-20): https://updates.midjourney.com/new-tools-for-organization/
- Midjourney docs, Organizing Your Creations (403 on fetch; via search): https://docs.midjourney.com/hc/en-us/articles/33329462451469
- AI wiki, Midjourney organize images guide (2025-10-11, third-party): https://artificial-intelligence-wiki.com/ai-tools/midjourney/midjourney-organize-images-guide/
- Midjourney Archive Downloader (Chrome Web Store): https://chrome.google.com/webstore/detail/midjourney-archive-downlo/galjoekncljjmianlpmjgcmaihjohndl
- Leonardo help, Collections: https://intercom.help/leonardo-ai/en/articles/9047341-collections
- Leonardo bulk downloader (third-party, Gumroad): https://acepter.gumroad.com/l/Leonardoaibulkdownloader
- Leonardo bulk downloader (extscope listing): https://www.extscope.org/extension/ocamdihnglddmocicgghjicbidakcfdl
- TechRadar Leonardo review: https://www.techradar.com/pro/software-services/leonardoai-ai-image-generator-review
- Scenario help, Tags: https://help.scenario.com/articles/7782236276-tags
- Scenario help, Collections: https://help.scenario.com/en/articles/collections
- Adobe Firefly web, View generation history: https://helpx.adobe.com/firefly/web/access-your-files/view-generation-history.html
- Adobe Firefly mobile, Generation history overview: https://helpx.adobe.com/firefly/mobile/view-generation-history/generation-history-overview.html
- Recraft docs, How to export an image: https://www.recraft.ai/docs/recraft-studio/exporting-and-sharing/how-to-export-an-image
- Recraft feedback, Bulk Image Download: https://feedback.recraft.ai/feature-requests/p/bulk-image-download
- Civitai article 15955 (Jun 2025, user-written): https://civitai.com/articles/15955
- Retro Diffusion rd-animation (Replicate): https://replicate.com/retro-diffusion/rd-animation
- Retro Diffusion MCP (mcpservers.org): https://mcpservers.org/servers/retro-diffusion/retro-diffusion-mcp

Asset managers
- Eagle blog, Smart Folders deep dive: https://eagle.cool/blog/post/how-traditional-folders-slow-down-your-design-workflow-a-deep-dive-into-eagles-smart-folders
- Eagle docs, Smart folders: https://en.eagle.cool/article/559-smart-folders
- Eagle support, Interface – Inspector: https://en.eagle.cool/support/article/interface-inspector
- Eagle docs, Inspector (legacy URL, via search snippet): https://en.eagle.cool/article/477-interface-inspector
- Eagle blog, organize media library review (vendor-hosted): https://de.eagle.cool/blog/post/how-to-organize-media-library
- HackDesign, Eagle toolkit: https://www.hackdesign.org/toolkit/eagle/
- Capterra, Eagle reviews: https://www.capterra.com/p/184384/Eagle/reviews/
- Trustpilot, Eagle: https://de.trustpilot.com/review/eagle.cool
- Adobe help, Lightroom Classic Smart Collections criteria: https://helpx.adobe.com/dk/lightroom-classic/help/smart-collections-criteria-in-lightroom-classic.html
- Lightroom Queen, Flags and star ratings: https://www.lightroomqueen.com/flags-star-ratings/
- Julieanne Kost, Flags/Stars/Labels (2024-06): https://jkost.com/blog/2024/06/applying-flags-stars-and-color-labels-in-lightroom-classic.html
- Raindrop help, Import: https://help.raindrop.io/import
- Raindrop developer docs index: https://developer.raindrop.io/llms.txt
- WorldBrain community, Raindrop import structure: https://community.worldbrain.io/t/raindrop-io-import-retain-collection-structure/936
- Google Workspace Updates, Drive download improvements (2016, older): https://workspaceupdates.googleblog.com/2016/08/improvements-to-downloading-files-and-folders-in-Drive.html
- Dropbox help, Download entire folders: https://help.dropbox.com/desktop-web/download-entire-folders
- Dropbox forum, ZIP limits: https://dropboxforum.com/t5/View-download-and-export/Dropbox-limits-on-zipped-files-preventing-downloading-as-backup/m-p/702475
- Frontify help, Bulk curation: https://intercom.help/frontify/en/articles/2825263-bulk-curation-in-libraries
- Adobe community, bulk download CC Libraries: https://community.adobe.com/questions-606/how-to-bulk-download-images-within-libraries-to-my-computer-579733

Layout, rendering, performance, interaction
- Wavecast, Photo listings (grid/justified/masonry): https://reference.wavecast.io/components/photos/listings/
- Wavecast, Justified rows: https://reference.wavecast.io/components/photos/listings/justified-rows/
- Wavecast, Masonry: https://reference.wavecast.io/components/photos/listings/masonry/
- Clickbooq, Grid gallery style: https://support.clickbooq.com/hc/en-us/articles/211263283-Using-the-Grid-Gallery-Style
- Visual Portfolio, Grid layout: https://www.mintlify.com/nk-crew/visual-portfolio/layouts/grid
- CSSWG issue #5675, masonry accessibility: https://github.com/w3c/csswg-drafts/issues/5675
- OpenReplay, CSS Grid Lanes: https://blog.openreplay.com/css-grid-lanes-masonry-layout/
- buildmvpfast, Native masonry 2026: https://www.buildmvpfast.com/blog/css-grid-lanes-native-masonry-2026
- 32bit.cafe, image-rendering: pixelated problem: https://discourse.32bit.cafe/t/a-problem-with-image-rendering-pixelated/475
- modern-css, image-rendering reference: https://modern-css.com/reference/properties/image-rendering/
- W3C public-css-archive, pixelated at non-integer scales (2021-01): https://lists.w3.org/Archives/Public/public-css-archive/2021Jan/0055.html
- Chrome Learn Performance, video lazy-play: https://chrome.dev/f/learn_performance_video/4/
- GitHub engineering, homepage performance: https://github.blog/engineering/making-githubs-new-homepage-fast-and-performant/
- Superhuman, How to build a remarkable command palette: https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/
- Chameleon, Cmd+K search pattern: https://www.chameleon.io/patterns/cmd-k-search
- DEV, Streaming large ZIPs with File System Access API: https://dev.to/certosinolab/streaming-large-zip-archives-in-the-browser-with-vue-and-the-file-system-access-api-42ng
- fflate wiki, Modern (buildless) guide: https://github.com/101arrowz/fflate/wiki/Guide:-Modern-(Buildless)
- client-zip overview (Socket): https://socket.dev/npm/package/client-zip/overview/1.6.5
- OpenAI community, BYOK policy: https://community.openai.com/t/bring-your-own-key-policy/446168
- TanStack AI, BYOK: https://tanstack.com/ai/latest/docs/advanced/byok

Game-asset and pixel-art sites/tools
- itch.io, animated-sprites + asset-pack tag: https://itch.io/game-assets/newest/tag-animated-sprites/tag-asset-pack
- itch.io, gif tag: https://itch.io/game-assets/tag-gif
- Kenney, Prototype Kit: https://www.kenney.nl/assets/prototype-kit
- Kenney, Support: https://kenney.nl/support
- Lospec, 2bit palette tag: https://lospec.com/palette-list/tag/2bit
- Sketchfab help, Model Inspector: https://help.sketchfab.com/en/articles/16152718
- Kildare Local History, K3D viewing tips: https://kildarelocalhistory.ie/a-brief-history-of-co-kildare/k3d-co-kildare-heritage-in-3d/k3d-tips-for-viewing/
- Aseprite docs, Animation: https://aseprite.org/docs/animation/
- Aseprite docs, Onion skinning: https://aseprite.org/docs/onion-skinning/
- Aseprite community, Spritesheet animation preview request: https://community.aseprite.org/t/request-spritesheet-animation-preview/3743
- imageonline.io, Sprite Sheet Animator: https://imageonline.io/sprite-sheet-animator/
- 3ee, Spritesheet frame overlay: https://3ee.itch.io/spritesheet-frame-overlay
- javainuse, Sprite sheet to GIF: https://www.javainuse.com/sprite-sheet-to-gif
- spritecook, Sprite sheet slicer: https://www.spritecook.ai/sprite-sheet-slicer
