import { describe, expect, test } from 'vitest';
import { fitScale, trimBox } from '../../src/lib/render/fit';

describe('fitScale', () => {
  // [dpr, art, box, expected device pixels per art pixel k]
  test.each([
    [1, 16, 128, 8],
    [1.25, 32, 100, 3], // 125 device px -> k=3 (not 4: 128 > 125)
    [1.5, 32, 64, 3], // 96 device px -> k=3, i.e. 2 CSS px per art px would be wrong
    [2, 16, 128, 16],
    [2.625, 32, 100, 8], // 262 device px -> k=8
    [3, 32, 100, 9], // 300 device px -> k=9
  ])('dpr %s: %spx art in %spx box -> k=%s', (dpr, art, box, k) => {
    const r = fitScale(art, art, box, box, dpr);
    expect(r.smooth).toBe(false);
    expect(r.cssW).toBeCloseTo((art * k) / dpr, 9);
    expect(r.cssH).toBeCloseTo((art * k) / dpr, 9);
    expect(r.cssW).toBeLessThanOrEqual(box);
  });

  test('limited by the tighter axis', () => {
    const r = fitScale(30, 44, 128, 128, 2); // 256/44 -> k=5
    expect([r.cssW, r.cssH]).toEqual([75, 110]);
  });

  test('float noise does not drop a scale step', () => {
    expect(fitScale(23, 23, 200, 200, 1.15).cssW).toBeCloseTo((23 * 10) / 1.15, 9);
  });

  test('art exactly fitting the box', () => {
    expect(fitScale(16, 16, 16, 16, 1)).toEqual({ cssW: 16, cssH: 16, smooth: false });
    expect(fitScale(16, 16, 16, 16, 2)).toEqual({ cssW: 16, cssH: 16, smooth: false });
  });

  test('art one pixel too big goes smooth and still fits', () => {
    const r = fitScale(17, 17, 16, 16, 1);
    expect(r.smooth).toBe(true);
    expect(r.cssW).toBeCloseTo(16, 9);
    expect(r.cssH).toBeCloseTo(16, 9);
  });

  test('art larger than the box: smooth downscale that fits, aspect kept', () => {
    const r = fitScale(768, 512, 160, 160, 2);
    expect(r.smooth).toBe(true);
    expect(r.cssW).toBeCloseTo(160, 9);
    expect(r.cssH).toBeCloseTo(160 * (512 / 768), 9);
  });

  test('undecoded or empty sizes', () => {
    const none = { cssW: 0, cssH: 0, smooth: false };
    expect(fitScale(0, 0, 100, 100, 1)).toEqual(none);
    expect(fitScale(16, 0, 100, 100, 2)).toEqual(none);
    expect(fitScale(16, 16, 0, 0, 1)).toEqual(none);
  });
});

describe('trimBox', () => {
  const rgba = (w: number, h: number, opaque: [number, number][]) => {
    const d = new Uint8ClampedArray(w * h * 4);
    for (const [x, y] of opaque) d[(y * w + x) * 4 + 3] = 255;
    return d;
  };

  test('bounding box of opaque pixels', () => {
    expect(trimBox(rgba(8, 6, [[2, 1], [5, 4], [3, 2]]), 8, 6)).toEqual({ x: 2, y: 1, w: 4, h: 4 });
  });
  test('single pixel', () => {
    expect(trimBox(rgba(4, 4, [[3, 0]]), 4, 4)).toEqual({ x: 3, y: 0, w: 1, h: 1 });
  });
  test('fully opaque keeps the whole image', () => {
    const all = Array.from({ length: 12 }, (_, i) => [i % 4, Math.floor(i / 4)] as [number, number]);
    expect(trimBox(rgba(4, 3, all), 4, 3)).toEqual({ x: 0, y: 0, w: 4, h: 3 });
  });
  test('fully transparent returns the full image', () => {
    expect(trimBox(rgba(5, 3, []), 5, 3)).toEqual({ x: 0, y: 0, w: 5, h: 3 });
  });
  test('faint pixels count; colour with zero alpha does not', () => {
    const d = new Uint8ClampedArray(2 * 2 * 4);
    d[0] = 255; // red, alpha 0
    d[(1 * 2 + 1) * 4 + 3] = 1; // faint pixel at (1,1)
    expect(trimBox(d, 2, 2)).toEqual({ x: 1, y: 1, w: 1, h: 1 });
  });
  test('a bare alpha plane works too', () => {
    const a = new Uint8ClampedArray(9);
    a[4] = 9;
    expect(trimBox(a, 3, 3)).toEqual({ x: 1, y: 1, w: 1, h: 1 });
  });
  test('empty image', () => {
    expect(trimBox(new Uint8ClampedArray(0), 0, 0)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});
