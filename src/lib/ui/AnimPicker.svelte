<script lang="ts">
  import type { Anim, Dir } from '../types';
  import { COMPASS, dirLabel } from '../viewer';

  // The viewer's "Walk · East ▾" chip and its popover (desktop) or bottom sheet (phone): Animation, State, Direction.
  let { label, loading, anims, anim, dirs, allDirs, dir, states, stateKey, onAnim, onDir, onState }: {
    label: string; loading: boolean; anims: Anim[]; anim: number; dirs: Dir[]; allDirs: Dir[]; dir: Dir;
    states: { key: string; label: string }[]; stateKey: string;
    onAnim: (i: number) => void; onDir: (d: Dir) => void; onState: (key: string) => void;
  } = $props();

  const ANGLE: Partial<Record<Dir, number>> = { north: 0, 'north-east': 45, east: 90, 'south-east': 135, south: 180, 'south-west': 225, west: 270, 'north-west': 315 };
  let open = $state(false);
  let chip = $state<HTMLButtonElement>();
  let panel = $state<HTMLDivElement>();

  // "8f" from the first direction's frame list; a direction-less set shows nothing.
  const frameCount = (a: Anim) => Object.values(a.frames)[0]?.length ?? 0;

  function close() {
    open = false;
  }

  // Focus moves into the popover and returns to the chip on close; Esc closes only this layer.
  $effect(() => {
    if (!open) return;
    const opener = chip;
    panel?.querySelector<HTMLElement>('[aria-checked="true"], button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation(); // capture phase: the viewer's own Esc (close viewer) never sees it
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      opener?.focus();
    };
  });
</script>

<button type="button" class="vt-chip" bind:this={chip} disabled={loading} aria-haspopup="dialog" aria-expanded={open} onclick={() => (open = !open)}>
  <span>{loading ? 'Loading animations…' : label}</span>
  {#if !loading}<svg viewBox="0 0 24 24" class="chev" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>{/if}
</button>

{#if open}
  <button type="button" class="backdrop" tabindex="-1" aria-label="Close menu" onclick={close}></button>
  <div class="glass-popover is-open vt-scrim pick" role="dialog" aria-label="Animation, state and direction" bind:this={panel}>
    <p class="head">Animation</p>
    <ul class="glass-list glass-list--bare">
      {#each [-1, ...anims.keys()] as i (i)}
        <li>
          <button type="button" class="glass-list__item glass-list__item--interactive" aria-current={anim === i} onclick={() => onAnim(i)}>
            <span class="glass-list__content">
              <span class="glass-list__title">{i < 0 ? 'Rotations' : `${anims[i].name} · ${frameCount(anims[i])}f`}</span>
              {#if i < 0}<span class="glass-list__subtitle">Still pose for each direction</span>{/if}
            </span>
            <span class="glass-list__trailing">{#if anim === i}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>{/if}</span>
          </button>
        </li>
      {/each}
    </ul>
    {#if states.length > 1}
      <hr class="glass-divider" />
      <p class="head">State</p>
      <div class="pad">
        <div class="glass-segmented glass-segmented--full" role="group" aria-label="State">
          {#each states as s (s.key)}
            <button type="button" class="glass-segmented__item" aria-pressed={s.key === stateKey} onclick={() => onState(s.key)}>{s.label}</button>
          {/each}
        </div>
      </div>
    {/if}
    {#if allDirs.length > 1}
      <hr class="glass-divider" />
      <p class="head">Direction</p>
      <div class="pad">
        <div class="rose" role="radiogroup" aria-label="Direction">
          {#each COMPASS as d, i (i)}
            {#if d}
              <button type="button" class="dir" class:on={d === dir} role="radio" aria-checked={d === dir} aria-label={dirLabel(d)} disabled={!dirs.includes(d)} style="--r:{ANGLE[d]}deg" onclick={() => onDir(d)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </button>
            {:else}
              <span class="dirname" aria-hidden="true">{dirLabel(dir)}</span>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .vt-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border: 0; background: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; border-radius: 22px; }
  .vt-chip:disabled { opacity: .6; cursor: default; }
  .vt-chip:focus-visible, .dir:focus-visible, .pick :global(.glass-list__item:focus-visible) { outline: 2px solid #fff; outline-offset: -2px; }
  .chev { width: 15px; height: 15px; opacity: .7; stroke-width: 2.2; }
  .backdrop { position: fixed; inset: 0; z-index: 1000; border: 0; padding: 0; background: rgba(8, 10, 16, .25); cursor: default; }
  .pick { position: fixed; z-index: 1010; top: auto; bottom: 100px; left: calc(var(--cx, 50%) - 160px); width: 320px; padding: 8px 0 14px; border-radius: 20px; transform: none;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); --gl-list-item-min-height: 44px; --gl-list-item-padding-y: 9px; max-height: calc(100dvh - 120px); overflow-y: auto; }
  .pick :global(.glass-list__item) { width: 100%; cursor: pointer; text-align: left; }
  .glass-list__content { display: block; flex: 1; min-width: 0; }
  .glass-list__title { display: block; }
  .glass-list__subtitle { display: block; font-size: 12.5px; color: var(--gl-color-text-muted); }
  .glass-list__trailing svg { width: 19px; height: 19px; }
  .glass-divider { margin: 6px 0; }
  .head { margin: 0; padding: 6px 20px 4px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--gl-color-text-muted); }
  .pad { padding: 4px 20px 0; }
  .pick :global(.glass-segmented__item) { padding: 6px 10px; font-size: 13.5px; min-height: 44px; }
  .rose { display: grid; grid-template-columns: repeat(3, 48px); grid-auto-rows: 48px; gap: 8px; justify-content: center; align-items: center; padding: 4px 0 2px; }
  .dir { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; color: var(--gl-color-text); padding: 0;
    background: var(--gl-surface-2); border: 1px solid var(--gl-border-subtle); box-shadow: var(--gl-inset-subtle); }
  .dir svg { rotate: var(--r); width: 19px; height: 19px; stroke-width: 2; }
  .dir.on { background: rgba(255, 255, 255, .92); color: #111319; border-color: transparent; }
  .dir:disabled { opacity: .3; cursor: default; background: transparent; border-style: dashed; box-shadow: none; }
  .dirname { text-align: center; font-size: 13px; font-weight: 600; line-height: 1.2; }

  @media (max-width: 600px) {
    .backdrop { background: rgba(8, 10, 16, .45); }
    .pick { left: 8px; right: 8px; bottom: var(--vt-bot, 12px); width: auto; padding: 18px 0 14px; border-radius: 30px; --gl-list-item-min-height: 50px; }
    .pick::before { content: ''; position: absolute; top: 7px; left: 50%; width: 36px; height: 5px; margin-left: -18px; border-radius: 3px; background: var(--gl-border-strong); }
    .glass-list__subtitle { font-size: 13px; }
    .rose { grid-template-columns: repeat(3, 52px); grid-auto-rows: 52px; gap: 10px; }
    .dir { width: 52px; height: 52px; }
  }
</style>
