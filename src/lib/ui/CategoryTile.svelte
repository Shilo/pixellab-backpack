<script lang="ts">
  import PixelArt from '../render/PixelArt.svelte';
  import { library } from '../data/library.svelte';
  import type { Card, FamilyId } from '../types';

  // One home tile: a 2x2 mosaic of the category's first pictures, its name and its count.
  // The tile is a plain link, so the hash router and keyboard focus just work.
  let { category, count, cards }: { category: { id: string; label: string }; count: number; cards: { card: Card; familyId: FamilyId }[] } = $props();
</script>

<a class="tile" href="#/c/{category.id}" aria-label="{category.label}, {count}">
  <div class="mosaic" aria-hidden="true">
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
  </div>
  <span class="tlabel"><b>{category.label}</b><span>{count.toLocaleString()}</span></span>
</a>

<style>
  /* Cells are the global .mosaic > i; art fills each one. */
  .mosaic > i {
    position: relative;
    overflow: hidden;
    display: block;
  }
</style>
