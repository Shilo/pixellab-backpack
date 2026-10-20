<script lang="ts">
  import { library } from '../data/library.svelte';
  import CategoryTile from './CategoryTile.svelte';

  // Home: one tile per category that has assets (empty ones are hidden), skeleton tiles while the first check runs,
  // and an "empty library" card once a finished check found nothing.
  const waiting = $derived(library.status !== 'ok');
  const none = $derived(library.categories.every((c) => c.count === 0));
  // A skeleton stands in for a category with no data yet; with nothing at all, every category waits.
  const pending = (c: (typeof library.categories)[number]) => waiting && c.count === 0 && (none || c.families.some((id) => !library.families[id]));
</script>

{#if none && !waiting}
  <main class="home-empty">
    <div class="glass-empty vt-scrim">
      <span class="glass-empty__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg></span>
      <h2 class="glass-empty__title">Nothing here yet.</h2>
      <p class="glass-empty__text">Create something in PixelLab and it'll show up here.</p>
      <div class="glass-empty__action">
        <a class="glass-btn glass-btn--primary glass-btn--auto" href="https://www.pixellab.ai/" target="_blank" rel="noopener noreferrer">Open PixelLab&nbsp;↗<span class="vt-sr"> (opens PixelLab in a new tab)</span></a>
        <button type="button" class="glass-btn glass-btn--tertiary glass-btn--auto" onclick={() => library.openCheck({ force: true })}>Sync again</button>
      </div>
    </div>
  </main>
{:else}
  <main class="library" aria-busy={library.status === 'checking'}>
    {#each library.categories as c (c.id)}
      {#if c.count > 0}
        <CategoryTile category={c} count={c.count} cards={c.mosaic} />
      {:else if pending(c)}
        <div class="tile" aria-hidden="true">
          <div class="mosaic"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>
          <span class="tlabel"><i class="skl"></i></span>
        </div>
      {/if}
    {/each}
  </main>
{/if}

<style>
  .home-empty {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px 24px 140px;
  }
  .glass-empty {
    max-width: 460px;
    box-sizing: border-box;
    padding: 40px 40px 34px;
    gap: 10px;
    border-radius: 28px;
    border: 1px solid var(--gl-border-subtle);
    background: linear-gradient(var(--gl-surface-2), var(--gl-surface-2)), var(--vt-scrim);
    backdrop-filter: blur(var(--gl-blur));
    -webkit-backdrop-filter: blur(var(--gl-blur));
    box-shadow: var(--gl-shadow-modal);
  }
  .glass-empty .glass-empty__icon { width: 60px; height: 60px; margin-bottom: 6px; background: var(--gl-surface-3); border: 1px solid var(--gl-border-subtle); color: var(--gl-color-text); }
  .glass-empty .glass-empty__icon svg { width: 26px; height: 26px; }
  .glass-empty .glass-empty__title { font-size: 22px; letter-spacing: -0.01em; }
  .glass-empty .glass-empty__text { font-size: 15px; max-width: 34ch; color: var(--vt-text-2); }
  .glass-empty .glass-empty__action { margin-top: 18px; gap: 10px; }
  .glass-empty .glass-btn { height: 44px; padding: 0 20px; gap: 8px; text-decoration: none; }

  .mosaic > i.sk {
    background: linear-gradient(110deg, rgba(255, 255, 255, 0.035) 30%, rgba(255, 255, 255, 0.085) 50%, rgba(255, 255, 255, 0.035) 70%);
  }
  .skl { display: block; width: 42%; height: 14px; margin: 4px 0; border-radius: 7px; background: rgba(255, 255, 255, 0.08); }

  @media (max-width: 600px) {
    .home-empty { padding: 16px 16px 120px; }
    .glass-empty { padding: 32px 22px 24px; }
    .glass-empty .glass-empty__action { width: 100%; flex-direction: column-reverse; }
    .glass-empty .glass-btn { height: auto; min-height: 48px; width: 100%; padding: 12px 18px; line-height: 1.3; }
  }
</style>
