<script lang="ts">
  import { fitScale, trimBox, zoomScale } from './fit';

  // The only thing that draws art. Callers pass decodable Blobs (never a URL: only http.ts fetches).
  // The container takes its size from its parent; the canvas is absolutely placed so it can't resize it.
  // fill: grow to the container (largest whole device-pixel scale). Default: never above native size.
  // frames: an animation, decoded once; `frame` picks the one drawn. zoom: CSS px per art px (null = Fit);
  // zoomed art larger than the box overflows it, so a scrolling parent pans natively.
  let {
    blob = null,
    frames,
    frame = 0,
    alt,
    trim = false,
    fill = false,
    zoom = null,
    onmeasure,
  }: {
    blob?: Blob | null;
    frames?: Blob[];
    frame?: number;
    alt: string;
    trim?: boolean;
    fill?: boolean;
    zoom?: number | null;
    onmeasure?: (m: { k: number; smooth: boolean; artW: number; artH: number }) => void;
  } = $props();

  let box: HTMLDivElement | undefined = $state();
  let canvas: HTMLCanvasElement | undefined = $state();
  let art = $state<{ w: number; h: number } | null>(null);
  let bitmaps = $state.raw<ImageBitmap[]>([]);
  let crop = { x: 0, y: 0 };
  let boxSize = $state({ w: 0, h: 0 });
  let dpr = $state(window.devicePixelRatio || 1);

  // Decode + (optionally) trim once per source set. A newer run supersedes an older one; bitmaps are closed
  // on change and destroy.
  $effect(() => {
    const srcs = frames?.length ? frames : blob ? [blob] : [];
    const t = trim;
    const c = canvas;
    if (!c) return;
    let stale = false;
    let held: ImageBitmap[] = [];
    art = null;
    bitmaps = [];
    if (srcs.length) {
      Promise.allSettled(srcs.map((s) => createImageBitmap(s, { colorSpaceConversion: 'none' }))).then((res) => {
        const list = res.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
        // An undecodable source keeps the placeholder; stale runs are discarded.
        if (stale || list.length < res.length) return list.forEach((b) => b.close());
        held = list;
        try {
          let { width: sw, height: sh } = list[0]; // ponytail: sized to the first frame; mixed frame sizes crop/pad
          let sx = 0;
          let sy = 0;
          if (t) {
            const tmp = new OffscreenCanvas(sw, sh).getContext('2d', { willReadFrequently: true })!;
            tmp.drawImage(list[0], 0, 0);
            ({ x: sx, y: sy, w: sw, h: sh } = trimBox(tmp.getImageData(0, 0, sw, sh).data, sw, sh));
          }
          crop = { x: sx, y: sy };
          c.width = sw; // also clears the canvas
          c.height = sh;
          if (list.length === 1) {
            // One picture (every grid cell): draw once and release the bitmap.
            c.getContext('2d')!.drawImage(list[0], sx, sy, sw, sh, 0, 0, sw, sh);
            list[0].close();
            held = [];
          } else bitmaps = list;
          art = { w: sw, h: sh };
        } catch {
          list.forEach((b) => b.close()); // keep the placeholder
        }
      });
    }
    return () => {
      stale = true;
      held.forEach((b) => b.close());
      c.width = c.height = 0;
    };
  });

  // Draw the shown frame without re-decoding.
  $effect(() => {
    const a = art;
    const bs = bitmaps;
    const b = bs[Math.min(Math.max(0, frame), bs.length - 1)];
    if (!canvas || !a || !b) return;
    try {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, a.w, a.h);
      ctx.drawImage(b, crop.x, crop.y, a.w, a.h, 0, 0, a.w, a.h);
    } catch {
      b.close(); // a draw error must not leak the bitmap
    }
  });

  $effect(() => {
    if (!box) return;
    const ro = new ResizeObserver(([e]) => (boxSize = { w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(box);
    return () => ro.disconnect();
  });

  // Browser zoom / moving between screens changes devicePixelRatio; the query fires once per change.
  $effect(() => {
    const mq = matchMedia(`(resolution: ${dpr}dppx)`);
    const on = () => (dpr = window.devicePixelRatio || 1);
    mq.addEventListener('change', on, { once: true });
    return () => mq.removeEventListener('change', on);
  });

  const fit = $derived(
    art
      ? fitScale(art.w, art.h, fill ? boxSize.w : Math.min(boxSize.w, art.w), fill ? boxSize.h : Math.min(boxSize.h, art.h), dpr)
      : null,
  );
  const shown = $derived(art && zoom !== null ? zoomScale(art.w, art.h, zoom, dpr) : fit);

  // Report the Fit scale (device px per art px) for the zoom readout.
  $effect(() => {
    if (!art || !fit || !fit.cssW) return;
    onmeasure?.({ k: (fit.cssW * dpr) / art.w, smooth: fit.smooth, artW: art.w, artH: art.h });
  });
</script>

<div class="pixel-art" class:zoomed={zoom !== null} bind:this={box} role="img" aria-label={alt}>
  <canvas
    bind:this={canvas}
    style:display={shown ? null : 'none'}
    style:width="{shown?.cssW ?? 0}px"
    style:height="{shown?.cssH ?? 0}px"
    style:image-rendering={shown?.smooth ? 'auto' : 'pixelated'}
  ></canvas>
</div>

<style>
  .pixel-art {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .pixel-art.zoomed {
    overflow: visible;
  }
  canvas {
    position: absolute;
    inset: 0;
    margin: auto;
  }
</style>
