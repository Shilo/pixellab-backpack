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
