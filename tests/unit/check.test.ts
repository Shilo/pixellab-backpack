import { describe, expect, it } from 'vitest';
import { applyCheck, CHECK_TTL_MS, DEEP_TTL_MS, dropExpiredDeep, isFresh, joinNextPage } from '../../src/lib/data/check';
import type { Card, FamilyState } from '../../src/lib/types';

const card = (n: number, fp = 'a'): Card => ({ key: 'k' + n, id: 'id' + n, name: 'n' + n, done: true, thumb: null, fp: n + fp });
const cards = (from: number, count: number) => Array.from({ length: count }, (_, i) => card(from + i));
const state = (total: number, cs: Card[], deep: number | null = null): FamilyState => ({ total, cards: cs, checkedAt: 1, deepLoadedAt: deep });
const N = 5; // page size in these tests

describe('applyCheck', () => {
  it('first ever check stores page 0', () => {
    const r = applyCheck(undefined, { total: 12, cards: cards(0, N) }, 9);
    expect(r).toEqual({ total: 12, cards: cards(0, N), checkedAt: 9, deepLoadedAt: null });
  });

  it('same total, same rows: unchanged but checkedAt updated, deep rows kept', () => {
    const saved = state(12, cards(0, 8), 5);
    const r = applyCheck(saved, { total: 12, cards: cards(0, N) }, 9);
    expect(r).toEqual({ ...saved, checkedAt: 9 });
  });

  it('new assets on top: prepended, old rows (incl. deep) kept', () => {
    const saved = state(12, cards(0, 8), 5);
    const r = applyCheck(saved, { total: 14, cards: [card(100), card(101), ...cards(0, 3)] }, 9);
    expect(r.cards.map((c) => c.key)).toEqual(['k100', 'k101', 'k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7']);
    expect(r.total).toBe(14);
    expect(r.deepLoadedAt).toBe(5);
  });

  it('prepend limit: up to page size - 1 new; page size or more replaces', () => {
    const saved = state(12, cards(0, 8), 5);
    const ok = applyCheck(saved, { total: 12 + N - 1, cards: [...cards(100, N - 1), card(0)] }, 9);
    expect(ok.cards).toHaveLength(8 + N - 1);
    expect(ok.deepLoadedAt).toBe(5);
    const over = applyCheck(saved, { total: 12 + N, cards: cards(100, N) }, 9);
    expect(over.cards).toEqual(cards(100, N));
    expect(over.deepLoadedAt).toBeNull();
  });

  it('a row changed in place: that row updates, others keep their saved card', () => {
    const saved = state(12, cards(0, 8).map((c) => ({ ...c, thumb: 'img' })), 5);
    const changed = { ...card(2), name: 'renamed', fp: '2b' };
    const page = [...cards(0, 2), changed, ...cards(3, 2)];
    const r = applyCheck(saved, { total: 12, cards: page }, 9);
    expect(r.cards[2]).toEqual(changed);
    expect(r.cards[1].thumb).toBe('img');
    expect(r.cards).toHaveLength(8);
    expect(r.deepLoadedAt).toBe(5);
  });

  it('a deletion (total shrinks) replaces page 0 and drops deep rows', () => {
    const r = applyCheck(state(12, cards(0, 8), 5), { total: 11, cards: cards(1, N) }, 9);
    expect(r).toEqual({ total: 11, cards: cards(1, N), checkedAt: 9, deepLoadedAt: null });
  });

  it('a reorder with the same total replaces page 0 and drops deep rows', () => {
    const page = [card(1), card(0), ...cards(2, 3)];
    const r = applyCheck(state(12, cards(0, 8), 5), { total: 12, cards: page }, 9);
    expect(r.cards).toEqual(page);
    expect(r.deepLoadedAt).toBeNull();
  });

  it('a delete plus an add (same total, different rows) replaces', () => {
    const page = [card(100), ...cards(2, 4)];
    const r = applyCheck(state(12, cards(0, 8), 5), { total: 12, cards: page }, 9);
    expect(r.cards).toEqual(page);
    expect(r.deepLoadedAt).toBeNull();
  });

  it('a short list (one page) is simply replaced', () => {
    const r = applyCheck(state(3, cards(0, 3)), { total: 4, cards: [card(100), ...cards(0, 3)] }, 9);
    expect(r.cards).toHaveLength(4);
    expect(r.cards[0].key).toBe('k100');
  });

  // A resolved picture link (costly families) must survive every replace branch, or each check re-spends API requests.
  const withThumbs = (cs: Card[]) => cs.map((c) => ({ ...c, thumb: 'img' + c.key }));

  it('a short list keeps resolved pictures of unchanged rows', () => {
    const r = applyCheck(state(3, withThumbs(cards(0, 3))), { total: 4, cards: [card(100), ...cards(0, 3)] }, 9);
    expect(r.cards.map((c) => c.thumb)).toEqual([null, 'imgk0', 'imgk1', 'imgk2']);
  });

  it('a deletion keeps resolved pictures of unchanged rows, but not of changed ones', () => {
    const page = [card(1), { ...card(2), fp: '2b' }, ...cards(3, 3)];
    const r = applyCheck(state(12, withThumbs(cards(0, 8)), 5), { total: 11, cards: page }, 9);
    expect(r.cards.map((c) => c.thumb)).toEqual(['imgk1', null, 'imgk3', 'imgk4', 'imgk5']);
    expect(r.deepLoadedAt).toBeNull();
  });
});

