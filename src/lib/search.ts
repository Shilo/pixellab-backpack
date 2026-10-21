// Search rules, pure (Phase 3 R5/R6/R8): case- and accent-insensitive substring match on a card's name and (grouped cards only) state name.
import type { Card } from './types';

export const MAX_RESULTS = 100;

/** Accent- and case-insensitive form: "Ünïcode" -> "unicode". */
export const fold = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** The words of a query, folded; empty ones dropped. */
export const terms = (q: string): string[] => fold(q).split(/\s+/).filter(Boolean);

/** Every term is inside the text. No terms never match (an empty query shows no results). */
export const matches = (text: string, ts: string[]): boolean => {
  const f = fold(text);
  return ts.length > 0 && ts.every((t) => f.includes(t));
};

// ponytail: folding per code point differs from whole-string folding only for context-dependent case rules (Greek final sigma), so such a name can match without a highlight; fold ς to σ if that matters.
/** Runs over the ORIGINAL text, marked where a term hits. Folds one code point at a time so marks line up with the characters shown. */
export function highlight(text: string, ts: string[]): { text: string; mark: boolean }[] {
  if (!text) return [];
  // For each folded UTF-16 unit, where its code point starts and ends in the original.
  let folded = '';
  const from: number[] = [];
  const to: number[] = [];
  let at = 0;
  for (const cp of text) {
    const f = fold(cp);
    if (f) {
      for (let i = 0; i < f.length; i++) { from.push(at); to.push(at + cp.length); }
      folded += f;
    } else if (to.length) {
      to[to.length - 1] = at + cp.length; // a lone combining mark stays with its letter
    }
    at += cp.length;
  }
  const marked: boolean[] = new Array(text.length).fill(false);
  for (const t of ts) {
    for (let i = t ? folded.indexOf(t) : -1; i >= 0; i = folded.indexOf(t, i + 1)) {
      marked.fill(true, from[i], to[i + t.length - 1]);
    }
  }
  const runs: { text: string; mark: boolean }[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marked[i] !== marked[start]) {
      runs.push({ text: text.slice(start, i), mark: marked[start] });
      start = i;
    }
  }
  return runs;
}

/** The state name a card shows and is searched by (R6): only when it has sibling states saved on this device
 * (`states` is its group, itself included). Live data gives nearly every lone card a state name ("Idle", "base"). */
export const stateName = (c: Card, states: readonly Card[]): string =>
  states.length > 1 && typeof c.meta.state_name === 'string' ? c.meta.state_name.trim() : '';

/** The line a card is searched and shown by: "Name state". */
const label = (c: Card, states: readonly Card[]) => `${c.name} ${stateName(c, states)}`;

// ponytail: folds every label on every call (no index); fine for a few thousand cards, cache folded labels per fp if search gets slow.
/**
 * Items whose name + state name (any state, for a group) contain every word, in input order (R5, R6).
 * A grouped item comes back showing its own card if that matches, else the first matching state.
 */
export function search<T extends { card: Card }>(items: T[], q: string, statesOf: (it: T) => Card[]): T[] {
  const ts = terms(q);
  if (!ts.length) return [];
  const out: T[] = [];
  for (const it of items) {
    const states = statesOf(it);
    const hits = states.filter((c) => matches(label(c, states), ts));
    if (!hits.length) continue;
    const shown = hits.find((c) => c.key === it.card.key) ?? hits[0];
    out.push(shown.key === it.card.key ? it : { ...it, card: shown });
  }
  return out;
}

const createdAt = (c: Card): number => {
  const v = c.meta.created_at;
  const t = typeof v === 'number' ? v : typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
};

/** The n most recently created (`meta.created_at`), ties in input order, undated last (R4). Does not change `items`. */
export function newestFirst<T extends { card: Card }>(items: T[], n: number): T[] {
  return [...items].sort((a, b) => {
    const [x, y] = [createdAt(a.card), createdAt(b.card)];
    return x === y ? 0 : y > x ? 1 : -1;
  }).slice(0, n);
}

/** Recent searches (R2): trimmed, newest first, case-insensitive duplicates merged, under 2 characters ignored. */
export function remember(list: string[], q: string, cap = 3): string[] {
  const t = q.trim();
  if (t.length < 2) return list;
  return [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, cap);
}
