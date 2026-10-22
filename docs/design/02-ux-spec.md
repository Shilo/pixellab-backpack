# 02 — UX and Interaction Specification: PixelLab Backpack (formerly Vitrine)

> **API rules: superseded by P-16** (decision log). Sync, the key test, session-mode storage and the Settings rows that call PixelLab (§3.1–3.2, §3.12) follow the [MVP plan](../plan/mvp-plan.md)'s concern 2: no balance call, a first-page check per family on open, nothing again within an hour (P-2, P-3, P-5, P-21).

> **Superseded in part.** Layout/visual and viewer-control sections superseded by [08-simplicity-redesign.md](08-simplicity-redesign.md) (owner feedback 2026-10-19); behavior, data, security, and download semantics still apply. 08 §11 lists the affected sections.

Working name **Vitrine**, *Unofficial gallery for your PixelLab assets*. This document owns **what the app does and how it behaves**. Visual design (color, type, icon style, exact spacing) lives in `07-recommended-design.md`; it may restyle anything here, but may not change behavior, column counts, scaling rules, or control availability. The precedence order across docs and mockups is at the top of `00-decision-log.md` (B-5).

Baseline: `docs/reviews/R1-research-cross-review.md` (D1–D31), research `01`–`09`, the orchestrator rulings R-1 to R-10 and F-1 to F-16, and the builder answers B-1 to B-20, all listed in `00-decision-log.md`. Where this doc makes a new call it is marked **(decision)** with a one-line rationale.

## Changelog

**2026-10-18: final rulings applied** (IDs in `00-decision-log.md`).

