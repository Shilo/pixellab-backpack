// The one list of home categories: id (safe in the address bar), label, and the families it shows.
// Neutral module: screens and the router import it; api/families.ts re-exports it.
import type { FamilyId } from './types';

export const CATEGORIES = [
  { id: 'characters', label: 'Characters', families: ['characters'] },
  { id: 'objects', label: 'Objects', families: ['objects'] },
  { id: 'tiles', label: 'Tilesets & tiles', families: ['tilesets', 'tilesets-side', 'isometric', 'tiles-pro'] },
  { id: 'ui', label: 'UI', families: ['ui'] },
] as const satisfies readonly { id: string; label: string; families: readonly FamilyId[] }[];

export type CategoryId = (typeof CATEGORIES)[number]['id'];

/** What a screen or the search covers: one category, or everything. */
export type Scope = CategoryId | 'all';

/** The families of a scope in home order ('all' = every category's families). */
export const familiesOf = (s: Scope): readonly FamilyId[] =>
  s === 'all' ? CATEGORIES.flatMap((c) => c.families) : CATEGORIES.find((c) => c.id === s)!.families;

export const scopeLabel = (s: Scope): string => (s === 'all' ? 'All assets' : CATEGORIES.find((c) => c.id === s)!.label);
