# 02 — Browser Integration and Token Security

Researched: 2026-10-18. Live header captures in this document were all taken in one test session on 2026-10-18.
Scope: can a pure client-side SPA (Svelte 5 + Vite, no backend) talk to PixelLab directly, and how should it handle the user's secret API token?

Conventions: `<account-uuid>`, `<character-uuid>`, `<tileset-uuid>`, `<animation-uuid>` are placeholders. Real IDs and the `t=` values from live tests are deliberately left out (see "UUIDs are capabilities" below). Statements marked **(inference)** are reasoning from the evidence, not something a source states.

---

## 1. Summary and feasibility verdict

**Verdict: GO. No proxy or backend is needed today.**

- **REST v2 (`https://api.pixellab.ai/v2`) allows cross-origin requests from any origin.** Every preflight tested returned 200. It echoed back the request's `Origin` as `Access-Control-Allow-Origin` (ACAO) and allowed the `authorization` header. Results were the same across origins (`http://localhost:5173`, `https://someuser.github.io`, `https://example.pages.dev`, `https://evil.example`, `null`, `tauri://localhost`) and endpoints. Error responses (401/404) also carry ACAO, so the app can read error bodies.
- **The MCP endpoint (`https://api.pixellab.ai/mcp`) behaves the same way.** It is **stateless Streamable HTTP**: no `Mcp-Session-Id` is issued, `GET` returns 405, and every request is a single POST answered as a `text/event-stream`. Missing exposure of `mcp-session-id` is therefore irrelevant. A browser can call it with plain `fetch` and parse the SSE `data:` line.
- **The media host (`https://backblaze.pixellab.ai`, Cloudflare in front of Backblaze B2) sends `Access-Control-Allow-Origin: *`** and `Cache-Control: public, max-age=31536000`. URLs are not signed: the `?t=` parameter is a cache-buster, and the file is served without it. So `<img crossorigin="anonymous">` plus canvas readback works, and so does `fetch()` → `Blob`. GIF encoding, sprite-sheet composition and ZIP bundling in the browser are feasible.
- **Server-side ZIP/sprite-sheet exports exist and are CORS-readable.** `GET /v2/characters/{id}/zip` and `/spritesheet` (and the MCP `/mcp/characters/{id}/download`/`spritesheet` helpers) returned ZIPs **without any auth**. The OpenAPI declares no security on the two REST routes.
- **Token risk is the real problem, not CORS.** PixelLab has one account-wide bearer token: no scopes and no read-only tokens. A leaked token can spend credits/generations, delete or retag every asset, and use MCP project, git and sandbox tools. The account page has a "Generate new API key" control, which is the only revocation path found.
- **Recommended token default:** keep the token for the session only (memory + `sessionStorage`). "Remember on this device" is an explicit opt-in to `localStorage` with a plain warning. Add a strict CSP (`connect-src` limited to the two PixelLab hosts), allow no third-party scripts, and keep the dependency list short.
- **Main residual risks:**
  1. PixelLab could tighten its very permissive CORS at any time.
  2. Any XSS or malicious dependency in the app gets the token.
  3. ToS §2.2 asks people "building your own service" to contact PixelLab first.

---

## 2. CORS evidence

All tests were unauthenticated `curl` requests. No token was used.

### 2.1 REST v2 preflights

Request: `curl -si -X OPTIONS https://api.pixellab.ai<path> -H "Origin: <origin>" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"`

Paths tested: `/v2/characters`, `/v2/balance`, `/v2/objects`, `/v2/characters/{id}`, `/v2/characters/{id}/zip`, `/v2/tilesets`, `/v2/background-jobs/{id}`.
Origins tested: `http://localhost:5173`, `https://someuser.github.io`, `https://example.pages.dev`.
All 21 combinations returned the same result:

| Header | Value |
|---|---|
| Status | `200 OK` (body `OK`, length 2) |
| `access-control-allow-origin` | the request Origin, reflected exactly |
| `access-control-allow-credentials` | `true` |
| `access-control-allow-methods` | `DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT` |
| `access-control-allow-headers` | the requested headers, echoed (`authorization,content-type`) |
| `access-control-max-age` | `600` |
| `vary` | `Origin, Accept-Encoding` |
| `server` | `uvicorn` |

Edge cases:

