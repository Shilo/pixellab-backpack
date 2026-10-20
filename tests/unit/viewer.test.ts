import { expect, test } from 'vitest';
import type { Anim, Detail, Dir } from '../../src/lib/types';
import { chipLabel, chipVisible, defaultAnim, dirsFor, pickDir } from '../../src/lib/viewer';

const ALL: Dir[] = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const frames = (ds: Dir[]) => Object.fromEntries(ds.map((d) => [d, ['a', 'b']]));
const anim = (name: string, type: string | null, ds: Dir[]): Anim => ({ name, type, description: null, frames: frames(ds) });
const rot = (ds: Dir[]) => Object.fromEntries(ds.map((d) => [d, 'r']));
const detail = (ds: Dir[], animations: Anim[] = []): Detail => ({ rotations: rot(ds), animations, extra: {} });

test('defaultAnim: carried type, idle, first, Rotations', () => {
  const anims = [anim('Walk', 'walk', ALL), anim('Breathing idle', 'breathing-idle', ALL), anim('Run', 'run', ALL)];
  expect(defaultAnim(anims, 'run')).toBe(2);
  expect(defaultAnim(anims, 'jump')).toBe(1);
  expect(defaultAnim([anim('Walk', 'walk', ALL), anim('Run', 'run', ALL)])).toBe(0);
  expect(defaultAnim([])).toBe(-1);
});

test('pickDir: wanted, south, first available', () => {
  expect(pickDir(['south', 'east'], 'east')).toBe('east');
  expect(pickDir(['south', 'east'], 'west')).toBe('south');
  expect(pickDir(['east', 'west'])).toBe('east');
  expect(pickDir(['unknown'], 'south')).toBe('unknown');
});

test('dirsFor: 8-dir, 4-dir and 1-dir', () => {
  const four: Dir[] = ['south', 'east', 'north', 'west'];
  const d = detail(ALL, [anim('Walk', 'walk', four)]);
  expect(dirsFor(d, -1)).toEqual(ALL);
  expect(dirsFor(d, 0)).toEqual(['south', 'east', 'north', 'west']);
  expect(dirsFor(detail(['unknown'], [anim('Snap shut', null, ['unknown'])]), 0)).toEqual(['unknown']);
  expect(dirsFor(d, 5)).toEqual([]);
});

test('chipLabel forms', () => {
  const d = detail(ALL, [anim('Walk', 'walk', ALL)]);
  expect(chipLabel(d, 0, 'east', null, 1)).toBe('Walk · East');
  expect(chipLabel(d, -1, 'south', null, 1)).toBe('Rotations · South');
  expect(chipLabel(d, -1, 'south', 'Detailed robe', 2)).toBe('Detailed robe · South');
  expect(chipLabel(detail(['unknown'], [anim('Snap shut', null, ['unknown'])]), 0, 'unknown', null, 1)).toBe('Snap shut');
});

test('chipVisible needs a real choice', () => {
  expect(chipVisible(null, 1)).toBe(false);
  expect(chipVisible(detail(['unknown']), 1)).toBe(false);
  expect(chipVisible(detail(['unknown']), 2)).toBe(true);
  expect(chipVisible(detail(ALL), 1)).toBe(true);
  expect(chipVisible(detail(['unknown'], [anim('Snap shut', null, ['unknown'])]), 1)).toBe(true);
});
