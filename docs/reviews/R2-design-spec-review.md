# R2: Design Spec Review (01–04)

Review date: 2026-10-18. Reviewer roles: a devil's advocate combining three views: a first-time, non-technical hobby game dev on a phone; a senior UX lead focused on simplicity; and a pragmatic KISS/YAGNI engineer.
Inputs: `docs/design/01`–`04`, read in full. Also skimmed `docs/reviews/R1-research-cross-review.md` and `docs/research/03-pixellab-website-gallery-audit.md`, and spot-checked `docs/research/02` (the account-page wording) and `docs/research/09` (playback timing). The mockups themselves were not reviewed.

---

## Verdict

- **The foundation is right.** Two destinations, one grid, integer scaling, presets-first export and honest states all hold up. The grid arithmetic is correct: I recomputed all 28 column counts in 02 §4.2 (all correct) and spot-checked 04's per-option tables (they match).
- **The spec is built for completeness and auditability, not for the first five minutes.** A first-time phone user needs about **21 taps** and hits about **11 moments of doubt** between landing and saving a GIF (§2). Nine of those taps come before any art appears. The spec's own targets (Connect 3 + J1 5) leave this out: they start counting after the key is copied, and they assume the default animation and direction are the ones the user wants.
- **The biggest risks:**
  - Token onboarding: the app's term doesn't match PixelLab's, the Remember decision comes too early, and session mode makes users paste again on every visit.
  - The "Animate" toggle label collides with PixelLab's paid Animate tool.
  - The viewer is a cockpit: about 33 controls on desktop, about 18 on a phone.
  - The character Download menu has 8 items, with look-alike duplicates.
- **The designers' own phone wireframes show that 02's phone header doesn't fit.** A3, B3 and C3 all drop the labelled Animate toggle and the sort/size control.
- **Option A, the recommended base, carries the deviation that hurts intuitiveness most** (V1: a click makes a card "current" instead of opening it). Drop it.
- **20 changes should land before the mockup review** (§6). None of them weakens safety, the view-only guard, paid-credit control or any **(req)** item.

---

## 1. Top 10 problems

### 1. Connecting is harder than the spec admits, and it uses the wrong word

- **Evidence:**
  - 02 §12.1 says "PixelLab API token" and "token" throughout. PixelLab's account page labels it **"Copy API key" / "Generate new API key"** (research 02, account-page bundle). Users are sent to find a word that isn't on the page.
  - Every first-timer needs the help steps, yet they sit behind an "optional" disclosure (02 §3.1 step 2).
  - The Remember choice comes on the first screen, before the user has seen any value. Its helper warns about shared computers, right next to a "can spend credits" note and the "Unofficial" disclaimer (02 §12.1). That is two warnings and a disclaimer before the first asset.
  - The session default means pasting again in every new tab (02 §8 "New tab, session mode"), and middle-clicking a card into a new tab may ask for the token (02 §9.2). Each session also re-runs the full sync (02 §3.1 table).
  - Settings holds six token controls: the Remember toggle, the Stop-remembering confirm, Change token (inline field + Test), Forget (+ checkbox), Clear saved images, and the revoke link (02 §3.12).
  - The success metric starts counting after the token has been copied (01 §9).
- **Who it hurts:** the phone hobbyist most (tab switching, the keyboard covering Connect), and every returning user in session mode.
- **Fix:**
  - Say "API key" everywhere.
  - Show the three steps inline, with a primary button "Get my API key from PixelLab ↗".
  - Test the key automatically on paste.
  - Connect in session mode, then after the first sync show a one-time banner: "Stay connected on this device? [Yes] [Not now]". The default and the security posture stay as they are.
  - Cut "Change token". The existing 401 reconnect dialog covers rotation, and Forget + paste covers everything else.
  - Replace the Stop-remembering confirm with a toast. The action is reversible, and the cache can be synced again.
  - Don't autofocus the field on coarse pointers.

### 2. "Animate" means two opposite things, and the grid never moves on phones

- **Evidence:**
  - The toolbar toggle is labelled "Animate" (02 §1.3). The inspector's "Animate ↗" link opens PixelLab's add-animation tool, a generation flow that spends credits (02 §3.11; 04 A1 "PixelLab: Animate ^").
  - Previews are off by default (02 §4.8; 01 §8 R-3), and coarse pointers get no hover play. On a phone, nothing in the grid ever moves unless the user finds the toggle.
  - WCAG 2.2.2 requires a pause mechanism, not default-off. The real constraint is read cost (R1 C2), which Phase 0 G2/G3 will measure.
