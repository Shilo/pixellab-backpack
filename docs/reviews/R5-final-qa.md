# R5 — Final QA: Vitrine design set

Status: 2026-10-18. Role: final QA lead. Scope: the recommended mockup (`mockups/recommended/`), the design docs (`docs/design/00`–`07`), the research report (`docs/research/00`), the root README and every mockup README. Research 01–09, reviews R1–R4, design 04 and the option mockups A, B and C are historical records. This pass read and scanned them but did not edit them.

**Verdict:** ready for owner review. Every automated check passes after the fixes below. What remains can only be checked on real devices or with a real API key (§4).

## 1. Summary

- **Backdrop control fixed.** The viewer's Backdrop control used to be an unlabeled `contrast` icon beside a 14 px dot, which read as a cryptic "⦿ ○" pair. It is now one labelled button: a swatch filled with the current backdrop (Checker draws as small squares) plus the word "Backdrop". Its accessible name is "Backdrop: Mid gray", and it opens the existing 5-swatch popover. The label fits at every width where the dock shows the button, down to 320 px. Design 07 now specifies this control.
- **Two new rulings.** B-19: the in-progress indicator reads "{n} generating ↗". B-20: in Phase 1, an animated object with no rotation images gets "Download sprite sheet" as its primary button. Both are recorded in 00 and applied to 02, 03, 06 and 07.
- **Six other defects fixed.** Three were in the mockup: a 28 px touch target on tileset Info rows, PixelLab links on the bare `pixellab.ai` host against B-8, and a deviation note in its README that 07 no longer contradicts. Three were in the docs: research 00 still had a user-facing "Export, then Save" flow and a ZIP size-estimate rule that B-6 replaced, and the README implied that Play previews switches off at runtime when it is really a build flag.
- **Sweeps:** 0 broken links. 0 privacy or secret findings that need action. 0 contradictions left in the editable docs. 0 Markdown problems in the editable docs (3 malformed table rows remain in historical research 01).

## 2. What changed

| File | Change |
|---|---|
| `mockups/recommended/app.js` | Backdrop button is now swatch + "Backdrop" (ghost style, `aria-label` "Backdrop: {name}"), and `setBackdrop` updates the swatch in place. PixelLab links use `https://www.pixellab.ai` (B-8). Info-row copy buttons use a class that is 28 px on fine pointers and 44 px on coarse pointers, replacing an inline 28 px style. The pending-chip comment cites B-19 |
| `mockups/recommended/styles.css` | `.bd-btn` has a 16 px swatch with a 4 px checker. New `.btn.icon.inl` rule with a coarse-pointer 44 px override |
| `mockups/recommended/README.md` | Describes the labelled Backdrop button. The account link uses `www`. The "2 generating ↗" deviation note is removed because 07 now agrees |
| `docs/design/07-recommended-design.md` | §4.4 Backdrop component rewritten for the labelled swatch button. W4 phone wireframe shows `[o Backdrop]`. The icon list keeps `contrast` for the ⋯ menu item only. W1 wireframe and §4.2 use "2 generating ↗". §8 question 8 is resolved by B-19 |
| `docs/design/00-decision-log.md` | Added B-19 and B-20. The precedence range is now B-1 to B-20, and the B-section intro names R5. B-11, B-15 and E-13 point to the new rows |
| `docs/design/02-ux-spec.md` | §1.3 and §8 chip wording. §7.1 Phase 1 primary and the ¹ footnote follow B-20. New changelog row. Baseline range updated |
| `docs/design/03-mockup-requirements.md` | Chip wording "2 generating ↗" |
| `docs/design/06-implementation-plan.md` | Task 1.19 names the B-20 primary |
| `docs/design/01-product-brief.md`, `05-architecture.md` | Baseline range B-1 to B-20 |
| `docs/research/00-research-report.md` | The "Export, then Save" flow became the "Your file is ready" sheet. The `predictLength` estimate gave way to B-6's running byte count. Notes that Play previews is a build flag (E-9). "Five backdrops one tap away" became "behind one Backdrop button". The header note gives the provisional name and the unofficial status |
| `README.md` | Play previews default described as a build flag (E-9). R5 added to the status row, the reviews map, the design-00 row and the process. The recommended mockup is no longer marked "in progress" |
| `docs/reviews/R5-final-qa.md` | This report |

## 3. Verification results

All browser checks ran in headless Microsoft Edge driven over the DevTools protocol, using a fresh throwaway profile that was deleted afterwards. The page loaded from disk (`file://`). Touch, pointer type, color scheme, reduced motion, forced colors and DPR were emulated.

### 3.1 Mockup matrix

