# 01 — Product Brief: PixelLab Backpack (formerly Vitrine)

**Vitrine** (working name) — *Unofficial gallery for your PixelLab assets.*
Status: design baseline, 2026-10-18; final rulings applied. Inputs: `docs/reviews/R1-research-cross-review.md` (decisions D1–D31), `docs/reviews/R2`–`R3b`, `docs/research/01`–`09`, the orchestrator rulings R-1 to R-10 and F-1 to F-16, and the builder answers B-1 to B-20. Every decision, and the precedence order between docs and mockups, is in `00-decision-log.md`. Companion docs: `02-ux-spec.md` (behavior), `03-mockup-requirements.md` (mockup checklist), and `07-recommended-design.md` (visual design and layout).

Vitrine is not made by, affiliated with, or endorsed by PixelLab. Every screen that names PixelLab says so in plain text and uses no PixelLab logo, mascot, colors, or UI screenshots.

---

## 1. Intent and why

PixelLab users generate hundreds to thousands of assets. PixelLab spreads them across 7+ separate libraries (Creator gallery, Characters, Objects, UI, Maps/Tilesets/Tiles, Effects, Game Builder). It has no cross-type view, no search across types, no favorites, hover-only card actions on touch, capped single-type bulk export, and non-integer thumbnail scaling (research 03, flaws 1–3, 9).

Vitrine is one fast, calm, read-only window onto everything the public PixelLab API exposes. Users can find any asset, watch it animate crisply, organize it locally, and download it in the format their next step needs. It runs fully in the browser with the user's own PixelLab API key. There is no backend, and nothing is written back to PixelLab.

## 2. Target users

| Persona | Context | What they need from Vitrine |
|---|---|---|
| **Indie game dev** (primary) | Desktop + phone; generates characters, tilesets, and objects for one or two games | Find assets fast, download sprite sheets and frames, and group assets per game |
| **Hobbyist / social sharer** | Mostly phone; posts to Discord and social media | Browse beautifully, grab a GIF, show work off full-screen |
| **Agent-assisted builder** | Desktop; uses PixelLab through MCP or coding agents | See everything in one place, copy prompts, and copy an asset ID into an agent workflow when needed |

## 3. Top jobs-to-be-done

| # | Job | Target path (details in 02 §3) |
|---|---|---|
| J1 | "Find that slime animation from last month and grab a GIF for Discord." | Search → open → **Download GIF**: **3 clicks on desktop, 4 taps on phone** including "Share or save…" (default animation and direction; picking them adds 2–3) |
| J2 | "Download a whole character as a sprite sheet for my engine." | Characters chip → open → **Sprite sheet (ZIP)** tile: **3 clicks** (phone: 4 taps through the Download menu) |
| J3 | "Curate a folder for my game and download it in one go." | Select → Add to folder; later Folders → folder → Download → Download: **4 taps** |
| J4 | "Show off my characters on my phone." | Tap any card → immersive viewer; swipe between assets, rotate with the compass, landscape goes full-bleed |
| J5 | "Back up everything I've made." | Library → ⋯ → "Download all {n}…" → Download: **3 taps**, streamed or split into parts |
| J6 | "Tweak this in PixelLab." | Open → **Open in PixelLab ↗** in the Info panel header (new tab, asset pre-loaded where PixelLab supports it): **2 taps** |
| J7 | "What did I write in the prompt for that one?" | Open → Copy prompt: **2 clicks on desktop, 3 taps on phone** (expand the sheet) |

## 4. Goals

1. **One library for every listable type**: Characters, Objects (including map objects), Images (Creator gallery), Tilesets, Tiles, Maps, and UI, with one search and one sort.
2. **Pixel-honest everywhere**: integer device-pixel scaling, no blur, no crop, at every DPR, zoom level, and orientation.
3. **Animation playback that matches PixelLab**: 8 fps default (R-1), directions, animations, states, step, a frame filmstrip, speed, loop.
4. **Every requested download type**: PNG, upscaled PNG, sprite sheet + JSON, GIF, all frames, PixelLab originals, and multi-asset/bulk ZIPs.
5. **Local organization that survives**: flat folders, favorites, and a JSON backup.
6. **Maximum metadata**: every field the API returns per type. Empty fields are hidden, never shown as "N/A".
7. **Same app on every device**: phone portrait and landscape through ultrawide, touch/mouse/keyboard/screen reader, with no hover-only or gesture-only actions.

