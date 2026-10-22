<script lang="ts" module>
  // Swatch values from the mockup (frames-g3.js SW). Index 0 is the viewer's own theme backdrop.
  export const BACKDROPS = [
    { name: 'Theme', css: 'linear-gradient(#2a2c34, #16171c)' },
    { name: 'Checker', css: 'repeating-conic-gradient(#d4d4d8 0 25%, #8e8f96 0 50%) 0 0 / 10px 10px' },
    { name: 'Light gray', css: '#d1d1d1' },
    { name: 'Mid gray', css: '#777777' },
    { name: 'Black', css: '#000000' },
  ];
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { NEW_TAB } from '../app';
  import { DEFAULT_FPS, MAX_FPS, MIN_FPS } from '../render/player';
  import type { createPlayer } from '../render/player.svelte';
  import { leaves, moveFocus } from './keys';

  // The viewer's "..." menu: a glass popover under the capsule (desktop) or bottom sheet (phone). No player = a still picture.
  // zoomIn / zoomOut: the next step each way, undefined at the limit (the button is disabled).
  let { open, onClose, opener, player, zoomLabel, zoomIn, zoomOut, onZoom, onZoomToggle, backdrop, onBackdrop, link, onAddToFolder }: {
    open: boolean; onClose: () => void; opener: HTMLElement | undefined; player: ReturnType<typeof createPlayer> | null;
    zoomLabel: string; zoomIn?: number; zoomOut?: number; onZoom: (z: number) => void; onZoomToggle: () => void;
    backdrop: number; onBackdrop: (i: number) => void; link: string; onAddToFolder: () => void;
  } = $props();
  let panel = $state<HTMLDivElement>();
  let readout = $state<HTMLButtonElement>();

  // A zoom button that reaches its limit disables itself: focus moves to the readout instead of falling to the page.
  async function zoom(z: number | undefined, e: MouseEvent) {
    if (!z) return;
    const btn = e.currentTarget as HTMLButtonElement;
    onZoom(z);
    await tick();
    if (btn.disabled) readout?.focus();
  }

  const onkeydown = (e: KeyboardEvent) => moveFocus(e, [...(panel?.querySelectorAll<HTMLElement>('button:not(:disabled), a, input') ?? [])]);

  // Focus moves in and returns to the opener on close; Esc closes only this layer (capture phase keeps it from the viewer).
  $effect(() => {
    if (!open) return;
    const back = opener; // passed in: Safari does not focus a clicked button
    panel?.querySelector<HTMLElement>('button:not(:disabled), a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      back?.focus?.();
    };
  });
</script>

