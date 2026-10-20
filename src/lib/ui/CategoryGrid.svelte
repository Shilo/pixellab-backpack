<script lang="ts" module>
  import type { CategoryId } from '../categories';
  import type { FamilyId } from '../types';

  // Scroll position per category, kept while the screen is closed (going back to the same grid lands where you were).
  const savedScroll = new Map<CategoryId, number>();

  export interface Metrics {
    cols: number;
    /** Row height + gap. */
    stride: number;
    gap: number;
    /** Scroller padding above the first row. */
    top: number;
    viewH: number;
  }

  /** Rows [r0, r1) to keep in the page: the ones on screen plus one spare row each side. */
  export function visibleRows(scrollTop: number, m: Metrics, rows: number): [number, number] {
    const r0 = Math.max(0, Math.floor((scrollTop - m.top) / m.stride) - 1);
    const r1 = Math.min(rows, Math.ceil((scrollTop + m.viewH - m.top) / m.stride) + 1);
    return [Math.min(r0, rows), Math.max(r1, r0)];
  }

  /** Height of the empty space standing in for `n` rows that are not in the page. */
  export const spacer = (n: number, m: Metrics): number => (n > 0 ? n * m.stride - m.gap : 0);

  /** Families whose next page is due: the page reaches within two rows of the end of that family's cards. */
  export function dueFamilies(segs: { id: FamilyId; end: number }[], lastShown: number, cols: number): FamilyId[] {
    return segs.filter((s) => lastShown >= s.end - 2 * cols).map((s) => s.id);
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { CATEGORIES } from '../categories';
  import { library } from '../data/library.svelte';
  import AssetCell from './AssetCell.svelte';

  let { categoryId }: { categoryId: CategoryId } = $props();

  let el: HTMLElement | undefined = $state();
  let m = $state<Metrics | null>(null);
  let scrollTop = $state(0);

  // Done cards of the category, family after family (unfinished or failed assets are hidden).
  const segs = $derived.by(() => {
    let end = 0;
    return CATEGORIES.find((c) => c.id === categoryId)!.families.map((id) => {
      const cards = (library.families[id]?.cards ?? []).filter((c) => c.done);
      end += cards.length;
      return { id, cards, end };
    });
  });
  const items = $derived(segs.flatMap((s) => s.cards.map((card) => ({ card, familyId: s.id }))));

  // Fixed-size cells: the rows in the page follow from the scroll position alone.
  const rows = $derived(m ? Math.ceil(items.length / m.cols) : 0);
  const range = $derived(m ? visibleRows(scrollTop, m, rows) : ([0, 0] as [number, number]));
  const shown = $derived(m ? items.slice(range[0] * m.cols, range[1] * m.cols) : []);

  // Row height, columns and padding are read from the real layout (CSS owns them), again on every resize.
  function measure() {
    const cell = el?.querySelector('.cell');
    if (!el || !cell) return;
    const cs = getComputedStyle(el);
    const gap = parseFloat(cs.rowGap) || 0;
    m = {
      cols: cs.gridTemplateColumns.split(' ').length,
      stride: cell.getBoundingClientRect().height + gap,
      gap,
      top: parseFloat(cs.paddingTop) || 0,
      viewH: el.clientHeight,
    };
  }
  $effect(() => {
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  });

  function onscroll() {
    scrollTop = el!.scrollTop;
    savedScroll.set(categoryId, scrollTop);
  }

  // Back to a grid: return to where it was left, once its height is known.
  let restored: CategoryId | null = null;
  $effect(() => {
    if (!el || !m || !items.length || restored === categoryId) return;
    restored = categoryId;
    const y = savedScroll.get(categoryId) ?? 0;
    tick().then(() => {
      if (el) el.scrollTop = y;
    });
  });

  // Next pages only when the page reaches near the end of a family's cards. A family is asked again only when its
  // card count or total changed, so an empty or failed answer never turns into a request loop.
  const tried = new Map<FamilyId, string>();
  $effect(() => {
    if (!m) return;
    for (const id of dueFamilies(segs, range[1] * m.cols, m.cols)) {
      const s = library.families[id];
      if (!s || library.loading[id]) continue;
      const sig = `${s.cards.length}/${s.total}`;
      if (s.cards.length >= s.total || tried.get(id) === sig) continue;
      tried.set(id, sig);
      void library.loadMore(id);
    }
  });
</script>

<main class="grid" bind:this={el} {onscroll}>
  {#if !m}
    <!-- Measuring stick: one empty cell tells the real row height before any picture is asked for. -->
    <div class="cell" aria-hidden="true"><div class="sq"></div><span class="nm">&nbsp;</span></div>
  {:else}
    {#if range[0] > 0}<div class="pad" style:height="{spacer(range[0], m)}px"></div>{/if}
    {#each shown as it (it.card.key)}
      <AssetCell card={it.card} familyId={it.familyId} costly={library.family(it.familyId).artCostsApi} />
    {/each}
    {#if rows > range[1]}<div class="pad" style:height="{spacer(rows - range[1], m)}px"></div>{/if}
  {/if}
</main>

<style>
  .pad {
    grid-column: 1 / -1;
  }
</style>
