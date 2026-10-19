# Platform Gallery Apps: UX Patterns for PixelLab Gallery

Research date: 2026-10-18. Scope: Apple Photos (iOS/iPadOS/macOS 26), Finder, Google Photos (Android/iOS/web), Samsung Gallery, Android Photo Picker, Microsoft Photos and File Explorer Gallery (Windows 11), Amazon Photos, and Adobe Lightroom. Platform guidance (Android adaptive navigation, W3C APG, NN/g, MDN) is included where it decides a pattern for us.

Confidence key: claims are cited inline. **[older]** marks sources from before 2024. **[test/leak]** marks features found in APK teardowns or betas that may not have shipped. Statements under "for us" and verdicts are inferences unless they carry a citation.

---

## Summary

1. **Open on the grid and keep tabs few and fixed.** The iOS 18 single-scroll redesign put everything on "one never-ending page" ([9to5Mac](https://9to5mac.com/2025/08/28/ios-26-fixed-the-photos-app-its-more-powerful-than-ever/)). Apple pulled parts of it during the beta and then brought back Library/Collections tabs in iOS 26 ([iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign); [TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)). Google Photos and iOS 26 have both settled on the same model: a grid tab, a collections tab, and search kept apart from both ([Android Authority](https://www.androidauthority.com/google-photos-bottom-bar-redesign-3537107); [MacRumors](https://macrumors.com/guide/ios-26-photos-app)). We should use it as is.
2. **Don't hide a working gesture, and don't move familiar controls.** Google pulled a Library redesign in 2022 after backlash ([Droid Life](https://www.droid-life.com/2024/08/08/google-photos-introduces-collections-to-replace-library-tab/)). An August 2026 bug that broke drag-to-select drew press coverage within days ([Android Authority](https://androidauthority.com/google-photos-drag-to-select-missing-3696148); [PhoneArena](https://www.phonearena.com/news/popular-google-photos-feature-goes-missing_id182462)). Users notice when muscle memory breaks.
3. **Show pixel art in square cells, fitted rather than cropped.** Apple offers a square grid and an aspect-ratio grid, and the square grid crops thumbnails ([Apple Community](https://discussions.apple.com/thread/256038315)). Google Photos web uses a justified layout ([Flickr justified layout](https://code.flickr.net/author/jimwhimpey/)). Sprites range from 16 px to large maps, so we should use uniform square cells with `object-fit: contain`, nearest-neighbor scaling, and a transparency backdrop. Cropping a sprite cuts off the character.
4. **Offer discrete density levels.** Use pinch on touch screens and +/- keys plus a slider on desktop. Samsung has 5 pinch levels ([SlashGear](https://www.slashgear.com/1623030/samsung-galaxy-gallery-apps-features)), Mac Photos uses Cmd +/- and trackpad pinch ([Apple](https://support.apple.com/guide/photos/pht9b4411b24/mac)), and Windows Photos offers S/M/L sizes ([Technipages](https://www.technipages.com/windows-11-how-to-change-image-thumbnail-size)). In a browser, don't take over Ctrl +/-, because that is browser zoom.
5. **Show a floating position label while scrolling.** Google Photos replaced date headers with a top pill that appears during scroll and then fades, and kept a "Show dates in grid" setting for people who want headers back ([9to5Google](https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/)). Windows and File Explorer use a timeline scrollbar you can drag ([Help Desk Geek](https://helpdeskgeek.com/how-to-use-the-new-photos-app-in-windows-11/); [Digital Citizen](https://digitalcitizen.life/gallery-windows-11)).
6. **Keep the DOM small with virtualization.** Google Photos web keeps "never more than 50 photos" in the DOM, applies CSS `contain` per section, batches work with rAF, and estimates layout for sections not yet shown ([Google Photos web UI write-up, 2018](https://steemit.com/art/@whatspal/buildingthegooglephotoswebui-sinr80fhdv)) **[older]**.
7. **Selection follows a near-universal grammar:**
   - Touch: long-press, then drag to select a range ([Popular Science](https://www.popsci.com/diy/select-multiple-photos-ios-android/); [SlashGear](https://www.slashgear.com/1623030/samsung-galaxy-gallery-apps-features)).
   - Desktop: click, Shift-click for a range, Cmd/Ctrl-click to toggle, marquee drag, Cmd-A ([Apple](https://support.apple.com/guide/photos/pht9b4411b24/mac)).
   - A visible Select button as a fallback that doesn't need a gesture ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)).
8. **The viewer gesture set is settled:** swipe left/right to move between items, swipe down to close ([iPhone Life](https://iphonelife.com/content/tip-day-swipe-down-photos-return-album-view)), swipe up for info ([OWC](https://eshop.macsales.com/blog/38031-quick-ios-10-tip-easily-find-photo-info-by-swiping-up/)), arrows/Esc/Space and Cmd-I on desktop ([Apple](https://support.apple.com/guide/photos/pht9b4411b24/mac)), and an optional filmstrip (Mac Option-S; Windows viewer ribbon).
9. **The viewer is a modal dialog for accessibility purposes.** Move focus into it, trap Tab, close on Esc, and return focus to the thumbnail ([W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). Also let the browser Back button close it ([NN/g](https://www.nngroup.com/articles/overuse-of-overlays/)) **[older]**.
10. **Favorites should be one tap or one key and always reachable.** Mac uses the "." key ([Apple](https://support.apple.com/guide/photos/pht9b4411b24/mac)). Google puts a Favorites pill at the top of Collections ([9to5Google](https://9to5google.com/2024/08/08/google-photos-library-collections-redesign/)). iOS 26 has a Pinned section in Collections ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)).
11. **Albums and folders should be references, not copies.** File Explorer Gallery is a view over files left in place, and removing a source deletes nothing ([Pureinfotech](https://pureinfotech.com/add-remove-folders-gallery-file-explorer-windows-11/)). Our local folders should be many-to-many references to remote asset IDs and should never touch the PixelLab account.
12. **Let sections collapse, remember the state, and stop there.** iOS 26 Collections sections collapse and reorder, and the app remembers which were expanded and the last tab used ([MacRumors](https://macrumors.com/guide/ios-26-photos-app); iOS 26 hands-on coverage surfaced by search, most likely [Apple Magazine](https://applemagazine.com/ios-26-photos-layout-2026-2/amp/) but not verified). Google is testing the same idea ([Android Authority](https://www.androidauthority.com/google-photos-collections-redesign-apk-teardown-3660010/)) **[test/leak]**. iOS 18's "Customize & Reorder" was a patch over a confusing structure ([BGR](https://bgr.com/tech/people-are-raging-over-the-ios-18-photos-app-redesign-heres-how-to-fix-it/)), not a fix for it.
13. **Don't put AI or memories carousels above the library.** Apple removed the iOS 18 carousel during the beta ([iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign)). Amazon's May 2026 redesign puts a memories carousel at the top of a home screen that is no longer a grid ([9to5Google](https://9to5google.com/2026/05/05/amazon-photos-app-redesign/)). Ours is a working tool, so the grid comes first.
14. **Navigation should change with window size:** a bottom bar on compact screens, a rail on medium, and a sidebar that can be hidden on expanded screens. This matches Android's adaptive defaults ([Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)) and iPadOS/macOS Photos, where the sidebar can be hidden ([Apple iPadOS 26 features PDF](https://www.apple.com/in/os/pdf/All_New_Features_iPadOS_26_Sept_2025.pdf)).
15. **Respect reduced motion.** Swap zoom-from-thumbnail for a crossfade under `prefers-reduced-motion`, which maps to the iOS, Android, Windows, and macOS motion settings ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).

---

## Per-app notes

### Apple Photos: iOS 18, the single-view redesign (2024)
- **Structure:** a single scrolling view with the grid at the top and "collections" below. Tabs were removed and there were "multiple paths to the same destination" ([heise](https://heise.de/-9832016)).
- **Changed during the beta:** Bloomberg (via iMore, 11 Aug 2024) reported that Apple removed the carousel, "tweaked the photo grid to be more user-friendly", moved albums higher, and put saved content back in the main grid. Gurman called the design "probably a little too bold and potentially confusing" ([iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign)).
- **Complaints after launch:**
  - Navigation tabs were gone and easy-to-find elements were buried ([Tom's Guide](https://tomsguide.com/phones/iphones/ios-26-has-brought-yet-another-photos-app-overhaul-for-your-iphone-heres-how-its-different)).
  - "Nothing really had its own place" ([9to5Mac](https://9to5mac.com/2025/08/28/ios-26-fixed-the-photos-app-its-more-powerful-than-ever/)).
  - Some developers sold paid third-party apps that recreated the old interface ([TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)).
- **What was praised:** the utility collections (receipts, QR codes, duplicates), natural-language search, and being able to reorder and hide sections ([heise](https://heise.de/-9832016)).

### Apple Photos: iOS 26 (2025)
- **Tabs:**
  - Library (pure grid) and Collections, with search as its own button at the bottom right ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16); [9to5Mac](https://9to5mac.com/2025/08/28/ios-26-fixed-the-photos-app-its-more-powerful-than-ever/)).
  - Federighi presented the tabs as "separate tabs for Library and for Collections" ([TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)).
- **Liquid Glass:** when you scroll up in Library, the tab bar morphs into Years / Months / All segmented controls ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16)). The bar is translucent so the "focus is on the photos" ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)).
- **Library controls:**
  - A larger Select button.
  - A filter/view-options button that is always visible. In iOS 18 it only appeared after scrolling.
  - View options include zoom and excluding screenshots ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)).
  - Pinch resizes grid squares ([AppleInsider via search](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool)).
  - A square vs aspect-ratio grid toggle sits under View Options. The square grid crops thumbnails ([Apple Community, Apr 2025](https://discussions.apple.com/thread/256038315)).
- **Collections:**
  - Section order: Recent Days, People & Pets, Pinned, Memories, Trips, Albums, Featured.
  - Sections collapse to their names, and there is a top control for collapse all / show all / reorder / view.
  - Three tile sizes are available ([MacRumors](https://macrumors.com/guide/ios-26-photos-app); [MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16)).
  - The app remembers expanded sections and the last tab used. This came from a search summary of iOS 26 hands-on coverage, most likely [Apple Magazine](https://applemagazine.com/ios-26-photos-layout-2026-2/amp/), and was not verified against the page.
  - The option to exclude collection types was removed ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)), and commenters miss it.
- **Reception:** mostly positive.
  - 9to5Mac: "I think they nailed it" ([9to5Mac](https://9to5mac.com/2025/08/28/ios-26-fixed-the-photos-app-its-more-powerful-than-ever/)).
  - Neowin: the single view "attracted more haters than lovers" ([Neowin, via search](https://www.neowin.net/news/ios-26-photos-app-whats-good-and-whats-bad-in-the-latest-update/)).
  - MacStories misses the Recent Days highlights under the grid and wants a choice between classic and unified layouts ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16)).
  - One counterpoint: the single scroll made Screenshots and Videos quicker to reach ([search summary of iOS 26 coverage](https://ios.gadgethacks.com/news/why-photos-in-ios-26-finally-makes-sense-again/)).

### Apple Photos: iPadOS 26 and macOS
- **iPad:** uses a sidebar (Library, Collections, albums, media types) instead of tabs, and the sidebar can be hidden to let photos fill the screen ([AppleInsider via search](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool); [Apple iPadOS 26 features](https://www.apple.com/in/os/pdf/All_New_Features_iPadOS_26_Sept_2025.pdf)). The grid has a fill vs fit control in the top bar on iPad and macOS ([AppleInsider via search](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool)).
- **macOS keyboard model** ([Apple](https://support.apple.com/guide/photos/pht9b4411b24/mac)):

  | Area | Keys and gestures |
  |---|---|
  | Moving | arrows move between items; hold an arrow to scroll fast |
  | Open/close | Space or double-click opens; Space, double-click, or Esc closes |
  | Zoom | Cmd +/- changes zoom or thumbnail size; pinch zooms; Z toggles fit/100% |
  | Organize | "." favorites |
  | Panels | Cmd-I opens info; Option-S toggles the filmstrip; Ctrl-Cmd-F goes full screen; Cmd-F searches |
  | Selection | click, Shift-click (range), Cmd-click (toggle), drag a marquee, Cmd-A, Shift-Cmd-A deselects |
  | Slideshow | Space pauses |

### Apple Finder and Files: Gallery view
- Gallery view shows a large preview of the selected item, a filmstrip row of items below it, and details in a preview column. Icon view is the thumbnail grid and has an "Icon size" slider ([Apple](https://support.apple.com/guide/mac-help/mchle9f0a1b2/mac)).
- The Finder preview pane has configurable metadata and Quick Actions such as rotate ([Apple](https://support.apple.com/guide/mac-help/use-gallery-view-mchl1e4644c2/mac)).
- For us: Gallery view is a good model for a desktop "inspect" layout, with a large preview, a filmstrip, and a metadata column.

### Google Photos: Android and iOS
- **Bottom bar (2025):** Photos / Collections / Search. Memories moved into Collections and the feed was renamed "Moments" ([Android Authority](https://www.androidauthority.com/google-photos-bottom-bar-redesign-3537107)).
- **July 2026 change:**
  - The bottom bar became a floating pill with Photos / Collections / Create, with search and Ask Photos on the right.
  - The day/date label moved to a top pill that shows while scrolling and then fades.
  - Left-aligned date headers are off by default. The "Show dates in grid" setting brings them back.
  - Early reactions were positive ([9to5Google](https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/)).
- **Collections (2024):** replaced Library ([9to5Google](https://9to5google.com/2024/08/08/google-photos-library-collections-redesign/)).
  - Favorites and Trash pills at the top.
  - A dynamic 2x2 grid of the most-visited items.
  - Albums can be shown as a grid or a list and sorted by last modified, title, or most recent photo.
  - Utilities was removed.
  - This followed a 2022 Library redesign that was pulled after backlash ([Droid Life](https://www.droid-life.com/2024/08/08/google-photos-introduces-collections-to-replace-library-tab/)).
- **Collections tests:** a shortcut carousel was tested in November 2025 ([9to5Google](https://9to5google.com/2025/11/24/google-photos-shortcuts-redesign/)) **[test/leak]**. Collapsible sections that remember their state were tested in April 2026 ([Android Authority](https://www.androidauthority.com/google-photos-collections-redesign-apk-teardown-3660010/)) **[test/leak]**.
- **Density:** pinch moves between layouts such as Comfortable / Day / Month, and the same choice is in the overflow menu as Layout ([Computerworld](https://www.computerworld.com/article/1620082/new-google-photos-app.html); [PCWorld](https://www.pcworld.com/article/422750/6-ways-to-make-the-most-of-google-photos-for-android-and-ios.html)) **[older]**. Sources disagree on which layout is the default.
- **Selection:**
  - Long-press until the check appears, then drag without lifting ([Popular Science](https://www.popsci.com/diy/select-multiple-photos-ios-android/)).
  - A checkmark next to a date or month selects that group (same source) **[older tutorial]**.
  - In August 2026 drag only scrolled the grid on Pixel, Samsung, and OnePlus phones. A fix shipped on about 12 Aug ([Android Authority](https://www.androidauthority.com/google-photos-drag-to-select-fixed-3697467/)).

### Google Photos: web
- **Grid engineering (2018)** **[older]** ([write-up copy](https://steemit.com/art/@whatspal/buildingthegooglephotoswebui-sinr80fhdv); original at [Google Design on Medium](https://medium.com/google-design/google-photos-45b714dfbed1), which blocked fetching):
  - Justified layout with no square crops ([derivative summary](https://dev.to/shaileshpandit/how-to-implement-google-photos-grid-in-javascript-575i)).
  - About 10 ms of each 16 ms frame budget is available for app code.
  - At most about 50 photos in the DOM.
  - Hierarchy of sections, segments, and tiles, absolutely positioned, with CSS `contain`.
  - Section heights are estimated until a section scrolls into view.
  - rAF-batched scroll and resize work.
- **Keyboard** ([Guiding Tech, 2018, updated 2022](https://www.guidingtech.com/google-photos-keyboard-shortcuts/)) **[older]**:
  - Moving and closing: arrows move; Esc closes or deselects all.
  - Actions: x selects or deselects; i shows info; / searches; Shift+D downloads; Shift+R rotates; Shift+A archives; # deletes; Shift+? lists shortcuts.
  - Shift-click range and Ctrl/Cmd-A select-all come only from low-quality tutorials ([TutorialTactic](https://tutorialtactic.com/blog/google-photos-shortcuts/)). Treat them as likely but unverified.

### Samsung Gallery (One UI)
- **Pictures tab:** pinch steps through 5 levels: large, medium, and small previews, then monthly and yearly views. Pinching in the viewer closes the photo ([SlashGear, Jul 2024](https://www.slashgear.com/1623030/samsung-galaxy-gallery-apps-features)).
- **Albums and Stories tabs:** pinch on Albums moves from large squares to medium to a list. Pinch on Stories switches between 1 and 2 cards per row (same source).
- **Selection:** long-press, then slide to select a range. Keep holding and the selection stacks under your finger, so you can drag it into an album or another app. Swipe up in the viewer shows metadata (same source).
- **Album visibility:** a "Select albums to show" setting hides albums (Android 13+) ([Samsung support](https://www.samsung.com/uk/support/mobile-devices/how-to-select-and-view-only-the-albums-you-want-to-see-in-galaxy-gallery/)).
- **One UI 8:** added a Private Album and new icons ([SamMobile](https://www.sammobile.com/news/complete-samsung-one-ui-8-guide-galaxy/)).
- **One UI 8.5:** stacked multi-image album thumbnails were reported ([Yahoo Tech](https://tech.yahoo.com/apps/articles/one-ui-8-5-leak-130359118.html)) **[test/leak]**.
- I found no source confirming changes to grid gestures in One UI 7 or 8.

### Android Photo Picker
- **Standard picker:** browses newest to oldest, supports single selection or multi-select capped at `maxItems`, filters by type (image, video, or a MIME type such as `image/gif`), opens half-screen for single selection, includes cloud providers, and updates without app changes ([Android Developers, updated 2026-10-16](https://developer.android.com/training/data-storage/shared/photo-picker)).
- **Embedded picker (Jan 2026):** renders inside the app UI, and the full cloud library is available, including favorites, albums, and search ([Android Developers Blog](https://android-developers.googleblog.com/2026/01/httpsandroid-developers.googleblog.com202506android-embedded-photo-picker.html%20.html)).
- For us: media-type filtering and a capped multi-select are the patterns to borrow.

### Microsoft Photos and File Explorer Gallery (Windows 11)
- **2023 app (22H2)** ([Help Desk Geek, Nov 2023](https://helpdeskgeek.com/how-to-use-the-new-photos-app-in-windows-11/)) **[older]**:
  - Collection / Albums / People / Folders tabs.
  - A date slider on the right that you can drag or click to jump to a month.
  - A top-bar Select button.
  - A viewer filmstrip ribbon whose items have corner checkboxes, limited to the current folder.
  - Clicking the photo hides or shows the toolbar.
- **Folder tree:** still available under "Folders" in the left pane ([ElevenForum](https://www.elevenforum.com/t/how-to-show-photos-in-folders-instead-of-the-w-11-timeline.28474/latest)).
- **Thumbnail size:** small / medium / large ([Technipages](https://www.technipages.com/windows-11-how-to-change-image-thumbnail-size)).
- **Redesign (rolling to Insiders since 15 Oct 2026)** ([Pureinfotech](https://pureinfotech.com/windows-11-photos-app-redesign/)):
  - A unified Gallery covering local, OneDrive, and iCloud photos, browsable without a OneDrive sign-in, with local photos available offline.
  - Natural-language search, people filters, and filters by storage location.
  - Albums, Favorites, and Moments.
  - A viewer that opens about 15% faster, moves with arrow keys, and has an info pane.
- **File Explorer Gallery:**
  - A chronological view with a timeline scrollbar ([Digital Citizen](https://digitalcitizen.life/gallery-windows-11)).
  - The Collection dropdown chooses source folders. Removing a folder only stops it showing, and the files stay where they are ([Pureinfotech](https://pureinfotech.com/add-remove-folders-gallery-file-explorer-windows-11/)).
- I couldn't get Fluent 2 guidance text for this research.

### Amazon Photos
- **May 2026 redesign:** the home screen is a curated memories carousel ("This Day", "Years", "People", "Creations") instead of a grid. It adds a floating bottom bar that resembles Apple Photos and natural-language search. iOS got it first ([9to5Google](https://9to5google.com/2026/05/05/amazon-photos-app-redesign/); [PetaPixel](https://petapixel.com/2026/05/05/amazon-photos-redesign-adds-memory-feed-ai-search-and-alexa-controls/)).
- **Earlier Android redesign:** search from the home screen with one hand, and swipe up for a filter panel by object, place, or year ([TechRadar](https://www.techradar.com/news/new-amazon-photos-ends-the-worst-thing-about-photo-cloud-storage-apps)) **[older]**.

### Adobe Lightroom (mobile and web)
- **Sort:** capture date, import date, modified date, file name, star rating, or custom order, with a reverse toggle ([Adobe](https://helpx.adobe.com/ee/lightroom/mobile/review-rate-and-manage-versions/sort-and-segment-photos-in-the-grid-view.html)).
- **Segment the grid by:** none, year, month, day, hour, file type, flag, or star rating (same source).
- **Filters and overlays:** filter by rating, flag, or edits. Optional info overlays on thumbnails show file name, rating, or metadata (same source).
- Users have long asked for mobile badge overlays such as edit status ([Adobe Community, 2017+](https://community.adobe.com/t5/lightroom-ecosystem-cloud-based-ideas/lightroom-desktop-badge-overlays-on-thumbnails-in-grid-view/idi-p/12240163)) **[older]**.
- For us: Lightroom is the closest match to a working tool. It segments the grid by type, not only by date, and shows metadata overlays only when switched on.

---

## Cross-app pattern catalog

Verdicts: **Adopt** = copy as is. **Adapt** = keep the intent and change the mechanics for pixel-art assets or the web. **Avoid** = don't build.

### Information architecture

| Pattern | Who does it | Verdict for us | Why |
|---|---|---|---|
| Grid-first landing tab ("Library"/"Photos") | iOS 26, Google Photos, Windows Photos | **Adopt**: "All assets" grid, newest first | It survived both the iOS 18 and the 2022 Google backlash. Users expect the grid first. |
| Second tab for organization ("Collections") | iOS 26, Google Photos | **Adopt**: "Collections" with asset types, folders, and favorites | It puts every organizing control in one place and avoids iOS 18's "multiple paths to the same destination". |
| Search as a separate trailing action | iOS 26 (bottom-right), Google (Search tab/circle), Amazon | **Adopt**: search button plus the `/` key | It is consistent across platforms. Plain text and filter search covers our needs, with no AI. |
| Single scrolling page with everything | iOS 18 | **Avoid** | It caused the largest photo-app backlash of the period. |
| Memories or AI carousel above the grid | iOS 18 (removed in beta), Amazon 2026 | **Avoid** | It adds noise to a working tool, and we have no "memories" concept. |
| Sidebar on large screens, which can be hidden | iPadOS/macOS Photos, Windows Photos, Google Photos web | **Adopt** on expanded widths | There is room for types and folders at once, and hiding it gives the space back to content. |
| Remember the last tab, scroll position, and collapsed sections | iOS 26, Google test | **Adopt** using local storage | It is cheap and avoids sending users back to the top. NN/g flags losing scroll position as a common failure ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)). |
| Collapsible and reorderable sections | iOS 26, Google test | **Adapt**: collapse only, no reorder at first | Collapse covers most of the need. Reorder adds UI that our small number of sections doesn't need. |
| Hide or exclude whole categories | Samsung "albums to show", iOS 18 (removed in 26) | **Avoid** at first | YAGNI. Collapse is enough. Revisit if users ask (see Open questions). |
| Pinned items at the top of Collections | iOS 26 Pinned, Google Favorites/Trash pills | **Adopt**: Favorites plus pinned folders at the top | Gives one-tap access to what people use most. |

### Grid

| Pattern | Who does it | Verdict for us | Why |
|---|---|---|---|
| Square-crop grid | Apple (option), Samsung, Google (default grid) | **Avoid** cropping | Cropping a sprite or a tileset cuts off the subject. |
| Justified rows that keep aspect ratio | Google Photos web | **Avoid** | A 16x16 icon next to a 512x288 map gives wildly varying row heights, and pixel art can't be scaled by a fraction. |
| Uniform square cells with contain-fit | Apple aspect-ratio grid (fit), macOS/iPadOS "fit" toggle | **Adopt** and add pixel rules | Keeps a predictable rhythm and shows the whole asset. Add `image-rendering: pixelated` and integer upscaling where possible. MDN notes that `pixelated` uses nearest-neighbor up to an integer multiple and then smooths the remainder ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)). Use a subtle checkerboard or neutral backdrop for transparency. |
| Fill vs fit toggle | macOS/iPadOS 26 Photos | **Avoid** | Fill means crop, which is wrong for our content. |
| Discrete density levels | Samsung (5), Google (3), Windows (S/M/L), Apple | **Adopt** 3-4 levels and remember the choice | It is familiar, and discrete steps keep pixel scaling at whole numbers. |
| Pinch to change column count | Apple, Google, Samsung | **Adopt** on touch | It is universal muscle memory. |
| Cmd/Ctrl +/- for grid size | macOS Photos | **Adapt**: plain `+`/`-` keys plus a slider | In a browser, Ctrl +/- is page zoom. Taking it over would break an accessibility feature. |
| Date section headers | Google (optional since 2026), Apple, Windows | **Adapt**: optional group headers by type or by date | Asset type matters more than date for our content. Lightroom-style segmentation (none, date, or type) fits better. |
| Floating position pill while scrolling | Google Photos 2026 | **Adopt** | Gives orientation without permanent chrome. |
| Draggable scrubber/timeline thumb | Windows Photos, File Explorer Gallery | **Adopt** for long lists | It is the fastest way to jump through thousands of items. Show it only when the list is longer than a few screens. |
| Year/month zoom-out overview levels | Apple Years/Months, Samsung, Google | **Avoid** at first | Our assets cluster by project and type, not by life events. Group headers plus the scrubber cover it. |
| Virtualized grid with a fixed DOM size | Google Photos web | **Adopt** | Accounts can hold thousands of assets plus animation frames. |
| BlurHash or dominant-color placeholders | Many photo apps; BlurHash by Wolt ([blurha.sh](https://blurha.sh/)) | **Avoid** | Pixel-art thumbnails are tiny and load fast, a blurred pixel sprite tells you nothing, and PixelLab doesn't supply hashes. Use a cell sized to the right aspect ratio with a neutral or checkerboard background. |
| Metadata overlays on thumbnails | Lightroom (toggle) | **Adapt**: small type or direction badges (e.g. "8-dir", frame count) that can be turned off | Our assets differ in kind, so a small badge adds information a photo app doesn't need. Keep it off by default on dense levels. |
| Autoplay animated thumbnails | No photo app autoplays Live Photos or videos in the grid by default (inference) | **Adapt**: play on hover or focus on desktop, play in the viewer, and add a "play all" toggle | Saves CPU and battery and reduces motion. See Open questions. |

### Selection

| Pattern | Who does it | Verdict for us | Why |
|---|---|---|---|
| Long-press to enter selection, then drag to range-select | Google, Samsung | **Adopt**, with auto-scroll at the edges | It is the expected touch grammar. Google's 2026 bug showed how much users rely on it. |
| Visible "Select" button | iOS 26 (made larger), Windows | **Adopt** | Fallback that needs no gesture discovery and helps accessibility. |
| Hover checkbox on desktop | Windows filmstrip, Google web (inference from x/select model) | **Adopt** | Lets you select without entering a mode first. |
| Shift-click range, Cmd/Ctrl-click toggle, marquee, Cmd-A, Esc | macOS Photos (official), Google web (partly verified) | **Adopt** | Desktop users carry these conventions over from file managers. |
| Select all in a section (header checkbox) | Google (date checkmark) | **Adopt** on group headers | Makes "download all walk animations" a single action. |
| Drag a selection stack into an album | Samsung | **Adapt**: drag into a sidebar folder on desktop only | Natural on desktop. On touch it conflicts with scrolling, so use an "Add to folder" action instead. |
| Selection count bar and bulk actions | All | **Adopt**: bottom bar on mobile, top toolbar on desktop | Matches each platform's thumb and pointer conventions. |
| Cap on selection size | Android picker (`maxItems`) | **Avoid** a hard cap. Warn on very large ZIPs instead. | Our users want bulk export. A cap only makes sense if the ZIP exceeds memory (open question). |

### Viewer

| Pattern | Who does it | Verdict for us | Why |
|---|---|---|---|
| Zoom-from-thumbnail open transition | Apple, Google (inference) | **Adopt**, with a crossfade under reduced motion | Keeps your place in the grid. Respects vestibular settings ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). |
| Swipe left/right between items, arrows on desktop | All | **Adopt** | Universal. |
| Swipe down to close | Apple, Google | **Adopt** | Universal on mobile. |
| Pinch in to close at fit scale | Samsung | **Adapt**: only when already at fit | Avoids conflict with zooming. |
| Swipe up / `i` / Cmd-I for info | Apple, Samsung, Google web, macOS | **Adopt**: bottom sheet on mobile, side panel on desktop | Our info includes the prompt, size, directions, and animation list. |
| Double-tap and pinch to zoom | All | **Adapt**: integer zoom steps (fit, 1x, 2x, 4x, ...) | Pixel art must stay crisp. Double-tap toggles between fit and the nearest larger whole-number zoom. |
| Z toggles fit/100% | macOS Photos | **Adopt** | A cheap power-user shortcut that fits pixel art well. |
| Filmstrip | macOS (Option-S), Windows viewer, Finder Gallery | **Adapt**: filmstrip of directions and animations within a character, not of the whole library | A character is a container. The filmstrip moves between its views and animations. |
| Tap or click to hide chrome | Windows viewer, Apple | **Adopt** | Gives immersive viewing of small art. |
| Viewer as a modal dialog with a focus trap and focus return | W3C APG | **Adopt** | Required for keyboard and screen-reader users ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). |
| Back button closes the viewer | NN/g recommendation | **Adopt** using history state or the URL | A deep link per asset comes for free. Users press Back to leave overlays ([NN/g](https://www.nngroup.com/articles/overuse-of-overlays/)). |
| Relying on clicking outside to close | Many web lightboxes | **Avoid** as the only way out | NN/g: many users don't know about it, and touch users close it by accident. Always show a close button. |

### Organization, search, and export

| Pattern | Who does it | Verdict for us | Why |
|---|---|---|---|
| Favorites with a heart and one key | Apple ("."), Google, Windows, Amazon | **Adopt**: heart in viewer and grid hover, `.` key | Universal and cheap. Store locally. |
| Albums as references (many-to-many), not copies | File Explorer Gallery, Google albums | **Adopt** | Our scope is view-only, so folders must never copy or alter remote assets. |
| Album grid/list toggle and sort options | Google Collections, Samsung | **Adapt**: sort folders by name or recent, no list view at first | Small surface. Add list view only if users run into a real problem. |
| Media-type filter chips | Apple Media Types, Android picker type filter, Lightroom | **Adopt** as the main filter: Characters, Objects, Tilesets, Maps, UI, Fonts, VFX, Images | Asset type is the strongest way to tell assets apart. |
| Sort menu with a reverse toggle | Lightroom, Apple, Google albums | **Adopt**: created date (default), name, type; reverse | Matches the Lightroom precedent. |
| Natural-language or AI search | iOS, Google, Microsoft 2026, Amazon 2026 | **Avoid** | Client-side scope. Name, prompt-text, and filter search covers it. |
| Download from the viewer and Shift+D | Google web | **Adopt** | Matches the shortcut convention. |
| Bulk download with progress | (no strong platform source found) | **Adapt**: progress in the selection bar plus a toast on completion, cancellable | Inference. See Gaps. |
| Offline browsing of the cached library | Microsoft 2026 (local photos offline) | **Adapt**: show cached metadata and thumbnails with an offline banner | Inference from the platform precedent. |

---

## Gesture and shortcut map (recommended for PixelLab Gallery)

### Mobile and touch

| Context | Gesture | Action | Precedent |
|---|---|---|---|
| Grid | Tap | Open viewer (zoom from thumbnail) | All |
| Grid | Long-press | Enter selection and select the item | Google, Samsung |
| Grid | Long-press, then drag | Range-select, auto-scrolling at the edges | Google, Samsung |
| Grid (selecting) | Tap | Toggle item | All |
| Grid | Pinch out / in | Larger / smaller density step (3-4 levels) | Apple, Google, Samsung |
| Grid | Drag the scrubber thumb (long lists) | Jump to a position, with a floating label | Windows, File Explorer, Google pill |
| Group header | Tap the checkbox | Select the whole group | Google |
| Viewer | Swipe left/right | Previous/next asset | All |
| Viewer | Swipe down | Close back to the thumbnail | Apple, Google |
| Viewer | Swipe up or tap `i` | Info sheet | Apple, Samsung |
| Viewer | Double-tap | Toggle fit / next whole-number zoom | All (adapted) |
| Viewer | Pinch | Zoom in whole-number steps; pinch in at fit closes | All; Samsung |
| Viewer | Single tap | Show or hide chrome | Windows, Apple |
| Anywhere | System Back | Close the viewer, then exit selection, then go back | Android; NN/g |

### Desktop: keyboard and pointer

Rule: never take over the browser's own Ctrl/Cmd +/- (zoom), Ctrl/Cmd-F (find in page), or Ctrl/Cmd-click outside the grid.

| Context | Input | Action | Precedent |
|---|---|---|---|
| Grid | Arrow keys | Move focus between cells (roving tabindex) | macOS Photos |
| Grid | Enter or Space | Open viewer | macOS Photos (Space) |
| Grid | x | Toggle selection of the focused item | Google web |
| Grid | Click / Shift-click / Ctrl or Cmd-click | Select / range / toggle | macOS Photos |
| Grid | Drag on empty space | Marquee selection | macOS Photos |
| Grid | Ctrl or Cmd-A / Esc | Select all in view / clear selection | macOS, Google web |
| Grid | `+` / `-` (no modifier), toolbar slider | Density step | macOS (adapted), Finder icon slider |
| Grid | Home / End, PageUp / PageDown | Jump to first or last item, or by a page | Platform convention (inference) |
| Global | `/` | Focus search | Google web |
| Global | `?` | Shortcut help overlay | Google web (Shift+?) |
| Viewer | Left / Right | Previous / next | All |
| Viewer | Esc | Close and return focus to the thumbnail | macOS, Google web, APG |
| Viewer | Space | Play/pause animation | macOS slideshow and video (adapted) |
| Viewer | `,` / `.`, or `[` / `]` | Step one frame back or forward when paused | Inference. Conflicts with `.` favorite (see Open questions). |
| Viewer | i | Toggle info panel | Google web; macOS Cmd-I |
| Viewer | z | Toggle fit / 1:1 (whole-number) | macOS Photos |
| Viewer | f | Toggle fullscreen | macOS Ctrl-Cmd-F (adapted; a single key is a web-player convention, inference) |
| Viewer or grid | `.` or `l` | Toggle favorite | macOS `.` |
| Viewer or grid | Shift+D | Download (single or selection) | Google web |
| Viewer | Mouse wheel or trackpad pinch | Zoom in whole-number steps around the cursor | macOS pinch |
| Viewer | Click the image | Show or hide chrome | Windows viewer |

---

## Navigation per form factor (recommendation)

Breakpoints follow the Material window size classes: compact < 600 dp, medium 600-839, expanded ≥ 840. These values come from general Material guidance and I couldn't retrieve the M3 page. Android's default is a navigation bar when width **or** height is compact and a rail otherwise. A permanent drawer is offered as an option for expanded widths ([Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation)).

| Form factor | Primary navigation | Grid default | Viewer | Selection actions |
|---|---|---|---|---|
| **Phone portrait (compact)** | Floating bottom bar with Library / Collections, plus a search button. It shrinks on scroll, like iOS 26 and Google 2026. | 3-4 columns. Type chips in a row that scrolls sideways under the top bar. | Full screen. Info as a bottom sheet. | Bottom action bar showing the count |
| **Phone landscape (compact height)** | Android's default gives a bottom bar. Consider a slim rail instead, because vertical space is scarce (open question). | 6-8 columns | Full screen with chrome that auto-hides | Bottom bar, or a top bar when using a rail |
| **Tablet / small window (medium)** | Navigation rail with Library, Collections, Search, and Favorites | 5-7 columns | Full screen. Info as a side panel in landscape. | Top toolbar |
| **Desktop / large tablet (expanded)** | Sidebar that can be hidden, like iPadOS/macOS Photos and Google Photos web. It shows Library, Favorites, asset types, and folders (pinned first). | Slider-controlled density | Overlay viewer with a side info panel and an optional filmstrip of directions and animations | Top toolbar that replaces the header while selecting |

Notes:
- **Keep the same destinations at every size.** Only the container changes: bar, rail, or sidebar. Apple's iPhone tabs vs iPad sidebar split shows the same destinations in different containers.
- **Translucent bars need a legibility fallback.** Liquid Glass gets mixed reactions ([search summary](https://www.neowin.net/news/ios-26-photos-app-whats-good-and-whats-bad-in-the-latest-update/)). Use a solid background when contrast against pixel art is uncertain, and honor `prefers-reduced-transparency` if we use blur. That second point is an inference and wasn't researched.

---

## Cautionary tales

1. **iOS 18 Photos (2024): reorganizing for its own sake.**
   - Removing tabs and merging everything into one scrolling view produced complaints in the beta and after launch, a partial reversal during the beta, paid third-party apps that recreated the old design, and a full return to tabs a year later ([iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign); [heise](https://heise.de/-9832016); [TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)).
   - Lessons: give every destination one obvious home, keep the grid one tap away, and don't treat customization as the fix for a confusing structure ([BGR](https://bgr.com/tech/people-are-raging-over-the-ios-18-photos-app-redesign-heres-how-to-fix-it/)).
2. **Removing a control people relied on.**
   - iOS 26 dropped the ability to exclude collection types, and users noticed ([MacRumors](https://macrumors.com/guide/ios-26-photos-app)).
   - MacStories misses Recent Days ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16)).
   - Google removed Utilities in 2024, and it pulled its 2022 Library redesign after backlash ([9to5Google](https://9to5google.com/2024/08/08/google-photos-library-collections-redesign/); [Droid Life](https://www.droid-life.com/2024/08/08/google-photos-introduces-collections-to-replace-library-tab/)).
   - Lesson: once we ship a control, removing it is expensive. Ship fewer controls up front.
3. **Google Photos drag-to-select regression (Aug 2026).** On several phone brands the gesture scrolled instead of selecting, and it was covered as a "popular feature" going missing ([PhoneArena](https://www.phonearena.com/news/popular-google-photos-feature-goes-missing_id182462); [Android Authority](https://www.androidauthority.com/google-photos-drag-to-select-fixed-3697467/)). Lessons:
   - The conflict between scrolling and select-drag is fragile, so test it on real touch devices.
   - Always keep tap-to-toggle as a fallback.
4. **Feed-first home screens.** Amazon's 2026 home replaces the grid with a memories carousel ([9to5Google](https://9to5google.com/2026/05/05/amazon-photos-app-redesign/)), and Apple removed its iOS 18 carousel in beta. I found no published reception data for Amazon's change. Lesson for a working tool: don't put the grid behind curated content.
5. **Overlays that trap users.** Overlays with no visible close button, or that rely on clicking outside, get closed by accident or leave people stuck on mobile ([NN/g, 2015](https://www.nngroup.com/articles/overuse-of-overlays/)) **[older]**. Infinite scroll that loses position on Back frustrates people ([NN/g, 2022](https://www.nngroup.com/articles/infinite-scrolling-tips/)).

---

## Open questions

1. **Default grouping.** Should the Library default to one flat newest-first grid with type chips, or to sections by type? Lightroom offers both, and photo apps default to date. A quick user test with a real account (characters with many animations, plus many tiny objects) would settle it.
2. **Characters as containers.** Should a character show as one tile that opens to directions and animations, or should animations appear as their own grid items? Photo apps have nothing equivalent; the nearest are "bursts" and "stacks". Samsung's stacked album thumbnails are a possible visual cue **[test/leak]**.
3. **Animated thumbnails.** Should we autoplay in the grid (CPU, motion, battery), play on hover or focus only, or offer a global "animate thumbnails" toggle? Reduced-motion users should get static thumbnails.
4. **Frame-step keys vs favorite key.** `.` means favorite on macOS, but `,`/`.` is a common frame-step pair in media tools. One option is `[`/`]` for frame stepping and `.` for favorite.
5. **Phone landscape navigation.** Android's default is a bottom bar when height is compact. Should we break from that and use a rail to save vertical space?
6. **Hide or exclude categories.** Is collapse enough, or will users want to hide asset types entirely, as with Samsung's "albums to show"?
7. **Bulk export limits.** At what selection size should we warn, or stream the ZIP, given client-side memory limits? No platform precedent was found.
8. **Search scope.** Can the PixelLab API's listing data cover asset names, prompts, and tags? Search UX depends on it.

### Gaps (couldn't verify in this pass)
- **Missing platform guidance:**
  - Apple HIG pages (tab bars, sidebars, collections) and Material 3 pages render client-side and returned no text. HIG/M3 claims here are limited to Android Developers' adaptive-navigation page.
  - No Fluent 2 guidance was retrieved.
- **Missing official support pages:**
  - Google Photos help pages returned 404, so web selection behavior (Shift-click, Ctrl-A) rests on secondary sources, some low quality.
  - iPhone viewer gestures (swipe down to close, swipe up for info) are sourced from older tips and community posts, not a current Apple guide.
- **Missing app details:**
  - Current Google Photos web density or zoom controls: none found.
  - Microsoft Photos 2026 gallery navigation layout (sidebar items, density controls) isn't described in the coverage I found.
  - Samsung One UI 7 and 8 grid and selection gestures weren't confirmed. The detailed source is from July 2024.
  - The Android Photo Picker's tabs (Photos/Albums) and the embedded picker's UI aren't documented on the pages retrieved.
- **Missing accessibility and lifecycle detail:**
  - No sources described VoiceOver or TalkBack labeling inside platform photo apps.
  - No platform-specific sources were found for bulk download progress UX, empty states, first-run onboarding, or error states in photo apps. The recommendations above are inferences.
- **Missing user sentiment:** Reddit threads weren't accessed directly. Sentiment comes from press summaries and comment threads (MacRumors, 9to5Google).

---

## Sources

**Apple**
- TechCrunch, "After user backlash, Apple brings back tabs to the Photos app in iOS 26" (Jun 2025): https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/
- MacStories, iOS and iPadOS 26 review, Photos section (2025): https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/16
- 9to5Mac, "iOS 26 fixed the Photos app" (Aug 2025): https://9to5mac.com/2025/08/28/ios-26-fixed-the-photos-app-its-more-powerful-than-ever/
- MacRumors, iOS 26 Photos app guide: https://macrumors.com/guide/ios-26-photos-app
- Apple Magazine, iOS 26 Photos layout (via search summary; attribution of the "remembers expanded sections and last tab" claim unconfirmed): https://applemagazine.com/ios-26-photos-layout-2026-2/amp/
- Gadget Hacks, "Why Photos in iOS 26 finally makes sense again" (via search summary): https://ios.gadgethacks.com/news/why-photos-in-ios-26-finally-makes-sense-again/
- Neowin, iOS 26 Photos good/bad (via search summary; direct fetch blocked): https://www.neowin.net/news/ios-26-photos-app-whats-good-and-whats-bad-in-the-latest-update/
- AppleInsider, Photos in iOS 26 / macOS 26 (via search summary; direct fetch blocked): https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool
- Apple, All New Features iPadOS 26 (Sep 2025): https://www.apple.com/in/os/pdf/All_New_Features_iPadOS_26_Sept_2025.pdf
- Apple Community, square vs aspect grid thread (Apr 2025): https://discussions.apple.com/thread/256038315
- heise, "Why Apple's new Photos app is so controversial" (2024): https://heise.de/-9832016
- iMore, backlash and beta changes (Aug 11, 2024): https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign
- BGR, "People are raging over the iOS 18 Photos app redesign" (2024): https://bgr.com/tech/people-are-raging-over-the-ios-18-photos-app-redesign-heres-how-to-fix-it/
- Tom's Guide, iOS 26 Photos overhaul (via search summary): https://tomsguide.com/phones/iphones/ios-26-has-brought-yet-another-photos-app-overhaul-for-your-iphone-heres-how-its-different
- Apple Support, Keyboard shortcuts and gestures in Photos on Mac: https://support.apple.com/guide/photos/pht9b4411b24/mac
- Apple Support, Organize your files in the Finder (Gallery/Icon views): https://support.apple.com/guide/mac-help/mchle9f0a1b2/mac
- Apple Support, Finder Preview pane: https://support.apple.com/guide/mac-help/use-gallery-view-mchl1e4644c2/mac
- iPhone Life, swipe down to return to album (2021) [older]: https://iphonelife.com/content/tip-day-swipe-down-photos-return-album-view
- OWC, swipe up for photo info (iOS 10 era) [older]: https://eshop.macsales.com/blog/38031-quick-ios-10-tip-easily-find-photo-info-by-swiping-up/

**Google / Android**
- Android Authority, Google Photos bottom bar redesign (2025): https://www.androidauthority.com/google-photos-bottom-bar-redesign-3537107
- 9to5Google, floating bottom bar and date pill (Jul 17, 2026): https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/
- 9to5Google, Library to Collections redesign (Aug 8, 2024): https://9to5google.com/2024/08/08/google-photos-library-collections-redesign/
- Droid Life, Collections replaces Library (Aug 2024): https://www.droid-life.com/2024/08/08/google-photos-introduces-collections-to-replace-library-tab/
- 9to5Google, Collections shortcuts carousel test (Nov 2025): https://9to5google.com/2025/11/24/google-photos-shortcuts-redesign/
- Android Authority, collapsible Collections APK teardown (2026): https://www.androidauthority.com/google-photos-collections-redesign-apk-teardown-3660010/
- Android Authority, drag-to-select missing (Aug 2026): https://androidauthority.com/google-photos-drag-to-select-missing-3696148
- Android Authority, drag-to-select fixed (Aug 12, 2026): https://www.androidauthority.com/google-photos-drag-to-select-fixed-3697467/
- PhoneArena, popular Google Photos feature missing (2026): https://www.phonearena.com/news/popular-google-photos-feature-goes-missing_id182462
- Popular Science, select multiple photos: https://www.popsci.com/diy/select-multiple-photos-ios-android/
- Guiding Tech, Google Photos keyboard shortcuts (2018, upd. 2022) [older]: https://www.guidingtech.com/google-photos-keyboard-shortcuts/
- TutorialTactic, Google Photos shortcuts (low confidence): https://tutorialtactic.com/blog/google-photos-shortcuts/
- Computerworld, Google Photos app [older]: https://www.computerworld.com/article/1620082/new-google-photos-app.html
- PCWorld, Google Photos tips [older]: https://www.pcworld.com/article/422750/6-ways-to-make-the-most-of-google-photos-for-android-and-ios.html
- "Building the Google Photos Web UI" (2018) [older], copy: https://steemit.com/art/@whatspal/buildingthegooglephotoswebui-sinr80fhdv ; original (fetch blocked): https://medium.com/google-design/google-photos-45b714dfbed1
- Dev.to, implementing the Google Photos grid (derivative): https://dev.to/shaileshpandit/how-to-implement-google-photos-grid-in-javascript-575i
- Flickr Code, justified layout: https://code.flickr.net/author/jimwhimpey/
- Android Developers, Photo picker (updated 2026-10-16): https://developer.android.com/training/data-storage/shared/photo-picker
- Android Developers Blog, Embedded photo picker (Jan 27, 2026): https://android-developers.googleblog.com/2026/01/httpsandroid-developers.googleblog.com202506android-embedded-photo-picker.html%20.html
- Android Developers, Build adaptive navigation: https://developer.android.com/develop/ui/compose/layouts/adaptive/build-adaptive-navigation

**Samsung**
- SlashGear, Samsung Gallery hidden features (Jul 22, 2024): https://www.slashgear.com/1623030/samsung-galaxy-gallery-apps-features
- Samsung Support, select albums to show: https://www.samsung.com/uk/support/mobile-devices/how-to-select-and-view-only-the-albums-you-want-to-see-in-galaxy-gallery/
- SamMobile, One UI 8 guide (Jul 2025): https://www.sammobile.com/news/complete-samsung-one-ui-8-guide-galaxy/
- Yahoo Tech, One UI 8.5 leak [test/leak]: https://tech.yahoo.com/apps/articles/one-ui-8-5-leak-130359118.html

**Microsoft**
- Pureinfotech, redesigned Photos app (Oct 15–16, 2026): https://pureinfotech.com/windows-11-photos-app-redesign/
- Help Desk Geek, new Photos app in Windows 11 (Nov 2023) [older]: https://helpdeskgeek.com/how-to-use-the-new-photos-app-in-windows-11/
- ElevenForum, folders instead of timeline: https://www.elevenforum.com/t/how-to-show-photos-in-folders-instead-of-the-w-11-timeline.28474/latest
- Technipages, Photos thumbnail size: https://www.technipages.com/windows-11-how-to-change-image-thumbnail-size
- Pureinfotech, File Explorer Gallery folders: https://pureinfotech.com/add-remove-folders-gallery-file-explorer-windows-11/
- Digital Citizen, File Explorer Gallery: https://digitalcitizen.life/gallery-windows-11

**Amazon / Adobe**
- 9to5Google, Amazon Photos redesign (May 5, 2026): https://9to5google.com/2026/05/05/amazon-photos-app-redesign/
- PetaPixel, Amazon Photos redesign (May 5, 2026; via search summary): https://petapixel.com/2026/05/05/amazon-photos-redesign-adds-memory-feed-ai-search-and-alexa-controls/
- TechRadar, earlier Amazon Photos redesign [older]: https://www.techradar.com/news/new-amazon-photos-ends-the-worst-thing-about-photo-cloud-storage-apps
- Adobe, Sort and segment photos in Lightroom mobile grid: https://helpx.adobe.com/ee/lightroom/mobile/review-rate-and-manage-versions/sort-and-segment-photos-in-the-grid-view.html
- Adobe Community, badge overlays idea (2017+) [older]: https://community.adobe.com/t5/lightroom-ecosystem-cloud-based-ideas/lightroom-desktop-badge-overlays-on-thumbnails-in-grid-view/idi-p/12240163

**General UX / web platform**
- NN/g, Infinite Scrolling: When to Use It, When to Avoid It (Sep 2022): https://www.nngroup.com/articles/infinite-scrolling-tips/
- NN/g, Overuse of Overlays (May 2015) [older]: https://www.nngroup.com/articles/overuse-of-overlays/
- W3C WAI-ARIA APG, Dialog (Modal) pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN, image-rendering: https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
- BlurHash (Wolt): https://blurha.sh/
