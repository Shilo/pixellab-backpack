# 17: Cross-device sync for folders, favorites and settings

Research date: 2026-10-19. Question: how could Vitrine (unofficial, view-only, fully client-side, no backend) share a user's folders, favorites and settings across their phone, desktop and other computers? Which approach should it take, and when?

## Method and evidence quality

- **Internal context.** [README](../../README.md); [decision log](../design/00-decision-log.md) D13–D16, B-7, UX-10, UX-12, UX-23; [UX spec](../design/02-ux-spec.md) §3.8, §3.12 and §7; [architecture](../design/05-architecture.md) §3.1, §5.6 and §6; research [01](01-pixellab-api-asset-inventory.md), [02](02-browser-integration-and-security.md) and [09](09-verification-followups.md); review [R1](../reviews/R1-research-cross-review.md) S1, S4 and C4.
- **External sources.** Vendor documentation pages, fetched on 2026-10-19, are listed under [Sources](#sources) with their "last updated" dates where the page shows one. Forum posts and third-party pages are labelled as such. Anything older than 2025 is marked *(older)*.
- **PixelLab.** I read only the MCP tool *schemas* for `update_character_tags`, `update_object_tags` and `add_to_project`. **No PixelLab tool was called**, read or write.
- **Labels.** **(inference)** marks reasoning that no source states. *(unverified)* marks a claim that needs a spike before anyone builds on it.

---

## Verdict

1. **Ship nothing new for the MVP.** The designed backup ("Download backup (.json)" / "Import backup…", D16, 05 §6.2) already moves folders and favorites between devices. It goes through `save.ts`, so on phones it ends in the OS share sheet. From there a user can AirDrop the file, save it to iCloud Drive, Google Drive or Dropbox, or send it to themselves. On the other device, "Import backup…" opens the OS file picker, which lists those same cloud drives. That costs no code, no backend and no new trust. The only change worth making is one line of copy in Settings and the backup tip, saying the file can be opened on another device.
2. **If users later ask for automatic sync, add one opt-in "Sync with Dropbox" first.** It writes to the user's own Dropbox **App Folder** via OAuth PKCE from the static site. Of the cloud options, Dropbox is the only one that needs no client secret, no third-party script and no daily re-sign-in. The user grants app-folder-only access, and Vitrine stays view-only toward PixelLab. The real cost is not the OAuth flow. It is a new org format with per-item timestamps and tombstones (§9), because today's import "merges, never deletes", which is right for a backup and wrong for two-way sync.
3. **Do not store anything in PixelLab.** Tags exist on only 2 of the 8 asset types, they are capped at 20 per asset, and writes replace the whole tag set. Project membership can't be read back at all. Either route breaks the code-enforced view-only guard and needs writes with a full-access key (§4).
4. **No backend of our own unless the product changes.** A hosted relay only makes sense after a public launch, PixelLab's answer under ToS §2.2, and real demand for sync without a cloud account. If it ever comes, key it by a random sync code with end-to-end encryption, never by anything derived from the PixelLab API key (§5).
5. **Sync folders and favorites only. Never sync the API key.** Settings are few and mostly device-specific (§10).

---

## 1. What would sync, and how sensitive it is

**The data is small.** The org store is `OrgV1 = { app, version, folders: [{ id, name, createdAt, items: AssetKey[] }], favorites: AssetKey[] }` (05 §6.1). An `AssetKey` is 12 base64url characters, about 15 bytes per item in JSON. A heavy user with 100 favorites and 10 folders of 30 items holds about 400 keys, roughly **6 KB**. The importer's 5 MB cap is far above any real file. The keys are random-looking, so compression barely helps: packed as raw binary, each key is still 9 bytes.

**The data is private, but it is not a capability.** R1 S4 established that raw asset UUIDs are permanent no-auth download keys. The org store never holds them:

- `assetKey(ns, id)` is the first 9 bytes of `SHA-256("ns:uuid")` (05 §3.1). For a random UUIDv4 (122 random bits), the hash can't be reversed to the UUID, so a leaked key unlocks no download. **(inference)**
- One caveat. Creator gallery keys hash `image:gallery:<id>`, and 05's test vector uses a 13-digit, timestamp-like id. If real gallery ids are that guessable, an image key could be brute-forced back to its gallery id. A gallery id alone downloads nothing, though, because `get_image` needs the API key (01). **(inference; gallery id format unverified)**
- What remains sensitive is ordinary privacy: **folder names** are free text that can name unreleased projects, and the membership pattern reveals how someone works.

**Rules that hold for every option below**
- The PixelLab API key never leaves `api/http.ts` and is never synced, hashed for identity or written into a sync payload (D14; 05 §2.2).
- Payloads carry opaque keys only, never raw ids or media URLs (D13, S4).
- An import or remote change adds or removes org entries only. It never touches assets (02 §3.8).
- Keys resolve through `library.resolve()` after a full sync, so orphans are reported, not guessed (05 §6.3).

---

## 2. Option 1: manual backup file (already designed)

**How it works for the user**
- **Device A:** Settings → Folders & favorites → **Download backup (.json)**. Desktop: the file downloads. Phone: the share sheet opens (`save.ts`: `showSaveFilePicker` on Chromium, `navigator.share({files})` on coarse pointers, else `<a download>`; 05 §6.2 and §8). About 3 taps.
- **Move the file:** AirDrop, Nearby Share, "Save to Files" (iCloud Drive, Google Drive, Dropbox), email or a messenger to yourself.
- **Device B:** paste the PixelLab key, then Settings → **Import backup…** → pick the file → S23 shows the result. About 4 taps plus the file picker.

**What it takes to build:** nothing beyond Phase 2 task "folder backup" (06). Web Share is in Chrome 128+ on desktop, Edge 95+, Safari 12.1+ on macOS, Safari 12.2+ on iOS, Chrome Android and Firefox Android. Firefox desktop has no Web Share, so it falls back to a normal download ([caniuse](https://caniuse.com/web-share), read 2026-10-19).

**Security and privacy:** The file holds opaque keys and folder names only. It goes wherever the user sends it. No new credential and no third party of ours is involved.

**Cost:** $0. **Reliability:** as good as the user's habit. Nothing happens automatically, and the backup tip (02 §8) is the only nudge.

**Fit:** perfect fit for "no backend", view-only and KISS. Works on phone and desktop.

**Limits**
- It is a copy, not sync. The import merges by folder name and unions favorites, and it **never deletes** (UX-12; 05 §6.2). Moving phone → desktop → phone brings back anything removed in between. That is acceptable for "set up my new device" and for restoring after eviction. It is wrong for ongoing two-way use (§9).
- On device B, orphans can only be judged after that device's first full sync. The S23 report already says so.

---

## 3. Option 2: device-to-device transfer without a server

| Variant | How it works | Verdict |
|---|---|---|
| **Copy-paste text blob** | "Copy as text" puts the ~6 KB JSON on the clipboard. The user sends it to themselves in a notes app or messenger, then pastes it into "Import from text" on device B | Works everywhere with ~20 lines of code, but it is Option 1 without a file and with more taps. **Skip.** Add it only if users report that file transfer is hard on some platform. |
| **QR code** | Device A shows the org as a QR code, and device B scans it | Version 40 at level L holds at most **2,953 bytes** ([QR capacity table](https://www.qrplanet.com/help/article/what-storage-capacity-does-a-qr-code-have), consistent across references). That is about 190 keys as JSON or about 320 as packed binary, so the heavy user above (400 keys) already doesn't fit. Codes this dense scan poorly from a screen. Scanning needs `BarcodeDetector` (not in iOS Safari or Firefox *(unverified)*) or a ~40 KB decoder. If the phone's camera app scans it instead, the data has to be a URL, which is the fragment variant below. **Reject.** |
| **Share link with the data in the URL fragment** | `https://<app>/#import=<base64url org>`. The fragment never reaches the server or the Referer header | The keys aren't capabilities (§1), but the link **lands in browser history, which browsers sync across devices**, and in messenger previews, clipboard managers and screenshots (R1 C4's reasoning). The folder names travel with it. It also creates an injection path: anyone can send a link that adds folders, so it would need a confirm screen, and it collides with the hash router. **Reject**, in line with D13's "nothing user-specific in URLs". |
| **WebRTC pairing** | The two browsers open a peer-to-peer data channel | It needs signaling (a server, or a manual two-way offer/answer exchange of about 1–2 KB each, again by QR) and usually a public STUN server, which exposes IP addresses to a third party and means a CSP `connect-src` change. Both devices must be online at the same time. **Reject.** |
| **Short pairing code ("enter 7-flamingo-river")** | A relay matches the two devices by code | It needs a relay we host. That is Option 5. |

**Fit:** only the text blob keeps the no-backend promise, and it adds nothing over Option 1.

---

## 4. Option 3: the user's own cloud storage, from the static site via OAuth

Common shape: the user taps "Sync with X" and approves a consent screen. Vitrine keeps an OAuth token scoped to an app-only folder and reads and writes one small file, `vitrine-org.json`. No backend of ours is involved. **This is still view-only toward PixelLab.** "View-only" is about PixelLab assets, and the user's own storage is outside that promise. Each provider adds its API hosts to CSP `connect-src`.

### 4.1 Dropbox App Folder (best technical fit)

- **OAuth from a static site:** Dropbox documents the authorization-code flow with **PKCE for apps that can't keep a secret, "including pure JavaScript single-page apps"**. Adding `token_access_type=offline` returns a refresh token ([Dropbox OAuth guide](https://docs.dropboxapi.com/dropbox-api/docs/oauth), read 2026-10-19). The official JS SDK ships a browser PKCE example and warns never to embed the app secret in front-end code ([SDK README, dropbox@10.46.0](https://cdn.jsdelivr.net/npm/dropbox@10.46.0/README.md)). That browser example implies CORS on the API hosts *(unverified; confirm in a spike)*.
- **Tokens:** Access tokens last about 4 hours (`expires_in: 14400`, per forum reports). Per a Dropbox moderator, refresh tokens don't expire on their own ([Dropbox forum](https://community.dropbox.com/en/discussion/722071/why-the-token-is-becoming-obsolete), forum post). The result is one consent per device, then silent refresh.
- **Scope:** the "App Folder" permission type limits the app to `/Apps/<app name>/` (OAuth guide), plus file read/write scopes. If the token leaks, only that folder is exposed.
- **Review:** a new app starts in development status. Once it reaches **50 linked users, the developer has two weeks to apply for production approval**, or new users can no longer link. Development status caps out at 500 users ([Dropbox developer guide](https://www.dropbox.com/developers/reference/developer-guide); the 50-user window per a [Dropbox moderator](https://community.dropbox.com/en/discussion/846671/does-a-dropbox-app-have-a-limit-on-development-users), forum post).
- **Quota and privacy:** a few KB of the user's own quota. Dropbox sees folder names and opaque keys, under the user's own account.
- **Friction:** 1 tap, then the Dropbox consent screen (plus sign-in if needed), once per device. Users without Dropbox can't use it.
- **Build:** about 80–120 lines of plain `fetch` (PKCE helpers, a redirect handler, token refresh, download/upload with `rev` for conditional writes), which keeps the four-dependency budget. Plus the org v2 merge (§9) and one redirect URI per origin.

### 4.2 Google Drive `appDataFolder`

- **Scope:** `drive.appdata` is **non-sensitive** ([Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), updated 2026-09-03). The folder is hidden from the user and from other apps. It can't be shared or trashed, and it is deleted when the user removes the app ([appdata guide](https://developers.google.com/workspace/drive/api/guides/appdata), updated 2026-09-03).
- **Review:** non-sensitive scopes avoid data-access verification and the 100-user cap for unverified sensitive scopes ([user cap](https://support.google.com/cloud/answer/15549945), undated). Showing an app name and logo on the consent screen requires **brand verification** (verified domain and privacy policy) ([brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification), updated 2026-08-19).
- **The catch is the browser flow.**
  - The supported static-site path is the **Google Identity Services (GIS) token model**. It needs Google's `accounts.google.com/gsi/client` script. Its access tokens are short-lived with no refresh token, and a new one must be requested from a user gesture through Google's dialog ([token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), updated 2026-05-26).
  - The plain redirect (implicit) flow is "strongly discouraged… legacy support" ([implicit flow](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow), updated 2026-10-16).
  - The code model with PKCE still expects a client secret for web clients, according to developer reports ([2025 blog](https://ktaka.blog.ccmp.jp/2025/07/oogle-oauth2-and-pkce-understanding.html), third-party). In practice that means a backend.
- **Effect on Vitrine:** a third-party script in `script-src`, which undoes the CSP's `script-src 'self'` and R1 S1's "zero third-party runtime code". Re-consent popups roughly hourly once the token expires *(token lifetime per page examples: 3600 s)*.
- **Upside:** the widest reach, because most Android users have a Google account.

### 4.3 OneDrive app folder

- **Scope:** `Files.ReadWrite.AppFolder` is **(preview)** and **valid only for personal Microsoft accounts**, not work or school ([OneDrive permissions](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/permissions_reference), updated 2026-05-14). The folder is `Apps/<app registration name>` and is created on first request. The "Apps" name can be localized ([app folder doc](https://learn.microsoft.com/en-us/graph/onedrive-sharepoint-appfolder); [SDK issue](https://github.com/microsoftgraph/msgraph-sdk-javascript/issues/917)).
- **OAuth:** auth code + PKCE with an `spa` redirect URI, no secret. Refresh tokens for SPAs **expire after 24 hours**, so the app must do a top-level redirect to the sign-in page about once a day. It is usually invisible, but it is a page reload ([refresh tokens](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens), updated 2026-06-15).
- **Verdict:** workable, but a preview scope with a daily reload and only personal accounts. Third choice.

### 4.4 iCloud (CloudKit JS)

- CloudKit JS needs a container and an API token from the CloudKit Dashboard. The user signs in with their Apple ID in an Apple-presented dialog, and the private database holds per-user data ([CloudKit JS](https://developer.apple.com/documentation/cloudkitjs/cloudkit.md), read 2026-10-19).
- It needs a **paid Apple Developer Program membership** (US$99/year, standard price *(not re-checked)*) and Apple's hosted `cloudkit.js` *(unverified host)*, so another third-party script.
- Sign in with Apple identities are not linked to CloudKit identities ([Apple forum, 2019, *older*](https://developer.apple.com/forums/thread/119159)).
- Apple ID sign-in works from any browser, but it is the heaviest setup for the developer and an unfamiliar flow for Android and Windows users.
- **Verdict:** reject unless iPhone-only users turn out to dominate, and even then Option 1's "Save to Files → iCloud Drive" covers them for free.

### 4.5 GitHub Gist

- **OAuth from a static site does not work.** GitHub added PKCE on 2025-07-14 ([changelog](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/)). A GitHub staff member then said the token endpoint **still requires the client secret and has no CORS** (2025-07-15), and pointed to a roadmap item (2025-10-27). Community follow-ups through 2026-08 got no staff reply, and the item now shows as paused ([discussion #15752](https://github.com/orgs/community/discussions/15752)).
- **The workaround** is a fine-grained personal access token with the **Gists** permission, which covers `POST /gists` and `PATCH /gists/{id}` ([permissions reference](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens), read 2026-10-19). The user creates the token by hand (about 8 steps) and pastes a **second secret** into Vitrine. "Secret" gists are only unlisted.
- **Verdict:** developer-only friction and a second pasted credential. Reject.

---

## 5. Option 4: store the organization inside PixelLab

| Mechanism | What it can hold | Problems |
|---|---|---|
| **Character / object tags** (`update_character_tags`, `update_object_tags`; REST `PATCH …/tags`) | Favorites as a tag such as `vitrine-fav`, and folders as one tag each | **Coverage:** only characters and objects have tags (01 summary #9). Images, tilesets, tiles, maps and UI assets, 6 of 8 types, can't be organized. **Limits** (tool schema): at most 20 tags per asset, 50 characters each (Vitrine folder names allow 60), deduplicated case-insensitively. **Replace-all semantics:** every write must read the current tags and rewrite all of them. If the user edits tags on the PixelLab site at the same moment, one change is lost. **Pollution:** the tags appear in PixelLab's own UI and in every MCP agent's `list_*` filters. **Rate limits:** 429 is declared on `PATCH …/tags`, and read limits are unpublished (01). |
| **Projects** (`add_to_project`, `remove_from_project`) | Nothing usable | Adding to a project **changes what a Game Builder game can load**, a real functional side effect. Listing projects needs `list_projects`, whose output embeds a credentialed git URL (R1 S6). And **membership can't be read back** through any public tool (09 Q5), so it can't even work as storage. |
| **Anything else** (`save_to_asset`, sandbox files, pushing to a project's git repo) | — | These are writes into creative or game data. Out of the question. |

**Why it is rejected even as an opt-in**
- It breaks the promise that **view-only is enforced in code**: the GET-only `/v2` guard, the MCP allowlist that excludes every write tool, and the end-to-end tests that assert zero non-GET requests (README; 05 §2.2).
- It needs writes with the **full-access key** (R1 S1). That raises the trust ask exactly where the app has none to spare.
- ToS §2.2 already asks a third-party service to contact PixelLab. Writing metadata into users' accounts would deserve that conversation all the more (02 §7).
- An opt-in toggle doesn't fix the coverage gap. Favorites would sync for characters and silently not for tilesets.

**What is useful, and is already read-only:** PixelLab's *existing* character and object tags arrive in the list data (01), and they sync by nature because they live in PixelLab. Showing them as a read-only filter is a separate feature idea, not a sync mechanism, and it is not proposed here.

---

## 6. Option 5: a tiny backend we host

**Shape:** a Cloudflare Worker plus D1 (or one SQLite-backed Durable Object), storing `{ syncId → ciphertext, version, updatedAt }`.

**Identity choices**

| Identity | Verdict |
|---|---|
| Hash of the PixelLab API key | **Reject.** Rotating the key, which Vitrine itself advises after trying third-party tools (R1 S14), silently orphans the sync data. It turns the key into a stable account identifier on our server. It also breaks the layering rule that the key lives only in `http.ts` (05 §2.2). |
| **Random sync code** | **Use this if a backend ever ships.** Device A generates 128 random bits and shows them once as a QR code and a ~26-character base32 code. HKDF derives `syncId` and an AES-GCM key from the code, so the server stores only ciphertext under an opaque id. Device B scans or types the code. Saving the code through a normal username/password form (`autocomplete="current-password"`) lets the user's password manager sync it to their other devices. Losing the code means losing sync, but every device keeps its local copy. |
| Passkey with the PRF extension | A nicer later step: a passkey both identifies the user and derives the encryption key. Support is still patchy. It works on Android, Apple platforms 18+ and macOS browsers, but Windows needs the February 2026 update plus Chrome/Edge 147+ or Firefox 148+, and **Windows 10 has none**. Third-party password managers vary ([Corbado PRF matrix](https://www.corbado.com/blog/passkeys-prf-webauthn), published 2025-04-16, updated 2026-09-29). It needs a random-code fallback anyway. |
| Email magic link | **Reject.** It means sending email and holding personal data, for a gallery that has neither today. |

**Cost**
- Workers Free: 100,000 requests a day, 10 ms CPU per invocation. Paid starts at $5/month ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), updated 2026-10-02).
- D1 Free: 5 M rows read and 100 k rows written a day, 5 GB ([D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), updated 2026-04-21). Over-limit queries fail from 2026-09-01 ([changelog](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/)).
- KV Free allows only **1,000 writes a day** ([KV pricing](https://developers.cloudflare.com/kv/platform/pricing/)) and is eventually consistent, so it is the wrong store for this.
- Realistic cost: $0–5 a month.

**Security, abuse and privacy**
- End-to-end encryption means we never see folder names.
- An anonymous blob store is still free storage for anyone, so it needs a size cap (e.g. 64 KB), per-IP rate limits, expiry after N idle months and no listing endpoint.
- IP addresses still reach our logs, so a privacy policy is needed.

**Fit:** it **contradicts "no backend"**, which is in the README headline and the brief. It adds an origin to `connect-src`, an uptime duty, a privacy policy and another thing to raise with PixelLab. Phone and desktop both work, and once paired it needs no cloud account.

---

## 7. Option 6: browser-native mechanisms

| Mechanism | Finding | Verdict |
|---|---|---|
| **Chrome / Safari / Firefox profile sync** | Browsers sync bookmarks, history, passwords and extension storage (`chrome.storage.sync` is an extension API). No web-page API writes into profile sync *(inference from the absence of any such API)*. | Only reachable by shipping a browser extension. Reject. |
| **Passkeys / Credential Management** | Passkeys provide identity and, with PRF, a key. They provide no storage. `largeBlob` holds "small amounts of opaque data" per credential, and its support has been uneven since its 2023 review ([W3C TAG review](https://tag-github-bot.w3.org/review/820), *older*). The `PasswordCredential` API is Chromium-only *(unverified)*. A normal password form, though, works with every password manager. | Useful only to carry a sync code (§6). Not a store. |
| **Web Share** | The share sheet on phones and macOS/Windows Chrome (§2) | Already the transport for Option 1. |
| **File System Access to a synced folder** | On desktop Chromium, Vitrine could write `vitrine-org.json` into a folder the user picks inside their Dropbox, OneDrive or iCloud Drive client folder. Chrome 122+ offers "Allow on every visit" ([persistent permissions](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api), 2024-01-09, *older*). The API is experimental and not Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker), updated 2026-09-11). Safari and Firefox lack it, and phones can't auto-read the folder. | Only half a solution: it automates the desktop side, and the phone still imports by hand. Defer; it is a possible later "auto-save backup to a folder" for desktop Chromium. |

---

## 8. Option 7: other credible approaches

- **CRDT libraries with a relay (Yjs, Automerge).**
  - Automerge's public `sync.automerge.org` is "experimental… no reliability or data safety guarantees", meant for prototypes, and Automerge advises running your own server ([Automerge network sync](https://automerge.org/docs/tutorial/network-sync/), read 2026-10-19).
  - y-webrtc's default public signaling servers are reported unmaintained ([Yjs forum](https://discuss.yjs.dev/t/is-the-public-signaling-server-that-ships-by-default-with-y-webrtc-still-working/1979), forum post).
  - So in production this is Option 5 with a heavier library.
  - The org data is two kinds of sets, so it needs no general CRDT. A per-item last-writer-wins map with tombstones (§9) is about 50 lines.
  - **Reject the libraries. Keep the idea** as the merge rule.
- **remoteStorage / Solid.** An open protocol in which the user picks their own storage provider. remoteStorage is IETF draft-26 (2025-12-15), still a draft ([datatracker](https://datatracker.ietf.org/doc/html/draft-dejong-remotestorage)), and few users have an account. Reject.

---

## 9. The hidden cost of any automatic sync: deletions

- **Today:** import = union. Folders merge by name, favorites union, and nothing is ever deleted (05 §6.2). Under two-way sync, an unfavorite on the phone would come back from the desktop on the next merge.
- **What automatic sync needs:** an `OrgV2` with a per-entry `updatedAt` and **tombstones** for removed favorites, removed folder items and deleted folders. The merge is per entry, and the newest wins. Folder identity becomes the local `id`, with name-merge kept only for importing v1 files.
- **Lost-update guard:** write with the provider's revision (Dropbox `rev`, in `update` mode). On a conflict, re-download, merge and retry.
- **Tombstones** can be pruned after, say, 90 days. An older device then re-adds at worst a few items.
- **Pin the name first.** B-7 still applies: the final product name must be fixed before any persisted format reaches users. The cloud file name derives from `APP_ID` too.

None of this is needed while sync stays manual.

---

## 10. What should sync

| Data | Sync? | Why |
|---|---|---|
| Folders (name, items, created) | **Yes** | The point of the feature |
| Favorites | **Yes** | Same |
| Per-animation fps overrides (`prefs.fps[animKey]`) | Later, optional | Keyed by opaque animation keys. Harmless, but rarely set. Add it only with org v2. |
| Sort | No (v1) | One tap to set. Defensible later. |
| Theme, backdrop | No | Often deliberately different on a phone and a desktop |
| Grid size, Info drawer open/closed, Play previews | **No** | Device- and screen-specific. Play previews also follows each device's reduced-motion and Save-Data settings (02 §4.8). |
| "Keep me signed in", storage persistence, `lastMode`, backup-tip date | **No** | Per-device security and storage state (D14, D15) |
| Library snapshot, details, image cache | **No** | Re-synced from PixelLab. The cache holds raw ids and URLs (capabilities, S4). |
| **PixelLab API key** | **Never** | Full-access secret (R1 S1). Every device pastes its own. |
| Cloud OAuth token (Dropbox etc.) | **Never** | Per device, scoped to the app folder, and stored with the same session/remember mode as the PixelLab key |

---

## 11. Comparison

| Option | User steps | Build effort | Security / privacy | Cost | Reliability | No backend · view-only · KISS | Phone + desktop |
|---|---|---|---|---|---|---|---|
| 1 Backup file + share sheet | ~3 taps out, ~4 in, per transfer | **None** (designed) | Opaque keys + folder names. User-controlled | $0 | Manual. Never deletes | ✓ ✓ ✓ | ✓ |
| 2a Text blob | ~4 + paste | ~20 lines | Same as 1, plus the clipboard | $0 | Manual | ✓ ✓ ✓ | ✓ (adds nothing) |
| 2b QR | Scan | Encoder + decoder libraries | Low | $0 | ~190–320 keys max | ✓ ✓ ✗ | Partial |
| 2c URL-fragment link | 1 tap | Small | History sync, previews, injection | $0 | Size-bound | ✓ ✓ ✗ | ✓ |
| 2d WebRTC | Pair both online | Signaling + STUN | IP exposure to a third party | ~$0 | Fragile | ✗ ✓ ✗ | ✓ |
| **3a Dropbox App Folder** | 1 tap + consent, once per device | ~100 lines + org v2 | App-folder-only token. Dropbox sees the data | $0 | Automatic | ✓ ✓ ~ | ✓ |
| 3b Google Drive appData | 1 tap + consent, then popups ~hourly | GIS script + CSP change + org v2 | Non-sensitive scope. Third-party script | $0 | Automatic, with interruptions | ✓ ✓ ✗ | ✓ |
| 3c OneDrive app folder | 1 tap + consent, daily reload | ~100 lines + org v2 | Preview scope, personal accounts only | $0 | Automatic | ✓ ✓ ~ | ✓ |
| 3d iCloud CloudKit JS | Apple ID popup | Apple script + paid developer program | Apple sees the data | $99/yr *(unverified)* | Automatic | ✓ ✓ ✗ | ✓ |
| 3e GitHub Gist (PAT) | ~8 steps to make a token | ~60 lines | A second pasted secret | $0 | Automatic | ✓ ✓ ✗ | Poor on phones |
| 4 PixelLab tags / projects | Toggle | Write paths + guard changes | Full-access key writes. Pollutes PixelLab | $0 | 2 of 8 types | ✓ **✗** ✗ | ✓ |
| 5 Own Worker + D1, E2E | Scan or type a code once | Worker + crypto + org v2 + ops | E2E. Our logs see IPs | $0–5/mo | Automatic | **✗** ✓ ✗ | ✓ |
| 6 FSA synced folder | Pick a folder once (desktop) | ~40 lines | Local file | $0 | Desktop only | ✓ ✓ ~ | ✗ phone |
| 7 CRDT + public relay | Pair | Library + relay | Third-party relay | $0 | "No guarantees" | ✗ ✓ ✗ | ✓ |

---

## 12. Recommended path

| When | What | Gate |
|---|---|---|
| **Now (Phases 1–2)** | Ship the backup exactly as designed. Copy only: Settings › Folders & favorites and the backup tip add "Open this file on your other device with Import backup… (save it to iCloud Drive, Google Drive or Dropbox, or AirDrop it)" | None. This is the cross-device answer for v1 |
| **Later, on demand** | **"Sync with Dropbox" (opt-in, Settings)**: PKCE, App Folder, one `vitrine-org.json`, org v2 with tombstones, `rev`-conditional writes, CSP `connect-src` for the Dropbox API hosts, a privacy note, production approval at 50 users | Users actually ask for automatic sync. A spike confirms CORS and PKCE refresh from the static origin. Final name fixed (B-7) |
| **Only if demand shows up** | Google Drive `appDataFolder` as a second provider | The owner accepts the GIS script in `script-src` and hourly re-consent, or Google offers a secretless PKCE path for browser clients |
| **Only if the product changes** | Our own relay: Worker + D1, random sync code, E2E | Public launch, PixelLab's §2.2 answer, demand for sync with no cloud account, and acceptance that "no backend" is gone |
| **Not planned** | PixelLab tags or projects as storage; QR, URL-fragment or WebRTC transfer; public CRDT relays; GitHub Gist; iCloud | §3, §5, §8 |

---

## 13. Open questions and spikes

1. **Owner:** is automatic sync wanted at all, or is "back up and import" enough for v1? (Default: enough.)
2. **Spike (½ day, only if sync gets scheduled):** from a static HTTPS origin, run Dropbox PKCE with `token_access_type=offline`, refresh without a secret, then make a CORS `files/download` and `files/upload` call with `mode: update` and `rev`. Record the response headers.
3. **Check:** the real format of Creator gallery ids, to settle the §1 caveat. That needs only a read of the owner's own `list_images` output in Phase 0. No write is involved.

---

## Sources

Vendor and standards pages were read on 2026-10-19. Dates are the page's own "last updated" date unless marked otherwise.

**Google**
- [Choose Google Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), 2026-09-03
- [Store application-specific data (appDataFolder)](https://developers.google.com/workspace/drive/api/guides/appdata), 2026-09-03
- [GIS: use the token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model), 2026-05-26
- [OAuth 2.0 for client-side web apps (implicit)](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow), 2026-10-16
- [Brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification), 2026-08-19
- [Unverified apps](https://support.google.com/cloud/answer/7454865) and [user cap](https://support.google.com/cloud/answer/15549945), undated
- [Google OAuth2 and PKCE client-secret behaviour](https://ktaka.blog.ccmp.jp/2025/07/oogle-oauth2-and-pkce-understanding.html), third-party blog, 2025-07

**Dropbox**
- [OAuth guide](https://docs.dropboxapi.com/dropbox-api/docs/oauth), undated
- [Developer guide (production approval)](https://www.dropbox.com/developers/reference/developer-guide), undated
- [JS SDK README, PKCE browser example](https://cdn.jsdelivr.net/npm/dropbox@10.46.0/README.md), v10.46.0
- Forum posts: [development user limit](https://community.dropbox.com/en/discussion/846671/does-a-dropbox-app-have-a-limit-on-development-users) and [token lifetime](https://community.dropbox.com/en/discussion/722071/why-the-token-is-becoming-obsolete)

**Microsoft**
- [OneDrive permission scopes](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/permissions_reference), 2026-05-14
- [App folder](https://learn.microsoft.com/en-us/graph/onedrive-sharepoint-appfolder)
- [Refresh tokens](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens), 2026-06-15
- [Graph SDK issue on the localized Apps folder](https://github.com/microsoftgraph/msgraph-sdk-javascript/issues/917)

**Apple**
- [CloudKit JS: CloudKit](https://developer.apple.com/documentation/cloudkitjs/cloudkit.md), read 2026-10-19
- [Forum: Sign in with Apple vs CloudKit identities](https://developer.apple.com/forums/thread/119159), 2019, *older*

**GitHub**
- [PKCE changelog](https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/), 2025-07-14
- [Community discussion #15752](https://github.com/orgs/community/discussions/15752), staff replies 2025-07-15 and 2025-10-27, follow-ups to 2026-08
- [Permissions for fine-grained PATs](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)

**Cloudflare**
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), 2026-10-02
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), 2026-04-21
- [D1 free-tier enforcement](https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/), 2026-09-01
- [KV pricing](https://developers.cloudflare.com/kv/platform/pricing/)

**Web platform**
- [caniuse: Web Share](https://caniuse.com/web-share)
- [MDN: showSaveFilePicker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker), 2026-09-11
- [Chrome: persistent FSA permissions](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api), 2024-01-09, *older*
- [Corbado: WebAuthn PRF support](https://www.corbado.com/blog/passkeys-prf-webauthn), 2025-04-16, updated 2026-09-29
- [W3C TAG: largeBlob review](https://tag-github-bot.w3.org/review/820), 2023, *older*
- [QR code capacity](https://www.qrplanet.com/help/article/what-storage-capacity-does-a-qr-code-have)

**Local-first**
- [Automerge: network sync](https://automerge.org/docs/tutorial/network-sync/)
- [Yjs forum: public signaling server](https://discuss.yjs.dev/t/is-the-public-signaling-server-that-ships-by-default-with-y-webrtc-still-working/1979)
- [remoteStorage draft-26](https://datatracker.ietf.org/doc/html/draft-dejong-remotestorage), 2025-12-15

**PixelLab**
- MCP tool schemas for `update_character_tags`, `update_object_tags` and `add_to_project` (read, not called)
- [Terms of Service](https://pixellab.ai/termsofservice), last updated 2025-11-23, as summarized in research 02 §7
