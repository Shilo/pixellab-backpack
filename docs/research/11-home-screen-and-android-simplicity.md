# Home Screens and Google/Android Simplicity: Inspiration for Vitrine

Research date: 2026-10-19. Scope: iOS/iPadOS 18–26 Home Screen, Pixel Launcher (Android 16, Material 3 Expressive), Samsung One UI 8/8.5, Google Photos (Android and web), Google Drive web, and Material 3 Expressive guidance. The goal is to apply them to Vitrine's first screen and viewer. The owner rejected the earlier mockups (persistent folder sidebar, crowded top bar, dense viewer controls) as too busy.

Confidence key: every factual claim carries an inline source. **[older]** marks sources from before 2024. **[secondary]** marks consumer how-to sites or aggregators rather than the vendor. Mappings, concepts, and recommendations are inferences unless cited. This document builds on [04-platform-gallery-apps-ux.md](04-platform-gallery-apps-ux.md). Where the two disagree on the persistent sidebar, this one supersedes 04, as noted in Recommendations.

---

## Summary

1. **Home screens look simple because the content is the interface.** The tiles are the navigation, and almost all other chrome is one search affordance plus gestures. Apple even made its search gesture visible: since iOS 16 a Search button sits above the Dock where the page dots were ([MacRumors](https://macrumors.com/how-to/remove-home-screen-search-button); [Apple Support](https://support.apple.com/en-au/118232)).
2. **Everything else is one press away, and each hidden layer also has a visible route.** Apple's HIG says "Always make context menu items available in the main interface, too" ([Apple HIG, Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)). NN/g says a long press should be paired with a visible control that opens the same menu ([NN/g, 2019](https://www.nngroup.com/articles/contextual-menus/)) **[older]**.
3. **Automatic grouping beats manual organization as a default.** The App Library sorts apps "automatically" into categories and reorders them by usage ([Apple Support](https://support.apple.com/en-us/108324)). In Vitrine, asset types are already known, so typed "library tiles" cost the user nothing.
4. **Selection and actions are modal and appear on demand.** Google Drive web shows a multi-select toolbar only after selection, and it replaces the filter row ([9to5Google, 2023](https://9to5google.com/2023/02/23/google-drive-docs-material-you-redesign/); [Google Drive community thread](https://support.google.com/drive/thread/210896114/what-has-happened-to-the-location-list-at-top-of-drive-display?hl=en)) **[older]**. M3 Expressive suggests a "vibrant" toolbar color to signal a temporary mode such as edit ([9to5Google, 2025-05-18](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)).
5. **One floating pill can serve desktop and phone.** Google Photos (July 2026) replaced its docked bottom bar with a floating pill holding three tabs and a circular search button ([9to5Google, 2026-07-17](https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/)). The iOS 26 tab bars float and shrink while you browse ([Apple Newsroom, 2025-06-09](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/)).
6. **The biggest risk is gesture overload, not visual clutter.** On iOS a long press means a context menu or jiggle mode. On Google Photos Android it means select ([Google Photos Help](https://support.google.com/photos/answer/6128858); [TapSmart](https://www.tapsmart.com/tips-and-tricks/clean-home-screen/) **[secondary]**). Vitrine must choose one meaning per input.
7. **Recommendation:** use Concept A, "Home + Dock" (below). It has 4 default controls on the first screen: search, a type dock, Favorites inside the dock, and one overflow. Folders are 2×2 stack tiles in the grid. Selection and edit appear only on demand, and the viewer has at most 5 controls.

---

## 1. iOS / iPadOS 18–26 Home Screen: what makes it instantly understandable, and what is hidden

### Takeaway
A first-time user sees a grid of recognizable tiles, a Dock, and since iOS 16 a visible Search button. Organization (folders, widgets, App Library) and edit mode exist, but each is hidden behind a press, a swipe, or a container. The surface stays a grid of things you can tap.

### Cited Findings
- iOS 18 lets people "arrange apps and widgets in any open space on the Home Screen". It adds dark and tinted looks for icons and widgets and lets people lock apps or hide them in a hidden folder in the App Library — [Apple Newsroom, 2024-06-10](https://www.apple.com/newsroom/2024/06/ios-18-makes-iphone-more-personal-capable-and-intelligent-than-ever/)
- iOS 26 brings Liquid Glass to app icons and widgets, including a "clear look". Tab bars float above content and "dynamically shrink when users are browsing", then expand on scroll-up — [Apple Newsroom, 2025-06-09](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/)
- App Library: reached by swiping left past the last page. Apps are "automatically sorted into categories" and "automatically reorder based on your usage". A search field at the top opens an alphabetical list — [Apple Support](https://support.apple.com/en-us/108324)
- Spotlight: "Swipe down from the middle of the Home Screen" — [Apple Support](https://support.apple.com/en-au/118232). Since iOS 16 a Search button sits above the Dock, replacing the page dots. It can be turned off, and the swipe still works — [MacRumors](https://macrumors.com/how-to/remove-home-screen-search-button); [iDownloadBlog, 2022](https://www.idownloadblog.com/2022/08/10/how-to-remove-search-button-from-iphone-home-screen/) **[older]**
- Long-pressing an icon or blank area enters edit mode, where icons jiggle and can be rearranged — [TapSmart](https://www.tapsmart.com/tips-and-tricks/clean-home-screen/) **[secondary]**. You create a folder by holding an app until it jiggles and dragging it onto another app — [Digital Phablet](https://digitalphablet.com/ios-26-home-screen-ultimate-customization-guide-and-tips/) **[secondary]**
- Widgets are added through a long press, then "+"/Edit. A Smart Stack rotates widgets by time, location, or activity, and a manual stack holds up to 10 — [MacMyths](https://macmyths.com/how-to-customize-the-iphone-home-screen-in-ios-26/) **[secondary]**
- Apple widget guidance: "provides essential information at a glance". It warns to "avoid creating app-like layouts in your widgets" and to "Offer simple, relevant functionality and reserve complexity for your app". "People tap or click a widget to launch its corresponding app", and the tap should open "at the right location". It also says "Replicating an app icon offers little additional value". On density: "Sparse layouts can seem unnecessary", while dense ones are less glanceable — [Apple HIG, Widgets (change log to 2026-10-13)](https://developer.apple.com/design/human-interface-guidelines/widgets)
- Apple context-menu guidance: "it's hidden by default, so people might not know it's there". It says "Always make context menu items available in the main interface, too", "Aim for a small number of menu items", "A context menu isn't for providing advanced or rarely used items", and "you don't want more than about three groups". Destructive items go last and are marked. It also says "Prefer a graphical preview" and "Support context menus consistently throughout your app" — [Apple HIG, Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)

### Inferences
- **Why it is instantly understandable:** one object type (a tile) means one verb (tap = open), there is no persistent navigation chrome, and the most common hidden action (search) now has a visible label.
- **What is hidden until needed:** edit mode (long press), folder contents (tap a folder and an overlay opens), widget configuration, the App Library (swipe), and context menus (long press). Each hidden layer is at most one level deep, which matches NN/g's two-level limit (see §4).
- Apple turned the Spotlight gesture into a visible Search button. That is the clearest signal in this research that a pure gesture was not discoverable enough, even for Apple.
- **Widgets map to Vitrine only weakly.** Apple warns against app-like widgets and against a widget that duplicates the icon. A "Recent" or "Favorites" stack makes sense only if it shows something the grid doesn't.

### Gaps
- I could not fetch Apple's own folder documentation; the support page returned only an index. The folder-icon mini-grid preview and the folder-opens-as-overlay behavior are well known but not verified from a primary source in this pass.
- I did not find any primary-source data on how many users discover the App Library or jiggle mode.
- iOS 26-specific Home Screen changes beyond Liquid Glass (for example, changes to folder behavior) were not confirmed by Apple sources. Some consumer-site claims about nested folders looked unreliable and are excluded.

---

## 2. Android home screens: Pixel Launcher (Android 16 / M3 Expressive) and Samsung One UI 8

### Takeaway
Android's home screen has the same core: a tile grid, one search bar, a swipe-up app drawer, folders, and long-press shortcuts. Google is still changing the search bar: an Expressive pill shipped, then was reverted in QPR3. Samsung's notable folder innovation (resizable "large folders" with previews) lives in the optional Good Lock module, not in stock One UI.

### Cited Findings
- The Material 3 Expressive redesign reached Pixels with the Android 16 QPR1 update. Pixel 10 shipped with it — [9to5Google, 2025-09-03](https://9to5google.com/2025/09/03/android-16-qpr1-pixel/); [heise](https://heise.de/-10631292)
- The Expressive search bar grouped the G logo, mic, and Lens in one pill, with a separate AI Mode circle. It was reverted to the older design in Android 16 QPR3. A long press on the bar still customizes or disables the AI Mode shortcut — [9to5Google, 2026-03-06](https://9to5google.com/2026/03/06/android-16-qpr3-pixel-launcher-search/)
- The app drawer under Expressive uses blur instead of a solid background and no longer fully covers the screen — [Betawiki](https://betawiki.net/wiki/Launcher_(Android)) **[secondary; community wiki]**
- Long-press app shortcuts: "Most supported launchers display up to four shortcuts at a time". Shortcuts exist to "quickly start common or recommended tasks" — [Android Developers](https://developer.android.com/develop/ui/views/launch/shortcuts)
- One UI 8 adds a horizontal-scroll mode for the app drawer when alphabetical order is selected — [Android Authority](https://www.androidauthority.com/one-ui-8-app-drawer-update-3574602)
- With Home Up (Good Lock), One UI 8.5 gets resizable "large folders" in custom shapes with up to two pages, alignment guides, and hidden page indicators — [SamMobile, 2026-01-23](https://www.sammobile.com/news/good-locks-home-up-one-ui-8-5-brings-amazing-upgrades/); [Sammy Fans, 2026-01-19](https://www.sammyfans.com/2026/01/19/samsung-one-ui-8-5-gains-insane-new-large-folder-customization/amp/). This conflicts with a preview leak reporting "no changes in the design of icons, widgets, or folders" in stock One UI 8.5 — [Mezha](https://mezha.media/en/news/z-yavilis-pershi-skrinshoti-novogo-interfeysu-one-ui-8-5-304992). The two are consistent if the folder features are Home Up-only.

### Inferences
- **The 4-shortcut cap is a useful budget.** A Vitrine tile's quick menu should hold about 4 top actions (Open, Favorite, Download…, Add to folder), with everything else in the viewer.
- **Samsung's large folders are a precedent for folder tiles that show content.** Pairing that with Vitrine's 2×2 preview idea makes sense: the folder itself shows real sprites rather than a generic folder glyph.
- **Google's search-bar churn shows that even the canonical "one search bar" gets fiddled with.** Keep Vitrine's search a plain field with one keyboard shortcut and no extra buttons inside it.

### Gaps
- At a Glance (the Pixel widget for date, weather, and events) was not researched with sources in this pass, and I found no 2025–2026 primary documentation on its current behavior.
- I found no official Samsung release notes for the One UI 8 home screen. The folder details come from enthusiast sites covering Home Up.

---

## 3. Google Photos, Google Drive, and Google's simpler web apps: minimal chrome

### Takeaway
Google's pattern is a full-bleed content grid with one compact navigation element. Selection is a reachable but secondary state: a hover checkmark on desktop and a long press on Android. Selection swaps in a contextual bar with a count, an X, and bulk actions, and transient UI (the date pill) appears only during scroll.

### Cited Findings
- Google Photos Android (server-side, July 2026) replaced the docked bottom bar with a floating pill: Photos, Collections, and Create tabs, plus a circular search/Ask Photos button on the right. The date indicator became a top pill that "appears when you scroll and disappears shortly after". A "Show dates in grid" setting restores fixed headers — [9to5Google, 2026-07-17](https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/)
- Google Photos Android: "Press and hold" a photo to begin selecting multiple items — [Google Photos Help](https://support.google.com/photos/answer/6128858)
- Google Photos web: hovering a thumbnail reveals a white check circle at its top left, and clicking it selects the photo (the circle turns blue). Hovering a date header reveals a select-all-for-that-day check. The selected count appears in the top bar with an X to clear — [Picasa & Google Photos resources (Google Sites, undated)](https://www.sites.google.com/site/picasaresources/google-photos-1/how-do-i-select-multiple-pictures) **[secondary]**. Shift-click selects a range — [Technobezz, 2026-09](https://www.technobezz.com/how-to-select-all-photos-in-google-photos) **[secondary]**
- Google Drive web added a multi-select toolbar for share, download, move, and remove — [9to5Google, 2023-02-23](https://9to5google.com/2023/02/23/google-drive-docs-material-you-redesign/) **[older]**. Press described it as easier than "hiding them in a cumbersome right-click context menu" — [TechRadar](https://www.techradar.com/news/google-drive-is-finally-making-it-easier-to-share-download-and-delete-multiple-files-at-once) **[older]**. The "X files selected" bar appears in place of the filter boxes while breadcrumbs stay — [Google Drive community, 2024](https://support.google.com/drive/thread/210896114/what-has-happened-to-the-location-list-at-top-of-drive-display?hl=en)
- Earlier Vitrine research found that Google pulled a Library redesign after backlash, and that an August 2026 drag-to-select bug drew press coverage within days. Users react strongly when a known gesture breaks — [04-platform-gallery-apps-ux.md](04-platform-gallery-apps-ux.md), citing [Android Authority](https://androidauthority.com/google-photos-drag-to-select-missing-3696148)

### Inferences
- **The contextual bar should replace an existing bar, not stack on top of it** (the Drive precedent). In Vitrine, selection mode should take over the search/dock row, so the screen never shows both.
- **The hover checkmark solves "open vs select" on desktop:** clicking the tile opens it, and clicking the corner circle selects it. It costs no permanent chrome because it appears only on hover or focus.
- **Transient scroll indicators (the date pill) fit Vitrine as a type/folder label while scrolling**, not as fixed section headers.

### Gaps
- I gathered no sourced 2025–2026 material on Google Keep or Google Arts & Culture chrome patterns. They are left out rather than described from memory.
- I found no official, current Google Photos web help describing the selection bar. The web details come from an undated Google-Sites resource page and a 2026 how-to site.

---

## 4. Material Design 3 / Expressive and usability guidance on progressive disclosure

### Takeaway
M3 Expressive separates persistent global actions (docked toolbar or navigation bar) from contextual actions (floating toolbar), and says not to show both kinds of bar at once. NN/g's progressive-disclosure rules (frequent actions first, an obvious path to the rest, at most two levels) give the test for what Vitrine shows by default.

### Cited Findings
- M3 Expressive: the docked toolbar is for global actions and replaces the deprecated bottom app bar. The floating toolbar is for "contextual actions relevant to the body content or the specific page" and can pair with a FAB. Don't combine a toolbar with a bottom navigation bar; use the nav bar on primary pages and toolbars on later pages. Overflow menus handle extra actions. A "vibrant" color scheme can signal a temporary mode such as edit mode — [9to5Google, 2025-05-18](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)
- Material Components (Android): the floating toolbar can hide on scroll, but this behavior is disabled when TalkBack is on because hidden toolbars can't be found by screen readers. Overflowed actions need text labels — [MDC Android docs, FloatingToolbar.md](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/FloatingToolbar.md)
- The FAB menu (`FloatingActionButtonMenu`) is experimental in Compose. It opens extra choices from a toggle FAB with staggered animation — [composables.com](https://composables.com/material3/floatingactionbuttonmenu). The small FAB is deprecated — [MDC Android docs](https://gitea.com/784622644/material-components-android/src/branch/master/docs/components/FloatingActionButton.md) **[mirror]**
- NN/g progressive disclosure: put frequent needs on the initial display, keep the primary list short, make the path to secondary features obvious with a clear label, and limit designs to two levels. Avoid multiple routes to the same secondary options — [NN/g, 2006](https://www.nngroup.com/articles/progressive-disclosure/) **[older]**
- NN/g contextual menus: menus are hidden by default, so add signifiers (an ellipsis or arrow). Long press is not discoverable on its own, so pair it with a visible overflow button. Keep menus under 10–12 items, order them by frequency, show shortcuts, and offer the same options whatever the trigger. "There should always be an additional way to find and use the actions found in contextual menus" — [NN/g, 2019-03-17](https://www.nngroup.com/articles/contextual-menus/) **[older]**
- Conflict on unavailable items: NN/g says to disable irrelevant items rather than hide them ([NN/g](https://www.nngroup.com/articles/contextual-menus/)). Apple says "Hide unavailable menu items, don't dim them" ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/context-menus)).

### Inferences
- **The two NN/g pieces pull in different directions.** The 2006 article warns against multiple routes; the 2019 article requires a second route for context-menu items. For Vitrine, the context menu should be a shortcut to actions that also exist in the viewer or selection bar, not a separate set of options.
- **The M3 "no nav bar plus toolbar" rule maps to modes.** Browse mode shows the dock/pill, and selection mode swaps it for the contextual bar (vibrant color).
- **On the unavailable-items conflict:** for per-asset download formats (for example, no "frames ZIP" for a static image), hiding fits Apple and keeps menus short. Disabled with a reason fits NN/g when users would otherwise hunt. Inference: hide the option when the asset type can never support it, and disable it with a tooltip when support is temporary (for example, still loading).
- **A FAB has no natural primary "create" action in a view-only gallery,** so Vitrine should not add one just to look Material.

### Gaps
- m3.material.io pages are JavaScript-rendered and returned no content or a 404 in this pass. Official M3 text on menus, bottom sheets, and progressive disclosure is therefore cited through Material Components docs and press coverage.

---

## 5. Mapping the home-screen metaphor to a pixel-art gallery

### Takeaway
The metaphor fits well: assets are visual, recognizable tiles, just like app icons. Each home-screen layer has a natural Vitrine counterpart: folders, App Library categories, Spotlight, long press, edit mode, and the Dock. The fit breaks down in three places: app icons are uniform and assets are not, a gallery needs selection where a home screen needs rearranging, and desktop users have a mouse and keyboard rather than touch gestures.

### Cited Findings
- App Library groups are automatic and reorder by usage — [Apple Support](https://support.apple.com/en-us/108324)
- Enthusiast One UI builds already make folders content-previewing and resizable — [SamMobile](https://www.sammobile.com/news/good-locks-home-up-one-ui-8-5-brings-amazing-upgrades/)
- The preview requirement: "Prefer a graphical preview that clarifies the target of a context menu's commands" — [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/context-menus)
- Earlier Vitrine research: use square cells with `object-fit: contain` and nearest-neighbor scaling. Use long press then drag on touch; click, Shift-click, Ctrl/Cmd-click, and marquee on desktop; plus a visible Select fallback. Folders are local many-to-many references — [04-platform-gallery-apps-ux.md](04-platform-gallery-apps-ux.md)

### Inferences (fit and risk per mapping)

| Home-screen element | Vitrine counterpart | Desktop fit | Phone fit | Risk |
|---|---|---|---|---|
| App icon | Asset tile (sprite, contained, nearest-neighbor) | Good | Good | Assets vary from 16 px to whole maps; contain plus a checkerboard keeps them readable |
| Folder icon (mini grid) → overlay | Folder as a stacked tile with a 2×2 preview of its first 4 assets; click opens it in place with a back control | Good | Good | A folder must not look like an asset; it needs a stacked-card edge and a name label |
| App Library auto categories | Type groups: Characters, Objects, Tilesets, Maps, UI, Images, plus Favorites | Good (dock/segmented) | Good (pill tabs) | Empty groups look broken; hide them |
| Spotlight (swipe down + visible Search button) | Visible search field; `/` focuses it (Ctrl/Cmd-K as an alias) | Very good | Good (tap field) | Ctrl-F belongs to the browser; don't hijack it |
| Long press → context menu | Right-click or the visible `⋯` on a hovered tile opens the same short menu | Good | Conflicts with long-press-to-select | Choose one meaning on touch (see §6) |
| Jiggle/edit mode | Selection mode (bulk download, add to folder, favorite) | Good (checkbox on hover, Shift/Ctrl-click) | Good (long press) | Rearranging isn't core; there is no free-form layout to edit |
| Dock | Persistent type dock / floating pill (All · types · ★) | Good | Good | More than 5 or 6 dock items becomes a crowded top bar again |
| Smart Stack / widget | Optional "Recent" strip | Weak | Weak | Carousel above the grid; the HIG warns against app-like widgets; skip by default |
| Pages (horizontal swipe) | — | Poor (horizontal scroll with a mouse) | OK | Don't use pages; use one vertical scroll |

- **Desktop vs phone:** desktop gets the hover cues (check circle, `⋯`) that touch can't have. Phone gets long press, which desktop can't sensibly use. Both need a visible fallback (a Select entry in the overflow menu) so neither relies only on its invisible input.

### Gaps
- I found no published studies of home-screen metaphors applied to web asset galleries. The fit assessment above is reasoning, not evidence.

---

## 6. Pitfalls: hidden gestures, open vs select ambiguity, empty-looking screens

### Takeaway
All three pitfalls are documented. Gestures without visual cues hurt discoverability, Apple and NN/g both require visible duplicates of hidden actions, and Apple warns that sparse layouts look unnecessary. Vitrine's main design risk is giving long press or right-click different meanings in different places.

### Cited Findings
- Hidden interactions are "gestures with no visual cues, such as long presses and swipes". They let apps add functionality without clutter, at a discoverability cost the GhostUI dataset was built to measure — [arXiv 2601.19258, 2026-01-27](https://arxiv.org/abs/2601.19258)
- Nielsen's early iPad findings flagged low discoverability, low memorability, and accidental activation. Gestures are "difficult to learn when they're not employed consistently across apps" — quoted on [GNOME usability list, 2011](https://lists.gnome.org/archives/usability/2011-May/msg00011.html) **[older; second-hand quote]**
- "Support context menus consistently throughout your app. If you provide context menus for items in some places but not in others, people won't know where they can use the feature" — [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/context-menus)
- Apple added a visible Search button for the swipe-down gesture — [MacRumors](https://macrumors.com/how-to/remove-home-screen-search-button)
- "Sparse layouts can seem unnecessary" — [Apple HIG, Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)
- Hide-on-scroll toolbars become unreachable for screen readers, so MDC disables hiding under TalkBack — [MDC FloatingToolbar.md](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/FloatingToolbar.md)
- Long press means different things across products: an edit/jiggle mode or context menu on iOS ([TapSmart](https://www.tapsmart.com/tips-and-tricks/clean-home-screen/) **[secondary]**; [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/context-menus)) and selection on Google Photos Android ([Google Photos Help](https://support.google.com/photos/answer/6128858))

### Inferences
- **Hidden gestures nobody finds:** every hidden input in Vitrine (right-click, long press, `/`, keyboard shortcuts) must duplicate a visible control. A `?` shortcut sheet listed in the overflow menu makes shortcuts discoverable without on-screen hints.
- **Open vs select:**
  - Desktop: click = open, corner check circle = select, plus Shift/Ctrl-click.
  - Phone: tap = open, long press = select (the Google Photos convention, which is also Android's).
  - On a phone the context menu is replaced by the selection bar, and the viewer carries per-asset actions. This puts Vitrine closer to Google Photos than to iOS. The same model must apply on every grid (All, a type, a folder, search results); Apple's consistency rule requires it.
- **Empty-looking screens:** a library-tile-only first screen (Concept B) looks like 7 boxes for a new user with 5 assets. Fixes: hide empty groups, skip the tile layer while assets are few (open straight on the grid), and show skeleton tiles during the first fetch instead of a blank page.
- **Re-cluttering through the dock:** if every type gets a dock item and then filters, sort, density, and account controls are added, the rejected crowded top bar returns. The ≤5 budget must be enforced, and anything beyond it moves into the overflow menu.
- **Hide-on-scroll:** if the pill hides on scroll, keyboard and screen-reader users need it permanently reachable. Simplest rule: don't hide it, or hide it only on narrow touch screens.

### Gaps
- I found no quantitative 2024–2026 data on long-press or right-click discovery rates in web apps.

---

## Pattern catalog

| Pattern | Product | What it hides | Discovery cue | Vitrine mapping: desktop | Vitrine mapping: mobile |
|---|---|---|---|---|---|
| Tile grid as navigation | iOS / Pixel / One UI home | All chrome except tiles | Tiles look tappable | Asset grid is the page; no sidebar | Same, 3–4 columns |
| Visible search on a gesture | iOS Search button + swipe down ([MacRumors](https://macrumors.com/how-to/remove-home-screen-search-button)) | The full search UI and results | Labeled "Search" pill | Search pill; `/` focuses it | Search pill or circle in the floating bar |
| Folder as preview tile → overlay | iOS folders; One UI large folders ([SamMobile](https://www.sammobile.com/news/good-locks-home-up-one-ui-8-5-brings-amazing-upgrades/)) | Folder contents | Mini preview of contents | Stacked tile with 2×2 sprites and a name; opens in place with Back | Same; Back gesture closes it |
| Automatic categories | App Library ([Apple Support](https://support.apple.com/en-us/108324)) | Manual organization effort | Category names and previews | Type dock: All · Characters · Objects · Tiles & Maps · UI & Images | Same items as pill tabs or a sheet |
| Long-press shortcuts (≤4) | Android launcher ([Android Developers](https://developer.android.com/develop/ui/views/launch/shortcuts)) | Secondary per-item actions | None (gesture) | Right-click and a hover `⋯` open a 4-item menu | Long press selects instead; actions live in the selection bar |
| Context menu with preview | iOS ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/context-menus)) | Per-item actions | Hover `⋯` (NN/g signifier) | Menu: Open, Favorite, Download…, Add to folder | Not used (see above) |
| Edit / jiggle mode | iOS home ([TapSmart](https://www.tapsmart.com/tips-and-tricks/clean-home-screen/)) | Rearranging and organizing | Long press | Selection mode via the hover check, Shift/Ctrl-click, or "Select" in the overflow | Long press, or "Select" in the overflow |
| Contextual bar replaces chrome | Google Drive ([9to5Google](https://9to5google.com/2023/02/23/google-drive-docs-material-you-redesign/)); Google Photos web | Bulk actions | Appears on first selection, shows a count and X | Bar replaces the search/dock row: `3 selected · ★ · Folder · Download · ✕` | Bar replaces the floating pill |
| Vibrant mode color | M3 Expressive ([9to5Google](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)) | — | Color change marks the mode | Accent-colored selection bar | Same |
| Floating pill nav | Google Photos 2026 ([9to5Google](https://9to5google.com/2026/07/17/google-photos-floating-bottom-bar-android/)); iOS 26 tab bar ([Apple](https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/)) | A full nav bar or sidebar | Always visible, compact | Bottom-center pill or top-center dock | Bottom pill in the thumb zone |
| Transient scroll label | Google Photos date pill | Section headers | Appears while scrolling | "Characters · 42" pill while scrolling the All grid | Same |
| Hover check circle | Google Photos web ([Google Sites resource](https://www.sites.google.com/site/picasaresources/google-photos-1/how-do-i-select-multiple-pictures)) | Selection affordance | Hover or focus | Top-left circle on hover or keyboard focus | n/a (long press) |
| Glanceable widget | iOS widgets, Smart Stack ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/widgets)) | — | — | Skip by default; at most one "Recent" row inside All | Skip |
| Overflow menu | M3 toolbars; NN/g | Settings, density, sort, sign out, shortcuts | `⋯` icon | One `⋯` in the dock | One `⋯` in the pill |

---

## Layout concepts for Vitrine's first screen

In the counts below, content tiles are not controls. "Controls" means persistent chrome. Hover and focus cues (the check circle and `⋯` on a tile) appear on the tile under the pointer only.

### Concept A: "Home + Dock" (recommended)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     [ ⌕  Search assets        / ]                   │  ← 1
│                                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │▚▚ ▚▚ │ │▚▚ ▚▚ │ │▚▚ ▚▚ │   │  ☺   │ │  ♣   │ │ ▦▦▦  │ │  ☺   │   │
│  │▚▚ ▚▚ │ │▚▚ ▚▚ │ │▚▚ ▚▚ │   │      │ │      │ │ ▦▦▦  │ │   ▶  │   │
│  └──────┘ └──────┘ └──────┘   └──────┘ └──────┘ └──────┘ └──────┘   │
│   Heroes   Forest   UI kit     Knight   Tree     Grass    Slime     │
│  (folders: stacked 2×2)       (assets, newest first, ▶ = animated)  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ ...  │ │      │ │      │ │      │ │      │ │      │ │      │     │
│                                                                     │
│        ╭───────────────────────────────────────────────────╮        │
│        │  All · Characters · Objects · Tiles&Maps · UI · ★  │  ⋯    │  ← 2, 3, 4
│        ╰───────────────────────────────────────────────────╯        │
└─────────────────────────────────────────────────────────────────────┘
```

Visible by default (4):
1. Search pill (`/` focuses it).
2. Type dock (one segmented control; empty types hidden).
3. ★ Favorites (the last dock item).
4. `⋯` overflow.

Where everything else lives:
- **Folders:** stacked tiles at the start of the grid on All. "New folder" sits in the selection bar and the overflow.
- **Select:** hover check circle, Shift/Ctrl-click, long press on a phone, or "Select" in the overflow. Selection mode swaps the dock for a vibrant bar: `N selected · ★ · Add to folder · Download (GIF / Sheet / ZIP) · ✕`.
- **Per-asset actions:** right-click or hover `⋯` opens Open, Favorite, Download…, and Add to folder (4 items).
- **Overflow menu:** density, sort, refresh, keyboard shortcuts (`?`), settings, and sign out.
- **Mobile:** the same layout. The dock becomes a bottom pill that scrolls horizontally if needed, and search becomes a circle at the pill's end.

### Concept B: "Library first" (App Library)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     [ ⌕  Search assets        / ]              ⋯    │  ← 1, 2
│                                                                     │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│   │ ☺  ☺       │  │ ♣  ⚱       │  │ ▦▦  ▦▦     │  │ ★ ☺  ♣     │    │
│   │ ☺  ☺   38  │  │ ⚔  ♣   112 │  │ ▦▦  ▦▦  9  │  │ ▦  ⚔   14  │    │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│    Characters       Objects        Tilesets         Favorites       │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│   │ Maps       │  │ UI         │  │ Images     │  │ Heroes ▚▚  │    │
│   └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│        (auto type groups first, then user folders, same shape)      │
└─────────────────────────────────────────────────────────────────────┘
```

Visible by default (2):
1. Search pill.
2. `⋯` overflow.

Where everything else lives:
- **Every group and folder** is a tile with a 2×2 preview and a count. Clicking one opens its grid, with a Back control and the same selection model as Concept A. The All grid is reachable via search with an empty query or "All assets" in the overflow.

Assessment:
- Calmest screen, and the closest to the owner's home-screen suggestion.
- Costs one extra click before any asset.
- Looks empty when there are only a few assets.
- Folder and type tiles look alike. This is fine visually but blurs "automatic" versus "mine".

### Concept C: "Floating pill" (Google Photos 2026 / iOS 26 tab bar)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐        │
│ │ ☺  ││ ♣  ││ ▦  ││ ☺▶ ││ ⚔  ││ ▦  ││ ☺  ││ ♣  ││ ⚱  ││ ▦  │        │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘        │
│                     ╭ Characters · 42 ╮   ← transient while scrolling│
│ ┌────┐┌────┐┌────┐┌────┐ ...  (edge-to-edge grid, no top bar)       │
│                                                                     │
│              ╭──────────────────────────────────╮                   │
│              │  ▦ All   ▢ Library   ★    │  ⌕  ⋯ │  ← 1, 2, 3        │
│              ╰──────────────────────────────────╯                   │
└─────────────────────────────────────────────────────────────────────┘
```

Visible by default (3):
1. Pill tabs: All, Library (type groups and folders as in Concept B), and ★.
2. Search circle.
3. `⋯` overflow.

Where everything else lives:
- Same selection, context-menu, and overflow model as Concept A. The selection bar replaces the pill.

Assessment:
- Most content per pixel, and identical on desktop and phone.
- Bottom-centered navigation is less conventional on desktop web.
- Search is an icon rather than a labeled field, so it is less discoverable than in A. This is the trade Apple reversed by adding a labeled Search button.

### Shared viewer (all concepts): replaces the dense viewer

```
┌─────────────────────────────────────────────────────────────┐
│ ✕                                                ★   ⤓   ⓘ  │  ← ≤4 + conditional chips
│                                                             │
│                      [ sprite, animated ]                   │
│                                                             │
│          ( S  SE  E  NE  N … )   ( idle · walk · attack )   │  ← only if the asset has them
└─────────────────────────────────────────────────────────────┘
```

Default controls:
- ✕ close (also Esc, browser Back, and swipe down)
- ★ favorite (`F`)
- ⤓ download, which opens a small menu or bottom sheet listing only the formats this asset supports: GIF, sprite sheet, frames ZIP
- ⓘ metadata panel (side panel on desktop, bottom sheet on phone)

Conditional controls:
- Direction and animation chips, shown only for characters or objects that have them.
- Animation playback is automatic. Play/pause and speed controls live on the sprite (click to pause) and in ⓘ.

Prev/next uses arrow keys and swipes, with an edge hover arrow on desktop.

---

## Recommendations

1. **Use Concept A,** with B's library logic in the dock rather than as a separate screen.
   - It meets the ≤5 budget (4 controls), keeps a labeled search like Apple's Search button, and opens on content. That matches 04's grid-first finding.
   - It also replaces the rejected sidebar with folder tiles, which is the home-screen idea the owner asked for.
   - **Supersedes 04 #14** (the hideable sidebar on expanded screens): use no sidebar at any width.
2. **Folders are tiles, not navigation.**
   - Show them as a stacked 2×2 preview with a name, at the start of All. Clicking one opens it in place with Back, and the URL changes so browser Back works.
   - Folders stay local references (per 04).
3. **One input, one meaning, everywhere.**
   - Desktop: click = open, corner check = select, right-click = the same 4-item menu as hover `⋯`.
   - Phone: tap = open, long press = select.
   - The rule is the same on every grid, per Apple's consistency rule.
4. **Every hidden path has a visible twin.**
   - Right-click pairs with hover `⋯`, long press with "Select" in the overflow, `/` with the search pill, and keyboard shortcuts with the `?` sheet in the overflow (Apple HIG and NN/g).
5. **Modes swap chrome, never stack it.** Selection mode replaces the dock with an accent-colored bar that shows a count and ✕ (the Drive and M3 Expressive precedents). Esc exits.
6. **Viewer controls stay at 4,** plus conditional chips. Download formats are listed per asset type, and unsupported formats are hidden (Apple) rather than disabled, because the set is fixed per type.
7. **Don't hide the dock on scroll on desktop.** Keyboard and screen-reader reachability outweighs a few pixels (see the MDC TalkBack note).
8. **Skip widgets, FABs, pages, and carousels.** None passes the "adds a decision or action" test for a view-only gallery.
9. **Handle sparse states deliberately:** hide empty types, show skeleton tiles while loading, and show one short empty-state line with a single action when the library is empty.

## Pitfalls (checklist)

- [ ] A gesture with no visible twin (long press, right-click, keyboard shortcut, swipe).
- [ ] Long press or right-click meaning different things in different views.
- [ ] Click both opening and selecting, depending on hidden state. Always show selection mode visibly with the accent bar, count, and ✕.
- [ ] Folders that look like assets. Use the stacked edge and name label to tell them apart.
- [ ] A dock that grows into the old crowded top bar (more than 5 controls). Move extras to `⋯`.
- [ ] Empty type groups or a near-empty Library screen. Hide them, or open straight on the grid.
- [ ] Hijacking Ctrl-F or Ctrl-+/- (browser find and zoom; see 04).
- [ ] Hiding chrome on scroll in a way keyboard or screen-reader users can't recover.
- [ ] Horizontal "pages" on desktop. Use one vertical scroll.
