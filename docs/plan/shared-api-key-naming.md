# Shared PixelLab API key naming

Owner request: 2026-10-22. Applies to PixelDoll and PixelLab Backpack.

- Remembered browser credentials use `localStorage["pixellabApiKey"]` on both apps. Session-only credentials retain each app's existing behavior.
- Agent development uses `PIXELLAB_API_KEY_AGENT_DEV` in each ignored repo-root `.env`. Agent credentials remain in memory; no build or CI receives them.
- Each app migrates its previous saved name on load. An existing shared credential wins. Failed migration writes retain readable credentials. Forget and disabling persistence remove the shared name and both known legacy names.
- Other apps adopt saved credential changes on reload. Live synchronization between apps is outside this change.

## Cached account ownership

The gallery saves a SHA-256 credential fingerprint beside its verified library cache, never the credential. Startup only trusts a warm cache when that fingerprint matches the loaded credential. A missing or different fingerprint uses the existing account verification path before showing cached account data. A failed account-switch wipe cannot certify ownership. Temporary failures retain saved authentication and offer retry; an invalid credential is discarded.

## Calls and checks budget

| Trigger | PixelLab requests |
|---|---|
| Same verified key, cache under one hour old | 0 |
| First load after upgrading, or a changed shared key | Existing account check: 1 Characters first page, up to 1 growth-offset row and up to 6 other family first pages |
| Following open check | Reuses first pages already requested; combined verification/open check is at most 7 family first pages plus 1 growth-offset row |
| Retry after temporary failure | User initiated, same existing verification budget and HTTP retry/cap rules |
| PixelDoll authentication check | Existing free `GET /balance`; no new API path |
| Generation, edit, mutation | 0 |

No new host, method, background polling or paid-generation request is added. Normal gallery first-page refresh behavior is unchanged after ownership is verified.

## Review and validation

An independent sub-agent challenged both implementations. Valid findings fixed: warm-cache account mismatch, legacy-token resurrection after Forget, full-storage migration failures, transient restore failures deleting shared authentication, a failed wipe certifying stale data, and a duplicate daily-cap recovery allowance.

Coverage includes shared/legacy precedence, quota failures, both legacy names during Forget, changed and missing cache fingerprints, temporary verification failures and retry, invalid-key rejection, and failed cache wipe. A synthetic integration check serves both production builds under one loopback origin and exercises sharing, account switching and Forget in both directions. Real credentials are tested only through localhost agent mode and never displayed, persisted by tests, or committed.
