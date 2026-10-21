<script lang="ts" module>
  import type { Scope } from '../categories';
  import type { FamilyId } from '../types';

  // Scroll position per scope, kept while the screen is closed (going back to the same grid lands where you were).
  const savedScroll = new Map<Scope, number>();

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
  import { NEW_TAB } from '../app';
  import { familiesOf } from '../categories';
  import { library } from '../data/library.svelte';
  import { OTHER_CONTENT, OTHER_TEXT, OTHER_TITLE } from '../info';
  import { pathOf, type Route } from '../router.svelte';
  import { sameAsset } from '../search';
  import AssetCell from './AssetCell.svelte';

  let { scope, reveal = null }: { scope: Scope; reveal?: string | null } = $props();
  const screen = $derived<Route>(scope === 'all' ? { name: 'all' } : { name: 'category', id: scope });

  let el: HTMLElement | undefined = $state();
  let m = $state<Metrics | null>(null);
  let scrollTop = $state(0);

  // Shown cards of the scope, family after family (unfinished, failed and duplicate assets are hidden).
  const items = $derived(library.items(scope));
  const segs = $derived.by(() => {
    let end = 0;
    return familiesOf(scope).map((id) => ({ id, end: (end += items.filter((it) => it.familyId === id).length) }));
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
    savedScroll.set(scope, scrollTop);
  }

  // Back to a grid: return to where it was left, once its height is known.
  let restored: Scope | null = null;
  $effect(() => {
    if (!el || !m || !items.length || restored === scope) return;
    restored = scope;
    const y = savedScroll.get(scope) ?? 0;
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
    const hit = key ? library.find(key) : null;
    const i = hit ? items.findIndex((it) => sameAsset(it, hit)) : -1;
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
    // ponytail: at the bottom, every family scrolled past is due (End key, scrollbar drag, restore); a fling through the middle still asks nothing.
    const due = range[1] >= rows ? segs.map((s) => s.id) : dueFamilies(segs, range[0] * m.cols, range[1] * m.cols, m.cols);
    for (const id of due) {
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
      <AssetCell card={it.card} familyId={it.familyId} href={pathOf({ ...screen, key: it.card.key })} costly={library.family(it.familyId).artCostsApi} />
    {/each}
    {#if rows > range[1]}<div class="pad" style:height="{spacer(rows - range[1], m)}px"></div>{/if}
    {#if scope === 'all' && library.coverage('all') === 'full'}
      <div class="end">
        <p>That's everything</p>
        <div class="glass-card note">
          <b>{OTHER_TITLE}</b>
          <p>{OTHER_TEXT}</p>
          <div class="links">
            <span>Find them in PixelLab:</span>
            {#each OTHER_CONTENT as [label, url] (label)}
              <a class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" href={url} target="_blank" rel="noopener noreferrer"
                >{label}<span aria-hidden="true">&nbsp;↗</span><span class="vt-sr">{NEW_TAB}</span></a
              >
            {/each}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</main>

<style>
  .pad {
    grid-column: 1 / -1;
  }
  /* All assets end block (mockup frames-g2.css .g2-end, .g2-note, .g2-links). */
  .end {
    grid-column: 1 / -1;
    display: grid;
    justify-items: center;
    gap: 22px;
    padding-top: 18px;
  }
  .end > p {
    font-size: 14px;
    color: var(--vt-text-2);
  }
  .note {
    width: min(640px, 100%);
    box-sizing: border-box;
    padding: 24px 26px 22px;
    display: grid;
    gap: 8px;
    text-align: left;
  }
  .note b {
    font-size: 16px;
    font-weight: 600;
  }
  .note p {
    font-size: 14px;
    line-height: 1.5;
    color: var(--vt-text-2);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
  .links > span {
    flex-basis: 100%;
    font-size: 13px;
    color: var(--vt-text-2);
  }
  .links .glass-btn {
    gap: 0; /* one space before the arrow, as in the mockup */
    padding: 0 14px;
    text-decoration: none;
    color: var(--gl-color-text);
  }
  @media (max-width: 600px) {
    .end {
      gap: 16px;
    }
    .note {
      width: 100%;
      padding: 20px 18px 18px;
    }
    .links .glass-btn {
      height: 44px;
    }
  }
</style>
