import { describe, expect, it } from 'vitest';
import { infoRows, kicker, maskId, pixellabLink, tagsOf, technicalRows, textBlock } from '../../src/lib/info';
import type { Card, Detail, FamilyId } from '../../src/lib/types';

const ID = 'c0000000-0000-4000-8000-000000000001';
const card = (meta: Record<string, unknown>): Card => ({ key: 'k', id: ID, name: 'N', done: true, thumb: null, fp: 'f', meta });
const TZ = 'UTC';
const get = (rows: { label: string; value: string }[], l: string) => rows.find((r) => r.label === l)?.value;
const labels = (rows: { label: string }[]) => rows.map((r) => r.label);

const knight = card({
  prompt: 'a knight', size: { width: 64, height: 64 }, directions: 8, view: 'low top-down', template_id: 'mannequin', tags: ['hero', 'tank'],
  created_at: '2026-02-03T09:20:00Z', updated_at: '2026-02-03T09:20:00Z', animation_count: 2, group_id: 'GROUP-ID', status: 'completed',
});
const frames = (n: number) => Array.from({ length: n }, (_, i) => `https://img/${i}.png`);
const detail: Detail = {
  rotations: { south: 'u', east: 'u', north: 'u', west: 'u' },
  animations: [
    { name: 'Walk', type: 'walk', description: null, frames: { south: frames(8), east: frames(8), north: frames(8), west: frames(8) } },
    { name: 'Idle', type: 'idle', description: null, frames: { south: frames(8), east: frames(9) } },
  ],
  extra: { style_settings: { outline: 'single color black outline', shading: 'basic shading', detail: 'medium detail' }, guidance: 7.5, ai_freedom: 1200, skeleton: true },
};

describe('infoRows', () => {
  it('character before detail: Base state, formats, no Updated when equal to Created', () => {
    const rows = infoRows('characters', knight, null, TZ);
    expect(get(rows, 'State')).toBe('Base');
    expect(get(rows, 'Canvas')).toBe('64 × 64 px');
    expect(get(rows, 'Directions')).toBe('8');
    expect(get(rows, 'View')).toBe('Low top-down');
    expect(get(rows, 'Animations')).toBe('2');
    expect(get(rows, 'Template')).toBe('Mannequin');
    expect(get(rows, 'Tags')).toBe('hero, tank');
    expect(get(rows, 'Created')).toBe('Feb 3, 2026, 09:20');
    expect(get(rows, 'Playback')).toBe('8 fps (default)');
    expect(labels(rows)).not.toContain('Updated');
    expect(labels(rows)).not.toContain('Outline');
    expect(JSON.stringify(rows)).not.toMatch(/GROUP-ID|c0000000/);
  });

  it('character with detail: direction names, one row per animation, style, guidance, Updated when different', () => {
    const rows = infoRows('characters', card({ ...knight.meta, state_name: 'Armed', updated_at: '2026-02-04T10:00:00Z' }), detail, TZ);
    expect(get(rows, 'State')).toBe('Armed');
    expect(get(rows, 'Directions')).toBe('4 · S, E, N, W');
    expect(rows.filter((r) => r.label === 'Animation').map((r) => r.value)).toEqual(['Walk · 8 frames · 4 directions', 'Idle · 8–9 frames · 2 directions']);
    expect(labels(rows)).not.toContain('Animations');
    expect(get(rows, 'Outline')).toBe('Single color black outline');
    expect(get(rows, 'Guidance')).toBe('7.5');
    expect(get(rows, 'AI freedom')).toBe('1,200');
    expect(get(rows, 'Updated')).toBe('Feb 4, 2026, 10:00');
  });

  it('hides null and empty fields', () => {
    const rows = infoRows('characters', card({ prompt: 'x', animation_count: 0, tags: [], created_at: null }), null, TZ);
    expect(labels(rows)).toEqual(['State']);
  });

  it('object: State hidden when null, single view, description line under the animation', () => {
    const o = card({ size: { width: 32, height: 32 }, directions: 1, view: 'side', created_at: '2026-01-01T00:00:00Z', animation_count: 1 });
    expect(get(infoRows('objects', o, null, TZ), 'Directions')).toBe('1 (single view)');
    expect(labels(infoRows('objects', o, null, TZ))).not.toContain('State');
    const d: Detail = { rotations: { unknown: 'u' }, extra: {}, animations: [{ name: 'Snap shut', type: null, description: 'The lid snaps shut', frames: { unknown: frames(9) } }] };
    const rows = infoRows('objects', card({ ...o.meta, state_name: 'open' }), d, TZ);
    expect(get(rows, 'Directions')).toBe('1 (single view)');
    expect(get(rows, 'Animation')).toBe('Snap shut · 9 frames · 1 direction\nThe lid snaps shut');
    expect(get(rows, 'State')).toBe('open');
  });

  it('tileset families', () => {
    const t = card({ lower_description: 'dirt', upper_description: 'grass', tile_size: { width: 16, height: 16 }, view: 'high top-down', created_at: '2026-01-01T00:00:00Z' });
    expect(infoRows('tilesets', t, null, TZ)).toEqual([
      { label: 'Tile size', value: '16 × 16 px', mono: true }, { label: 'View', value: 'High top-down' }, { label: 'Created', value: 'Jan 1, 2026, 00:00' },
    ]);
    expect(textBlock('tilesets', t)).toEqual({ label: 'Terrains', text: 'Dirt → Grass' });
    const s = card({ lower_description: 'stone', transition_description: 'moss', tile_size: { width: 32, height: 32 }, created_at: '2026-01-01T00:00:00Z' });
    const sr = infoRows('tilesets-side', s, null, TZ);
    expect(get(sr, 'Top edge')).toBe('Moss');
    expect(get(sr, 'View')).toBe('Side (platformer)');
    expect(textBlock('tilesets-side', s)).toEqual({ label: 'Terrain', text: 'stone' });
  });

  it('isometric, Tiles Pro and UI', () => {
    const i = card({ description: 'a block', size: 32, tile_shape: 'block', created_at: '2026-01-01T00:00:00Z' });
    expect(get(infoRows('isometric', i, null, TZ), 'Size')).toBe('32 px');
    expect(get(infoRows('isometric', i, null, TZ), 'Shape')).toBe('Block');
    expect(textBlock('isometric', i)).toEqual({ label: 'Description', text: 'a block' });
    const p = card({ description: 'roads', tile_type: 'square_topdown', tile_size: 32, n_tiles: 1536, tile_view: 'high top-down' });
    const pr = infoRows('tiles-pro', p, null, TZ);
    expect(get(pr, 'Tile type')).toBe('Square top-down');
    expect(get(pr, 'Tile size')).toBe('32 × 32 px');
    expect(get(pr, 'Variations')).toBe('1,536');
    expect(labels(pr)).not.toContain('Created');
    const u = card({ prompt: 'a panel', size: { width: 688, height: 384 }, created_at: '2026-01-01T00:00:00Z' });
    expect(get(infoRows('ui', u, null, TZ), 'Size')).toBe('688 × 384 px');
    expect(textBlock('ui', u)).toEqual({ label: 'Prompt', text: 'a panel' });
  });
});

