// Pure rules for the first-page check (docs/plan/mvp-plan.md "How the first-page check decides"). No I/O, no clock.
import type { Card, FamilyState, Page } from '../types';

export const CHECK_TTL_MS = 3_600_000;
export const DEEP_TTL_MS = 7 * 86_400_000;

/** Fold a fresh page 0 into the saved copy. */
export function applyCheck(saved: FamilyState | undefined, page0: Page, now: number): FamilyState {
  // Same asset + same fingerprint keeps the saved card (and its resolved picture), in every branch.
  const old = new Map(saved?.cards.map((c) => [c.key, c]));
  const cards = page0.cards.map((c) => (old.get(c.key)?.fp === c.fp ? old.get(c.key)! : c));
  const replaced: FamilyState = { total: page0.total, cards, checkedAt: now, deepLoadedAt: null };
  if (!saved) return replaced;
  const n = page0.cards.length;
  const added = page0.total - saved.total;
  // A short page holds the whole list: nothing deeper to keep. Growth of n or more leaves no old row to anchor on.
  if (n >= page0.total || added < 0 || added >= n || saved.cards.length < n - added) return replaced;
  // New rows sit on top; every other row of page 0 must be the same asset as the saved row it replaces.
  for (let i = added; i < n; i++) if (page0.cards[i].key !== saved.cards[i - added].key) return replaced;
  return { ...saved, total: page0.total, cards: [...cards, ...saved.cards.slice(n - added)], checkedAt: now };
}

/** Append the page that was requested starting one row back; 'reload' when the list shifted (a different asset in the overlap row).
 * A changed overlap row (same asset, new fingerprint) is updated in place; an unchanged one keeps the saved card and its picture. */
export function joinNextPage(saved: FamilyState, offset: number, page: Card[], now: number): FamilyState | 'reload' {
  const prev = saved.cards[offset - 1];
  if (offset < 1 || !prev || !page.length || page[0].key !== prev.key) return 'reload';
  const head = page[0].fp === prev.fp ? prev : page[0];
  return { ...saved, cards: [...saved.cards.slice(0, offset - 1), head, ...page.slice(1)], deepLoadedAt: saved.deepLoadedAt ?? now };
}

export const isFresh = (state: FamilyState | undefined, now: number) => !!state && now - state.checkedAt < CHECK_TTL_MS;

/** pageSize is the family's page-0 size (100, or 50 for tilesets-side and tiles-pro); required so a caller cannot forget it. */
export function dropExpiredDeep(state: FamilyState, now: number, pageSize: number): FamilyState {
  if (state.deepLoadedAt === null || now - state.deepLoadedAt < DEEP_TTL_MS) return state;
  return { ...state, cards: state.cards.slice(0, pageSize), deepLoadedAt: null };
}