describe('joinNextPage', () => {
  const saved = state(12, cards(0, N), 3);

  it('overlap matches: joined, overlap row not duplicated', () => {
    const r = joinNextPage(saved, N, cards(N - 1, N), 9);
    expect(r).not.toBe('reload');
    expect((r as FamilyState).cards.map((c) => c.key)).toEqual(['k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8']);
    expect((r as FamilyState).deepLoadedAt).toBe(3);
  });

  it('first deep load stamps deepLoadedAt with now', () => {
    const r = joinNextPage({ ...saved, deepLoadedAt: null }, N, cards(N - 1, N), 9) as FamilyState;
    expect(r.deepLoadedAt).toBe(9);
  });

  it('overlap row is a different asset: reload', () => {
    expect(joinNextPage(saved, N, cards(N, N), 9)).toBe('reload');
  });

  it('overlap row is the same asset with a new fingerprint: joined, the fresh row replaces the old one', () => {
    const fresh = card(N - 1, 'z');
    const r = joinNextPage(saved, N, [fresh, ...cards(N, 4)], 9) as FamilyState;
    expect(r.cards.map((c) => c.key)).toEqual(['k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8']);
    expect(r.cards[N - 1]).toBe(fresh);
  });

  it('unchanged overlap row keeps the saved card (and its resolved picture)', () => {
    const withThumb = state(12, [...cards(0, N - 1), { ...card(N - 1), thumb: 'img' }], 3);
    const r = joinNextPage(withThumb, N, cards(N - 1, N), 9) as FamilyState;
    expect(r.cards[N - 1]).toBe(withThumb.cards[N - 1]);
  });

  it('empty page or bad offset: reload', () => {
    expect(joinNextPage(saved, N, [], 9)).toBe('reload');
    expect(joinNextPage(saved, N + 1, cards(N, N), 9)).toBe('reload');
  });
});

describe('isFresh', () => {
  const s = state(1, cards(0, 1));
  it('59:59 fresh, 60:00 stale, nothing saved is stale', () => {
    expect(isFresh(s, s.checkedAt + CHECK_TTL_MS - 1)).toBe(true);
    expect(isFresh(s, s.checkedAt + CHECK_TTL_MS)).toBe(false);
    expect(isFresh(undefined, 0)).toBe(false);
  });
});

describe('dropExpiredDeep', () => {
  const s = state(12, cards(0, 8), 1000);
  it('keeps deep rows just under 7 days', () => {
    expect(dropExpiredDeep(s, 1000 + DEEP_TTL_MS - 1, N)).toBe(s);
  });
  it('at 7 days drops rows beyond page 0', () => {
    const r = dropExpiredDeep(s, 1000 + DEEP_TTL_MS, N);
    expect(r.cards).toEqual(cards(0, N));
    expect(r.deepLoadedAt).toBeNull();
  });
  it('nothing deep: untouched', () => {
    const p = state(3, cards(0, 3));
    expect(dropExpiredDeep(p, 1e15, N)).toBe(p);
  });
});
