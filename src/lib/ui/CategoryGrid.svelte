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

  /** Families whose next page is due: the end of that family's cards is inside the page or within two rows below it. */
  export function dueFamilies(segs: { id: FamilyId; end: number }[], firstShown: number, lastShown: number, cols: number): FamilyId[] {
    return segs.filter((s) => firstShown <= s.end && lastShown >= s.end - 2 * cols).map((s) => s.id);
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import { CATEGORIES } from '../categories';
  import { library } from '../data/library.svelte';
  import AssetCell from './AssetCell.svelte';

  let { categoryId, reveal = null }: { categoryId: CategoryId; reveal?: string | null } = $props();

  let el: HTMLElement | undefined = $state();
  let m = $state<Metrics | null>(null);
  let scrollTop = $state(0);

  // Shown cards of the category, family after family (unfinished, failed and duplicate assets are hidden).
  const items = $derived(library.items(categoryId));
  const segs = $derived.by(() => {
    let end = 0;
    return CATEGORIES.find((c) => c.id === categoryId)!.families.map((id) => ({ id, end: (end += items.filter((it) => it.familyId === id).length) }));
  });

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

  // Back from the viewer: the card last shown comes into view (only if it is not already) and its link takes focus.
  let revealed: string | null = null;
  $effect(() => {
    const key = reveal;
    if (key === revealed || !el || !m) return;
    revealed = key;
    // A grouped character's other state is shown by its group's one card.
    const hit = key ? library.find(categoryId, key) : null;
    const g = hit?.card.meta.group_id;
    const i = hit ? items.findIndex((it) => it.card.key === key || (typeof g === 'string' && !!g && it.familyId === hit.familyId && it.card.meta.group_id === g)) : -1;
    if (i < 0) return;
    const top = m.top + Math.floor(i / m.cols) * m.stride;
    if (top < el.scrollTop || top + m.stride > el.scrollTop + m.viewH) el.scrollTop = scrollTop = Math.max(0, top - (m.viewH - m.stride) / 2);
    const shownKey = items[i].card.key;
    tick().then(() => el?.querySelector<HTMLElement>(`a[data-key="${shownKey}"]`)?.focus({ preventScroll: true }));
  });

  // Next pages only when the page reaches near the end of a family's cards. A family is asked again only after its
  // cards changed since the last ask (a failed ask leaves them alone), and gives up after two asks that added nothing
  // (e.g. a shifted list that reloads), so an empty or failed answer never turns into a request loop.
  const asked = new Map<FamilyId, { cards: unknown; len: number; stalls: number }>();
  $effect(() => {
    if (!m) return;
    for (const id of dueFamilies(segs, range[0] * m.cols, range[1] * m.cols, m.cols)) {
      const s = library.families[id];
      if (!s || library.loading[id] || s.cards.length >= s.total) continue;
      const prev = asked.get(id);
      if (prev?.cards === s.cards) continue;
      const stalls = prev && s.cards.length <= prev.len ? prev.stalls + 1 : 0;
      asked.set(id, { cards: s.cards, len: s.cards.length, stalls });
      if (stalls < 2) void library.loadMore(id);
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
      <AssetCell card={it.card} familyId={it.familyId} {categoryId} costly={library.family(it.familyId).artCostsApi} />
    {/each}
    {#if rows > range[1]}<div class="pad" style:height="{spacer(rows - range[1], m)}px"></div>{/if}
  {/if}
</main>

<style>
  .pad {
    grid-column: 1 / -1;
  }
</style>
