<script lang="ts">
  import { library } from '../data/library.svelte';
  import CategoryTile from './CategoryTile.svelte';

  // Home: one tile per category that has assets (empty ones are hidden), skeleton tiles while the first check runs,
  // and an "empty library" card once a finished check found nothing.
  const waiting = $derived(library.status !== 'ok');
  const none = $derived(library.categories.every((c) => c.count === 0));
  // "Nothing here yet" only when every family answered; a failed family has no saved state and is not "empty".
  const allLoaded = $derived(library.categories.every((c) => c.families.every((id) => library.families[id])));
  // A skeleton stands in for a category with no data yet; with nothing at all, every category waits.
  const pending = (c: (typeof library.categories)[number]) => waiting && c.count === 0 && (none || c.families.some((id) => !library.families[id]));
</script>

{#if none && allLoaded && !waiting}
  <main class="vt-state">
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
  .mosaic > i.sk {
    background: linear-gradient(110deg, rgba(255, 255, 255, 0.035) 30%, rgba(255, 255, 255, 0.085) 50%, rgba(255, 255, 255, 0.035) 70%);
  }
  .skl { display: block; width: 42%; height: 14px; margin: 4px 0; border-radius: 7px; background: rgba(255, 255, 255, 0.08); }
</style>
