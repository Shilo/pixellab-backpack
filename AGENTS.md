# PixelLab Backpack

Unofficial, view-only, client-side gallery for PixelLab art (Svelte 5, Vite 8, TypeScript). Overview: [README.md](README.md).

## Validate

`npm run check && npm test && npm run build` (the build runs `scripts/dist-guard.mjs`). Then `npx playwright test --workers=2`:
one Playwright run at a time. It serves the build on its own port, 4291, and fails rather than reuse a server already
there. The e2e tests mock PixelLab and stay keyless.

## Agent testing (PixelLab key)

- AI agents (Claude, Codex, others) that need the PixelLab key run the agent dev server: `npm run dev:agent` (launch config
  `app-dev-agent`, http://localhost:5281). It serves `PIXELLAB_TOKEN_AGENT_DEV` from the repo-root `.env` to same-origin
  localhost requests; the app connects through the normal key check (this tab only) and shows an "Agent mode" badge.
- Humans never use it. `npm run dev` (launch config `app-dev`, :5173) has no key endpoint: paste the key on the key screen,
  as in production. Builds never contain any of this (`vite build --mode agent` refuses to run; the dist guard checks `dist/`).
- Never open, print, log, screenshot or commit the key or `.env`. The app is read-only: its first-page check on open
  (7 GET requests, then at most once an hour) is the check; don't add other calls.
- Keyless scripts on the agent server set `localStorage['backpack.agentKey'] = 'off'` before the app loads.

## GitHub Pages

`.github/workflows/pages.yml` checks and builds every PR and push to `main`, and deploys `main` to Pages. Owner step, once the
repo is on GitHub: Settings → Pages → Source = "GitHub Actions". No secrets: the key never reaches CI.