{#snippet sq(label: string, path: string, onclick: (e: MouseEvent) => void, disabled = false)}
  <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto sq" aria-label={label} {disabled} {onclick}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
  </button>
{/snippet}

{#if open}
  <button type="button" class="backdrop" tabindex="-1" aria-label="Close menu" onclick={onClose}></button>
  <div class="glass-popover is-open vt-scrim menu vt-grip" role="dialog" aria-label="Viewer options" tabindex="-1" bind:this={panel} {onkeydown} onfocusout={(e) => open && leaves(e) && onClose()}>
    {#if player}
      <div class="row">
        <span class="title">Playback</span>
        <span class="ctl">
          {@render sq('Step back', 'M7 5v14M18 6v12l-8-6z', () => player.step(-1), player.n < 2)}
          {@render sq(player.playing ? 'Pause' : 'Play', player.playing ? 'M9 6v12M15 6v12' : 'M8 5.5v13l11-6.5z', () => player.toggle(), player.n < 2)}
          {@render sq('Step forward', 'M17 5v14M6 6v12l8-6z', () => player.step(1), player.n < 2)}
          <span class="vt-sr" role="status" aria-live={player.playing ? 'off' : 'polite'}>Frame {player.index + 1} of {player.n}</span>
        </span>
      </div>
      <div class="row">
        <span class="title">Speed</span>
        <span class="ctl">
          {#if player.fps !== DEFAULT_FPS}<button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto reset" onclick={() => player.resetFps()}>Reset</button>{/if}
          {@render sq('Slower', 'M6 12h12', () => (player.fps -= 1), player.fps <= MIN_FPS)}
          <span class="read" aria-live="polite">{player.fps} fps</span>
          {@render sq('Faster', 'M12 6v12M6 12h12', () => (player.fps += 1), player.fps >= MAX_FPS)}
        </span>
      </div>
      <div class="row">
        <span class="title">Loop</span>
        <label class="glass-toggle">
          <input class="glass-toggle__input" type="checkbox" role="switch" aria-label="Loop" checked={player.loop} onchange={(e) => (player.loop = e.currentTarget.checked)} />
          <span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span>
        </label>
      </div>
    {/if}
    <div class="row">
      <span class="title">Zoom</span>
      <span class="ctl">
        {@render sq('Zoom out', 'M6 12h12', (e) => zoom(zoomOut, e), !zoomOut)}
        <button type="button" class="read readbtn" bind:this={readout} aria-label="Zoom: {zoomLabel}. Toggle Fit and 1:1" onclick={onZoomToggle}>{zoomLabel}</button>
        {@render sq('Zoom in', 'M12 6v12M6 12h12', (e) => zoom(zoomIn, e), !zoomIn)}
      </span>
    </div>
    <div class="bd">
      <span class="title" id="vm-bd">Backdrop</span>
      <div class="sw" role="radiogroup" aria-labelledby="vm-bd">
        {#each BACKDROPS as b, i (b.name)}
          <button type="button" class="swatch" class:on={i === backdrop} role="radio" aria-checked={i === backdrop} onclick={() => onBackdrop(i)}>
            <i style="background:{b.css}">{#if i === backdrop}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>{/if}</i>
            {b.name}
          </button>
        {/each}
      </div>
    </div>
    <hr class="glass-divider" />
    <button type="button" class="glass-list__item glass-list__item--interactive open" onclick={() => (onClose(), onAddToFolder())}>
      <span class="title">Add to folder…</span>
      <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path d="M12 10.5v5M9.5 13h5" /></svg></span>
    </button>
    <a class="glass-list__item glass-list__item--interactive open" href={link} target="_blank" rel="noopener noreferrer">
      <span class="title">Open in PixelLab ↗<span class="vt-sr">{NEW_TAB}</span></span>
    </a>
  </div>
{/if}

<style>
  .backdrop { position: fixed; inset: 0; z-index: 1000; border: 0; padding: 0; background: rgba(8, 10, 16, .25); cursor: default; }
  .menu { position: fixed; z-index: 1010; top: 92px; right: calc(24px + var(--side, 0px)); left: auto; bottom: auto; width: 340px; padding: 6px 20px; border-radius: 20px; transform: none;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); max-height: calc(100dvh - 110px); overflow-y: auto; outline: none; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 56px; border-bottom: 1px solid var(--gl-border-subtle); }
  .title { font-size: 15px; }
  .ctl { display: flex; align-items: center; gap: 6px; }
  .sq { width: 44px; height: 44px; padding: 0; border-radius: 50%; }
  .sq svg { width: 16px; height: 16px; stroke-width: 2.2; }
  .reset { min-height: 44px; padding: 0 10px; font-size: 13px; }
  .read { min-width: 54px; text-align: center; font-size: 14px; font-variant-numeric: tabular-nums; color: var(--gl-color-text); }
  .readbtn { min-width: 76px; min-height: 44px; border: 0; border-radius: 22px; background: none; cursor: pointer; padding: 0 6px; font: inherit; font-size: 14px; }
  .menu :global(.glass-toggle) { --gl-toggle-track-bg-checked: rgba(255, 255, 255, .85); --gl-toggle-thumb-bg: #1b1d25; }
  .bd { padding: 14px 0 4px; display: grid; gap: 10px; }
  .sw { display: flex; justify-content: space-between; padding: 2px 0 4px; }
  .swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 56px; min-height: 44px; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; font-size: 12px; color: var(--gl-color-text-muted); }
  .swatch i { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .35); }
  .swatch.on { color: var(--gl-color-text); }
  .swatch.on i { outline: 2px solid #fff; outline-offset: 2px; }
  .swatch i svg { width: 16px; height: 16px; stroke: #fff; stroke-width: 2.6; }
  .glass-divider { margin: 6px 0; }
  .open { min-height: 44px; padding-left: 0; padding-right: 0; text-decoration: none; color: inherit; cursor: pointer; }
  button.open { justify-content: space-between; }
  .menu .open:not(:last-child)::after { inset-inline: 0; } /* the divider spans the padded width, as the rows above (outranks GlassKit) */
  .open svg { width: 19px; height: 19px; }
  .sq:focus-visible, .readbtn:focus-visible, .swatch:focus-visible, .open:focus-visible, .reset:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  @media (max-width: 600px) {
    .backdrop { background: rgba(8, 10, 16, .45); }
    .menu { left: 8px; right: 8px; top: auto; bottom: var(--vt-bot, 12px); width: auto; padding: 18px 20px 8px; border-radius: 30px; }
    .swatch { width: 60px; font-size: 12.5px; }
    .swatch i { width: 34px; height: 34px; }
  }
</style>
