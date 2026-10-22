// One adapter per PixelLab asset family: list pages -> Cards, one picture per Card, and (characters, objects) one detail.
// Reads only (GET). Transport is injected so this file never touches the network itself; only http.ts does.
import type { Anim, Card, Detail, Dir, FamilyId, Page } from '../types';
import { HttpError } from './http';

export type Transport = {
  apiGet: <T>(path: string, o?: { user?: boolean; signal?: AbortSignal; label?: string }) => Promise<T>;
  publicGet: (url: string, o?: { signal?: AbortSignal; label?: string; api?: boolean }) => Promise<Response>;
};

export interface Family {
  id: FamilyId;
  label: string;
  pageSize: 100 | 50;
  /** `limit`: the page size unless given (the account check asks for 1 row). */
  list(offset: number, signal?: AbortSignal, limit?: number): Promise<Page>;
  /** One picture. Throws for a card that is not done (no art requests for unfinished/failed rows). */
  art(card: Card, signal?: AbortSignal): Promise<{ blob: Blob; thumb?: string }>;
  /** true: the picture costs an API request, so the screen waits before asking. */
  artCostsApi: boolean;
  /** Characters and objects only: one detail request, normalized. Throws for a card that is not done. */
  detail?(card: Card, signal?: AbortSignal): Promise<Detail>;
}

const API = 'https://api.pixellab.ai';
type Row = Record<string, unknown>;
type Art = { blob: Blob; thumb?: string };
type DetailFn = (t: Transport, card: Card, signal?: AbortSignal) => Promise<Detail>;
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
const obj = (v: unknown): Row => (v && typeof v === 'object' ? (v as Row) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const DIRS: Dir[] = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'unknown'];

/** Direction -> link, string links only. */
function rotationsOf(v: unknown): Partial<Record<Dir, string>> {
  const r = obj(v);
  const out: Partial<Record<Dir, string>> = {};
  for (const d of DIRS) {
    const u = str(r[d]);
    if (u) out[d] = u;
  }
  return out;
}

/** directions[] -> direction -> frame links in order, string links only; unknown directions and empty lists skipped. */
function framesOf(dirs: unknown, pick: (d: Row) => unknown): Partial<Record<Dir, string[]>> {
  const out: Partial<Record<Dir, string[]>> = {};
  for (const e of arr(dirs)) {
    const d = str(obj(e).direction) as Dir | null;
    const frames = arr(pick(obj(e))).map(str).filter((u): u is string => u !== null);
    if (d && DIRS.includes(d) && frames.length) out[d] = frames;
  }
  return out;
}