## 5. Non-goals (v1)

- Creating, editing, regenerating, tagging, deleting, or reviewing anything in PixelLab. Hand-off links do this instead.
- Showing other users' assets, a community feed, or public share pages (no API for them).
- Fonts, VFX "My effects", portraits, talking animations, uploads, Game Builder projects: no public list path (R-5). One honest note at the end of All results and in Settings › About points to PixelLab (F-8).
- Nested folders, smart views, local tags, ratings, color search, command palette, list/table view, date-timeline scrubber, offline mode or service worker, installable PWA.
- Engine-specific export formats (Godot `.tres`, Unity, TexturePacker), APNG, animated WebP, and any claim of engine compatibility.
- Multi-account switching.

## 6. Anti-goals (failure even if it "works")

| Anti-goal | Guard (where specified) |
|---|---|
| Any write, spend, or side effect on the user's PixelLab account | GET-only wrapper + MCP allowlist (D3, S3); `get_image` gated by Phase 0 check P0-9 (R-4); e2e test asserts zero non-GET `/v2` calls |
| Blurry, uneven, or cropped pixels | Integer-k rendering rule (D8); refit on resize and DPR change (F-13); automated scale assertion at 5 DPRs (§9) |
| Key leak | The API key is sent only to `api.pixellab.ai`, never in URLs, logs, downloads, or copy buttons; last 4 shown (S2) |
| Asset capability leak (UUIDs or media URLs in the address bar, a share link, a download, or a log) | Opaque asset keys (D13, R-9); no copy-link feature; masked "Copy asset ID" in collapsed Technical details only |
| Cluttered chrome competing with the art | Two destinations, one header, presets-first dialogs, Advanced collapsed, ≤ 4 items per Download menu, one Backdrop button (F-4, F-5) |
| Hover-only or gesture-only actions | Every action has a visible control or menu item reachable by touch, keyboard, and screen reader (02 §9, §10) |
| Blocking spinners on startup or sync | Skeleton + streaming, never block on full sync (R-10) |
| Fake support (empty chips, pretend viewers) | Only listable types get chips; unavailable content gets one honest note (R-5, F-8) |
| Surprise motion or fetch storms | Play previews is on by default but capped: in view only, ≤ 8 playing, one low-priority detail fetch at a time; off under reduced motion or Save-Data; one toggle pauses everything (F-9). Details load only on viewer open, hover/focus play, capped previews, and Tiles Pro thumbnails; never in the background or on dwell (F-2) |
| Implying PixelLab affiliation | Distinct name, nominative "for your PixelLab assets", disclaimer on Connect, Settings › About, and README |

## 7. Design principles

1. **Art first, chrome last.** The grid and stage are the product. Controls are quiet, few, and stable in position.
2. **Every pixel honest.** Integer scale or explicit smooth "fit" for oversized art. Never crop, never transform art, never re-encode a 1× download.
3. **Read-only by construction, and visibly so.** No destructive or paid control exists. Leaving for PixelLab is always labelled ↗, and tools that can spend credits say so (F-11).
4. **One app, every device.** Same destinations and the same actions at every size. Containers change (pill, rail, sidebar; sheet, panel); capabilities don't.
5. **Fast by default, honest when slow.** Show what has arrived and say what is still loading, what failed, and what PixelLab doesn't expose.
6. **Private by default.** The API key stays in this tab unless the user opts in to "Keep me signed in", which is offered only after the first sync (F-10). Asset IDs never leave as links.
7. **Fewer, better controls.** Presets first, advanced collapsed, sensible remembered defaults. Ship less; removing a control later is expensive (research 04).

## 8. v1 scope vs deferred

**(req)** = explicitly requested by the user; never cut. Verdicts follow the R1 scope check, adjusted by rulings R-1 to R-10 and F-1 to F-16.

