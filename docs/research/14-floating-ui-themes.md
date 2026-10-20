# 14: Floating-UI themes for Vitrine (beyond Liquid Glass)

Research date: 2026-10-19. Scope: current (2025–2026) visual design languages that suit a minimal app whose navigation, search and options live in one **floating bottom dock**, and five theme concepts for Vitrine built on them. The layout and behavior of Concept 4 "Glass Library" (`mockups/simple/4-glass-library/`) stay fixed: full-screen category tiles, large asset cells, the context-changing dock, floating viewer controls (✕, ♡ ⓘ … capsule, animation chip, **Download GIF ▾**), the Info panel, menus, the folder overlay and the selection bar. Only the theme changes.

## Method and evidence quality

- **Sources.** Official pages where they loaded: Microsoft Fluent 2 ([materials](https://fluent2.microsoft.design/material), [elevation](https://fluent2.microsoft.design/elevation)), Microsoft Learn ([Windows 11 geometry](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry)), the Fluent UI source ([shadows.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/utils/shadows.ts)), Google Design ([expressive research](https://design.google/library/expressive-material-design-google-research)), Linear ([2026 refresh](https://linear.app/now/behind-the-latest-design-refresh)), the Chromium Intent to Ship for `corner-shape`, and font license listings. Platform news (9to5Google, SamMobile, Android Authority, GSMArena) covers rollouts.
- **Pages that did not load.** m3.material.io rendered only titles, the Nothing community post errored, an Android Authority article returned 403, and the Material Components docs mirror demanded a sign-in. Material token values below therefore come from search summaries of the official docs and are flagged where they are from memory.
- **Labels.** Token values are proposals. Contrast ratios are WCAG 2.x relative-luminance ratios that I computed for every text/background pair listed (script in the session scratchpad, not committed). Values marked *(unverified)* are from my own knowledge and need checking before use.

---

## 1. Research: design languages with floating UI

### 1.1 Google Material 3 Expressive (May 2025 onward)

**Core traits**
- Announced around Google I/O 2025. Google says it rests on 46 studies with more than 18,000 participants. The core tactics are **color, shape, size, motion and containment**: key actions stand out and like elements are grouped. In eye tracking, key UI elements were found up to 4× faster ([Google Design](https://design.google/library/expressive-material-design-google-research), page undated, IO25 campaign).
- Google's own caveats: broken familiar patterns hurt usability, "no amount of expressive design will beat basic functionality", and a strong minority prefers calmer designs ([Google Design](https://design.google/library/expressive-material-design-google-research)).
- **Toolbars.** The *docked toolbar* spans the width and holds global actions; it replaces the deprecated bottom app bar. The *floating toolbar* floats above content, holds contextual actions, can pair with a FAB, can be vertical on large screens, must not run past the pane edge, and puts extra actions in an overflow menu ([9to5Google, 2025-05-18](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)).
- **Two color schemes for toolbars.** *Standard* is "a low-emphasis color scheme best used for focusing attention on the body content". *Vibrant* is high emphasis and can signal a temporary mode change, such as edit mode ([9to5Google, 2025-05-18](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)). This maps directly onto Vitrine: standard for the library dock, vibrant for the selection bar.
- **Shape scale.** Material Components lists extra-large at 28dp, extra-large-increased at 32dp, extra-extra-large at 48dp and full at 50%. Compose adds `largeIncreased`, `extraLargeIncreased` and `extraExtraLarge` slots, the last behind the Expressive opt-in (search summary of the [Material Components shape docs](https://gitea.com/784622644/material-components-android/src/branch/master/docs/theming/Shape.md) and [Compose `Shapes`](https://developer.android.com/reference/kotlin/androidx/compose/material3/Shapes); I could not load the pages directly).
- **Motion.** Spring physics (stiffness and damping) replaces cubic-bezier easing, and shapes morph between states. I found only community summaries of this, not the official spec ([community M3 motion skill](https://skills.cat/skills/shelbeely/shelbeely-agent-skills/material-design-3-motion); [Flutter M3E package](https://pub.dev/documentation/material_3_expressive/1.0.8/)).

**In Google's apps**
- In June 2025, Google Photos replaced the album action buttons with a floating toolbar (Share, Add photos, Edit) ([9to5Google, 2025-06-02](https://9to5google.com/2025/06/02/google-photos-albums-redesign/)).
- In 2026 the main Photos navigation became a floating pill (Photos, Collections, Create) with a separate circular Search / Ask Photos button: on iOS in February, on Android about five months later ([Gadget Hacks](https://android.gadgethacks.com/news/google-photos-floating-bottom-bar-is-now-live-on-android-782/); [BGR](https://bgr.com/2212458/google-photos-floating-bar-update-change-android/)). The sources disagree slightly on the Android date. That pill-plus-round-button layout is close to Vitrine's dock (Library segment, Search, …), so Google already ships this pattern for a photo gallery.

**Floating surfaces.** Solid tonal fills (the surface-container roles), a small soft shadow, no border and no blur. Selection shows as a filled pill with the secondary-container color.

**Type.** Google Sans Flex was released under OFL 1.1 in November 2025. It is a variable font with weight, width, optical size, slant and roundness axes; sources disagree on whether grade is a sixth axis ([OMG! Ubuntu, 2025-11](https://www.omgubuntu.co.uk/2025/11/google-sans-flex-font-ubuntu); [Fontsource](https://fontsource.org/fonts/google-sans-flex/about)). It covers Latin scripts mainly.

**Fit for pixel art.** Good if Vitrine uses a **neutral** seed. Dynamic color taken from the art would tint the chrome to match whatever sprite is on screen, so it fights the "art is the hero" rule. A fixed neutral seed (a grey palette) is the only safe choice.

**Risks.** Playful shapes and bouncy motion can look toy-like. "Expressive" pushes color into the chrome, which Vitrine must keep for Download and selection only. And it looks like Android, which may feel off on a Mac.

### 1.2 Microsoft Fluent 2 / Windows 11

- **Materials.** *Solid* is the most common material: opaque, with color and elevation separating regions. *Acrylic* is semi-transparent frosted glass for transient, light-dismiss surfaces (popovers, menus). *Mica* is opaque and subtly tinted by the desktop wallpaper while the window is active, neutral when inactive. *Smoke* is a translucent black overlay that dims the UI behind a modal ([Fluent 2 materials](https://fluent2.microsoft.design/material)).
- **Geometry.** 8px radius for top-level containers, flyouts and dialogs; 4px for in-page controls and bars; 0px where straight edges meet, for example the two halves of a SplitButton ([Microsoft Learn, updated 2026-02-19](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry)).
- **Shadows.** Each token has two layers: an ambient `0 0 2px` (8px from shadow28 up) and a key shadow whose Y offset is half its blur. For example shadow16 is `0 0 2px ambient, 0 8px 16px key` and shadow28 is `0 0 8px ambient, 0 14px 28px key` ([Fluent UI shadows.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/utils/shadows.ts)). Fluent uses shadow28 for bottom sheets and raised tab bars and shadow64 for dialogs ([Fluent 2 elevation](https://fluent2.microsoft.design/elevation)). The dark-theme alphas (ambient 0.24, key 0.28) are *(unverified)*.
- **Direction in 2026.** Microsoft's consumer web products (Copilot, Edge, MSN, Bing) are moving to a separate "Copilot" design language, and Edge has reportedly stopped following Fluent ([Windows Latest, 2026-08-06](https://www.windowslatest.com/2026/08/06/chrome-is-likely-never-getting-windows-11s-modern-redesign-as-even-microsoft-no-longer-cares/)). Fluent 2 remains the Windows and Office system.
- **Web practice.** Live Acrylic needs `backdrop-filter`, which is expensive. Community guidance suggests a solid fill with a faint noise texture instead. This is not Microsoft guidance ([Fluent skill summary](https://openskillindex.com/skills/intense-visions-harness-engineering-design-fluent-design-19a64f)).

**Fit for pixel art.** Very good. The surfaces are solid and neutral, the accent appears only on the primary button, and tight radii frame square sprites well.

**Risks.** It looks like Windows Settings, and Segoe UI Variable exists only on Windows (it cannot be self-hosted). Small radii can feel corporate next to playful art.

### 1.3 Samsung One UI 8 / 8.5

- From 2026, Samsung's own apps are moving to a **floating, pill-shaped bottom bar** that sits over the content. Samsung Members 5.8 has one over its three tabs (April 2026), and Galaxy Store 6.6.18 replaced its full-width bar with a shorter floating one "matching One UI 9's style" (August 2026) ([SamMobile, 2026-04-27](https://www.sammobile.com/news/samsung-members-app-galaxy-phones-new-update-one-ui-8-5-design-floating-bottom-bar/); [SamMobile, 2026-08-06](https://www.sammobile.com/news/galaxy-store-gets-one-ui-9-inspired-redesign-on-one-ui-8-5/)).
- Leaked builds showed the Phone app's three tabs inside one floating pill and a pill-shaped Quick Share switcher, made more compact in an early One UI 9 build ([Android Authority](https://www.androidauthority.com/samsung-one-ui-8-5-leak-system-apps-redesign-3600230/)).

**Takeaway.** One UI shows the industry converging on the same floating-pill bottom bar. Its look (very rounded cards, solid tonal fills) overlaps with Material Expressive, so it does not get its own concept.

### 1.4 Nothing OS and "tech-minimal"

- Nothing's look is monochrome: a monochrome home screen and icon pack since OS 2.0, settled by 3.0 ([nothing.community, "Nothing OS evolution"](https://nothing.community/d/61774-nothing-os-evolution), via search summary because the page did not load; [GSMArena Phone (4a) review](https://www.gsmarena.com/nothing_phone_4a-review-2948p4.php)).
- **Typography moved away from dot matrix for body text.** Geist became the system typeface, and the dot-matrix style is now kept for display use, "where it can define character" ([nothing.community](https://nothing.community/d/61774-nothing-os-evolution) via search summary). Android Authority places the full switch in OS 5.0 ([Android Authority](https://androidauthority.com/nothing-os-5-0-3702682)), so the version is uncertain, but the direction is clear: **dot matrix for display only**.
- Nothing's Ndot font is proprietary. Open alternatives: **Doto**, a variable monospace dot-matrix display font on a 6×10 grid with dot-size and roundness axes, OFL 1.1, by Óliver Lalan ([Fontsource](https://fontsource.org/fonts/doto/about); [Google Fonts](https://fonts.google.com/specimen/Doto/about)). **Geist Pixel** comes in five pixel styles (Square, Circle, Grid, Triangle, Line), OFL 1.1 ([Fontsource](https://fontsource.org/fonts/geist-pixel/about); [Vercel](https://vercel.com/font?type=pixel)).
- Teenage Engineering is often grouped with Nothing; the two have collaborated. Commentary describes a third way between skeuomorphism and flat minimalism, monospaced type and a strong orange-and-black palette ([Blake Crosley design guide](https://blakecrosley.com/guides/design/teenage-engineering), third-party). I found no official Teenage Engineering design documentation.

**Fit for pixel art.** Strong thematically: dot-matrix type and pixel art are cousins. The catch is that a **true-black background swallows sprites' dark outlines** (see the Android Courier's near-black outline in `06-detail.png`). Art cells must sit on a lifted grey.

**Risks.** Dot-matrix type is hard to read below about 20px, red text on black fails contrast (4.05:1, computed), and it can look like a brand pastiche.

### 1.5 "Quiet dark" product UI (Linear, Vercel, Raycast)

- Linear's 2026-03-12 refresh moved from cool blue-ish greys to warmer, less saturated greys, warning that too much warmth looks muddy. It softened and reduced dividers, dimmed the sidebar so content stands out, scaled icons down and removed colored icon backgrounds. Its principles: "Don't compete for attention you haven't earned" and "Structure should be felt not seen" ([Linear](https://linear.app/now/behind-the-latest-design-refresh)).
- Raycast's redesign put actions, toasts and navigation titles into one action bar at the bottom of the window ([Raycast blog](https://www.raycast.com/blog/a-fresh-look-and-feel)). That is the same "everything in one bar" idea as Vitrine's dock. Raycast also prints the shortcut next to each action ([Raycast blog](https://www.raycast.com/blog/a-fresh-look-and-feel)).
- Geist (Sans, Mono, Pixel) is OFL 1.1 ([Fontsource](https://fontsource.org/fonts/geist-pixel/about)), and Nothing now uses it too (1.4).

**Fit for pixel art.** The best of all: zero-hue chrome, flat surfaces, hairlines. **Risk:** it looks generic, the "every dev tool" dark theme. Doc 08's Direction A "Quiet Studio" already sketched this family for a sidebar layout. Concept C below adapts it to the floating dock.

### 1.6 Arc / Dia and other floating-panel apps

- Arc innovated on browser mechanics (an auto-hiding sidebar) and went into maintenance mode in 2025 while the company moved to Dia ([doc 12, P12](12-simplicity-first-products.md)). Dia is deliberately familiar: a minimalist interface, the page's color extended into the tab, and fluid animations on the Assistant Bar ([Browser Company](https://browsercompany.substack.com/p/the-strategy-behind-dias-design); [Thurrott](https://www.thurrott.com/cloud/web-browsers/322287/the-browser-company-explains-its-vision-for-dia)).
- **Lesson for Vitrine:** do not tint the chrome from the content. Dia's page-color tab is the opposite of what pixel art needs.

### 1.7 A platform feature worth using: CSS `corner-shape`

- `corner-shape` (bevel, notch, scoop, squircle, superellipse; it can animate between them) shipped in Chrome and Edge 139 (August 2025). It works together with `border-radius`, and unlike `clip-path` it keeps borders and box-shadows. Firefox and Safari do not support it yet; WebKit has signaled support ([Blink Intent to Ship](https://groups.google.com/a/chromium.org/g/Blink-dev/c/OoX4xjqSPt4); [Frontend Masters](https://frontendmasters.com/blog/drawing-css-shapes-using-corner-shape/)).
- Use it **only as progressive enhancement**: a plain `border-radius` is the fallback, so no theme may depend on it. Concept E uses `bevel`.

---

## 2. Rules every theme keeps

These follow from the fixed layout and from doc 08. They are not repeated per concept.

1. **The art is the only saturated thing on screen.** Tile, cell and stage fills have near-zero chroma. Accent color appears in exactly two places, the Download primary and the selection-mode chrome, as Concept 4 already rules.
2. **Solid floating surfaces remove glass's biggest weakness.** Concept 4's README notes that bright art under a glass edge muddies the blur and shows color fringes. Every concept below uses an opaque fill for the dock, capsules, menus and panels, so contrast no longer depends on what scrolls underneath, and the cost of backdrop blur over a large grid disappears. The only translucency left is a dim **scrim** behind modal overlays (context menu, folder), replacing the blurred backdrop.
3. **Never pure black under art.** Sprites often carry near-black outlines. Cells and the viewer stage sit at least at about `#121212`, even when the page background is darker.
4. **Integer scaling, nearest-neighbor rendering, and the backdrop options (checker, light, dark) stay unchanged.**
5. **Accessibility.** Body and label text ≥ 4.5:1 on its actual surface (computed below). Focus ring ≥ 3:1 against both the control and its surroundings. Every motion has a `prefers-reduced-motion` fallback (a crossfade or no animation). Hit targets ≥ 44px on touch.
6. **Fonts are self-hosted OFL files or system fonts.** No CDN. Subset to Latin and preload only the UI weight.

**Baseline finding (current glass).** White "Download GIF" text on `#0A84FF` measures **3.65:1**, which fails 4.5:1 for 15px text. Every concept below fixes this; for the glass baseline itself, `#0071E3` gives 4.70:1.

---

## 3. Five theme concepts

Common token names, matching doc 08: `--bg, --tile, --cell, --float, --float-hi (menus and panels), --border, --text-1, --text-2, --text-3, --accent, --accent-on, --scrim, --shadow-float, --r-tile, --r-cell, --r-dock, --r-menu`.

### A. "Tonal Dock" (Material 3 Expressive, neutral)

**Inspiration.** M3 Expressive floating toolbar, standard and vibrant schemes ([9to5Google](https://9to5google.com/2025/05/18/material-3-expressive-toolbars/)); the Google Photos floating nav pill ([Gadget Hacks](https://android.gadgethacks.com/news/google-photos-floating-bottom-bar-is-now-live-on-android-782/)); the expressive research ([Google Design](https://design.google/library/expressive-material-design-google-research)).

**Mood.** Friendly, soft and confident. Big round shapes and springy motion, but a grey palette so the art keeps the color.

**Tokens (dark).** These follow Material's tonal surface-container ladder on a neutral seed.
```css
:root {
  --bg:        #131314;  /* surface */
  --tile:      #1C1B1C;  /* surface-container-low */
  --cell:      #201F20;  /* surface-container */
  --float:     #2A2A2B;  /* surface-container-high: dock, capsules (standard scheme) */
  --float-hi:  #2A2A2B;  /* menus, panel */
  --row:       #353536;  /* surface-container-highest: grouped rows, search field */
  --border:    transparent;  /* M3 separates by tone, not lines */
  --text-1:    #E5E2E3;  /* on-surface */
  --text-2:    #C4C7C5;  /* on-surface-variant */
  --text-3:    #939694;  /* outline, meta only */
  --seg:       #3C4858;  --seg-on: #D7E3F8;    /* secondary-container: selected segment */
  --accent:    #A8C7FA;  --accent-on: #062E6F;  /* primary: Download */
  --vibrant:   #0842A0;  --vibrant-on: #D3E3FD; /* primary-container: selection bar */
  --scrim:     rgb(0 0 0 / .5);
  --shadow-float: 0 1px 3px rgb(0 0 0 / .30), 0 4px 8px 3px rgb(0 0 0 / .15); /* M3 level 3 (unverified) */
  --r-tile: 28px; --r-cell: 20px; --r-dock: 9999px; --r-menu: 16px; --r-row: 16px;
}
```
Light (optional): bg `#F8F9FA`, float `#E9EEF6`, text-1 `#1B1B1C`, text-2 `#444746`, accent `#0B57D0` with `#FFFFFF`.

**Contrast (computed).** text-1/bg 14.43 · text-1/float 11.14 · text-2/float 8.41 · text-2/row 7.19 · text-3/float 4.80 · seg-on/seg 7.18 · accent-on/accent 7.50 · vibrant-on/vibrant 7.04. Light: text-1/bg 16.33 · text-2/float 8.06 · white/accent 6.39.

**Type and icons.**
- Google Sans Flex (OFL, self-host; its roundness axis matches the soft shapes), then Roboto Flex, then `system-ui`.
- 500 for labels, 600 for tile names.
- Material Symbols Rounded (Apache 2.0 *(unverified)*), as inline SVG subsets. Outlined at rest, filled when on (♡ favorited, ⓘ open).

**Motion.**
- Spring-like, using CSS `linear()` spring approximations, with a slight overshoot on the dock morph and the segment slide.
- **Shape morph** on press and toggle: a round icon button squares off to a 12px radius while pressed or on (`border-radius` transition; `corner-shape: squircle` where supported).
- Reduced motion: crossfades only.

**Components**
- **Dock.** A standard-scheme floating toolbar: a full pill, `--float`, level-3 shadow, 64px tall, no border.
  - Home: Library is the selected segment (a `--seg` pill), Search is a nested `--row` pill, and … is a round icon button.
  - Category: the ‹ Library pill, then "Objects 21", Search, Select and ….
  - The selected-segment pill **slides and stretches** between states with a spring.
- **Selection bar.** The same toolbar switches to the **vibrant** scheme (`--vibrant` fill), as M3E advises for a temporary mode. Download inside it uses `--accent`.
- **Viewer dock.** The floating toolbar holds the Walk · East chip, and **Download GIF ▾ sits beside it as an extended-FAB-style split button** (toolbar + FAB pairing): `--accent` fill, 16px radius, 56px tall.
- **Detail controls.** ✕ is a 48px round tonal button. ♡ ⓘ … form a connected button group in one `--float` pill. ⓘ when on morphs to a rounded square filled with `--seg`.
- **Info panel.** `--float-hi`, 28px radius, inset 12px from the edges. Rows are grouped as separate `--row` blocks with 2px gaps, the outer corners rounded 16px and the inner corners 4px (a segmented list). The prompt sits in a `--row` block with a tonal Copy button.
- **Menus.** 16px radius, `--float-hi`, 48px rows. The selected item gets a `--seg` pill with ✓.

**Distinct at a glance.** Round, chunky and tonal, with a sliding pill indicator; the dock turns blue in selection mode.

**Risks.** Can look Android-specific or toy-like. Watch the overshoot: keep springs damped. Material's springs have no official CSS equivalent, so they must be tuned by hand.

---

### B. "Mica Command" (Fluent 2 / Windows 11, solid)

**Inspiration.** Fluent 2 materials and elevation ([materials](https://fluent2.microsoft.design/material), [elevation](https://fluent2.microsoft.design/elevation)); Windows 11 geometry ([Microsoft Learn](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/geometry)); the Windows 11 Settings card layout.

**Mood.** Calm, precise, desktop-native. A floating **command bar**, not a pill.

**Tokens (dark).**
```css
:root {
  --bg:       #202020;  /* Mica-like base; optional 3% tint from the current category's dominant hue, the web stand-in for Mica's wallpaper tint */
  --tile:     #2B2B2B;  /* card fill */
  --cell:     #323232;
  --float:    #2C2C2C;  /* command bar, capsules: solid, no blur */
  --float-hi: #2C2C2C;  /* menus, panel; an opaque Acrylic stand-in */
  --stroke:   rgb(255 255 255 / .08);   /* 1px surface stroke, brighter on the top edge */
  --text-1:   #FFFFFF;
  --text-2:   #C5C5C5;  /* ≈ 78.6% white, Windows' secondary text level (unverified) */
  --text-3:   #9D9D9D;
  --accent:   #60CDFF;  --accent-on: #000000;  /* ≈ Windows 11 default dark accent (unverified) */
  --scrim:    rgb(0 0 0 / .4);   /* Fluent "Smoke" */
  --shadow-float: 0 0 8px rgb(0 0 0 / .24), 0 14px 28px rgb(0 0 0 / .28); /* shadow28 formula; dark alphas unverified */
  --shadow-menu:  0 0 2px rgb(0 0 0 / .24), 0 8px 16px rgb(0 0 0 / .28);  /* shadow16 */
  --r-tile: 8px; --r-cell: 8px; --r-dock: 8px; --r-menu: 8px; --r-control: 4px;
}
```
Light (optional): bg `#F3F3F3`, float `#F9F9F9`, text-1 `#1A1A1A`, text-2 `#5D5D5D`, accent `#005FB8` with `#FFFFFF`.

**Contrast (computed).** text-1/bg 16.29 · text-1/float 13.97 · text-2/float 8.09 · text-3/float 5.15 · accent-on/accent 11.67 · accent/float 7.76, so the accent works as text too. Light: text-1/bg 15.68 · text-2/float 6.25 · white/accent 6.31.

**Type and icons.**
- `"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", system-ui`. These are system fonts, which Microsoft does not license for self-hosting.
- For identical rendering off Windows, self-host **Selawik**, Microsoft's OFL Segoe-metric fallback *(unverified)*.
- Fluent UI System Icons (MIT *(unverified)*): Regular at rest, Filled when on.

**Motion.**
- Short and decelerating: about 167ms for fades and 250ms for the slide-in, with `cubic-bezier(0, 0, 0, 1)` *(unverified)*. No overshoot.
- Menus and panels enter with a 4–8px slide from the edge they attach to.

**Components**
- **Dock.** An 8px-radius rectangle, 48px tall, solid `--float`, a 1px `--stroke` (brighter top edge), shadow28.
  - Controls inside are 4px-radius subtle buttons that fill `rgb(255 255 255 / .06)` on hover.
  - The current segment (Library) gets a **3×16px accent pill indicator** under its label, as in Windows navigation.
  - Search is a TextBox look: 4px radius and a **2px accent bottom border when focused**.
- **Selection bar.** The same bar. "3 selected" leads, and Download is an accent button.
- **Viewer dock.** The Walk · East chip is a ComboBox (4px). **Download GIF ▾ is a true SplitButton**: two halves touching with no gap and square inner corners, per the geometry rules.
- **Detail controls.** ✕ and the ♡ ⓘ … capsule are 8px-radius solid rectangles with the stroke. ⓘ when on gets the accent indicator.
- **Info panel.** A solid pane, 8px radius, with **Windows Settings-style cards**: each fact group is a `--tile` card with 4px radius and 2px gaps, labels in text-2 and values right-aligned. Open in PixelLab ↗ is an accent hyperlink.
- **Menus.** MenuFlyout look: 8px radius, shadow16, 36px rows, 4px-radius hover fill. The context menu and folder overlay use the Smoke scrim instead of blur.

**Distinct at a glance.** Rectangular, tight and businesslike. A small accent underline marks "current", and a split button carries the download.

**Risks.**
- Can feel like Windows Settings, not a gallery.
- 8px tiles look boxy next to Concept 4's softness.
- Segoe falls back to other fonts on macOS, Linux and mobile (use Selawik if that matters).

---

### C. "Quiet Graphite" (Linear / Raycast-style flat)

**Inspiration.** Linear's 2026 refresh (warm greys, felt-not-seen structure) ([Linear](https://linear.app/now/behind-the-latest-design-refresh)); Raycast's single bottom action bar with printed shortcuts ([Raycast](https://www.raycast.com/blog/a-fresh-look-and-feel)); doc 08 Direction A.

**Mood.** Quiet, professional, keyboard-first. Zero-hue chrome; even the primary button is just inverted.

**Tokens (dark).**
```css
:root {
  --bg:       #141413;  /* warm neutral */
  --tile:     #1B1B1A;
  --cell:     #212120;
  --float:    #252524;  /* dock, capsules */
  --float-hi: #252524;
  --border:   #383734;  /* 1px hairline on every floating surface (decorative) */
  --text-1:   #EDEDEC;
  --text-2:   #A3A29D;
  --text-3:   #8F8E89;  /* shortcut hints, counts */
  --accent:   #EDEDEC;  --accent-on: #141413;  /* inverse: Download is a light button */
  --scrim:    rgb(0 0 0 / .55);
  --shadow-float: 0 0 0 1px rgb(0 0 0 / .6), 0 8px 24px rgb(0 0 0 / .45);
  --r-tile: 14px; --r-cell: 10px; --r-dock: 14px; --r-menu: 10px;
}
```
Light (optional): bg `#FAFAF9`, float `#FFFFFF`, text-1 `#1C1C1A`, text-2 `#6B6A65`, accent `#1C1C1A` with `#FAFAF9`.

**Contrast (computed).** text-1/bg 15.74 · text-1/float 13.10 · text-2/float 6.00 · text-3/float 4.67 · text-3/bg 5.62 · accent-on/accent 15.74. Light: text-2/bg 5.19 · text-2/float 5.42. The border is decorative (1.29:1); controls are identified by their labels and icons, never by the border alone.

**Type and icons.**
- Inter or Geist Sans (both OFL, self-host), then `system-ui`. Geist Mono for counts, sizes and shortcut chips. Weights 400 and 500, with 600 only for the viewer name.
- Lucide (ISC *(unverified)*) at 18px and a 1.5px stroke.

**Motion.** 120–180ms ease-out, no overshoot, no shape morph. The dock changes width with a plain tween, and labels crossfade.

**Components**
- **Dock.** 44px tall, 14px radius, hairline plus shadow. Compact text buttons. The selected segment is a `#2F2F2D` fill.
  - **Shortcut chips are printed inline** in Geist Mono and text-3: `/` in the search field, `?` in the … menu, `S` next to Select. This makes Concept 4's accelerators visible, Raycast-style.
- **Selection bar.** The same dock. "3 selected" in text-1, then Download as the inverse light button.
- **Viewer dock.** The Walk · East chip is a quiet text button with ▾. **Download GIF ▾ is the only light object on screen** (`--accent` fill, 8px radius, a 1px `--accent-on` divider before the chevron).
- **Detail controls.** 36px square buttons with 10px radius, `--float` and the hairline. ⓘ when on swaps to the inverse fill.
- **Info panel.** No cards. A definition list separated by hairlines: labels in text-2, values in Geist Mono with tabular numbers. The prompt is in mono with a text Copy button.
- **Menus.** 10px radius, 32px rows, shortcuts right-aligned in text-3, section dividers as hairlines inset 8px.

**Distinct at a glance.** Grey on grey, with one light button and visible keyboard hints. It reads like a pro tool.

**Risks.** Generic "another dev-tool theme". Little personality for a playful art library. Warm greys can muddy cool sprites if pushed further (Linear's own warning).

---

### D. "Nothing Mono" (monochrome, dot-matrix display type, one red)

**Inspiration.** Nothing OS's monochrome system and display-only dot matrix ([nothing.community](https://nothing.community/d/61774-nothing-os-evolution); [GSMArena](https://www.gsmarena.com/nothing_phone_4a-review-2948p4.php)); Teenage Engineering's monospace, constraint-driven style ([Blake Crosley](https://blakecrosley.com/guides/design/teenage-engineering), third-party).

**Mood.** Graphic, technical, collectible. Black, white, hairline outlines, LED-style numerals and one red signal.

**Tokens (dark).**
```css
:root {
  --bg:       #000000;  /* page only; never directly under art */
  --tile:     #0F0F0F;  --tile-border: #2A2A2A;
  --cell:     #141414;  /* lifted so near-black sprite outlines stay visible */
  --float:    #121212;  --float-border: #3D3D3D;   /* 1px, no shadow */
  --float-hi: #121212;
  --text-1:   #FFFFFF;
  --text-2:   #A8A8A8;
  --text-3:   #8A8A8A;
  --accent:   #D71921;  --accent-on: #FFFFFF;  /* Nothing-style red, approximate; fill only, never text on black */
  --inverse:  #FFFFFF;  --inverse-on: #000000; /* selected segments, ⓘ on */
  --scrim:    rgb(0 0 0 / .7);
  --shadow-float: none;  /* separation by outline, not elevation */
  --r-tile: 24px; --r-cell: 16px; --r-dock: 9999px; --r-menu: 20px;
}
```
Light (optional): bg `#FFFFFF`, cells `#F2F2F2`, text-1 `#000000`, text-2 `#5C5C5C`, the same red with white.

**Contrast (computed).** text-1/float 18.73 · text-2/float 7.88 · text-3/cell 5.34 · text-3/float 5.43 · white on red 5.18 · inverse 21.00. Red as text on black is **4.05, which fails**, so red appears only as a fill or a ≥3:1 non-text dot (red/float 3.61). The 1px border is decorative (1.72:1); a 2px white focus ring carries keyboard focus.

**Type and icons.**
- Geist Sans for all UI text (OFL, self-host), Geist Mono for metadata.
- **Doto** (OFL, self-host, variable dot size and roundness) **for display numerals and short display words only**: category counts at ≥ 20px, the dock count ("21"), "3" in the selection bar, the frame counter in the viewer … menu. This follows Nothing's own move to dot matrix for display, never body text.
- Section labels in 11px uppercase Geist Mono, +0.08em tracking.
- 1.5px outlined monochrome icons (Lucide or custom). The on state inverts.

**Motion.**
- Mechanical and crisp: 100–150ms linear-ish fades.
- Counts **tick** with `steps()` when they change (Sync, selection).
- The dock morph snaps: width tweens over 150ms with no spring.
- Reduced motion: no ticking.

**Components**
- **Dock.** A pill with a black fill, 1px `--float-border` and no shadow. The selected segment is an **inverted white pill with black text**. Search is an outlined inner pill. Separators between groups are a single 4px dot, not a line.
- **Selection bar.** "**3** selected" with the 3 in Doto. Download is the red pill.
- **Viewer dock.** The Walk · East chip is outlined. **Download GIF ▾ is a red pill with white text**, the only color in the UI.
- **Detail controls.** 44px outlined circles. ⓘ when on inverts to white.
- **Info panel.** A black panel with a 1px border and 20px radius. Labels are uppercase mono in text-2; values are Geist in text-1. Groups are divided by dotted rules (`border-top: 1px dotted #3D3D3D`). The name is Geist 600 at 24px; the Size value can use Doto ("128×128").
- **Menus.** 20px radius, 1px border, 40px rows, dotted dividers. The checked item gets a white dot (●) at left instead of ✓.
- **Selected cells.** 2px white ring plus a white check circle. Unselected cells in select mode show an outlined circle.

**Distinct at a glance.** Black and white outlines, LED-dot numbers and one red button. It looks like hardware.

**Risks.**
- Brand pastiche: keep it to "inspired by", with no Nothing marks or glyph-light motifs.
- Dot type is illegible if overused.
- Pure black page plus white outlines can look harsh, and on OLED, scrolling true black can smear.
- Red can clash with red sprites (potions, gems) in the viewer. Fallback: a white Download pill with a red dot.

---

### E. "Pixel Bezel" (retro-modern hardware, pixel-tool cues)

**Inspiration.** Pixel-editor conventions (marching-ants selection, pixel type) done tastefully. Teenage Engineering's "depth and texture without skeuomorphism" ([Blake Crosley](https://blakecrosley.com/guides/design/teenage-engineering)). Geist Pixel ([Vercel](https://vercel.com/font?type=pixel)). CSS `corner-shape: bevel` ([Blink Intent to Ship](https://groups.google.com/a/chromium.org/g/Blink-dev/c/OoX4xjqSPt4)).

**Mood.** A modern handheld console: chamfered panels, hard key shadows, crisp pixel numerals. It feels made for pixel art without imitating 8-bit UI.

**Tokens (dark).**
```css
:root {
  --bg:       #17161C;  /* deep slate, faint violet */
  --tile:     #201F27;
  --cell:     #26252E;
  --float:    #2B2A34;  --float-border: #46445A;  /* 2px border */
  --float-hi: #2B2A34;
  --text-1:   #F2F0E9;  /* warm paper white */
  --text-2:   #B3B0BF;
  --text-3:   #9693A3;
  --accent:   #8BE3B4;  --accent-on: #0D2A1C;  /* phosphor mint */
  --marquee:  #F2F0E9;  /* selection outline */
  --scrim:    rgb(10 10 13 / .6);
  --shadow-float: 0 4px 0 #0A0A0D;           /* hard key shadow, no blur */
  --shadow-press: 0 2px 0 #0A0A0D;           /* plus translateY(2px) */
  --r-tile: 12px; --r-cell: 8px; --r-dock: 12px; --r-menu: 10px;
}
/* Progressive enhancement: chamfered corners where supported (Chrome/Edge 139+); round corners elsewhere. */
@supports (corner-shape: bevel) { .float, .tile, .cell, .btn { corner-shape: bevel; } }
```
Light (optional): bg `#F4F1EA`, text-1 `#1E1D24`, text-2 `#5A576A`, accent `#0F6B47` with `#FFFFFF`.

**Contrast (computed).** text-1/bg 15.77 · text-1/float 12.41 · text-2/float 6.66 · text-3/float 4.72 · text-3/bg 5.99 · accent-on/accent 10.07 · accent/float 9.26 · marquee/cell 13.28. Light: text-1/bg 14.82 · text-2/bg 6.19 · white/accent 6.53.

**Type and icons.**
- Geist Sans for UI text. **Geist Pixel (Square)** for counts, section labels, the dock title count and "3 selected", at integer sizes that are multiples of the font's pixel grid so it renders crisp. Geist Mono for Info values. All OFL and self-hosted.
- Icons: a pixel-grid icon set such as Pixelarticons (MIT *(unverified)*) drawn at 24px (1× grid). Or keep Lucide for clarity and use pixel icons only for ♡ and ✓.

**Motion.**
- Tactile: buttons **press down** (translateY 2px, the shadow shrinks to 2px) over 60ms. Panels drop in over 120ms with `steps(3)` for a slightly stepped feel.
- In selection mode, selected cells get a **marching-ants dashed outline** (2px dashed `--marquee`, animated `background-position` or an SVG stroke offset). Reduced motion: a static dashed outline.

**Components**
- **Dock.** A chamfered rectangle (12px bevel), 2px `--float-border`, a hard 4px key shadow, 52px tall. The selected segment is a recessed well: a `--bg` fill with `inset 0 2px 0 #0A0A0D`. Search is an inset well with a blinking block cursor when focused (static under reduced motion).
- **Selection bar.** The same dock. "3 selected" in Geist Pixel, then Download as a mint key.
- **Viewer dock.** The Walk · East chip is a well. **Download GIF ▾ is a mint "key"** with the hard shadow, chamfered, and a 2px `--accent-on` divider before the chevron.
- **Detail controls.** 44px chamfered square keys. ⓘ when on sits pressed (no shadow, offset 2px).
- **Info panel.** A chamfered panel with a 2px border. Fact rows are aligned like a spec sheet, values in Geist Mono, separated by 1px dashed `--float-border` rules. Counts and size can use Geist Pixel.
- **Menus.** 10px chamfer, 2px border, 36px rows. The hover row inverts to text-1 on `--cell`, and the checked item shows a pixel ✓.

**Distinct at a glance.** Chamfered keys with hard shadows, pixel numerals and marching-ants selection. The chrome belongs to a pixel-art tool.

**Risks.**
- Hardest to keep tasteful: limit pixel type to numbers and labels.
- The mint accent can echo green tilesets; an alternative is a warm white Download key with a mint focus ring.
- Chamfers only in Chromium; other browsers get round corners, so both must look intended.
- The hard shadow plus 2px borders add visual weight that the art must outweigh.

---

## 4. Comparison

| | Baseline: Liquid Glass | A Tonal Dock | B Mica Command | C Quiet Graphite | D Nothing Mono | E Pixel Bezel |
|---|---|---|---|---|---|---|
| Floating surface | Blurred translucent tint | Solid tonal, soft shadow | Solid, 1px stroke, shadow28 | Solid, hairline, soft shadow | Solid black, 1px outline, flat | Solid, 2px border, hard shadow |
| Dock shape | Pill | Pill (sliding segment) | 8px command bar | 14px rounded bar | Pill (inverted segment) | Chamfered bar |
| Overlay backdrop | Blur | Scrim 50% | Smoke 40% | Scrim 55% | Scrim 70% | Scrim 60% |
| Accent use | Blue Download | Pastel-blue Download; blue selection bar | Cyan Download, accent underline | Inverse light Download | Red Download | Mint Download key |
| Type | System (SF / Segoe) | Google Sans Flex | Segoe UI Variable / Selawik | Inter or Geist | Geist + Doto display | Geist + Geist Pixel |
| Motion | Glass morph | Springs, shape morph | Short decelerate | Quick tweens | Snappy, ticking counts | Key presses, marching ants |
| Contrast over bright art | Varies (README weakness) | Fixed | Fixed | Fixed | Fixed | Fixed |
| Lowest text ratio (dark) | — | 4.80 | 5.15 | 4.67 | 5.34 | 4.72 |
| Download label ratio | 3.65 (fails) | 7.50 | 11.67 | 15.74 | 5.18 | 10.07 |
| Pixel-art neutrality | High | High (neutral seed only) | High | Highest | High (lifted cells required) | Medium-high |
| Main risk | Blur cost, fringes | Toy-like, Android feel | Corporate, Windows-only font | Generic | Pastiche, harsh | Kitsch, Chromium-only chamfer |

**Reading of the table.** All five drop backdrop blur, which fixes the README's "glass over art costs contrast" weakness and the blur rendering cost. **C** is the safest and most art-neutral. **A** carries the strongest current evidence for a floating bottom bar in a photo gallery (Google Photos 2026) and the best story for the dock's mode changes (standard to vibrant). **D** and **E** have the most identity, at the highest taste risk. **B** fits best if Vitrine is mainly used on Windows desktops.

## 5. Gaps

- **Official Material token values.** m3.material.io did not render, so the surface-container hex values, the M3 level-3 shadow recipe, the floating toolbar's default height and color roles, and the official spring parameters are unverified. Check them against the Material Web or Compose sources before building A.
- **Fluent dark shadow alphas, the Windows default dark accent (`#60CDFF`), the secondary text opacity, Selawik's license and the motion curves** are from memory. The shadow formula itself is verified.
- **Nothing's exact red and OS version for the Geist switch.** Sources disagree (4.0 or 5.0), and I found no official Nothing design spec. Treat `#D71921` as an approximation.
- **Icon set licenses** (Material Symbols, Fluent System Icons, Lucide, Pixelarticons) were not checked this pass.
- **Spotify desktop's 2025–2026 floating panels and Samsung One UI's exact surface colors and radii**: no reliable sources found, so neither is used as evidence.
- **Teenage Engineering:** only third-party commentary; no official design documentation found.
- **No rendered mockups.** The contrast numbers cover flat fills. Each concept still needs screenshots over the real sample art, especially D's red against red sprites and E's mint against green tilesets.
