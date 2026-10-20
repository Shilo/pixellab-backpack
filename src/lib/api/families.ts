// One adapter per PixelLab asset family: list pages -> Cards, and one picture per Card.
// Reads only (GET). Transport is injected so this file never touches the network itself; only http.ts does.
import type { Card, FamilyId, Page } from '../types';

export type Transport = {
  apiGet: <T>(path: string, o?: { user?: boolean; signal?: AbortSignal; label?: string }) => Promise<T>;
  publicGet: (url: string, o?: { signal?: AbortSignal; label?: string; api?: boolean }) => Promise<Response>;
};

export interface Family {
  id: FamilyId;
  label: string;
  pageSize: 100 | 50;
  list(offset: number, signal?: AbortSignal): Promise<Page>;
  /** One picture. Throws for a card that is not done (no art requests for unfinished/failed rows). */
  art(card: Card, signal?: AbortSignal): Promise<{ blob: Blob; thumb?: string }>;
  /** true: the picture costs an API request, so the screen waits before asking. */
  artCostsApi: boolean;
}

export const CATEGORIES: { id: 'characters' | 'objects' | 'tiles' | 'ui'; label: string; families: FamilyId[] }[] = [
  { id: 'characters', label: 'Characters', families: ['characters'] },
  { id: 'objects', label: 'Objects', families: ['objects'] },
  { id: 'tiles', label: 'Tilesets & tiles', families: ['tilesets', 'tilesets-side', 'isometric', 'tiles-pro'] },
  { id: 'ui', label: 'UI', families: ['ui'] },
];

const API = 'https://api.pixellab.ai';
type Row = Record<string, unknown>;
type Art = { blob: Blob; thumb?: string };
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

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
  /** Costly art: how to get the picture. */
  costly?: (t: Transport, card: Card, signal?: AbortSignal) => Promise<Art>;
};

async function okBlob(res: Response): Promise<Blob> {
  if (!res.ok) throw new Error(`picture request failed (${res.status})`);
  return res.blob();
}

// Documented no-auth helper: one request; fetch follows the redirect, so res.url is the final picture link.
const helper = (path: (id: string) => string, label: string) => async (t: Transport, card: Card, signal?: AbortSignal): Promise<Art> => {
  const res = await t.publicGet(`${API}${path(card.id)}`, { signal, api: true, label: `${label} · picture` });
  return { blob: await okBlob(res), thumb: res.url || undefined };
};

const SPECS: Spec[] = [
  { id: 'characters', label: 'Characters', pageSize: 100, path: '/characters', rows: 'characters', thumbField: 'preview_url', nameFallback: 'prompt' },
  { id: 'objects', label: 'Objects', pageSize: 100, path: '/objects', rows: 'objects', thumbField: 'preview_url', nameFallback: 'prompt' },
  { id: 'ui', label: 'UI', pageSize: 100, path: '/ui-assets', rows: 'ui_assets', thumbField: 'image_url', nameFallback: 'prompt' },
  {
    id: 'tilesets', label: 'Top-down tilesets', pageSize: 100, path: '/tilesets', rows: 'tilesets', nameFallback: 'lower_description',
    costly: helper((id) => `/mcp/tilesets/${id}/image`, 'Top-down tilesets'),
  },
  {
    id: 'tilesets-side', label: 'Sidescroller tilesets', pageSize: 50, path: '/tilesets-sidescroller', rows: 'tilesets', nameFallback: 'lower_description',
    costly: helper((id) => `/mcp/sidescroller-tilesets/${id}/image`, 'Sidescroller tilesets'),
  },
  {
    id: 'isometric', label: 'Isometric tiles', pageSize: 100, path: '/isometric-tiles', rows: 'tiles', nameFallback: 'description',
    costly: helper((id) => `/mcp/isometric-tile/${id}/download`, 'Isometric tiles'),
  },
  {
    id: 'tiles-pro', label: 'Tiles Pro', pageSize: 50, path: '/tiles-pro', rows: 'tiles', nameFallback: 'description',
    // One detail GET for the picture link, then the picture from the image host (not an API request).
    costly: async (t, card, signal) => {
      const d = await t.apiGet<{ storage_urls?: Record<string, unknown> }>(`/tiles-pro/${encodeURIComponent(card.id)}`, {
        user: true,
        signal,
        label: 'Tiles Pro · picture',
      });
      const urls = d?.storage_urls ?? {};
      const thumb = str(urls.tile_0) ?? Object.values(urls).map(str).find(Boolean) ?? null;
      if (!thumb) throw new Error('no picture link');
      return { blob: await okBlob(await t.publicGet(thumb, { signal, label: 'Tiles Pro · picture' })), thumb };
    },
  },
];

async function toCard(s: Spec, r: unknown): Promise<Card | null> {
  if (!r || typeof r !== 'object') return null;
  const row = r as Row;
  const id = str(row.id);
  if (!id) return null;
  const name = (str(row.name) ?? str(row[s.nameFallback]) ?? '').slice(0, 60);
  const status = str(row.status) ?? 'completed'; // schema default for characters; objects/UI may send null
  const thumb = s.thumbField ? str(row[s.thumbField]) : null;
  // Cheap families need their list link to draw anything, so no link = not drawable yet.
  const done = status === 'completed' && (!s.thumbField || thumb !== null);
  return { key: await keyOf(s.id, id), id, name, done, thumb, fp: `${id}|${name}|${status}|${thumb ?? ''}` };
}

function make(t: Transport, s: Spec): Family {
  return {
    id: s.id,
    label: s.label,
    pageSize: s.pageSize,
    artCostsApi: !!s.costly,
    async list(offset, signal) {
      const page = Math.round(offset / s.pageSize) + 1; // a one-row overlap start still counts as that page
      const body = await t.apiGet<Row>(`${s.path}?limit=${s.pageSize}&offset=${offset}`, { signal, label: `${s.label} · page ${page}` });
      const rows = body?.[s.rows];
      if (!Array.isArray(rows) || typeof body.total !== 'number') throw new Error(`${s.label}: unexpected list answer`);
      const cards = (await Promise.all(rows.map((r) => toCard(s, r)))).filter((c): c is Card => c !== null);
      return { total: body.total, cards };
    },
    async art(card, signal) {
      if (!card.done) throw new Error('no picture for an unfinished or failed asset');
      if (s.costly) return s.costly(t, card, signal);
      if (!card.thumb) throw new Error('no picture link');
      return { blob: await okBlob(await t.publicGet(card.thumb, { signal, label: `${s.label} · picture` })) };
    },
  };
}

export const createFamilies = (t: Transport): Family[] => SPECS.map((s) => make(t, s));

/** The top-down list also returns sidescroller tilesets: drop from `a` (top-down) any id that is also in `b` (sidescroller). */
export function dedupeTilesets(a: Card[], b: Card[]): Card[] {
  const ids = new Set(b.map((c) => c.id));
  return a.filter((c) => !ids.has(c.id));
}