| Test | Result |
|---|---|
| Origin `https://evil.example`, request headers `authorization,if-none-match,x-custom-thing,cache-control` | 200; origin reflected; all four headers echoed in ACAH |
| Origin `null` | 200; `access-control-allow-origin: null` |
| Origin `tauri://localhost` | 200; reflected |
| Request method `DELETE` | 200; same allow-methods |

### 2.2 REST v2 actual requests (no auth)

| Request | Status / body | CORS and other headers |
|---|---|---|
| `GET /v2/characters`, `/v2/balance`, `/v2/characters?limit=1`, `/v2/characters/{random-uuid}` | `401 {"detail":"Not authenticated"}`, `www-authenticate: Bearer` | ACAO reflected, ACAC `true`, `access-control-expose-headers: Content-Disposition`, `vary: Origin, Accept-Encoding` |
| `GET /v2/balance` with `Authorization: Bearer invalid-test-value` | `401 {"detail":"Invalid API token"}` | same |
| `GET /v2/characters/{random-uuid}/zip` | `404 {"detail":"Character not found"}` (no 401) | same |
| `GET /v2/characters/<character-uuid>/zip` (real ID) | `200 application/zip`, ~148 KB, `content-disposition: attachment; filename="<name>.zip"` | same; **no auth required** |
| `GET /v2/characters/<character-uuid>/spritesheet` (real ID) | `200 application/zip`, ~104 KB | same; **no auth required** |
| `GET /v2/characters/<character-uuid>`, `GET /v2/tilesets/<tileset-uuid>` | `401` | same |
| `HEAD /v2/balance` | `405`, `allow: GET` | ACAO reflected |
| `GET /v2/llms.txt`, `/v2/openapi.json` | 200; gzip supported (`content-encoding: gzip`) | ACAO reflected |

Not observed on any API response: `ETag`, `Last-Modified`, `Cache-Control` (except on the MCP metadata route below), `Retry-After`, or `X-RateLimit-*`/`RateLimit-*`. Authenticated 200 responses were not captured, because no token was used in curl.

**Important:** only `Content-Disposition` is in `Access-Control-Expose-Headers`. `Retry-After` and `ETag` are not CORS-safelisted response headers. The safelist is `Cache-Control`, `Content-Language`, `Content-Length`, `Content-Type`, `Expires`, `Last-Modified` and `Pragma` ([MDN: Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)). **Browser JS therefore cannot read `Retry-After`** on 423/429 responses, even though the OpenAPI says 423 responses carry it.

