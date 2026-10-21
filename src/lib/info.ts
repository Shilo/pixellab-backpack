// Info panel content, pure: what to say about one asset from its list row (`card.meta`) and, for characters and objects, its one detail.
// Never returns an id or a picture link; the only id shown anywhere is maskId() in the panel's Technical details.
import { APP_NAME } from './app';
import type { Card, Detail, Dir, FamilyId } from './types';

export interface InfoRow {
  label: string;
  value: string;
  mono?: boolean;
}

export const PLAYBACK_NOTE = "PixelLab doesn't say how fast animations play. 8 fps matches PixelLab's character and Creator players.";
export const UI_NOTE = "PixelLab doesn't share the individual UI pieces.";

/** PixelLab content the public API can't read, each with its PixelLab library page (Phase 2 R4); shown in Settings' About and at the end of All assets. */
export const OTHER_TITLE = "Other PixelLab content isn't in the public API yet.";
export const OTHER_TEXT = `Fonts, effects, portraits and talking animations can't be read through PixelLab's public API, so ${APP_NAME} can't show them.`;
export const OTHER_CONTENT = [
  ['Fonts', 'https://www.pixellab.ai/create'],
  ['Effects', 'https://www.pixellab.ai/create-vfx'],
  ['Portraits', 'https://www.pixellab.ai/create-character'],
  ['Talking animations', 'https://www.pixellab.ai/create-character'],
] as const satisfies readonly (readonly [label: string, url: string])[];

type Meta = Record<string, unknown>;
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const rec = (v: unknown): Meta => (v && typeof v === 'object' ? (v as Meta) : {});
const grouped = (v: unknown) => (num(v) === null ? null : num(v)!.toLocaleString('en-US'));

/** "low top-down" / "square_topdown" -> "Low top-down" / "Square top-down". */
function sentence(v: unknown): string | null {
  const s = text(v)?.replace(/_+/g, ' ').replace(/topdown/gi, 'top-down').toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : null;
}
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** {width, height} -> "64 × 64 px"; a bare number -> "32 × 32 px" (square). */
function px(v: unknown): string | null {
  const o = rec(v);
  const w = num(o.width) ?? num(v);
  const h = num(o.height) ?? num(v);
  return w !== null && h !== null ? `${w} × ${h} px` : null;
}

/** "Feb 3, 2026, 09:20" in local time (`timeZone` is for tests). */
export function formatDate(v: unknown, timeZone?: string): string | null {
  const t = typeof v === 'number' ? v : typeof v === 'string' ? Date.parse(v) : NaN;
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(t);
}

const ABBR: [Dir, string][] = [['south', 'S'], ['south-east', 'SE'], ['east', 'E'], ['north-east', 'NE'], ['north', 'N'], ['north-west', 'NW'], ['west', 'W'], ['south-west', 'SW']];

