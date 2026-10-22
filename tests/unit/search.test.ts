import { describe, expect, it } from 'vitest';
import { fold, fullName, highlight, matches, newestFirst, remember, sameAsset, search, snippetFrom, stateName, terms } from '../../src/lib/search';
import type { Card, FamilyId, Item } from '../../src/lib/types';

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

describe('snippetFrom', () => {
  const long = 'A front-facing pixel-art forest ranger with a hooded green cloak';
  it('starts at a word a few characters before a late match', () => {
    const at = snippetFrom(long, terms('ranger'));
    expect(long.slice(at)).toBe('forest ranger with a hooded green cloak');
  });
  it('uses the earliest match of several terms, ignoring accents and case', () => {
    expect(long.slice(snippetFrom(long, terms('CLOAK fôrest')))).toBe('pixel-art forest ranger with a hooded green cloak');
    const accented = 'Une très grande épée enchantée';
    expect(accented.slice(snippetFrom(accented, terms('EPEE')))).toBe('grande épée enchantée');
  });
  it('keeps the whole label for a match at or near the start, no match, or no terms', () => {
    expect(snippetFrom(long, terms('front'))).toBe(0);
    expect(snippetFrom(long, terms('a'))).toBe(0);
    expect(snippetFrom(long, terms('zzz'))).toBe(0);
    expect(snippetFrom(long, [])).toBe(0);
  });
  it('cuts inside a very long word when no word starts in reach', () => {
    const name = `${'x'.repeat(300)}dragon`;
    expect(name.slice(snippetFrom(name, terms('dragon')))).toBe('xxxxxxxxxxdragon');
  });
});

describe('search', () => {
  const chest = card('Treasure Chest', { state_name: 'open' });
  const slime = card('Green Slime');
  const items = [item(slime), item(chest)];

  it('ANDs words in input order', () => {
    expect(search(items, 'treasure chest', solo)).toEqual([item(chest)]);
    expect(search(items, 'slime chest', solo)).toEqual([]);
    expect(search(items, 'e', solo)).toEqual(items);
  });
  it('ignores the state name of a card with no sibling states (live data: "Idle", "base" everywhere)', () => {
    expect(search(items, 'open', solo)).toEqual([]);
    expect(search(items, 'chest open', solo)).toEqual([]);
  });
  it('returns nothing for an empty query', () => {
    expect(search(items, '', solo)).toEqual([]);
    expect(search(items, '  ', solo)).toEqual([]);
  });
  it('is accent-insensitive', () => {
    expect(search([item(card('Crème'))], 'creme', solo)).toHaveLength(1);
  });

  describe('full name (S1: card.name is cut to 60 code points, meta.name keeps it)', () => {
    const full = 'A front-facing pixel-art forest ranger with a hooded green cloak and a longbow made of yew';
    const ranger = card([...full].slice(0, 60).join(''), { name: full });
    it('finds a word past character 60, ignoring accents and case', () => {
      expect(search([item(ranger)], 'LÔNGBOW yew', solo)).toEqual([item(ranger)]);
    });
    it('the snippet of the full name shows the late match', () => {
      const name = fullName(ranger);
      expect(name.slice(snippetFrom(name, terms('longbow')))).toBe('and a longbow made of yew');
    });
    it('falls back to card.name when meta.name is missing, blank or not a string', () => {
      expect(fullName(card('Slime'))).toBe('Slime');
      expect(fullName(card('Slime', { name: '  ' }))).toBe('Slime');
      expect(fullName(card('Slime', { name: 7 }))).toBe('Slime');
    });
    it('a nameless card uses its fallback field like toCard (tileset: lower_description)', () => {
      const lower = 'Lush green meadow grass with small scattered wildflowers and a few pebbles near the river bank';
      const tileset = card([...lower].slice(0, 60).join(''), { lower_description: lower, upper_description: 'river water' });
      expect(fullName(tileset)).toBe(lower);
      expect(search([item(tileset)], 'river bank', solo)).toEqual([item(tileset)]);
    });
    it('still ignores a lone state name (R6)', () => {
      expect(search([item(card('Orb', { name: 'Orb mage', state_name: 'Idle' }))], 'idle', solo)).toEqual([]);
    });
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

describe('stateName', () => {
  const idle = card('Mage', { state_name: ' Idle ' }, 'm1');
  const robe = card('Mage', { state_name: 'Robe' }, 'm2');
  it('is shown only with sibling states saved', () => {
    expect(stateName(idle, [idle])).toBe('');
    expect(stateName(idle, [idle, robe])).toBe('Idle');
    expect(stateName(card('Mage', {}, 'm3'), [idle, robe])).toBe('');
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

describe('sameAsset', () => {
  const at = (key: string, meta: Record<string, unknown> = {}, familyId: FamilyId = 'characters'): Item => ({ card: card(key, meta, key), familyId });
  it('matches the same key, or another state of the same group in the same family', () => {
    const hit = at('b', { group_id: 'g' });
    expect(sameAsset(at('b'), hit)).toBe(true);
    expect(sameAsset(at('a', { group_id: 'g' }), hit)).toBe(true);
    expect(sameAsset(at('a', { group_id: 'g' }, 'objects'), hit)).toBe(false);
    expect(sameAsset(at('a', { group_id: 'h' }), hit)).toBe(false);
  });
  it('never groups by an empty, blank or missing group id (the one groupOf rule, K15)', () => {
    expect(sameAsset(at('a', { group_id: '' }), at('b', { group_id: '' }))).toBe(false);
    expect(sameAsset(at('a', { group_id: '  ' }), at('b', { group_id: '  ' }))).toBe(false);
    expect(sameAsset(at('a'), at('b'))).toBe(false);
  });
});
