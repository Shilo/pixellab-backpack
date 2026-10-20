import { expect, test } from 'vitest';
import { dueFamilies, spacer, visibleRows, type Metrics } from '../../src/lib/ui/CategoryGrid.svelte';

const m: Metrics = { cols: 5, stride: 200, gap: 20, top: 30, viewH: 900 };

test('only rows on screen plus one spare each side are kept', () => {
  expect(visibleRows(0, m, 1000)).toEqual([0, 6]); // ceil(870/200)=5, +1
  expect(visibleRows(10_030, m, 1000)).toEqual([49, 56]); // floor(50)-1 .. ceil(54.5)+1
  expect(visibleRows(0, m, 3)).toEqual([0, 3]); // short list
  expect(visibleRows(0, m, 0)).toEqual([0, 0]);
});

test('spacers keep the scroll height: kept rows + spacers = all rows', () => {
  const rows = 1000;
  const [r0, r1] = visibleRows(10_030, m, rows);
  const total = spacer(r0, m) + (r0 ? m.gap : 0) + (r1 - r0) * m.stride - m.gap + (rows > r1 ? m.gap : 0) + spacer(rows - r1, m);
  expect(total).toBe(rows * m.stride - m.gap);
});

test('next pages are due only near the end of a family', () => {
  const segs = [
    { id: 'tilesets' as const, end: 100 },
    { id: 'tilesets-side' as const, end: 150 },
  ];
  expect(dueFamilies(segs, 30, 5)).toEqual([]);
  expect(dueFamilies(segs, 90, 5)).toEqual(['tilesets']);
  expect(dueFamilies(segs, 140, 5)).toEqual(['tilesets', 'tilesets-side']);
});