| Item | v1? | R1 verdict / ruling | Why |
|---|---|---|---|
| Unified Library with type chips (All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI) | **v1** | Keep (C7, C8, D4, D6), F-8 | Fixes PixelLab's 7-silo flaw |
| Creator gallery "Images" as a first-class type **(req: every asset)** | **v1, gated** | R-4 | Ships only if Phase 0's `get_image` side-effect check (P0-9) passes; otherwise an honest fallback card |
| Map thumbnails, lazy per map | **v1** | R-6 | Name placeholder until rendered |
| Objects: one card per state | **v1** | C9, R-7 | Stack badge + sibling states only if Phase 0 (P0-6) finds a grouping signal |
| Characters: one card per group, states in the viewer | **v1** | C9, G14 | `group_id` is in the list |
| Folders, flat many-to-many, with 2×2 mosaic covers **(req)** | **v1** | Keep (C19, D16), F-12 | — |
| Favorites **(req)** | **v1** | Keep | Pinned first in Folders (F-7) |
| Animation playback: play/pause, step, filmstrip (replaces the scrubber), fps stepper, loop/once, inline compass, animation picker, state switcher **(req)** | **v1** | Keep (D11), 8 fps default (R-1), F-4 | PixelLab gives no timing |
| Downloads: PNG, N× upscale, sprite sheet + Aseprite-hash JSON, GIF, all frames, PixelLab originals; ≤ 4 menu items per type; multi-file outputs as one ZIP **(req)** | **v1** | Keep (D17, D18, R-8), F-5 | — |
| Multi-asset and whole-account bulk ZIP **(req)** | **v1** | Keep (C12, R-8), F-5 | Streamed on Chromium; Blob + numbered parts elsewhere |
| Selection summary panel (≥ 1200 px, ≥ 2 selected) | **v1** | F-6 | Bulk work without leaving the grid |
| "Open in PixelLab ↗" + "More in PixelLab ▾" hand-offs **(req)** | **v1** | Keep (D21), F-11 | Map id route after P0-12 |
| Maximum metadata per type + collapsed Technical details **(req)** | **v1** | Keep (G21, R-9) | Info panel tables in 02 §5 |
| Desktop + mobile, every resolution and orientation **(req)** | **v1** | Keep, phone landscape rail (R-2), F-1 | Layout matrix in 07 §2 |
| API key connect (auto-test on paste), "Keep me signed in", Forget, balance shown | **v1** | Keep (D14, D15), F-10 | Security baseline |
| Session-mode streaming startup | **v1** | R-10 | Never block on full sync |
| "Play previews" toggle (default on, capped) + hover/focus play | **v1** | F-9 (supersedes R-3), C2 | WCAG 2.2.2 control |
| One Backdrop button (5 swatches), integer zoom, Fit ↔ 1:1 readout | **v1** | Keep (C15), F-4 | Judging pixel art |
| Light/dark/system theme ("Quiet Studio, lifted" tokens) | **v1** | Keep, F-3 | Cheap |
| Single-key shortcuts + off switch + `?` help | **v1** | Keep (C17, D27), F-15 | WCAG 2.1.4 |
| Org JSON backup download/import; storage usage; persist; clear cache | **v1** | Keep | Safari 7-day eviction |
| Copy prompt, copy image, Copy asset ID (Technical details only) | **v1** | Keep (R-9) | — |
| Scroll/focus restore on Back | **v1** | Keep | NN/g failure mode |
| Tileset sheet view + tile grid overlay + tile info | **v1** | Keep (minimal) | Part of max metadata |
| Map pan + integer zoom | **v1** | Keep | Maps exceed the viewport |
| "Not in the public API yet" note for fonts, effects, portraits, talking | **v1** | R-5, F-8 | Honest, no fake support |
| Pinch to change grid density | Deferred | Defer | Blocks browser pinch-zoom for low-vision users |
| Marquee / long-press-drag range select | Deferred | Defer | Fragile with virtualization |
| Desktop drag-to-folder | Deferred | Defer | "Add to folder…" covers it |
| Ping-pong loop, all-directions lockstep, hide frame 0, pixel-grid overlay | Deferred | Defer | Viewer polish |
| Tileset demo map / demo-patch thumbnails | Deferred (v1.1 candidate) | Defer | Wang semantics differ per family |
| Frame-morph view transition | Deferred | Defer (C11) | v1 crossfades |
| Smart views, folder groups, local hide, custom backdrop color | Deferred | Defer | Not requested |
| Service worker / offline mode / PWA install | Deferred | Defer | Not requested |
| Background or dwell detail prefetch | Deferred | Defer, F-2 | Costs reads + preflights |
| Foldable viewport segments | Deferred | Defer | Width classes cover foldables |
| Nested folders, local tags, ratings, color search, ⌘K palette, density modes, multiple themes, APNG/WebP, naming-template editor, copy-link, ghost cards, onion skin, minimap, 9-slice preview, editor deep link | **Cut** | Cut | Not requested, unsafe, or covered by something simpler |

