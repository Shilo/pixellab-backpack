<script lang="ts" module>
  /** Costly art waits this long on screen before it is asked for. */
  export const COSTLY_WAIT_MS = 300;
  // ponytail: cards whose costly art was already asked this session skip the wait on a second visit (the answer is cached, no request).
  const asked = new Set<string>();
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import type { CategoryId } from '../categories';
  import { library } from '../data/library.svelte';
  import PixelArt from '../render/PixelArt.svelte';
  import { pathOf } from '../router.svelte';
  import type { Card, FamilyId } from '../types';

  let { card, familyId, costly, categoryId }: { card: Card; familyId: FamilyId; costly: boolean; categoryId: CategoryId } = $props();

  let box: HTMLAnchorElement | undefined = $state();
  let onScreen = $state(false);
  let blob = $state<Blob | null>(null);

  // Art is asked for only while the cell is really on screen (the grid keeps a spare row of cells in the page).
  $effect(() => {
    if (!box) return;
    const io = new IntersectionObserver((entries) => (onScreen = entries[entries.length - 1].isIntersecting));
    io.observe(box);
    return () => io.disconnect();
  });

  $effect(() => {
    if (!onScreen || blob) return;
    const key = card.key;
    const load = () =>
      untrack(() => library.art(card, familyId)).then((b) => {
        if (card.key === key) blob = b; // a failed picture stays a placeholder; scrolling back in tries again
      });
    if (!costly || asked.has(key)) {
      load();
      return;
    }
    const t = setTimeout(() => {
      asked.add(key);
      load();
    }, COSTLY_WAIT_MS);
    return () => clearTimeout(t); // left the screen within 0.3 s: no request
  });
</script>

<!-- The link's name is the visible name; the picture is decoration here. -->
<a class="cell" bind:this={box} href={pathOf({ name: 'category', id: categoryId, key: card.key })} title={card.name} data-key={card.key}>
  <div class="sq">
    <div class="art" aria-hidden="true">{#if blob}<PixelArt {blob} alt={card.name || 'Untitled'} fill />{/if}</div>
  </div>
  <span class="nm">{card.name || 'Untitled'}</span>
</a>

<style>
  .art {
    position: absolute;
    inset: 9%;
  }
</style>
