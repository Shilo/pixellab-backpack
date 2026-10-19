# R4 — Builder check: Vitrine design

Status: 2026-10-18. Reviewer role: the builder who has to plan Phase 0–3 from the written design alone, with no access to its authors.

**Read in full:** `docs/design/01`, `07`, `02`, `05`, `06`, `00`, plus `03` (cited as the acceptance checklist). **Spot-checked:** `04` §1.5 (carried tokens), `research/01`, `02`, `07` and `09` (to verify claims), and `mockups/shared/` (`pixel-utils.js`, provenance README). `mockups/recommended/` was not relied on.

**Triage hint per question:** (a) answered in the docs · (b) minor, orchestrator can settle · (c) owner only.

**Verdict:** the design is buildable. Questions 1–2 decide the schedule. Question 3 is a doc fix that touches a view-only safety gate. Everything else has a safe default, listed below.

---

## 1. Questions, ranked

### Q1. Can Phase 1 start before Phase 0 has run? — (c)

- **Where:** 06 §1 and §6.2 (Phase 0 → 1 gate). 06 §3.1: task 1.1 depends on "Phase 0", and task 1.5 builds `normalize.ts` from the P0-4 fixtures. 06 §2.5: approvals A1–A3. Nothing says whether Phase 0 has happened or when it will.
- **Default I'd build:** start the tasks that use no Phase 0 output (1.1–1.4, 1.9, 1.10). Use contract-shaped synthetic fixtures from research 01 and 09. Keep every Phase 0 value as one named constant with the doc's declined or failed default:
  - `VITE_IMAGES=false`
  - `api` lane at 2 permits (the A3-declined value), not 4
  - hand-off links on the library-page fallbacks until P0-12
  - `PREVIEWS_DEFAULT_ON` per F-9
  
  Then switch the constants and swap in the real fixtures when `research/10-phase0-results.md` lands.
- **Why it matters:** Phase 0 needs the owner, the owner's token and three approvals. If the gate is strict, Phase 1 cannot start until the owner acts. If it is not, the only rework risk is the normalizer fixtures, which is small.

### Q2. Who runs the real-token and real-device checks in Phases 1–3? — (c)

- **Where:** 06 §2.1 rule 1 says no agent or script runs checks with the token. But 06 §3.2 items 1–2 (real key, first card ≤ 2 s on the real account, p75 of 3 runs), the §3.3 demo ("real token"), and tasks 1.22, 2.9, 3.3, 3.4 and 3.5 need a real token, an iPhone, an Android at DPR 2.625, a Pixel 6a-class trace, and NVDA, VoiceOver and TalkBack. 01 §9 makes these success criteria.
- **Default I'd build:** I never handle the token or real devices. I ship the mocked-API e2e suite, the emulated DPR and viewport projects, and a written checklist for each manual gate. The owner runs the checklists and signs them in the results doc.
- **Why it matters:** if the builder is an agent, about a third of the exit gates can't be closed by the builder. The phase sizes and gate order assume they can, so the schedule needs owner time booked in.

### Q3. Phase 0 check numbers disagree between documents, including the Images gate — (b), safety-relevant

- **Where:** 06 §2.3 has the only numbered table. 05 cites an older numbering in several places:

  | 05 location | Says | Means (06 §2.3) |
  |---|---|---|
  | §4.2, §10.5 T7, §14: `VITE_IMAGES` | P0-8 | **P0-9** (`get_image` side effects); P0-8 is the rate-limit burst |
  | §4.4, §14: extra media hosts | P0-2 | P0-3 |
  | §4.1, §14: semaphore permits | P0-7 | P0-8 |
  | §14: map thumbnail policy | P0-9 | P0-10 |
  | §3.3, §14: object grouping (also 06 §3.2 item 3) | P0-5 | P0-6 |
  | §11.4, §14: LRU sizes | P0-6 | P0-7 |
  | §4.3 rule 4: MCP fixtures (the code comment above it says P0-11) | P0-10 | P0-11 |
  | §3.3: sidescroller REST get shape | P0-3 | P0-4 |

  05 §5.3 and §14 already use the new numbers for Play previews ("P0-8, P0-14"), so "P0-8" means two different checks inside 05. Separately, 01 §10 and 02 §8 gate Images on "Phase 0 check 5", which is research 09's check #5 (= P0-9), while 06's P0-5 is the tileset overlap.
