<script lang="ts">
  import PixelArt from '../render/PixelArt.svelte';
  import { library } from '../data/library.svelte';
  import type { Item } from '../types';

  // One home tile: a 2x2 mosaic of the first pictures, its name and its count. `glow`: yours (Favorites, a folder) as
  // GlassKit's glow card; empty, it shows the heart (Favorites) or the folder glyph. The tile is a plain link, so the hash router
  // and keyboard focus just work.
  let { href, label, count, cards, glow = false }: { href: string; label: string; count: number; cards: Item[]; glow?: boolean } = $props();
  const HEART = 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z';
  const FOLDER = 'M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z';
</script>

<a class="tile" class:folder={glow} {href} aria-label="{label}, {count}">
  <div class="mosaic" class:glass-card={glow} class:glass-card--glow={glow} class:none={glow && !cards.length} aria-hidden="true">
    {#if glow && !cards.length}
      <svg viewBox="0 0 24 24"><path d={href === '#/fav' ? HEART : FOLDER} /></svg>
    {:else}
      {#each [0, 1, 2, 3] as i (i)}
        {@const c = cards[i]}
        <i>
          {#if c}
            {#await library.art(c.card, c.familyId) then blob}
              <PixelArt {blob} alt={c.card.name} trim fill />
            {/await}
          {/if}
        </i>
      {/each}
    {/if}
  </div>
  <span class="tlabel"><b>{label}</b><span>{count.toLocaleString()}</span></span>
</a>

<style>
  /* Cells are the global .mosaic > i; art fills each one. */
  .mosaic > i {
    position: relative;
    overflow: hidden;
    display: block;
  }
  .mosaic.none {
    grid-template: 1fr / 1fr;
    place-items: center;
    color: var(--vt-text-2);
  }
  .none svg {
    width: 44px;
    height: 44px;
    stroke-width: 1.5;
  }
</style>
