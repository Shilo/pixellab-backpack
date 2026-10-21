<script lang="ts" module>
  /** Costly art waits this long on screen before it is asked for. */
  export const COSTLY_WAIT_MS = 300;
  // ponytail: cards whose costly art was already asked this session skip the wait on a second visit (the answer is cached, no request).
  const asked = new Set<string>();
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { library } from '../data/library.svelte';
  import { isIn, org } from '../data/org.svelte';
  import PixelArt from '../render/PixelArt.svelte';
  import { highlight, snippetFrom, stateName as stateOf } from '../search';
  import type { Card, FamilyId } from '../types';

  let { card, familyId, costly, href, terms = [] }: { card: Card; familyId: FamilyId; costly: boolean; href: string; terms?: string[] } = $props();

  // "Name · state" (R6): the state name of the card this cell opens, only when it has sibling states on this device.
  const name = $derived(card.name || 'Untitled');
  const states = $derived(library.states(card, familyId));
  const stateName = $derived(stateOf(card, states));
  // R13: a small filled heart when any state of the group is a favorite.
  const fav = $derived(isIn(org.favorites, library.groupKeys(card, familyId)));
  const full = $derived(stateName ? `${name} · ${stateName}` : name);
  // Search results: a long name starts near its first match so the bold words show (grid cells pass no terms: whole name).
  const from = $derived(snippetFrom(name, terms));

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

{#snippet runs(text: string)}{#each highlight(text, terms) as r, i (i)}{#if r.mark}<mark>{r.text}</mark>{:else}{r.text}{/if}{/each}{/snippet}

<!-- The link's name is the visible text; the picture is decoration here. -->
<!-- A favorite's name says so (an aria-label: a hidden span inside would split the name with a space). -->
<a class="cell" bind:this={box} {href} title={full} aria-label={fav ? `${full}, favorite` : undefined} data-key={card.key}>
  <div class="sq">
    <div class="art" aria-hidden="true">{#if blob}<PixelArt {blob} alt={name} fill />{/if}</div>
    {#if fav}<span class="fav" aria-hidden="true"><svg viewBox="0 0 24 24" class="solid"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" /></svg></span>{/if}
  </div>
  <span class="nm">{#if from}<span class="vt-sr">{name.slice(0, from)}</span><span aria-hidden="true">…</span>{/if}{@render runs(name.slice(from))}{#if stateName}{' '}<small>· {@render runs(stateName)}</small>{/if}</span>
</a>

<style>
  /* R9: a long press opens the card menu, never the system link preview or a text selection. */
  .cell {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  /* Favorite marker at rest (mockup frames-g2.css .g2-fav). */
  .fav {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: rgba(20, 22, 30, 0.78);
    color: #fff;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  }
  .fav svg {
    width: 15px;
    height: 15px;
  }
  .art {
    position: absolute;
    inset: 9%;
  }
  small {
    color: var(--vt-text-3);
    font-size: 13px;
  }
  @media (max-width: 600px) {
    .fav {
      top: 7px;
      right: 7px;
      width: 24px;
      height: 24px;
    }
    .fav svg {
      width: 13px;
      height: 13px;
    }
    small {
      font-size: 12px;
    }
  }
</style>
