// Pure rules for the first-page check (docs/plan/mvp-plan.md "How the first-page check decides"). No I/O, no clock.
import type { Card, FamilyState, Page } from '../types';

export const CHECK_TTL_MS = 3_600_000;
export const DEEP_TTL_MS = 7 * 86_400_000;

const same = (a: Card, b: Card) => a.key === b.key && a.fp === b.fp;

/** Fold a fresh page 0 into the saved copy. */
export function applyCheck(saved: FamilyState | undefined, page0: Page, now: number): FamilyState {
  const replaced: FamilyState = { total: page0.total, cards: page0.cards, checkedAt: now, deepLoadedAt: null };
  if (!saved) return replaced;
  const n = page0.cards.length;
  const added = page0.total - saved.total;
  // A short page holds the whole list: nothing deeper to keep. Growth of n or more leaves no old row to anchor on.
  if (n >= page0.total || added < 0 || added >= n || saved.cards.length < n - added) return replaced;
  // New rows sit on top; every other row of page 0 must be the same asset as the saved row it replaces.
  for (let i = added; i < n; i++) if (page0.cards[i].key !== saved.cards[i - added].key) return replaced;
  // Same asset + same fingerprint keeps the saved card (and its resolved picture); otherwise the fresh card wins.
  const head = page0.cards.map((c, i) => (i >= added && same(c, saved.cards[i - added]) ? saved.cards[i - added] : c));
  return { ...saved, total: page0.total, cards: [...head, ...saved.cards.slice(n - added)], checkedAt: now };
}

/** Append the page that was requested starting one row back; 'reload' when the list shifted. */
export function joinNextPage(saved: FamilyState, offset: number, page: Card[], now: number): FamilyState | 'reload' {
  if (offset < 1 || saved.cards.length < offset || !page.length || !same(page[0], saved.cards[offset - 1])) return 'reload';
  return { ...saved, cards: [...saved.cards.slice(0, offset), ...page.slice(1)], deepLoadedAt: saved.deepLoadedAt ?? now };
}

export const isFresh = (state: FamilyState | undefined, now: number) => !!state && now - state.checkedAt < CHECK_TTL_MS;

// ponytail: pageSize defaults to 100; callers for 50-row families (tilesets-side, tiles-pro) must pass 50.
export function dropExpiredDeep(state: FamilyState, now: number, pageSize = 100): FamilyState {
  if (state.deepLoadedAt === null || now - state.deepLoadedAt < DEEP_TTL_MS) return state;
  return { ...state, cards: state.cards.slice(0, pageSize), deepLoadedAt: null };
}
