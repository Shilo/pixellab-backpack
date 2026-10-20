# MVP plan: PixelLab Backpack

Status: 2026-10-19. Draft for the owner. "Vitrine" is a placeholder name (see concern 1).

**What the MVP is.** Paste your PixelLab API key. See your library as category tiles. Open a category, scroll through your art, and go back. That's it. Everything else waits.

**What this plan is built on**

| Source | What we took from it |
|---|---|
| [Research 16](../research/16-api-call-minimization.md) | The API measurements and the first strategy |
| [Review R6](../reviews/R6-api-minimization-review.md) | The **final** API strategy, corrected numbers and the safety net. Where R6 and 16 differ, R6 wins |
| [Research 17](../research/17-cross-device-sync.md) | How folders and favorites could move between devices |
| [Design 08 §12](../design/08-simplicity-redesign.md#12-concept-4-glass-library-added-after-owner-feedback) and [decision log](../design/00-decision-log.md) S-18 to S-21 | The chosen layout (Glass Library) and theme (plain GlassKit) |
| [Architecture 05](../design/05-architecture.md) and [plan 06](../design/06-implementation-plan.md) | The module names and phases we reuse, cut down for the MVP |
| [Full mockups](../../mockups/full/base/README.md) | The screens to build: `g1-connect`, `01-home`, `03-category-open` and their states |

**What this replaces.** This plan narrows [plan 06](../design/06-implementation-plan.md) Phase 1. Where the two disagree, **this plan wins for the MVP**. Plan 06 still describes the full product. Its decisions are logged as P-1 to P-12 in the [decision log](../design/00-decision-log.md#7-mvp-plan-rulings-p).

## Contents

1. [Concern 1: Project name](#concern-1-project-name)
2. [Concern 2: API load (critical)](#concern-2-api-load-critical)
3. [Concern 3: Folders and favorites across devices](#concern-3-folders-and-favorites-across-devices)
4. [Concern 4: MVP, KISS and YAGNI](#concern-4-mvp-kiss-and-yagni)
5. [Concern 5: MVP scope](#concern-5-mvp-scope)
6. [Decisions you still need to make](#decisions-you-still-need-to-make)
7. [How the code is organized](#how-the-code-is-organized)
8. [To-do list](#to-do-list)

---

## Concern 1: Project name

**Decided (2026-10-20): PixelLab Backpack.** `APP_NAME = "PixelLab Backpack"`, short name / home-screen label "Backpack", `APP_ID = "pixellab-backpack"`, subtitle "An unofficial gallery for your PixelLab art", footer "Not made by, affiliated with, or endorsed by PixelLab." Research: [naming](../research/naming/18c-name-ideas-professional.md). Before any app-store release, get PixelLab's written OK (fallback: "Backpack for PixelLab").

**Your concern (original).** The name isn't decided yet.

**What we found.**
- The name already lives in one place in the design: `APP_ID` and `APP_NAME` in `lib/app.ts` (B-7).
- Later, renaming breaks backup files and signs people out. But the MVP has no backups, no folders and no "Keep me signed in". In the MVP, a rename only clears the saved asset list, which reloads by itself.

**Options.**

| Option | Cost |
|---|---|
| Pick the name now | Blocks nothing, but takes your time now |
| Keep "Vitrine" as a placeholder | Free in the MVP. Must be decided before folders, backups or real users arrive |

**Recommendation.** Keep "Vitrine" in the one constant. Decide the final name before the first feature that saves your own data (favorites, folders, backup) or before anyone else uses the app.

**Status: DEFERRED.**

---

## Concern 2: API load (critical)

**Your concern.** PixelLab's owner is worried about how many requests Vitrine sends to PixelLab's API.

### What PixelLab offers

- **One list per asset family.** Each list comes in pages. You ask for "the first 100", then "the next 100", and so on.
- **No "what changed since last time".** There is no date filter, no sort option, no batch request, and no way to ask "has anything changed?" cheaply. Every list answer does include the total count.
- **Art usually comes free with the list.** For characters, objects and UI, each list row has a link to its picture. Those pictures live on PixelLab's image host, not on the API server.
- **Some art needs one extra request per item.** Tilesets need one small helper request each. Tiles Pro needs one detail request each. Creator images and maps need one request each, and that request is heavy.

| Asset family (home tile) | How Vitrine reads it | Rows per page | Picture in the list? | Extra request per picture | Your account |
|---|---|---|---|---|---|
| Characters | REST list | 100 | Yes | None | 478 |
| Objects | REST list | 100 | Yes | None | 213 |
| UI | REST list | 100 | Yes | None | 19 |
| Top-down tilesets (Tilesets & tiles) | REST list | 100 | No | 1 helper request, once per device | 219 |
| Sidescroller tilesets (Tilesets & tiles) | REST list | 50 | No | 1 helper request, once per device | 115 |
| Isometric tiles (Tilesets & tiles) | REST list | 100 | No | 1 download, once per browser | 4 |
| Tiles Pro (Tilesets & tiles) | REST list | 50 | No | 1 detail request, once per device | 38 |
| Creator images (Images) | MCP only | 50 | No | 1 heavy request each | 819 (**not in MVP**) |
| Maps (Maps) | MCP only | 100 | No | 1 server-side render each | 9 (**not in MVP**) |

Total: **1,914 assets**. Numbers measured live on 2026-10-19 (research 16 §2–3, R6 §3).

**A note on "+ 7".** Before the browser sends a request that carries your key, it first sends a tiny "may I?" check (a preflight). It carries no key and does no real work, but it still reaches PixelLab's server. R6 counts these, so the tables below show them as "calls + checks".

### The approaches we compared

| Approach | What happens when you open the app |
|---|---|
| **A. Sync everything** | Re-read every page of every list, and fetch every picture, every time |
| **B. Only what's on screen** | Read only the pages and pictures on screen. Save nothing, so every visit starts from zero |
| **C. Research 16's first pick** | Like D, but with a smaller check, heavy Images and Maps on the home screen, and no "+ checks" counted |
| **D. Saved copy + small check (recommended, R6)** | Keep a copy on the device. On open, read only the first page of each family to spot changes. Load more only as you scroll |

### What each approach costs at your account size (1,914 assets)

| Approach | First open on a new device | Each later open | Reopen within an hour | 30 days, one visit a day |
|---|---|---|---|---|
| A. Sync everything | 1,240 | 1,235 | 1,235 | **37,055** |
| B. Only what's on screen | 22 | 21 | 21 | 631 |
| C. Research 16, as corrected by R6 | 18 + 8 | 10 + 8 (18 + 8 in "this tab only" mode) | 0 | 308 + 240 (540 + 240 in "this tab only" mode) |
| **D. Recommended MVP** | **11 + 7** | **7 + 7** | **0** | **214 + 210** |

Sources: research 16 §5.1 (A, B), R6 §2.1 (C, D). A and B leave out the "+ checks"; they would add more. "Within an hour" means coming back in the same tab; in "this tab only" mode a new tab costs 1 + 1 for the key test.

### What it costs as libraries grow (10,000 assets)

| Approach | Each later open |
|---|---|
| A. Sync everything | 6,425 |
| B. Only what's on screen | 21 |
| **D. Recommended MVP** | **7 + 7** |

**The cost of opening the app does not grow with the library.** It is 7 + 7 at 1,914 assets and at 10,000. Only scrolling grows, and each page or picture is paid for once per device, only when it reaches the screen.

### What scrolling costs (recommended MVP, paid once per device)

| You scroll through… | At 1,914 assets | At 10,000 assets |
|---|---|---|
| All Characters | 4 + 4 | 25 + 25 |
| All Tilesets & tiles | 376 + 42 | 1,988 + 226 |
| All Images (later, not MVP) | 836 | 4,365 |

The Tilesets number is high because tileset lists have no picture link, so each tileset needs one small helper request the first time it appears on screen. PixelLab could remove this cost by adding a picture link to those list rows (question 1 below).

### Recommendation: the MVP strategy (R6 §5.1, final)

1. **REST only.** No MCP, no balance call, no Images, no Maps. Every request goes to a documented, read-only route.
2. **The key test is the first real request.** Pasting the key sends the Characters first-page request, which is also the Characters check. If PixelLab says "wrong key" (401), we show the error. No extra call. If its rows share nothing with the saved Characters rows, the saved copy belongs to another account: it is wiped and a full check runs.
3. **One first-page check per family on open.** 7 requests, one per family, each reading page 0 at full size (100 rows, or 50). The same answer gives the tile count, the 2×2 mosaic and the grid's first page.
4. **Nothing again within an hour.** If the last check was less than 1 hour ago, coming back to the app sends **zero** requests. In "this tab only" mode a new tab needs the key again, so it sends only the one key test. Two open tabs share one check.
5. **Saved copy on the device.** The rows you have seen are kept on the device. Rows beyond the first page are dropped after 7 days and reload as you scroll.
6. **Pages load as you scroll.** The next page loads only when you scroll near it. Each next page starts one row back, so we can tell if the list shifted underneath us. If it did, that family reloads from the top.
7. **Art only for cards on screen.** Characters, objects and UI pictures come straight from the image host. Tilesets, Tiles Pro and isometric tiles wait until the card has been on screen for 0.3 seconds, then make their one request, once per device. The answer is saved.
8. **Never:** polling, loading in the background, requests for failed or unfinished assets, or detail requests just to draw a card.

**How the first-page check decides (R6 §4.4)**

| What the check sees | What happens |
|---|---|
| Same total, same rows | Nothing |
| New assets on top, nothing else moved | They are added on top. Up to 99 new assets fit |
| A row changed (renamed, finished generating, new picture) | That row updates in place |
| Anything else (a deletion, an edit that moved an old asset) | Page 0 is replaced. Deeper rows are dropped and reload as you scroll |

What it can miss: an edit to an old asset deep in the list, if nothing else changed. That shows up within 7 days. Manual Sync (deferred) will fix it on demand.

### The safety net (R6 §5.4, all inside one network module)

| Rule | What it does |
|---|---|
| 2 at a time | At most 2 requests to PixelLab's API at once. Your actions go first; pages and pictures wait |
| 2 per second | A short burst of 8 is allowed, then at most 2 requests per second |
| Daily cap | After 1,000 API requests in 24 hours on one device, background loading stops. A banner says "Paused to go easy on PixelLab's servers. [Keep loading]". Each tap allows 1,000 more |
| At most 2 retries | Only for "too many requests" (429), server errors and network drops. Retries count toward both caps. No retry for a wrong key, a missing asset, an unfinished asset or a blocked browser |
| Back off, then stop | First 429: drop to 1 at a time and pause for 60 seconds. A second 429 within 5 minutes, or 3 failures in a row: stop everything and show "PixelLab isn't answering right now. [Try again]" |
| Hidden tab | Waiting work is cancelled while the tab is hidden |

### Plain answers (owner questions, 2026-10-19)

**What does "sync everything" (1,235 requests) actually consist of?** Two groups:

| Group | What it is | Requests at your size (1,914 assets) | At 10,000 assets |
|---|---|---|---|
| List pages | Each family's list, 100 (or 50) rows per request: Characters 5, Objects 3, UI 1, Top-down tilesets 3, Sidescroller tilesets 3, Isometric 1, Tiles Pro 1, Images 17, Maps 1 | 35 | about 160 |
| One-by-one pictures | Families whose list has no picture link: Top-down tilesets 219, Sidescroller 115, Tiles Pro 38, Isometric 4, Images 819, Maps 9 | about 1,200 | about 6,260 |
| **Total, every open** | | **about 1,235** | **about 6,425** |

Characters, objects and UI pictures are not in this table: they come from PixelLab's image host, not the API.

**"Images" means only the Creator gallery category** (pictures made with PixelLab's Creator tool). Characters, objects, UI and tilesets all show their pictures in the MVP. Images and Maps are left out because each of their pictures costs its own request, and the request Images needs is labelled by PixelLab as "may change things" rather than "only reads" (it can save in some cases), so a view-only app avoids it until PixelLab confirms it is safe.

**Tilesets cost one extra request per tileset, not one for all**, and only the first time that tileset appears on screen on that device. The answer is saved, so it is never asked again. Creator images would also need one request per image.

**Why "only what's on screen, nothing saved" is about 21 per open.** One first page per family (9 with Images and Maps) plus the home screen's mosaic pictures that need their own request (about 12). Nothing is remembered, so every open, every category visit and every scroll pays again. Without Images and Maps it would be about 11 per open.

**What "saved copy" means.** The list information the app already downloaded (names, sizes, picture links) is kept in your browser's own storage on that device. It is never sent anywhere. Pictures are kept by the browser's normal image cache. Your key is not part of it.

**Why it is 7 at any library size.** On open the app reads only the first page of each of the 7 lists to see whether anything changed. The rest of the list loads only as you scroll, and is saved. The very first open on a new device is about 11 (the 7 checks plus about 4 tileset pictures in the home mosaic); after that it is 7.

**What the hour means.** The app writes down when it last checked. If you open it again within an hour in the same browser, it shows the saved copy and sends nothing. It does not check every hour in the background; it only checks when you open the app and the last check is over an hour old. Opening and closing the app every few seconds costs 0 after the first open (a new tab in "this tab only" mode costs 1, for testing the pasted key).

**Is there a manual check?** Yes, recommended for the MVP (see below): "Refresh" reruns the 7-request check right away, so a new asset doesn't wait up to an hour. It can be used at most once a minute.

### Should Sync fetch everything or only what's on screen?

**Only what's on screen. Never everything.**
- On open: one small check per family (7 + 7), or nothing within the hour.
- While browsing: only the pages and pictures you scroll to, each once per device.
- **Refresh (in the MVP, proposed):** reruns the 7-request first-page check on demand, at most once a minute. A full Sync that re-reads every saved page (never pictures) stays deferred.

### Questions for PixelLab (draft, R6 §6)

One short email. Every "yes" lowers the load further. The MVP does not wait for answers.

> 1. Could the tileset, Tiles Pro and isometric list rows include a picture link (like characters do), and the Creator image list a thumbnail link? Or may we build tileset picture links from the account ID and asset ID? This alone removes about 1,200 one-time requests on a 1,900-asset account.
> 2. Is `get_image` on a Creator gallery item read-only? Could it be marked read-only, or split into its own read tool?
> 3. Is there a read rate limit we should respect? Could `Retry-After` be exposed to browsers?
> 4. Could list rows carry `updated_at`, or could lists accept a sort or "changed since" option? That would make our change check exact.
> 5. Would a longer preflight cache (`Access-Control-Max-Age`) help your servers?
> 6. Are browser apps supported long term, and is a read-only API key planned?

**Status: DECIDED (R6 strategy).** Two choices are yours: the saved copy in "this tab only" mode, and leaving out Images and Maps (see [decisions](#decisions-you-still-need-to-make)).

---

## Concern 3: Folders and favorites across devices

**Your concern.** Folders and favorites should follow you from phone to computer.

**What we found (research 17).** The data is tiny (a heavy user has about 6 KB). Vitrine has no server, and PixelLab can't store it properly.

| Option | How it works for you | Effort | Verdict |
|---|---|---|---|
| Backup file | Download a backup, send it to your other device (AirDrop, cloud drive, email), import it | Already designed | **First, after the MVP** |
| Copy-paste text, QR code, share link, direct device pairing | Move the data without a file | Small to large | Rejected: no better than a file, too small, leaks into history, or needs a server |
| Your own Dropbox | Tap "Sync with Dropbox" once per device; it syncs by itself | About 100 lines plus a new merge format | **Later, opt-in, only if people ask** |
| Google Drive, OneDrive, iCloud, GitHub | Same idea, other providers | More friction: extra scripts, daily sign-ins, paid accounts or a second secret | Only if demand shows up |
| Store it in PixelLab (tags, projects) | Vitrine writes into your PixelLab account | Breaks "view-only" and covers only 2 of 8 asset types | **Never** |
| Our own small server | A sync code links your devices | A server, a privacy policy, uptime | **Only if the product changes** |
| Browser sync | — | No web page can use it | Not possible |

**Recommendation.**
- **MVP: nothing.** The MVP has no folders or favorites.
- **First after the MVP:** the backup file (export and import).
- **Later, on demand:** opt-in "Sync with Dropbox".
- **Never** store anything in PixelLab. **No server** unless the product changes.
- Never sync the API key.

**Status: DECIDED for the MVP (nothing).**

---

## Concern 4: MVP, KISS and YAGNI

**Your concern.** Build the smallest thing that works, keep it simple, and don't build for "maybe later".

**Principles for this project**

| Principle | What it means here |
|---|---|
| Smallest complete step | Each task ships one working piece with its test. Nothing half-built |
| Build only what the MVP screens use | No settings code, no folder code, no download code until those features start |
| Reuse before writing | Use the browser's own features, GlassKit's styles and the module names in [architecture 05](../design/05-architecture.md) |
| One job per module | Each file does one thing. Only one file talks to PixelLab |
| A plug-in point only where a second user is certain | The "family adapter" exists because 7 families use it on day one and Images and Maps will plug in later. Nothing else gets an abstraction |
| Safety is never cut | View-only, key safety, the API safety net and accessibility basics stay, even in the MVP |
| Deferred means hidden or inert | Unbuilt features are either not shown or shown as buttons that do nothing yet. No fake screens |
| Every shortcut is marked | A deliberate simplification gets a `// ponytail:` comment naming its limit and its upgrade path |

**Status: ADOPTED.**

---

## Concern 5: MVP scope

**Your concern.** The MVP is the API-key screen, the library home tiles and the category grids with navigation. Everything must be modular: small tasks and well-separated code.

### In the MVP

| Screen (mockup) | What works | States |
|---|---|---|
| API-key screen (`g1-connect`) | Paste the key, it tests itself; "Test key" button as a fallback; Show/hide; the 3 "get your key" steps; the privacy and "unofficial" lines | Testing, wrong key, offline, PixelLab blocking the browser, "Welcome back" (new tab, key kept for one tab only) |
| Library home (`01-home`) | Category tiles with a 2×2 mosaic and a count: **Characters, Objects, Tilesets & tiles, UI**. A category with 0 assets is hidden | First-load skeleton tiles, empty library, offline with saved copy, "Paused…" banner, "PixelLab isn't answering" banner, "slow down" notice, "some categories didn't load [Try again]" |
| Category grid (`03-category-open`) | Open a tile, scroll the grid (more loads as you go), go back with ‹ Library or the browser's Back button. Square cells with the quiet name (and the state name for characters and objects) | Loading more, end of list, "Couldn't load more [Try again]" |

Copy comes word for word from [02](../design/02-ux-spec.md) §12 and the mockups. Desktop and phone layouts both follow the mockups.

**Visible but inert** (they do nothing yet, and say so to screen readers): Search, Select and Settings. The "…" menu works but shows only two items: **Refresh** and **Activity**.

**Small MVP rules**
- **Key mode:** "this tab only" (the safe default). "Keep me signed in" waits for Settings.
- **Characters:** one cell per state, with the state name, like objects. Grouping states into one card arrives with the viewer.
- **Tilesets & tiles grid:** the four lists shown one after another (top-down, sidescroller, Tiles Pro, isometric), each newest first. A tileset that appears in two lists is shown once. Mixing them by date waits until Phase 0 confirms sort orders.
- **Unfinished or failed assets** are not shown in grids and get no art requests (D20, R6 C4). Tile counts are PixelLab's totals, so they can be slightly higher than the visible cells.

### Deferred

| Feature | Why it waits |
|---|---|
| Viewing a single asset (viewer, player, Info) | Needs detail requests and the player; the biggest next step |
| Favorites and folders | Needs local storage of your own data and the final name |
| Downloads and Select | Needs the viewer and the download module |
| Images (Creator gallery) | Its read tool isn't marked read-only (Phase 0 check P0-9), and it's the biggest API cost: 836 requests for one full scroll today |
| Maps | Each picture is a server-side render |
| Search, Settings, Select | Visible but inert in the MVP |
| Full refresh (re-read every saved page) | "Refresh" plus the check on open cover the MVP (concern 2) |
| Cross-device sync | Concern 3 |

**Images, Maps and the folder tiles: hidden, not disabled.** Hiding is simpler: no disabled style, no "coming soon" text, no tap that does nothing, and zero API requests. It also follows the existing rule that controls that don't apply are hidden (UX-19). They come back when their feature ships.

### Modular by design

- **Tasks:** each to-do item below is small, has one "done when", and says what it depends on.
- **Code:** each module has one job and a small interface (next section). New families, screens and features plug in without changing the network module or the saved-copy logic.

**Status: DECIDED, awaiting your sign-off.**

---

## Concern 6: Activity log (developer mode)

**Your idea.** A way to see what the app sends to PixelLab and when, available in production so anyone can check the load.

**Recommendation: an "Activity" panel, in the MVP.**
- **Open it from** the dock's "…" menu ("Activity") or by adding `#activity` to the address.
- **Counters at the top:** API requests this session and today (with the daily cap), requests avoided thanks to the saved copy, pictures loaded from the image host, and the current status (OK, slowed, paused, stopped).
- **A live list underneath, newest first:** time, what it was ("Characters · first page", "Tileset picture"), where it came from (PixelLab API, image host, saved copy, browser cache), result (OK, wrong key, too many requests, blocked by the daily cap), size and duration.
- **Export:** "Copy log" puts a plain-text version on the clipboard so it can be shared in a bug report.
- **Safe by design:** it never shows the key, asset IDs or picture links (IDs work like download keys). Entries say what was asked for, not the address.
- **One gap:** for every request that carries your key, the browser first sends PixelLab a tiny automatic "is this website allowed to talk to you?" message. The browser does this on its own and hides it from the app, so the panel can only estimate how many there were (about one per kind of request every 10 minutes). Nothing in it is private and it does no real work, but it does reach PixelLab's server, which is why we count it.
- **Cost:** it reads numbers the network module already keeps, so it adds no requests. The log lives only in memory and clears when the tab closes.

**Status: PROPOSED** (decision 8).

---

## Decisions you still need to make

Each has a recommended default. If you don't decide, the default applies and nothing blocks.

| # | Decision | Our default | Why |
|---|---|---|---|
| 1 | Keep the saved asset list on the device in "this tab only" key mode? | **Yes** (R6) | Without it, every new tab is a first open, and scrolled pages are paid again every time. The key itself still lives in the tab only. The list holds only names and picture links of your own art |
| 2 | Leave Images and Maps out of the MVP? | **Yes, hidden** | See concern 5 |
| 3 | Send PixelLab the questions in concern 2 (especially picture links in tileset list rows)? | **Yes, soon**; the MVP doesn't wait for answers | Each "yes" lowers the load. It also starts the ToS conversation needed before any public launch (D31) |
| 4 | Who uses the MVP? | **Only you, privately** | The MVP has no "Forget key" button (Settings is inert). Until Settings ships, clearing the browser's site data removes the saved list. Pasting another account's key replaces the saved list by itself (concern 2, step 2) |
| 5 | Run the 6 owner checks in [Phase 0](#phase-0-checks-owner-run-real-key) with your real key? | **Yes**, about 1 hour, read-only, no spending | They confirm the data shapes and two unknowns the MVP relies on |
| 6 | Daily cap of 1,000 API requests per device | **Keep 1,000** | A daily visit uses 7. Scrolling through every Tilesets & tiles item uses about 376, once per device |
| 7 | Final name | **Decided: PixelLab Backpack** | Owner choice, 2026-10-20 |
| 8 | Add the Activity panel to the MVP? | **Yes** | Lets you and PixelLab see the real load at any time (concern 6) |
| 9 | Add "Refresh" to the MVP? | **Yes**, once a minute at most | Otherwise new assets wait up to an hour; costs the same 7 requests |

---

## How the code is organized

Stack (S-20, S-21, D5): Svelte 5 + Vite + TypeScript, plain CSS, GlassKit vendored and unmodified with a thin layout override file. No other runtime library except `idb-keyval` for the saved copy. Names follow [architecture 05](../design/05-architecture.md) §2 where they fit.

### Module map

```
src/
  main.ts                    starts the app
  App.svelte                 shows KeyScreen, LibraryHome or CategoryGrid; shows notices
  app.css                    layout, sizing and accessibility fixes on top of GlassKit (S-21 only)
  vendor/glasskit/           GlassKit v1.27.0 CSS + LICENSE, pinned and unmodified (S-20)
  lib/
    app.ts                   APP_ID / APP_NAME: the only place the name "Vitrine" lives
    router.svelte.ts         #/ (home) and #/c/<category> (grid); browser Back works
    api/
      http.ts                the ONLY code that talks to PixelLab: holds the key, view-only guard, safety net
      families.ts            one adapter per asset family, plus the list of home categories
    data/
      store.ts               the saved copy on the device (idb-keyval); wipe()
      check.ts               pure rules: first-page check, next-page overlap test, 7-day expiry
      library.svelte.ts      the library check service: open check, load more, state for the screens
    render/
      fit.ts                 pure integer-pixel scale math
      PixelArt.svelte        the only thing that draws art: canvas, crisp at every screen density, trim
    ui/
      KeyScreen.svelte       the API-key screen and its states
      LibraryHome.svelte     the home grid of category tiles
      CategoryTile.svelte    one tile: 2x2 mosaic, name, count
      CategoryGrid.svelte    one category's cells, loads more on scroll, draws only rows on screen
      AssetCell.svelte       one square cell + name; waits 0.3 s on screen before costly art
      Dock.svelte            the floating dock; Search, Select and "…" are inert in the MVP
      Notice.svelte          one-line banners: paused, offline, not answering, slow down
public/_headers              security headers and CSP (05 §13.2)
tests/unit  tests/e2e  tests/fixtures
```

**Layering rules (from 05 §2.2, trimmed):** only `http.ts` calls `fetch` (a check in the test suite fails on any other). Only `store.ts` touches device storage, except the daily-cap counter inside `http.ts`. Screens never import from `lib/api`; they use `library.svelte.ts`. `check.ts` and `fit.ts` stay pure, so they are easy to test. Raw PixelLab IDs and picture links never appear in the address bar (D13, R-9).

### Key interfaces

```ts
// lib/api/http.ts: the only door to PixelLab
setKey(key: string | null): void
apiGet<T>(path: string, o: { user?: boolean; signal?: AbortSignal }): Promise<T>
  // GET /v2/<7 lists>?limit&offset and GET /v2/tiles-pro/{id}; with the key; goes through the safety net
publicGet(url: string, o: { signal?: AbortSignal }): Promise<Response>
  // no key, no headers: the image host and the 3 documented helpers; API-host helpers go through the safety net
onStatus(cb: (s: 'ok' | 'slowed' | 'paused' | 'stopped' | 'offline' | 'blocked' | 'key-lost') => void): void
keepLoading(): void      // "Keep loading": allows 1,000 more today
retry(): void            // "Try again" after a stop

// lib/api/families.ts: one adapter per family, behind one interface
interface Card { key: string; id: string; name: string; done: boolean; thumb: string | null; fp: string }
  // key = opaque hash (05 §3.1); fp = id + name + status + picture link (for the change check)
interface Family {
  id: 'characters' | 'objects' | 'ui' | 'tilesets' | 'tilesets-side' | 'isometric' | 'tiles-pro';
  pageSize: 100 | 50;
  list(offset: number, signal?: AbortSignal): Promise<{ total: number; cards: Card[] }>;
  art(card: Card, signal?: AbortSignal): Promise<{ blob: Blob; thumb?: string }>;
    // thumb = the resolved picture link to save, so the extra request happens once per device
  artCostsApi: boolean;  // true: wait 0.3 s on screen first (tilesets, Tiles Pro, isometric)
}
export const FAMILIES: Family[];
// CATEGORIES lives in src/lib/categories.ts (one list shared by router, adapters and screens)

// lib/data/check.ts: pure
applyCheck(saved: FamilyState | undefined, page0: { total: number; cards: Card[] }, now: number): FamilyState
joinNextPage(saved: FamilyState, page: Card[]): FamilyState | 'reload'
interface FamilyState { total: number; cards: Card[]; checkedAt: number; deepLoadedAt: number | null }

// lib/data/library.svelte.ts: the library check service
library.families: Record<Family['id'], FamilyState>   // reactive, read by the screens
openCheck(): Promise<void>      // skips if checked < 1 h ago; one shared check across tabs
loadMore(id: Family['id']): Promise<void>
```

**How later features plug in.** Images and Maps add `api/mcp.ts` (the small MCP client from 05 §4.2) and two entries in `FAMILIES` and `CATEGORIES`. The viewer, favorites and Search add new screens that read `library.svelte.ts`. None of them changes `http.ts`'s rules, `check.ts` or the screens above.

---

## To-do list

`[P]` = can run in parallel with the other `[P]` items in the same group once its dependencies are done. Task IDs are for reference only.

### Phase 0 checks (owner-run, real key)

About 1 hour in desktop Chrome, using the console helper in [plan 06 §2.2](../design/06-implementation-plan.md) (no key in any file, record only shapes and counts, never IDs or links; 06 §2.1 rules apply). Nothing is created, changed or spent. Results go to `docs/research/13-phase0-results.md`. The build can start before these finish, on made-up fixtures (B-1).

- [ ] **Q1 Reads are free** (06 P0-1 + P0-14) `[P]`: check the balance before and after the other checks. Done when: credits unchanged.
- [ ] **Q2 List row shapes** (06 P0-4) `[P]`: record the fields of one page of each of the 7 REST lists (name, status, picture link, total) and the wrong-key answer. Done when: shape-only fixtures saved in `tests/fixtures/rest/`.
- [ ] **Q3 Pictures load in the browser** (06 P0-3, list links only) `[P]`: fetch one character, object and UI picture link and one Tiles Pro tile link from the page. Done when: each returns an image, with the host recorded.
- [ ] **Q4 Tileset helpers in the browser** (R6 §4.1) `[P]`: fetch one top-down and one sidescroller helper with no headers, and one isometric download. Done when: the final picture link can be read and the image loads; a failed tileset answers 423.
- [ ] **Q5 Sort order** (R6 §3, new) `[P]`: on page 0 of characters, objects, top-down tilesets and isometric tiles, check that rows are newest first. Done when: each recorded as newest first or not.
- [ ] **Q6 Tileset overlap** (06 P0-5) `[P]`: does the top-down list also contain the sidescroller tilesets? Done when: the three counts recorded. If it contains all of them, drop the sidescroller list (one fewer request per open).

### MVP build

- [x] **B1 Scaffold**: Vite + Svelte 5 + TypeScript at the project root; GlassKit vendored; `lib/app.ts` name constant; `public/_headers` served by `vite preview`; Vitest and Playwright; a test that fails if anything but `http.ts` calls `fetch`. Done when: an empty app builds and every check passes. *(needs nothing)*
- [x] **B2 Network module** `[P]` (`http.ts`): view-only guard, key holder, 2-at-a-time queue with user-first order, 2 per second, daily cap, at most 2 retries, back-off-then-stop, hidden-tab pause, status events, blocked-browser probe (UX-7). Done when: test T1 passes. *(needs B1)*
- [x] **B3 Family adapters** `[P]` (`families.ts`): the 7 families and the 4 MVP categories, on made-up fixtures shaped like research 01. Done when: test T3 passes. *(needs B1)*
- [x] **B4 Saved copy and check rules** `[P]` (`store.ts`, `check.ts`). Done when: test T2 passes. *(needs B1)*
- [x] **B5 Pixel art renderer** `[P]` (`fit.ts`, `PixelArt.svelte`). Done when: art is crisp at screen densities 1, 1.5, 2 and 3 and after a resize. *(needs B1)*
- [x] **B6 App shell** `[P]` (`App.svelte`, `router.svelte.ts`, `Dock.svelte`, `Notice.svelte`, `app.css`): home and category routes, browser Back, the dock with inert buttons. Done when: Back and ‹ Library both return home, and inert buttons cause no request and no navigation. *(needs B1)*
- [x] **B7 Library check service** (`library.svelte.ts`): open check (1-hour rule, shared across tabs), load more with the one-row overlap, 7-day expiry, 401 back to the key screen with the saved list kept (UX-23). Done when: test T6's request counts pass. *(needs B2, B3, B4)*
- [x] **B8 Key screen** `[P]` (`KeyScreen.svelte`): paste to test, Test key, Show, all its states. Done when: test T4 passes and the screen matches the `g1-connect` mockups. *(needs B6, B7)*
- [x] **B9 Library home** `[P]` (`LibraryHome.svelte`, `CategoryTile.svelte`): 4 tiles, mosaics from page 0, counts, empty categories hidden, all home states. Done when: it matches the `01-home` mockups without the Images, Maps and folder tiles. *(needs B5, B6, B7)*
- [x] **B10 Category grid** `[P]` (`CategoryGrid.svelte`, `AssetCell.svelte`): draws only rows on screen, loads more near the end, 0.3 s wait for costly art, scroll position kept when going back. Done when: test T5 passes and it matches the `03-category-open` mockups. *(needs B5, B6, B7)*
- [x] **B11 Costly art** (inside `families.ts`): tileset helpers resolved once and saved, Tiles Pro detail once, isometric download, nothing for unfinished or failed rows. Done when: a second visit to the Tilesets grid sends zero API requests (T6). *(needs B3, B10; confirm with Phase 0 Q4)*
- [ ] **B12 Real fixtures**: swap in the Phase 0 fixtures, apply Q5 and Q6, rerun every test. Done when: all tests pass on real shapes. *(needs Phase 0, B11)*

- [x] **B13 Activity panel** (`ui/Activity.svelte`, counters from `http.ts`): counters, live list, Copy log, `#activity` route, no key/IDs/links shown. Done when: every request in test T6 shows up as one entry with the right source and result. *(needs B2, B6)*
- [x] **B14 "…" menu with Refresh and Activity**: reruns the open check right away, at most once a minute. Done when: tapping it twice within a minute sends 7 requests, not 14. *(needs B6, B7)*

### MVP tests

- [x] **T1 Safety net** (unit) `[P]`: fake 429s, server errors and network drops; checks 2 at a time, 2 per second, the daily cap and "Keep loading", the retry limit, back-off then stop, no retry on 401/404/423. *(with B2)*
- [x] **T2 Check rules** (unit) `[P]`: every row of the table in concern 2, plus the overlap test (shift detected → reload) and the 7-day expiry. *(with B4)*
- [x] **T3 Adapters** (unit) `[P]`: each family turns a fixture page into cards; unfinished rows are marked not done; bad rows are dropped, never crash. *(with B3)*
- [x] **T4 Key screen** (e2e, mocked API) `[P]`: good key, wrong key, offline, blocked, welcome back; the key never appears in the address bar or in storage outside the tab. *(with B8)*
- [x] **T5 Navigation** (e2e) `[P]`: home → category → scroll loads more → back → home, by ‹ Library and by browser Back; desktop 1440 px and phone 390 px; no sideways scroll; keyboard reaches every working control. *(with B10)*
- [x] **T6 Request counter** (e2e) `[P]`: first open = 7 API requests (+ up to 4 tileset helpers for the mosaic); back within an hour = 0; key pasted in a new tab within the hour = 1; another account's key wipes the saved copy; only GET requests; no key in any URL; no request for unfinished rows; the daily-cap banner appears (cap lowered for the test). *(with B7, B11)*
- [ ] **T7 Real-key check** (owner-run, from a checklist the builder writes, B-2): open the MVP with your key and DevTools; count requests on first open, on a reopen within the hour, and the next day. Done when: the counts match the "Recommended MVP" row in concern 2 (allowing for new assets). *(last)*

### Deferred backlog (suggested order)

- [x] Settings: Forget key, "Keep me signed in", About (needed before anyone but you uses the app). **Done in [Phase 2](phase2-plan.md).**
- [x] Viewer for one asset: player for characters and objects, still views for the rest, Info; groups character states into one card. **Done in [Phase 2](phase2-plan.md).**
- [ ] Full refresh in "…": re-read every saved page, never pictures; 60-second cooldown
- [ ] Search over the saved list, and "All assets" through the search panel
- [ ] Favorites and folders, with a local card snapshot so a folder opens with 0 requests (R6 §4.3); needs the final name first
- [ ] Select mode and downloads (single asset first, then multi-asset ZIP)
- [ ] Backup file export and import (the cross-device answer, concern 3)
- [ ] Images (after Phase 0 P0-9 and approval A1) and Maps, with the MCP client and their own rate caps (R6 §4.2)
- [ ] Play previews in the grid
- [ ] Tilesets & tiles mixed by date, once sort orders are confirmed
- [ ] Help overlay and keyboard shortcuts
- [ ] Built tileset picture links, only with PixelLab's written OK (R6 §4.1)
- [ ] Opt-in "Sync with Dropbox", only if people ask (concern 3)
