<script lang="ts">
  import { fitScale, trimBox } from './fit';

  // The only thing that draws art. Callers pass a decodable Blob (never a URL: only http.ts fetches).
  // The container takes its size from its parent; the canvas is absolutely placed so it can't resize it.
  // fill: grow to the container (largest whole device-pixel scale). Default: never above native size.
  let { blob, alt, trim = false, fill = false }: { blob: Blob | null; alt: string; trim?: boolean; fill?: boolean } = $props();

  let box: HTMLDivElement | undefined = $state();
  let canvas: HTMLCanvasElement | undefined = $state();
  let art = $state<{ w: number; h: number } | null>(null);
  let boxSize = $state({ w: 0, h: 0 });
  let dpr = $state(window.devicePixelRatio || 1);

  // Decode + (optionally) trim + draw at native resolution. A newer run supersedes an older one.
  $effect(() => {
    const b = blob;
    const t = trim;
    const c = canvas;
    if (!c) return;
    let stale = false;
    art = null;
    if (!b) return;
    createImageBitmap(b).then(
      (bmp) => {
        if (stale) return bmp.close();
        let sx = 0;
        let sy = 0;
        let sw = bmp.width;
        let sh = bmp.height;
        if (t) {
          const tmp = new OffscreenCanvas(sw, sh).getContext('2d', { willReadFrequently: true })!;
          tmp.drawImage(bmp, 0, 0);
          ({ x: sx, y: sy, w: sw, h: sh } = trimBox(tmp.getImageData(0, 0, sw, sh).data, sw, sh));
        }
        c.width = sw; // also clears the canvas
        c.height = sh;
        c.getContext('2d')!.drawImage(bmp, sx, sy, sw, sh, 0, 0, sw, sh);
        bmp.close();
        art = { w: sw, h: sh };
      },
      () => {}, // undecodable blob: keep the placeholder
    );
    return () => {
      stale = true;
    };
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
</script>

<div class="pixel-art" bind:this={box} role="img" aria-label={alt}>
  <canvas
    bind:this={canvas}
    style:display={fit ? null : 'none'}
    style:width="{fit?.cssW ?? 0}px"
    style:height="{fit?.cssH ?? 0}px"
    style:image-rendering={fit?.smooth ? 'auto' : 'pixelated'}
  ></canvas>
</div>

<style>
  .pixel-art {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  canvas {
    position: absolute;
    inset: 0;
    margin: auto;
  }
</style>