- **Who it hurts:** the hobbyist (the gallery feels dead, and the label suggests spending credits), and trust in the view-only promise.
- **Fix:**
  - Rename the toggle **"Play previews"** (▶ + label, at every size).
  - Decide the default after Phase 0. If reads are free and the rate limits tolerate it, turn previews **ON**, with the existing 8 (coarse) / 24 (fine) caps and off under reduced motion. Otherwise keep them off.
  - Either way, add delight #2 (§3).

### 3. The viewer is a cockpit

- **Evidence:**
  - The A2 desktop viewer shows **about 33 interactive targets** at once (04 §1.3 A2, §1.4 dock rows):
    - 5 in the top bar
    - 6 in transport
    - 13 in the context row: picker, compass, 7 backdrop swatches, Fit, 1:1, −, +
    - about 9 in the inspector
  - The A4 phone viewer shows **about 18 targets**, and the art gets roughly a third of the height.
  - Zoom alone is five elements: Fit, 1:1, −, + and the readout (02 §3.5 step 8, §6.3).
  - All three options lay the backdrops out as inline swatches (04 A context row, B and C stage toolbars).
- **Who it hurts:** everyone who opens an asset just to look at it, which is the most common action. Phone users most.
- **Fix:**
  - One Backdrop button that opens a popover with 5 swatches (consistency #1).
  - Zoom becomes `− [Fit · 3×] +`, where tapping the readout toggles Fit ↔ 1:1. Cut the 1:1 button and the `Z` key.
  - Loop moves into the speed popover, renamed "Speed & loop".
  - The phone dock becomes one row: Play · scrubber · Animation ▾ · Direction ▾ · ⋯. The ⋯ holds speed, loop, step, zoom and backdrop.
  - On touch, the compass popover closes on selection.
  - Every (req) control stays one tap away.

### 4. The Download menu and the Export dialog read like a committee list

- **Evidence:**
  - The character menu has **8 entries** (02 §7.1), including two pairs that look the same to a user:
    - "Sprite sheet + JSON · all animations" vs "PixelLab sprite sheet"
    - "Frames ZIP" vs "PixelLab ZIP (all states)". 02 §7.3 itself says Frames ZIP uses PixelLab's ZIP layout.
  - The multi-asset preset "Game-ready" (02 §7.6) implies an engine-compatibility claim that 01 §5 and 02 §7.3 forbid.
  - Advanced has 6 knobs: scale, GIF background, GIF loop, trim, sheet spacing and "include metadata.json". No requirement asks for loop-once, spacing or the metadata toggle.
  - The single-asset scope "Animation: current / all / everything" separates "all" from "everything" only by whether rotations are included.
  - One action has two verbs: "Download" (viewer, selection bar) and "Export" (folder header, the "Export all in view…" overflow item, the dialog title) (02 §1.3, §3.8, §3.9, §7.6). "In view" also reads as "on screen".
  - Single outputs with several files are undefined. "Sprite sheet + JSON" names two files (02 §7.4) and no ZIP. Browsers raise a "download multiple files" prompt, and iOS needs two saves.
- **Who it hurts:**
  - The hobbyist: too many choices.
  - The game dev: which sheet is the real one?
- **Fix:**
  - The menu shows at most 4 items + More options: **GIF · PNG · Sprite sheet (ZIP) · All frames (ZIP)**. PixelLab originals move into More options.
  - Any output with more than one file is delivered as one ZIP.
  - Presets become "Sprite sheets · Frames · GIFs".
  - Scope becomes "This animation / Everything".
  - Advanced becomes Scale · GIF background · Trim. metadata.json is always included, loop-once and spacing are deferred, and the filename preview moves into Advanced.
  - Use one verb: **Download**, e.g. "Download all 71…".

### 5. Nine chips, one of them fake, and some vanish under your thumb

- **Evidence:**
  - There are 9 chips (02 §1.3). At the coarse-pointer chip spec (36 tall, 12 px padding, ~14 px text; 04 §1.4), they total **about 690 px in a 336 px row** at 360×780. Tilesets, Tiles, Maps, UI and Other start off-screen.
  - "Other" is always shown and filters nothing; it opens an info card. That is exactly the "empty chips" anti-goal in 01 §6.
  - "Images" also stays visible, showing a fallback card, when the gate fails (02 §8).
  - Chips "are hidden after a complete sync and shown during sync" (02 §1.3), so a chip can vanish just as the user goes to tap it.
  - "Images" is not PixelLab's word ("Creator").
  - Novices can't see the difference between "Tiles" and "Tilesets", and a Tiles Pro asset of kind "Tileset" lives under Tiles (02 §5.7 #3).
- **Who it hurts:** phone users and novices.
- **Fix:**
  - Cut "Other". Its sentence moves to the end-of-list line, the existing no-results hint, and About.
  - Rename "Images" to **"Creator"**.
  - Merge Tilesets and Tiles into **"Tiles"**; the caption and badge already tell them apart. The owner may veto this to mirror PixelLab's Map Workshop tabs.
  - A chip appears when its type's first asset arrives, and never disappears mid-session.
  - If the Images gate fails, hide the chip and explain why in the end-of-list line.
  - Result: at most 7 chips, and a typical user sees 4–5.

### 6. The phone header doesn't fit, and the wireframes prove it

- **Evidence:**
  - 02 §1.2 stacks three rows plus a bottom bar on a phone, which takes about 140 px at the top and 56 at the bottom, plus safe areas, before any content:
    - the app bar
    - the chip row
    - a toolbar row holding the result line, sync status, in-progress chip, labelled Animate, grid-size menu and ⋯
    - the bottom bar
  - The toolbar row's contents need more than 336 px.
  - All three phone wireframes quietly drop that row (04 §1.3, §2.3, §3.3), contradicting both their own layout tables and 02's visible-label rule (02 §1.3; §10.1 SC 2.5.3):
    - **A3** puts an icon-only `[>]` and ⋯ in the top bar and has no sort or size control.
    - **B3** squeezes `[>][..]` into the chip row.
    - **C3** puts an icon-only `[>]` in the app bar.
  - 01 §6 claims "one toolbar".
  - "2 in PixelLab" (02 §1.3) is cryptic.
- **Who it hurts:** phone users: less art per screen, and unlabelled controls.
- **Fix:**
  - The phone header becomes the app bar (title · Search · Select · ⋯) plus the chip row.
  - Sort, size and Play previews go into one "View" sheet (A already merges sort and size).
  - The result and sync line becomes the first line of the grid and scrolls away, as A already does at 780×360.
  - "2 in PixelLab" becomes "2 still generating".

### 7. Terminology drift

| Concept | Names in use | Where |
|---|---|---|
| Organization destination | "Collections" (nav), "folder" (every UI string), "boards" (B), and a "COLLECTIONS" header over Favorites + folders | 02 §1.1, §12; 04 §2.4 S13 note |
| Creator gallery | "Images" chip, "Creator images" (gate copy), "Image (Creator)", "Creator gallery" | 02 §1.3, §3.11, §8, §12.3 |
| Credential | "token" (Vitrine) vs "API key" (PixelLab's own page) | 02 §12.1; research 02 |
| Preview toggle | "Animate" (toolbar) vs "Animate previews" (Settings, 01 §8) | 02 §1.3, §3.12 |
| Saving files | "Download" vs "Export"; "Export all in view…" | Problem 4 |
| Backdrops | "Stage" is a swatch (the theme default) and also the name of the viewer area; "Mid gray (N5)" / "Light gray (N8)" expose Munsell codes | 02 §3.5; 04 §0.6 |
| Scaled-down art | A "fit" text marker on the card corner | 02 §4.5 |

- **Who it hurts:** novices, and every reader of the docs.
- **Fix:**
  - Call the destination **"Folders"**, with Favorites as its first tile (owner call). If "Collections" stays, use that word nowhere else.
  - Use "Creator", "API key", "Play previews" and "Download".
  - Rename the "Stage" swatch "Default" and drop "N5" and "N8".
  - Replace the "fit" marker with a shrink icon whose accessible name is "shown smaller than actual size".
  - Use "Download all {n}…" instead of "Export all in view…".

### 8. Settings sprawl and duplicated controls

- **Evidence:**
  - Settings has 7 sections and about 15 controls (02 §3.12).
  - The Library section mirrors toolbar controls (Animate previews, Grid size).
  - Sync now lives in three places (⋯, the sync popover, Settings).
  - "Show shortcuts" duplicates `?` and the ⋯ menu.
  - The backdrop has two persistence rules: the viewer choice resets every session, while a default lives in Settings (02 §3.5 step 7). The user is left asking "why did my checker reset?".
  - The Storage section exposes `persist()` as a "Protect" button with a status line, alongside usage and Clear saved images.
- **Who it hurts:** everyone who opens Settings, and long-term maintenance.
- **Fix:**
  - Four sections:
    - **Account:** status, balance, Stay connected, Forget, revoke link
    - **Display:** theme, single-key shortcuts
    - **Your data:** backup export and import, storage usage, Clear saved images
    - **About**
  - Remember the last viewer backdrop and delete the Settings default.
  - Remove the mirrored controls.
  - Call `persist()` automatically on the first folder or favorite (where the browser prompts, the prompt follows the user's own save), keep the backup tip, and drop the Protect button.

### 9. Option A's "click = current" makes the recommended base harder to learn

- **Evidence:** V1 (04 §0.2): at ≥ 1200 px with a fine pointer, a single click makes a card "current", and a double-click, Enter or Space opens it. This:
  - adds a third card state (focused / current / selected)
  - turns a link into something that doesn't navigate on click
  - flips behaviour across 1200 px (04 §1.9 cons, §7 Q4)
  - conflicts with 02's Space = toggle in selection mode (02 §9.3)
  - pulls in V6 dwell fetches, which R1 deferred as "Background detail prefetch"
  - drops density at 1440×900 from 7 columns to 5 (04 §1.2 vs 02 §4.2), so A fails 03 §5 check 2
- **Who it hurts:** everyone on a laptop, keyboard and screen-reader users, and the API read budget.
- **Fix:** build A on 02's baseline. A click opens the viewer at every size, and the viewer's inspector panel is open by default on desktop (02 §3.6). Drop V1 and V6. A then differs from 02 only in look.

### 10. Too many special cases ("(decision)" × 38 in 02, plus V1–V10 in 04)

Each rule is defensible on its own. Together they make behaviour hard to predict and the build/test surface large. Cut or unify these user-visible ones:

| Special case | Where | Replace with |
|---|---|---|
| The "Recently updated" sort exists only on the Characters chip and falls back when you switch | 02 §11.3 | Cut, or always show it with a "characters only" note (owner call) |
| The object badge gains "· 3 anim" only after the viewer has opened once | 02 §4.5 | Never show object animation counts in the grid |
| Chips are shown during sync and hidden after | 02 §1.3 | Chips appear on arrival (problem 5) |
| A per-session backdrop choice plus a separate Settings default | 02 §3.5 step 7, §3.12 | Remember the last choice |
| Deleting a folder has a confirm **and** an Undo | 02 §3.8, §12.4 | Confirm only. Also fix §3.8's claim that "every change can also be reversed without [Undo]", which is false for folder delete |
| A "Stop remembering?" confirm on a reversible toggle | 02 §3.12 | A toast |
| A "Portrait & voice: not in the public API" row on every character; a "UI pieces" note | 02 §5.1 #16, §5.9 | Cut. They contradict "null or empty fields are hidden" (02 §5) |
| Technical details "Source (REST / MCP)" and "Status" | 02 §5 | Cut. Source is an implementation detail; Status is always "completed" (D20) |
| S18 sync popover and S19 in-progress popover, both off one status line | 02 §2 | One "Library status" popover |
| The S23 import-result dialog | 02 §2 | A toast with the same counts |
| The help overlay strikes through "(off)" keys | 02 §9.5 | The banner alone |
| `Z` = Fit ↔ 1:1 | 02 §9.3 | Cut. The readout toggle and double-tap cover it |

Also: rulings R-1 to R-10, plus the unnumbered ones (seven backdrops, C's pixel face), are cited throughout 01–04 but recorded nowhere in `docs/`, so readers can't check them. Add a ruling ledger to 01.

### Probed and fine (no change)

| Item | Verdict |
|---|---|
| Keymap: 23 rows, 14 single-key (02 §9.3) | Acceptable as a hidden layer with the off switch. Only cut `Z` and resolve A's Space conflict (moot if V1 goes). `L` for favorite is unguessable, but `?` lists it, and `F` is rightly fullscreen. |
| Column counts (02 §4.2) | All 28 cells recomputed from the min-cell, gap and gutter rules: correct. The 04 tables also check out (A 5 × 152, B 7 × 169 and C 7 × 98 at 1440). |
| Integer-scale tables (02 §4.4) | Spot-checked 8 cells across S, M, L and XL at DPR 1, 1.25, 1.5 and 2: correct. |
| J1–J7 counts (01 §3 vs 02 §3) | 01 and 02 agree. But J1 assumes the default animation and direction are the wanted ones, and J2 ignores the two-file delivery (problem 4). |

---

## 2. First-run walkthrough: phone hobbyist, landing to a walk-cycle GIF

**Setup.** The user is on an iPhone (about 360 CSS px wide) and is already signed in to PixelLab in Safari. They want a GIF of their hero walking east, to post in Discord. The hero has Idle, Walk and Attack in 8 directions. The base is option A, following 02's behaviour.

| # | What happens | Taps (cum.) | Doubt or jargon | Fix |
|---|---|---|---|---|
| 1 | Opens the link from Discord and lands on Connect: wordmark, heading, value line, field, "Where do I find my token?", Remember toggle + helper, full-access note, Connect, privacy line, disclaimer. That is 9 blocks on one phone screen. | 0 | "API token? I'm not a programmer." "Full access… spending credits" next to "Unofficial" reads as "is this a scam?" | Lead with "It only looks". Inline steps. "API key". One-line safety note under the field. |
| 2 | Taps "Where do I find my token?" | 1 | Why is help hidden when everyone needs it? | Inline steps, no disclosure. |
| 3 | Taps "Open your PixelLab account page ↗"; a new tab opens | 2 | — | Primary button "Get my API key from PixelLab ↗". |
| 4 | Looks for "API token", finds "Copy API key", taps it | 3 | The name doesn't match | Step 2 copy: "Tap **Copy API key**". |
| 5 | Returns to Vitrine via the tab switcher | 5 | "Where did the app go?" | Step 3 copy: "Come back to this tab and paste it." (The tab switch itself can't be avoided.) |
| 6 | Taps the field, then Paste in the callout | 7 | — | — |
| 7 | Reads the Remember helper and decides | 7–8 | "Should I? What's the shared-computer risk?" | Ask after the first sync, as a banner. |
| 8 | The keyboard hides Connect: dismisses it, taps Connect | 9 | — | Auto-test on paste. Put Connect directly under the field. |
| 9 | Skeleton, then cards stream in: 9 chips, static thumbnails, "2 in PixelLab", an "Animate" icon | 9 | "Does this even play animations?" "Animate: will that make one and spend credits?" "What's '2 in PixelLab'?" | "Play previews". "2 still generating". Delight #1. |
| 10 | Sync completes; the Maps and UI chips vanish (no assets) | 9 | The chip row jumps | Chips appear on arrival. |
| 11 | Taps the Characters chip | 10 | — | — |
| 12 | Taps the hero card; the viewer autoplays Idle facing south, with the sheet at peek | 11 | — | — |
| 13 | Animation picker → Walk | 13 | "Rotations" as the first item is PixelLab vocabulary: fine for its users | — |
| 14 | "S ▾" → compass → E. The popover stays open (`popover="auto"`, 04 §1.4), so they tap outside to close it | 16 | The compass covers the art | Close on select (saves 1). |
| 15 | Download ▾ in the peek row → "GIF · Walk · east" (first item) | 18 | Eight items if they read on | At most 4 items. Show the output size (delight #8). |
| 16 | The GIF builds; the Ready sheet offers "Share or save…" and "Download file" | 19 | Which one? | Pre-encode when the menu opens, then go straight to the share sheet. Otherwise one primary button. |
| 17 | iOS share sheet → Discord | 20–21 | — | — |

- **Today:** about 21 taps and 11 moments of doubt. About 9 taps happen before any art appears. The spec claims 3 + 5.
- **With the fixes:** about 15 taps and 3 remaining doubts (the tab switch, PixelLab sign-in if signed out, which chip to use):
  - "Get my API key ↗" (1)
  - "Copy API key" (2)
  - tab switch (4)
  - field + Paste (6), then the key is tested automatically and the Library loads
  - Characters chip (7)
  - card (8)
  - Walk (10)
  - E (12)
  - Download (13)
  - GIF, which opens the share sheet (14)
  - Discord (15)
- **Repeat visits in session mode** cost the same 6 connect taps plus a full re-sync every time, unless the user accepts "Stay connected" (the post-sync banner makes that a deliberate, informed opt-in).

---

## 3. Delight gaps (8, all cheap)

| # | Delight | Why | Cost |
|---|---|---|---|
| 1 | **First-sync reveal.** Arriving cards fade in (opacity only, capped to the first viewport, a cut under reduced motion). When sync finishes, the status line reads once: "That's everything you've made · 1,204 assets". | Turns the slowest moment into the "wow, it's all here" moment | CSS + one string |
| 2 | **The last-viewed card keeps playing.** On viewer close, the card you came from loops the animation you were watching for up to 5 s, then rests. Its frames are already decoded. | Brings the grid to life with zero extra fetches. ≤ 5 s is exempt from SC 2.2.2. | Shared ticker, one card |
| 3 | **Prev/next keeps the animation type and direction** (falling back per 02 §3.5) | Comparing walk cycles across characters becomes a swipe | A few lines |
| 4 | **Remember the backdrop and Fit/1:1 choice** across sessions | Removes a surprising reset and a Settings item | `localStorage` |
| 5 | **Empty states made from the user's art.** "No folders yet" shows a ghosted 2×2 mosaic of the 4 newest assets ("Group these by game"). Empty Favorites shows a heart drawn on the mark's pixel grid. Folder covers become 2×2 mosaics (from B). | Charm without a mascot; folders recognisable at a glance | Reuses the integer-fit thumbnails |
| 6 | **Pixel-stepped micro-interactions.** The heart fill and selection check use `steps(3)` (C §3.7 already specifies it for checks). A long-press select fires `navigator.vibrate(10)` where supported. Instant under reduced motion. | Feels made for pixel art | CSS + one line |
| 7 | **One-tap share on phones.** Pre-encode the default GIF when the Download menu opens, so tapping "GIF" calls the share sheet directly while user activation holds. Fall back to the Ready sheet. | Removes the "Share or save vs Download file" question | Encode an 8-frame GIF early |
| 8 | **Honest size in the menu:** "GIF · Walk · east · ~256 px" | Confidence that it won't look tiny in Discord, without opening More options | Text only |

---

## 4. Consistency check across 01–04

| # | Topic | Conflict | Fix |
|---|---|---|---|
| 1 | Backdrop count | R1 (C15, scope: theme + five fixed), 02 §3.5 and 03 §3 say **6**; 04 §0.1 and V10 say **7** ("orchestrator ruling", unrecorded) | **5**: Default, Checker, Gray, Black, White, everywhere |
| 2 | Column counts | 02 header ("visual design may not change … column counts") and 03 §5 check 2 ("match §4.2") vs 04 V2 (every option differs; A has 5 at 1440 instead of 7) | Drop V1 so A matches again. Amend 03 check 2 to "matches the option's own table". |
| 3 | Detail fetching | 01 §6: "detail fetched on viewer open only" vs 02 §4.7 (Tiles Pro detail GET in view), §4.8 (hover and Animate fetch details) and 04 V6 (dwell fetch) | Reword 01 to list the thumbnail exceptions. Drop V6. |
| 4 | Filmstrip / pixel face | 01 §8 defers the filmstrip and R1 cuts the pixel webfont vs 04 V7/V8 and §5.1, which propose trialling both in A | No trial in A without owner sign-off |
| 5 | Preview toggle label | 02 §1.3 and §10.1 (SC 2.5.3) require a visible label vs icon-only `[>]` in A3, B3 and C3. "Animate" (02) vs "Animate previews" (01 §8, 02 §3.12) | "Play previews", labelled everywhere |
| 6 | Phone header | 02 §1.2 (app bar title · Search · Select · Settings + toolbar row) vs A §1.2 (search moved to a bottom round button, not listed in 04 §0.2) vs the A3 wireframe (Animate and ⋯ in the top bar, no View). B and C wireframes contradict their own tables too. 04 §0.1 says "none may drop" a header control. | Specify the problem-6 layout once, in 02 |
| 7 | Header rows | 01 §6 "one toolbar" and 02 §1.2 laptop "One header row" vs A's laptop header (3 rows: 56 + 48 + 28) and every phone (3 rows) | Meet the claim or drop it |
| 8 | Card hover | 02 §4.5 "surface lightens one step" vs 04 §0.6 "ring, never tint the backdrop" | 02 adopts the ring (correct for judging colours) |
| 9 | Space key | 02 §9.3 (toggles in selection mode, plays in the viewer) vs 04 V1 (opens the viewer) | Drop V1 |
| 10 | Route shape | 02 §1.1 `#/?type=characters` + `<parent>/a/<key>?dir=…` gives `#/?type=characters/a/<key>?dir=…`: a query before a path | `#/characters/a/<key>?dir=…` |
| 11 | Undo promise | 02 §3.8: "every change can also be reversed without it" vs folder delete, which can't be | Confirm only on delete, or soften the claim |
| 12 | Naming | Collections / folder / boards; Images / Creator; token / API key; Download / Export (problem 7) | One term each |
| 13 | Timing claim | 02 §5.1 #15 and §12.3 say "8 fps matches PixelLab's own players" vs research 09: the object detail player runs at 150 ms (~6.7 fps) and library cards at 5 fps | "Matches PixelLab's character and Creator players" |
| 14 | Default fps | R1 D11, G11 and C14 say 10 fps vs the rulings and 01–04, which say 8 | The ruling ledger marks R1 as superseded |
| 15 | Single-file save on Android Chromium | 02 §3.10 and §7.7 item 2 (touch + `canShare` → share sheet) vs §7.7 item 1 (Chromium Android 132+ → save picker); no precedence stated | Single files on coarse pointers → share/save; the picker only for bulk ZIP streaming |
| 16 | Two-file outputs | 02 §7.4 names sheet `.png` + `.json` separately; §7.7 only covers one-file and ZIP saves | Any output with more than one file is a ZIP |
| 17 | Rulings | R-1 to R-10 and the unnumbered rulings are cited in 01–04 but recorded nowhere | A one-table ledger in 01 |

---

## 5. Scope check

### 5.1 Cut or defer (beyond a view-only gallery, or beyond KISS)

| Item | Where | Verdict | Why |
|---|---|---|---|
| A's "current" state (V1) and dwell fetch (V6) | 04 §0.2 | Cut | Problem 9. R1 deferred background detail prefetch. |
| Trialling the filmstrip and pixel numerals in A | 04 §5.1 | Defer (owner request only) | 01 §8 defers the filmstrip; R1 cut the pixel webfont |
| B's shelves (V3) as a shipping mode | 04 §2 | Mockup only | R1 C7 rejected a sectioned home, and the library would have two modes |
| The full 03 checklist for all three mockups | 03 §3 | B and C prove their concept on Library, viewer, phone viewer, and selection + export; the winner gets the full checklist | "Options may differ in look, never in behavior" (03 intro), so the state gallery is identical work done three times |
| `Z` key | 02 §9.3 | Cut | Duplicate |
| Export Advanced: GIF loop-once, sheet spacing, metadata toggle | 02 §7.6 | Defer loop-once and spacing; cut the toggle (always include) | No requirement |
| Filename preview in the dialog body | 02 §7.6 | Move into Advanced | Power-user detail |
| PixelLab originals beside our formats in the menu | 02 §7.1 | Move into More options (not cut: they are in 01 §8's (req) row) | Look-alike pairs |
| The "Other" chip | 02 §1.3 | Cut; becomes a footnote | 01 §6 anti-goal |
| Characters-only "Recently updated" sort | 02 §11.3 | Cut (owner may keep) | Chip-dependent menu |
| Settings: Change token, Stop-remembering confirm, Protect button, mirrored controls, default viewer backdrop | 02 §3.12 | Cut | Problem 8 |
| The S23 dialog; the S18 + S19 split | 02 §2 | Toast; one popover | Fewer surfaces |
| Inspector absent-data rows, Source, Status | 02 §5 | Cut | Noise |
| Help overlay "(off)" strike-through | 02 §9.5 | Cut | The banner is enough |
| Undo on folder delete | 02 §3.8 | Cut (keep the confirm) | One mechanism |

### 5.2 Owner asks that are weakened or missing (restore)

| Owner ask | Gap | Restore |
|---|---|---|
| "pretty… play animations" | The grid never moves on a phone by default, and the toggle's label suggests a paid action | "Play previews". Mockups show it ON, the default is set with Phase 0 data, plus delight #2. |
| "download … multiple files" | Single outputs with several files are undefined (two downloads, a browser prompt, two iOS saves) | The ZIP rule, with "(ZIP)" in the label |
| "buttons to open assets/tools on PixelLab's website" | Tool links sit at the bottom of the inspector (on a phone: full sheet, then scroll). There's no global "Open PixelLab" outside empty and in-progress states. | An "Open in PixelLab ▾" split button holds the tool links (Animate ↗, New state ↗…), replacing the separate PixelLab section. Add "Open PixelLab ↗" to ⋯. |
| "extremely user-friendly and easy-to-use" | About 21 first-run taps; the session default re-charges the paste on every visit | The §2 fixes; the post-sync "Stay connected" offer |
| "organize with folders and favorites" on phones | No per-card heart on touch (02 §4.5) | Accepted trade-off: a 44 px target would span ~40% of a 107 px card's width, and the viewer's peek row already has the heart |
| "every PixelLab asset" | Creator images gated; fonts, effects and portraits have no public API | Fine as specified. Keep the honesty, now in the end-of-list line instead of a chip. |

---

## 6. Ranked spec changes

"Before" = apply before the mockup review. "Later" = can wait, but should be settled before Phase 1.

| # | Change | Rationale | When |
|---|---|---|---|
| 1 | Rename "Animate" to **"Play previews"**, with a visible label at every size | Collides with PixelLab's paid Animate tool; all three phone wireframes dropped the label | Before |
| 2 | "API key" everywhere. Inline 3-step help with a primary "Get my API key from PixelLab ↗". No autofocus on touch. | Matches PixelLab's "Copy API key"; every first-timer needs the steps | Before |
| 3 | Auto-test on paste. Offer Remember after the first sync as a one-time banner; the default is unchanged. | 2 fewer taps and one fewer decision at the most fragile moment; same security | Before |
| 4 | Option A = 02's baseline: drop V1 and V6 | A click opens everywhere; 7 columns at 1440 again; no third card state; no prefetch | Before |
| 5 | Viewer: one Backdrop button with 5 swatches (Default, Checker, Gray, Black, White); remember the last choice; delete the Settings default | Resolves 6 vs 7; removes 7 inline targets and a surprising reset | Before |
| 6 | Zoom `− [Fit · 3×] +` (the readout toggles Fit ↔ 1:1); cut the 1:1 button and `Z` | Five elements become three | Before |
| 7 | Phone viewer: one dock row (Play · scrubber · Animation ▾ · Direction ▾ · ⋯); Loop moves into "Speed & loop"; the compass closes on select on touch | About 18 targets become about 12; the art gets the height; (req) controls stay one tap away | Before |
| 8 | At most 4 Download menu items + More options; PixelLab originals inside More options; every output with more than one file is one ZIP, labelled "(ZIP)" | Removes look-alike pairs and the undefined two-file delivery | Before |
| 9 | Export dialog: presets "Sprite sheets · Frames · GIFs"; scope "This animation / Everything"; Advanced = Scale · GIF background · Trim; always include metadata.json | No implied engine claim; 6 knobs become 3 | Before |
| 10 | One verb, **Download** ("Download all 71…", "Download 12 assets") | Two verbs for one action; "in view" is misread | Before |
| 11 | Cut the "Other" chip (footnote in the end-of-list line and About); hide the Images chip if its gate fails | 01 §6 "empty chips" anti-goal | Before |
| 12 | Chips appear on their first asset and never disappear mid-session; "Images" becomes "Creator"; owner call on merging Tilesets + Tiles into "Tiles" | No moving targets; PixelLab's own word; at most 7 chips | Before |
| 13 | Phone Library header = app bar + chip row. Sort, size and Play previews go in one "View" sheet. The result/sync line scrolls with the grid. "2 still generating". | Codifies what the wireframes already do, with labels | Before |
| 14 | Rename the "Collections" destination "Folders" (owner call) | The owner's own word and the UI's own copy | Before |
| 15 | Settings: 4 sections. Cut the mirrors, Change token, the Stop-remembering confirm and the Protect button (auto `persist()` on the first folder or favorite). | 03 requires every Settings section in the mockups | Before |
| 16 | Inspector: cut the portrait row, the UI-pieces note, Source and Status. The "fit" marker becomes an icon with an accessible label. The backdrop swatch is "Default", with no N5/N8. | Empty fields are hidden by rule; Status never changes | Before |
| 17 | An "Open in PixelLab ▾" split button holds the tool links, replacing the separate section; add "Open PixelLab ↗" to ⋯ | Owner ask; tool links in 2 taps on a phone | Before |
| 18 | Prev/next keeps the animation type and direction | Walk-cycle comparison; nearly free | Before |
| 19 | Amend 03 §5 check 2 to compare against each option's own table; trim B and C to their concept screens | Otherwise no option can pass; saves duplicate state-gallery work | Before |
| 20 | Owner picks the Play previews default the mockups show. My recommendation: ON with caps, final call after Phase 0 G2/G3. | WCAG needs a pause control, not default-off; read cost is the real constraint | Before (decision); Phase 0 (final) |
| 21 | Add a ruling ledger (R-1 to R-10 + the unnumbered rulings) to 01 | Traceability | Later |
| 22 | Fix the route shape (`#/characters/a/<key>?dir=…`) | Malformed hash | Later |
| 23 | Save precedence on Android Chromium: share/save for single files, the picker for bulk | Unspecified today | Later |
| 24 | Merge S18 + S19; S23 becomes a toast; the help overlay uses only the banner | Fewer surfaces | Later |
| 25 | Folder delete: confirm only; fix the Undo claim in §3.8 | One mechanism; true copy | Later |
| 26 | Cut "Recently updated", or show it always | Chip-dependent menu | Later |
| 27 | Show no object animation count in the grid | Badges shouldn't depend on viewing history | Later |
| 28 | Reword 01 §6 "detail fetched on viewer open only" | False per 02 §4.7–§4.8 | Later |
| 29 | Narrow the timing note to the character and Creator players | The object player is ~6.7 fps (research 09) | Later |
| 30 | Specify delights 1, 2, 4–8 (3 is item 18) | Cheap polish | Later |