15 viewports × 7 pages × light and dark = **210 page states**. Pages: Library, Viewer (Android Courier, east), Folders, Selection (5 mixed), multi-asset Download dialog, tileset viewer with the grid on, and map viewer. Viewports: 320×640@2, 360×780@3, 390×844@3, 412×915@2.625, 844×390@3, 673×841@2.625, 768×1024@2, 820×1180@2 and 1180×820@2 (all touch), plus 1366×768@1.25, 1440×900, 1920×1080, 2560×1440, 3440×1440 and 1080×1920 (all mouse).

| Check (per page state) | Required | First run | After fixes |
|---|---|---|---|
| JS errors | 0 | 0 | 0 |
| Horizontal scroll (document, main, panels, dialogs, popovers) | 0 | 0 | 0 |
| Art drawn at a non-integer device-pixel scale (or nearest-neighbour below 1×) | 0 | 0 | 0 |
| Coarse-pointer targets under 44 px | 0 | 2 (tileset viewer at 1180×820, light and dark: "Copy terrains" 28×28) | 0 |
| Page states passing everything | 210 | 208 | **210** |

### 3.2 Flows, self-test and README shortcuts

| Suite | Result |
|---|---|
| Backdrop (new: labelled button at 1440, 390, 360, 320, 768 and compact height; popover; Checker and Black; forced colors) | 14/14 |
| Connect (paste auto-test, streamed first sync, keep-signed-in banner, no key text in the DOM) | 8/8 |
| Walk, desktop (search, viewer, compass east, 6 fps, step, filmstrip seek, Download GIF, ≤ 4-item menu, hand-off links, Download options) | 12/12 |
| Walk, phone (Direction popover, fps popover, step from ⋯, bottom-sheet menu, ready sheet, targets ≥ 44) | 8/8 |
| Folders (favorite 2, create "Boss fight", E-1 bar vs panel, popover picker with inline New folder, folder view, delete confirm) | 12/12 |
| Select (5 mixed, summary panel, captions kept, multi Download dialog, progress chip, phone long-press bar) | 9/9 |
| `#dungeon` tag search and Info tag chip | 3/3 |
| Keyboard only (skip link, arrows, Enter, `/`, `]`, `.`, `l`, Esc focus return, `?` help) | 7/7 |
| Phone search (pill stays, Cancel, View sheet, Play previews switch, last item clear of the pill) | 7/7 |
| No JS errors on the last page | 1/1 |
| **Flows total** | **81/81** |
| `&selftest=1` (03 §2 counts, grouping, keys, routes, menu size) | pass |
| `pixelUtilsSelfTest()` | pass |
| Live DPR change 1 → 1.5, then resize to 1100 px at 1.25 | 0 non-integer art after each change, 0 errors |
| Root README demo shortcuts in all four mockups (viewer with `dir=west`, `sync`, `select`, `theme=light/dark`, B's `detail`, C's `stage`) | 20/20 |

The demo-shortcut table in the root README matches `mockups/recommended/README.md` and the boot code in `mockups/recommended/app.js`. No change was needed.

**Backdrop control, before and after.** At 1440×900 the button is 104 × 32 px and holds no icon. At 390×844, 360×780 and 320×640 (the case with the most controls: Hooded Orb Mage, which has a state switcher) it is 100 × 44 px, and the dock row does not overflow. At 768×1024 it is 102 × 44 px. At compact height (844×390) it stays in ⋯ as "Backdrop: Mid gray…". Under forced colors the swatch keeps its fill and gains a `CanvasText` border. The 1440×900 light and 390×844@3 dark screenshots were checked by eye: the button reads as a labelled control next to the zoom group and in the phone dock's second row.

### 3.3 Link check

Every relative Markdown link in `README.md`, `docs/**/*.md` and `mockups/**/README.md` was checked. For `.md` targets, heading anchors were checked too, using GitHub slug rules. The script's self-test flagged a missing file and a bad anchor.

| Files | Relative links | Broken |
|---|---|---|
| 30 | 176 | 0 |

### 3.4 Privacy and secrets scan

The scan covered all text files in the project root and every PNG's `tEXt`, `iTXt`, `zTXt` and `eXIf` chunks.

| Pattern | Hits | Judgement and resolution |
|---|---|---|
| Absolute paths (drive letters, user-home roots, app-data folders) | 1 | `06:151` a list of arrow, Home and End keys, not a path. None |
| OS username, host name, or parent folder names of the machine path | 0 | None |
| Email addresses | 0 | File names like `…_walk_east@2x.gif` were excluded as scale suffixes. None |
| IPs and host names | 1 IP, 15 local-host names | The loopback address and the local-host name describe local test setups in 06, research 00, 02 and 09 and R1. Not machine data. None |
| Bearer tokens, `sk-` keys, long hex or base64 secrets | 1 / 0 / 2 / 0 | The one bearer header (research 02) carries a deliberately invalid probe value. The 40-hex string (research 08) is a public commit hash in a public URL. Long base64-like matches were all URL slugs and file names. None |
| 8-4-4-4-12 UUIDs | 3 | The all-zero version-4 placeholder in `05:213–214` and `06:90` is not an asset. The sample data uses fake prefixed ids (`chr_0002` …), and the Creator refs are fake `gallery:<13-digit>` values derived from `createdAt` (provenance in `mockups/shared/README.md`). No real UUIDs. None |
| Presigned URL parameters (AWS signature query keys) | 8 | Research 01 lines 20 and 211 show the parameter names with every value elided (`…`) and `{user_id}` / `{asset_id}` placeholders. No live signature. None |
| Credentialed git URLs and clone commands | 0 / 10 | Prose about `list_projects` embedding a credentialed clone URL, plus 05's defensive filter rule. No URL is present. None |
| PNG text chunks | 0 | None |