function directions(card: Card, detail: Detail | null): string | null {
  const names = detail ? ABBR.filter(([d]) => detail.rotations[d]).map(([, a]) => a) : [];
  const n = names.length || num(card.meta.directions);
  if (n === null) return null;
  if (n === 1) return '1 (single view)';
  return names.length ? `${n} · ${names.join(', ')}` : String(n);
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** One line per animation: "Walk · 8–9 frames · 4 directions", plus the object's description when it adds something. */
function animationRows(detail: Detail): InfoRow[] {
  return detail.animations.map((a) => {
    const lists = Object.values(a.frames);
    const counts = lists.map((l) => l?.length ?? 0);
    const lo = Math.min(...counts);
    const hi = Math.max(...counts);
    const parts = [a.name];
    if (lists.length) parts.push(lo === hi ? plural(lo, 'frame') : `${lo}–${hi} frames`, plural(lists.length, 'direction'));
    const more = a.description && a.description !== a.name ? `\n${a.description}` : '';
    return { label: 'Animation', value: parts.join(' · ') + more };
  });
}

const present = (r: InfoRow | null): r is InfoRow => r !== null;
const row = (label: string, value: string | null, mono?: boolean): InfoRow | null => (value ? { label, value, ...(mono && { mono }) } : null);

function styleRows(detail: Detail | null): (InfoRow | null)[] {
  const s = rec(detail?.extra.style_settings);
  return [row('Outline', sentence(s.outline)), row('Shading', sentence(s.shading)), row('Detail', sentence(s.detail))];
}

/** The card's tags, trimmed, blank ones dropped: the Tags row and the panel's chips. */
export const tagsOf = (card: Card): string[] => (Array.isArray(card.meta.tags) ? card.meta.tags.map(text).filter((t): t is string => t !== null) : []);

export function infoRows(familyId: FamilyId, card: Card, detail: Detail | null, timeZone?: string): InfoRow[] {
  const m = card.meta;
  const created = formatDate(m.created_at, timeZone);
  const updated = formatDate(m.updated_at, timeZone);
  const same = text(m.created_at) && Date.parse(String(m.created_at)) === Date.parse(String(m.updated_at));
  const count = num(m.animation_count);
  const animations: (InfoRow | null)[] = detail ? animationRows(detail) : [row('Animations', count ? String(count) : null, true)];
  const hasAnimations = detail ? detail.animations.length > 0 : !!count;
  const playback = hasAnimations ? row('Playback', '8 fps (default)') : null;
  const tagRow = row('Tags', tagsOf(card).join(', '));
  const fixed = detail?.extra ?? {};

  let rows: (InfoRow | null)[];
  switch (familyId) {
    case 'characters':
      rows = [
        row('State', text(m.state_name) ?? 'Base'), row('Canvas', px(m.size), true), row('Directions', directions(card, detail)), row('View', sentence(m.view)),
        ...animations, ...styleRows(detail), row('Guidance', grouped(fixed.guidance), true),
        row('AI freedom', grouped(fixed.ai_freedom), true), row('Template', sentence(m.template_id)),
        tagRow, row('Created', created), row('Updated', same ? null : updated), playback,
      ];
      break;
    case 'objects':
      rows = [
        row('State', text(m.state_name)), row('Canvas', px(m.size), true), row('Directions', directions(card, detail)), row('View', sentence(m.view)),
        ...animations, ...styleRows(detail), tagRow, row('Created', created), playback,
      ];
      break;
    case 'tilesets':
      rows = [row('Tile size', px(m.tile_size), true), row('View', sentence(m.view)), row('Created', created)];
      break;
    case 'tilesets-side':
      rows = [row('Top edge', text(m.transition_description) && title(text(m.transition_description)!)), row('Tile size', px(m.tile_size), true), row('View', 'Side (platformer)'), row('Created', created)];
      break;
    case 'isometric':
      rows = [row('Size', num(m.size) === null ? null : `${num(m.size)} px`, true), row('Shape', sentence(m.tile_shape)), row('Created', created)];
      break;
    case 'tiles-pro':
      rows = [
        row('Tile type', sentence(m.tile_type)), row('Tile size', px(m.tile_size), true), row('Variations', grouped(m.n_tiles), true),
        row('View', sentence(m.tile_view)), row('Created', created),
      ];
      break;
    case 'ui':
      rows = [row('Size', px(m.size), true), row('Created', created)];
      break;
  }
  return rows.filter(present);
}

/** The long text with its Copy button. The prompt/description/terrains are shown here, not repeated as a fact row. */
export function textBlock(familyId: FamilyId, card: Card): { label: 'Prompt' | 'Description' | 'Terrains' | 'Terrain'; text: string } | null {
  const m = card.meta;
  const pick = (label: 'Prompt' | 'Description' | 'Terrains' | 'Terrain', t: string | null) => (t ? { label, text: t } : null);
  switch (familyId) {
    case 'characters':
    case 'objects':
    case 'ui':
      return pick('Prompt', text(m.prompt));
    case 'isometric':
    case 'tiles-pro':
      return pick('Description', text(m.description));
    case 'tilesets': {
      const [lower, upper] = [text(m.lower_description), text(m.upper_description)];
      return pick('Terrains', lower && (upper ? `${title(lower)} → ${title(upper)}` : title(lower)));
    }
    case 'tilesets-side':
      return pick('Terrain', text(m.lower_description));
  }
}

const KIND: Record<FamilyId, string> = {
  characters: 'Character', objects: 'Object', ui: 'UI asset', tilesets: 'Top-down tileset', 'tilesets-side': 'Sidescroller tileset', isometric: 'Isometric tile', 'tiles-pro': 'Tiles Pro',
};

/** "Character · Base", "Object · open", "Top-down tileset". */
export function kicker(familyId: FamilyId, card: Card): string {
  if (familyId === 'characters') return `${KIND[familyId]} · ${text(card.meta.state_name) ?? 'Base'}`;
  const state = familyId === 'objects' ? text(card.meta.state_name) : null;
  return state ? `${KIND[familyId]} · ${state}` : KIND[familyId];
}

/** Hand-off link (R4): an id route only for the four verified types; the others open PixelLab's library page. The id goes only to pixellab.ai. */
export function pixellabLink(familyId: FamilyId, card: Card): string {
  const id = encodeURIComponent(card.id);
  const path = {
    characters: `/create-character/${id}`,
    objects: `/create-object/${id}`,
    tilesets: `/maps/tilesets/${id}`,
    'tiles-pro': `/maps/tiles/${id}`,
    'tilesets-side': '/maps?tab=tilesets',
    isometric: '/maps?tab=tiles',
    ui: '/create-ui',
  }[familyId];
  return `https://www.pixellab.ai${path}`;
}

/** "3f2a…9c1e"; ids of 8 characters or fewer are not shown at all. */
export const maskId = (id: string): string => (id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : '…');

/** Technical details under the masked id: Status, Last checked, Skeleton keypoints. */
export function technicalRows(card: Card, detail: Detail | null, checkedAt: number | null, timeZone?: string): InfoRow[] {
  const status = sentence(card.meta.status);
  return [row('Status', status), row('Last checked', formatDate(checkedAt, timeZone)), row('Skeleton keypoints', detail?.extra.skeleton === true ? 'Included' : null)].filter(present);
}

/** Tilesets and Tiles Pro may need a paid plan on PixelLab's side. */
export const needsTierHint = (familyId: FamilyId): boolean => familyId === 'tilesets' || familyId === 'tilesets-side' || familyId === 'tiles-pro';
