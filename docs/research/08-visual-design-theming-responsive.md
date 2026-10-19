# 08 — Visual design, theming & responsive strategy

Research notes for "PixelLab Gallery" (working name; unofficial). Scope: aesthetic direction, color/type/shape/motion/icon systems, a responsive layout matrix for every form factor, accessibility, three candidate theme directions with token sketches, a recommendation, and branding notes. Research date: 2026-10-18.

Conventions in this file:
- **Cited findings** carry an inline source link. Where a source is secondary (press, aggregator, community summary) it is labeled.
- **Inference / proposal** = my synthesis or design proposal; not a sourced fact.
- **Gap** = could not verify; do not treat as fact.
- Contrast ratios quoted for token pairs are **computed by me** with the identity that for neutral OKLCH colors `L = cbrt(Y)` (Y = relative luminance), so `Y = L^3`. This is exact for achromatic colors and approximate for low-chroma neutrals. Chromatic pairs (accent, danger) are approximate and must be verified in a contrast checker before shipping.

---

## Summary

- **The art is the hero; the chrome should be quiet, near-neutral, and get out of the way.** The strongest 2025–2026 signals all point this way: Linear's 2026 refresh dims navigation, softens/reduces separators and icons, and moves to warmer, less saturated grays ([Linear](https://linear.app/now/behind-the-latest-design-refresh)); Apple's Liquid Glass guidance tells designers to keep color in controls judicious so content can "shine through" ([Apple](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)); and the main critique of Liquid Glass is precisely that translucent chrome obscured content and hurt legibility ([NN/g](https://www.nngroup.com/articles/liquid-glass/)).
- **Take expressiveness only where it pays.** Google's Material 3 Expressive research (46 studies, 18,000+ participants) found key actions were spotted up to 4x faster when emphasized with size, color, shape and containment, but also that breaking familiar patterns hurt usability and a strong minority preferred calmer designs ([Google Design](https://design.google/library/expressive-material-design-google-research)). For a gallery: one emphasized primary action per context (Download, Select), everything else calm.
- **Backdrop matters more than chrome for pixel art.** Color-critical viewing practice uses a neutral (achromatic) surround, typically Munsell N7/N8, because surroundings bias perception; very dark surrounds make highlights look brighter and very light surrounds make shadows look deeper ([rpimaging](https://www.rpimaging.com/munsell-neutral-gray-paint.html), [greynotgrey](https://greynotgrey.com/blog/2012/05/07/colour-theory-monday-when-is-grey-not-grey/), [Adobe community](https://community.adobe.com/t5/photoshop-ecosystem-discussions/why-is-the-background-color-of-the-photoshop-application-designed-gray/m-p/10078168)). Proposal: zero-chroma stage plus a per-viewer backdrop switcher (theme / mid-gray / light-gray / black / white / checker).
- **The platform is ready.** OKLCH plus `light-dark()` (Baseline 2024) ([MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark)), `linear()` spring easings (Baseline 2023) ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear)), same-document View Transitions (Baseline Newly available since Firefox 144, Oct 2025) ([web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)), size container queries (Baseline since 2023) and style queries (Baseline May 2026, Firefox 151) ([web.dev](https://web.dev/blog/web-platform-05-2026)), and `svh/lvh/dvh` (all engines) ([web.dev](https://web.dev/blog/viewport-units)). Viewport Segments (foldables) is Chromium-only (Chrome/Edge 138) ([Chrome](https://developer.chrome.com/blog/viewport-segments-api-shipped)), so treat it as progressive enhancement.
- **Pixel-art-specific risks** are motion and scaling. A grid-to-viewer morph scales a raster snapshot, and whether `image-rendering: pixelated` applies to view-transition snapshots is **unverified** (see Motion). Fractional devicePixelRatio makes "integer" CSS scaling uneven ([MDN crisp pixel art](https://developer.mozilla.org/de/docs/Games/Techniques/Crisp_pixel_art_look)). Proposal: integer-scale thumbnails, use a frame morph plus art fade instead of morphing the art, and spike-test the naive morph.
- **Recommendation:** use **Direction A "Quiet Studio"** (neutral, dark-tuned, Linear/Apple restraint) as the single shipped theme, with light and dark modes, and borrow two touches from C: a pixel display face for the wordmark and counts only, and crisp 1px borders. Do not ship three themes (YAGNI). Details are in the Recommendation section.

---

## Aesthetic landscape 2025–2026

### Takeaway
"Modern" in late 2026 means calm, content-first chrome with tonal hierarchy, fewer and softer separators, restrained translucency that keeps solid fallbacks, and expressiveness limited to key actions and moments. Glass everywhere is now associated with a well-publicized legibility backlash.

### Cited findings
**Apple Liquid Glass (iOS 26 / macOS 26)**
- Apple frames Liquid Glass as a distinct functional layer for navigation and controls (tab bars, toolbars) floating above the content layer ([Apple Meet with Apple session](https://developer.apple.com/videos/play/meet-with-apple/208)). Its design principles: put the most important content in focus, and "be judicious" with color in controls and navigation so they stay legible and let content shine through ([Apple Liquid Glass overview](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)).
- NN/g (Raluca Budiu, 10 Oct 2025), "Liquid Glass Is Cracked, and Usability Suffers in iOS 26", documents several problems ([NN/g](https://www.nngroup.com/articles/liquid-glass/)):
  - translucent controls over busy backgrounds hurt legibility, e.g. Mail search text overlapping previews;
  - floating controls compete with page content;
  - distracting motion (wiggling tabs, pulsing buttons);
  - cramped tab bars and unpredictable layouts (controls appearing and disappearing);
  - a pale floating search bar that is easy to miss.
- After the backlash, iOS 26.1 added a Clear/Tinted Liquid Glass choice (Settings > Display & Brightness). Tinted is more frosted, with more opacity and contrast. Reviews of its effect are mixed, and Reduce Transparency remains the stronger option ([Gulf News, secondary](https://gulfnews.com/technology/companies/apple-yields-tinted-control-in-ios-261-beta-4-tones-down-liquid-glass-after-backlash-1.500315176); [Fast Company SA, secondary](https://fastcompany.co.za/tech/2025-11-10-how-to-adjust-apples-liquid-glass-in-ios-26/)).
- Some developers argued Liquid Glass has fundamental legibility issues because it can't control what passes behind it ([9to5Mac](https://9to5mac.com/2025/09/15/ios-26-officially-launches-today-but-some-developers-arent-sure-it-should/)). One commentator called text overlaying other text the biggest legibility issue ([Pixel Envy](https://pxlnv.com/blog/on-liquid-glass/)).

**Material 3 Expressive (May 2025)**
- Google calls it an extension of Material You, not "Material 4". It ships a 35-shape library with shape morphing and spring-based motion ([Android Authority](https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/); [Dezeen](https://www.dezeen.com/2025/05/28/google-ushers-in-age-of-expressive-interfaces-with-material-design-update/amp/)).
- Google's research summary covers 46 studies and 18,000+ participants ([Google Design](https://design.google/library/expressive-material-design-google-research)):
  - Levers are color, shape, size, motion and containment.
  - Key elements were spotted up to 4x faster.
  - Users 45+ found key elements about as fast as younger users.
  - Caveats: context matters (a banking app is not a media app); breaking familiar patterns lowered usability (a scattered-album-art playlist; removing text labels); a strong minority preferred calmer designs; "No amount of expressive design will beat basic functionality."
- M3 Expressive deprecates the navigation drawer in favor of an expanded navigation rail (collapsed and expanded states that transition into each other) for medium and larger windows ([9to5Google](https://9to5google.com/2025/05/14/material-3-expressive-navigation/)).

**Fluent 2**
- Fluent 2 uses two shadow ramps: low (2/4/8/16) and high (28/64), where the number is the blur in px. Sharp shadows read as close and soft shadows as far. Dark theme uses higher shadow opacity (e.g. 14% light vs 28% dark at the lowest step). On Windows, strokes replace key shadows to outline objects ([Fluent 2 elevation](https://fluent2.microsoft.design/elevation)).

**"Quiet UI" (Linear as exemplar)**
- Linear's 2026 refresh ([Linear](https://linear.app/now/behind-the-latest-design-refresh)):
  - moves default themes from cool, blue-leaning grays to warmer, less saturated grays, noting that too warm looks muddy;
  - dims the sidebar so the work area leads, and mutes inactive text;
  - compacts tabs;
  - reduces and shrinks icons and removes colored icon backgrounds;
  - uses fewer, softer separators ("Structure should be felt not seen");
  - built a hue/chroma/lightness token tool.
- Linear's earlier 2024 redesign moved its color system from HSL to LCH for perceptual consistency ([Linear 2024 redesign](https://linear.app/blog/how-we-redesigned-the-linear-ui); LCH detail from a secondary summary).

**Light vs dark**
- NN/g (2020): for users with normal vision, light mode (dark-on-light) generally performs better for reading, especially with small text. Don't default to dark for the general population, but offer dark mode; some low-vision users (e.g. cataracts) do better in dark mode ([NN/g](https://www.nngroup.com/articles/dark-mode/)).
- Photo tools treat the backdrop as a user setting: Lightroom Classic lets you change the color behind the image ([havecamerawilltravel](https://havecamerawilltravel.com/lightroom/lightroom-classic-change-color-behind-image/)), and Photoshop's gray workspace is explained as minimizing perceptual bias ([Adobe community](https://community.adobe.com/t5/photoshop-ecosystem-discussions/why-is-the-background-color-of-the-photoshop-application-designed-gray/m-p/10078168)).

### Inferences
- **Dark-first vs light-first for this product:** NN/g's light-mode advantage is about *reading*. A gallery is mostly *viewing* small, saturated, hard-edged sprites, where a dark or mid neutral surround makes colors read as brighter and more saturated (flattering), and avoids the glare of a large white field around a tiny 32×32 sprite. Proposal:
  - Design and tune dark first.
  - Follow the OS preference by default (`color-scheme: light dark`), with a Light/Dark/System override.
  - Make the viewer stage backdrop independent of the UI theme, so a light-mode user can still view art on mid-gray.
- **What reads as modern in late 2026:**
  - tonal surfaces instead of heavy borders;
  - near-neutral or slightly warm grays (Linear's direction);
  - OKLCH tokens;
  - one restrained accent;
  - large, art-first grids with minimal per-card text;
  - floating bottom toolbars on touch;
  - springs with little overshoot;
  - translucency used sparingly and always with a solid fallback.
- **What reads as dated:**
  - glassmorphism on every surface (now tied to the Liquid Glass backlash);
  - neumorphism;
  - gradient-mesh backgrounds behind content;
  - pure `#000` with pure `#fff` text (harsh);
  - thick drop shadows on every card;
  - colored icon tiles everywhere (Linear removed these);
  - CRT scanlines and arcade-font UI (pixel kitsch).
- **Liquid Glass lesson for a web gallery:** never put translucent chrome *over the art that is being judged*. Translucency is acceptable only over the scrolling grid (e.g. a top bar that blurs thumbnails passing under it), never over the viewer stage.

### Gaps
- No primary sources were gathered for the aesthetics of Arc, Things, Darkroom, Halide, Lightroom (beyond the backdrop setting), Are.na or Cosmos. Unverified designer's read: Darkroom and Halide use dark, near-black, photo-first chrome with minimal labels; Are.na and Cosmos use white, typographic, grid-first minimalism with almost no color; Things uses soft light surfaces with one accent. Verify with screenshots before citing.
- Apple's HIG "Materials" page rendered without content via fetch, so exact HIG wording on regular vs clear glass and dimming layers is unverified.
- Vercel's own design-system (Geist) color tokens were not researched.

---

## Color & backdrops

### Takeaway
Use OKLCH tokens. Keep a near-zero-chroma neutral ramp for chrome and an exactly zero-chroma stage for art, pick one restrained accent, wire light/dark with `light-dark()` plus `color-scheme`, verify against WCAG 2.2 AA (APCA advisory only), and give the viewer a backdrop switcher with mid-gray (≈N5), light-gray (≈N8), checker, black and white.

### Cited findings
- **`light-dark()`** is Baseline 2024 (Chrome/Edge 123, Firefox 120, Safari 17.5). It only takes effect when `color-scheme` is `light dark`, and unsupported browsers revert to initial values, so a plain fallback declaration first is advised ([MDN](https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark); [Adobe reference](https://shadow-dom-css.adobe.com/features/light-dark); [DEV](https://dev.to/parsajiravand/youre-writing-dark-mode-colors-twice-light-dark-fixes-that-44hb)).
- **Relative color syntax** (`oklch(from var(--x) …)`) reached cross-browser support in 2024. web.dev lists Chrome 119, Firefox 128 and Safari 18, while a later source lists Chrome 131+, Firefox 133+ and Safari 18+ for full support (versions conflict, likely by feature subset). Lea Verou suggests `@supports` guarding ([web.dev](https://web.dev/blog/web-platform-07-2024); [Lea Verou](https://lea.verou.me/blog/tags/color-science/)).
- **Tailwind v4 default palette is OKLCH.** Neutral is exactly achromatic (`oklch(14.5% 0 none)` … `oklch(98.5% 0 none)`). Zinc carries a tiny cool hue (chroma 0.001–0.017, hue ≈286), and stone a tiny warm hue ([Tailwind theme.css](https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css)). Selected values:
  - `neutral`: 950 `14.5%`, 900 `20.5%`, 800 `26.9%`, 700 `37.1%`, 500 `55.6%`, 300 `87%`, 100 `97%`, all chroma 0.
  - `zinc`: 950 `oklch(14.1% 0.005 285.823)`, 900 `oklch(21% 0.006 285.885)`, 800 `oklch(27.4% 0.006 286.033)`, 500 `oklch(55.2% 0.016 285.938)`.
  - Default radii are `xs .125rem`, `sm .25rem`, `md .375rem`, `lg .5rem`, `xl .75rem`, `2xl 1rem`, `3xl 1.5rem`, `4xl 2rem`. `--spacing` is `0.25rem`.
- **Radix Colors' 12-step scale semantics**: 1–2 app/subtle backgrounds; 3–5 component bg/hover/pressed; 6–8 borders (8 = strong borders and focus rings); 9–10 solid fills and their hover; 11–12 low- and high-contrast text. Steps 11 and 12 are guaranteed to reach APCA Lc 60 and Lc 90 on step 2 ([Radix](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)).
- **Open Props** ships `--ease-spring-1..5` and `--ease-bounce-1..5`, six adaptive shadows (`--shadow-1..6`, light/dark aware), radius props including `--radius-1..6`, and a Dynamic Palette built from 16 OKLCH variables. Its core gray and stone scales use steps 0–12 ([Open Props](https://open-props.style/)).
- **Contrast standards:** WCAG 2.2 remains the operative standard. WCAG 3 is still a Working Draft (latest 3 March 2026), and W3C says final requirements will differ from the draft ([W3C WAI news](https://www.w3.org/WAI/news/2026-03-03/wcag3)). An AGWG co-chair update (Sept 2024) said APCA was not in the then-current draft ([yatil.net](https://www.yatil.net/blog/wcag-3-is-not-ready-yet)). APCA's status in the March 2026 draft is unverified.
- **Neutral surrounds for judging imagery**:
  - Printers and photographers use Munsell N8 (and N7 in other industries) as the standard neutral surround ([rpimaging](https://www.rpimaging.com/munsell-neutral-gray-paint.html)).
  - Mid gray is described as having minimal effect on perception ([Adobe community](https://community.adobe.com/t5/photoshop-ecosystem-discussions/why-is-the-background-color-of-the-photoshop-application-designed-gray/m-p/10078168)).
  - Very light surrounds make shadows look deeper and very dark surrounds make highlights look brighter ([greynotgrey](https://greynotgrey.com/blog/2012/05/07/colour-theory-monday-when-is-grey-not-grey/)).
  - A true neutral gray matters, because tinted grays shift perceived color warm or cool ([rpimaging](https://www.rpimaging.com/munsell-neutral-gray-paint.html)).
  - A lightness-perception study found background-induced effects strongest around middle gray, decreasing toward the white and black points ([SPIE](https://ebooks.spiedigitallibrary.org/conference-proceedings-of-spie/4421/0000/Background-and-the-perception-of-lightness/10.1117/12.464574.full)). This is a secondary summary; the exact experimental condition is not confirmed.
- **Forced colors:** non-URL `background-image` (e.g. gradients) is forced to `none`, `box-shadow` is forced to `none`, and `forced-color-adjust: none` opts an element out ([MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)). This affects a CSS-gradient checkerboard and shadow-based focus rings.

### Inferences / proposal
**Neutral ramp rules**
- Chrome neutrals: chroma ≤ 0.006 (a Tailwind-zinc-like whisper of hue is fine).
- **Stage (art backdrop) chroma = exactly 0**, so the chrome tint never biases the art.
- Hierarchy comes from lightness steps, not from borders.

**Accent rules**
- **One** accent, used only for selection, focus, primary action, and active nav.
- Never use the accent as a large fill behind art.
- Pick a hue unlikely to dominate sprite palettes, and verify it is not PixelLab's brand color (see Open questions).
- Selection must never be color-only: always pair it with a checkmark badge and ring.

**Wiring**
- `:root { color-scheme: light dark; }` follows the OS. `:root[data-theme="dark"] { color-scheme: dark; }` and the light equivalent implement the override. All tokens are `light-dark(<light>, <dark>)`.
- For pre-2024 browsers, put a plain declaration before each `light-dark()` declaration.

**Backdrop options (shared across themes, chroma 0)**

Approximate Munsell-to-OKLCH mapping: Munsell value ≈ L*/10, and for neutrals `L_ok ≈ (L*+16)/116`. This is my computation; verify visually.

| Token | Value | Use |
|---|---|---|
| `--stage-theme` | `var(--surface-1)` | default in grid cards |
| `--stage-mid` | `oklch(0.57 0 0)` (≈ N5) | "honest" neutral for judging color; default viewer option in dark UI |
| `--stage-light` | `oklch(0.83 0 0)` (≈ N8) | print-viewing standard; good for dark-outlined sprites |
| `--stage-dark` | `oklch(0.22 0 0)` | flattering, makes highlights pop |
| `--stage-black` | `oklch(0 0 0)` | OLED / VFX glow preview |
| `--stage-white` | `oklch(1 0 0)` | shows how art looks on white pages/UI |
| checker (light) | `oklch(0.86 0 0)` / `oklch(0.78 0 0)` | transparency inspection |
| checker (dark) | `oklch(0.30 0 0)` / `oklch(0.25 0 0)` | transparency inspection, low contrast so it doesn't compete |

Checker: `repeating-conic-gradient(var(--chk-a) 0 25%, var(--chk-b) 0 50%) 0 0 / 16px 16px`. In the viewer, tie the cell size to an integer multiple of the art's displayed pixel size so the squares align with art pixels. Put `forced-color-adjust: none` on the stage (it contains no text) so the backdrop and art context survive forced colors.

**Why not a checkerboard by default:** a high-contrast checker competes with small sprites and adds noise. Make it an *inspection* mode, not the default.

**Contrast policy:** meet WCAG 2.2 AA (4.5:1 body text, 3:1 large text and non-text UI). Use APCA only as an advisory sanity check (Radix-style Lc 60 / Lc 90 targets for secondary and primary text).

### Gaps
- Exact current Tailwind palette family count conflicts between sources (not needed).
- APCA's presence in the March 2026 WCAG 3 draft is unverified.
- PixelLab's actual brand colors could not be read (the site fetch returned no style data). Needs a screenshot audit.

---

## Typography

### Takeaway
Use one quiet, OFL-licensed UI family (Geist or Inter, with system-ui fallback) plus a monospace for metadata, and tabular numerals for sizes, dates and frame counts. Pixel display fonts are tasteful only as **accents at their native grid sizes**: wordmark, counts, badges, keyboard hints. Never for body text or long prompts. Fluid type must stay zoom-safe.

### Cited findings (licenses and facts)
| Font | License | Notes |
|---|---|---|
| Geist Sans / Geist Mono (Vercel) | SIL OFL 1.1, no Reserved Font Name | [vercel/geist-font](https://github.com/vercel/geist-font); [CTAN listing](https://ctan.org/tex-archive/fonts/geist-font) |
| **Geist Pixel** | SIL OFL 1.1 | Pixel display face "designed to complement the Geist font family", 5 stylistic variants (reported as Square, Grid, Circle, Triangle, Line). Announced around early Feb 2026; ships in the `geist` npm package ([vercel/geist-pixel-font](https://github.com/vercel/geist-pixel-font); [Vercel community news, secondary](https://community.vercel.com/t/news-cache-2026-02-09/33058)) |
| Inter 4.x | SIL OFL 1.1 | v4 folded Inter Display into a variable `opsz` axis; roman and italic ship as separate variable files; v4.1 exists ([rsms/inter releases](https://github.com/rsms/inter/releases); [rsms.me/inter](https://rsms.me/inter/)) |
| IBM Plex Sans | OFL | Variable `wdth` 75–100, `wght` 100–700 ([google/fonts METADATA](https://github.com/google/fonts/blob/main/ofl/ibmplexsans/METADATA.pb)) |
| Instrument Serif | OFL | Regular plus Italic, 400 only; added to Google Fonts 2023 ([google/fonts METADATA](https://github.com/google/fonts/blob/main/ofl/instrumentserif/METADATA.pb)) |
| Departure Mono (Helena Zhang) | SIL OFL | Monospaced pixel font, crisp at increments of 11px ([uiuxshowcase](https://uiuxshowcase.com/resources/departure-mono-pixel-style/); [nixpkgs packaging](https://code.ornl.gov/mdf/nixpkgs/-/commit/0e42338abc86d5630142acf87d0455088a9a6138); release noted Sept 2024 by [Daring Fireball](https://daringfireball.net/linked/2024/09/03/departure-mono)) |
| Pixelify Sans | OFL | Variable `wght` 400–700, display; added 2023 ([google/fonts METADATA](https://github.com/google/fonts/blob/main/ofl/pixelifysans/METADATA.pb)) |
| Silkscreen (Jason Kottke) | OFL | 400/700, display ([google/fonts METADATA](https://github.com/google/fonts/blob/main/ofl/silkscreen/METADATA.pb)) |
| Press Start 2P | SIL OFL 1.1 | Based on 1980s Namco arcade lettering; best at multiples of 8px ([Google Fonts](https://fonts.google.com/specimen/Press+Start+2P/about); [online-fonts, secondary](https://online-fonts.com/fonts/press-start-2p)) |
| monogram (datagoblin) | CC0 | Monospace bitmap font made for games, 104 characters; credit optional ([itch.io](https://itch.io/t/214662/monogram-a-free-monospace-pixel-font)) |
| Satoshi (Indian Type Foundry / Fontshare) | ITF / Fontshare free EULA (not OFL) | One reading of the EULA prohibits distribution by uploading to a public server, so self-hosting on a public site is a gray area ([Adom wiki](https://wiki.adom.inc/adom/adom-theme/files/fonts/LICENSES.md); [fontalternatives](https://fontalternatives.com/alternatives/satoshi/)). **Avoid** for an open-source, self-hosted app |

**Fluid type and zoom**
- A `clamp()` with a `vw` term can fail WCAG 1.4.4 (Resize Text, AA) if text cannot reach 200% when zoomed. `vw` doesn't respond to zoom, and `rem` alone doesn't make fluid type safe ([Adrian Roselli](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html); [Smashing 2022](https://smashingmagazine.com/2022/12/fluid-typography-predict-problem-users-zoom-in/)).
- Smashing (Barvian, 2023) covers mitigations ([Smashing 2023](https://smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type)). Its specific rule was not retrieved; see Gaps.

### Inferences / proposal
**Where pixel fonts belong**
- Wordmark/logo.
- Large numerals (asset counts in folder headers, "8 dir", frame counts).
- Tiny badges (type and size chips on cards).
- Keyboard-shortcut hints.
- Empty-state headlines.

**Where they don't belong**
- Body text, buttons, form fields.
- Prompts and metadata paragraphs.
- Anything translated: pixel fonts have narrow glyph coverage. monogram has 104 characters, so assume no CJK, Cyrillic or diacritic depth unless verified.

**Rendering pixel fonts**
- Set them in px at native multiples (Departure Mono 11/22/33px; Press Start 2P 8/16/24px), not fluid.
- Exempt them from `clamp()`.
- They only render perfectly crisp at integer device-pixel multiples (see the DPR note under Responsive).

**Gimmick check**
- Press Start 2P and Silkscreen carry strong "arcade" connotations, so use them at most in a logo.
- Departure Mono, Geist Pixel and monogram read more contemporary and "design-tool".
- Rule of thumb: if more than ~3% of on-screen text is pixel type, it's kitsch.

**Monospace for metadata:** use it for prompts (wrapping), seeds, model ids, dimensions like `64×64` (with a real × sign), frame counts and file names. Apply `font-variant-numeric: tabular-nums` to all numeric UI (sizes, dates, counts, durations) so columns don't jitter.

**Shared fluid type scale (proposal).** Max/min ratio is ≤1.5 at every step, keeping zoom-to-200% safe by a wide margin. Only display steps are meaningfully fluid; UI text is nearly fixed (as in Linear and Apple apps).
```css
--step--1: clamp(0.75rem, 0.73rem + 0.10vw, 0.8125rem);  /* 12–13px meta, badges */
--step-0:  clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem); /* 14–15px UI body */
--step-1:  clamp(1rem, 0.96rem + 0.20vw, 1.125rem);      /* 16–18px section titles, inputs on touch */
--step-2:  clamp(1.25rem, 1.17rem + 0.40vw, 1.5rem);     /* 20–24px view titles */
--step-3:  clamp(1.5rem, 1.33rem + 0.80vw, 2rem);        /* 24–32px viewer asset name */
--step-4:  clamp(1.875rem, 1.55rem + 1.50vw, 2.75rem);   /* 30–44px editorial display (Theme B only) */
```
Use 16px or larger for text inputs on touch. Inference: iOS Safari zooms on focus for smaller inputs; widely known, not sourced here.

### Gaps
- Barvian's exact zoom-safe max/min ratio rule (reported elsewhere as ≈2.5×) was not retrieved. The proposed scale stays under 1.6× regardless.
- Glyph coverage of Departure Mono, Geist Pixel, Pixelify Sans and Silkscreen was not verified, which matters for localization.
- The official departuremono.com LICENSE text was not retrieved (multiple packagers state OFL).
- The IBM Plex Mono license is assumed OFL like Plex Sans. Verify its METADATA before use.

---

## Surfaces/shape/elevation

### Takeaway
Build tonal surfaces (lightness steps) with hairline borders in dark mode, and very soft shadows only for floating layers. Use blur only on bars over the scrolling grid, always with an opaque fallback. Radii should be moderate and must never clip art. Focus uses `outline` (survives forced colors). Offer two densities.

### Cited findings
- Fluent 2: shadow blur communicates distance, and dark themes need stronger shadow opacity. On Windows, strokes replace key shadows ([Fluent 2](https://fluent2.microsoft.design/elevation)).
- Linear 2026: fewer, softer, rounded separators ([Linear](https://linear.app/now/behind-the-latest-design-refresh)).
- `backdrop-filter` blur is GPU-composited but can hurt mobile performance, especially with multiple blurred layers in scrollable content. Advice is to reduce radius/area and limit the count on touch devices ([OpenReplay](https://blog.openreplay.com/creating-blurred-backgrounds-css-backdrop-filter/); [inspire_blur docs](https://pub.dev/packages/inspire_blur)). No rigorous mobile CSS benchmarks were found.
- `prefers-reduced-transparency`: Chrome/Edge 118+. Safari is **not supported** (caniuse through Safari 26.5 TP). Firefox is behind a flag (sources conflict) ([Chrome](https://developer.chrome.com/blog/css-prefers-reduced-transparency); [caniuse](https://caniuse.com/wf-prefers-reduced-transparency); [Bugzilla](https://bugzil.la/1736914)). Implication: Apple users' Reduce Transparency setting won't reach the web page, so the default translucency must already be legible.
- Forced colors removes `box-shadow` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)), so shadow-only focus rings disappear.
- WCAG 2.2 adds 2.4.13 Focus Appearance (AAA: ≥2px perimeter, ≥3:1 change) and 2.4.11 Focus Not Obscured (AA: focused element not fully hidden by author content) ([W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).

### Inferences / proposal
**Elevation model**
- **Level 0 – canvas** (`--bg`).
- **Level 1 – cards/wells** (`--surface-1`): no shadow; in dark mode, a 1px inner border at ~6–8% white alpha.
- **Level 2 – panels** (inspector, sidebar, `--surface-2`): separated by a hairline, no shadow.
- **Level 3 – floating** (menus, popovers, sheets, toasts, `--surface-3`): soft ambient shadow plus hairline. Use `--shadow-float: 0 8px 24px oklch(0 0 0 / 0.18), 0 1px 2px oklch(0 0 0 / 0.12)` in light, with roughly double opacity in dark (Fluent's light/dark opacity logic).

**Translucency policy**
- Only the top bar and bottom tab/action bar may be translucent: `background: color-mix(in oklch, var(--bg) 82%, transparent); backdrop-filter: blur(16px) saturate(1.2);`.
- Ship an opaque `--bg` fallback via `@supports not (backdrop-filter: blur(1px))`.
- Go opaque under `prefers-reduced-transparency: reduce` and `prefers-contrast: more`.
- One blurred layer per screen on touch. Never blur over the viewer stage.

**Radii (not clipping art)**
- Card radius 8–12px. Art sits inset (≥6px padding) inside the stage, so rounded corners never cut sprite pixels.
- In the viewer, the stage is square-cornered or radius ≤ 4px. Fullscreen viewer: 0.
- Pill radius only for chips and segmented controls.

**Focus ring**
- `outline: 2px solid var(--focus); outline-offset: 2px;`. Optionally add `box-shadow: 0 0 0 4px var(--bg)` as a halo for separation over busy art (it vanishes in forced colors, where the outline remains).
- Ensure sticky bars never fully cover a focused card: set `scroll-padding-top/bottom` equal to the bar heights (2.4.11).

**Hover (fine pointers only)**
- Card surface lightens one step and the meta overlay fades in. No scale-up of the card: scaling raster thumbnails blurs pixel art.
- Use `@media (hover: hover) and (pointer: fine)`.

**Density modes** (switch via one attribute, e.g. `[data-density="compact"]`)
- *Comfortable* (default on touch): grid gap 12–16px, name below thumbnail, 44px targets.
- *Compact* (opt-in, default on large fine-pointer screens): gap 4–6px, no visible meta (shown on hover/focus or in the inspector), 28–32px toolbar targets (still ≥24px for 2.5.8).

---

## Motion

### Takeaway
Use same-document View Transitions (now in all engines) for grid↔viewer continuity, but **don't morph the raster art itself** until a spike proves it stays crisp. Use short durations, low-overshoot springs via `linear()`, a reduced-motion path that crossfades or cuts, and no autoplaying sprite loops without a pause control.

### Cited findings
- **Support:** same-document View Transitions are Baseline Newly available as of Firefox 144 (14 Oct 2025). Firefox's support includes `document.startViewTransition()`, `view-transition-name`, `view-transition-class`, `match-element` and `:active-view-transition`. Chrome has had it since 111 ([web.dev](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available); [Chrome 2025 update](https://developer.chrome.com/blog/view-transitions-in-2025)).
- **Snapshots are images:**
  - The old state is a static capture and the new state a live capture, rendered via a pseudo-element tree that CSS can style ([W3C spec](https://www.w3.org/TR/css-view-transitions-1/)).
  - Firefox renders the new capture "as if it was an image" ([Bugzilla 1924130](https://bugzilla.mozilla.org/show_bug.cgi?id=1924130)) and may lower snapshot resolution for large or offscreen elements ([Bugzilla 1964101](https://bugzilla.mozilla.org/show_bug.cgi?id=1964101)).
  - A June 2026 WebKit bug reports transformed elements captured at layout size and then GPU-upscaled, causing blur ([WebKit 317712](https://bugs.webkit.org/show_bug.cgi?id=317712)).
- **`linear()`** is Baseline 2023 (Chrome/Edge 113, Firefox 112, Safari 17.2). It approximates springs and bounces by sampling the curve; CSS has no native spring keyword ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear); [Chrome](https://developer.chrome.com/docs/css-ui/css-linear-easing-function)). Open Props provides ready-made `--ease-spring-1..5` ([Open Props](https://open-props.style/)).
- **M3 Expressive** separates expressive motion (overshoot/bounce for hero moments) from standard motion (restrained) ([community M3E guide, secondary](https://skills.sh/fumiya-kume/toy-poodle-love/m3-expressive)). Google's research cautions against motion that doesn't serve function ([Google Design](https://design.google/library/expressive-material-design-google-research)). NN/g lists distracting motion as a Liquid Glass usability failure ([NN/g](https://www.nngroup.com/articles/liquid-glass/)).
- **`image-rendering`:** `pixelated` uses nearest-neighbor to the nearest integer multiple, then smooths the remainder. `crisp-edges` uses pure nearest-neighbor. There is no effect on unscaled images. Baseline widely available ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)).

### Inferences / proposal
**Motion tokens (proposal)**
```css
--dur-1: 120ms;  /* press, hover, toggle */
--dur-2: 200ms;  /* chips, menus, popovers */
--dur-3: 280ms;  /* viewer open/close, sheets */
--dur-4: 380ms;  /* large layout change (sidebar collapse) */
--ease-out: cubic-bezier(0.2, 0, 0, 1);
--ease-spring: var(--ease-spring-2); /* from Open Props, or generate a low-overshoot linear() curve */
```

**Pixel-safe grid→viewer transition (proposal)**
1. Give `view-transition-name: hero` to the **card's stage box** (the backdrop frame), not to the `<img>`. Hide the thumbnail art (`visibility: hidden`) right before capture.
2. The frame morphs from the card rect to the viewer stage rect (a rectangle of flat color, so it can't blur).
3. The viewer art (already at its final integer scale with `image-rendering: pixelated`) fades in over `--dur-2` after the frame lands.
4. On close, reverse the steps and return focus to the originating card.

**Spike test the naive morph**, since it may look acceptable and it is prettier. Put `view-transition-name` on the img and add `::view-transition-old(hero), ::view-transition-new(hero) { image-rendering: pixelated; }`. Inspect in Chrome, Safari and Firefox at DPR 1, 1.25 and 2. Whether that property is honored on snapshot pseudo-elements is **unverified**.

**Never animate `transform: scale()` on pixel art** for hover or press. Animate the frame, shadow, opacity or translate (translate by integer px) instead.

**Reduced motion**
- Under `@media (prefers-reduced-motion: reduce)`: skip the view transition (call the DOM update directly) or use a ≤120ms crossfade.
- Disable list reordering animations and smooth scroll.
- **Do not autoplay sprite animations in the grid.**

**Sprite animation playback**
- Grid: play on hover/focus (fine pointers) or on explicit tap of a play badge (touch).
- Global "Animate previews" toggle, default off under reduced motion.
- Viewer: play by default with visible pause, frame-step, speed, and loop controls. Autoplaying loops longer than 5s beside other content need a pause mechanism under WCAG 2.2.2 (see Accessibility).

---

## Iconography

### Takeaway
Use a quiet, consistent outline set (Phosphor or Lucide) for controls. Pixel icons (pixelarticons) only as accents, rendered at exact 24px multiples.

### Cited findings
- **Lucide:** ISC license (MIT-equivalent), outline-only, ~1,665–1,780 icons. **Phosphor:** MIT, six weights per icon (thin, light, regular, bold, fill, duotone), ~1,200–1,512 base icons. Counts vary by source ([allsvgicons comparison](https://allsvgicons.com/compare/phosphor-vs-lucide/); [Composables](https://composables.com/icons/icon-libraries/phosphor)).
- **pixelarticons:** MIT, 24×24 grid, `currentColor`. The README recommends 24/48/72/96px because other sizes blur ([npm](https://npmjs.com/package/pixelarticons); [Iconify](https://icon-sets.iconify.design/pixelarticons/)). A newer launch describes 4,159 icons across four styles, with **816 free under MIT** and the rest paid. This conflicts with npm's 486 count, so check the license before relying on the larger set ([Product Hunt](https://www.producthunt.com/products/pixelarticons)).
- Linear's 2026 refresh reduced icon count and size and removed colored icon backgrounds ([Linear](https://linear.app/now/behind-the-latest-design-refresh)).

### Inferences / proposal
- **Phosphor is the better fit** for a gallery: regular→fill toggles give non-color state for favorite (heart/star), selected (check-circle) and pinned folders. Lucide has no filled variants.
- Use 20px icons on a 24px box (desktop) and 24px icons in 44px hit areas (touch), with 1.5px stroke, inheriting `currentColor`. Use icon-only buttons only with tooltips (fine pointer) and `aria-label`.
- **Asset-type glyphs** (character, object, tileset, map, UI, font, VFX) are the one place a pixel icon set can add personality: Theme C, or as a small badge in A. Render at exactly 24px and only if the free set covers all seven types (verify).
- Don't mix two outline sets.

---

## Responsive strategy + layout matrix (table)

### Takeaway
Go content-out. The grid adapts by itself (`auto-fill/minmax` driven by a user zoom level). Container queries adapt cards and panels. A few window breakpoints change only the *shell* (nav type, inspector placement), anchored to Android's widely used window size classes, plus a **height** query for landscape phones.

### Cited findings
- **Android window size classes** ([Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)):
  - Width: Compact <600dp (99.96% of phones portrait); Medium 600–839 (most tablets portrait, unfolded inner displays portrait); Expanded 840–1199 (most tablets landscape); Large 1200–1599; Extra-large ≥1600 (desktop).
  - Height: Compact <480dp (99.78% of phones landscape), where "two pane layouts are not practical".
  - Width alone suffices for most apps.
- **Size container queries** have been Baseline since 2023. **Container style queries** became Baseline Newly available in May 2026 (Firefox 151) ([web.dev May 2026](https://web.dev/blog/web-platform-05-2026); [Baseline digest](https://web.dev/blog/baseline-digest-may-2026)).
- **Viewport units:**
  - `lv*` = toolbars retracted (largest), `sv*` = toolbars expanded (smallest), `dv*` = dynamic between the two. Support: Chrome/Edge 108, Firefox 101, Safari 15.4.
  - `dv*` updates are throttled (not every frame), and the on-screen keyboard doesn't affect viewport units (Chrome has an opt-in).
  - Sources: [web.dev](https://web.dev/blog/viewport-units). Plain `vh` equals `lvh`, which is why `100vh` overflows on mobile ([OpenReplay](https://blog.openreplay.com/fix-100vh-mobile-viewport/)).
- **Safe areas:** `env(safe-area-inset-*)` is zero unless `viewport-fit=cover` is set. On phones with a home indicator, roughly the bottom 34pt is reserved ([21st.dev, secondary](https://21st.dev/blog/react-mobile-navigation-components)). WebKit has been reported to vary `safe-area-inset-bottom` with browser chrome state ([W3C CSSWG list, 2021](https://lists.w3.org/Archives/Public/public-css-archive/2021Jul/0027.html)).
- **Foldables:** the Viewport Segments API shipped in Chrome/Edge 138 (not Firefox or Safari). It provides `@media (horizontal-viewport-segments: 2)` / `(vertical-viewport-segments: 2)`, `env(viewport-segment-width 0 0)`-style variables, and `window.viewport.segments`. Unfolded devices report one segment ([Chrome](https://developer.chrome.com/blog/viewport-segments-api-shipped); [MDN API](https://developer.mozilla.org/en-US/docs/Web/API/Viewport_Segments_API); [MDN media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/horizontal-viewport-segments)).
- **Pixel crispness at fractional DPR:** when CSS pixels don't align with device pixels, some art pixels render larger than others ([MDN crisp pixel art, German](https://developer.mozilla.org/de/docs/Games/Techniques/Crisp_pixel_art_look)). `devicePixelContentBox` in ResizeObserver reports physical-pixel size in Chrome/Edge 84+ and Firefox 108+, but not Safari ([web.dev](https://web.dev/articles/device-pixel-content-box)).

### Inferences / proposal
**Grid mechanics**
```css
.grid {
  container: grid / inline-size;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--cell), 1fr));
  gap: var(--grid-gap);
}
/* user zoom levels (slider / pinch / ctrl+wheel): */
[data-zoom="1"] { --cell: 88px; }  [data-zoom="2"] { --cell: 128px; }
[data-zoom="3"] { --cell: 176px; } [data-zoom="4"] { --cell: 256px; }
.card { container: card / inline-size; aspect-ratio: 1; }
@container card (width < 140px) { .card__meta { display: none; } }
```
- **Integer art scaling inside each cell:** `k = floor(stageInner / max(natW, natH))`.
  - If `k ≥ 1`, set the img to `natW*k × natH*k` CSS px with `image-rendering: pixelated`.
  - If `k < 1` (large maps or tilesets in small cells), downscale with default smooth rendering. Nearest-neighbor downscale drops pixels.
  - Optional refinement for fractional DPR (Windows 125/150%, many Androids): choose k so that `natW*k*DPR` is an integer.
- **Ultrawide cap:** don't cap content width (more columns is the point of a big screen), but cap columns at ~16 by raising the min cell size: `@container grid (width > 2400px) { --cell: max(var(--cell), 200px); }`. Cap text measure in panels at ~65ch.
- **"4K" is usually not ultrawide in CSS px:** a 3840-px-wide 4K panel at 200% scaling is 1920 CSS px, i.e. the Desktop row. True ultrawide (3440×1440 at 100%) is ≈3440 CSS px.
- **Shell breakpoints** (window media queries, CSS px so browser zoom shifts them correctly): `600px` (rail), `840px` (persistent inspector possible), `1200px` (expanded sidebar), `1600px` (three-pane always). Plus `(max-height: 480px)` for collapsing chrome in landscape phones.
- **Input adaptations:**
  - `(hover: hover) and (pointer: fine)`: hover overlays, compact targets ≥24px, marquee selection.
  - `(pointer: coarse)`: 44px targets, persistent visible actions, long-press to enter select mode, swipe in viewer.
  - `(any-pointer: fine)`: hybrid devices (tablet with trackpad) get hover affordances without losing touch sizing.
- **Page shell:** `min-height: 100svh` for the shell. `100dvh` only for the fullscreen viewer and sheets. Use `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` with safe-area padding on every edge-anchored bar (`padding-bottom: max(8px, env(safe-area-inset-bottom))`), and left/right insets on the landscape rail.

### Layout matrix

| Form factor (CSS px) | Navigation | Grid columns / cell size | Viewer layout | Inspector placement | Selection / action bar | Filter UI placement |
|---|---|---|---|---|---|---|
| **Phone portrait** 320–430 w (Compact W) | Bottom tab bar (3–4 items: Library, Folders, Favorites, Search) + slim top bar that hides on scroll-down, reappears on scroll-up; account/settings via avatar in top bar | 2–4 cols; default zoom ≈120–128px cells (3 cols at 390px, 2–3 at 320px); comfortable density; gap 8px | Fullscreen modal (`<dialog>`, 100dvh); swipe ←/→ prev/next, swipe ↓ to close **plus** visible close and arrow buttons; tap toggles chrome; pinch to zoom in integer steps | Bottom sheet over viewer: peek (name, type, Download) → half → full; drag handle **and** expand button | Long-press or "Select" in top bar enters select mode; **contextual action bar replaces the tab bar** (Download, Favorite, Move, More); count in top bar | Horizontally scrolling chip row under the search/title (type chips); "Filters" chip opens a full-height sheet (type, folder, date, size, animated) |
| **Phone landscape** ≤480 h (Compact H) | Tab bar becomes compact left rail (icon-only, ≈56px, safe-area-inset-left); no top bar (title in rail) | 4–7 cols, same cell size as portrait | Fullscreen; all chrome auto-hides after 2s idle; art scaled to fit height at integer k | Right side sheet (overlay, ≈320px) toggled by an info button; never a bottom sheet (no height) | Floating compact bar at top-right (or in rail) | Filter button in rail opens right side sheet |
| **Small tablet / foldable unfolded portrait** 600–839 w | Collapsed navigation rail (left); search field in content top bar | 4–6 cols, 128–176px | Fullscreen modal, or in-place over grid with ← back | Overlay side sheet (right, 320px) | Floating bottom toolbar, centered, above safe area | Chips in top bar; "More filters" popover/sheet |
| **Tablet landscape** 840–1199 w | Rail (collapsed; expands on demand as overlay) | 5–8 cols, 128–200px | List-detail: viewer replaces grid in the main pane with a filmstrip at bottom; Esc/back returns to grid at same scroll | **Persistent right pane** (300–340px) when viewer open; collapsible | Floating bottom toolbar (touch) or top contextual bar (with trackpad, `any-pointer: fine`) | Toolbar row (chips + sort + zoom slider); filter popover |
| **Laptop** 1200–1599 w | Expanded sidebar (≈240px: Library, Favorites, folder tree, storage/usage footer); collapsible to rail | 6–10 cols; compact density optional | In main pane with filmstrip; optional "lightbox" fullscreen (F) | Persistent right inspector (320–360px), shows selected item even without opening viewer | **Top contextual bar replaces the header** while items are selected (desktop file-manager convention); Shift/Ctrl-click, Ctrl+A, marquee + keyboard alternatives | Header: search (`/` or Ctrl/Cmd+K), type chips, sort, zoom slider; advanced filters in popover |
| **Desktop** 1600–2559 w (incl. most 4K at 150–200%) | Expanded sidebar | 8–14 cols; default zoom one step larger | Main pane; optional side-by-side "compare 2" deferred (YAGNI until requested) | Always-on three-pane (sidebar · grid/viewer · inspector) | Top contextual bar | Header as laptop; may pin a filter section in sidebar |
| **Ultrawide / 4K at 100–125%** ≥2560 w | Expanded sidebar | Up to ~16 cols (min cell raised to ≥200px via container query); no max content width | Main pane; art scaled to largest integer k that fits; stage backdrop fills pane | Persistent inspector; prompt text capped ~65ch | Top contextual bar | Header; filters can live as a persistent left column under nav |
| **Foldable** | Folded cover screen → phone rows. Unfolded (≈square, 600–840 w) → small-tablet row. **Dual segment** (`horizontal-viewport-segments: 2`) → grid in segment 0, viewer+inspector in segment 1, nothing spans the hinge. **Tabletop** (`vertical-viewport-segments: 2`) → viewer in top segment, controls/filmstrip/inspector in bottom segment | Per segment width (reuse auto-fill) | See navigation column | Segment 1 (dual) / bottom segment (tabletop) | Bottom of the segment holding the grid | Same as width class of segment 0 |

Foldable segment rules are Chromium-only progressive enhancement. Without the API, the device falls back to its width class.

---

## Navigation per form factor

### Cited findings
- M3 Expressive: expanded and collapsed navigation rail for medium-and-up windows; navigation drawer deprecated. Phone (compact) guidance for drawer replacement is unclear in coverage ([9to5Google](https://9to5google.com/2025/05/14/material-3-expressive-navigation/)).
- Android: most apps adapt on width alone; landscape phones (compact height) make two panes impractical ([Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)).
- NN/g criticized Liquid Glass for splitting the tab bar with a floating search button and cramming targets, and for controls that appear and disappear unpredictably ([NN/g](https://www.nngroup.com/articles/liquid-glass/)).
- Apple recommends a universal navigation and search experience across platforms and predictable action placement ([Apple](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)).

### Inferences / proposal
| | Phone (compact) | Tablet (medium/expanded) | Desktop (large/XL) |
|---|---|---|---|
| **Primary nav** | Bottom tab bar, ≤4 items, labels always visible, in the thumb zone | Rail (collapsed); expands to overlay | Expanded sidebar with folder tree |
| **Search** | Tab or top-bar icon that expands into a full-width field; recent searches | Field in content top bar | Header field plus `/` and Ctrl/Cmd+K |
| **Filters** | Chip row plus full-height filter sheet | Chips in toolbar plus popover | Chips in header plus popover; optional sidebar section |
| **Select** | Long-press **or** "Select" button (2.5.7: no drag-only multi-select); tap to toggle in select mode | Same, plus trackpad Shift/Cmd-click | Click/Shift/Ctrl-click, Ctrl+A, marquee drag **with** keyboard (Space to toggle, Shift+arrows to extend) |
| **Bulk actions** | Contextual bar replaces tab bar | Floating bottom toolbar | Header becomes contextual bar |
| **Settings / account** | Avatar in top bar opens a sheet (theme, backdrop, density, animate previews, account/disconnect) | Rail footer avatar | Sidebar footer avatar opens a dialog |
| **Viewer nav** | Swipe plus visible buttons | Arrows, filmstrip, swipe | ←/→, Home/End, Esc, F (fullscreen), I (inspector), Space (play/pause) |

Stability rule (from the NN/g critique): controls keep fixed positions within a form factor. Don't move or hide primary actions based on scroll beyond the standard hide-top-bar-on-scroll behavior.

---

## Accessibility checklist

Standards: WCAG 2.2 AA ([W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/); [What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).

**Contrast & color**
- [ ] Text ≥4.5:1 (large ≥3:1); UI component boundaries and focus indicators ≥3:1 (1.4.3, 1.4.11). Token tables below list computed pairs.
- [ ] State never by color alone: selected = check badge plus ring; favorite = filled icon; active chip = check icon plus fill.
- [ ] `forced-colors: active`: focus via `outline` (box-shadow is removed); chips and cards keep borders with system colors (`ButtonText`, `Highlight`); stage gets `forced-color-adjust: none` so backdrop and checker survive ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)).

**Targets & pointer**
- [ ] 2.5.8 Target Size (AA): ≥24×24 CSS px or meet the 24px-circle spacing exception. Use 44×44 for touch as policy (that is the AAA 2.5.5 figure; don't conflate the two) ([DAISY](https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html); [Adrian Roselli](https://adrianroselli.com/2023/12/2-5-8-adversarial-conformance.html)).
- [ ] 2.5.7 Dragging Movements (AA): every drag has a single-pointer alternative. Move-to-folder via menu/dialog, marquee via Select mode, sheet detents via button, viewer swipe via arrow buttons ([W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).

**Focus & keyboard**
- [ ] 2.4.11 Focus Not Obscured (AA): sticky top/bottom bars use `scroll-padding` so the focused card is never fully hidden ([W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).
- [ ] Visible focus on all interactive elements (2.4.7). Aim for 2.4.13 (AAA): 2px outline, ≥3:1.
- [ ] Full keyboard operation (2.1.1). Viewer is a modal `<dialog>`: focus moves in, is contained, Esc closes, focus returns to the originating card.

**Zoom & reflow**
- [ ] Text resizes to 200% without loss (1.4.4). The type scale's max/min ≤1.5 and no `vw`-only sizes ([Adrian Roselli](https://adrianroselli.com/2019/12/responsive-type-and-zoom.html)).
- [ ] Reflow at 320 CSS px (1.4.10, i.e. 400% zoom on a 1280px window): the shell switches to the phone layout. The viewer's large maps may pan in 2D (images and maps are an allowed exception under 1.4.10) ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

**Motion**
- [ ] `prefers-reduced-motion`: no morphs, no autoplay previews.
- [ ] 2.2.2 Pause, Stop, Hide (A): any auto-playing sprite loop longer than 5s shown with other content has a pause control. A global "Animate previews" toggle plus per-viewer pause satisfies this ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).

**Screen readers**
- [ ] **Grid semantics:** default to a **list** (`<ul role="list">` of cards, each card one link/button with an accessible name like "Knight, character, 8 directions, 64 by 64"). Sarah Higley advises `role="grid"` only when information is genuinely two-dimensional and interaction is the primary purpose. Responsive galleries whose column count changes with width suggest the structure isn't a real grid, and grids carry a learning curve and AT quirks ([Higley](https://sarahmhigley.com/writing/grids-part1/); [W3C ARIA list thread](https://lists.w3.org/Archives/Public/public-aria/2016Jul/0227.html)). Revisit `role="grid"` with roving tabindex only if keyboard multi-select becomes central (Open questions).
- [ ] Optional arrow-key movement between cards as a sighted-keyboard enhancement (doesn't change semantics). Tab order stays sane.
- [ ] Live region (`aria-live="polite"`) for "3 selected", "Downloaded 12 assets", and filter result counts.
- [ ] Toggles use `aria-pressed` (favorite, chips). Sheets and dialogs have labels. Tab bar uses `<nav>` plus `aria-current="page"`.
- [ ] `role="list"` on styled lists. Inference: WebKit drops list semantics with `list-style: none`; widely reported, not sourced here.

**Transparency:** Safari doesn't expose `prefers-reduced-transparency` ([caniuse](https://caniuse.com/wf-prefers-reduced-transparency)), so default translucent bars must already pass contrast with worst-case content behind them, or be opaque.

---

## Theme directions A/B/C (full token sketches)

All three share the spacing scale, motion token names, backdrop tokens, and type-scale structure above. Values are proposals. Contrast numbers are my computations (see Conventions).

**Shared spacing (4px base):** `--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;`

**Shared tokens all themes must define:** `--bg, --surface-1, --surface-2, --surface-3, --border, --border-strong, --text-1, --text-2, --text-3, --accent, --accent-text (if accent fails as text), --accent-contrast, --danger, --focus, --shadow-float, --radius-*`, and backdrops `--stage-*`.

---

### Direction A — "Quiet Studio"

**Mood / rationale.** A calm, professional dark studio in the spirit of Linear's 2026 refresh and Apple's "content in focus" principle, without the glass. Near-neutral cool-gray tonal layers, hairlines instead of boxes, one ice-blue accent for selection and focus. The art provides all the color. Tuned dark first; the light mode is a clean, slightly cool paper.

**Palette (OKLCH)**
```css
:root {
  color-scheme: light dark;
  --bg:            light-dark(oklch(0.985 0.002 260), oklch(0.16 0.003 260));
  --surface-1:     light-dark(oklch(0.995 0.001 260), oklch(0.19 0.003 260));  /* cards, stage default */
  --surface-2:     light-dark(oklch(0.965 0.003 260), oklch(0.23 0.004 260));  /* sidebar, inspector */
  --surface-3:     light-dark(oklch(0.935 0.004 260), oklch(0.28 0.005 260));  /* menus, sheets, hover */
  --border:        light-dark(oklch(0.89 0.004 260),  oklch(0.32 0.005 260));  /* decorative hairlines */
  --border-strong: light-dark(oklch(0.62 0.006 260),  oklch(0.52 0.006 260));  /* control outlines, ≥3:1 */
  --text-1:        light-dark(oklch(0.21 0.004 260),  oklch(0.96 0.002 260));
  --text-2:        light-dark(oklch(0.42 0.005 260),  oklch(0.76 0.004 260));
  --text-3:        light-dark(oklch(0.52 0.005 260),  oklch(0.64 0.005 260));  /* meta; not on surface-3 in dark */
  --accent:        light-dark(oklch(0.53 0.16 252),   oklch(0.74 0.12 245));   /* "ice blue" */
  --accent-contrast: light-dark(oklch(0.99 0 0),      oklch(0.18 0.03 250));
  --danger:        light-dark(oklch(0.55 0.20 27),    oklch(0.70 0.17 25));
  --focus:         var(--accent);
  --shadow-float:  0 8px 24px light-dark(oklch(0 0 0 / 0.14), oklch(0 0 0 / 0.40)),
                   0 1px 2px  light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.30));
}
```
(`light-dark()` takes whole colors, not bare alpha numbers, so each shadow color is a full `light-dark()` pair.)

Computed contrast:
- **Dark:** text-1/bg 17.3:1; text-2/surface-2 7.9:1; text-3/bg 5.8:1, /surface-1 5.5:1, /surface-2 5.0:1, /surface-3 4.3:1 (fails; don't use text-3 on surface-3); border-strong/bg 3.5:1; accent/bg ≈8:1 (approx).
- **Light:** text-2/surface-3 7.0:1; text-3/surface-3 4.55:1, /bg 5.3:1; border-strong/bg 3.5:1; accent/bg ≈5:1 and white-on-accent ≈5.2:1 (approx, verify).

**Backdrops.** Default stage: `--surface-1` in the grid, `--stage-dark` in the viewer (dark mode) and `--stage-light` (light mode). Options: mid (N5), light (N8), black, white, checker.

**Typography.** Geist Sans (UI) + Geist Mono (metadata), one superfamily, OFL. Alternative: Inter 4 + system-ui fallback. Wordmark only: **Geist Pixel** (same family, so it reads intentional, not retro). Weights: 400 body, 500 labels, 600 titles. Type scale steps −1…3 (no step 4).

**Radii / spacing.** `--radius-xs: 4px; --radius-sm: 6px; --radius-md: 10px (cards); --radius-lg: 14px (sheets, popovers); --radius-pill: 999px`. Viewer stage 0–4px. Grid gap 12px comfortable / 4px compact.

**Elevation.** Tonal surfaces plus 1px hairlines (dark mode: an inner `oklch(1 0 0 / 0.07)` border on cards). Shadows only on floating layers. One translucent bar max (top bar over grid), opaque in viewer.

**Motion personality.** Precise and quick: `--dur-1/2/3` with `--ease-out`. Spring only on sheet settle and selection-check pop (tiny overshoot). Frame-morph viewer transition.

**Iconography.** Phosphor Regular at 20px/1.5 stroke-equivalent. Fill weight for on-states.

**Sample components**
- **Asset card:**
  - Square, `--surface-1`, radius 10px.
  - Art centered at integer k with ≥8px inset.
  - Bottom-left micro-badges (type glyph, "8 dir", ▶ if animated) in `--step--1` mono on a `--surface-3` 80% pill.
  - Hover (fine): surface steps to `--surface-2`, name fades in at bottom.
  - Selected: 2px accent outline at offset 2px plus a filled check-circle top-left.
  - Focus: same outline, no badge.
- **Top bar:**
  - 52px (touch) / 48px (desktop).
  - Left: view title (`--step-2`, 600). Center (desktop): search field on `--surface-2`. Right: Select, zoom, avatar.
  - Translucent over grid with blur; hairline appears only after scroll.
- **Inspector:**
  - `--surface-2`, 340px. Sections separated by space, not lines.
  - Name (`--step-3`). Key facts as a 2-column definition list with tabular nums (Size `64×64`, Frames `8`, Directions `8`, Created). Prompt in mono `--step--1` (6 lines, "Show more" plus Copy). Folders as chips.
  - Primary "Download" accent button pinned at bottom.
- **Bottom sheet:** `--surface-3`, top radius 14px, 36×4px grab handle plus an explicit expand/close button, two detents (half/full), `--shadow-float`.
- **Chips:**
  - 32px (fine) / 36px with 44px hit area (coarse), pill.
  - Rest: `--surface-2` with `--border`. Active: accent-tinted fill (`color-mix(in oklch, var(--accent) 18%, var(--surface-2))`), `--text-1`, leading check icon.

**Pros.**
- Most art-neutral; easiest to make accessible.
- Matches the 2026 "quiet UI" consensus; lowest kitsch risk.
- Compact and fast (no heavy effects).

**Cons.**
- Can feel generic ("another dev-tool dark theme").
- Geist is strongly associated with Vercel; pick Inter if that matters.
- Little brand memorability beyond the wordmark.

**Risks.**
- Too cool or too dark makes warm palettes look muddy (Linear warmed its grays for this reason). Keep chroma ≤0.005.
- Dark-default for light-preferring OS users: mitigated by following the OS.

---

### Direction B — "Gallery Wall"

**Mood / rationale.** A light, airy museum and editorial feel: warm off-white "gallery wall", generous whitespace, an editorial serif for asset names in the viewer, thin rules, and a deep verdigris accent like a museum label. Art is "hung" on the wall with lots of air; the viewer defaults to an N8 light-gray stage (print-viewing standard).

**Palette (OKLCH)**
```css
:root {
  color-scheme: light dark;   /* light-first */
  --bg:            light-dark(oklch(0.975 0.004 85), oklch(0.20 0.006 70));
  --surface-1:     light-dark(oklch(0.995 0.002 85), oklch(0.23 0.006 70));
  --surface-2:     light-dark(oklch(0.955 0.005 85), oklch(0.27 0.007 70));
  --surface-3:     light-dark(oklch(0.925 0.006 85), oklch(0.32 0.008 70));
  --border:        light-dark(oklch(0.88 0.006 85),  oklch(0.36 0.008 70));
  --border-strong: light-dark(oklch(0.60 0.010 80),  oklch(0.56 0.010 70));
  --text-1:        light-dark(oklch(0.22 0.010 70),  oklch(0.95 0.005 85));
  --text-2:        light-dark(oklch(0.40 0.010 70),  oklch(0.78 0.008 80));
  --text-3:        light-dark(oklch(0.50 0.010 70),  oklch(0.70 0.008 80));
  --accent:        light-dark(oklch(0.50 0.09 175),  oklch(0.78 0.10 175));   /* "verdigris" */
  --accent-contrast: light-dark(oklch(0.99 0.003 85), oklch(0.20 0.02 175));
  --danger:        light-dark(oklch(0.53 0.19 28),   oklch(0.72 0.16 28));
  --focus:         var(--accent);
  --shadow-float:  0 12px 32px oklch(0.3 0.02 70 / 0.12), 0 1px 3px oklch(0.3 0.02 70 / 0.10);
}
```
Computed contrast:
- **Light:** text-3/bg 5.6:1, /surface-3 4.8:1; text-2/surface-3 7.4:1; border-strong/bg 3.7:1; accent/bg ≈5.6:1; white-on-accent ≈6:1 (approx).
- **Dark:** text-3/surface-3 4.75:1, /bg 6.8:1; border-strong/bg 3.9:1; accent/bg ≈9:1 (approx).

**Backdrops.** Grid stage `--surface-1` (white card on paper wall). Viewer default `--stage-light` (N8). Mid and checker available.

**Typography.**
- **Instrument Serif** (OFL; 400 + italic) for the viewer asset name, folder titles and empty-state headlines (`--step-3/4`).
- **IBM Plex Sans** (OFL, variable `wdth`/`wght`) for UI.
- **IBM Plex Mono** for metadata (verify OFL).
- No pixel font except optionally the wordmark.
- Uses step 4 for editorial headers on large screens.

**Radii / spacing.**
- Small radii: `--radius-sm: 2px; --radius-md: 4px (cards); --radius-lg: 8px (sheets)`, a crisp gallery-frame look.
- Larger grid gap (16–24px) and a "mat" (12–16px inset) around art in cards.
- Comfortable density is the default even on desktop.

**Elevation.** Paper model: cards are *brighter* than the wall (surface-1 > bg), with hairline borders and no shadow. Floating layers get a warm, very soft shadow. No blur anywhere (editorial clarity).

**Motion personality.** Slow and graceful: `--dur-3: 320ms`, ease-out, no overshoot, crossfades favored over slides. Grid→viewer is a frame morph then art fade, like a picture being brought forward.

**Iconography.** Phosphor Light (thinner strokes match the serif elegance). Fill weight for on-states.

**Sample components**
- **Asset card:** white mat (surface-1) with 1px `--border`, art centered with generous inset. Below the card (not overlay), the name in Plex Sans `--step-0` and a mono size label in `--text-3`, like a wall label. Selected: 2px accent frame plus check.
- **Top bar:** opaque `--bg`, no border until scroll. Left: wordmark plus breadcrumb. Right: search as a borderless underline field.
- **Inspector:** reads like a museum label. Serif name; "Type · Size · Frames" in small caps sans; prompt in mono inside a light `--surface-2` block; rules (1px `--border`) between sections.
- **Bottom sheet:** `--surface-1`, 8px top radius, hairline top border plus soft shadow, serif sheet title.
- **Chips:** rectangular-ish (4px radius), outline style, active = `--text-1` fill with `--bg` text (inverted, monochrome) plus check icon. Keeps accent rare.

**Pros.**
- Feels premium and distinctive among dark AI tools; excellent for showcasing.
- Light mode suits reading prompts and metadata (NN/g light-mode reading advantage).
- The N8 viewer default is color-honest.

**Cons.**
- A large light field around tiny sprites causes glare at night.
- Light-colored and white-outlined sprites (ghosts, clouds, UI frames) vanish on a white mat, so users must switch backdrops more often.
- The serif and extra whitespace reduce density for power users with thousands of assets.

**Risks.**
- "Editorial" can read as a portfolio site rather than a tool.
- Serif plus pixel art is an unusual pairing; it could clash if the serif is overused.
- Warm paper bias (hue 85) slightly warms perceived art; keep the stage chroma 0.

---

### Direction C — "Soft Pixel"

**Mood / rationale.** A craft-tool personality that nods to pixel art without retro kitsch. Mid-dark slate workbench, **crisp 1px borders** as the signature, small square-ish radii, a pixel monospace (Departure Mono) for numerals/badges/labels only, and a warm signal-amber accent. Feels like a modern sprite editor's gallery mode.

**Palette (OKLCH)**
```css
:root {
  color-scheme: light dark;   /* tuned mid-dark first */
  --bg:            light-dark(oklch(0.94 0.006 255), oklch(0.235 0.008 255));
  --surface-1:     light-dark(oklch(0.98 0.003 255), oklch(0.265 0.009 255));
  --surface-2:     light-dark(oklch(0.91 0.007 255), oklch(0.30 0.010 255));
  --surface-3:     light-dark(oklch(0.87 0.008 255), oklch(0.35 0.011 255));
  --border:        light-dark(oklch(0.78 0.010 255), oklch(0.42 0.012 255));  /* crisp, visible 1px */
  --border-strong: light-dark(oklch(0.55 0.012 255), oklch(0.62 0.012 255));
  --text-1:        light-dark(oklch(0.20 0.010 255), oklch(0.95 0.004 255));
  --text-2:        light-dark(oklch(0.36 0.012 255), oklch(0.82 0.006 255));
  --text-3:        light-dark(oklch(0.46 0.012 255), oklch(0.73 0.008 255));
  --accent:        light-dark(oklch(0.62 0.15 62),   oklch(0.82 0.14 78));    /* "signal amber" (fill) */
  --accent-text:   light-dark(oklch(0.48 0.12 58),   oklch(0.82 0.14 78));    /* amber fails as text on light */
  --accent-contrast: light-dark(oklch(0.18 0.03 60), oklch(0.20 0.03 70));    /* dark text on amber, both modes */
  --danger:        light-dark(oklch(0.54 0.20 25),   oklch(0.72 0.17 22));
  --focus:         light-dark(oklch(0.48 0.12 58),   oklch(0.82 0.14 78));
  --shadow-float:  2px 2px 0 light-dark(oklch(0 0 0 / 0.18), oklch(0 0 0 / 0.45)); /* hard 1-step "pixel" shadow, floating only */
}
```
Computed contrast:
- **Dark:** text-3/surface-3 4.7:1; border-strong/bg 4.6:1, /surface-3 3.1:1; accent/bg ≈9.5:1.
- **Light:** text-3/surface-3 4.8:1, /bg 6.0:1; border-strong/bg 4.1:1; amber fill ≈3:1 on bg (OK as non-text fill, not as text, hence `--accent-text` ≈5.5:1); dark text on amber ≈5:1 (approx, verify).

**Backdrops.** Grid stage `--surface-1` with an *optional* subtle checker in the viewer by default (fits the "workbench" mood), plus mid/light/black/white.

**Typography.**
- **Departure Mono** (OFL) at 11px/22px for badges, counts, keyboard hints, section labels (uppercase, tracking +0.04em) and the wordmark.
- Body UI: **Inter 4** (or system-ui). Metadata: Departure Mono only for short tokens (sizes, frames); a regular mono (Geist Mono) for long prompts, since a pixel mono is tiring for paragraphs.
- Alternatives for the wordmark: Geist Pixel, Pixelify Sans, monogram (CC0).

**Radii / spacing.**
- `--radius-xs: 2px; --radius-sm: 3px; --radius-md: 4px (cards)`.
- Optional "stepped" corners (`clip-path` polygon with 2px steps) **only** on the logo and the selected-count badge.
- Grid gap 8px comfortable / 2px compact (tight like a sprite sheet).

**Elevation.** Borders do the work: every surface has a 1px `--border` aligned to whole pixels (avoid half-pixel transforms). The hard 2px offset shadow appears only on floating menus and sheets. No blur.

**Motion personality.** Snappy and stepped. Hover and press transitions ~80–120ms. Selection check appears with `steps(3)` (a deliberate frame-by-frame feel, like sprite animation). Viewer: frame morph with `--ease-out` (no steps, to avoid jank); art pops in. Reduced motion: instant.

**Iconography.** Phosphor Bold, or pixelarticons at exactly 24px for asset-type badges and empty states (verify the free set covers all types and its license). Never mix both on one toolbar.

**Sample components**
- **Asset card:** 4px radius, 1px `--border`, `--surface-1` stage. Top-right Departure Mono badge `64×64`, bottom-left type glyph. Selected: border becomes 2px amber plus a stepped-corner amber count badge. Hover: border brightens to `--border-strong` (no scale).
- **Top bar:** opaque `--bg` with a 1px bottom border always. Left: pixel wordmark. Section label in Departure Mono uppercase. Search field with a 1px border and a `/` keycap hint.
- **Inspector:** label/value rows separated by 1px dotted borders. Labels in Departure Mono uppercase 11px, values in Inter, numbers tabular. Prompt in Geist Mono.
- **Bottom sheet:** 1px border, 4px top radius, hard 2px shadow, pixel-mono sheet label.
- **Chips:** 4px radius, 1px border. Active = amber fill plus dark text plus check glyph. Counts inside chips in Departure Mono.

**Pros.**
- Most memorable; communicates "pixel art" instantly; fits the audience of game devs.
- Crisp 1px borders align with the medium.
- The mid-dark slate is close to a neutral surround, so it's a fairly honest backdrop.

**Cons.**
- Highest kitsch risk if pixel type or stepped corners spread.
- Visible borders everywhere add visual noise vs the quiet-UI trend.
- A mid-dark background compresses available contrast (text-3 must be lighter).
- Amber is unusable as text in light mode (needs a separate token).

**Risks.**
- 1px borders and pixel fonts look uneven at fractional DPR (Windows 125/150%).
- Pixel fonts have limited glyph coverage, which matters for localization.
- Amber might collide with common sprite palettes (gold coins, fire VFX), weakening selection visibility. Mitigated by check badges.

---

## Recommendation (which direction and why)

**Ship Direction A "Quiet Studio" as the single theme (light + dark), with three borrowed touches from C and one from B.**

Why A:
1. **It best serves "the art is the hero."** Near-zero-chroma chrome plus zero-chroma stage is the most color-honest setup (neutral-surround practice), and it matches the 2026 consensus (Linear's calmer, warmer-neutral refresh; Apple's "content in focus").
2. **Lowest accessibility and implementation risk.** All computed token pairs pass AA with documented exceptions. No blur dependency, which matters because Safari ignores `prefers-reduced-transparency`. Forced-colors-safe outlines.
3. **It avoids the two dated traps:** glass-over-content (Liquid Glass backlash) and pixel kitsch.
4. **It applies M3 Expressive's research where it counts:** one emphasized primary action per context. The rest stays calm (the "strong minority preferred calmer designs" caveat favors a quiet base).

Borrow from C (personality without kitsch):
- Pixel display face (Geist Pixel or Departure Mono) **for the wordmark and large counts only**.
- **Crisp 1px hairlines aligned to whole pixels**, and integer-scaled art everywhere.
- Mono micro-badges on cards (`64×64`, `8 dir`).

Borrow from B: the **viewer backdrop switcher with an N8 light-gray option** and wall-label-style metadata in the inspector.

Shell defaults: follow the OS theme; viewer default stage = `--stage-dark` in dark mode and `--stage-light` in light mode, with mid (N5) one tap away.

Don't build user-selectable *themes* (A/B/C) in the app; that is speculative scope. Build one token set with light/dark plus the backdrop switcher. Other directions can be added later because everything is tokenized.

**Before committing, the mockups should test:**
- A vs C on the same 50 real assets: warm palettes, white/light sprites, VFX on black.
- The naive view-transition morph vs the frame-morph+fade at DPR 1, 1.25 and 2.

---

## Branding notes

### Cited findings
- PixelLab's public site markup exposed only a plain-text "PixelLab" heading. No logo asset, colors or fonts were readable via fetch ([pixellab.ai](https://www.pixellab.ai/)). A visual audit is still needed.
- Apple advises letting content, not chrome color, carry identity in the functional layer ([Apple](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)). This supports a minimal, monochrome brand mark.

### Inferences / proposal
- **Name:** avoid "PixelLab" as the leading word of the product name. "PixelLab Gallery" reads as an official product. Prefer a distinct name plus a descriptive, nominative tagline in plain text: "**<Name>** — a gallery for your PixelLab assets. Unofficial; not affiliated with PixelLab." Candidates:
  - **Vitrine** (museum display case)
  - **Plinth** (gallery pedestal)
  - **Spritebook**
  - **Tilebook**
  - **Pixfolio**
  - **Atlas** (also a sprite-sheet term; likely crowded)
  - **Pip Gallery** (ties to the user's own "PixelLab Pip" project naming; check that "Pip" doesn't itself imply PixelLab ownership)
  - Run trademark and domain checks before choosing.
- **Logo ideas (monochrome, 1px-grid native):**
  - a picture frame drawn with a 1px stroke containing a single 2×2 pixel cluster (gallery + pixel);
  - a 3×3 grid with one filled cell (grid gallery + selection);
  - a stepped-corner plinth made of 4–5 pixel rows.
  - Render the wordmark in Geist Pixel or Departure Mono. Use the theme accent only for the single "pixel".
- **Unofficial signals:**
  - disclaimer on the connect/login screen, About page and README;
  - never use PixelLab's logo, mascot, colors or screenshots of their UI as branding;
  - refer to PixelLab in plain text only;
  - choose an accent after confirming it differs clearly from PixelLab's brand palette.
- **Favicon/app icon:** the logo mark on `--bg` at 16/32/180/512px, drawn on an integer pixel grid at each size (no downscaled rasters).

---

## Open questions

1. **PixelLab brand audit:** what are PixelLab's actual logo shape and brand colors (screenshot audit)? This determines a safe accent hue and logo distance.
2. **Name:** which name candidate passes trademark/domain checks? Is "Pip" acceptable or too close to PixelLab-branded naming?
3. **View transitions:** is `image-rendering: pixelated` honored on `::view-transition-old/new` snapshots in Chrome, Safari and Firefox? Needs a spike; decides naive morph vs frame-morph+fade.
4. **Fractional DPR:** do we implement DPR-aware integer scaling (needs `devicePixelRatio`; `devicePixelContentBox` is unavailable in Safari), or accept `pixelated`'s nearest-integer-then-smooth behavior?
5. **Grid semantics:** do users rely on keyboard multi-select enough to justify `role="grid"` plus roving tabindex over list semantics? Test with NVDA and VoiceOver.
6. **Animated previews:** what are the CPU/battery cost and UX of animated thumbnails? Default off and play-on-hover, or autoplay-when-visible with a global pause (2.2.2)?
7. **Localization:** do the chosen pixel display fonts cover the target languages? If not, limit them to the Latin wordmark and digits.
8. **Asset formats:** which PixelLab asset types are large (maps, tilesets) and need smooth downscaled thumbnails vs integer upscales? This affects card stage logic.
9. **Font choice:** Geist (Vercel association) vs Inter for Direction A? This is a brand-perception call.
10. **APCA:** has the March 2026 WCAG 3 draft adopted any APCA-like contrast model? Advisory only for now.

---

## Sources

**Aesthetics & platform design**
- NN/g — Liquid Glass Is Cracked (Budiu, 2025-10-10): https://www.nngroup.com/articles/liquid-glass/
- NN/g — Dark Mode vs. Light Mode (Budiu, 2020): https://www.nngroup.com/articles/dark-mode/
- Apple — Liquid Glass technology overview: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- Apple — Meet with Apple session 208: https://developer.apple.com/videos/play/meet-with-apple/208
- Gulf News — iOS 26.1 Tinted control (secondary): https://gulfnews.com/technology/companies/apple-yields-tinted-control-in-ios-261-beta-4-tones-down-liquid-glass-after-backlash-1.500315176
- Fast Company SA — adjusting Liquid Glass (secondary): https://fastcompany.co.za/tech/2025-11-10-how-to-adjust-apples-liquid-glass-in-ios-26/
- 9to5Mac — iOS 26 launch, developer doubts: https://9to5mac.com/2025/09/15/ios-26-officially-launches-today-but-some-developers-arent-sure-it-should/
- Pixel Envy — On Liquid Glass: https://pxlnv.com/blog/on-liquid-glass/
- Google Design — Expressive Material design research: https://design.google/library/expressive-material-design-google-research
- Android Authority — M3 Expressive features: https://www.androidauthority.com/google-material-3-expressive-features-changes-availability-supported-devices-3556392/
- Dezeen — Material 3 Expressive: https://www.dezeen.com/2025/05/28/google-ushers-in-age-of-expressive-interfaces-with-material-design-update/amp/
- 9to5Google — M3 Expressive navigation: https://9to5google.com/2025/05/14/material-3-expressive-navigation/
- M3E community guide (secondary): https://skills.sh/fumiya-kume/toy-poodle-love/m3-expressive
- Android Developers — window size classes: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
- Fluent 2 — Elevation: https://fluent2.microsoft.design/elevation
- Linear — Behind the latest design refresh: https://linear.app/now/behind-the-latest-design-refresh
- Linear — How we redesigned the Linear UI (2024): https://linear.app/blog/how-we-redesigned-the-linear-ui

**Color, contrast, backdrops**
- MDN — light-dark(): https://developer.mozilla.org/docs/Web/CSS/color_value/light-dark
- Adobe shadow-dom-css — light-dark: https://shadow-dom-css.adobe.com/features/light-dark
- DEV — light-dark() fallbacks: https://dev.to/parsajiravand/youre-writing-dark-mode-colors-twice-light-dark-fixes-that-44hb
- web.dev — New to the web platform, July 2024 (relative color): https://web.dev/blog/web-platform-07-2024
- Lea Verou — color science posts: https://lea.verou.me/blog/tags/color-science/
- Tailwind CSS theme.css (v4 palette): https://github.com/tailwindlabs/tailwindcss/blob/main/packages/tailwindcss/theme.css
- Radix Colors — Understanding the scale: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
- Open Props: https://open-props.style/
- W3C WAI — WCAG 3 Working Draft, March 2026: https://www.w3.org/WAI/news/2026-03-03/wcag3
- yatil.net — WCAG 3 is not ready yet: https://www.yatil.net/blog/wcag-3-is-not-ready-yet
- Adobe Community — why Photoshop's background is gray: https://community.adobe.com/t5/photoshop-ecosystem-discussions/why-is-the-background-color-of-the-photoshop-application-designed-gray/m-p/10078168
- RP Imaging — Munsell neutral gray paint: https://www.rpimaging.com/munsell-neutral-gray-paint.html
- greynotgrey — When is grey not grey: https://greynotgrey.com/blog/2012/05/07/colour-theory-monday-when-is-grey-not-grey/
- SPIE — Background and the perception of lightness: https://ebooks.spiedigitallibrary.org/conference-proceedings-of-spie/4421/0000/Background-and-the-perception-of-lightness/10.1117/12.464574.full
- Have Camera Will Travel — Lightroom background color: https://havecamerawilltravel.com/lightroom/lightroom-classic-change-color-behind-image/
- MDN — forced-colors: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors

**Typography**
- vercel/geist-font: https://github.com/vercel/geist-font
- vercel/geist-pixel-font: https://github.com/vercel/geist-pixel-font
- Vercel community News Cache (Geist Pixel): https://community.vercel.com/t/news-cache-2026-02-09/33058
- CTAN — geist-font: https://ctan.org/tex-archive/fonts/geist-font
- rsms/inter releases: https://github.com/rsms/inter/releases
- Inter site: https://rsms.me/inter/
- google/fonts METADATA — IBM Plex Sans: https://github.com/google/fonts/blob/main/ofl/ibmplexsans/METADATA.pb
- google/fonts METADATA — Instrument Serif: https://github.com/google/fonts/blob/main/ofl/instrumentserif/METADATA.pb
- google/fonts METADATA — Pixelify Sans: https://github.com/google/fonts/blob/main/ofl/pixelifysans/METADATA.pb
- google/fonts METADATA — Silkscreen: https://github.com/google/fonts/blob/main/ofl/silkscreen/METADATA.pb
- Google Fonts — Press Start 2P: https://fonts.google.com/specimen/Press+Start+2P/about
- online-fonts — Press Start 2P (secondary): https://online-fonts.com/fonts/press-start-2p
- uiuxshowcase — Departure Mono: https://uiuxshowcase.com/resources/departure-mono-pixel-style/
- nixpkgs — Departure Mono packaging: https://code.ornl.gov/mdf/nixpkgs/-/commit/0e42338abc86d5630142acf87d0455088a9a6138
- Daring Fireball — Departure Mono: https://daringfireball.net/linked/2024/09/03/departure-mono
- itch.io — monogram font: https://itch.io/t/214662/monogram-a-free-monospace-pixel-font
- Adom wiki — font licensing (Satoshi): https://wiki.adom.inc/adom/adom-theme/files/fonts/LICENSES.md
- fontalternatives — Satoshi: https://fontalternatives.com/alternatives/satoshi/
- Adrian Roselli — Responsive Type and Zoom: https://adrianroselli.com/2019/12/responsive-type-and-zoom.html
- Smashing — Fluid typography & zoom (2022): https://smashingmagazine.com/2022/12/fluid-typography-predict-problem-users-zoom-in/
- Smashing — Accessibility concerns with fluid type (2023): https://smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type

**Surfaces, motion, rendering**
- OpenReplay — backdrop-filter: https://blog.openreplay.com/creating-blurred-backgrounds-css-backdrop-filter/
- inspire_blur docs: https://pub.dev/packages/inspire_blur
- Chrome — prefers-reduced-transparency: https://developer.chrome.com/blog/css-prefers-reduced-transparency
- caniuse — prefers-reduced-transparency: https://caniuse.com/wf-prefers-reduced-transparency
- Mozilla Bugzilla 1736914: https://bugzil.la/1736914
- web.dev — Same-document view transitions Baseline: https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- Chrome — View transitions in 2025: https://developer.chrome.com/blog/view-transitions-in-2025
- W3C — CSS View Transitions Level 1: https://www.w3.org/TR/css-view-transitions-1/
- WebKit Bug 317712: https://bugs.webkit.org/show_bug.cgi?id=317712
- Mozilla Bug 1924130: https://bugzilla.mozilla.org/show_bug.cgi?id=1924130
- Mozilla Bug 1964101: https://bugzilla.mozilla.org/show_bug.cgi?id=1964101
- MDN — linear() easing: https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear
- Chrome — linear() easing function: https://developer.chrome.com/docs/css-ui/css-linear-easing-function
- MDN — image-rendering: https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
- MDN — Crisp pixel art look (de): https://developer.mozilla.org/de/docs/Games/Techniques/Crisp_pixel_art_look
- web.dev — devicePixelContentBox: https://web.dev/articles/device-pixel-content-box

**Icons**
- pixelarticons (npm): https://npmjs.com/package/pixelarticons
- Iconify — pixelarticons: https://icon-sets.iconify.design/pixelarticons/
- Product Hunt — pixelarticons: https://www.producthunt.com/products/pixelarticons
- allsvgicons — Phosphor vs Lucide: https://allsvgicons.com/compare/phosphor-vs-lucide/
- Composables — Phosphor: https://composables.com/icons/icon-libraries/phosphor

**Responsive**
- web.dev — viewport units: https://web.dev/blog/viewport-units
- OpenReplay — fix 100vh: https://blog.openreplay.com/fix-100vh-mobile-viewport/
- 21st.dev — mobile navigation components (secondary): https://21st.dev/blog/react-mobile-navigation-components
- W3C CSSWG archive — safe-area-inset in WebKit (2021): https://lists.w3.org/Archives/Public/public-css-archive/2021Jul/0027.html
- Chrome — Viewport Segments API shipped: https://developer.chrome.com/blog/viewport-segments-api-shipped
- MDN — Viewport Segments API: https://developer.mozilla.org/en-US/docs/Web/API/Viewport_Segments_API
- MDN — horizontal-viewport-segments: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/horizontal-viewport-segments
- web.dev — New to the web platform, May 2026: https://web.dev/blog/web-platform-05-2026
- web.dev — Baseline digest, May 2026: https://web.dev/blog/baseline-digest-may-2026

**Accessibility**
- W3C — WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C WAI — What's new in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- DAISY KB — Target size (minimum): https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html
- Adrian Roselli — 2.5.8 Adversarial Conformance: https://adrianroselli.com/2023/12/2-5-8-adversarial-conformance.html
- Sarah Higley — Grids Part 1: To grid or not to grid (2020): https://sarahmhigley.com/writing/grids-part1/
- W3C public-aria thread (grid vs list, 2016): https://lists.w3.org/Archives/Public/public-aria/2016Jul/0227.html

**Branding**
- PixelLab site (markup check only): https://www.pixellab.ai/
