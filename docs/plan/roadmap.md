# Roadmap: PixelLab Backpack

Status: 2026-10-21. The app is live on [GitHub Pages](https://shilo.github.io/pixellab-backpack/) and deploys on every push to `main`. This is the one list of what comes next, what only the owner can do, and the known small issues. Tick items here when they're done.

**Built so far:** the key screen, library home and category grids with Activity and Refresh ([MVP](mvp-plan.md)), Settings and the viewer ([Phase 2](phase2-plan.md)), Search and All assets ([Phase 3](phase3-plan.md)), and favorites and folders ([Phase 4](phase4-plan.md)). The 2026-10-21 project review then added:

- the safer account check;
- hidden tabs that pause instead of failing, and a check again on return to the tab;
- `storage.persist()` for favorites and folders;
- the agent-only dev token;
- the GitHub Pages deploy;
- the accessibility and design fixes.

See the [Phase 4 build log](phase4-build-log.md#project-review-2026-10-21).

**Rules for every new feature:**

- Each phase gets its own plan, with a "calls + checks" budget table for any new PixelLab request (P-16).
- Where docs disagree, the [decision log](../design/00-decision-log.md) wins.

## What the owner needs to do

- [ ] **Rotate the PixelLab API key** that was used in chat during testing (on your pixellab.ai account page). If AI agents still need a key, put the new one only in the git-ignored `.env` as `PIXELLAB_API_KEY_AGENT_DEV` (P-18; [AGENTS.md](../../AGENTS.md)).
- [ ] **Real-phone checks** on an iPhone and an Android phone:
  - the search field, ✕, Cancel and the first panel row stay visible with the keyboard open (Phase 3);
  - a long press opens the card menu with no system link preview, and a short tap opens the viewer (Phase 4);
  - sheets sit above the home indicator (Phase 4).
- [ ] **Phase 0 checks Q1, Q4 and Q6, and the T7 request count**: about 30 minutes, read-only, nothing spent. Steps: [research 13](../research/13-phase0-results.md#still-to-do-owner) and its T7 checklist.
- [ ] **Send PixelLab the six questions** in the [MVP plan](mvp-plan.md#questions-for-pixellab-draft-r6-6) (P-11), if you haven't yet. The email also starts the ToS contact (D31). Don't advertise the app's address before that contact.
- [x] **Repo visibility:** public at github.com/Shilo/pixellab-backpack (MIT). `mockups/` is no longer tracked because it holds PixelLab art, but earlier commits still contain it. Rewrite the history if that matters.
- [x] **GitHub Pages:** live; the workflow checks, builds and deploys every push to `main`.
- [ ] *Optional:* **a custom domain** for Pages. Without one, other pages on `shilo.github.io` can read what the app saves in the browser (P-17).
- [ ] *Optional:* the checks in [01 §9](../design/01-product-brief.md#9-success-criteria-measurable-ux-targets) that need a real device (Lighthouse, screen-reader passes, performance traces).

## Next work, in order

### Phase 5: Keep it safe

- [ ] **Backup export and import** (Settings › Folders & favorites):
  - Export downloads a versioned JSON file of favorites and folders (keys, names, order).
  - The file never contains the key, PixelLab ids, picture links or card snapshots (Phase 4 R2).
  - Import merges folders by name (UX-12) and says how many items will appear as their categories load.
  - 0 API requests.
- [ ] **Make the screen behind open layers inert** while a menu, sheet or panel is open. Today Tab past the last control of a layer that is last on the page reaches the browser bar without closing it, and screen readers can swipe onto the page behind (design review U3).
- Done in the 2026-10-21 review:
  - `storage.persist()`;
  - the better account check (rules in the [Phase 4 build log](phase4-build-log.md#project-review-2026-10-21));
  - the check again on return;
  - Select hidden;
  - design and accessibility fixes U1–U5 and the small design fixes.

### Phase 6: Downloads from the device

Single-asset downloads built from bytes the viewer already has. No new API requests.

- [ ] **Download in the viewer and the card menu**: PNG (1×, the current frame or still).
- [ ] **GIF** of the current animation, direction and speed, made with `gifenc` (D5). The Phase 6 plan measures and states its bundle cost before adding it. It loads only when a download starts (01 §9: download code ≤ 10 KB gzipped).
- [ ] **Copy image** and **Fullscreen** in the viewer "…" (P-19).
- [ ] **Folder rows in Info**: which folders hold this asset, each opening the folder (local data, P-19).

### Phase 7: Select and multi-asset downloads

- [ ] **Select mode**: Select comes back in the docks, with the selection bar (S-13).
- [ ] **Multi-asset ZIP** from the selection, a folder's "…" and the library "…".
  - Each character or object needs one detail request for its frames, unless its detail is already saved.
  - So before it starts, the download says "Needs about {n} requests to PixelLab".
  - It has a cap on requests per download; the number is set in the Phase 7 plan.
  - It counts toward the daily cap and pauses there with the existing "Keep loading" banner.
  - It reuses every saved detail, at 0 requests each.

### Later

- [ ] **Deferred: reassess encryption of `pixellabApiKey`.** User decision (2026-10-23): keep optional plaintext
  Remember storage shared with every app on this origin, without a passphrase or extra unlock step. A bundled key or
  locally saved automatic-decryption key does not protect against same-origin malicious code; a passphrase adds
  unwanted friction. Revisit only with a concrete threat model and convenient independent unlock or scoped provider
  credentials. See [shared token contract](../shared-token-security.md).

- [ ] **Images and Maps**: blocked on PixelLab's answer to question 2 (is `get_image` read-only?) and owner approval A1. They need the MCP client and their own rate caps (R6 §4.2).
- [ ] **Built tileset picture links**: only with PixelLab's written OK (R6 §4.1).
- [ ] **Play previews in the grid**: only with a budget rule. Frames need one detail request per character or object, and P-2 forbids detail requests just to draw a card. A rule to start from: play only cards whose detail is already saved on this device (0 requests), with no grid-wide autoplay.
- [ ] **Tileset Grid overlay and tile info** (P-19).
- [ ] **Tiles Pro thumbnail as a 2×2 of variations** (needs the variation links saved; P-19).
- [ ] **Prompt and tag search** (P-19).
- [ ] **Help overlay and single-key shortcuts**, with their off switch (F-15; P-19).
- [ ] **Opt-in "Sync with Dropbox"**, only if people ask ([MVP plan](mvp-plan.md#concern-3-folders-and-favorites-across-devices), concern 3).
- [ ] **Full refresh** in "…": re-read every saved page, never pictures (about 36 requests at the owner's library size). Only if people report stale rows deep in a list; today Refresh, the 7-day expiry and the free "gone" check cover it.
- [ ] **PWA manifest**: owner decision, not scheduled.

**Dropped:**

- Tilesets & tiles mixed by date (deep pages would reshuffle, Phase 3 R4).
- The P-19 drops: Sort, Grid size, the light theme, the "Keep me signed in?" banner, the "{n} generating ↗" row, the "More in PixelLab" links and a remembered Info open state.

## Known small issues

Each one is minor and has no fix scheduled. Fix one when you touch the code around it.

- Two tabs can race in rare timing gaps (Phase 4 Risks):
  - a write can land just after another tab's Forget key;
  - a tab still showing account 1 can save an account-1 snapshot into account 2's store if the user favorites there.
- Activity rows use technical labels (design review U10, low priority).
- The app has no favicon, so the browser's automatic `/favicon.ico` request gets a 404 (harmless).
- Test gaps:
  - the 10 px long-press move tolerance has no test of its own;
  - the mock has no lone "Idle" character;
  - no test covers `states()` after a next page loads, or a viewer opened from another screen.
- The full e2e suite takes about 15 minutes. Playwright's `fullyParallel` was tried and reverted: request-count tests in t6 and t8 became timing-flaky.