## 9. Success criteria (measurable UX targets)

Tap counts use R2's first-run walkthrough (R2 §2: phone hobbyist, landing → walk-cycle GIF in Discord) as the baseline: **21 taps and 11 moments of doubt** before the final rulings.

| Area | Target | How measured |
|---|---|---|
| First-run walkthrough | Landing → a chosen animation and direction shared to Discord on a phone: **≤ 15 taps, ≤ 3 moments of doubt** (baseline 21 / 11) | Scripted R2 §2 run on the recommended mockup and the Phase 1 build |
| Connect | Landing → library on a phone: **≤ 6 taps** including the tab switch to PixelLab and back (baseline 9). After the key is copied: **1 action on desktop** (paste; the key auto-tests) / **2 taps on phone** | Flow count |
| First run | Skeleton ≤ 100 ms after the key tests OK; first real card ≤ 2 s (desktop broadband) / ≤ 3 s (4G phone), p75 | Playwright with throttled mock API; Phase 1 real-key check |
| Cold start, "Keep me signed in" mode | Cached grid painted (LCP) ≤ 1.2 s on a mid-range phone | Lighthouse mobile |
| Never blocked | Viewer, search, and favorites usable on already-loaded items at every moment of a sync | e2e: open the viewer mid-sync |
| J1 GIF | ≤ 3 clicks desktop / ≤ 4 taps phone with the default animation and direction (excluding typing and the OS share sheet) | Scripted flow count |
| J3 folder download | ≤ 4 taps from Folders | Scripted flow count |
| Previews | ≤ 8 cards playing and ≤ 1 preview detail request in flight at any time; previews start off under reduced motion and Save-Data | e2e network + ticker assertion |
| Scroll | 60 fps; no long task > 50 ms during a fling through 5,000 assets on a Pixel 6a-class Android at Medium zoom; ≤ 1,400 DOM nodes | Chrome performance trace; Lighthouse DOM size |
| Search | ≤ 50 ms filter time over 5,000 records (after a 150 ms debounce) | Unit benchmark |
| Viewer open | First frame ≤ 200 ms when cached; ≤ 1.5 s for an uncached character on 4G | Trace |
| Pixel integrity | 100% of art elements have integer device-pixel scale or are flagged smooth (k < 1); zero transforms, `zoom`, `object-fit`, or background images on art | Automated DOM assertion at DPR 1, 1.25, 1.5, 2, 2.625, 3 |
| Accessibility | Lighthouse Accessibility 100 on every screen; axe: 0 serious/critical; manual pass of 6 key flows on NVDA+Firefox, VoiceOver (macOS, iOS), TalkBack | CI + manual |
| Responsive | No horizontal page scroll at the 10 acceptance viewports (03 §1), at 320 px reflow, or at 200% text size | Playwright screenshots |
| View-only | 0 non-GET `/v2` requests; 0 MCP calls outside the allowlist | e2e network assertion |
| Key hygiene | The API key never in URL/hash/log/download/clipboard; stored in exactly one place per mode | e2e storage + URL assertions |
| Download integrity | 1× PNG byte-identical to source; GIF total duration within 10 ms of the effective timing (the current playback speed); partial failures listed in `manifest.json` | Unit tests |
| Bundle | Initial JS ≤ 60 KB gz; download code lazy-loaded ≤ 10 KB gz | CI bundle budget |