describe('tagsOf', () => {
  it('trims tags and drops blank or non-string ones; the Tags row uses the same list', () => {
    const c = card({ tags: [' hero ', '', '  ', 3, 'tank'] });
    expect(tagsOf(c)).toEqual(['hero', 'tank']);
    expect(get(infoRows('characters', c, null, TZ), 'Tags')).toBe('hero, tank');
    expect(tagsOf(card({ tags: 'hero' }))).toEqual([]);
  });
});

describe('textBlock and kicker', () => {
  it('null when the text is missing', () => expect(textBlock('characters', card({}))).toBeNull());
  it('kickers', () => {
    expect(kicker('characters', knight)).toBe('Character · Base');
    expect(kicker('objects', card({ state_name: 'open' }))).toBe('Object · open');
    expect(kicker('objects', card({}))).toBe('Object');
    expect(kicker('tilesets', card({}))).toBe('Top-down tileset');
  });
});

describe('pixellabLink', () => {
  const links = (['characters', 'objects', 'tilesets', 'tiles-pro', 'tilesets-side', 'isometric', 'ui'] as FamilyId[]).map((f) => pixellabLink(f, knight));
  it('puts the id only on the four verified routes', () => {
    expect(links).toEqual([
      `https://www.pixellab.ai/create-character/${ID}`,
      `https://www.pixellab.ai/create-object/${ID}`,
      `https://www.pixellab.ai/maps/tilesets/${ID}`,
      `https://www.pixellab.ai/maps/tiles/${ID}`,
      'https://www.pixellab.ai/maps?tab=tilesets',
      'https://www.pixellab.ai/maps?tab=tiles',
      'https://www.pixellab.ai/create-ui',
    ]);
  });
});

describe('maskId', () => {
  it('keeps the first and last four', () => expect(maskId('3f2a1111-2222-4333-8444-5555555e9c1e')).toBe('3f2a…9c1e'));
  it('hides short ids', () => expect(maskId('abc')).toBe('…'));
});

describe('technicalRows', () => {
  it('status, last checked and skeleton; hidden when unknown', () => {
    expect(technicalRows(knight, detail, Date.parse('2026-03-01T12:05:00Z'), TZ)).toEqual([
      { label: 'Status', value: 'Completed' }, { label: 'Last checked', value: 'Mar 1, 2026, 12:05' }, { label: 'Skeleton keypoints', value: 'Included' },
    ]);
    expect(technicalRows(card({}), null, null, TZ)).toEqual([]);
  });
});