- **Default I'd build:** treat 06 §2.3 as canonical. `VITE_IMAGES` follows P0-9 (with A1) and P0-14 only.
- **Why it matters:** the Images flag is a view-only safety control. Wiring it to the rate-limit result could ship `get_image` calls on an unverified basis. The fix is to renumber the 05 references and replace "check 5" with "P0-9" in 01 and 02.

### Q4. Where does the code live, and what goes in the repository? — (b), plus one (c) part

- **Where:** 05 §2.1 roots the tree at `vitrine/` but doesn't place it relative to `docs/` and `mockups/`. 06 task 1.1 asks for a "CI workflow" but names no provider. The project folder is not a git repository yet. `mockups/shared/README.md` (provenance note) says `assets/` holds the owner's own PixelLab outputs. 06 §8 item 6 recommends making the repo public.
- **Default I'd build (b):**
  - scaffold at the project root, next to `docs/` and `mockups/`
  - `git init` locally
  - a GitHub Actions workflow file
  - no remote and no push until the owner chooses
  - `prettier --check` limited to source, config and tests
- **Owner part (c):** if the repo goes public, `mockups/shared/assets/` (the owner's art) is published with it. Should the mockups stay in the app repo, move out, or have their assets gitignored?
- **Why it matters:** this shapes the scaffold, the CI and lint scope, and a publish that can't be undone.

### Q5. When the recommended mockup and 07/02 disagree, which wins? — (b)

- **Where:** 07's header and 03's intro call `mockups/recommended/` "the acceptance target". 06 §1 calls it "the reference build". 01 §9 measures the first-run walkthrough "on the recommended mockup and the Phase 1 build". Neither the precedence line in 00 nor the one in 07 ranks the mockups, and the mockup is still in progress.
- **Default I'd build:** F rulings > 07 (visual) and 02 (behaviour) > mockup. The mockup only illustrates. Anything that exists only in the mockup goes back as a doc gap rather than being copied.
- **Why it matters:** if details get settled in the mockup and never reach 07 or 02 (menu contents, spacing, copy), I'd build the docs' version and fail the stated acceptance target.

### Q6. Where does the download estimate come from without detail fetches? — (b)

- **Where:**
  - 02 §3.9 and S25: the summary panel shows "the file and size estimate".
  - 02 §7.6: "34 files · about 2.1 MB".
  - 02 §7.7.3: the dialog says "Saved as 3 parts of up to 300 MB", decided from the estimate.
  - 07 W6 and W7: "412 files · about 38 MB".
  - 05 §8.4: parts split when "estimate > part cap".

  But F-2 and 05 §5.3 forbid background detail fetches. Frame counts come only from details (objects have no animation info in the list), and byte sizes only from media.
- **Default I'd build:**
  - Show "{n} assets" plus the type breakdown. Add files and MB only when they can be computed from list data or are already cached. Never fetch details just to estimate.
  - Close Blob parts dynamically, at asset boundaries, by running byte count.
  - The upfront notice reads "May be saved in parts of up to 300 MB".
  
  The alternative is to fetch every selected asset's detail when the dialog opens. That is user-initiated, but "Download all" would cost thousands of reads.
- **Why it matters:** it changes the copy in S9 and S25, the iOS part-split logic, and read cost.

### Q7. The working name is baked into persisted formats — (b), linked to owner decision 1

- **Where:**
  - the backup format `app: "vitrine"` (02 §3.12), which the importer validates strictly (05 §6.2)
  - storage keys `vitrine.token`, `vitrine.prefs`, `vitrine.fps` (05 §5.6)
  - the cache name `vitrine-media-v1` (05 §5.5)
  - the sheet JSON field `meta.app: "Vitrine"` (02 §7.3)
  - ZIP names `vitrine-{scope}-….zip` (02 §7.4)
  - the wrangler `name` (05 §13.1)
- **Default I'd build:** one constants module (display name plus slug), with every key derived from it. A rename before any real user data exists is then a one-line change. No migration or alias code (YAGNI).
- **Why it matters:** if the rename happens after anyone holds a backup file, import rejects it with "That file isn't a Vitrine backup", and Remember-mode users are signed out. The only thing to confirm: the rename lands before the first build real users touch.

### Q8. The PixelLab account link fails the e2e link scan — (b)

- **Where:** 02 §3.1 step 2 uses `https://pixellab.ai/account`. The same page backs the 401 "Get a new API key ↗" link and the Settings rotate-key link. But 05 §4.4 sets the hand-off base to `https://www.pixellab.ai`, and the 05 §10.3 e2e scan allows only `#`, `https://www.pixellab.ai/` and `blob:`. Research 02 cites both hosts.
- **Default I'd build:** use `https://www.pixellab.ai/account` everywhere, from one base constant.
- **Why it matters:** as written, the Connect screen fails its own CI gate.

---

## 2. Smaller contradictions and gaps (default applies unless told otherwise; all (b))

| Where | Issue | Default |
|---|---|---|
| 02 §3.5 item 10 and §9.1 vs §5.4 and 06 §3.3 step 6 | A coarse tap on the stage toggles chrome, but tilesets need "tap a tile → tile info" | With the Grid overlay on, a tap on a tile shows tile info. With it off, a tap toggles chrome |
| 02 §6.2 vs 07 §4.4 | The tileset/Tiles Pro **Grid** toggle has no slot in the dock spec | Dock row 2 after the state switcher. Phone portrait: in the top bar ⋯ |
| 02 §7.1 vs 06 task 1.19 | The animated character/object menu has no PNG item, and Phase 1 ships only PNG and PixelLab originals. What does the primary say in Phase 1? | Phase 1 primary for every type = "Download PNG" (current frame or rotation, 1× bytes). Phase 2 switches animated types to GIF |
| 02 §7.1 | The GIF item needs an animation. Which menu applies when an animated character is showing **Rotations**? | The menu follows what is shown: Rotations uses the "still" row |
| 02 §1.3, §3.10 vs §7.4 (scope slug `characters`) | Does "Download all {n}…" respect the active chip and search? | {n} = the current view (chip + search). Slug = the chip name, or `library` for All |
| 02 §7.3, 05 §8.3 | "GIF matte: current backdrop colour" is undefined for the Checker backdrop | Use solid `--checker-a` |
| 05 §3.2 `Pending` vs D20 | Non-completed tileset, isometric and Tiles Pro rows are neither shown nor counted | Drop them; don't count them (the `Pending` type stays as specified) |
| 07 §5.1 note vs 05 §0 support floor | "Plain fallback before each `light-dark()`", but the floor was chosen because it supports `light-dark()` | No fallbacks |
| 05 §12.2 recorder rule 6 | "Zero console errors" on every test conflicts with the 401, 429, 5xx and CORS injection tests: Chromium logs failed resource loads as console errors | Exclude network-resource messages from that assertion only |
| 05 §0, §2.1, §8.2, §10.4, §11.1, §11.2, §11.4, §13.1; 06 task 3.6 | "07 Qn" and "07 risk 2" point at `research/07`, not `design/07` | Read them as research 07. Doc fix: write "research 07 Qn" |

---

## 3. Checked and consistent (no question)

- Column counts: 02 §4.2 = 07 §2.2 = 03 §1, including the summary-panel reflow (7 → 5 at 1440, 10 → 8 at 1920).
- Chip mapping: 03 §2's expected counts confirm Tilesets = top-down + sidescroller and Tiles = Tiles Pro + isometric.
- Tokens: the carried 04 §1.5 block includes the < 1200 px gutter override that 07 §2.1 expects.
- Routes and history: 02 §1.1 = 05 §9.
- Character PixelLab ZIP covers all states by default (research 01, `?states=` filter). Character and object sprite sheets arrive as ZIPs, so the "(ZIP)" labels are right.
- Folder delete has both a confirm and an Undo toast (02 §3.8, §12.4), consistent with the corrected claim.
- `fit.ts` matches `mockups/shared/pixel-utils.js` `integerScale` (same epsilon and test cases).
- Precedence: F rulings > 07/02 > 01/03/05/06 > 04, the same in 00 and 07.