### 3.5 Consistency spot-check

Sources: README, design 00–03 and 05–07, research 00 and the recommended mockup.

| Item | Result |
|---|---|
| Chips: All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI | Same list in 00 F-8, 01, 02 §1.3, 07 §4.2, research 00 and the mockup's `CHIPS` |
| Destinations Library / Folders | Consistent. "Collections" appears only as the retired name |
| "Play previews" default on, with caps, gated by a Phase 0 build flag | Consistent after the README and research 00 fixes (`PREVIEWS_DEFAULT_ON`, E-9) |
| 8 fps default | Consistent. 10 fps appears only as the superseded value |
| 5 backdrops (Theme, Checker, Light gray, Mid gray, Black) | Consistent in 00, 01, 02, 03, 06, 07, research 00, README and the mockup's `BDS` |
| "Download", never a user-facing "Export" | Consistent after the research 00 fix. The mockup UI contains no "Export" |
| "PixelLab API key" in user-facing copy | Consistent. "Secret token" appears once, in the Connect help (F-7) |
| Filmstrip replaces the scrubber | Consistent |
| CSP `img-src 'self' blob:` | The 4 full CSP strings (README, 05 ×2, research 00) are identical |
| Phase 0 numbering per 06 §2.3 | Every P0-0 to P0-14 reference matches its 06 title |
| B-8 `www.pixellab.ai` links | Fixed in the mockup and its README |
| Provisional name "Vitrine" and the unofficial disclaimer | README, 01, 02, 05, 07 and the mockup carry both. Research 00 now notes them |
| In-progress chip "{n} generating ↗" (B-19) | Every editable doc and the mockup agree. The old wording survives only in historical 04 and the reviews |

### 3.6 Markdown sanity

| Check | Result |
|---|---|
| Tables with consistent column counts | 298 tables. Editable docs: 0 problems. Historical research 01 lines 252, 255 and 256 contain unescaped `\|` inside inline code (for example `active\|trial\|expired\|none`), so GitHub renders extra cells. It was left as a historical record |
| Mermaid blocks fenced as `mermaid` | 3 of 3 (README, 05, research 07) |

## 4. Remaining known limitations

**Only real devices can verify:**
- Fractional-DPR seams on Windows at 125% and Android at 2.625 (07 §8 question 4). Headless output is integer-clean, but engine snapping can differ on hardware.
- The iOS keyboard over the phone search bar, real safe-area insets, Android Back in sheets, and long-press callouts (07 §8 question 9).
- Screen readers (NVDA with Firefox, VoiceOver on macOS and iOS, TalkBack), real Windows High Contrast themes (only forced colors were emulated here), and touch latency and gestures on real glass.

**Only a real API key (Phase 0, owner-run, B-2) can verify:**
- Checks P0-1 to P0-14: read cost, rate limits, media hosts and CORS, `get_image` side effects, map thumbnail cost, MCP text fixtures, hand-off routes and export timing.
- **B-20's precondition.** Research 01 saw `GET /v2/objects/{id}/spritesheet` return 400 for an object with no rotation images *yet*. Live `get_object` on a 1-direction object printed a sheet link. Whether a completed 1-direction object returns 200 is unverified. B-20 therefore records the fallback: if it returns 400, the Phase 1 primary is "Download PNG". The object sheet is a bearer download, so whether to run this check under approval A2 is the owner's call.

**Left as is:**
- `mockups/shared/assets/` holds the owner's real PixelLab art. Remove or replace it before any public push (B-4).
- The headless matrix uses emulated touch and media features. Faked parts of the mockup (key test, sync timing, downloads) are listed in `mockups/recommended/README.md`.
- The historical research 01 table rows in §3.6.

## 5. Ready for owner review

The design set is consistent, and the recommended mockup passes the full matrix with 0 JS errors, 0 horizontal scroll, 0 non-integer art and 0 coarse targets under 44 px. It also passes every scripted flow, its self-test and the README shortcuts. Links resolve and no personal or secret data was found. The two new rulings (B-19 and B-20) are recorded once in 00 and applied where builders will look. The open items are the owner decisions in the README and the real-device and real-key checks above, which Phase 0 and the Phase 1–3 device passes already schedule. The set is ready for owner review.