OpenAPI security declarations, from [openapi.json](https://api.pixellab.ai/v2/openapi.json):

- **One scheme:** `HTTPBearer`, with no scopes.
- **Require it:** list/detail routes (`/characters`, `/objects`, `/tilesets`, `/tilesets-sidescroller`, `/tiles-pro`, `/isometric-tiles`, `/ui-assets`, `/balance`, `/background-jobs/{id}`, `/objects/{id}/spritesheet`).
- **Declare no security:** `/characters/{id}/zip` and `/characters/{id}/spritesheet`.

### 2.3 MCP endpoint

Endpoint: `https://api.pixellab.ai/mcp`, per [MCP docs](https://api.pixellab.ai/mcp/docs) and `../pixellab-pip/docs/pixellab/pixellab-surfaces-and-services.md`.

Preflight: `OPTIONS /mcp` and `/mcp/`, `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: authorization,content-type,accept,mcp-session-id,mcp-protocol-version,last-event-id`. The three origins above all returned:

| Header | Value |
|---|---|
| Status | `200 OK` |
| `access-control-allow-origin` | reflected |
| `access-control-allow-credentials` | `true` |
| `access-control-allow-methods` | `DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT` |
| `access-control-allow-headers` | all six echoed |
| `access-control-max-age` | `600` |

GET and DELETE preflights also returned 200.

Actual requests (no auth):

| Request | Result |
|---|---|
| `POST /mcp` `initialize` (protocol `2025-06-18`), `Accept: application/json, text/event-stream` | `200`, `Content-Type: text/event-stream`, `cache-control: no-cache, no-transform`, `x-accel-buffering: no`; one `event: message` with the JSON-RPC result; `serverInfo` = "PixelLab MCP Server" 0.2.0. **No `Mcp-Session-Id` header.** ACAO reflected; expose-headers `Content-Disposition` only. |
| Same, with protocol `2025-11-25` | Negotiated `2025-11-25` |
| Same, with invalid bearer | Still `200` (auth is not checked at initialize) |
| `POST /mcp` `tools/list` with no session and no auth | `200` SSE; 103 tools listed; read tools carry `readOnlyHint: true`. **No tool declares an `outputSchema`.** |
| `POST` with `Accept: application/json` only | Still answered as SSE |
| `GET /mcp` with `Accept: text/event-stream` | `405`, `allow: POST, DELETE` |

Interpretation: the server is stateless Streamable HTTP. Session IDs are optional under the spec, and a 405 on GET means "no standalone SSE stream" ([MCP 2025-06-18 transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)). The spec says servers MUST validate `Origin` against DNS rebinding. PixelLab reflects any origin, which matters for local servers, not for a public authenticated API **(inference)**.

MCP no-auth download helpers. These are documented in MCP docs as "No authentication for downloads… UUID acts as the key":

| Request | Result |
|---|---|
| `GET /mcp/characters/<character-uuid>/download` | `200 application/zip` (same bytes as the REST `/zip`), ACAO reflected |
| `GET /mcp/characters/<character-uuid>/spritesheet` | `200 application/zip` |
| `GET /mcp/tilesets/<tileset-uuid>/image` | `302`, `location: https://backblaze.pixellab.ai/file/pixellab-tiles/<account-uuid>/<tileset-uuid>/spritesheet.png?t=<ts>` (only query param: `t`), ACAO reflected |
| `GET /mcp/tilesets/<tileset-uuid>/image?inline=true` | `200 image/png` served directly |
| `GET /mcp/tilesets/<tileset-uuid>/metadata` | `200 application/json`, `cache-control: public, max-age=300` |

### 2.4 Media host `backblaze.pixellab.ai`

Real URLs were obtained only through read-only MCP calls (`list_characters`, `list_images`, `list_topdown_tilesets`, `list_objects`, `get_character` with `include_preview=false`, `get_balance`).

Path patterns:

- Rotations: `https://backblaze.pixellab.ai/file/pixellab-characters/<account-uuid>/<character-uuid>/rotations/<direction>.png?t=<unix-seconds>`
- Animation frames: `https://backblaze.pixellab.ai/file/pixellab-characters/<account-uuid>/<character-uuid>/animations/<animation-uuid>/<direction>/<frame-index>.png?t=<unix-ms>`
- Tilesets: `https://backblaze.pixellab.ai/file/pixellab-tiles/<account-uuid>/<tileset-uuid>/spritesheet.png?t=<ts>`

| Test | Status | Headers |
|---|---|---|
| `HEAD`/`GET` rotation with `?t=`, Origin localhost or github.io | 200 `image/png` (48×48 RGBA, ~2.7 KB) | `Access-Control-Allow-Origin: *`, `access-control-allow-credentials: true`, `vary: origin, access-control-request-method, access-control-request-headers`, `Cache-Control: public, max-age=31536000`, `last-modified: <current time>`, `cf-cache-status: MISS`, `Server: cloudflare`, `x-bz-content-sha1: unverified:<sha1>`, no `ETag` |
| Same file **without** `?t=` | 200 | identical → **`t` is not a signature; URLs do not expire** |
| GET with no `Origin` | 200 | `Access-Control-Allow-Origin: *` still present, no `vary` |
| Animation frame, Origin pages.dev | 200 | same as rotation |
| `OPTIONS` preflight (`Access-Control-Request-Headers: range`) | 200 | ACAO `*`, `access-control-allow-methods: GET`, ACAH `range`, `access-control-max-age: 3600` |

`Last-Modified` changed on every request, so it is useless for revalidation. `x-bz-content-sha1` is not CORS-exposed.

---

## 3. Media and export implications

- **Canvas readback works.** Use `<img crossorigin="anonymous">` or, better, `fetch(url)` → `blob` → `createImageBitmap(blob)` → canvas `getImageData`. ACAO `*` satisfies non-credentialed CORS, so the canvas is not tainted. ACAO `*` is returned even without an `Origin` header, so an earlier non-CORS `<img>` load cannot poison the cache for a later CORS load **(inference)**.
- **Never use `credentials: 'include'` for media.** The wildcard `*` is invalid for credentialed requests ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)). The default `fetch` credentials mode (`same-origin`) is correct.
- **The data model already gives per-frame PNGs.** MCP `get_character` lists 8 rotation URLs plus `{i}.png` frame URLs per animation-direction. REST `CharacterDetail` has `rotation_urls` and `animations` ([OpenAPI](https://api.pixellab.ai/v2/openapi.json)). GIF encoding, frame strips and custom sprite sheets can all be built client-side from these.
- **Use the server ZIPs where they exist** instead of re-zipping:
  - `GET /v2/characters/{id}/zip`: rotations, all animations and metadata.
  - `GET /v2/characters/{id}/spritesheet`: a uniform-grid PNG plus layout JSON in a small ZIP.
  - `GET /v2/objects/{id}/spritesheet`: needs the bearer token; CORS allows it.

  The app can read the `Content-Disposition` filename because it is exposed. Client-side ZIP is only needed for multi-select bundles and custom exports.
- **Tilesets:** use `/mcp/tilesets/{id}/image?inline=true` to avoid the 302. A cross-origin redirect works here, because the target is ACAO `*`, but the redirect adds a hop.
- **Creator gallery (`list_images`/`get_image`) is MCP-only.**
  - `get_image` returns images inline (base64 MCP image content) plus no-auth download URLs, per its tool description. Inline base64 avoids any media-host dependency.
  - `get_image` is annotated `readOnlyHint: false`. Its description mentions retrying gallery saves for job IDs, so it was **not called** in this research, and gallery image hosts are unverified.
  - MCP tools return LLM-oriented text with no `outputSchema`, so parsing `list_images` output is brittle.
- **Sizes are small.** Observed 48 px frames were ~2.7 KB each, a character ZIP ~148 KB, and a sprite-sheet ZIP ~104 KB. Caching thousands of assets fits in tens to low hundreds of MB **(inference from samples)**.

---

## 4. Fallback options evaluated

None is needed today. They matter only if PixelLab tightens CORS. That is a real possibility: reflecting every origin, including `null`, with `allow-credentials: true` is the kind of permissive configuration that often gets locked down later **(inference)**.

| Option | Keeps "no backend"? | Token exposure | Effort / UX | Verdict |
|---|---|---|---|---|
| Direct browser → PixelLab (current) | Yes | Token stays in the browser | Lowest | **Primary** |
| Ask PixelLab to confirm CORS is intentional/supported | Yes | — | One message | **Do this before public launch.** Also ask for exposed `Retry-After`, published rate limits, and read-only tokens. |
| Tauri desktop wrapper | No server; native HTTP has no CORS | Token can go to the OS keychain via plugin | Large: separate build/distribution | **Fallback #1** if CORS closes. `tauri://localhost` is currently reflected too. |
| Tiny self-hosted Cloudflare Worker proxy (user deploys their own) | "Optional backend" the user owns | Token transits the user's Worker | Medium; hard for non-devs | Fallback #2 for power users. Never run a shared proxy that sees everyone's tokens. |
| User-run local proxy (`npx`/Python script on localhost) | Local-only | Token stays on the machine | Medium; must run a process | Dev/power-user fallback only |
| Browser extension (host permissions bypass CORS) | Yes | Extension storage | Large: store review, per-browser builds | Not recommended; heavier than Tauri for the same gain |

---

## 5. Token security design

### 5.1 Facts about the PixelLab token

- **Where users get it:** the account settings page, `https://pixellab.ai/account`. The OpenAPI description says to copy the API token there and send it as `Authorization: Bearer` ([OpenAPI info](https://api.pixellab.ai/v2/openapi.json)). The same token works for REST v2 and MCP (`../pixellab-pip/docs/pixellab/pixellab-auth-and-security.md`).
- **There are no scopes and no read-only tokens.** OpenAPI defines a single `HTTPBearer` scheme with no scopes. The public account-page JS bundle shows one key with "Copy API key" and a **"Generate new API key"** button. That button is the revocation/rotation path. Whether generating a new key immediately invalidates the old one is **unverified** (likely, given a single-key UI).
- **Reads are free; writes are not.**
  - Reads: `get_balance` was unchanged before and after a `list_characters` call, and pip's cost guidance treats polling/downloads as free (`../pixellab-pip/skills/pixellab-pip/references/cost-routing.md`).
  - Generation endpoints document `402 Insufficient credits`.
  - The same token can DELETE characters, objects, animations, tilesets, tiles-pro, isometric tiles and UI assets, PATCH tags, cancel jobs, and, via MCP, reach projects/git ("Clone and push game project source code", per MCP server instructions), sandboxes and chat tools.
- **Blast radius of a leak:** credit/subscription theft, deletion or vandalism of the whole library, exposure of all prompts and assets, and access to Game Builder project source. A view-only app cannot shrink this. Only PixelLab can, by offering scoped tokens.
- **UUIDs are capabilities.** Character ZIPs, sprite sheets and tileset images download with **no auth given only the UUID**, and Backblaze URLs embed `<account-uuid>/<asset-uuid>` and never expire. Asset IDs and media URLs must be treated as semi-secret: keep them out of shareable links, logs and error reports.

### 5.2 Storage options compared

| Option | Survives reload | Survives restart | XSS / malicious dependency | Shared computer / disk access | Notes |
|---|---|---|---|---|---|
| Memory only | No | No | Readable/interceptable while open | Best | Re-paste on every reload; poor UX |
| `sessionStorage` | Yes (same tab) | No (tab close) | Readable | Good | OWASP: prefer it when persistence isn't needed ([OWASP HTML5](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)). Browser session restore may persist it (**unverified**). |
| `localStorage` | Yes | Yes | Readable | Plaintext in profile | OWASP: don't store session identifiers there; data is always JS-accessible |
| IndexedDB (plain) | Yes | Yes | Readable | Plaintext in profile | Same risk as localStorage; OWASP says avoid storing secrets there |
| IndexedDB + non-extractable device `CryptoKey` | Yes | Yes | Usable by XSS (it can decrypt) | Weak: key and ciphertext sit in the same profile | OWASP: a non-extractable key "doesn't fully protect persisted keys". Obfuscation only; **not recommended** as a security claim. |
| Passphrase-encrypted (PBKDF2-SHA256 → AES-GCM-256) | Yes | Yes | Readable once unlocked | Good, if the passphrase is strong | WebCrypto supports PBKDF2 but not Argon2 ([MDN deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey)). OWASP: PBKDF2-HMAC-SHA256 at 600,000 iterations; Argon2id minimum 19 MiB / t=2 / p=1 ([OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)). Argon2 needs a WASM dependency, which adds supply-chain risk. |
| `PasswordCredential` (Credential Management) | Browser-managed | Yes | Readable once retrieved | Browser password manager | Experimental, not Baseline, secure-context and top-level only ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PasswordCredential)). Chromium-only per general knowledge; Firefox/Safari lack it. **Not viable as the only path.** |
| Password-manager autofill via plain form markup (`<form>` with a fixed username field + `<input type="password" autocomplete="current-password">`) | Browser-managed | Yes | Readable once filled | Password manager | Works in every browser with no API, but save prompts are heuristic **(inference; test per browser)** |

### 5.3 Recommended default and options

1. **Default: "This session only."** Keep the token in a module-scoped variable and mirror it to `sessionStorage` so reload/HMR keeps working. Clear both on "Forget token" and on any 401 `Invalid API token`.
2. **Opt-in: "Remember on this device"** (checkbox, off by default). Store in `localStorage` with an inline warning: "Anyone with access to this browser profile, or any malicious extension, can read it. Don't use on shared computers."
3. **Free extra:** build the token field as a real password form so users' password managers can save and autofill it. No storage code is needed.
4. **Deferred (YAGNI until users ask): passphrase encryption** (PBKDF2 600k + AES-GCM, native WebCrypto, no dependency). It protects only at rest, not against XSS, and costs a passphrase prompt every session.
5. **Always provide:**
   - A masked input with a reveal toggle and a never-show-full display (last 4 characters only).
   - **"Test token"** using `GET /v2/balance`: documented, free, read-only. Distinguish `401 Invalid API token` from network/CORS errors.
   - **"Forget token"**, plus a link to `https://pixellab.ai/account` labeled "Generate a new API key to revoke this one".
   - A one-line notice that PixelLab tokens are full-access (no read-only option).

### 5.4 Threat model and mitigations

| Threat | Impact | Mitigation | Residual |
|---|---|---|---|
| XSS (e.g. asset names/prompts rendered as HTML) | Token theft; a script can also wrap `fetch` and read the header, so storage choice doesn't help | Render all API strings as text (never `{@html}`); strict CSP; Trusted Types where the framework allows | Any successful XSS = token compromise |
| Malicious/compromised npm dependency | Same as XSS, at build time | Minimal deps; committed lockfile; `npm ci`; `--ignore-scripts` where possible; review updates; no runtime CDN scripts (so SRI is moot: all JS is self-hosted) | Not eliminable |
| Browser extensions with host access | Can read the DOM/storage | Document it; session-only default | Not mitigable by the app |
| Shared computer | Next user reuses the token | Session-only default; "Forget token"; warning on "Remember" | User choice |
| Shoulder-surfing / screen sharing | Token visible | `type=password`, reveal toggle, last-4 display | Low |
| Token in URLs/logs/error reports | Leak via history, referrer, screenshots, bug reports | Never put the token (or asset UUIDs) in URL/query/hash; no telemetry or error-reporting service; never log request headers; redact `Authorization` in any debug output | Low |
| Phishing clone of the gallery on another origin | Users paste the token into the fake | PixelLab accepts every origin, so the app can't prevent this. Publish one canonical URL, keep it open source, and tell users to rotate after trying third-party tools. | Medium; outside app control |
| Clickjacking of the settings page | Low (framing can't read the token) | `frame-ancestors 'none'`, which needs a real HTTP header (not `<meta>`) | Low |
| CSRF | N/A (bearer header, no cookies) | — | — |

### 5.5 CSP for the production build

Serve this as an HTTP header (Cloudflare Pages `_headers`, Netlify, etc.):

```
default-src 'none';
script-src 'self';
style-src 'self';
img-src 'self' blob: https://backblaze.pixellab.ai;
connect-src https://api.pixellab.ai https://backblaze.pixellab.ai;
font-src 'self';
manifest-src 'self';
worker-src 'self';
base-uri 'none';
form-action 'none';
object-src 'none';
frame-ancestors 'none';
```

- **`connect-src`:** covers REST, MCP, the tileset 302 target and media fetches. It also enforces "no telemetry" mechanically.
- **`img-src data:`:** add it only if Vite inlines small assets. Otherwise set `build.assetsInlineLimit: 0`. Never allow `data:` in `script-src` ([Vite features: CSP](https://vite.dev/guide/features)).
- **`style-src` without `'unsafe-inline'`** should hold. Svelte 5 transitions use the Web Animations API, which fixed the long-standing "transitions need `unsafe-inline`" issue as of 2024-11-01 ([sveltejs/svelte#6662](https://github.com/sveltejs/svelte/issues/6662)). Verify against a real build.
- **Trusted Types** (`require-trusted-types-for 'script'`) has been Baseline since February 2026 ([MDN trustedTypes](https://developer.mozilla.org/en-US/docs/Web/API/trustedTypes); Firefox 148 per [Sauce Labs](https://docs.saucelabs.com/web-apps/quarterly-browser-updates/)). Whether Svelte 5's runtime (which builds templates from HTML strings) runs under it without a default policy is **unverified**. Test before enabling.
- **Hosting:** a `<meta>` CSP is the fallback for hosts without header control, such as GitHub Pages. It does not support all features: per the CSP spec, `frame-ancestors`, `report-uri` and `sandbox` are ignored, and report-only cannot be used ([MDN CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)). Prefer a host that sets headers.

---

## 6. Networking layer design

**Rate limits are not published.**

- ToS has no rate-limit clause.
- OpenAPI documents `429 "Too many requests"` on `GET /characters`, `/characters/{id}` and `/background-jobs/{id}`, and `429 "Too many concurrent jobs"` on generation routes.
- No rate-limit headers were observed.
- `Retry-After` is documented on `423 Locked` ("still generating") but is not CORS-exposed, so JS cannot read it.

Design, kept small:

- **Concurrency:** one semaphore per host. API: 4 in flight. Media: 8 (Cloudflare-cached, immutable). These are conservative guesses **(inference)**; lower API concurrency to 2 automatically after any 429.
- **Pagination:** use the documented maxima:
  - `limit` 100: characters, objects, tilesets, isometric tiles, UI assets.
  - `limit` 50: sidescroller tilesets, tiles-pro, and MCP `list_images`/`list_*`.

  Responses include `total` for progress UI.
- **Sync strategy:** list endpoints first (cheap, give `preview_url`/`image_url`). Fetch details (`/characters/{id}` for animations) lazily on open, with background prefetch at concurrency 1–2.
- **Retries:**
  - 429, 5xx and network errors: exponential backoff with full jitter (base 1 s, cap 30 s, max 5 tries; JS can't see `Retry-After`).
  - 423: treat as "processing" and re-check on the next sync. The gallery shows completed assets only.
  - 401: stop everything and prompt for the token.
  - 404: mark the asset deleted locally.
  - Other 4xx: no retry.
  - Use `AbortController` to cancel on navigation.
- **Dedupe:** an in-flight `Map<url, Promise>` for GETs.
- **Caching:**
  - **Metadata, folders, favorites → IndexedDB.** Store records keyed by asset ID with `fetchedAt`. `CharacterSummary` has `updated_at`; other types only `created_at`.
  - **Image/ZIP blobs → Cache API**, keyed by the full media URL including `t`. Responses are `public, max-age=31536000`, have no usable validators, and `t` changes when a file is re-saved **(inference: `t` tracks the upload timestamp)**, so cache entries can be treated as immutable. A URL change means new content.
  - API JSON had no validators. Refresh means re-listing and diffing by ID, `updated_at` and URL.
- **Refresh UX:** stale-while-revalidate on app open, a manual "Sync" button, and a "Last synced …" label. No background polling.
- **Offline viewing:**
  - Without a service worker: metadata from IndexedDB plus blobs from the Cache API work only while the app shell is loadable.
  - True offline needs a small hand-written service worker that precaches the shell. Add it only if offline is an explicit requirement.
- **Storage quotas and eviction:**
  - Show `navigator.storage.estimate()`. Call `navigator.storage.persist()` when the user enables the offline cache. Chromium/Safari grant it silently based on engagement; Firefox prompts.
  - Chromium allows up to 60% of disk per origin; Firefox best-effort allows the smaller of 10% of disk or a 10 GiB group limit.
  - Safari deletes script-written storage after 7 days of browser use without interaction when tracking prevention is on. Cached data **and a remembered token** can vanish.
  - Eviction removes an origin's data all at once ([MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). Design for full re-sync and wrap writes in `try/catch` for `QuotaExceededError`.
- **Privacy:** no telemetry, analytics, font CDNs or third-party requests; `connect-src` enforces this.
- **MCP transport:** for MCP-only data (Creator gallery, maps), use one `fetch` POST per JSON-RPC call with `Accept: application/json, text/event-stream` and an `MCP-Protocol-Version` header, then parse the `data:` line. No session handling is needed because the server is stateless. That is about 20 lines, so an SDK is not required.

---

## 7. ToS notes

Source: [pixellab.ai/termsofservice](https://pixellab.ai/termsofservice), page header "Last Updated: 2025-11-23", read 2026-10-18. This is a summary, not legal advice.

- **§2.2:** programmatic use is allowed only through the official API at `api.pixellab.ai`, described as intended for "vibe coding and in-game live asset creation". Building your own service or reselling requires contacting PixelLab first; they say they are open to it.
- **§3.2:** no copying, modifying, distributing, selling or leasing parts of PixelLab without a license.
- **§1.3/§3.3:** users own their outputs and may use and distribute them, including commercially. **§1.2:** no training models on outputs without permission.
- **§8.1:** PixelLab may suspend or terminate access at any time, for any reason.
- **§2.1/§2.3:** usage limits may change with reasonable notice.
- **Not addressed:** API tokens/credential sharing, rate limits, third-party clients, reverse engineering.
- **Related guidance:** a PixelLab maintainer asked people not to automate website-internal endpoints with session tokens (`../docs/pixellab-auth-and-automation-risk.md`). The gallery must use only documented REST v2/MCP routes, which this design does. Website routes such as `/get-account-data` and `/characters/{id}/zip` without `/v2` are out of bounds (`../docs/pixellab-website-endpoints-research.md`).

Assessment **(inference)**:

- A free, open-source, bring-your-own-token, view-only client on the documented API fits "programmatic use through the official API". The user's own token and data never touch a third party.
- "Building your own service" is ambiguous for a hosted web app. A short message to PixelLab before public launch removes that risk and also lets the project ask about CORS stability and read-only tokens.

---

## 8. Implications for the gallery app

1. **Architecture:** a direct browser → `api.pixellab.ai` (REST v2 + MCP) and `backblaze.pixellab.ai` design is viable. No proxy is needed.
2. **REST first; MCP only for MCP-only data** (Creator gallery `list_images`/`get_image`, maps). Wrap MCP parsing in one module, because the output is unstructured text and can change.
3. **Exports:** use server ZIP/sprite-sheet routes for characters (no auth) and objects (bearer). Build GIFs, custom sheets and multi-select ZIPs client-side from per-frame PNGs.
4. **Token UX:** session-only by default, opt-in remember, Test token via `/v2/balance`, Forget token, rotation link, and a full-access warning.
5. **Hosting:** pick a static host that sets response headers (CSP with `frame-ancestors`). Use GitHub Pages only with a `<meta>` CSP and accepted gaps.
6. **Treat asset UUIDs and media URLs as sensitive:** no IDs in shareable routes, logs or exported diagnostics. Exported files themselves are fine.
7. **Rendering:** text-only interpolation of all API strings; no `{@html}`.
8. **Resilience:** tolerate CORS failure with a clear message ("PixelLab blocked browser access — see fallback options"), because a CORS change looks like a generic network error in JS.

---

## 9. Open questions and risks

- **CORS stability.** Current behavior (reflect any origin, credentials `true`) is undocumented and could be tightened. Ask PixelLab to confirm browser clients are supported.
- **Authenticated response headers were not observed** (no token was used in curl): `ETag`/`Cache-Control` on JSON, 429 behavior and any rate-limit headers. Verify in-browser with the user's token during implementation.
- **REST `preview_url`, `rotation_urls` and UI `image_url` hosts are unverified.** They are expected to be `backblaze.pixellab.ai`, as with MCP. If another host appears, it must be added to CSP and checked for CORS.
- **Creator gallery image delivery is unverified.** `get_image` was not called because of its `readOnlyHint: false` annotation. Confirm that `gallery:<id>` reads have no side effects and check the inline/base64 size limits.
- **Token rotation semantics:** does "Generate new API key" revoke the old key immediately?
- **No read-only/scoped tokens.** This is the biggest structural risk and only PixelLab can fix it.
- **Svelte 5 + Trusted Types** compatibility.
- **Whether `sessionStorage` is persisted by session restore** in each browser.
- **ToS "own service" ambiguity** for a publicly hosted client.
- **UUIDs are bearer capabilities** for ZIP/image downloads, by PixelLab's design ("UUID acts as the key"). Any leak of IDs/URLs leaks assets.

---

## Sources

Live tests (2026-10-18, unauthenticated curl plus read-only MCP calls):

- `https://api.pixellab.ai/v2/*` preflights and GETs (§2.1–2.2)
- `https://api.pixellab.ai/mcp` initialize, tools/list, GET, preflights, plus `/mcp/characters/*` and `/mcp/tilesets/*` helpers (§2.3)
- `https://backblaze.pixellab.ai/file/...` HEAD/GET/OPTIONS (§2.4)
- MCP `get_balance` before and after `list_characters` (balance unchanged; amounts not recorded)

PixelLab:

- [REST v2 OpenAPI](https://api.pixellab.ai/v2/openapi.json): endpoint list, security per route, 429/423 descriptions, pagination limits, schemas, token location
- [REST v2 llms.txt](https://api.pixellab.ai/v2/llms.txt)
- [MCP docs](https://api.pixellab.ai/mcp/docs): "No authentication for downloads", tileset `?inline=true`
- [Terms of Service](https://pixellab.ai/termsofservice) (Last Updated 2025-11-23)
- [Account page](https://www.pixellab.ai/account) and its public Next.js bundle (`/_next/static/chunks/pages/account-*.js`): "Copy API key" / "Generate new API key"

Sibling research (paths relative to the gallery project root):

- `../pixellab-pip/docs/pixellab/pixellab-auth-and-security.md`
- `../pixellab-pip/docs/security.md`
- `../pixellab-pip/docs/pixellab/pixellab-surfaces-and-services.md`
- `../pixellab-pip/skills/pixellab-pip/references/cost-routing.md`
- `../docs/pixellab-secret-storage-risk.md`
- `../docs/pixellab-auth-and-automation-risk.md`
- `../docs/pixellab-website-endpoints-research.md`
- `../docs/pixellab-public-api-mcp-research.md`

Standards and platform:

- [MCP spec 2025-06-18: Transports](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MDN: Access-Control-Expose-Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Expose-Headers)
- [MDN: Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN: PasswordCredential](https://developer.mozilla.org/en-US/docs/Web/API/PasswordCredential)
- [MDN: SubtleCrypto.deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey)
- [MDN: CSP guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [MDN: trustedTypes](https://developer.mozilla.org/en-US/docs/Web/API/trustedTypes)
- [Sauce Labs: quarterly browser updates](https://docs.saucelabs.com/web-apps/quarterly-browser-updates/) (Firefox 148 Trusted Types)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Vite: Features (CSP)](https://vite.dev/guide/features)
- [sveltejs/svelte#6662](https://github.com/sveltejs/svelte/issues/6662) (transitions via Web Animations API in Svelte 5)
