<script lang="ts" module>
  import { library } from '../data/library.svelte';

  // Survives the menu closing and reopening: Refresh stays disabled for 60 s after use (the library enforces it too).
  let cooling = $state(false);

  /** Forces the open check, then blocks Refresh for 60 s (the library enforces the same gap). */
  export function runRefresh(): void {
    if (cooling) return;
    cooling = true;
    setTimeout(() => (cooling = false), 60_000);
    void library.openCheck({ force: true });
  }
</script>

<script lang="ts">
  // The dock's "…" menu: exactly two items, as a glass popover (desktop) or bottom sheet (phone).
  let { open, onClose, onActivity }: { open: boolean; onClose: () => void; onActivity: () => void } = $props();
  let first = $state<HTMLButtonElement>();

  function refresh() {
    if (cooling) return; // announced as unavailable; the menu stays open
    runRefresh();
    onClose();
  }

  // Focus moves into the menu and returns to the dock button on close.
  $effect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    first?.focus();
    return () => back?.focus?.();
  });
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onClose()} />

{#if open}
  <button type="button" class="backdrop" tabindex="-1" aria-label="Close menu" onclick={onClose}></button>
  <div class="glass-popover is-open vt-scrim menu" role="menu" aria-label="More">
    <button type="button" role="menuitem" class="glass-list__item glass-list__item--interactive" aria-disabled={cooling} bind:this={first} onclick={refresh}>
      <span class="glass-list__content">
        <span class="glass-list__title">Refresh</span>
        <span class="glass-list__subtitle">{cooling ? 'Checked a moment ago' : 'Check for new art'}</span>
      </span>
      <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg></span>
    </button>
    <hr class="glass-divider" />
    <button type="button" role="menuitem" class="glass-list__item glass-list__item--interactive" onclick={() => { onClose(); onActivity(); }}>
      <span class="glass-list__content"><span class="glass-list__title">Activity</span><span class="glass-list__subtitle">What this app asks PixelLab</span></span>
      <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4" /></svg></span>
    </button>
  </div>
{/if}

<style>
  .backdrop { position: fixed; inset: 0; z-index: 1000; border: 0; padding: 0; background: rgba(8, 10, 16, .25); cursor: default; }
  .menu { position: fixed; z-index: 1010; top: auto; bottom: 100px; left: calc(50% - 30px); width: 270px; padding: 6px 0; border-radius: 20px; transform: none;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); --gl-list-item-min-height: 44px; --gl-list-item-padding-y: 9px; }
  .menu :global(.glass-list__item) { cursor: pointer; }
  .menu :global(.glass-list__item[aria-disabled='true']) { opacity: .5; cursor: default; }
  .glass-list__content { display: block; flex: 1; min-width: 0; }
  .glass-list__title { display: block; }
  .glass-list__subtitle { display: block; font-size: 12.5px; color: var(--gl-color-text-muted); }
  .glass-list__trailing svg { width: 19px; height: 19px; }
  .glass-divider { margin: 6px 0; }
  .menu :global(.glass-list__item:focus-visible) { outline: 2px solid #fff; outline-offset: -2px; }

  @media (max-width: 600px) {
    .backdrop { background: rgba(8, 10, 16, .45); }
    .menu { left: 8px; right: 8px; bottom: var(--vt-bot, 12px); width: auto; padding: 18px 0 8px; border-radius: 30px; --gl-list-item-min-height: 50px; }
    .menu::before { content: ''; position: absolute; top: 7px; left: 50%; width: 36px; height: 5px; margin-left: -18px; border-radius: 3px; background: var(--gl-border-strong); }
    .glass-list__subtitle { font-size: 13px; }
  }
</style>
