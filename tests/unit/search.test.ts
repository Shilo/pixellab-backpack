import { describe, expect, it } from 'vitest';
import { fold, highlight, matches, newestFirst, remember, search, terms } from '../../src/lib/search';
import type { Card } from '../../src/lib/types';

const card = (name: string, meta: Record<string, unknown> = {}, key = name): Card => ({ key, id: `id-${key}`, name, done: true, thumb: null, fp: 'f', meta });
const item = (c: Card) => ({ card: c });
const solo = (it: { card: Card }) => [it.card];

describe('fold and terms', () => {
  it('lowercases and strips accents', () => {
    expect(fold('Ünïcode')).toBe('unicode');
  });
  it('splits on spaces and drops empty words', () => {
    expect(terms('  Chest   ÖPEN ')).toEqual(['chest', 'open']);
    expect(terms('   ')).toEqual([]);
  });
});

describe('matches', () => {
  it('needs every term and never matches no terms', () => {
    expect(matches('Treasure Chest', ['chest', 'treas'])).toBe(true);
    expect(matches('Treasure Chest', ['chest', 'door'])).toBe(false);
    expect(matches('Treasure Chest', [])).toBe(false);
  });
});

describe('highlight', () => {
  it('marks over the original text, ignoring accents and case', () => {
    expect(highlight('Öbject', terms('obj'))).toEqual([{ text: 'Öbj', mark: true }, { text: 'ect', mark: false }]);
  });
  it('merges overlapping and adjacent hits', () => {
    expect(highlight('abcd', ['ab', 'bc'])).toEqual([{ text: 'abc', mark: true }, { text: 'd', mark: false }]);
    expect(highlight('abcd', ['ab', 'cd'])).toEqual([{ text: 'abcd', mark: true }]);
  });
  it('keeps code points outside the BMP whole', () => {
    expect(highlight('a😀b', ['b'])).toEqual([{ text: 'a😀', mark: false }, { text: 'b', mark: true }]);
    expect(highlight('😀x', ['x'])).toEqual([{ text: '😀', mark: false }, { text: 'x', mark: true }]);
  });
  it('keeps a combining mark with its letter', () => {
    expect(highlight('éa', ['e'])).toEqual([{ text: 'é', mark: true }, { text: 'a', mark: false }]);
  });
  it('returns one plain run with no terms, and nothing for empty text', () => {
    expect(highlight('Chest', [])).toEqual([{ text: 'Chest', mark: false }]);
    expect(highlight('', ['a'])).toEqual([]);
  });
});

describe('search', () => {
  const chest = card('Treasure Chest', { state_name: 'open' });
  const slime = card('Green Slime');
  const items = [item(slime), item(chest)];

  it('ANDs words, across name and state name, in input order', () => {
    expect(search(items, 'chest open', solo)).toEqual([item(chest)]);
    expect(search(items, 'slime chest', solo)).toEqual([]);
    expect(search(items, 'e', solo)).toEqual(items);
  });
  it('returns nothing for an empty query', () => {
    expect(search(items, '', solo)).toEqual([]);
    expect(search(items, '  ', solo)).toEqual([]);
  });
  it('is accent-insensitive', () => {
    expect(search([item(card('Crème'))], 'creme', solo)).toHaveLength(1);
  });

  describe('groups', () => {
    const base = card('Knight', { state_name: 'Base' }, 'k1');
    const armored = card('Knight', { state_name: 'Armored' }, 'k2');
    const group = { card: base, familyId: 'characters' };
    const states = () => [base, armored];

    it('matches by the shown card and keeps it', () => {
      const out = search([group], 'base', states);
      expect(out).toHaveLength(1);
      expect(out[0].card).toBe(base);
    });
    it('matches by another state only and returns that state, with the item fields', () => {
      const out = search([group], 'armored', states);
      expect(out).toEqual([{ card: armored, familyId: 'characters' }]);
    });
    it('returns one result for a group even when several states match', () => {
      expect(search([group], 'knight', states)).toHaveLength(1);
      expect(search([group], 'knight', states)[0].card).toBe(base);
    });
    it('returns nothing when no state matches', () => {
      expect(search([group], 'zzz', states)).toEqual([]);
    });
  });
});

describe('newestFirst', () => {
  const at = (name: string, created_at?: string) => item(card(name, created_at ? { created_at } : {}));
  it('sorts by created_at desc, ties in input order, undated last, capped at n', () => {
    const [a, b, c, d, e] = [at('a', '2026-01-01T00:00:00Z'), at('b', '2026-03-01T00:00:00Z'), at('c'), at('d', '2026-01-01T00:00:00Z'), at('e', 'nonsense')];
    expect(newestFirst([a, b, c, d, e], 10)).toEqual([b, a, d, c, e]);
    expect(newestFirst([a, b, c, d, e], 2)).toEqual([b, a]);
  });
  it('does not change its input', () => {
    const list = [at('a', '2026-01-01T00:00:00Z'), at('b', '2026-03-01T00:00:00Z')];
    newestFirst(list, 6);
    expect(list.map((i) => i.card.name)).toEqual(['a', 'b']);
  });
});

describe('remember', () => {
  it('puts the newest first and merges duplicates ignoring case', () => {
    expect(remember(['slime', 'chest'], 'Chest')).toEqual(['Chest', 'slime']);
  });
  it('keeps at most 3 by default', () => {
    expect(remember(['c', 'b', 'a'].map((x) => x + x), 'dd')).toEqual(['dd', 'cc', 'bb']);
    expect(remember(['aa', 'bb'], 'cc', 2)).toEqual(['cc', 'aa']);
  });
  it('ignores queries under 2 characters and trims', () => {
    const list = ['aa'];
    expect(remember(list, ' x ')).toBe(list);
    expect(remember(list, '  ')).toBe(list);
    expect(remember(list, '  slime  ')).toEqual(['slime', 'aa']);
  });
});
