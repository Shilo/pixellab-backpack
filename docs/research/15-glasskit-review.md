# 15: GlassKit review

> Note: `mockups/simple/` is kept only in the owner's local copy and is not committed, so its paths in this file are plain text, not links.

Research date: 2026-10-19. The owner asked whether Vitrine should use **GlassKit** ([site](https://glasskit.jungherz.com/), [repo](https://github.com/JUNGHERZ/GlassKit)). This review rests on a read of the whole library at commit [`c8558ab`](https://github.com/JUNGHERZ/GlassKit/tree/c8558abb020a1c163f4aec07fbc0b3def7064fc2) (v1.27.0, 2026-10-18), its npm package, the live site, and a build of Concept 4 on it (theme F mockup, local only: `mockups/simple/themes/f-glasskit/README.md`). Nothing from the repo was run. Line links below point at that commit (`gk:` = `https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/`).

## Verdict

**Use it as a reference only. Do not ship it in Vitrine.** If the owner wants GlassKit's look with the least design work, the fallback is **partial adoption** exactly as the theme F mockup does it: `glasskit.css` pinned and unmodified, plus a Vitrine override file. Never load it from a CDN.

The reasons, in order:

1. **It does not solve Vitrine's hard problem.** Glass over bright pixel art must stay readable. GlassKit's glass is white 8–22% over blur, tuned for its own dark aurora background. Over our art, white text measured as low as 2.27:1, and 14 of 37 text runs in the search panel failed AA (§7). The fix, a dark base under the glass, is Vitrine's own CSS either way.
2. **Accessibility gaps we would have to patch on every control.** Buttons, pills, tab items and modal actions set `outline: none` and draw no focus indicator. Where a focus ring exists, it measures 1.3–1.9:1 against the background (3:1 needed). The default placeholder measures 2.5:1, inactive tab labels are 10 px at 3.1:1, and muted text on glass is 3.9:1. There is no `forced-colors`, `prefers-contrast` or `prefers-reduced-transparency` support (§7).
3. **It is mostly code we would not use.** Vitrine needs about 11 of its 34 components. The shipped CSS is 89 KB minified (13 KB gzip), render-blocking, and roughly two-thirds unused: calendar, date strip, steps, range, prose, table, skeleton, image picker, avatar, accordion and so on.
4. **It is phone-first, and Concept 4 is a desktop layout.** The mockup needed 46 rules to resize or re-lay out GlassKit's components on top of 16 token overrides: dock items in a row instead of an icon over a 10 px label, 44 px menu rows instead of 56 px, a side panel from a bottom sheet.
5. **Maintenance risk.** It is 7 months old, has one GitHub account behind all 43 attributed commits and all 15 issues, 15 stars, 0 forks, and five minor releases in five days. Its size claims are stale by about 2.3× (§3).

What it does well, and what is worth borrowing: a clean token architecture (`--gl-*`, with surface, blur, density and state roles), a sensible floating tab bar with an accessory capsule, an iOS-style grouped list with automatic dividers, a density preset, solid and tint surface presets, honest inline comments, MIT licence, no dependencies, no network access, and no trackers.

## 1. What it is

A single-file glassmorphism CSS component library "inspired by iOS 26 Liquid Glass" by Jungherz GmbH ([README](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/README.md)). It ships one stylesheet, `glasskit.css`, with all tokens and 34 components under a `glass-` prefix and `gl-` utilities. It also ships an optional ES module, `glasskit-droplet.js` (the 1.27.0 "droplet" selection motion), a Constructable Stylesheet export for Shadow DOM, `glasskit-styles.js` (generated at release), a `theme-override.css` template, and `SKILL.md`, a 105 KB reference written for AI assistants. Sister projects: GlassKit Elements (web components) and GlassKit Web (an Astro template).

## 2. License

- **MIT**, "Copyright (c) 2026 Jungherz GmbH" ([`gk:LICENSE`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/LICENSE)). `package.json` agrees (`"license": "MIT"`).
- **We may vendor, modify and ship it**, commercially too, provided the copyright and permission notice travel with the copies. The CSS file's header carries no licence line ([`gk:glasskit.css#L1-L11`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1-L11)), so a vendored copy must keep `LICENSE` beside it, or the notice must be added to our third-party notices. Copying single sections into our own CSS is also allowed under the same notice requirement.
- MIT grants no trademark rights. Do not call Vitrine's UI "GlassKit".

## 3. Size

These are measured on the npm tarball `@jungherz-de/glasskit@1.27.0`. Its `glasskit.css` and `glasskit-droplet.js` are byte-identical to the git blobs at `c8558ab`. Gzip uses -9, Brotli -q 11.

| File | Raw | Gzip | Brotli |
|---|---|---|---|
| `glasskit.css` | 140,736 B | 28,556 B | 23,556 B |
| `glasskit.min.css` (what you would ship) | 89,482 B | 13,169 B | 11,376 B |
| `glasskit-droplet.js` (optional) | 9,798 B | 3,408 B | 2,951 B |
| `glasskit-styles.js` (Shadow DOM export) | 90,235 B | 13,508 B | 11,598 B |

The README and the live site claim "51 KB raw / 39 KB minified / 6.5 KB gzipped" ([`gk:README.md#L60`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/README.md#L60)). The real files are 2.3–2.8× larger. The claim dates from an early version and was never updated. The tarball unpacks to 609 KB (11 files, mostly docs).

## 4. Dependencies

There are no runtime dependencies (`package.json` has none). The only devDependency is `clean-css-cli`, used to minify. The CSS needs no build step. The droplet module imports nothing.

## 5. Maintenance

| Fact | Value (2026-10-19) |
|---|---|
| Created | 2026-03-21 (first commit "Initial release – GlassKit v1.3") |
| Last commit | 2026-10-18, `c8558ab` "v1.27.0" |
| Commits | 66 (author names "Marcel" 40, "Jungherz GmbH" 23, "Marcel Karas" 3). GitHub attributes all 43 linked commits to one account |
| Tags / GitHub releases | 39 tags, 30 releases. v1.23.0 → v1.27.0 between 2026-10-14 and 2026-10-18; 26 commits in the last 30 days |
| Stars / forks / watchers | 15 / 0 / 0 |
| Issues | 15 total, 2 open. All 15 were opened by the maintainer's own account (one self-merged PR, #5). No outside contributors |
| npm downloads | 3,371 in the last month |
| CI | Build smoke test, version-consistency check, Pages deploy. Releases publish to npm with OIDC trusted publishing and provenance |

**Reading.** The project is actively and carefully maintained, with detailed CHANGELOG entries and many measured contrast fixes. But the bus factor is one, the community is effectively zero, and the churn is high: the API grows every few days, often with the comment "since 1.2x". If we used it, we would pin a version and review every upgrade.

## 6. Component inventory against Vitrine's needs

| Need (Concept 4) | GlassKit | Fit |
|---|---|---|
| Floating dock / pill bar | `.glass-tab-bar-dock` + `.glass-tab-bar--floating` (+ `__accessory`) ([`gk:glasskit.css#L1768-L1823`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1768-L1823)) | **Partial.** The pill, blur, shadow and 1.27.0 capsule state are good. Items stack the icon over a 10 px label. A search field or a text button inside the bar needs our own layout |
| Buttons / icon buttons | `.glass-btn` (`--primary/--secondary/--tertiary`, `--sm/--lg/--auto`), `.glass-pill` (46 px round) | **Partial.** Buttons default to `width: 100%` and 56 px. Primary buttons force icons to filled (`stroke-width: 0`, [`gk:L794-L795`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L794-L795)), which makes stroke icons invisible. No focus style |
| Segmented control | `.glass-segmented` (`aria-pressed`, `--full/--scroll/--wrap`, optional droplet) | **Good** |
| Search field | `.glass-search` + `.glass-input`, input prefix and suffix (`.glass-input-wrap`) | **Good.** The placeholder token needs raising |
| Menus / popovers | `.glass-popover` + `.glass-list--bare` ([`gk:L2311-L2364`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L2311-L2364)) | **Look only.** An `.is-open` class toggle, absolutely positioned under an anchor. It has no positioning or flipping, no Popover API or top layer, no ARIA, and no focus or keyboard handling. The docs' example uses `<li>` rows (not focusable) and inline `onclick` |
| Panels / sheets / drawers | `.glass-sheet` (bottom sheet, `--inline`), `.glass-modal` + overlay (also on native `<dialog>`) | **Partial.** No side panel. The sheet caps at `max-height: 88dvh`. The modal's `<dialog>` support is good |
| Chips | `.glass-badge--interactive` / `--selected` | **Good.** About 25 px tall, so too small for touch at the default size |
| Split button | — | **Missing** |
| Cards | `.glass-card`, `--glow` | Good, but heavy for content tiles (1.5 px border at 30% white, blur) |
| Toasts | `.glass-toast` (action plus close) | Good. Top-centred only |
| Modals | `.glass-modal`, `dialog.glass-modal-overlay` | Good |
| Selection checkboxes | `.glass-checkbox` | Good, but every box carries its own backdrop blur |
| Lists (Info panel, settings) | `.glass-list` (leading / content / trailing, automatic dividers, density tokens) | **Very good** |
| Toggle | `.glass-toggle` (track tokens since 1.25.0) | Good |

## 7. Glass, theming and accessibility

### How the glass works

- **Material:** `background: var(--gl-surface-N)` (white at 8/10/14/16/22% in dark mode, [`gk:L120-L127`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L120-L127)), `backdrop-filter: blur(var(--gl-blur))` (24 px; 16/12/40 px variants), a 1–1.5 px white border at 18–40%, and an inset top highlight. There is no saturation boost except in the droplet, no refraction, and no adaptive tint.
- **Prefixes:** 26 rules set `backdrop-filter`. 25 also set `-webkit-backdrop-filter`. `.glass-radio__circle` misses it ([`gk:L1305`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1305)), which only matters for Safari before 18.
- **Fallback:** there is no `@supports`. Without backdrop-filter, the white 10% surfaces sit straight on the content (README note, [`gk:README.md#L707`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/README.md#L707)).
- **Tokens and theming:** everything is a `--gl-*` custom property on `:root, [data-theme="dark"]` (dark is the default), with a `[data-theme="light"]` block, `[data-density="compact"]`, and `[data-surface="solid"|"tint"]` presets that turn the blur off. Re-branding derives the gradient, focus ring and glow from two colours with `color-mix()`. Theme switching is attribute-based. There is no automatic `prefers-color-scheme`, so a page needs script, or must set `data-theme` server-side.
- **Missing media queries:** none for `prefers-reduced-transparency`, `prefers-contrast` or `forced-colors`. `prefers-reduced-motion` covers only the droplet, the skeleton and the sheet ([`gk:L2043`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L2043), [`L2626`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L2626), [`L2887`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L2887)). Hover lifts, scale transforms, the modal zoom and the popover scale still animate. In forced-colors mode the focus rings, which are box-shadows, disappear entirely.

### Contrast

The figures below are WCAG 2.x ratios. "Measured" means composited over the real rendered pixels in headless Edge (method in the mockup README's "Measured contrast" section, local only: `mockups/simple/themes/f-glasskit/README.md`). "Computed" means flat token colours over GlassKit's own background `--gl-color-bg-mid` `#1a3d4e`.

| Case | Ratio | Needs |
|---|---|---|
| GlassKit default primary button: white on `#f5a623` (GlassKit's own comment, [`gk:L80-L87`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L80-L87)) | 2.03 | 4.5 |
| Focus ring `--gl-shadow-focus` (3 px primary at 30%) vs background, default amber / our blue | 1.68–1.89 / 1.27–1.36 (computed) | 3.0 |
| Placeholder `--gl-placeholder` (35% white) on an input | 2.48 computed; 2.47 measured on our dark-based dock; 1.81 measured on stock glass over bright art | 4.5 |
| Inactive tab label (10 px, `--gl-icon-muted` 45%) on the floating bar | 3.08 (computed) | 4.5 |
| Muted text (60%) on `--gl-surface-3` | 3.90 (computed) | 4.5 |
| Stock GlassKit glass over our art, worst run per frame | search panel 2.27 (14 of 37 runs fail), Info panel 2.64 (15 of 24), more menu 3.38 (9), download menu 3.56 (3), dock over the tileset row: Library 4.43, placeholder 2.68 (measured) | 4.5 |
| Theme F after fixes (dark base, muted 72%, placeholder 70%, primary `#0a6cdc`) | worst floating-UI text 4.62 (focused placeholder); Download 5.93; all 10 frames pass (measured) | 4.5 |

To be fair, GlassKit measures its badges, toasts and state colours carefully and documents fixes (for example CHANGELOG 1.7.0 and 1.18.0, and the toast action's double scrim). The failures above are in the base glass, the focus ring and the placeholder, which it never re-tuned for a busy backdrop.

### Focus, ARIA and keyboard

- `outline: none` appears 18 times. `.glass-btn` ([`gk:L766`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L766)), `.glass-pill` ([`L673`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L673)), `.glass-tab-bar__item` ([`L1697`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1697)), `.glass-modal__action`, `.glass-theme-toggle` and `.glass-accordion__trigger` have **no `:focus-visible` replacement at all**. Interactive list rows show focus only as a 10% background change ([`L2470-L2474`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L2470-L2474)).
- The examples are mixed. The segmented control, chips and sheet are documented with `role="group"`, `aria-pressed`, `role="dialog"` and `aria-modal`. The popover example has no `aria-expanded` or `aria-haspopup`, uses non-focusable `<li>` rows, and has no Escape handling or focus return. The modal works best as `dialog.glass-modal-overlay` with `showModal()`, which is well supported ([`L1496-L1501`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1496-L1501)).
- Keyboard behaviour is entirely up to the app: CSS cannot supply it, and the only shipped JS is the droplet.

## 8. Browser support

- The floor is `color-mix()`: Chrome / Edge 111, Safari 16.4, Firefox 113 ([`gk:README.md#L690-L707`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/README.md#L690-L707)). Refinements degrade quietly: `lh` (Firefox 120), `:has()` (Firefox 121), `:dir()` (Chrome 120), `field-sizing`.
- Safari is covered by the `-webkit-backdrop-filter` twins, apart from the radio. Firefox has supported `backdrop-filter` since 103.
- In headless Edge every frame rendered with no console errors.

## 9. Performance

- GlassKit blurs nearly every control, including controls inside glass that is already blurred: inputs, toggle tracks, checkbox boxes, badges, lists, accordions, secondary and tertiary buttons, and pills. In the mockup, frame 05 (selection mode) has **22 backdrop-filter layers**, one per checkbox plus the dock. Concept 4's own CSS had 1. In a 200-asset grid in selection mode that is 200 blurred layers repainting on every scroll frame, which is a real cost on phones and integrated GPUs.
- The token presets set blur to `0px`. That removes the visual blur, but a `backdrop-filter` other than `none` still creates a stacking context and a backdrop root. A real build should set `backdrop-filter: none` on nested controls and keep blur only on floating roots: the dock, capsules, menus, the panel and the overlay.
- `--gl-transition: all .25s ease` ([`gk:L267`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L267)) transitions every property on 19 components. That is cheap at rest but wasteful during theme changes and layout shifts.
- The 13 KB gzipped stylesheet is render-blocking. Vitrine would use about a third of it.

## 10. Framework fit (Svelte 5, our CSP)

- **Svelte 5:** plain global classes work unchanged (`class:is-open`, `aria-pressed={…}`). There is no JS coupling. Svelte's scoped styles cannot target GlassKit's descendants without `:global()`, so overrides belong in a global file.
- **CSP:** the stylesheet contains no `@import`, no `@font-face` and no external `url()`. The only URLs are two `data:` SVG chevrons for `.glass-select` ([`gk:L73`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L73), [`L317`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L317)). They need `img-src data:`, or `--gl-select-chevron` overridden, or no `.glass-select`. The docs' patterns conflict with a strict CSP: inline `onclick` handlers, `style="width: X%"` on progress fills, and a CDN `@latest` include. Do not copy those. The droplet module writes custom properties through `element.style.setProperty`, which CSP allows.
- **Fonts and CDNs:** the library itself loads none. Its font stack is system fonts. The README recommends jsDelivr or unpkg (`@latest` in `SKILL.md`). We would vendor a pinned file instead.

## 11. Security

- The only JS is `glasskit-droplet.js` (221 lines, read in full). It uses pointer events, `MutationObserver`, `ResizeObserver`, `requestAnimationFrame`, `getComputedStyle`, `dataset` and `style.setProperty`. It has no network calls, no storage, no `eval` and no dynamic code. Clicks happen only through the page's own items (`it.click()`).
- The demo pages (`index.html`, `docs.html`, `showcase.html`) contain no analytics, trackers, external scripts or fonts. Their only outside references are links and JSON-LD.
- CI publishes with npm provenance (OIDC). There are no install hooks for consumers: `prepublishOnly` runs only for the maintainer.

## 12. CSS quality

- **Naming:** consistent BEM-like `glass-block__element--modifier` and `gl-` utilities, with `is-active`, `is-open` and `is-visible` states. It would not collide with our classes (Concept 4's `.glass` does not match `glass-`).
- **Specificity:** mostly single classes, with sensible `:where()` use. There are 5 `!important` declarations, all on `.glass-search__icon` ([`gk:L1105-L1109`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L1105-L1109)).
- **Global rules that can clash:**
  - The "scoped reset" `[class*="glass-"], [class*="gl-"] { box-sizing: border-box }` ([`gk:L39-L44`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L39-L44)) matches by substring, so any class containing "gl-" is caught.
  - `.glass-bg > * { position: relative }` ([`gk:L638`](https://github.com/JUNGHERZ/GlassKit/blob/c8558ab/glasskit.css#L638)) beats a type selector such as `main { position: fixed }`, so the mockup positions its own elements with class selectors.
  - `:root` gets `color-scheme: dark` and about 140 custom properties (142 in the dark block).
- **Docs inside the code:** very thorough comments explain each decision. They help maintenance but make up a large share of the raw file size.

## 13. Against Apple Liquid Glass and Material 3 Expressive

- **Liquid Glass (iOS 26):** Apple's material bends and refracts the content behind it, picks up specular highlights that move, and adapts its tint and contrast to the backdrop, darkening over bright content. GlassKit is classic frosted glassmorphism: blur, white tint and a rim highlight. Only the 1.27.0 droplet copies a Liquid Glass motion. The missing adaptive behaviour is exactly why white text fails over our art. Liquid Glass would darken; GlassKit stays white.
- **Material 3 Expressive:** the opposite approach. Tonal solid surfaces with no blur, so contrast never depends on the content (research 14, rule 2). GlassKit's `data-surface="solid"` preset gets close to this in one attribute, but then little of GlassKit's identity remains.
- **For a pixel-art gallery:** frosted blur turns pixel art into soft colour washes behind the chrome. In the stock renders, green and orange halos bleed through the search panel. That competes with "the art is the only saturated thing on screen" (research 14, rule 1). GlassKit's default amber accent and teal aurora also break that rule and must be re-tokened.

## 14. Integration plan

### Recommended: use as a reference

1. Write `src/lib/styles/glass.css` (target under 4 KB gzip) for the components Concept 4 uses: floating dock and capsule, pill button, search field, popover menu with grouped rows, side panel, segmented control, toggle, checkbox, chip, primary and tertiary buttons, split button, modal overlay.
2. Borrow GlassKit's ideas, credited in a comment: the `--gl-*`-style role tokens (surface steps, blur steps, density tokens), the grouped list's automatic divider rule, the floating-bar-plus-accessory structure, and the solid-surface preset. Where a block is copied verbatim, keep the MIT notice in that file.
3. Build in what GlassKit lacks:
   - a dark base under every floating surface (as `--vt-scrim` in theme F: 62% docks, 80% menus);
   - `:focus-visible { outline: 2px solid; outline-offset: 2px }` on every control;
   - blur only on floating roots;
   - `@media (prefers-reduced-transparency: reduce)` and `(prefers-contrast: more)`, switching to solid surfaces;
   - `@media (forced-colors: active)` with system colours and outlines;
   - reduced motion for every transition;
   - menus on the Popover API or `<dialog>`, with ARIA menu semantics and keyboard support, in Svelte.
4. Verify with the theme F contrast method (text composited over the real art) on every floating surface, including the stress backdrop.

### Fallback: partial adoption (if the owner wants GlassKit itself)

1. Vendor `glasskit.css` (or `.min.css`) **v1.27.0, pinned, unmodified**, plus `LICENSE`, into `static/vendor/glasskit/`, and record the SHA-256 (`7e0da50b…adb1113a` for the unminified file). No CDN, no `@latest`, and no `glasskit-styles.js` or droplet unless needed.
2. Load `vitrine-glass.css` after it with: the token overrides (primary `#0a6cdc`/`#0050b4`, neutral background and aurora, `--gl-placeholder` .70, the tab-bar capsule tokens); the readability layer; the focus ring; `backdrop-filter: none` on nested controls; the forced-colors, contrast and transparency media queries; and the split button. Theme F's `app.css` sections 1, 2 and 4 are a working start.
3. Use only these classes: `glass-tab-bar(-dock|--floating|__item|__icon|__label)`, `glass-pill`, `glass-search`, `glass-input`, `glass-btn(--primary|--tertiary|--sm|--auto)`, `glass-popover`, `glass-list(--bare|__item|__title|__subtitle|__trailing|__value|__section-header)`, `glass-divider`, `glass-segmented`, `glass-toggle`, `glass-checkbox`, `glass-badge--interactive`, `glass-sheet--inline`, `glass-modal-overlay`, `glass-card--glow`. Do not use `.glass-bg` as a layout wrapper, or reset `.glass-bg > *`.
4. Treat every GlassKit upgrade as a code review: read the CHANGELOG and re-run the contrast measurement.