The owner runs every measurement that needs the real API key or a real device (the real-key first run, device traces, the manual screen-reader passes) from checklists the builder writes (B-2). **Status 2026-10-21:** none of these targets is measured yet, in CI or by hand. The device checks are optional and unscheduled ([MVP plan, What the owner needs to do](../plan/roadmap.md#what-the-owner-needs-to-do)).

## 10. Risks and dependencies

| Risk / dependency | Impact | Mitigation / owner |
|---|---|---|
| **Phase 0** (real key, ~½ day, checks P0-1 to P0-14 in 06 §2.3; owner-run, B-2): media hosts, read cost, rate limits, `get_image` side effects, map/gallery thumbnail cost, object grouping, hand-off URLs | Gates implementation of CSP hosts, Images, map thumbnails, concurrency, hand-off list, and the Play previews default | Run before the Phase 0-dependent Phase 1 tasks; the others start on synthetic fixtures with every gated value at its failed default (06 §3.1; B-1). Design has a fallback for every gate (02 §8, §4.8) |
| `get_image` is annotated not read-only | Images type may be unsafe | Regex guard on `gallery:` refs; ship Images only if P0-9 passes (with approval A1) and P0-14 shows no spend; else the fallback card (R-4, B-3) |
| Play previews on by default spends reads | Rate limits, slower sync | Caps (≤ 8 playing, one low-priority detail fetch at a time); default flips to off if P0-14 shows read cost or P0-8 hits a 429 at concurrency ≤ 2 (F-9) |
| PixelLab tightens CORS or changes MCP text output | App stops loading or parsing | "PixelLab blocked browser access" state; MCP parsers isolated and fixture-tested |
| Unpublished read rate limits | Slow sync, 429 storms | Concurrency 2–4, blind backoff, list pages at max size, lazy details |
| ToS §2.2 "building your own service" | Public launch blocked | Contact PixelLab before public launch (D31), and ask about CORS stability, scoped keys, and `Retry-After` in the same message |
| Account-wide API key (no scopes) | A leak means full account compromise | Strict CSP, zero third-party runtime code, no telemetry, session-only default |
| Safari 7-day storage eviction | Folders/favorites lost | Org JSON backup, `persist()`, backup tip (02 §8) |
| iOS memory and download limits | Large bulk downloads fail | Part cap enforced by a running byte count during the build (B-6), share sheet for single files |
| Map counts in the thousands | Thumbnail cost | Lazy in-view render after 300 ms in view, concurrency 1 for `view_map`; P0-10 measures the cost |
| Phishing clones on other origins | Users paste the key into a fake | One canonical URL, open source, rotation advice in Settings |

## 11. Decisions reserved for the owner

1. **Final product name** and trademark/domain check ("Vitrine" is a working name; research 08 advises against "PixelLab" as the leading word). **Timing (B-7):** decide it before the first build real users touch. The name is one constant, but renaming later breaks backup imports.
2. **Accent color** vs PixelLab's brand palette (needs a PixelLab brand audit; G23). Default: the ice blue in 07 §5.
3. **Public hosting**: whether to launch publicly, which host, and the canonical URL. **Decided (P-17):** GitHub Pages, accepted for a preview with known risks (shared origin, no `frame-ancestors`, only the CSP and referrer policy as meta tags). No public launch before the ToS contact (item 4).
4. **ToS contact with PixelLab** before public launch: timing, and what to do with the answer (D31).
5. **Phase 0 approvals A1–A3**: accepting the `get_image` gray area (A1), approving the one PixelLab export download needed for check P0-13 (A2), and acknowledging the burst test (A3) (06 §2.5).
6. **Source license and repository visibility**, public or private (open source is the recommended anti-phishing measure). `mockups/shared/assets/` holds the owner's real PixelLab art and must be removed or replaced before any public push (B-4).
7. **PWA manifest** (A4, no service worker; 06 §8).
8. **Owner-run checks** (B-2): who runs the real-key and real-device checks (Phase 0; device, screen-reader and performance checks). Default: the owner, from checklists the builder writes; agents never handle the key.

Resolved: the visual direction is the "Quiet Studio, lifted" hybrid in 07 (F-1, F-3).

**Orchestrator defaults the owner may override** (F-16): "Folders" as the destination name (F-7); Play previews on by default (F-9); Tilesets and Tiles as separate chips, matching PixelLab's own Map Workshop tabs (F-8).