| Area | Change | IDs |
|---|---|---|
| Naming | "Collections" → **Folders** (Favorites pinned first; route `#/folders`); "Animate" → **Play previews**; "token" → **PixelLab API key** in user-facing copy; "Images" chip gets the subtitle "Creator gallery" | F-7 |
| Viewer | Click, tap, Enter or Space opens the viewer at every size; no "current" state, no dwell prefetch | F-2 |
| Viewer controls | Inline compass; a filmstrip replaces the range scrubber; fps stepper always in the transport row; zoom `− [Fit · N×] +` (readout toggles Fit ↔ 1:1, the 1:1 button is gone); one Backdrop button with **5** swatches; control rows ≤ 960 px | F-4; E-3 |
| Downloads | One word, **Download** (no "Export"); ≤ 4 menu items per type; Info panel tiles; every multi-file output is one ZIP; multi-asset dialog with 3 described presets + Advanced (scale, GIF matte, file name); GIF uses the current speed | F-5; E-2, E-7, E-13 |
| Selection | Desktop ≥ 1200 px: summary panel while ≥ 2 selected; otherwise the bottom bar; the top contextual bar is removed | F-6; E-1 |
| Connect | API key auto-tests on paste; visible 3-step help; "Keep me signed in" offered after the first sync; Settings token controls reduced to status, Test, Keep signed in, Forget, rotate link ("Change token" removed) | F-10; E-10, E-11 |
| Chips | 8 chips; "Other" removed; its note moves to the end of All results and Settings › About; phone row 44 px on touch | F-8; E-19 |
| Previews | Play previews **on by default** with caps (≤ 8 playing, one low-priority detail fetch at a time); auto-off under reduced motion or Save-Data; Phase 0 trigger can flip the default | F-9; E-9, E-14 |
| Hand-offs | Labelled "Open in PixelLab ↗" + "More in PixelLab ▾" in the Info header (replaces the inspector's PixelLab section); "May use PixelLab credits" on generation tools | F-11 |
| Folders | 2×2 cover mosaics; Add to folder as popover or half sheet, never full screen | F-12; E-18 |
| Must-fix | Phone search keeps navigation; pill never covers content; 44 px touch targets; safe areas; forced-color swatches; focused ≠ selected; refit on resize and DPR; compact height → M; 200% text; path-first routes | F-13; E-17 |
| Delight | First-sync reveal; prev/next keeps animation + direction; idle sprite in empty states; "Synced just now" replaces the "Connected" toast | F-14; E-16 |
| Keymap | Space also opens a focused card; filmstrip owns its arrow keys; help overlay list spelled out (§9.5) | F-15 |
| Accuracy | Timing note narrowed to PixelLab's character and Creator players; "M = 3 columns on every phone" corrected; Undo claim corrected for folder delete | E-15 |
| Builder check (R4) | Download surfaces show counts without fetching to estimate, and Blob parts split by running size; every PixelLab link on `www.pixellab.ai`; coarse taps on tiles; Grid toggle in the Animation slot; Phase 1 "Download ZIP"; Rotations menu leads with PNG; "Download all {n}" = what is visible; Checker matte; tile families in the in-progress counts | B-6, B-8–B-15 |
| Final QA (R5) | In-progress chip reads "{n} generating ↗"; Phase 1 primary for an animated object with no rotation images is "Download sprite sheet" | B-19, B-20 |

## 0. Conventions

| Term | Meaning |
|---|---|
| Asset key | Opaque id used everywhere outside the API cache: base64url(SHA-256(`type:uuid`)) truncated to 12 chars (D13). `key6` = its first 6 chars. Raw UUIDs and media URLs never appear in the address bar, page title, logs, downloads, or copy-link features (R-9). |
| Card | One grid item. Characters: one card per `group_id` (base = `state_name` null, else oldest). Objects: one card per state row (R-7). |
| Viewer | Full-window modal `<dialog>` for one asset. Click, tap, Enter or Space on a card opens it (F-2). |
| Info panel (inspector) | Metadata + actions panel inside the viewer: docked right, bottom sheet, or compact-height overlay sheet (§1.2). The toggle is labelled **Info** (`I`). There is no separate grid-side inspector and no "current" card (F-2). |
| Form factors | **Phone** w < 600 · **Compact height** h < 480 (phone landscape) · **Tablet** 600–1199 · **Laptop** 1200–1599 · **Desktop** 1600–2559 · **Ultrawide** ≥ 2560 (CSS px). **Portrait aspect** = h ≥ w. |
| Fine / coarse | `(hover: hover) and (pointer: fine)` vs `(pointer: coarse)`. Hybrid devices (`any-pointer: fine`) get hover affordances and keep touch sizing. |
| Product name | "Vitrine" / `vitrine` in copy, keys, file names and the backup format is the working name, held in one constant (05 §2.1; B-7) |
| Source codes (§5) | **L** = list response at sync · **D** = REST detail GET on viewer open · **M** = read-only MCP call on viewer open · **H** = no-auth helper GET on `api.pixellab.ai/mcp/…` (sent without the token) · **X** = derived locally |

Sample names (Orb Mage, Bear Trap, Meadow Ruins…) come from `mockups/shared/sample-data.js`.

---

## 1. Information architecture and navigation

### 1.1 Destinations and routes

| Destination | Contains | Route (hash) |
|---|---|---|
| **Library** | Every completed asset; header (§1.3); in-progress chip | `#/` · `#/?type=characters` |
| **Folders** | Favorites tile (pinned first), folders A–Z, "New folder" | `#/folders` |
| Favorites | Grid with the Library header | `#/favorites` |
| Folder | Grid with the Library header + folder header (name, count, Download, ⋯) | `#/folder/<folderId>` (local random id) |
| Viewer | Modal over its parent grid | `<parent path>/a/<assetKey>?<parent query>&dir=south&anim=2&state=1`, e.g. `#/a/<key>?type=characters&dir=south`, `#/folder/<id>/a/<key>?dir=east` |
| Settings | Dialog (sheet on phone) | `#/settings` |
| Connect | First run / reconnect | `#/connect` (auto when no API key) |

Rules:
1. The viewer route nests under its parent, so reload keeps prev/next order and the grid behind it. **(decision)** It is the only way to restore list context without storing state. The path always comes first and the one query string last: the parent's `type` joins the viewer's `dir`, `anim` and `state` (F-13; matches 05 §9.1).
2. Direction, animation, state, and prev/next changes inside the viewer use `history.replace`. Back always returns to the grid in one step. **(decision)** Back should never walk through every asset viewed.
3. Search text, sort, and grid size are not in the URL. Sort and size persist in `localStorage`; search is per-view session state. **(decision)** It keeps user-typed prompt fragments out of history.
4. Back / Esc order: top menu or dialog → viewer → selection mode → previous route.
5. Page title: `{Destination} · Vitrine`; in the viewer, `{asset title} · Vitrine`. Names are not capabilities.
6. A viewer deep link to an unknown key waits for sync. If the key is still unknown after a complete sync: toast "That asset isn't in this library" and close to the parent.

### 1.2 Shell per form factor (mockup viewports in brackets)

Shell values, wireframes and the extended viewport set (412×915, 3440×1440, 1080×1920, foldables) are in 07 §2–§3.

| Form factor | Navigation | Top chrome | Default grid size (§4) | Viewer | Info panel | Selection | Settings |
|---|---|---|---|---|---|---|---|
| **Phone portrait** [360×780] | Floating pill, 2 labelled items: Library, Folders; round Search button beside it; safe-area padded (F-1) | App bar (title · Select · ⋯ · Settings) + one chip row. The result line and a **View** button (Sort, Grid size, Play previews) lead the grid and scroll with it (E-8). Search opens a bar above the pill (§1.3) | M → 3 cols | Full-screen; stage, then playback controls | Bottom sheet: peek (kicker + Open in PixelLab; actions row) → half → full; drag handle **and** expand button | Floating bar replaces the pill | Full-screen sheet |
| **Phone landscape / compact height** [780×360] (R-2) | Left rail 72 px, labelled: Library, Folders; rail bottom: Search, Select, Settings; safe-area-inset-left | No app bar. One slim row (chips · View · ⋯) that collapses on scroll down | M → 6 cols | Immersive full-bleed stage; overlay capsules fade after 3 s of no input while playing | Right overlay sheet (320 px) via Info | Floating bottom bar | Full-screen sheet |
| **Tablet portrait** [768×1024] | Left rail 80 px: Library, Folders; Settings at bottom | Top bar: title · search field · Select; chip row; toolbar row (result line · Sort · size · Play previews · ⋯); fixed | M → 5 cols | Full-window; stage, then controls | Bottom sheet (as phone) | Floating bottom bar | Dialog |
| **Tablet landscape** [1180×820] | Rail 80 px | As tablet portrait | L → 6 cols | Stage + controls left | Docked right 320 px, toggle with Info / `I` | Floating bottom bar | Dialog |
| **Laptop** [1440×900] | Sidebar 240 px: wordmark, Library, Folders (Favorites + folders inline, "New folder"); footer: sync status + Settings. Collapsible to the 80 px rail (persisted) | Top bar (title · search · Sort · size · Play previews · ⋯ · Select) + chip row + result line; fixed | L → 7 cols | As tablet landscape | Docked right 340 px | Bottom bar with 1 selected; summary panel (340) on the right with ≥ 2 (F-6, E-1) | Dialog |
| **Desktop** [1920×1080] | Sidebar | As laptop | L → 10 cols | As laptop | Docked right 360 px | Bar / summary panel (360) | Dialog |
| **Ultrawide** [2560×1080, 3440×1440] | Sidebar | As laptop | L → 14 cols (16 cap at 3440) | Stage gets the width; control rows ≤ 960 px, centred (F-4) | Docked right 360 px, text measure ≤ 65ch | Bar / summary panel (360) | Dialog |
| **Portrait monitor** [1080×1920] | Rail 80 px (tablet class) | As tablet portrait | L → 6 cols | Stage on top | Bottom sheet, opens at half (≥ 1200 px tall) | Floating bottom bar | Dialog |
| **Foldable** | Folded: phone. Unfolded: its width class (673×841 → rail, M → 4 cols). Dual-segment layouts deferred | — | — | — | — | — | — |

- **Compact-height rule:** any viewport with height < 480 uses the phone-landscape shell, whatever its width. **(decision)** Two panes are impractical below 480 px of height (Android window classes).
- **Info placement:** docked right when width ≥ 840 px and width > height; bottom sheet when height ≥ width or width < 840; compact height uses the right overlay sheet (E-4).
- The viewer is always a full-window modal. There is no persistent grid-side inspector on desktop. **(decision)** One viewer component for every size (D12); YAGNI. F-2 confirms it.
- Labels are always visible on bars and rails. **(decision)** Icon-only navigation is ambiguous on touch, where there are no tooltips.

### 1.3 Library header (also used by Favorites and folders)

| Control | Behavior |
|---|---|
| Search | §11. `/` focuses it. **Phone portrait:** the round Search button beside the pill opens a search bar directly above the pill, with a clear (✕) button and a visible **Cancel**. The pill stays visible and reachable. Cancel clears the query and closes the bar; blur with an empty field closes it; a non-empty query keeps the bar visible, so an active filter is never hidden (F-13, E-17). **Elsewhere:** a field in the top bar. At narrow widths or 200% text it collapses to an icon button that expands; it is never squeezed out (F-13). |
| Type chips | Single-select: **All · Characters · Objects · Images · Tilesets · Tiles · Maps · UI** (8; F-8). "Images" carries the tooltip and accessible description "Creator gallery" (F-7). Chips with no completed assets are hidden after a complete sync and shown during sync. "Images" also stays visible when the R-4 gate fails (§8). No counts on chips. **(decision)** Counts belong in the result line; minimal chips. In Favorites and folders, only types present appear. Phone: one row that scrolls sideways; chips are 44 px tall on touch. |
| Result + status line | "71 assets", then the sync status (§3.2: "Syncing… 340 of ~1,200" → "Synced just now"; "Offline · saved library" when offline) and an in-progress chip such as "2 generating ↗" (§8; B-19), hidden at zero. The status is a button with a 44 px hit area on touch. |
| Sort | Menu (§11.3). Phone and compact height: in the View sheet. |
| Grid size | S / M / L / XL. Tablet+: 4-stop slider (44 px hit area on touch). Phone and compact height: in the View sheet. `+` / `-`. Persisted. |
| **Play previews** | Toggle with the visible label "Play previews" (`aria-pressed`). **On by default** with caps (§4.8, F-9); an explicit choice persists. It pauses and resumes all grid motion (WCAG 2.2.2). Phone and compact height: a labelled switch in the View sheet. |
| View (phone, compact height) | Opens a sheet with Sort, Grid size and Play previews (E-8). |
| Select | Enters selection mode (§3.9); reads "Done" while selecting. In the app bar on phone and the rail on compact height. |
| ⋯ overflow | "Download all {n}…", "Sync now", "Keyboard shortcuts" (gestures on coarse pointers). "Download all {n}…" acts on exactly what is visible: the active chip and search inside this Library, Favorites or folder view, with {n} that count (B-13). |

---

## 2. Screen inventory

| # | Surface | Kind | Purpose | Contents | Opened from |
|---|---|---|---|---|---|
| S1 | Connect | Page | Enter and test the API key | Wordmark + descriptor, value line, three visible "Get your API key" steps with the account link, API key form (password field, Show), **Test key** button (fallback; the key auto-tests on paste), full-access note, privacy line, disclaimer | No API key; 401; Forget |
| S2 | Library | Page | Browse everything | Header §1.3, virtual grid, end-of-list line; in All with no search, the not-in-API note (§8) | Nav |
| S3 | Folders | Page | Organization hub | Favorites tile (2×2 mosaic, count, pinned first), folder tiles A–Z (2×2 mosaic cover, name, count, always-visible ⋯), "New folder" tile, backup tip when shown | Nav |
| S4 | Favorites | Page | Favorited assets | Header §1.3 + grid | Folders |
| S5 | Folder | Page | One folder | Folder header (Back on phone, name as h1, count, **Download**, one ⋯ with Rename/Delete), unavailable-items line, header §1.3, grid. No library sync line inside a folder | Folders, sidebar |
| S6 | Viewer | Modal dialog | View, play, inspect, act | Top bar (Close, title + state, prev/next, ⋯, Info), stage, dock (transport with filmstrip and fps stepper, inline compass, animation/state, zoom, Backdrop), Info panel | Card click/tap/Enter/Space, deep link |
| S7 | Info panel | Panel / sheet in S6 | Metadata + actions | Header (kicker, title, facts line, **Open in PixelLab ↗** + **More in PixelLab ▾**), actions row (Download ▾, Favorite, Add to folder), Download tiles, folder chips, per-type fields §5, Technical details (collapsed) | S6 |
| S8 | Download menu | Popover / action sheet | Quick downloads | ≤ 4 type formats with one-line descriptions, default first (§7.1) | Download ▾, `D`, card menu |
| S9 | Download dialog | Modal / sheet | Single-asset options or multi-asset download | Single ("Download options"): format list, scope, Advanced. Multi: 3 presets, Advanced (scale, GIF matte, file name), asset counts, parts notice (§7.6). Download / Cancel | "Download options…" link, selection, folder Download, "Download all {n}…" |
| S10 | Download progress chip | Persistent chip | Background download status | "Downloading 132 / 480 · 41 MB", Cancel | S9 |
| S11 | Ready sheet | Compact sheet (touch with share) | Save with user activation | File name + size, "Share or save…", "Download file", per-part buttons | Download complete on the Blob path |
| S12 | Download report | Dialog | Partial failure detail | Failed items (name, type, reason), Retry failed (retryable reasons only), Close | Report toast |
| S13 | Add to folder | Popover (fine) / half sheet (coarse); never full screen | Membership | "New folder" row (creates and checks in one step), folder checkboxes (tri-state for multi), filter field if > 8 folders, Done | Viewer, card menu, selection |
| S14 | Folder name | Small dialog | Create / rename | Name field (1–60 chars), Create / Save | Folders, S13, folder ⋯ |
| S15 | Confirm dialogs | Alert dialog | Destructive local actions | Delete folder; Forget key; Stop keeping you signed in | — |
| S16 | Settings | Dialog / sheet | Everything configurable | §3.12 sections | Gear |
| S17 | Help overlay | Dialog | Keys or gestures | Generated from §9 tables; notice when shortcuts are off | `?`, ⋯, Settings |
| S18 | Sync popover | Popover | Per-type sync detail | Per type: done / count / error + Retry; Sync now; last synced | Status line, sidebar footer |
| S19 | In-progress popover | Popover | Generating/review/failed counts | Rows per type with counts + "Open in PixelLab ↗" | In-progress chip |
| S20 | Card context menu | Menu | Card quick actions (fine pointer) | Open · Favorite · Download ▸ (the ≤ 4 S8 items) · Add to folder… · Remove from this folder (folder view) · Open in PixelLab ↗ · Select | Right-click, hover ⋯, Shift+F10 |
| S21 | Sort menu | Menu | Sort | §11.3 | Header, View sheet |
| S22 | Toasts | Status region | Feedback | Message + optional action (Undo, View report) | Actions |
| S23 | Import result | Dialog | Org import outcome | Counts, merged folders, orphaned items | Settings |
| S24 | "Keep me signed in" banner | Inline banner at the top of the grid | Opt in to staying signed in | Question, one-line risk note, Keep me signed in, Not now | First sync complete in session mode (§3.1) |
| S25 | Selection summary panel | Side panel (≥ 1200 px) | Bulk work with ≥ 2 selected | 3×3 mosaic, count, type breakdown, actions (no file or size estimate; B-6) | Selection mode (§3.9) |
| S26 | View sheet | Sheet (phone, compact height) | Library view options | Sort, Grid size, Play previews | View button |

---

## 3. Key flows

Counts are taps/clicks from the stated start; typing is not counted.

### 3.1 First run and connect

One screen (F-10).

1. App opens on Connect (S1). Fine pointers: focus is on the API key field. Coarse pointers: no autofocus, so the keyboard doesn't cover the form (E-11).
2. The three "Get your API key" steps are always visible, not behind a disclosure: open the PixelLab account page (`https://www.pixellab.ai/account`, new tab), tap **Copy API key**, come back and paste (§12.1). The same URL backs the 401 "Get a new API key ↗" link and the Settings rotate-key link. Every PixelLab website link uses `https://www.pixellab.ai/…` (B-8).
3. Paste the API key (focus + paste = 1–2 actions). Paste is never blocked (WCAG 3.3.8). The field is a real password form (hidden username "PixelLab API key", `autocomplete="current-password"`), so password managers can save and fill it (R1 finding S15).
4. **The key is tested as soon as it is pasted** → "Testing…" → `GET /v2/balance`. **Test key** (or Enter) does the same for a typed key.
   - 200 → route to Library and start the first sync at once (§3.2). There is no "Connected" toast; the status line reports progress (F-14). In session mode, store the non-secret flag `lastMode=session` so a later new tab can show "Welcome back" copy.
   - 401 → inline error (§12). The field keeps its value and is focused.
   - Offline (`navigator.onLine` false) → offline error.
   - `TypeError` while online → probe the same URL with `mode: 'no-cors'`. Opaque success → "PixelLab is blocking this browser" (CORS changed). Failure → generic network error. **(decision)** Two lines of code, and the only reliable way to tell users it isn't their fault.
5. The session runs in "This tab only" mode. When the **first sync completes**, a non-blocking banner (S24) asks "Keep me signed in on this device?" with **Keep me signed in** and **Not now**. Either answer hides it for good (non-secret flag); Settings keeps the toggle (E-10). The default stays session-only.

   | Mode | API key | Library snapshot + images | Org data + UI prefs | Startup |
   |---|---|---|---|---|
   | "This tab only" (default) | Memory + `sessionStorage` (this tab; a new tab may ask again) | Memory only (+ browser HTTP cache) | IndexedDB / `localStorage`, always | Full list sync each session (R-10) |
   | "Keep me signed in" (Remember mode) | `localStorage` | IndexedDB snapshot + Cache API | Same | Cached grid instantly, then background refresh |

**Total after the key is copied: 1 action on desktop (paste) / 2 taps on phone (field, Paste).** From landing on a phone, including the tab switch to PixelLab and back: **≤ 6 taps** (R2 §2 walkthrough baseline: 9).

### 3.2 First sync and later syncs (R-10)

1. Library shows the header and skeleton cards filling the viewport within 100 ms. Nothing blocks.
2. List requests start per type at the API concurrency limit (D25): REST lists at max page size; MCP `list_maps` pages; MCP `list_images` pages only when the R-4 gate has passed.
3. Each page streams in immediately, merged in sort order. Arriving cards fade in (opacity only, once per card; static under reduced motion) (F-14). While syncing, the first visible card stays anchored, so the grid never jumps under the user. At the top of the list, new items simply appear.
4. Status line: thin determinate bar + "Syncing… 340 of ~1,200". The total comes from each list's `total`/header and appears once known. Tap → sync popover (S18) with per-type progress.
5. The user can search, filter, open the viewer, favorite, and select at any time. While syncing, no-results states add "Still syncing, more may appear".
6. Done: the bar disappears, the status quietly reads "Synced just now", and empty-type chips hide. The in-progress chip appears if counts > 0. Announced: "Library synced. 1,204 assets." In session mode the first completed sync also shows the S24 banner once (§3.1).
7. Remember mode ("Keep me signed in"): the cached grid paints first; the same indicator reads "Checking for new assets…".
8. Re-sync triggers: app open, **Sync now** (overflow, popover, Settings), reconnect, and returning to a visible tab after more than 15 minutes. **(decision)** Users generate in PixelLab in another tab and come back; there is no polling.
9. Thumbnail work starts only for cards in or near the viewport (§4.7).

### 3.3 Browse, filter, search, sort

| Step | Action | Result | Count |
|---|---|---|---|
| 1 | Tap a chip (e.g. **Characters**) | Grid filters in place and scroll resets to top; `?type=` updates via `replace`; announce "3 characters" | 1 |
| 2 | Tap Search / press `/` | Field focuses (phone: the search bar opens above the pill; the pill stays) | 1 |
| 3 | Type "mage" | Results update after a 150 ms debounce, within the current chip and view; announce "2 results" after 500 ms idle | 0 |
| 4 | Tap Sort → **Name A–Z** (phone: View → Sort) | Re-sorts; persisted | 2 |
| 5 | Tap a tag chip in the Info panel | Closes the viewer; Library search becomes `#hero` | 1 |
| 6 | Esc in the search field | First Esc clears the text; second Esc blurs | — |
| 7 | Phone: **Cancel** | Clears the query and closes the search bar | 1 |

Scroll position and focus are restored per destination on Back and nav switches.

### 3.4 Open the viewer and navigate

1. Tap / click / Enter / Space on a card (1) → crossfade (cut under reduced motion) to S6. This holds at every size (F-2). In selection mode the same input toggles selection instead. Focus moves to the viewer title.
2. The static image is visible immediately from the list thumbnail. Detail (D/M) loads on open, unless a preview already fetched it (§4.8). It is never prefetched in the background, for neighbours, or on dwell (F-2).
3. Prev/next: swipe ←/→ at Fit, visible ‹ › buttons, or `←`/`→`. Order follows the parent grid's current chip, search, and sort. At the ends the button is disabled. The next asset keeps the current animation type and direction when it has them (F-14; §3.5).
4. Close: ×, Esc, Back, or swipe down at Fit. Focus returns to the card of the asset now shown, scrolled into view.

### 3.5 Playback (characters, objects, multi-frame images)

1. On open, the viewer selects the animation the card was previewing. Otherwise: the first animation whose name contains "idle" or "breath", else the first animation, else **Rotations**. Direction: south (or the only one). On prev/next, the current animation type (`animation_type`, else name) and direction carry over when the next asset has them, else these defaults apply (F-14).
2. It **autoplays** at the effective fps: 8 fps default (R-1) or the saved per-animation override. It opens paused under `prefers-reduced-motion`. Playback starts once the current direction's frames are decoded; until then the play button shows "Loading frames 3/8".
3. **Animation picker** (1 tap per switch): "Rotations" first (static pose per direction, transport hidden), then animations as "Walk · 8f". A segmented control when ≤ 4 entries fit, otherwise a menu. Switching resets to frame 0 and keeps play/pause.
4. **Compass** (1 tap): 3×3 grid, N at top, centre shows the current direction name (non-interactive). **(decision)** Play/pause already lives in the transport; a duplicate adds clutter. It sits **inline beside the transport** (F-4). On phone portrait and compact height, a Direction button ("E ▾") opens the same compass as a popover that closes on selection (E-3). Directions the asset or the current animation lacks are disabled. If the current direction is missing, it falls back to south, then the nearest available. Hidden for 1-direction assets. Switching keeps the frame index and play state. `[` / `]` rotate counter-clockwise / clockwise through available directions.
5. **State switcher** (characters; objects only if R-7 grouping exists): segmented control or menu, e.g. "Base · detailed robe". Keeps the direction. Keeps the animation if one with the same `animation_type` exists, else Rotations.
6. **Transport** (F-4): Play/Pause (Space) · Step back/forward (`,`/`.`; pauses) · **Filmstrip**, which replaces the range scrubber: one cell per frame of the current animation × direction, each integer-fit on the current backdrop; the current frame is ringed; click, tap, Enter or arrow keys seek and pause; it scrolls sideways for long animations and keeps the current frame in view · **fps stepper** "− 8 fps +", 1–30 fps, always visible in the transport row, with "Reset to 8 fps" while overridden. Overrides save per animation, keyed by a hash of the animation id, local only. On phone portrait the "8 fps" value stays in the row and opens the stepper (−, +, Reset, Loop) (E-3) · **Loop** toggle (on = loop, off = play once and stop on the last frame; Play restarts). Ping-pong deferred.
7. **Backdrop:** one button → 5 swatches (F-4): **Theme** (default), Checker, Light gray (N8), Mid gray (N5), Black. The choice applies for this session; the global default lives in Settings (C15). Values in 07 §5.3.
8. **Zoom:** `−` · readout · `+` (§6.3, F-4). The readout shows "Fit · 3×" or "4×"; clicking or tapping it toggles Fit ↔ 1:1 (`Z`). Double-tap/double-click toggles Fit ↔ the next step above Fit. Pinch zooms in integer steps, snapping when the gesture ends.
9. **Fullscreen** (`F`, desktop and iPadOS): Fullscreen API on the dialog. The control is hidden where unsupported (iPhone), where tapping the stage gives the immersive mode instead.
10. **Coarse taps (B-9):** on tilesets and Tiles Pro, tapping a tile shows its tile info and tapping the backdrop outside the art toggles chrome. On every other type, tapping the stage toggles chrome. Compact height starts immersive.
11. Control rows are at most 960 px wide and centred, so controls never spread across an ultrawide stage (F-4).

### 3.6 Inspect metadata

1. Docked (width ≥ 840 and landscape): the Info panel is open by default (persisted toggle, `I`).
2. Bottom sheet (phone, tablet portrait, portrait monitors): the sheet starts at peek (kicker + Open in PixelLab; actions row), or at half on screens ≥ 1200 px tall. Swipe up, tap the handle, or tap the expand button → half → full (1 tap).
3. Copy prompt (1) → toast "Prompt copied", button icon shows a check for 2 s.
4. **Technical details** disclosure (1) → masked asset ID + **Copy asset ID** with warning (R-9), source, status, last synced.

**J7 total: 2 clicks on desktop (open, copy) / 3 taps on phone (open, expand, copy).**

### 3.7 Favorite

| Entry | Gesture | Count |
|---|---|---|
| Card, fine pointer | Hover/focus → heart button | 1 |
| Card, keyboard | `L` on the focused card | 1 key |
| Viewer | Heart in the Info actions row, or `L` | 1 |
| Selection bar or summary panel | Favorite (all selected) / Unfavorite (if all selected are already favorites) | 1 |

The filled heart appears on the card immediately; the change persists to IndexedDB. Bulk shows a toast "Added 12 to Favorites". Single favorites show no toast (the state change is visible) but are announced.

### 3.8 Folders

| Task | Steps | Count |
|---|---|---|
| Create | Folders → **New folder** → name (prefilled "New folder", selected) → **Create**. Opens the new empty folder. | 3 |
| Add from card (fine) | Hover ⋯ / right-click → **Add to folder…** → check folder(s) → **Done** | 3–4 |
| Add from viewer | Actions row **Add to folder** → check → Done | 2–3 |
| Add from selection | Select … → **Add to folder** → check → Done → toast "Added 12 to Dungeon kit · Undo" | 3 + selection |
| Create while adding | In S13 → **New folder** row → name → Create (the folder is created and checked in one step) | +2 |
| Remove | Folder view: card ⋯ → **Remove from this folder**; or selection → **Remove from folder**; or uncheck in S13 → toast "Removed from Dungeon kit. It's still in your library. · Undo" | 2 |
| Rename | Folder ⋯ → **Rename** → edit → **Save** | 3 |
| Delete | Folder ⋯ → **Delete folder** → confirm → toast | 3 |
| Download folder | Folder header **Download** → S9 (multi) → **Download** | 2 (J3: 4 from Folders) |

- S13 is a popover anchored to its trigger on fine pointers and a half sheet on coarse pointers, never full screen (F-12).
- Checkboxes in S13 apply immediately and persist. **(decision)** No "save" step to forget; Done only closes.
- Multi-select S13 shows tri-state checkboxes (some selected assets are in the folder).
- Names: trimmed, 1–60 chars, unique case-insensitively ("You already have a folder with that name"). **(decision)** Duplicate names make Add-to-folder ambiguous.
- Folders sort A–Z on the Folders page and in the sidebar, after the pinned Favorites tile. **(decision)** Stable positions (NN/g stability rule); user pinning is cut.
- Cover = a 2×2 mosaic of the 4 most recently added items (fewer items leave empty quadrants); an empty folder shows a folder glyph. The Favorites tile uses the 4 newest favorites (F-12).
- Deleting a folder or removing an item **never** touches assets. Copy says so every time.
- Character membership is stored against the card's base-state key. Imported keys of non-base states map to their group card.
- Undo is a convenience; every membership change can also be reversed without it (WCAG 2.2.1). Deleting a folder always asks for confirmation first.

### 3.9 Selection mode and bulk actions (D29)

**Enter (F-6):**
1. **Select** button (all devices).
2. Long-press a card, coarse pointer: 500 ms with 10 px slop; selects that card (§9.4).
3. Fine pointer: click the hover checkbox, Ctrl/Cmd-click (toggle), or Shift-click (range from the last anchor).
4. Keyboard: `x` toggles the focused card; with shortcuts off, use **Select** then Enter/Space.

**In mode:** checkboxes visible on every card; tap/click/Enter/Space toggles; Ctrl/Cmd+A selects all in view (announced). The Select button reads "Done". Selected cards keep their captions; focused and selected look different (ring vs check + tint; §4.5).

**Container:**
- **Selection bar** (phone, tablet, and desktop while exactly 1 is selected): floating bottom bar with × Clear, "3 selected", and the actions. On phone it replaces the pill.
- **Selection summary panel** (≥ 1200 px with ≥ 2 selected; S25): slides in on the right and the bar hides. It shows a 3×3 mosaic of the selection (the last cell "+N"), the count, a breakdown by type ("3 characters (5 states) · 9 objects"), and the actions stacked. It shows no file or size estimate, because those would need detail fetches (B-6). Below 2 selected it slides out and the bar returns (E-1). The grid reflows once and keeps the focused card in view.
- Actions: **Download** (S9 multi; S8 when 1 is selected) · **Add to folder** · **Favorite / Unfavorite** · **Remove from folder** (folder view only) · **Select all in view**.
- Selection survives chip, search, and view changes. The bar or panel then shows "12 selected · 4 hidden by filter", and the download uses all 12.
- No cap.
- After an action the selection stays until cleared. **(decision)** Users often download and then file the same set.

**Exit:** × (bar or panel), Done, Esc, Back, or deselecting the last item.

### 3.10 Download

The user-facing word is always **Download** (F-5).

**Single asset (from the viewer):** the primary part of the Download split button gets the default output in one click ("Download GIF"); its ▾ opens the S8 menu (≤ 4 items); the Info panel shows the same items as tiles (F-5). File saved, or on touch with share support the S11 "Share or save…" step. The "Download options…" link under the tiles opens S9 for scopes, scale, GIF matte, file name, a PNG of the current frame, and the character's PixelLab sprite sheet (E-7).

**J1 "slime GIF for Discord":** Search (1) → type "slime" → card (2) → **Download GIF** (3) → phone only: **Share or save…** (4) → Discord in the OS share sheet. **3 clicks desktop / 4 taps phone**, using the default animation and direction. Choosing them first adds animation (1) + direction (1 on desktop with the inline compass, 2 on phone).

**J2 "whole character as a sprite sheet":** Characters (1) → card (2) → **Sprite sheet (ZIP)** tile (3). On phone: card → Download ▾ → **Sprite sheet (ZIP)**. The PixelLab original (ZIP) is in the same menu.

**Multi / bulk:** selection Download, folder **Download**, or ⋯ → **Download all {n}…** → S9 → **Download**. Progress runs in the background (S10). Details in §7.

**J5 "back up everything":** Library (All, no search) → ⋯ (1) → Download all 71… (2) → Download (3).

### 3.11 Hand-off to PixelLab (D21)

The Info panel header holds a labelled **Open in PixelLab ↗** button with a **More in PixelLab ▾** menu of tool links (F-11). This replaces the old inspector "PixelLab" section. The ▾ is hidden for types without tool links. Every tool that generates carries the note "May use PixelLab credits". A type's tier hint shows as one line under the header. Every link opens a new tab with `rel="noopener noreferrer"`, an ↗ glyph, and accessible text "(opens PixelLab in a new tab)". There is no confirm dialog. UUIDs in these URLs go only to `www.pixellab.ai`, the data owner (S12). Routes are unverified until P0-12: until its result lands every type uses its library page (B-1), and any route that fails P0-12 keeps that fallback.

| Type | "Open in PixelLab ↗" | "More in PixelLab ▾" tool links | Hint |
|---|---|---|---|
| Character | `/create-character/{id}` | Animate → `/create-character/{id}/add-animation`; New state → `/create-character/{id}/new-state`; both "May use PixelLab credits" | — |
| Object | `/create-object/{id}` | Animate → `/create-object/{id}/animate`; New state → `/create-object/{id}/new-state`; both "May use PixelLab credits" | — |
| Top-down tileset | `/maps/tilesets/{id}` | — | "May need a paid PixelLab plan" |
| Sidescroller tileset | `/maps?tab=tilesets` (no id route known) | — | same |
| Tiles Pro | `/maps/tiles/{id}` | — | same |
| Isometric tile | `/maps?tab=tiles` (no id route known) **(decision: closest library page; P0-12 to verify)** | — | same |
| Map | `/maps/{id}` after P0-12; until then `/maps` | — | same |
| UI asset | `/create-ui` + copy image | — | — |
| Image (Creator) | `/create` + copy image | Edit → `/create?tool=edit_image`; Animate → `/create?tool=animate_with_text`; Rotate → `/create?tool=generate_8_rotations_v3`, each with copy image and "May use PixelLab credits" **(decision: three tools that act on an existing image; the rest are create flows)** | — |

Copy-image hand-off: on the click, write the current frame PNG to the clipboard (`ClipboardItem` built synchronously with a Promise of the Blob, for Safari), open the tab, and toast "Image copied. Paste or drop it into PixelLab." On failure: "Couldn't copy the image. Download it and drop it into PixelLab." with a **Download PNG** action.

### 3.12 Settings (S16)

| Section | Items |
|---|---|
| **PixelLab connection** (F-10) | Status: "Connected · API key ending ••••a1b2" · plan, generations left, credits (`/v2/balance`) · **Test** (re-tests the saved key) · **Keep me signed in** toggle (on → moves the key to `localStorage` and starts persisting the library; off → confirm "Stop keeping you signed in?", then the key moves to `sessionStorage` and the snapshot + image cache are deleted immediately) · **Forget key** (confirm §12) · rotate-key link "Need to revoke this key? Generate a new API key in your PixelLab account ↗". To switch keys: Forget, then paste; a 401 opens the reconnect dialog. |
| **Library** | **Sync now** + "Last synced 2 min ago" · Play previews (mirrors the toolbar toggle) · Grid size · Default viewer backdrop (the 5 swatches) |
| **Appearance** | Theme: System / Light / Dark |
| **Keyboard** | **Single-key shortcuts** toggle (on by default; §9.6) · "Show shortcuts" |
| **Folders & favorites** | "5 folders · 10 favorites" · **Download backup (.json)** · **Import backup…** (merge; S23) · note "They live only in this browser. Download a backup now and then." |
| **Storage** | "Using 84 MB" (`navigator.storage.estimate`) · persistence status ("Protected from automatic clearing" / "May be cleared by the browser" + **Protect** → `persist()`) · **Clear saved images** (Remember mode only; keeps org). Session mode: "Nothing is saved between sessions in 'This tab only' mode." |
| **About** | Name + descriptor, version, disclaimer, privacy statement, source link, the not-in-the-public-API note with its PixelLab links (§12.3; F-8), licenses |

Org backup format: `{ app: "vitrine", version: 1, exportedAt, folders: [{ id, name, createdAt, items: [assetKey…] }], favorites: [assetKey…] }`. It holds opaque keys only (S4). Import validates `app`/`version`/shape and a ≤ 5 MB size, merges folders by name (case-insensitive union), unions favorites, never deletes, and reports orphaned keys. **(decision)** Merge-by-name avoids duplicate "Hero party" folders after a round trip.

### 3.13 Keyboard-only path (shortcuts off still works)

1. Tab → **Skip to library** link → Enter jumps to the grid.
2. Tab order: nav (pill/rail/sidebar) → search → chips (one tab stop; ←/→ move and select) → sort → grid size → Play previews → Select → ⋯ → grid.
3. The grid is one tab stop per card. Arrow keys move focus (Up/Down by a row), Home/End jump to first/last. Focusing a card plays its preview after 300 ms (§4.8).
4. Enter or Space → viewer; focus on the title. Tab cycles top bar → stage → playback controls → Info panel (header, actions, tiles) → fields. Focus is trapped in the dialog.
5. In the viewer, the focused widget owns its keys first (compass radiogroup arrows, filmstrip arrows, picker arrows, Backdrop swatch arrows). Global keys act only when focus is on the stage, title, or a non-arrow control.
6. Esc closes the viewer; focus returns to the card.
7. Selection: **Select** → arrows + Space to toggle → Tab to the selection bar or summary panel → Download / Add to folder.
8. Card actions without the viewer: Shift+F10 or the ContextMenu key opens S20.

### 3.14 Screen-reader path

1. Landmarks: `nav` (destinations, `aria-current="page"`), `main` with an h1 per destination ("Library", "Hero party"), `search`.
2. The chip row is a radiogroup labelled "Asset type". Changing it announces the result count. The "Images" chip's accessible description is "Creator gallery".
3. Grid: `role="list"` of cards with `aria-setsize`/`aria-posinset` (virtualized; C18). Each card is one link named "{title}, {type}, {badge text}{, favorite}{, selected}", e.g. "Orb Mage, character, 8 directions, favorite". Art `alt=""` inside the named link avoids double reading.
4. Hover-only buttons stay in the accessibility tree (labelled, `tabindex="-1"`), so virtual-cursor users can reach them.
5. Viewer: `<dialog aria-labelledby=title>`. On open: "{title}, dialog". Play button label toggles Play/Pause. The filmstrip is a radiogroup "Frame" of radios named "Frame 3 of 8". The fps stepper is a group "Playback speed" ("Slower", "Faster", "Reset to 8 fps"). Compass is a radiogroup "Direction" with disabled radios for missing directions. Animation picker is a radiogroup "Animation". Backdrop swatches are a radiogroup "Backdrop".
6. Status changes (sync, download, selection, copy, results) arrive through the live regions in §10.3; nothing visual-only.

---

## 4. Card anatomy and grid zoom (resolves R1 open issue 9)

### 4.1 Zoom levels

| Level | Min cell (CSS px) | Art-box inset | Nominal art box | Caption under stage | Badge chip |
|---|---|---|---|---|---|
| **S** | 72 | 4 | 64 | none | none (favorite heart only) |
| **M** | 104 | 4 | 96 | title, 1 line | short: glyph + one count ("6 anim", "8 frames", "16 tiles") |
| **L** | 144 | 8 | 128 | title + "{Type} · 64×64" | full: "8 dir · 6 anim · 2 states" |
| **XL** | 272 | 8 | 256 | title + "{Type} · 64×64" | full |

- Art boxes are multiples of 32 (and 16): 16/32/64 px art fills them exactly at DPR 1 and 2. **(decision)** These are the most common PixelLab canvas sizes.
- A 4 px inset clears the corner arc for card radii ≤ 12 px; no art pixel is ever clipped.
- Cells stretch to fill the row (`repeat(auto-fill, minmax(cell, 1fr))`). The art box = actual cell − 2 × inset, so actual k is ≥ the nominal examples. All cards in a row share one box, so same-size art renders identically.
- Row height is fixed per level (stage + caption) for windowed virtualization (D7).
- **Column cap 16:** if the count would exceed 16, use 16 and widen cells.
- Gaps / side gutters (layout defaults used for these counts; visual design may adjust gaps by ±4 px but must keep the counts): phone 8 / 12 · tablet 12 / 16 · laptop+ 12 / 24.
- Default level: **M below 840 px wide or below 480 px tall (compact height), L otherwise** (F-13). **(decision)** M gives 3 columns on phones 352–463 px wide (2 below that, e.g. 320 px reflow and folded cover screens) and 6 in phone landscape; L gives 6–16 on larger screens.

### 4.2 Columns per viewport

| Viewport | Content width | S | M | L | XL |
|---|---|---|---|---|---|
| 360×780 phone portrait | 336 | 4 | **3** (≈107 px) | 2 | 1 |
| 412×915 phone portrait | 388 | 4 | **3** (124 px) | 2 | 1 |
| 780×360 phone landscape (rail 72) | 684 | 8 | **6** | 4 | 2 |
| 844×390 phone landscape (rail 72) | 748 | 9 | **6** | 4 | 2 |
| 768×1024 tablet portrait (rail 80) | 656 | 7 | **5** | 4 | 2 |
| 1180×820 tablet landscape (rail 80) | 1068 | 12 | 9 | **6** | 3 |
| 1080×1920 portrait monitor (rail 80) | 968 | 11 | 8 | **6** | 3 |
| 1440×900 laptop (sidebar 240) | 1152 | 13 | 10 | **7** | 4 |
| 1920×1080 desktop (sidebar 240) | 1632 | 16 (cap) | 14 | **10** | 5 |
| 2560×1080 ultrawide (sidebar 240) | 2272 | 16 (cap) | 16 (cap) | **14** | 8 |
| 3440×1440 ultrawide (sidebar 240) | 3152 | 16 (cap) | 16 (cap) | **16** (cap, ≈186 px) | 11 |

With the selection summary panel open (≥ 2 selected), the laptop grid drops to 5 columns at L and the desktop grid to 8 (07 §2.2).

### 4.3 Scaling rules (D8, C6)

1. `k = floor(min(floor(boxW·DPR)/artW, floor(boxH·DPR)/artH))` device px per art px. CSS size = `art × k / DPR`, set via `width`/`height` with `image-rendering: pixelated`. This is `integerScale()` in `mockups/shared/pixel-utils.js`.
2. k < 1 (maps, UI, big sheets in small boxes): smooth whole-asset downscale (`image-rendering: auto`) plus a small **"fit"** marker. Never crop, never nearest-neighbour downscale.
3. Never use `transform`, `zoom`, `object-fit`, or `background-image` on art.
4. Characters and objects: the static thumbnail is trimmed to its alpha bounding box and bottom-aligned (G13). Everything else is untrimmed and centred. The viewer is never trimmed.
5. Re-fit on DPR change (browser zoom, monitor move), on container resize, **and** on window `resize`, because the `resolution` media query does not fire for every DPR change (F-13; R3b).

### 4.4 Worked examples (nominal art box; "k · CSS px"; "fit" = smooth downscale to the box)

**M (96 CSS px box), the phone/tablet default**

| Art px | DPR 1 | 1.25 | 1.5 | 2 | 3 |
|---|---|---|---|---|---|
| 16 | k6 · 96 | k7 · 89.6 | k9 · 96 | k12 · 96 | k18 · 96 |
| 32 | k3 · 96 | k3 · 76.8 | k4 · 85.3 | k6 · 96 | k9 · 96 |
| 48 | k2 · 96 | k2 · 76.8 | k3 · 96 | k4 · 96 | k6 · 96 |
| 64 | k1 · 64 | k1 · 51.2 | k2 · 85.3 | k3 · 96 | k4 · 85.3 |
| 92 | k1 · 92 | k1 · 73.6 | k1 · 61.3 | k2 · 92 | k3 · 92 |
| 128 | fit | fit | k1 · 85.3 | k1 · 64 | k2 · 85.3 |

**L (128 CSS px box), the larger-screen default**

| Art px | DPR 1 | 1.25 | 1.5 | 2 | 3 |
|---|---|---|---|---|---|
| 16 | k8 · 128 | k10 · 128 | k12 · 128 | k16 · 128 | k24 · 128 |
| 32 | k4 · 128 | k5 · 128 | k6 · 128 | k8 · 128 | k12 · 128 |
| 48 | k2 · 96 | k3 · 115.2 | k4 · 128 | k5 · 120 | k8 · 128 |
| 64 | k2 · 128 | k2 · 102.4 | k3 · 128 | k4 · 128 | k6 · 128 |
| 92 | k1 · 92 | k1 · 73.6 | k2 · 122.7 | k2 · 92 | k4 · 122.7 |
| 128 | k1 · 128 | k1 · 102.4 | k1 · 85.3 | k2 · 128 | k3 · 128 |

**S (64) and XL (256), compact form ("k" only)**

| Art px | S @1 / 1.25 / 1.5 / 2 / 3 | XL @1 / 1.25 / 1.5 / 2 / 3 |
|---|---|---|
| 16 | 4 / 5 / 6 / 8 / 12 | 16 / 20 / 24 / 32 / 48 |
| 32 | 2 / 2 / 3 / 4 / 6 | 8 / 10 / 12 / 16 / 24 |
| 48 | 1 / 1 / 2 / 2 / 4 | 5 / 6 / 8 / 10 / 16 |
| 64 | 1 / 1 / 1 / 2 / 3 | 4 / 5 / 6 / 8 / 12 |
| 92 | fit / fit / 1 / 1 / 2 | 2 / 3 / 4 / 5 / 8 |
| 128 | fit / fit / fit / 1 / 1 | 2 / 2 / 3 / 4 / 6 |

Reading: at DPR 1.5 a 32 px sprite in an M box gets k = 4, i.e. 128 device px = 85.3 CSS px. That is perfectly even, although it is not a whole CSS multiple (research 06 R3).

### 4.5 Card anatomy

| Zone | Always visible | Fine pointer hover / keyboard focus | Selection mode |
|---|---|---|---|
| Stage | Art on the shared art surface (a light-gray well in light mode; no checker in the grid; C15, F-3) | Hover: a 1px inner ring, never a tint, so the backdrop stays constant; preview plays after a 300 ms dwell. Focus: an outset ring around the whole card (stage + caption) | Selected: inset ring + filled check + caption tint (not color alone; distinct from focus; F-13) |
| Top-left | — | Checkbox (click = select) | Checkbox on every card |
| Top-right | Filled heart if favorited | Heart toggle button + ⋯ menu button | Hidden (the bar or panel has Favorite) |
| Bottom-left chip | Type glyph (mixed-type views only: All, Favorites, folders) + counts per §4.1; ▶ glyph prefix when animated | — | — |
| Bottom-right | "fit" marker when k < 1 (M and up) | — | — |
| Caption | Per §4.1; ellipsis; state appended for object states ("Bear Trap · open"); grows with text size (min-height, wraps to 2 lines at 200%) | Full title in a tooltip (fine pointer) | Stays visible on selected cards |

Card states are default, focused and selected; there is no "current" state (F-2). Values in 07 §4.3.

**Badge text per type (L/XL full · M short):**

| Type | Full | Short |
|---|---|---|
| Character | "8 dir · 6 anim · 2 states" (omit zero parts) | "6 anim" (else "8 dir") |
| Object | "8 dir · 3 anim" (anim only after detail is cached; the list has no animation info) | "8 dir" (hidden for 1 dir) |
| Image | "8 frames" (multi-frame only) | same |
| Tileset | "16 tiles · 16 px" | "16 tiles" |
| Tiles Pro | "16 variations · 32 px" | "16 var" |
| Isometric tile | "Block · 32 px" | "32 px" |
| Map | "48 × 32 cells" | "48×32" |
| UI | "688 × 384" | none |

- One tab stop per card: the link. Hover buttons are pointer conveniences (`tabindex="-1"`, labelled). Keyboard users reach the same actions through `L` / `D` / `x`, Shift+F10, Select mode, or the viewer. **(decision)** Three tab stops × hundreds of cards would make keyboard use unbearable.
- Coarse pointers get no per-card buttons: tap opens, long-press selects (C2, 2.5.8).

### 4.6 Card states

| State | Look | Behavior |
|---|---|---|
| Skeleton (not yet listed) | Neutral stage block + caption bar, no shimmer under reduced motion | Not focusable |
| Placeholder (listed, thumbnail pending) | Title text centred in the stage | Focusable; opens the viewer |
| Loaded | Art | — |
| Thumbnail failed | Broken-image glyph + title; accessible name adds "preview didn't load" | Viewer retries |
| Offline, not saved | Placeholder + small offline glyph | Viewer shows the offline state |
| Focused | Outset ring around stage + caption (§4.5) | Enter/Space opens; in selection mode toggles |
| Selected / unselected-in-mode | §4.5 | — |

### 4.7 Thumbnail sources (what loads, when)

| Type | Thumbnail | When fetched |
|---|---|---|
| Character | `preview_url` (south) from the list | Lazy `<img>` near the viewport |
| Object | `preview_url` (south, or the single view) | Same |
| UI | `image_url` | Same |
| Top-down tileset | Sheet via H `/mcp/tilesets/{id}/image?inline=true` | Same |
| Sidescroller tileset | Sheet via H `/mcp/sidescroller-tilesets/{id}/image` | Same |
| Isometric tile | H `/mcp/isometric-tile/{id}/download` | Same |
| Tiles Pro | First 4 variations as a 2×2 block (1 if n < 4) from D `GET /tiles-pro/{id}` `storage_urls` **(decision: one tile under-represents a set; 4 tiles are 3 extra cached media GETs)** | In view ≥ 300 ms |
| Image (Creator) | M `get_image(gallery ref, index 0)` → inline frame → Blob (D19; gated by R-4) | In view ≥ 300 ms; API semaphore |
| Map | M `view_map` render (R-6) | In view ≥ 300 ms; concurrency 1 (cost per P0-10); cancelled when scrolled away |

Cache per D15: Remember → Cache API / IndexedDB; Session → memory + HTTP cache. Images and maps have no version stamp, so the viewer ⋯ menu offers **Reload from PixelLab** for them. **(decision)** It is the only fix for overwritten gallery items and edited maps (P0-9 checks overwrites) without polling.

### 4.8 Preview animation policy (F-9)

| Context | Behavior |
|---|---|
| Default: **Play previews on** | In-view animated cards play on the shared ticker, **at most 8 at once** on every device, nearest the viewport centre first; the rest stay static. Preview detail fetches go through a low-priority queue, **one at a time**, for visible cards only, and are cancelled when the card leaves the window. Characters: idle/breath animation (else the first), south. Objects: the first animation (fetches detail). Images: frames. |
| Auto-off | Play previews starts **off** under `prefers-reduced-motion: reduce` or Save-Data (`navigator.connection.saveData`), unless the user has explicitly turned it on. An explicit choice persists and wins. |
| The toggle | "Play previews" (§1.3) pauses or resumes all grid motion at once. It is the WCAG 2.2.2 pause mechanism. |
| Fine pointer hover or keyboard focus | Plays that card after a 300 ms dwell; stops on leave/blur. Works with previews off too (user-initiated) and takes one of the 8 slots, stopping the player farthest from the centre (E-14). |
| Coarse pointer | No per-card play target; in-view previews (when on) and the viewer play |
| Tab hidden | All players pause |
| Timing | Effective fps per animation (8 default) |
| Phase 0 trigger | The default flips to **off** (one build constant) if P0-14 shows any read cost, or P0-8 hits a 429 at concurrency 2 or below (06 §2.3; E-9). |

---

## 5. Info panel per asset type (G21)

**Common layout, top to bottom:** header (kicker "{TYPE} · {STATE}", title, facts line such as "128 × 128 · 4 directions · 1 animation", **Open in PixelLab ↗** + **More in PixelLab ▾**, tier hint when one applies; §3.11, F-11) → actions row (Download ▾, Favorite, Add to folder) → **Download** tiles (§7.1) + "Download options…" link → "In folders" chips (tap opens the folder) → per-type fields (below) → **Technical details** (collapsed). On the phone sheet's peek, the title is dropped because the top bar shows it.

**Formatting:** sizes "64 × 64 px"; cells "48 × 32 cells"; full dates "Feb 3, 2026, 09:20" (local time, relative time in the tooltip); day-only dates "Sep 10, 2026"; API enums sentence-cased ("low top-down" → "Low top-down"); numbers grouped ("1,536"); technical values (sizes, seeds, counts, tile names) in mono. **Null or empty fields are hidden.** Copy buttons swap to a check for 2 s and announce "Copied". Field labels stack above their values when the panel is narrow or text is at 200% (F-13).

**Technical details (every type):** asset or gallery ID shown **masked** ("3f2a…9c1e") + **Copy asset ID** with the warning "Anyone with this ID can download this asset without signing in. Only share it with tools you trust." · Source (REST / MCP) · Status · Last synced · Saved on this device (Remember mode). No other raw UUIDs (group, animation, base tile ids) are shown. **(decision)** The masked display keeps IDs out of screenshots (C4); other ids have no user value.

### 5.1 Character

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | State | "Base" if `state_name` is null, else the state name; switcher when the group has > 1 state ("2 states") | L | — |
| 3 | Prompt | Full text block | L | ✓ |
| 4 | Canvas | "64 × 64 px" | L | — |
| 5 | Directions | "8 · S, SE, E, NE, N, NW, W, SW" / "4 · S, E, N, W" | L count, D names | — |
| 6 | View | "Low top-down" | L | — |
| 7 | Animations | Count (L); after D, rows "Walk · 8 frames · 4 directions" (tap plays it); "8–9 frames" if directions differ | L / D | — |
| 8 | Style | Outline / Shading / Detail rows | D `style_settings` | — |
| 9 | Guidance | number | D | — |
| 10 | AI freedom | integer | D | — |
| 11 | Template | "Mannequin" | L | — |
| 12 | Tags | Chips; tap → Library `#tag` search | L | — |
| 13 | Created | full date | L | — |
| 14 | Updated | full date; hidden if equal to Created | L | — |
| 15 | Playback | "8 fps (default)" or "12 fps (your setting) · Reset"; note "PixelLab doesn't say how fast animations play. 8 fps matches PixelLab's character and Creator players." (E-15) | X | — |
| T | Technical | + "Skeleton keypoints: included" when `skeletons` is non-null (D) | — | — |

Portraits and talking animations get no per-character row: R-5's one note lives at the end of All results and in Settings › About (E-19).

### 5.2 Object (map objects are indistinguishable in the list and appear as objects **(decision)**)

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` (caption appends the state) | L | — |
| 2 | State | `state_name` (hidden if null) | L | — |
| 3 | Prompt | block | L | ✓ |
| 4 | Canvas | "48 × 48 px" | L | — |
| 5 | Directions | "1 (single view)" / "8 · S, SE…" | L / D | — |
| 6 | View | "High top-down" | L | — |
| 7 | Animations | "Snap shut · 9 frames · 1 direction" + its description line | D | — |
| 8 | Style | Outline / Shading / Detail | D | — |
| 9 | Tags | chips → `#tag` | L | — |
| 10 | Created | full date | L | — |
| 11 | Playback | as character | X | — |
| — | States switcher | Only if P0-6 finds a grouping signal (R-7) | — | — |

### 5.3 Image (Creator gallery; gated by R-4)

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | First line of the description; "Untitled image" if none. (The API has no image names.) | L | — |
| 2 | Description | As returned; "(shortened by PixelLab)" when it ends in "..." | L | ✓ |
| 3 | Frame size | "128 × 128 px" (the listed size is per frame; 09 Q6) | L | — |
| 4 | Frames | "8" (hidden when 1) | L | — |
| 5 | Created | day-only date | L | — |
| 6 | Made on | "PixelLab website" (13-digit ref) / "PixelLab API" (UUID ref) | X | — |
| 7 | Playback | multi-frame only | X | — |
| T | Technical | Gallery ref masked + Copy asset ID; "Frames loaded 8 of 8" | M | — |

### 5.4 Top-down tileset

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Terrains | "Dirt → Grass" (lower → upper) | L | ✓ (copies lower, upper, transition) |
| 3 | Transition | `transition_description` | H metadata | — |
| 4 | Tile size | "16 × 16 px" | L | — |
| 5 | Tiles | "16 · 4 × 4 sheet" | H | — |
| 6 | View | "High top-down" | L | — |
| 7 | Transition size | "0.25" | H | — |
| 8 | Style | Outline / Shading / Detail | H | — |
| 9 | Generation | Tile strength · Tileset adherence · Text guidance scale · Adherence freedom | H | — |
| 10 | Created | full date | L | — |
| — | Tile info (viewer) | Hover/tap a tile: "wang_13 · NW upper, NE upper, SW lower, SE upper · x 16, y 0" | H | — |

### 5.5 Sidescroller tileset

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Terrain | `lower_description` | L | ✓ (terrain + top edge) |
| 3 | Top edge | `transition_description` | L | — |
| 4 | Tile size | "32 × 32 px" | L | — |
| 5 | Tiles | count | H | — |
| 6 | View | "Side (platformer)" | X | — |
| 7 | Created | full date | L | — |
| — | Tile info | name, corners, connection counts N/E/S/W | H | — |

### 5.6 Isometric tile

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Description | block | L | ✓ |
| 3 | Size | "32 px" | L | — |
| 4 | Shape | Thin / Thick / Block | L | — |
| 5 | Seed | number | M `get_isometric_tile` | ✓ |
| 6 | Created | full date | L | — |

### 5.7 Tiles Pro

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Description | block; the full text from M replaces the list text | L → M | ✓ |
| 3 | Kind | Tiles / Paths / Tileset / Coastline / Building | D | — |
| 4 | Tile type | "Square top-down" | L | — |
| 5 | Tile size | "32 × 32 px" | L | — |
| 6 | Variations | `n_tiles` | L | — |
| 7 | View | `tile_view` | L | — |
| 8 | Placement rules | "Corner · 4-sided · connects to other terrain · 16 of 16 tiles placed by rule" (from `tile_rules`) | D | — |
| 9 | Seed | number | M `get_tiles_pro` | ✓ |
| 10 | Created | full date | L | — |
| — | Tile info | "tile_5 · rule bits N, S" | D | — |

### 5.8 Map

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Size | "48 × 32 cells · 768 × 512 px" | L cells, M px | — |
| 3 | Tile size | "16 px" | M `get_map` | — |
| 4 | Terrains | "dirt, grass" (legend) | M `get_map` | — |
| 5 | Painted cells | "1,536" | M `get_map` | — |
| 6 | Placed objects | "3", expandable list: name · cell position · size · layer (no ids) | M `list_map_objects` | — |

No date row (maps have none). The MCP allowlist adds `get_map` and `list_map_objects`, both annotated `readOnlyHint: true` (S3 "read-only getters if used").

### 5.9 UI asset

| # | Field | Format | Src | Copy |
|---|---|---|---|---|
| 1 | Title | `name` | L | — |
| 2 | Prompt | block | L | ✓ |
| 3 | Size | "688 × 384 px" | L | — |
| 4 | Created | full date | L | — |
| — | Note | "PixelLab doesn't share the individual UI pieces." | X | — |

---

## 6. Viewer and playback

### 6.1 Zones

| Zone | Contents |
|---|---|
| Top bar | Close ×, title + state, ‹ › (fine pointer; on coarse pointers they sit at the stage edges, inset by the safe-area insets), position, ⋯ (Copy image, Copy prompt, Reload from PixelLab (images, maps), Grid (tilesets, Tiles Pro; B-10), Fullscreen, Keyboard shortcuts; on phone portrait also step and zoom; in compact height also Download…, step, Loop, zoom and Backdrop), Info toggle where the panel is docked or an overlay (with a bottom sheet, the handle and expand button do this; `I` cycles peek ↔ half) |
| Stage | Backdrop + art at integer zoom; overlays: grid / tile info (tilesets; grid off by default, tile labels only when a tile is drawn at ≥ 48 CSS px), pan area |
| Playback controls (dock) | Row 1, transport: step back · Play · step forward · **filmstrip** · **fps stepper** · Loop. Row 2: animation picker · state switcher · zoom `− [Fit · 3×] +` · **Backdrop** button. On tilesets and Tiles Pro the **Grid** toggle takes the animation picker's slot (B-10). The **compass** sits inline at the right, beside the transport (F-4). Rows are ≤ 960 px wide and centred. Phone portrait and compact height use the layouts in §3.5 and 07 §4.4. Controls that don't apply to a type are **hidden, not disabled** **(decision: fewer controls; disabled clutter teaches nothing)**. Exception: compass directions an asset lacks are shown disabled, so the shape stays legible. |
| Info panel | §5 |

### 6.2 Per-type controls

| Type | Picker | Compass | States | Transport | Extra |
|---|---|---|---|---|---|
| Character | Rotations + animations | 4/8 | if > 1 | when an animation is selected | — |
| Object | Rotations + animations | if 4/8 | R-7 only | when animated | — |
| Image | — | — | — | multi-frame only | — |
| Tilesets | — | — | — | — | **Grid** toggle (tile lines + `wang_N` labels) in the picker's dock slot and ⋯ (B-10); tile info |
| Tiles Pro | — | — | — | — | Variations laid out in √n columns; Grid toggle (as tilesets); tile info |
| Isometric | — | — | — | — | — |
| Map | — | — | — | — | Pan/zoom canvas; Fit default |
| UI | — | — | — | — | Pan when larger than the stage |

### 6.3 Zoom and pan

- Steps are CSS multiples **m ∈ {1, 2, 3, 4, 6, 8, 12, 16}**, rendered as integer **k = max(1, round(m × DPR))** device px per art px. Always crisp; on fractional DPR the size differs from m by < 0.5 device px per art pixel. **(decision)** Users think "2× as big"; the renderer needs integers.
- **Fit** = the largest integer k that fits the stage, or a smooth downscale (k < 1) for oversized art. **1:1** = m 1. The readout shows "Fit · 3×" or "4×"; activating it toggles Fit ↔ 1:1 (`Z`). There is no separate 1:1 button (F-4).
- `+`/`-` and the − / + buttons step through m. Wheel / trackpad pinch zooms around the cursor; touch pinch zooms around the midpoint and snaps to the nearest step when the gesture ends.
- Pan: drag (mouse or one finger) when the art exceeds the stage; **Shift+arrows** pan by 10% of the stage. Swipe-to-navigate works only at Fit.
- The stage has `touch-action: none`; the rest of the UI keeps browser pinch-zoom.

### 6.4 Loading and errors inside the viewer

| Situation | Behavior |
|---|---|
| Detail loading | Static list image shown; picker shows skeleton rows "Loading animations…" |
| Detail failed | Static image stays; inline "Couldn't load this asset's animations. [Try again]" |
| A direction has no frames | That compass direction is disabled; fallback per §3.5 |
| Frames decoding | Play button shows "Loading frames 3/8"; starts when the direction is complete |
| Offline, not saved | Static image if cached; "This animation isn't saved on this device. Connect to the internet to see it." |
| Asset vanished on re-sync | Viewer stays open with its cached data; actions needing the network show the standard error |

---

## 7. Downloads

The user-facing word is always **Download**, never "Export" (F-5). Internal module names (05 `export/`) are unaffected.

**"Multiple files" (F-5).** An output is *multiple files* when it produces more than one file: frames, a sprite sheet with its JSON, tiles, any multi-asset download, and PixelLab's own ZIPs. Multiple files always arrive as **one ZIP**, and their labels say "(ZIP)". A single PNG or a single GIF downloads directly as that file.

### 7.1 Download menu (S8) and Info tiles per type, default first

At most 4 items per type (F-5). Each item has a one-line description (§12.3). The Info panel shows the same items as tiles. The primary part of the Download split button gets the first item and names it ("Download GIF") (E-13). The GIF item always states that it uses the current playback speed. **Phase 1** ships no GIF: until GIF ships in Phase 2, the primary for animated types is "Download ZIP" (the PixelLab original) (B-11); for an animated object with no rotation images (1-direction) it is **"Download sprite sheet"**, PixelLab's official object sprite sheet (B-20).

| Type | Items (≤ 4) |
|---|---|
| Character / object with animations | **GIF** · {anim} · {dir} · {fps} fps (current animation and direction at the current speed) · **Sprite sheet (ZIP)** (PNG + JSON, everything for the current state) · **All frames (ZIP)** · **PixelLab original (ZIP)**¹. While **Rotations** is showing (no animation selected), **PNG** · this direction replaces the GIF item as the first item; the other items stay (B-12) |
| Character / object, still | **PNG** · this view · Sprite sheet (ZIP) (rotations) · All frames (ZIP) · PixelLab original (ZIP)¹ |
| Image, multi-frame | **GIF** · {fps} fps · PNG · this frame · Sprite sheet (ZIP) · All frames (ZIP) |
| Image, single · Isometric · Map · UI | **PNG** |
| Tileset | **PNG** · sheet · Sheet + metadata (ZIP) · Tiles (ZIP) |
| Tiles Pro | **Tiles (ZIP)** · PNG · this tile · Sheet + JSON (ZIP) · PixelLab original (ZIP)¹ |

**Download options…** (a link under the Info tiles, not a menu item; E-7) opens S9 for one asset: every format in §7.2, including PNG of the current frame for animated types and the character's PixelLab sprite sheet, plus Scope and Advanced (§7.6).

¹ Official exports (D18, R-8): character ZIP of all states (REST, no auth) in the menu, and the character sprite sheet in Download options; object sprite sheet (REST with bearer; shown only when the object has rotation images, except the 1-direction case in B-20); Tiles Pro ZIP (H). Files are saved under our slugged names, never PixelLab's `Content-Disposition` name (S9).

### 7.2 Download matrix

| Asset type | PNG (1× original bytes) | Upscale N× (2/4/8) | Sprite sheet (ZIP: PNG + JSON) | GIF | All frames (ZIP) | PixelLab original (ZIP) |
|---|---|---|---|---|---|---|
| Character | Current rotation or frame | PNG, sheet, GIF, frames | **Default for bulk.** Scope: this animation / everything (rotations + all animations) | **Default single** (animated): current anim + dir at the current speed; scope "Everything" → one GIF per animation × direction, in a ZIP | Rotations + animations, PixelLab layout | ZIP (all states); sprite sheet (this state, Download options) |
| Object | Current view or frame | ✓ | Rotations row + animation rows | When animated | ✓ | Sprite sheet (bearer) |
| Image, single | **Default** | ✓ | — | — | — | — (presigned URL never used; D19) |
| Image, multi-frame | Current frame | ✓ | 1-row strip + JSON | **Default** | `frames/frame_000.png…` | — |
| Tileset (top-down, sidescroller) | **Default**: sheet as returned | ✓ | Sheet + metadata (ZIP): sheet + PixelLab metadata JSON as returned (no Aseprite JSON: tiles aren't frames) | — | Tiles (ZIP): per-tile PNGs sliced by `bounding_box` + metadata | Same as "Sheet + metadata" |
| Tiles Pro | Current tile | ✓ | Sheet + JSON (ZIP): composed √n-column grid + JSON (tile names + rules) | — | **Default**: Tiles (ZIP), `tile_N.png` + `rules.json` | PixelLab ZIP |
| Isometric tile | **Default** | ✓ | — | — | — | — |
| Map | **Default**: `view_map` render | ✓ (device cap) | — | — | — | — (map export lives in PixelLab) |
| UI | **Default** | ✓ | — | — | — | — |

### 7.3 Format details (D17)

| Format | Rules |
|---|---|
| PNG 1× | Original source bytes (fetched Blob or decoded inline base64), never re-encoded |
| Upscale | Integer nearest-neighbour via `OffscreenCanvas` (smoothing off) in a worker. Scales whose output exceeds 16,777,216 px on iOS are disabled with "Too large for this device at 8×". |
| Sprite sheet | PixelLab layout: uniform cell = largest frame, frames centred, never rescaled; row 0 = rotations; then one row per animation × direction; columns = frames in order; unused cells transparent. Direction order follows the API's `rotation_urls` keys (south, west, east, north, south-east, north-east, north-west, south-west) **(decision: the API's own order is least surprising)**. Spacing 0. No power-of-two padding. Always delivered as a ZIP with its JSON. |
| Sheet JSON | Aseprite JSON hash: `frames` (`frame`, `spriteSourceSize`, `sourceSize`, `duration` ms from the effective fps, i.e. the current playback speed), `meta` (`app: "Vitrine"`, `image`, `size`, `scale`, `frameTags` named `{anim}_{dir}`) + an `animations` name → frame list map. No engine-compatibility claims. |
| GIF | Effective fps = the current playback speed (8 → 125 ms, or the user's override; F-5), cumulative centisecond rounding (8 fps → alternating 13/12 cs, never drifting), minimum 2 cs; loops forever; disposal 2; exact palette if ≤ 255 colors, else quantized (noted in the manifest). **Background: transparent, alpha ≥ 128 opaque** (Advanced "GIF matte": the current backdrop color; the Theme backdrop color while Checker is showing, B-14). **Scale: Auto** = smallest of 1/2/4/8 whose longest side ≥ 256 px (64 px → 4×, 32 → 8×, 128 → 2×). **Trim empty space: always on** (union alpha box across all frames). **(decision)** PixelLab canvases are 40–90% padding; untrimmed GIFs look tiny in chat. Sheets and frames stay untrimmed for engine alignment. |
| Frames | PixelLab ZIP layout: `rotations/{dir}.png`, `animations/{anim}/{dir}/frame_000.png` (3-digit, zero-based) |
| `metadata.json` (per asset in ZIPs; always included) | `app`, `exportedAt`, `type`, `name`, `state`, `prompt`/`description`, `size`, `directions`, `view`, `tags`, dates, `animations` (name, frames, directions, `fps`, `fpsSource: "default" or "user"`), `scale`, `files`. **No asset IDs or media URLs.** **(decision)** Downloaded ZIPs get shared publicly and IDs are permanent download keys; PixelLab's own original ZIPs pass through unchanged. |
| `manifest.json` (bulk root) | `app`, `exportedAt`, `scope`, `presets`, `scale`, `assets[]` (path, type, name, files), `errors[]` (name, type, reason). No IDs or URLs. |

### 7.4 Naming

- Slug = lowercase `[a-z0-9-]`, repeated dashes collapsed, ≤ 48 chars, fallback to the type ("image") (S9).
- Direction names use PixelLab's (`south-east`). Frames are 3-digit zero-based. Scale suffix `@{n}x` only when n > 1. The state slug is `state_name` or `base`.

| Output | Pattern | Example |
|---|---|---|
| Frame PNG | `{name}_{anim}_{dir}_{frame}.png` | `android-courier_walk_south_003.png` |
| Rotation PNG | `{name}_{dir}.png` | `orb-mage_south-east.png` |
| GIF | `{name}_{anim}_{dir}@{n}x.gif` | `bear-trap-open_snap-shut@4x.gif` (1-dir omits `_{dir}`) |
| Sprite sheet (ZIP) | `{name}_{scope}.zip` holding `{name}_{scope}.png` + `.json` (scope = anim slug or `all`) | `android-courier_all.zip` |
| All frames (ZIP) | `{name}_{scope}_frames.zip` | `android-courier_walk_frames.zip` |
| PixelLab originals | `{name}_pixellab.zip`, `{name}_pixellab-sheet.zip` | `orb-mage_pixellab.zip` |
| Multi-asset ZIP | `vitrine-{scope}-{YYYY-MM-DD}.zip` (scope = `library`, `characters`, `favorites`, `folder-{slug}`, `selection-{n}`); the archive name is editable under Advanced → File name, and is slugged on save | `vitrine-folder-hero-party-2026-10-18.zip` |

### 7.5 Multi-asset ZIP layout (R-8: one uniform client-built layout for every type)

Each download holds one preset's files (E-2), plus `metadata.json` per asset and `manifest.json` at the root. The tree shows every preset's files side by side, marked by preset.

```
vitrine-folder-dungeon-kit-2026-10-18.zip
├─ manifest.json
├─ characters/
│  └─ hooded-orb-mage--k3f9a2/           {name}--{key6}
│     ├─ metadata.json
│     ├─ base/                            one folder per state (all states included)
│     │  ├─ hooded-orb-mage_all.png       Sprite sheets
│     │  ├─ hooded-orb-mage_all.json
│     │  ├─ rotations/south.png …         All frames
│     │  ├─ animations/walk/south/frame_000.png …
│     │  └─ gifs/hooded-orb-mage_walk_south@4x.gif …   GIFs
│     └─ detailed-robe/ …
├─ objects/bear-trap-open--…/ (same structure, no state folders)
├─ images/slime-menagerie--…/slime-menagerie.png | frames/ | sheet | gif
├─ tilesets/dirt-grass--…/sheet.png + pixellab-metadata.json [+ tiles/wang_00.png …]
├─ tiles/wooden-stairs-kit--…/tile_00.png … + rules.json
├─ tiles/grass-block--…/grass-block.png
├─ maps/meadow-ruins--…/meadow-ruins.png
└─ ui/fantasy-mmo-hud--…/fantasy-mmo-hud.png
```

### 7.6 Download dialog (S9): choice first, Advanced collapsed

| Part | Single asset ("Download options") | Multi-asset |
|---|---|---|
| Title | "Download Orb Mage" | "Download 12 assets" + "3 characters (5 states) · 5 objects · 4 images" (type words singular/plural: tileset/tilesets, tile/tiles) |
| **Choice** (first) | Radio rows of every format that applies (§7.2), each with a one-line description; the GIF row states the current playback speed ("8 fps, current speed") | **3 preset radio cards**, each with a one-line description (§12.3): **Sprite sheets** (default) · **All frames** · **GIFs** (F-5, E-2). Sprite sheets = sheet + JSON for characters, objects and multi-frame images, sheet + metadata for tilesets, Tiles (ZIP) for Tiles Pro, PNG for stills. All frames = every frame and still as PNG. GIFs = one per animation × direction at its playback speed; stills as PNG. |
| Scope | This animation / Everything (animated types) | All states of every character are included |
| Advanced ▸ (collapsed `<details>`) | **Scale** (Auto for GIF, 1×, 2×, 4×, 8×) · **GIF matte** (Transparent / current backdrop colour) · **File name** (archive or file name, editable, slugged on save) | Same |
| Counts (B-6) | No figures until this asset's details are loaded (they usually are, from the viewer). Then file and size figures come only from details and media already loaded ("34 files · about 2.1 MB"). Nothing is fetched to estimate | Asset counts only: the title's "Download 12 assets" and its breakdown, no file or MB estimate. On the Blob path, upfront: "Large downloads may be saved in parts." |
| Buttons | **Download** (primary) · Cancel | Same |
| Memory | Last choices remembered separately for single and multi (`localStorage`) | — |

Always fixed (no knobs): GIFs loop and are trimmed; sheets have no spacing; `metadata.json` is included.

### 7.7 Progress, saving, limits

1. **Chromium (desktop 86+, Android 132+):** Download → `showSaveFilePicker` immediately (user gesture) → stream with client-zip.
2. **Other browsers:** build in memory. Desktop: auto-download on completion. Coarse pointer with `navigator.canShare({files})`: the compact S11 "Ready" sheet with **Share or save…** (share sheet; needs the fresh tap) and **Download file**.
3. **Parts (Blob path; B-6):** the dialog says upfront "Large downloads may be saved in parts." During the build a running byte count closes the current part at an asset boundary before it would pass the part cap (300 MB iOS, 1 GB elsewhere; tuning values, G17). Parts build one at a time; each needs its own Save tap on iOS.
4. **Progress chip S10:** "Downloading 132 / 480 · 41 MB" + Cancel. Browsing continues. A `beforeunload` warning is active while running.
5. **One download at a time.** A second request gets: "A download is already running. Wait for it to finish or cancel it."
6. **Cancel:** aborts fetches, aborts the writable stream (discarding the partial file), toast "Download canceled. Nothing was saved."
7. **Partial failure:** the archive always completes. `manifest.json` lists errors. A non-blocking toast "Downloaded 478 assets. 2 couldn't be downloaded. [View report]" → S12 with name, type, reason, and **Retry failed** (a new download of just those; not offered for assets no longer in PixelLab).
8. **Total failure** (nothing downloaded): error toast with the reason + Retry.

---

## 8. States

| State | Trigger | User sees | Actions |
|---|---|---|---|
| Shell loading | App boot | Header + skeleton grid (no spinner) | — |
| No API key | First run, Forget, new session-mode tab | S1 Connect | Paste (auto-test) · Test key |
| New tab, session mode | `lastMode=session` flag present, no key | Connect with "Welcome back! Your API key was kept for one tab only, so paste it again here." | Paste |
| Testing key | Key pasted, Test key or Enter | Button "Testing…", field read-only | — |
| Invalid API key (test) | 401 on `/v2/balance` | Inline error under the field | Edit, retry |
| API key stopped working | 401 mid-session | All requests stop; the key is cleared everywhere (S2); reconnect dialog over the dimmed library, with "Get a new API key ↗". Org data and library cache are kept. **(decision)** The usual cause is rotation on the same account. | Paste a new key |
| CORS blocked | Online `TypeError` + opaque no-cors probe success | Full-width state "PixelLab is blocking this browser" | Try again |
| First sync | §3.2 | Skeleton + streaming cards (fade in) + progress | Use the app normally |
| Keep-me-signed-in offer | First sync complete, session mode, not yet answered | S24 banner at the top of the grid | Keep me signed in · Not now |
| Background refresh | Remember-mode start, re-sync | Cached grid + "Checking for new assets…" | — |
| Partial sync | A type failed after retries | Warning chip "Some assets didn't load" → S18 lists the failed types | Retry per type |
| Rate limited | ≥ 2 consecutive 429s | Status "PixelLab asked us to slow down. Continuing shortly…" | — (automatic backoff) |
| Generating / review / failed | Non-completed rows in lists (C10): characters, objects and UI, plus tilesets, isometric tiles and Tiles Pro when their rows carry `status` (B-15) | Chip "3 generating ↗" → S19: "Objects · 1 generating · 1 needs review → Open Objects in PixelLab ↗". Never shown as cards. | Hand-off |
| Empty library | 0 completed after a complete sync | "Nothing here yet" (or "still being made" if anything is generating) | Open PixelLab ↗ · Sync again |
| No folders | Folders with 0 folders | Favorites tile + "Group assets by game or project…" | New folder |
| Empty folder | 0 items | "This folder is empty" + a tiny idle sprite from the library when one is available (F-14) | Go to Library |
| Empty favorites | 0 favorites | "No favorites yet" + idle sprite when available | — |
| No results | Search/chip gives 0 | "No matches for "slime" in Characters" + idle sprite when available (+ Images truncation note when relevant, + the not-in-API hint when the query names fonts, effects, portraits or talking animations, + "Still syncing, more may appear") | Clear search · Search all types |
| End of results | Bottom of the grid | "That's everything · 71 assets" | — |
| **Not in the public API** (R-5, F-8) | End of All results with no search; also Settings › About | The note "Other PixelLab content isn't in the public API yet" with links: Fonts → `/create?tool=generate_font`, Effects → `/create-vfx`, Portraits → `/create?tool=portrait_character`, Talking animations → `/create?tool=vocal_animation` | Links ↗ |
| **Images gate failed** (R-4) | `VITE_IMAGES=false`: P0-9 fails, approval A1 is declined, or P0-14 shows spend; also the default until Phase 0 results land (B-1) | "Images" chip stays; content area shows "Creator images aren't available yet" + reason + "Open your Creator gallery in PixelLab ↗". No `list_images` call, no placeholder cards. **(decision)** Pixel-less cards add nothing; one honest pattern for unavailable content. | Link ↗ |
| Thumbnail pending | Image/map not rendered yet | Title text in the stage (R-6) | — |
| Thumbnail failed | Media error | §4.6 | Viewer retries |
| Offline, cached | Remember mode, offline | Banner "You're offline. Showing your saved library."; the status line reads "Offline · saved library" (E-16); unsaved thumbnails are placeholders; downloads skip unsaved files and list them as failed | Auto-retry on `online` |
| Offline, not cached | Session mode or empty cache | Full state "You're offline" | Try again |
| Folder has unavailable items | After a **complete** sync, folder/favorite keys not in the library | "1 item in this folder isn't in your PixelLab library anymore." | Remove them |
| Download running / partial / failed / canceled | §7.7 | S10 / toast + S12 / error toast / toast | Cancel · View report · Retry failed |
| Backup tip | `persisted()` false and (≥ 1 folder or ≥ 5 favorites); at most once a week; Folders page | Dismissible tip "Your folders and favorites live only in this browser…" | Download backup · Protect · Not now |
| Storage full | `QuotaExceededError` | Image cache evicted first; toast "This device is low on storage. Vitrine cleared saved images; your folders and favorites are safe." | — |
| Import result | Settings import | S23 counts and orphans; invalid file: "That file isn't a Vitrine backup." | OK |
| Viewer deep link unknown | §1.1 rule 6 | Toast "That asset isn't in this library" | — |

---

## 9. Gestures and keymap

### 9.1 Touch

| Context | Gesture | Action | Visible alternative (2.5.1 / 2.5.7) |
|---|---|---|---|
| Grid | Tap | Open viewer | — |
| Grid | Long-press 500 ms | Enter selection + select | Select button |
| Grid, selecting | Tap | Toggle | Checkbox |
| Grid | Pinch | **Browser zoom (not captured)** | Grid size control |
| Viewer at Fit | Swipe ← / → | Next / previous asset | ‹ › buttons |
| Viewer at Fit | Swipe ↓ | Close | × |
| Viewer | Swipe ↑ (portrait) | Expand Info sheet | Handle / expand button |
| Viewer | Tap stage (tilesets, Tiles Pro: the backdrop outside the art) | Toggle chrome | — (chrome returns on any tap) |
| Viewer, tileset or Tiles Pro | Tap a tile | Show its tile info (B-9) | Hover (fine pointer) |
| Viewer | Double-tap | Fit ↔ next zoom step | Zoom readout / + buttons |
| Viewer | Pinch | Integer zoom (snap at end) | − / + buttons |
| Viewer zoomed | One-finger drag | Pan | Shift+arrows (keyboard) |
| Filmstrip | Tap a frame | Seek to it (pauses) | Step buttons, arrow keys |
| Filmstrip | Swipe sideways | Scroll the strip (never changes asset) | Arrow keys |
| Sheet | Drag handle | Peek / half / full | Tap handle cycles; expand button |

Horizontal swipe on the stage navigates assets and never rotates direction. **(decision)** It is universal muscle memory (research 04); direction has the compass and `[`/`]`.

### 9.2 Pointer

A click on a card opens the viewer at every size (F-2). Hover plays previews (§4.8) and reveals the card checkbox, heart, and ⋯. Right-click opens S20. Ctrl/Cmd-click toggles selection, Shift-click selects a range. The wheel zooms the viewer stage around the cursor. Middle-click on a card opens the viewer route in a new tab (the card is a real link; in session mode that tab may ask for the API key).

### 9.3 Keymap (C17 + additions)

"Single" = printable single-character key, disabled when **Single-key shortcuts** is off (WCAG 2.1.4). Keys never fire while focus is in a text field. Browser keys (Ctrl/Cmd +/-/F/K) are never taken over.

| Key | Context | Action | Single |
|---|---|---|---|
| `/` | Anywhere | Focus search | ✓ |
| `?` | Anywhere | Help overlay | ✓ |
| Esc | Search field | Clear, then blur | — |
| Esc | Menu / dialog / viewer / selection | Close the top layer (§1.1 rule 4) | — |
| Arrows | Grid | Move focus (Up/Down by a row) | — |
| Home / End | Grid | First / last item | — |
| Enter / Space | Card | Open the viewer (selection mode: toggle) (F-2) | — |
| `x` | Card | Toggle selection (enters mode) **(decision: added; keyboard parity with long-press)** | ✓ |
| Ctrl/Cmd+A | Grid | Select all in view | — |
| Shift+F10 / ContextMenu | Card | Card menu S20 | — |
| `L` | Card, viewer, selection | Favorite toggle | ✓ |
| `D` | Card, viewer, selection | Download menu (≤ 4 items) / Download dialog (selection) | ✓ |
| `+` / `-` | Grid / viewer | Grid size / zoom | ✓ |
| `Z` | Viewer | Fit ↔ 1:1, same as activating the zoom readout **(decision: added; macOS Photos convention)** | ✓ |
| ← / → | Viewer (focus not in an arrow-owning widget) | Previous / next asset | — |
| Arrows / Home / End | Filmstrip (focused) | Previous / next / first / last frame (pauses) | — |
| Shift+arrows | Viewer stage | Pan | — |
| Space | Viewer (focus on stage/title) | Play / pause (never overrides a focused button) | — |
| `,` / `.` | Viewer | Frame back / forward (pauses) | ✓ |
| `[` / `]` | Viewer | Direction counter-clockwise / clockwise | ✓ |
| Home / End | Viewer stage | First / last frame | — |
| `I` | Viewer | Toggle the Info panel (bottom sheet: peek ↔ half) | ✓ |
| `F` | Viewer | Fullscreen | ✓ |

No key belonged to a removed feature, so the map is otherwise unchanged (F-15).

### 9.4 Long-press on link cards (G20)

- Cards always have `-webkit-touch-callout: none` and `user-select: none`. Card images are `draggable="false"`. This suppresses the iOS link preview/callout and the image save sheet.
- On `pointerType: touch`, the `contextmenu` event is cancelled (Android menu). Mouse right-click still opens S20.
- Timer: `pointerdown` starts 500 ms; cancel on move > 10 px, `pointerup`, or `pointercancel`. On fire: enter mode, select the card, suppress the following `click`. Nothing destructive fires on a long-press (2.5.2).
- Must be verified on real iOS and Android devices in Phase 1.

### 9.5 Help overlay (S17)

A modal generated from §9.1 / §9.3, with tabs **Keys** and **Gestures**. Coarse pointers open on Gestures; fine pointers open on Keys. When shortcuts are off, a banner reads "Single-key shortcuts are off. Turn them on in Settings." and affected keys are shown struck through with "(off)". The list (F-15):

| Group | Keys tab | Gestures tab |
|---|---|---|
| Library | `/` Search · `?` This help · Arrows Move between cards · Home / End First / last card · Enter or Space Open · `x` Select · Ctrl/Cmd+A Select all in view · `L` Favorite · `D` Download · `+` / `-` Grid size · Shift+F10 Card menu · Esc Clear search, close, or leave selection | Tap Open · Long-press Select · Pinch Browser zoom (grid size has its own control) |
| Viewer | ← / → Previous / next asset · Space Play / pause · `,` / `.` Frame back / forward · Home / End First / last frame · `[` / `]` Turn direction · `+` / `-` Zoom · `Z` Fit ↔ actual size · Shift+arrows Pan · `I` Info panel · `F` Fullscreen · `L` Favorite · `D` Download · Esc Close | Swipe ← / → Next / previous asset · Swipe ↓ Close · Swipe ↑ Show info · Tap a frame Jump to it · Double-tap Zoom · Pinch Zoom · Drag Pan (when zoomed) · Tap the stage Show or hide controls |

### 9.6 What "Single-key shortcuts: off" disables

Every ✓ row in §9.3: `/ ? x L D + - Z , . [ ] I F`. It keeps Esc, Tab, Enter, Space, arrows, Home/End, Shift+arrows, Ctrl/Cmd+A, Shift+F10, and all pointer/touch input. Every disabled function stays reachable through a visible control (2.1.1).

---

## 10. Accessibility (WCAG 2.2 AA; D28)

### 10.1 Criteria mapped to features

| SC | Requirement in Vitrine |
|---|---|
| 1.1.1 | Card link names (§3.14); art `alt=""` inside named links; viewer stage `role="img"` labelled "{title}, {animation}, {direction}, frame 3 of 8" (updated on pause, not per frame) |
| 1.3.1 | Landmarks, one h1 per destination, list semantics for grids, Info panel key–value pairs as `<dl>` |
| 1.4.1 | Selected = check + inset ring + caption tint; focused = outset ring; favorite = filled heart; active chip = check + fill |
| 1.4.3 / 1.4.11 | Owned by visual design (07 §5.4, computed): text ≥ 4.5:1, UI and focus ≥ 3:1, in both themes and over every backdrop |
| 1.4.4 / 1.4.10 / 1.4.12 | 200% text without loss: search stays reachable (it collapses to an icon button, never squeezed out), captions grow, Info labels stack above values (F-13); reflow at 320 px uses the phone shell (the zoomed stage may pan in 2D, an allowed exception); text-spacing overrides don't clip captions |
| 1.4.13 | Tooltips dismissible with Esc, hoverable, persistent while hovered |
| 2.1.1 / 2.1.2 | Everything keyboard-operable (§3.13); dialogs trap focus but always close with Esc |
| 2.1.4 | Single-key shortcuts toggle (§9.6) |
| 2.2.1 | No time limits; Undo toasts are conveniences (§3.8); toasts with actions stay ≥ 10 s and pause on hover/focus; the immersive-chrome fade never happens while focus is inside the controls |
| 2.2.2 | "Play previews" pauses all grid motion at once; it starts off under reduced motion or Save-Data (F-9); hover play stops on leave; viewer pause always visible; reduced motion opens the viewer paused |
| 2.4.1 | "Skip to library" link |
| 2.4.2 | Titles per route (§1.1) |
| 2.4.3 / 2.4.7 | Logical order; visible `outline` focus ring (survives forced colors) |
| 2.4.11 | `scroll-padding` equal to sticky bar heights; bottom scroll padding = pill height + offset + safe-area inset (+ the search bar while open), so the pill never covers content (F-13); focused cards are never hidden under bars |
| 2.5.1 / 2.5.7 | Every swipe, pinch, and drag has a button (§9.1); no drag-only action exists |
| 2.5.2 | Activation on up-events; long-press does nothing destructive |
| 2.5.3 | Visible labels are contained in accessible names ("Play previews", "Select", "Download", "Open in PixelLab") |
| 2.5.8 | ≥ 24 × 24 px everywhere; 44 × 44 on coarse pointers, including chips, the sync status, the size slider, compass cells, filmstrip cells, the fps stepper, zoom and backdrop swatches (F-13) |
| 3.2.1 / 3.2.2 | Focus never changes context; chips filter in place; links that leave the app are labelled |
| 3.3.1 / 3.3.2 / 3.3.8 | API key field labelled, errors in text tied via `aria-describedby`, paste allowed, password managers supported |
| 4.1.2 | `aria-pressed` (heart, Play previews, Loop, Grid, Info), `aria-checked` (selection, S13), radiogroups (chips, compass, picker, filmstrip, backdrop swatches), `aria-current` (nav), `aria-expanded` (disclosures, sheet) |
| 4.1.3 | Live regions (§10.3) |
| Forced colors | Outlines for focus; cards and chips keep system-color borders; the stage **and** the backdrop swatch fills use `forced-color-adjust: none`, and every swatch keeps a ring and a visible label (F-13) |
| Safe areas | `viewport-fit=cover`; top bar, rail, pill, search bar, selection bar, sheet actions, landscape ‹ › and capsules pad `env(safe-area-inset-*)` (F-13) |
| Reduced motion | Crossfades become cuts; no skeleton shimmer; the first-sync reveal is static; viewer opens paused; Play previews starts off; no smooth scroll |

### 10.2 Focus management

| Event | Focus goes to | On close / return |
|---|---|---|
| Route change (nav) | Destination h1 (`tabindex="-1"`) | Restored scroll + last focused card when returning |
| Viewer open | Viewer title | Card of the asset now shown (scrolled into view first) |
| Prev/next in viewer | Stays on the control used; title text updates | — |
| Sheet / dialog open | First field, or the dialog title if there is none | Invoking control |
| Menu open | First item (roving focus) | Invoking button |
| Folder deleted | Folders h1 | — |
| Summary panel opens or closes | Stays on the card being toggled | — |
| Keep-me-signed-in banner appears | Unchanged (announced politely once) | — |
| Item removed from the current folder view | Next card, else previous, else h1 | — |
| Selection exit | Last focused card | — |
| 401 reconnect dialog | API key field | First card after reconnect |
| Download report open | Its title | The toast's origin or main |

### 10.3 Live announcements

Two regions: `polite` (default) and `assertive` (401 and download total failure only).

| Event | Text (polite unless noted) |
|---|---|
| Sync start / 50% / end | "Syncing your library" · "Halfway there" · "Library synced. 1,204 assets." |
| Sync problem | "Maps couldn't be loaded" |
| Chip / search change | "24 results" (500 ms after the last keystroke) |
| Selection | "Selection mode. 1 selected." · "3 selected" · "Selection cleared" |
| Favorite | "Added to favorites" / "Removed from favorites" |
| Folder ops | Toast text |
| Copy | "Prompt copied" / "Asset ID copied" / "Image copied" |
| Download | "Downloading 12 assets" · at 25/50/75% "Download 50% done" · "Download finished. 2 items failed." |
| Keep-me-signed-in offer | "Keep me signed in on this device? Choose Keep me signed in or Not now." (once) |
| API key invalid mid-session | (assertive) "Your PixelLab API key stopped working. Reconnect to continue." |
| Playback | None per frame; play/pause state via the button label |

---

## 11. Search and sort

### 11.1 Searchable fields (local only, over synced list data; no API search calls) (G19)

| Type | Fields |
|---|---|
| All | Title, type label ("character", "tileset"…), size token ("64x64" and "64×64") |
| Character | name, prompt, tags, state names (all states in the group), view, template |
| Object | name, prompt, tags, state name, view |
| Image | description (as returned; truncated by PixelLab), size, "animated" when frames > 1 |
| Tileset | name, lower/upper/transition descriptions, view |
| Tiles Pro | name, description, tile type |
| Isometric | name, description, shape |
| Map | name |
| UI | name, prompt |

Detail-only fields (animation names, style, seed) are not searchable. **(decision)** Results must not depend on which viewers the user happened to open.

### 11.2 Matching

- Case- and diacritic-insensitive substring match. Whitespace-separated terms are ANDed. No fuzzy matching.
- `#term` matches tags exactly (characters, objects). A tag chip in the Info panel runs this search. **(decision)** Tags are read-only and filterable (R1) without another filter UI.
- Scope = the current view and chip. "Search all types" switches the chip to All.
- 150 ms debounce; ≤ 50 ms filtering for 5,000 records.

### 11.3 Sorts (one global choice, persisted)

| Sort | Rule |
|---|---|
| **Newest** (default) | `created_at` desc. Images have day precision: ties keep list order. Maps have no date: they sort after dated items, in PixelLab's "recently edited" order. |
| Oldest | Reverse; undated maps last |
| Name A–Z / Z–A | Locale-aware, numeric-aware ("Item 2" < "Item 10") |
| Largest / Smallest | Canvas area (frame size for images, sheet for tilesets, px for maps); ties by Newest |
| Recently updated | **Characters chip only** (the only type with `updated_at`). Switching chips falls back to Newest. **(decision)** It honours the brief ("where available") without a misleading global sort (C20). |

---

## 12. Microcopy

Voice: friendly, short, plain. No jargon ("API key", not "bearer credential"). User-facing copy says "API key", PixelLab's own word; "secret token" appears once, in the Connect help (F-7). Never blame the user. "PixelLab" always appears as plain text.

### 12.1 Connect

| Slot | Copy |
|---|---|
| Heading | Your PixelLab art, all in one place |
| Value line | Vitrine shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything. |
| Steps heading | Get your API key |
| Step 1 | Open your PixelLab account page ↗ (sign in if PixelLab asks). |
| Step 2 | Tap **Copy API key**. It's a secret token, so keep it private, like a password. |
| Step 3 | Come back to this tab and paste it below. |
| Field label | PixelLab API key |
| Placeholder | Paste your API key |
| Field helper | We test it as soon as you paste it. |
| Reveal | Show / Hide |
| Button | Test key · Testing… |
| Full-access note | Heads up: PixelLab API keys give full access to your account, including spending credits. Vitrine only reads. |
| Privacy line | Your API key goes only to PixelLab's API. Vitrine has no servers and no analytics. |
| Disclaimer | Unofficial. Not affiliated with or endorsed by PixelLab. |
| Welcome back | Welcome back! Your API key was kept for one tab only, so paste it again here. |
| Keep-signed-in banner (S24) | **Keep me signed in on this device?** You won't need to paste your API key again in this browser. Don't use this on a shared computer. [Keep me signed in] [Not now] |
| Keep signed in helper, off (Settings) | Kept in this tab only. You'll paste it again in a new tab. |
| Keep signed in helper, on (Settings) | Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers. |

### 12.2 Errors

| Situation | Copy |
|---|---|
| Empty field | Paste your API key first. |
| Invalid API key | That API key didn't work. Copy it again from your PixelLab account page and paste it here. |
| Offline | You're offline. Connect to the internet and try again. |
| CORS blocked | PixelLab is blocking this browser. PixelLab may have changed how its API works with websites. Nothing is wrong with your account. [Try again] |
| Network | Couldn't reach PixelLab. Check your connection and try again. |
| Busy (429 at test) | PixelLab is busy. Try again in a moment. |
| API key stopped working | **Reconnect to PixelLab.** Your API key stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe. [Get a new API key ↗] |
| Partial sync | Some assets didn't load. · {Maps} couldn't be loaded. [Retry] |
| Rate limited | PixelLab asked us to slow down. Continuing shortly… |
| Viewer detail failed | Couldn't load this asset's animations. [Try again] |
| Not saved offline | This animation isn't saved on this device. Connect to the internet to see it. |
| Unknown deep link | That asset isn't in this library. |
| Download failure reasons | Not found in PixelLab. It may have been deleted. · Network problem. · Too large for this device at {n}×. Try a smaller scale. · PixelLab didn't send this file. |
| Download summary | Downloaded {n} assets. {m} couldn't be downloaded. [View report] |
| Download canceled | Download canceled. Nothing was saved. |
| Download busy | A download is already running. Wait for it to finish or cancel it. |
| Import invalid | That file isn't a Vitrine backup. |
| Storage full | This device is low on storage. Vitrine cleared saved images; your folders and favorites are safe. |
| Copy image failed | Couldn't copy the image. Download it and drop it into PixelLab. [Download PNG] |

### 12.3 Empty and informational states

| State | Copy |
|---|---|
| Empty library | **Nothing here yet.** Create something in PixelLab and it'll show up here. [Open PixelLab ↗] [Sync again] |
| Still generating | **Almost there.** Your first assets are still being made in PixelLab. Check back in a minute. [Sync again] |
| No folders | Group assets by game or project. Folders live in this browser only. [New folder] |
| Empty folder | **This folder is empty.** Select assets in your library, then choose Add to folder. [Go to Library] |
| Empty favorites | **No favorites yet.** Use the heart on any asset to keep it here. |
| No results | **No matches for "{q}"{ in Type}.** Try fewer words, or search all types. [Clear search] [Search all types] |
| Images truncation note | Image descriptions from PixelLab are shortened, so some words can't be found. |
| Not-in-API hint (no results) | Looking for fonts or effects? They aren't in PixelLab's public API yet. |
| End of list | That's everything · {n} assets |
| Not-in-API note (end of All; Settings › About) | **Other PixelLab content isn't in the public API yet.** Fonts, effects, portraits and talking animations can't be read through PixelLab's public API, so Vitrine can't show them. Find them in PixelLab: Fonts ↗ · Effects ↗ · Portraits ↗ · Talking animations ↗ |
| Images gate fallback | **Creator images aren't available yet.** The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now. [Open your Creator gallery in PixelLab ↗] |
| Unavailable folder items | {n} item(s) in this folder aren't in your PixelLab library anymore. [Remove them] |
| Backup tip | Your folders and favorites live only in this browser, and browsers sometimes clear site data. Download a backup to keep them safe. [Download backup] [Not now] |
| Offline banner | You're offline. Showing your saved library. |
| Offline, nothing saved | **You're offline.** Connect to the internet to load your PixelLab library. [Try again] |
| Status line | Syncing… {loaded} of ~{total} · Synced just now · Checking for new assets… · Offline · saved library |
| Timing note | PixelLab doesn't say how fast animations play. 8 fps matches PixelLab's character and Creator players. |
| UI pieces note | PixelLab doesn't share the individual UI pieces. |
| Tier hint | Opening in PixelLab may need a paid plan. |
| Credit hint (generation tools) | May use PixelLab credits |
| Leaving (accessible suffix) | (opens PixelLab in a new tab) |

**Download descriptions** (menu rows, Info tiles, dialog; F-5):

| Item | Description |
|---|---|
| GIF | Animated loop at the current speed ({fps} fps), sized for chat. |
| PNG · this frame / this view | Original pixels, one image. |
| Sprite sheet (ZIP) | One PNG sheet + JSON frame data. |
| All frames (ZIP) | Every frame as its own PNG. |
| PixelLab original (ZIP) | PixelLab's own file, unchanged. |
| Sheet + metadata (ZIP) | The tileset sheet + PixelLab's tile data. |
| Tiles (ZIP) | Each tile as its own PNG. |
| Preset: Sprite sheets | A PNG sheet + JSON per asset; tilesets as returned; stills as PNG. |
| Preset: All frames | Every frame and still as its own PNG. |
| Preset: GIFs | One GIF per animation and direction at its playback speed; stills as PNG. |

### 12.4 Confirmations and toasts

| Slot | Copy |
|---|---|
| Forget key | **Forget your API key?** Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected. ☐ Also delete my folders and favorites. *Your browser may still keep some images in its own cache. Clear your browsing data to remove them.* [Forget key] [Cancel] |
| Stop keeping you signed in | **Stop keeping you signed in?** Vitrine will delete your saved API key and its saved copy of your library from this browser. You'll stay connected in this tab. [Stop] [Cancel] |
| Delete folder | **Delete "{folder}"?** The {n} assets in it stay in your library. Only the folder goes away. [Delete folder] [Cancel] |
| Duplicate folder name | You already have a folder with that name. |
| Rotate-key link | Need to revoke this key? Generate a new API key in your PixelLab account ↗ |
| Copy asset ID warning | Anyone with this ID can download this asset without signing in. Only share it with tools you trust. |
| Forgotten | API key forgotten. |
| Added to folder | Added {n} to {folder}. [Undo] |
| Removed from folder | Removed from {folder}. It's still in your library. [Undo] |
| Folder deleted | Deleted "{folder}". Your assets are untouched. [Undo] |
| Bulk favorite | Added {n} to Favorites. |
| Copied | Prompt copied · Asset ID copied · Image copied. Paste or drop it into PixelLab. |
| Import done | Imported {f} folders ({m} merged) and {n} favorites. {k} items aren't in this library. |
| About disclaimer | Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab. |
| About privacy | No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host. |
