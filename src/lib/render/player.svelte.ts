import { DEFAULT_FPS, advance, clampFps, step as stepIndex } from './player';

// Frame clock for the viewer. One rAF loop; hidden tabs pause it and resume the prior state.
export function createPlayer() {
  let n = $state(0);
  let index = $state(0);
  let playing = $state(false);
  let ended = $state(false);
  let fps = $state(DEFAULT_FPS);
  let loop = $state(true);
  let raf = 0;
  let last = 0;
  let acc = 0;

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const tick = (now: number) => {
    raf = 0;
    acc += Math.min(now - last, 250); // clamp so a stalled tab doesn't fast-forward
    last = now;
    const per = 1000 / fps;
    while (playing && acc >= per) {
      acc -= per;
      const r = advance(index, n, loop);
      index = r.i;
      if (r.ended) {
        ended = true;
        playing = false;
      }
    }
    if (playing) raf = requestAnimationFrame(tick);
  };
  // Starts the loop from idle or after a hidden tab; `last` is reset only here so no time is dropped per tick.
  function schedule() {
    if (!playing || raf || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  const onVisibility = () => (document.hidden ? stop() : schedule());
  document.addEventListener('visibilitychange', onVisibility);

  const pause = () => {
    playing = false;
    stop();
  };
  const play = () => {
    if (n < 2) return;
    if (ended) {
      index = 0;
      ended = false;
    }
    playing = true;
    acc = 0;
    schedule();
  };

  return {
    get index() { return index; },
    get playing() { return playing; },
    get ended() { return ended; },
    get n() { return n; },
    get fps() { return fps; },
    set fps(v: number) { fps = clampFps(v); },
    get loop() { return loop; },
    set loop(v: boolean) { loop = v; },
    // New frame count. Opens playing, or paused under prefers-reduced-motion; keepIndex keeps position and play state.
    load(count: number, keepIndex = false) {
      n = count;
      ended = false;
      if (keepIndex) {
        index = Math.min(index, Math.max(0, count - 1));
        if (count < 2) pause();
        return;
      }
      index = 0;
      pause();
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) play();
    },
    play,
    pause,
    toggle: () => (playing ? pause() : play()),
    step(d: 1 | -1) {
      pause();
      ended = false;
      index = stepIndex(index, n, d);
    },
    resetFps: () => (fps = DEFAULT_FPS),
    destroy() {
      pause();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
