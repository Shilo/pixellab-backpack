// Shared data shapes (from docs/plan/mvp-plan.md "Key interfaces"). Every module imports these from here.

export type FamilyId = 'characters' | 'objects' | 'ui' | 'tilesets' | 'tilesets-side' | 'isometric' | 'tiles-pro';

export type Dir = 'south' | 'south-east' | 'east' | 'north-east' | 'north' | 'north-west' | 'west' | 'south-west' | 'unknown';

/** One asset as the grid needs it. */
export interface Card {
  /** Opaque key (hash of family + id); safe for the address bar. */
  key: string;
  /** PixelLab asset id. Never shown in the address bar or the Activity panel. */
  id: string;
  name: string;
  /** false for unfinished or failed assets: hidden, no art requests. */
  done: boolean;
  /** Picture link when known (from the list or resolved once by art()); null until then. */
  thumb: string | null;
  /** Fingerprint for the change check: id + name + status + picture link (characters add updated_at + animation_count). */
  fp: string;
  /** Whitelisted list-row fields as PixelLab sent them (never `id` or picture links). */
  meta: Record<string, unknown>;
}

export interface Anim {
  /** display_name ?? sentence-cased animation_type (characters) / description (objects). */
  name: string;
  /** animation_type (characters); null for objects. */
  type: string | null;
  /** Objects only. */
  description: string | null;
  /** Image-host links in order. */
  frames: Partial<Record<Dir, string[]>>;
}

export interface Detail {
  rotations: Partial<Record<Dir, string>>;
  animations: Anim[];
  /** Detail-only facts: style_settings, guidance, ai_freedom, skeleton (boolean). */
  extra: Record<string, unknown>;
}

export interface SavedDetail {
  fp: string;
  at: number;
  detail: Detail;
}

/** What the device keeps for one family. */
export interface FamilyState {
  total: number;
  cards: Card[];
  /** When page 0 was last checked (ms since epoch). */
  checkedAt: number;
  /** When rows beyond page 0 were last loaded; they expire after 7 days. null = none loaded. */
  deepLoadedAt: number | null;
}

export interface Page {
  total: number;
  cards: Card[];
}
