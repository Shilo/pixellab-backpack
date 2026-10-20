export const DEFAULT_FPS = 8, MIN_FPS = 1, MAX_FPS = 30;

export const clampFps = (f: number): number => (Number.isNaN(f) ? DEFAULT_FPS : Math.min(MAX_FPS, Math.max(MIN_FPS, Math.round(f))));

// Next frame on the clock: loops, or holds the last frame and reports ended.
export function advance(i: number, n: number, loop: boolean): { i: number; ended: boolean } {
  if (i + 1 < n) return { i: i + 1, ended: false };
  return loop ? { i: 0, ended: false } : { i: Math.max(0, n - 1), ended: true };
}

// Manual frame step; wraps both ways.
export const step = (i: number, n: number, d: 1 | -1): number => (n > 0 ? (((i + d) % n) + n) % n : 0);
