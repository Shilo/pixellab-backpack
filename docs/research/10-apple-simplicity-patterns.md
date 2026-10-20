# Apple Simplicity and Progressive Disclosure Patterns for Vitrine

Research date: 2026-10-19. Scope: Apple HIG (2024-2026 revisions), Photos on iOS/iPadOS/macOS 26 (with a note on the 27 releases now current), iCloud.com web apps, Finder/Quick Look, and critiques of Apple minimalism. Goal: concrete patterns for redesigning Vitrine (view-only PixelLab asset gallery, desktop web dark mode first, mobile second) so screens carry few controls while keeping browse, metadata, animation playback, favorites, folders, and downloads (GIF, sprite sheet, frames ZIP, multi-asset).

Note on versions: as of this date Apple support pages already list iOS 27 and macOS 27 ([iPhone User Guide version selector](https://support.apple.com/guide/iphone/view-photos-and-videos-iph3d267610/ios); [Mac Quick Look guide](https://support.apple.com/guide/mac-help/view-and-edit-files-with-quick-look-mh14119/mac)). 9to5Mac reports iOS 27 "doesn't contain any big changes to the design of the Photos app" ([9to5Mac, Ryan Christoffel, 2026-06-16](https://9to5mac.com/2026/06/16/heres-everything-new-for-apple-photos-in-ios-27/)), so the iOS 26 layout described below remains the current structural model.

## 1. What do Apple's HIG principles say about hierarchy, progressive disclosure, menus, toolbars, sidebars, and sheets?

### Takeaway
The Liquid Glass-era HIG (June 2025 onward) reframes Apple's principles as "establish hierarchy, create harmony, and maintain consistency"; controls float as a separate layer above content, toolbars are capped at about three groups with a More menu for the rest, context menus must never be the only path to an action, sidebars should be hideable but not hidden by default, and disclosure controls hide "advanced functionality" by default.

### Cited Findings
**Principles (Liquid Glass era)**
- Apple's Liquid Glass overview states the goal is interfaces that "establish hierarchy, create harmony, and maintain consistency across devices and platforms." Design principles listed: "Define a layout and choose a navigation structure that puts the most important content in focus"; "Be judicious with your use of color in controls and navigation so they stay legible and allow your content to infuse them and shine through"; "Adopt standard iconography and predictable action placement across platforms." — [Apple Developer, Liquid Glass technology overview (2025-2026)](https://developer.apple.com/tutorials/data/documentation/technologyoverviews/liquid-glass.md)
- Third-party summaries of WWDC25 describe Liquid Glass controls and navigation as "a distinct functional layer floating above the app" (hierarchy); the older "clarity, deference, depth" wording is superseded in this framing. — [Create with Swift](https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/); [CaptainSwiftUI](https://captainswiftui.substack.com/p/the-northern-stars-of-liquid-glass). I could not fetch the HIG "Design principles" page body directly to confirm whether clarity/deference/depth wording still appears anywhere (see Gaps).

**Toolbars** — [HIG Toolbars; change log: updated for Liquid Glass 2025-12-16, grouping guidance added 2025-06-09](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/toolbars.json)
- "Choose items deliberately to avoid overcrowding." Groups: "aim for a maximum of three."
- "Add a More menu to contain additional actions" — less important actions go there, and only if needed.
- On iOS: "Prioritize only the most important items for inclusion in the main toolbar area," the rest go in a More menu.
- macOS/iPadOS auto-add an overflow menu when items don't fit; "Don't add an overflow menu manually, and avoid layouts that cause toolbar items to overflow by default." Trailing-edge items "remain visible at all window sizes"; center items collapse first.
- Placement: leading = back, sidebar toggle, title; center = common controls; trailing = critical items, inspector buttons, search, More menu, primary action. Group by "function and frequency of use."
- Use one `.prominent` primary action, trailing side. Prefer borderless system symbols; "Make sure the meaning of each control is clear."
- "Consider temporarily hiding toolbars for a distraction-free experience" and "offer ways to reliably restore hidden interface elements."
- "Reduce the use of toolbar backgrounds and tinted controls"; prefer the default monochrome appearance when content is bright or colorful.
- macOS: "Make every toolbar item available as a command in the menu bar," because toolbars can be hidden/customized.

**Menus** — [HIG Menus; change log 2026-06-08 icons update, 2025-07-28 icons added](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/menus.json)
- A menu "reveals its options when people interact with it, making it a space-efficient way to present commands."
- "Prefer listing important or frequently used menu items first"; group with separators; labels are verb phrases in title case.
- Ellipsis in a menu item label means the action "requires more information before it can complete" (not "hidden items").
- Submenus: "Use submenus sparingly," one level, and if a submenu has "more than about five items, consider creating a new menu." Example: collapse Sort by Date/Score/Time into one "Sort by" submenu.
- "Use menu item icons sparingly and with purpose"; icons for all items in a group or none.
- iOS/iPadOS menus support a "medium" layout: "a row of three items" with symbol + short label at the top, for three important frequent actions.

**Context menus** — [HIG Context menus; change log through 2023-12-05](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/context-menus.json)
- Context menus give access "without cluttering the interface" but are "hidden by default, so people might not know they're there."
- "Always make context menu items available in the main interface, too."
- "Prioritize relevancy" — no advanced/rarely used items; "Aim for a small number of menu items"; about three groups max; destructive items last.
- "Be consistent" — offering them in some places but not others makes people think something is broken.
- "Hide unavailable items; don't dim them."

**Sidebars** — [HIG Sidebars; change log 2026-06-08, 2025-06-09 content-under-sidebar, 2024-08-06 adaptable style](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/sidebars.json)
- "Consider using a tab bar first" — it "provides more space to feature content."
- "Consider letting people hide the sidebar" (macOS: show/hide button and View menu commands), but "Avoid hiding the sidebar by default to ensure that it remains discoverable."
- macOS: "Consider automatically hiding and revealing a sidebar when its container window resizes."
- "show no more than two levels of hierarchy in a sidebar"; group with disclosure controls if there is a lot of content; let people customize sidebar contents.
- Sidebars "can float above content in the Liquid Glass layer"; "Extend visually rich content beneath the sidebar."

**Disclosure controls** — [HIG Disclosure controls (no change log in fetched data; copyright 2026)](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/disclosure-controls.json)
- "Use a disclosure control to hide details until they're relevant."
- "Place controls that people are most likely to use at the top of the disclosure hierarchy so they're always visible, with more advanced functionality hidden by default."
- "Make sure your labels indicate what is disclosed or hidden, like 'Advanced Options.'" "Use no more than one disclosure button in a single view."

**Sheets / popovers** — [HIG Sheets; updated 2026-03-24](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/sheets.json)
- A sheet is for "a scoped task that's closely related to their current context"; "Keep sheet interactions brief and occasional"; "Avoid using a sheet to help people navigate your app's content"; one sheet at a time.
- Medium detent (about half height) is explicitly recommended for progressive disclosure (example: share sheet); include a grabber in resizable sheets.
- Popovers: "a transient view that appears above other content when people click or tap a control."

### Inferences
- Apple's rule set already encodes Vitrine's answer: content first, one floating control layer, at most three toolbar groups, a single More menu for secondary actions, and every hidden (right-click/long-press) action duplicated in a visible menu.
- "Ellipsis" in Apple's vocabulary has two meanings: the "…" More button (overflow) and an ellipsis suffix on a menu item label (needs more input, e.g. "Download Options…"). Vitrine should use both correctly.
- The sidebar guidance is ambivalent for a minimal gallery: Apple says prefer a tab bar first and avoid hiding sidebars by default. The compliant route for Vitrine is a sidebar that is collapsed only below a width breakpoint, or a small segmented/tab control replacing the sidebar entirely.

### Gaps
- The HIG "Design principles" page and "Progressive disclosure" JSON endpoints returned no body or 404, so exact current principle wording beyond the Liquid Glass overview is unverified.
- No HIG text found specific to web apps; HIG is native-platform guidance.

## 2. Apple Photos on iOS/iPadOS/macOS 26: what is visible, what is revealed, and how many controls?

### Takeaway
iOS 26 Photos is the reference model: the Library grid shows only a handful of floating controls (Select, a view-options button, two tabs, Search), with time scales (Years/Months/All) appearing on scroll and albums/favorites moved to a separate Collections tab; the viewer shows a thin top bar and a five-icon bottom bar that hide on tap, with metadata revealed by swipe-up or the info button. macOS 26 Photos is far denser (sidebar plus about ten toolbar items) and is not the model to copy.

### Cited Findings
**iOS 26 structure**
- After the iOS 18 single-screen backlash, Apple brought back tabs: Library and Collections, plus a separate Search button moved to the bottom right with a larger icon. — [TechCrunch, 2025-06-09](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/); [MacRumors iOS 26 Photos guide, Juli Clover, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/); [9to5Mac, Ryan Christoffel, 2025-10-23](https://9to5mac.com/2025/10/23/heres-everything-new-for-apple-photos-in-ios-26/)
- Library tab is "essentially the grid of all your photos"; swiping down collapses the tabs and reveals sorting by Years, Months, or All. — [Ubergizmo, 2025-06](https://www.ubergizmo.com/2025/06/ios-26-redesigns-photos-app/). MacRumors: scrolling brings up Years and Months options plus buttons to return to the tab bar or start a search. — [MacRumors, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/)
- Library top controls: a larger Select button and a filter/view-options button (zoom in/out, exclude screenshots and Shared With You). — [MacRumors, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/)
- Collections tab: Recent Days, People and Pets, Pinned, Memories, Trips, Albums, Featured Photos; Media Types and Utilities as larger buttons. Sections collapse to just their names; a control at the top can collapse all, show all, reorder, or change view (larger top thumbnails / all large / all small). — [MacRumors, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/); [9to5Mac, 2025-10-23](https://9to5mac.com/2025/10/23/heres-everything-new-for-apple-photos-in-ios-26/). Photos remembers which sections you expanded. — [AppleInsider (search snippet)](https://appleinsider.com/inside/ios-26/vs/photos-ios-26-vs-ios-18-small-changes-huge-impact)
- Favorites are reached via Collections > Pinned > Favorites. — [Apple Support 121870](https://support.apple.com/en-ca/121870)
- Liquid Glass is applied lightly in Photos because photos remain the focus; tab bar and buttons are translucent so photos show through. — [MacRumors, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/); [9to5Mac, 2025-10-23](https://9to5mac.com/2025/10/23/heres-everything-new-for-apple-photos-in-ios-26/)
- Reviewer trade-offs: lost Recent Days preview under the grid; iCloud sync status now takes several taps instead of being visible. — [Neowin (search snippet)](https://www.neowin.net/news/ios-26-photos-app-whats-good-and-whats-bad-in-the-latest-update/)

**iOS 26 viewer**
- Bottom row: share, favorite, information, edit, delete. Swiping up on the image brings up metadata (date, captions, device, focal length, ISO, location). — [AppleInsider "Inside Photos in iOS 26 & macOS 26" (search snippet; page returned 403 to direct fetch)](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool)
- Top-right Spatial Scene button (hexagon) appears on eligible photos. — [MacRumors, 2025-08-15](https://www.macrumors.com/guide/ios-26-photos-app/)
- Swipe-up details also surface contextual links (event details for concerts/sports). — [9to5Mac, 2025-10-23](https://9to5mac.com/2025/10/23/heres-everything-new-for-apple-photos-in-ios-26/). iOS 27 adds "Add Keywords" at the bottom of that swipe-up panel. — [9to5Mac, 2026-06-16](https://9to5mac.com/2026/06/16/heres-everything-new-for-apple-photos-in-ios-27/)
- "Tap to show and hide the controls" while viewing a photo (from an older Apple guide; long-standing pattern). — [Apple iPod touch / iPhone guide](https://help.apple.com/ipod-touch/7/en.lproj/iph3d267610.html)

**macOS 26 Photos**
- Sidebar became more iPad-like with Pinned Collections; new filter/sort buttons in all views; customizable collection tile sizes. — [MacRumors macOS Tahoe roundup](https://www.macrumors.com/roundup/macos-26/)
- Library separate from Collections; Pinned, Albums and other collections listed in sidebar; sections reorderable. — [MacMost, Photos organization in macOS Tahoe](https://macmost.com/photos-app-organization-in-macos-tahoe.html)
- Top of grid holds buttons for zoom, Years/Months/All Photos, filtering, thumbnail fill, information, sharing, favoriting, rotation, and search. — [AppleInsider (search snippet)](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool)
- AppleInsider argues only the iOS app changed meaningfully; macOS/iPadOS layouts are similar to before. MacRumors frames it as a bigger overhaul. Sources conflict on degree. — [AppleInsider](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool); [MacRumors](https://www.macrumors.com/roundup/macos-26/)

**Element inventories** (S = sourced above; U = unverified, from general product familiarity; verify on device before quoting)

iOS 26 Photos, Library grid (first screen):

| # | Element | Position | Source |
|---|---|---|---|
| 1 | "Library" large title / item count | top-left | U |
| 2 | Select | top-right | S |
| 3 | View options / filter button | top-right | S |
| 4 | Account/profile avatar | top-right | U |
| 5 | Library tab | bottom-left floating pill | S |
| 6 | Collections tab | bottom-left floating pill | S |
| 7 | Search button | bottom-right floating | S |
| (on scroll) | Years / Months / All segmented control | bottom | S |

Visible interactive controls at rest: 5-6 (4 sourced). Everything else (albums, favorites, people, media types, sort, filter details) is one tap away.

iOS 26 Photos, photo viewer:

| # | Element | Position | Source |
|---|---|---|---|
| 1 | Back | top-left | U |
| 2 | Date / location title | top-center | U |
| 3 | More (…) menu | top-right | U |
| 4 | Spatial Scene (only when eligible) | top-right | S |
| 5 | Share | bottom | S |
| 6 | Favorite (heart) | bottom | S |
| 7 | Info (i) | bottom | S |
| 8 | Edit | bottom | S |
| 9 | Delete | bottom | S |
| hidden | Metadata panel | swipe up / Info | S |
| hidden | All chrome | tap to hide/show | S (older guide) |

Visible controls: about 8 at rest, 0 after a tap.

macOS 26 Photos, main window:

| Region | Elements | Source |
|---|---|---|
| Sidebar | Library, Pinned (Favorites etc.), Albums, other collections; reorderable sections; sidebar toggle | S (toggle U) |
| Toolbar | zoom, Years/Months/All Photos, filter, thumbnail fill, info, share, favorite, rotate, search | S |

Visible controls: about 10 toolbar items plus every sidebar row. This is the "busy" end of Apple's spectrum.

### Inferences
- The iOS 26 model maps directly onto Vitrine's goal: a full-bleed grid with two-to-three navigation destinations and a single options button; collections (folders, favorites, asset types) on a separate screen rather than a permanent sidebar.
- The viewer's five-icon bottom bar is the target ceiling for Vitrine's asset detail; the info panel is revealed, never shown by default.
- macOS Photos proves that even Apple ships a dense desktop layout; the owner's "iOS-like" request means borrowing the iOS 26 structure for desktop web, not copying macOS Photos.

### Gaps
- No primary source fetched for the exact iOS 26 Library top-bar contents (profile avatar presence) or the viewer's More menu contents; Apple's iPhone User Guide pages returned only navigation chrome to the fetch tool. AppleInsider's detailed inventory article blocked direct fetch (403); its claims come from search snippets.
- No iPadOS 26-specific inventory found beyond "similar to macOS" (AppleInsider) and HIG's adaptable tab bar/sidebar style.

## 3. How do Apple's web apps (iCloud.com, iWork for iCloud, Music, Invites) present a home screen and reveal tools?

### Takeaway
iCloud.com uses a launcher-style home of customizable tiles (Photos tile shows a count and recent thumbnails, clicking one deep-links into Photos) and, inside Photos, a hideable sidebar plus a toolbar where the common action is a direct button (Download) and variants live behind a More button. Current, detailed sources for iWork-on-web, Apple Music web, and Freeform web layouts were not found.

### Cited Findings
- iCloud.com redesign (beta Oct 2022, live Nov 2022): tile home page; Photos tile shows library count and recent thumbnails; clicking a thumbnail opens Photos with that picture selected; tiles can be added, removed, rearranged, resized via a "Customize Home Page" button at the bottom. — [AppleInsider, 2022-11-16](https://appleinsider.com/articles/22/11/16/apple-unveils-new-design-for-icloudcom-with-customizable-tiles); [9to5Mac, 2022-11-16](https://9to5mac.com/2022/11/16/icloud-web-interface-redesign-beta/); [How-To Geek](https://www.howtogeek.com/848991/apples-new-icloud.com-has-arrived/)
- Later iCloud.com updates added tile options such as showing only favorite photos and multiple tile layouts. — [search summary of iCloud.com coverage; original outlets per AppleInsider/9to5Mac listing above](https://9to5mac.com/2022/11/16/icloud-web-interface-redesign-beta/) (exact later-update article not fetched; treat as moderately confident)
- iCloud.com Photos: "If you don't see the sidebar, click" the sidebar button (sidebar can be hidden). Download button sits in the upper right and downloads "the most compatible format" for the device; the More button contains "More Download Options" (Unmodified Originals, Highest Resolution, Most Compatible). Double-click opens a single item. Multi-select by Command/Control-click, up to 1,000 items. — [Apple Support, iCloud web guide](https://support.apple.com/guide/icloud-web-only/mmb5dbaf376f/icloud); [Apple Support 111762](https://support.apple.com/en-jo/111762)
- On iPhone/iPad browsers, iCloud Photos uses Select > More > Download [n] Items. — [Apple Support 111762](https://support.apple.com/en-jo/111762)
- iWork for iCloud (2013 launch coverage): reached from iCloud home icons; opening an app shows its documents with a single "create new" button; sidebar is contextual (changes to show tools related to the selected object). — [Macworld](https://www.macworld.com/article/221727/hands-on-iwork-for-icloud-beta-almost-as-good-as-mac-ios-versions.html); [Macworld](https://www.macworld.com/article/221192/iwork-for-icloud-highlights-productivity-suite-update.html)
- Apple Invites (Feb 2025) runs on the web at icloud.com/invites; anyone can RSVP without an Apple account; reviewers found the web send flow laborious (per-person slide-up sheet). — [MacTrast, 2025-02](https://www.mactrast.com/2025/02/apple-launches-new-invites-app-sports-icloud-features/); [Six Colors, 2025-02](https://sixcolors.com/link/2025/02/apples-invites-invites-you-to-send-invitations/)
- Apple Music web left beta in 2020 at music.apple.com with a design matching macOS 11 / iPadOS 14 (sidebar, line icons). No 2025-2026 web redesign reporting found. — [MacStories](https://www.macstories.net/news/apple-music-for-web-debuts-new-beta-version-with-fresh-design-and-listen-now/)

### Inferences
- iCloud.com Photos' "direct default + More for variants" download pattern is exactly what Vitrine needs: one Download button that does the sensible default per asset type (GIF for animations, PNG for stills), with "Download Options…" (sprite sheet, frames ZIP, scale) behind it.
- iWork's contextual sidebar (tools appear only for the selected object) is the web precedent for an inspector that appears only when an asset is open.
- The tile home suggests an optional Vitrine "home" of type tiles (Characters, Objects, Tilesets...), but YAGNI: the iOS 26 Library-first approach (grid as home) has fewer screens.

### Gaps
- No current (2024-2026) primary description of iWork web, Freeform web (Freeform for iCloud web status unverified), or Apple Music web layouts. No count of iCloud.com Photos toolbar items from a primary source.

iCloud.com Photos inventory (S = sourced, U = unverified):

| Screen | Element | Source |
|---|---|---|
| Grid | Sidebar (Library, Albums, shared albums...) with Open/Hide Sidebar toggle | S (toggle), U (contents) |
| Grid | Upload | U |
| Grid | Share | U |
| Grid | Add to album | U |
| Grid | Download (upper right) | S |
| Grid | Favorite | U |
| Grid | Delete | U |
| Grid | More (…) containing More Download Options | S |
| Viewer | opens by double-click; same toolbar actions apply to the single item; Info | S (open), U (rest) |

Approximate visible toolbar controls: 7-8 plus sidebar rows; notably denser than iOS Photos.

## 4. Finder Gallery view, Quick Look, Preview pane: "look quickly, act only when needed"

### Takeaway
Quick Look is the purest Apple pattern for a viewer: Space opens a full preview of the selection, arrow keys step through items, Space or Close dismisses, and the few controls (Open with, Share, Markup, Rotate, Full Screen, Index Sheet for multiple) are small and secondary. Finder's Preview pane keeps metadata hideable and lets people choose which fields and Quick Actions appear.

### Cited Findings
- Quick Look: select items, press Space; with several selected, the last selected shows first; navigate with Left/Right arrow keys or arrows near top-left; Index Sheet button or Command-Return shows a grid; Full Screen with Play for slideshow; Command-Plus/Minus to zoom; Rotate, Markup, Trim, "Open with [App]", Share; dismiss with Space or Close. — [Apple Support, Quick Look (macOS 27 guide)](https://support.apple.com/guide/mac-help/view-and-edit-files-with-quick-look-mh14119/mac)
- Finder Preview pane shows a file preview plus "a comprehensive list of all the metadata for the file"; toggled via View > Show Preview; fields chosen in View > Show Preview Options; optional Quick Actions buttons let people act "without opening an app." — [Apple Support, Preview pane](https://support.apple.com/guide/mac-help/use-the-preview-pane-in-the-finder-on-mac-mchl1e4644c2/mac)

### Inferences
- Vitrine's desktop viewer should behave like Quick Look: Space opens/closes the focused asset, arrow keys move between assets, Escape closes, and an index/grid view is one key away. This adds full keyboard power with zero visible controls.
- The Preview pane's "user picks which metadata fields show" is over-scope for Vitrine (YAGNI); a fixed, short metadata summary with a "Show all" disclosure is enough.

### Gaps
- Finder Gallery view-specific article (thumbnail strip, "Show More" metadata) did not load; behavior not verified from a primary source in this pass.
- Preview.app specifics not researched (low marginal value after Quick Look).

## 5. Apple TV app / App Store "Today" cards

### Takeaway
Not researched to primary-source standard in this pass; low relevance for a personal asset library versus Photos/Quick Look.

### Cited Findings
- None gathered.

### Inferences
- Editorial card layouts suit curated, low-volume content; a personal library of hundreds of assets is better served by a dense, uniform grid (the Photos model). Possible narrow use: a single "Recent" hero row at the top of the grid, but that is the kind of addition the owner asked to avoid.

### Gaps
- No sources fetched on TV app or App Store Today card anatomy.

## 6. Where Apple's minimalism hurt discoverability, and how to avoid it

### Takeaway
The iOS 18 Photos single-screen redesign (2024) drew sustained backlash for being confusing and overwhelming, and Apple partly reverted in iOS 26 by restoring tabs. Older critiques (Norman and Tognazzini, 2015; Nielsen on iOS 7) show the recurring failure: actions with no visible signifier, unlabeled icons, and gestures people must memorize.

### Cited Findings
- iOS 18 Photos: critics called the unified design confusing; users found it difficult to navigate, unintuitive, overwhelming; Bloomberg's Gurman said it was "probably a little too bold and potentially confusing"; Apple removed the carousel, moved albums higher, and restored saved content to the main grid during beta; added "Customize & Reorder". — [iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign); [heise](https://heise.de/-9832016); [BGR](https://bgr.com/tech/people-are-raging-over-the-ios-18-photos-app-redesign-heres-how-to-fix-it/)
- Complaints persisted two months after launch. — [Creative Bloq](https://creativebloq.com/tech/we-thought-the-apple-photos-redesign-would-grow-on-people-boy-were-we-were-wrong)
- iOS 26 restored tabs "after user backlash." — [TechCrunch, 2025-06-09](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)
- Note: the iOS 18 problem was too much on one screen (a long scrolling page of grid plus collections), not too little; the fix was separating destinations. — [iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign); [TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)
- Even iOS 26 hides features: 9to5Mac ran "iOS 26's Camera app hides key features, here's how to find them." — [9to5Mac, 2025-10-30](https://9to5mac.com/2025/10/30/ios-26s-camera-app-hides-key-features-heres-how-to-find-them/)
- Don Norman (2015): discoverability, feedback, recovery (undo), consistency are neglected; minimalism removed menus and cues; unlabeled icons are hard to interpret because people remember only a few; gestures vary by direction, finger count, tap count, and device with no on-screen cue. — [jnd.org, 2015-08-10](https://jnd.org/apples-products-are-getting-harder-to-use-because-they-ignore-the-principles-of-design/)
- Nielsen on iOS 7: flat buttons blend into the background so users can't find functions; but hiding Safari's chrome gained useful space. — [Econsultancy](https://econsultancy.com/five-user-experience-problems-with-ios7/)
- HIG itself warns context menus are "hidden by default, so people might not know they're there" and requires duplicating their items in the main UI. — [HIG Context menus](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/context-menus.json)

### Inferences
- Minimal is not the same as one screen: fewer controls per screen, but clearly separated destinations (iOS 26) beat a single clever page (iOS 18).
- Every hidden path (hover, right-click, long-press, keyboard, swipe) must be a shortcut to something also reachable through one visible, labeled control.
- Icon-only controls should be limited to universally known glyphs (heart, share/download arrow, ⓘ, …, X); everything else gets a text label or tooltip.

### Gaps
- No Nielsen Norman Group primary articles fetched (search returned secondary coverage only). No usage data quantifying iOS 18 vs 26 Photos satisfaction.

## 7. Pattern catalog and recommendations for Vitrine

### Takeaway
Adopt the iOS 26 Photos + Quick Look model: a full-bleed grid with at most 5 visible controls, collections (folders, favorites, types) on a separate screen or popover, and an asset viewer with at most 5 floating controls whose secondary actions live in one labeled More menu, plus keyboard/right-click/long-press shortcuts that duplicate, never replace, visible menus.

### Cited Findings
Pattern catalog (Apple source for each pattern cited in sections 1-6):

| Pattern | Where Apple uses it | What it hides | How users discover it | Vitrine use (desktop web / mobile) |
|---|---|---|---|---|
| Content-first full-bleed grid, floating translucent controls | iOS 26 Photos Library ([MacRumors](https://www.macrumors.com/guide/ios-26-photos-app/)); Liquid Glass layer ([Apple](https://developer.apple.com/tutorials/data/documentation/technologyoverviews/liquid-glass.md)) | Persistent bars, sidebars | Controls float over content; always visible but minimal | Grid fills viewport; one slim floating top bar on desktop, floating bottom pill on mobile |
| Two destinations instead of sidebar (Library / Collections) + Search | iOS 26 Photos ([TechCrunch](https://techcrunch.com/2025/06/09/after-user-backlash-apple-brings-back-tabs-to-the-photos-app-in-ios-26/)); HIG "tab bar first" ([Sidebars](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/sidebars.json)) | Albums, favorites, people, types | Labeled tabs | "All" and "Collections" (folders, Favorites, asset types) segmented control; search field/icon |
| Scale switch revealed on scroll | iOS 26 Years/Months/All ([Ubergizmo](https://www.ubergizmo.com/2025/06/ios-26-redesigns-photos-app/)) | Time grouping | Appears during scroll | Optional; Vitrine can skip (assets not time-heavy). Use a view-options menu for grouping by date/type instead |
| View-options "…" menu | iOS 26 Library filter/view button ([MacRumors](https://www.macrumors.com/guide/ios-26-photos-app/)); "Sort by" submenu ([Menus](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/menus.json)) | Sort, filter by type, thumbnail size, show/hide animations-on-hover | One icon button with tooltip "View Options" | One button: Sort by ▸, Filter ▸ (type checkmarks), Thumbnail Size ▸ |
| Edit/Select mode | iOS Photos Select; iCloud Select > More > Download ([Apple 111762](https://support.apple.com/en-jo/111762)) | Bulk actions | Labeled "Select" button | "Select" text button; in select mode a bottom bar appears: count, Favorite, Add to Folder, Download (n), Cancel. Desktop also Cmd/Ctrl/Shift-click |
| Collapsible sections with remembered state | iOS 26 Collections ([MacRumors](https://www.macrumors.com/guide/ios-26-photos-app/)) | Long lists of folders/types | Section headers with chevrons | Collections screen: Favorites, Folders, Types sections, collapsible, state persisted locally |
| Tap/click to hide chrome | Photos viewer ([Apple guide](https://help.apple.com/ipod-touch/7/en.lproj/iph3d267610.html)); HIG hide toolbars + reliable restore ([Toolbars](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/toolbars.json)) | All viewer controls | Click canvas toggles; mouse move restores (desktop) | Viewer chrome auto-fades after idle on desktop, toggles on tap on mobile |
| Swipe-up / ⓘ metadata panel | Photos viewer ([AppleInsider snippet](https://appleinsider.com/inside/ios-26/tips/inside-photos-in-ios-26-macos-26----refinements-in-apples-image-and-video-management-tool)) | Metadata | Visible ⓘ button + gesture | ⓘ toggles a right-side inspector (desktop) / medium-detent bottom sheet (mobile): name, type, size, directions, animations, prompt, created date; "Show All" disclosure for the rest |
| Direct default action + More for variants | iCloud.com Photos Download + More Download Options ([Apple](https://support.apple.com/guide/icloud-web-only/mmb5dbaf376f/icloud)) | Format choices | Labeled button + adjacent … | "Download" = smart default (GIF if animated, PNG otherwise); "Download Options…" opens a small popover: GIF / Sprite Sheet / Frames ZIP / scale |
| More (…) menu, grouped, destructive last | HIG Toolbars/Menus/Context menus | Rare actions | Standard … glyph, trailing edge | Viewer …: Copy Link/Name, Open on PixelLab, Add to Folder…, Show in Collection, Download Options… |
| Context menu as shortcut only | HIG ("Always make context menu items available in the main interface, too") ([Context menus](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/context-menus.json)) | Per-item actions in grid | Right-click / long-press with preview | Same items as viewer … menu; never exclusive |
| Quick Look keyboard viewer | Finder ([Apple](https://support.apple.com/guide/mac-help/view-and-edit-files-with-quick-look-mh14119/mac)) | Navigation controls | Space/arrow conventions; shortcut hint | Space opens/closes focused asset, ←/→ next/previous, Esc close, F favorite; "?" shows shortcut sheet |
| Medium-detent sheet for scoped tasks | HIG Sheets ([Sheets](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/sheets.json)) | Options/forms | Opens from a labeled control | Mobile: Download Options and Info as half-height sheets with grabber; desktop: popover/inspector |
| Sidebar that collapses with width, never hidden by default on desktop | HIG Sidebars | Folder list | Visible toggle | Only if the owner wants folders always reachable on wide screens; otherwise use the Collections destination (preferred, fewer controls) |
| Customizable launcher tiles | iCloud.com home ([AppleInsider](https://appleinsider.com/articles/22/11/16/apple-unveils-new-design-for-icloudcom-with-customizable-tiles)) | App list | Customize button | Skip (YAGNI); grid-as-home is simpler |

### Inferences
Recommendations (target visible-control budgets are ceilings for the resting state, excluding the asset thumbnails themselves):

1. **First screen = the grid, max 5 visible controls.** Desktop: app wordmark (non-interactive), segmented "All / Collections" (2), Search (1), View Options "…" (1), Select (1). No sidebar, no download/favorite buttons in the bar. Mobile: same set as a floating bottom pill (All, Collections, Search) plus Select and View Options at top.
2. **Folders, Favorites, and asset types live in Collections, not a sidebar.** Collections is a scrollable screen of collapsible sections (Favorites, Folders, Characters, Objects, Tilesets, Maps, UI, Images) with remembered expand state, mirroring iOS 26. Type filtering is also available in View Options so power users never leave the grid.
3. **Hover reveals, never hides.** On desktop grid hover show only a heart and an animated preview (animations play on hover; stills do nothing). Everything else on hover is a context-menu/right-click shortcut that duplicates the viewer's … menu.
4. **Asset viewer max 5 floating controls, auto-fading.** Close/Back, Favorite (heart), Download (smart default), Info (ⓘ), More (…). Previous/next appear as edge hit areas on hover (desktop) or swipe (mobile). Chrome fades after idle and returns on mouse move/tap.
5. **Animation controls appear only for animated assets and only inline.** A single compact playback strip (play/pause, direction picker, animation picker) docked under the sprite, shown only when the asset has directions/animations; frame-step and speed live under a "…" on that strip. Stills show no playback UI.
6. **Info is a toggle, not a default.** ⓘ opens a right inspector (desktop) or half-height sheet (mobile) with 5-6 key fields; "Show All" disclosure for prompt, seeds, IDs, raw metadata (HIG disclosure rule: "advanced functionality hidden by default").
7. **Downloads: one button, one options popover.** "Download" does the type-appropriate default; "Download Options…" (in … and as a split-button chevron) offers GIF, Sprite Sheet, Frames ZIP, scale. Multi-asset download only appears in Select mode as "Download (n)".
8. **Shortcuts for power, labeled menus for discovery.** Space/arrows/Esc/F/D as in Quick Look, a "?" shortcut sheet, tooltips on every icon button, and a one-time dismissible hint ("Press Space to preview, right-click for more") on first visit.

Pitfalls to avoid:
- Repeating iOS 18: cramming grid + collections + carousels into one long page; separate destinations instead ([iMore](https://imore.com/apps/user-backlash-has-reportedly-caused-apple-to-rethink-ios-18s-photos-redesign)).
- Actions reachable only by right-click, long-press, swipe, or keyboard ([HIG Context menus](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/context-menus.json); [Norman](https://jnd.org/apples-products-are-getting-harder-to-use-because-they-ignore-the-principles-of-design/)).
- Unlabeled custom icons (sprite sheet, frames ZIP); use text labels in menus and tooltips on icon buttons.
- Hiding chrome with no reliable way back; restore on mouse move/tap ([HIG Toolbars](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/toolbars.json)).
- Copying macOS Photos' toolbar density on desktop web; the owner asked for the iOS feel.
- Glassy, tinted controls over pixel art: keep bars monochrome and low-chroma so colorful sprites stay the focus ([HIG Toolbars](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/toolbars.json)). Translucency over busy pixel art can hurt legibility; use a stronger scrim than Apple does.
- Sheets used for navigation or stacked sheets ([HIG Sheets](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/sheets.json)).
- Dimmed items in context menus (hide unavailable ones instead) and more than about three groups per menu.
- Submenus deeper than one level or longer than about five items ([HIG Menus](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/menus.json)).

### Gaps
- Control budgets (5 / 5) are a synthesis from the inventories, not an Apple-stated number; Apple's only explicit cap is "a maximum of three" toolbar groups.
- Recommendations assume Vitrine does not need Apple's time-based Years/Months scale; confirm with how often users browse by date.