const sentence = (s: string) => {
  const t = s.replace(/[-_]+/g, ' ').trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** One GET of `/<path>/<id>`, then the family's normalizer. */
const detailOf =
  (path: string, label: string, norm: (d: Row, card: Card) => Detail): DetailFn =>
  async (t, card, signal) => {
    const d = await t.apiGet<unknown>(`${path}/${encodeURIComponent(card.id)}`, { user: true, signal, label: `${label} · details` });
    if (!d || typeof d !== 'object') throw new Error(`${label}: unexpected detail answer`);
    return norm(d as Row, card);
  };

/** Detail-only facts; nulls dropped. `skeleton` only when the answer has a `skeletons` field (characters). */
function extraOf(d: Row): Record<string, unknown> {
  const all = { style_settings: d.style_settings, guidance: d.guidance, ai_freedom: d.ai_freedom, skeleton: 'skeletons' in d ? d.skeletons != null : null };
  return Object.fromEntries(Object.entries(all).filter(([, v]) => v != null));
}

const characterDetail = detailOf('/characters', 'Characters', (d) => ({
  rotations: rotationsOf(d.rotation_urls),
  animations: arr(d.animations).map((v): Anim => {
    const a = obj(v);
    const type = str(a.animation_type);
    return { name: str(a.display_name) ?? (type ? sentence(type) : 'Animation'), type, description: null, frames: framesOf(a.directions, (x) => x.frames) };
  }),
  extra: extraOf(d),
}));

const objectDetail = detailOf('/objects', 'Objects', (d, card) => {
  const rotations = rotationsOf(d.rotation_urls);
  // 1-direction objects send all-null rotation_urls; their picture is storage_urls.unknown.
  const unknown = str(obj(d.storage_urls).unknown) ?? card.thumb;
  if (!Object.keys(rotations).length && unknown) rotations.unknown = unknown;
  return {
    rotations,
    animations: arr(d.animations).map((v): Anim => {
      const a = obj(v);
      const description = str(a.description);
      return { name: str(a.display_name) ?? description ?? 'Animation', type: null, description, frames: framesOf(a.directions, (x) => obj(x.storage_urls).frames) };
    }),
    extra: extraOf(d),
  };
});

/** Card key = first 12 hex chars of SHA-256 of `${familyId}:${id}` (opaque, safe for the address bar). */
async function keyOf(familyId: FamilyId, id: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${familyId}:${id}`));
  return [...new Uint8Array(buf)]
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

type Spec = {
  id: FamilyId;
  label: string;
  pageSize: 100 | 50;
  path: string; // list route, after /v2
  rows: string; // key of the row array in the list answer
  /** Row field holding the picture link when the list has one (cheap families). */
  thumbField?: string;
  /** Row field used as the name when `name` is empty. */
  nameFallback: string;
  /** Space-separated list-row fields copied into Card.meta (never `id` or picture links). */
  meta: string;
  /** Costly art: how to get the picture. */
  costly?: (t: Transport, card: Card, signal?: AbortSignal) => Promise<Art>;
  detail?: DetailFn;
};

// A real answer meaning "no picture" is an HttpError of kind 'http': callers keep it as a miss and never ask again this session.
async function okBlob(res: Response): Promise<Blob> {
  if (!res.ok) throw new HttpError('http', res.status);
  return res.blob();
}

// Documented no-auth helper: one request; fetch follows the redirect, so res.url is the final picture link.
const helper = (path: (id: string) => string, label: string) => async (t: Transport, card: Card, signal?: AbortSignal): Promise<Art> => {
  const res = await t.publicGet(`${API}${path(card.id)}`, { signal, api: true, label: `${label} · picture` });
  return { blob: await okBlob(res), thumb: res.url || undefined };
};

const SPECS: Spec[] = [
  {
    id: 'characters', label: 'Characters', pageSize: 100, path: '/characters', rows: 'characters', thumbField: 'preview_url', nameFallback: 'prompt',
    meta: 'name state_name prompt size directions view template_id tags created_at updated_at animation_count group_id status',
    detail: characterDetail,
  },
  {
    id: 'objects', label: 'Objects', pageSize: 100, path: '/objects', rows: 'objects', thumbField: 'preview_url', nameFallback: 'prompt',
    meta: 'name state_name prompt size directions view tags created_at status',
    detail: objectDetail,
  },
  { id: 'ui', label: 'UI', pageSize: 100, path: '/ui-assets', rows: 'ui_assets', thumbField: 'image_url', nameFallback: 'prompt', meta: 'name prompt size created_at' },
  {
    id: 'tilesets', label: 'Top-down tilesets', pageSize: 100, path: '/tilesets', rows: 'tilesets', nameFallback: 'lower_description',
    meta: 'name lower_description upper_description tile_size view created_at',
    costly: helper((id) => `/mcp/tilesets/${encodeURIComponent(id)}/image`, 'Top-down tilesets'),
  },
  {
    id: 'tilesets-side', label: 'Sidescroller tilesets', pageSize: 50, path: '/tilesets-sidescroller', rows: 'tilesets', nameFallback: 'lower_description',
    meta: 'name lower_description transition_description tile_size created_at',
    costly: helper((id) => `/mcp/sidescroller-tilesets/${encodeURIComponent(id)}/image`, 'Sidescroller tilesets'),
  },
  {
    id: 'isometric', label: 'Isometric tiles', pageSize: 100, path: '/isometric-tiles', rows: 'tiles', nameFallback: 'description',
    meta: 'name description size tile_shape created_at',
    costly: helper((id) => `/mcp/isometric-tile/${encodeURIComponent(id)}/download`, 'Isometric tiles'),
  },
  {
    id: 'tiles-pro', label: 'Tiles Pro', pageSize: 50, path: '/tiles-pro', rows: 'tiles', nameFallback: 'description',
    meta: 'name description tile_type tile_size n_tiles tile_view created_at',
    // One detail GET for the picture link, then the picture from the image host (not an API request).
    costly: async (t, card, signal) => {
      const d = await t.apiGet<{ storage_urls?: Record<string, unknown> }>(`/tiles-pro/${encodeURIComponent(card.id)}`, { signal, label: 'Tiles Pro · picture' });
      const urls = d?.storage_urls ?? {};
      const thumb = str(urls.tile_0) ?? Object.values(urls).map(str).find(Boolean) ?? null;
      if (!thumb) throw new HttpError('http');
      return { blob: await okBlob(await t.publicGet(thumb, { signal, label: 'Tiles Pro · picture' })), thumb };
    },
  },
];

async function toCard(s: Spec, r: unknown): Promise<Card | null> {
  if (!r || typeof r !== 'object') return null;
  const row = r as Row;
  const id = str(row.id);
  if (!id) return null;
  const name = [...(str(row.name) ?? str(row[s.nameFallback]) ?? '')].slice(0, 60).join(''); // code points, not UTF-16 units
  const status = str(row.status) ?? 'completed'; // schema default for characters; objects/UI may send null
  const thumb = s.thumbField ? str(row[s.thumbField]) : null;
  // Cheap families need their list link to draw anything, so no link = not drawable yet.
  const done = status === 'completed' && (!s.thumbField || thumb !== null);
  let fp = `${id}|${name}|${status}|${thumb ?? ''}`;
  if (s.id === 'characters') fp += `|${row.updated_at ?? ''}|${row.animation_count ?? ''}`; // an edit or a new animation re-asks the detail
  const meta = Object.fromEntries(s.meta.split(' ').filter((k) => row[k] !== undefined).map((k) => [k, row[k]]));
  return { key: await keyOf(s.id, id), id, name, done, thumb, fp, meta };
}

function make(t: Transport, s: Spec): Family {
  return {
    id: s.id,
    label: s.label,
    pageSize: s.pageSize,
    artCostsApi: !!s.costly,
    async list(offset, signal, limit = s.pageSize) {
      const page = Math.round(offset / s.pageSize) + 1; // a one-row overlap start still counts as that page
      const what = limit !== s.pageSize ? 'account check' : offset ? `page ${page}` : 'first page';
      const body = await t.apiGet<Row>(`${s.path}?limit=${limit}&offset=${offset}`, { user: offset > 0, signal, label: `${s.label} · ${what}` });
      const rows = body?.[s.rows];
      if (!Array.isArray(rows) || typeof body.total !== 'number') throw new Error(`${s.label}: unexpected list answer`);
      const cards = (await Promise.all(rows.map((r) => toCard(s, r)))).filter((c): c is Card => c !== null);
      return { total: body.total, cards };
    },
    async art(card, signal) {
      if (!card.done) throw new Error('no picture for an unfinished or failed asset');
      if (s.costly) return s.costly(t, card, signal);
      if (!card.thumb) throw new HttpError('http');
      return { blob: await okBlob(await t.publicGet(card.thumb, { signal, label: `${s.label} · picture` })) };
    },
    ...(s.detail && {
      detail: async (card: Card, signal?: AbortSignal) => {
        if (!card.done) throw new Error('no details for an unfinished or failed asset');
        return s.detail!(t, card, signal);
      },
    }),
  };
}

export const createFamilies = (t: Transport): Family[] => SPECS.map((s) => make(t, s));

/** A card's character group, or null: the one "has a group" rule (a blank group_id is none). */
export const groupOf = (c: Card): string | null => str(c.meta.group_id);

/** Sibling states of one character share a group_id: keep the first card per group (the grid shows one). Order kept. */
export function groupStates(cards: Card[]): Card[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const g = groupOf(c);
    if (!g) return true;
    if (seen.has(g)) return false;
    seen.add(g);
    return true;
  });
}

/** The top-down list also returns sidescroller tilesets: drop from `a` (top-down) any id that is also in `b` (sidescroller). */
export function dedupeTilesets(a: Card[], b: Card[]): Card[] {
  const ids = new Set(b.map((c) => c.id));
  return a.filter((c) => !ids.has(c.id));
}
