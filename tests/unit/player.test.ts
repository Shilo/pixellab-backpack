import { expect, test } from 'vitest';
import { advance, clampFps, DEFAULT_FPS, MAX_FPS, MIN_FPS, step } from '../../src/lib/render/player';

test('advance loops or stops on the last frame', () => {
  expect(advance(0, 4, true)).toEqual({ i: 1, ended: false });
  expect(advance(3, 4, true)).toEqual({ i: 0, ended: false });
  expect(advance(2, 4, false)).toEqual({ i: 3, ended: false });
  expect(advance(3, 4, false)).toEqual({ i: 3, ended: true });
  expect(advance(0, 1, false)).toEqual({ i: 0, ended: true });
  expect(advance(0, 0, false)).toEqual({ i: 0, ended: true });
});

test('step wraps both ways', () => {
  expect(step(1, 4, 1)).toBe(2);
  expect(step(3, 4, 1)).toBe(0);
  expect(step(0, 4, -1)).toBe(3);
  expect(step(0, 1, -1)).toBe(0);
  expect(step(0, 0, 1)).toBe(0);
});

test('clampFps stays within bounds', () => {
  expect(clampFps(0)).toBe(MIN_FPS);
  expect(clampFps(-5)).toBe(MIN_FPS);
  expect(clampFps(99)).toBe(MAX_FPS);
  expect(clampFps(12)).toBe(12);
  expect(clampFps(7.6)).toBe(8);
  expect(clampFps(NaN)).toBe(DEFAULT_FPS);
  expect(clampFps(Infinity)).toBe(MAX_FPS);
  expect(clampFps(-Infinity)).toBe(MIN_FPS);
});
