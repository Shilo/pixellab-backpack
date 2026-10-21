<script lang="ts">
  import { NEW_TAB } from '../app';
  import { library } from '../data/library.svelte';
  import { org } from '../data/org.svelte';
  import { go } from '../router.svelte';
  import CategoryTile from './CategoryTile.svelte';
  import FolderDialog from './FolderDialog.svelte';

  // Home: one tile per category that has assets (empty ones are hidden), skeleton tiles while the first check runs,
  // and an "empty library" card once a finished check found nothing.
  const waiting = $derived(library.status !== 'ok');
  const none = $derived(library.categories.every((c) => c.count === 0));
  // "Nothing here yet" only when every family answered; a failed family has no saved state and is not "empty".
  const allLoaded = $derived(library.categories.every((c) => c.families.every((id) => library.families[id])));
  // A skeleton stands in for a category with no data yet; with nothing at all, every category waits.
  const pending = (c: (typeof library.categories)[number]) => waiting && c.count === 0 && (none || c.families.some((id) => !library.families[id]));
  // Favorites from this device only (0 requests): live cards, else snapshots; gone ones are left out.
  const favs = $derived(library.pick(org.favorites).items);
  let naming = $state(false); // the New folder tile's name dialog
</script>

{#if none && allLoaded && !waiting}
  <main class="vt-state">
    <div class="glass-empty vt-scrim">
      <span class="glass-empty__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg></span>
      <h2 class="glass-empty__title">Nothing here yet.</h2>
      <p class="glass-empty__text">Create something in PixelLab and it'll show up here.</p>
      <div class="glass-empty__action">
        <a class="glass-btn glass-btn--primary glass-btn--auto" href="https://www.pixellab.ai/" target="_blank" rel="noopener noreferrer">Open PixelLab&nbsp;↗<span class="vt-sr">{NEW_TAB}</span></a>
        <button type="button" class="glass-btn glass-btn--tertiary glass-btn--auto" onclick={() => library.openCheck({ force: true })}>Sync again</button>
      </div>
    </div>
  </main>
{:else}
  <main class="library" aria-busy={library.status === 'checking'}>
    {#each library.categories as c (c.id)}
      {#if c.count > 0}
        <CategoryTile href="#/c/{c.id}" label={c.label} count={c.count} cards={c.mosaic} />
      {:else if pending(c)}
        <div class="tile" aria-hidden="true">
          <div class="mosaic"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div>
          <span class="tlabel"><i class="skl"></i></span>
        </div>
      {/if}
    {/each}
    {#if org.ready}
      <h2 class="sec">Favorites and folders</h2>
      <CategoryTile href="#/fav" label="Favorites" count={favs.length} cards={favs.slice(0, 4)} glow />
      <!-- Folders A–Z (org keeps them sorted); counts and mosaics leave gone items out (R3). -->
      {#each org.folders as f (f.id)}
        {@const p = library.pick(f.items).items}
        <CategoryTile href="#/f/{f.id}" label={f.name} count={p.length} cards={p.slice(0, 4)} glow />
      {/each}
      <!-- mockup g4-new-folder -->
      <button type="button" class="tile new" onclick={() => (naming = true)}>
        <div class="mosaic newm" aria-hidden="true"><span class="newi"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span></div>
        <span class="tlabel"><b>New folder</b></span>
      </button>
    {/if}
  </main>
{/if}
<FolderDialog mode={naming ? { kind: 'new' } : null} onDone={(id) => id && go(`#/f/${id}`)} onClose={() => (naming = false)} />

<style>
  .mosaic > i.sk {
    background: linear-gradient(110deg, rgba(255, 255, 255, 0.035) 30%, rgba(255, 255, 255, 0.085) 50%, rgba(255, 255, 255, 0.035) 70%);
  }
  .new { width: 100%; padding: 0; border: 0; background: none; font: inherit; text-align: start; cursor: pointer; }
  .mosaic.newm { grid-template: 1fr / 1fr; place-items: center; background: rgba(255, 255, 255, 0.03); box-shadow: none; outline: 1.5px dashed rgba(255, 255, 255, 0.26); outline-offset: -1.5px; }
  .newi { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; background: var(--gl-surface-2); box-shadow: var(--gl-inset-medium); }
  .newi svg { width: 28px; height: 28px; stroke-width: 2; }
  .new .tlabel b { color: var(--vt-text-2); }
  @media (max-width: 600px) {
    .newi { width: 52px; height: 52px; }
  }
  .skl { display: block; width: 42%; height: 14px; margin: 4px 0; border-radius: 7px; background: rgba(255, 255, 255, 0.08); }
</style>
