<script lang="ts" module>
  import { remember } from '../search';

  // Recent searches (R2): this tab's memory only, never device storage.
  let recent = $state<string[]>([]);
  const keep = (q: string) => (recent = remember(recent, q));

  /** Sign-out and Forget key drop the recent searches. */
  export function clearRecent(): void {
    recent = [];
  }
</script>

<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { familiesOf, scopeLabel, type Scope } from '../categories';
  import { library } from '../data/library.svelte';
  import { org } from '../data/org.svelte';
  import PixelArt from '../render/PixelArt.svelte';
  import { pathOf, scopeOf, type Route } from '../router.svelte';
  import { highlight, matches, MAX_RESULTS, newestFirst, sameAsset, search, terms } from '../search';
  import type { Item } from '../types';
  import AssetCell from './AssetCell.svelte';

  // The dock as a search bar plus its panel over a dimmed screen (mockups 02-search-focused, g2-search-results, g2-search-no-results).
  // Searches only what is saved (no request of its own); the text never leaves this component's memory.
  let {
    screen,
    note = null,
    reveal = null,
    onClose,
    onGo,
    results = $bindable([]),
  }: { screen: Route; note?: string | null; reveal?: string | null; onClose: () => void; onGo: (path: string) => void; results?: Item[] } = $props();

  let q = $state('');
  let scope = $state<Scope>(scopeOf(untrack(() => screen))); // R7: Search all types widens it
  let field = $state<HTMLInputElement>();
  let panel = $state<HTMLDivElement>();

  const ts = $derived(terms(q));
  const idle = $derived(!ts.length);
  const all = $derived(scope === 'all');
  const label = $derived(scopeLabel(scope));
  const coverage = $derived(library.coverage(scope));

  type GoRow = { id: string; href: string; label: string; sub: string; it: Item | null; folder: boolean };
  // Go to (R6): types, then Favorites (when it has items), then every folder A–Z; typing matches type, Favorites and folder names.
  // A folder's items are newest first, so its first is the newest.
  const gotos = $derived.by(() => {
    if (!all) return [];
    const rows: GoRow[] = library.categories
      .filter((c) => c.count > 0)
      .map((c) => ({ id: c.id, href: `#/c/${c.id}`, label: c.label, sub: `Type · ${c.count.toLocaleString()}`, it: c.mosaic[0] ?? null, folder: false }));
    const favs = library.pick(org.favorites).items;
    if (favs.length) rows.push({ id: 'fav', href: '#/fav', label: 'Favorites', sub: `${favs.length.toLocaleString()} asset${favs.length === 1 ? '' : 's'}`, it: favs[0], folder: false });
    for (const f of org.folders) {
      const p = library.pick(f.items).items;
      rows.push({ id: `f/${f.id}`, href: `#/f/${f.id}`, label: f.name, sub: `Folder · ${p.length.toLocaleString()}`, it: p[0] ?? null, folder: true });
    }
    return rows.filter((r) => idle || matches(r.label, ts));
  });
  const added = $derived(all && idle ? newestFirst(library.items('all'), 6) : []);
  const showAll = $derived(all && idle && screen.name !== 'all');
  // ponytail: no debounce (R5); every keystroke searches every saved card. Debounce if typing lags on very large libraries.
  const found = $derived(idle ? [] : search(library.items(scope), q, (it) => library.states(it.card, it.familyId)));
  // ponytail: at most MAX_RESULTS cells (R8), so one letter never mounts thousands; add a results page if people need more.
  const shown = $derived(found.slice(0, MAX_RESULTS));
  $effect(() => {
    results = shown;
  });

  // As the viewer's wait: a 429 pause ('slowed') is still the check running (its retries are queued).
  const checking = $derived(['idle', 'checking', 'slowed'].includes(library.status) && coverage === 'missing');
  const idleSprite = $derived(library.categories.find((c) => c.mosaic.length)?.mosaic[0] ?? null);
  // R15: a status note (slowed, paused, stopped, offline) wins; else a failed family in scope. Idle and typed.
  const hint = $derived(note ?? (familiesOf(scope).some((id) => library.errors[id]) ? "Some assets didn't load, so they can't be searched." : null));
  const hasPanel = $derived(!idle || recent.length > 0 || gotos.length > 0 || added.length > 0 || showAll || !!hint);
  const plural = (n: number) => `${n.toLocaleString()} result${n === 1 ? '' : 's'}`;

  const leadName = $derived(screen.name === 'home' ? 'Library' : `Back to ${screen.name === 'fav' ? 'Favorites' : scopeLabel(scopeOf(screen))}`);

  // Focus starts in the field.
  $effect(() => {
    field?.focus();
  });

  // Back from a viewer opened here: focus its result (a grouped state finds its group's cell, as in the grid), else the field.
  let revealed: string | null = null;
  $effect(() => {
    const key = reveal;
    if (key === revealed) return;
    revealed = key; // null while a viewer is open, so reopening the same result focuses it again
    if (!key) return;
    const hit = library.find(key);
    const it = hit && [...shown, ...added].find((it) => sameAsset(it, hit));
    tick().then(() => ((it && panel?.querySelector<HTMLElement>(`a[data-key="${it.card.key}"]`)) || field)?.focus());
  });

  // A polite status 0.5 s after the last change.
  let said = $state('');
  $effect(() => {
    const base = idle ? '' : found.length ? plural(found.length) : checking ? 'Checking for new assets…' : 'No matches';
    const text = base && hint ? `${base}. ${hint}` : base; // the failure or pause shown in the panel is announced too
    const t = setTimeout(() => (said = text), 500);
    return () => clearTimeout(t);
  });

  function setQuery(v: string) {
    q = v;
    field?.focus();
  }

  function onfieldkey(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.isComposing) return; // an IME's Enter picks a candidate
    keep(q);
    panel?.querySelector<HTMLElement>('.res a[data-key]')?.focus();
  }

  // Opening a result remembers the query (R2); Enter on a link is a click too.
  function onpanelclick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest?.('a[data-key]')) keep(q);
  }

  function go(e: MouseEvent, path: string) {
    e.preventDefault();
    onGo(path);
  }
</script>

{#snippet runs(text: string)}{#each highlight(text, ts) as r, i (i)}{#if r.mark}<mark>{r.text}</mark>{:else}{r.text}{/if}{/each}{/snippet}
{#snippet cells(list: Item[])}
  {#each list as it (it.card.key)}
    <AssetCell card={it.card} familyId={it.familyId} costly={library.family(it.familyId).artCostsApi} href={pathOf({ ...screen, key: it.card.key })} terms={ts} />
  {/each}
{/snippet}
{#snippet art(it: Item | null)}
  {#if it}
    {#await library.art(it.card, it.familyId) then blob}<PixelArt {blob} alt="" trim fill />{/await}
  {/if}
{/snippet}

<!-- Esc closes the search from anywhere (App's window keydown), even with focus on the page itself. -->
<div>
  <button type="button" class="dim" tabindex="-1" aria-label="Close search" onclick={onClose}></button>

  <div class="glass-tab-bar-dock sdock">
    <div class="glass-tab-bar glass-tab-bar--floating vt-dock vt-scrim">
      <button type="button" class="glass-tab-bar__item vt-icon" aria-label={leadName} onclick={onClose}>
        <span class="glass-tab-bar__icon">
          {#if screen.name === 'category' || screen.name === 'fav'}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>
          {/if}
        </span>
      </button>
      <!-- No <form> and no name: Enter never submits, and the browser keeps no form history. -->
      <search class="glass-search vt-field">
        <svg class="glass-search__icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
        <input
          class="glass-input"
          type="search"
          placeholder="Search assets and types"
          aria-label="Search"
          autocomplete="off"
          spellcheck="false"
          autocapitalize="off"
          enterkeyhint="search"
          bind:value={q}
          bind:this={field}
          onkeydown={onfieldkey}
        />
        {#if q}
          <button type="button" class="clear" aria-label="Clear search text" onclick={() => setQuery('')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
          </button>
        {/if}
        <kbd aria-hidden="true">esc</kbd>
      </search>
      <button type="button" class="glass-tab-bar__item cancel" onclick={onClose}><span class="glass-tab-bar__label">Cancel</span></button>
    </div>
  </div>

  {#if hasPanel}
    <!-- tabindex -1 on the scroller: a click on blank panel space focuses it, so arrows and Page keys keep scrolling. -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="glass-popover is-open vt-scrim panel" class:typed={!idle} bind:this={panel} onclick={onpanelclick}>
      <div class="scroll" tabindex="-1">
        {#if idle && recent.length}
          <div class="gh">
            <span class="glass-list__section-header">Recent</span>
            <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={() => (clearRecent(), field?.focus())}>Clear</button>
          </div>
          <div class="recent">
            {#each recent as r (r)}
              <button type="button" class="glass-badge glass-badge--interactive" onclick={() => setQuery(r)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg><span>{r}</span>
              </button>
            {/each}
          </div>
        {/if}

        {#if gotos.length}
          <div class="gh"><span class="glass-list__section-header">Go to</span></div>
          <div class="gotos">
            {#each gotos as c (c.id)}
              <div class="glass-list goto">
                <a class="glass-list__item glass-list__item--interactive" href={c.href} onclick={(e) => go(e, c.href)}>
                  <span class="glass-list__leading glass-list__leading--lg" aria-hidden="true">
                    <i>
                      {#if c.it}{@render art(c.it)}{:else if c.folder}<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>{/if}
                    </i>
                  </span>
                  <span class="glass-list__content">
                    <span class="glass-list__title">{@render runs(c.label)}</span>
                    <span class="glass-list__subtitle">{c.sub}</span>
                  </span>
                </a>
              </div>
            {/each}
          </div>
        {/if}

        {#if added.length}
          <div class="gh"><span class="glass-list__section-header">Recently added</span></div>
          <div class="added">{@render cells(added)}</div>
        {/if}

        {#if showAll}
          <hr class="glass-divider" />
          <div class="glass-list glass-list--bare showall">
            <a class="glass-list__item glass-list__item--interactive" href="#/all" onclick={(e) => go(e, '#/all')}>
              <span class="glass-list__content"><span class="glass-list__title">Show all {library.count('all').toLocaleString()} asset{library.count('all') === 1 ? '' : 's'}</span></span>
              <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></span>
            </a>
          </div>
        {/if}

        {#if !idle}
          {#if found.length}
            <div class="gh"><span class="glass-list__section-header">{plural(found.length)}</span></div>
            <div class="res">{@render cells(shown)}</div>
            {#if found.length > shown.length}<p class="hint">Showing the first {MAX_RESULTS}. Type more words to narrow it down.</p>{/if}
          {:else if checking}
            <div class="glass-empty none"><p class="glass-empty__text">Checking for new assets…</p></div>
          {:else}
            <div class="glass-empty none">
              <span class="idle" aria-hidden="true">{@render art(idleSprite)}</span>
              {#if all}
                <h2 class="glass-empty__title">No matches for "{q.trim()}".</h2>
                <p class="glass-empty__text">Try fewer words.</p>
              {:else}
                <h2 class="glass-empty__title">No matches for "{q.trim()}" in {label}.</h2>
                <p class="glass-empty__text">Try fewer words, or search all types.</p>
              {/if}
              <div class="glass-empty__action">
                <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={() => setQuery('')}>Clear search</button>
                {#if !all}
                  <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={() => ((scope = 'all'), field?.focus())}>Search all types</button>
                {/if}
              </div>
            </div>
            <hr class="glass-divider" />
            <p class="hint">Looking for fonts or effects? They aren't in PixelLab's public API yet.</p>
          {/if}
        {/if}
        <!-- A status note or a failed family speaks here, as the saved-only advice cannot come true then (R1, R9, R15). -->
        {#if hint}
          <p class="hint">{hint}</p>
        {:else if !idle && coverage === 'partial'}
          <p class="hint">Only assets saved on this device are searched. Scroll through {label} to load the rest.</p>
        {/if}
      </div>
    </div>
  {/if}

  <span class="vt-sr" role="status">{said}</span>
</div>

<style>
  /* Stacking (R3, plan challenge 6): dim 905 < search dock = panel 910 < Viewer 950. Both are siblings of the dock wrapper,
     never inside it (its transform would make it their containing block). */
  .dim { position: fixed; inset: 0; z-index: 905; border: 0; padding: 0; background: rgba(8, 10, 16, .45); cursor: default; }
  .sdock { z-index: 910; }

  /* The field (mockup .vt-field.focus, .g2-clear) */
  .vt-field { width: 520px; }
  .vt-field .glass-input { padding-inline-end: 44px; font-size: 15px; }
  .vt-field:has(.clear) .glass-input { padding-inline-end: 90px; }
  .vt-field input::-webkit-search-cancel-button { display: none; }
  .vt-field kbd { position: absolute; inset-inline-end: 14px; }
  .clear { position: absolute; inset-inline-end: 50px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; padding: 0; border: 0; border-radius: 50%;
    display: grid; place-items: center; background: var(--gl-surface-3); color: var(--gl-color-text); cursor: pointer; z-index: 2; }
  .clear svg { width: 15px; height: 15px; stroke-width: 2.2; }
  .clear:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .cancel { display: none; }

  /* The panel (mockup .vt-spanel, .g2-panel): centred 100 px above the dock, scrolls inside itself. */
  .glass-popover.panel { position: fixed; z-index: 910; left: 50%; bottom: 100px; top: auto; width: 660px; max-height: calc(100dvh - 140px); overflow: hidden; box-sizing: border-box;
    display: flex; flex-direction: column; padding: 18px 0 6px; border-radius: 28px; outline: none; --vt-scrim: rgba(20, 22, 30, .80);
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); }
  .panel.typed { padding-bottom: 18px; }
  .scroll { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 18px; }
  .gh { display: flex; justify-content: space-between; align-items: center; min-height: 30px; padding-bottom: 6px; --gl-btn-height-sm: 28px; }
  .gh .glass-list__section-header { padding: 0 6px; }
  .gh .glass-btn { padding: 0 12px; }
  .recent { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 16px; }
  .recent .glass-badge { height: 34px; padding: 0 14px 0 11px; font-size: 14px; gap: 7px; }
  .recent svg { flex: none; width: 15px; height: 15px; opacity: .7; }
  .recent .glass-badge { max-width: 100%; box-sizing: border-box; }
  .recent span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } /* a long query stays one chip line */
  .gotos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding-bottom: 16px; }
  .goto { --gl-space-lg: 8px; --gl-list-item-min-height: 56px; --gl-list-item-padding-y: 7px; }
  .goto .glass-list__item { text-decoration: none; color: inherit; gap: 10px; }
  .goto i { position: relative; display: grid; place-items: center; width: 40px; height: 40px; background: rgba(0, 0, 0, .22); color: var(--vt-text-2); }
  .goto i svg { width: 24px; height: 24px; stroke-width: 1.5; }
  .glass-list__content { display: block; flex: 1; min-width: 0; }
  .glass-list__title, .glass-list__subtitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .glass-list__subtitle { font-size: 12.5px; }
  .added { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; padding-bottom: 14px; }
  .added :global(.sq) { border-radius: 16px; }
  .added :global(.nm) { font-size: 12px; padding-top: 6px; }
  .showall { margin: 0 -18px; }
  .showall .glass-list__item { text-decoration: none; color: inherit; }
  .res { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .res :global(.sq) { border-radius: 16px; }
  .res :global(.nm) { font-size: 13px; padding-top: 7px; }
  .glass-list__item--interactive:focus-visible, .glass-badge--interactive:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .showall .glass-list__item:focus-visible { outline-offset: -2px; }

  /* No results (mockup .g2-empty, .g2-none, .g2-idle, .g2-hint) */
  .none { padding: 14px 16px 18px; }
  .idle { position: relative; display: block; width: 96px; height: 96px; margin-bottom: 4px; }
  .none .glass-empty__title { font-size: 20px; letter-spacing: -.01em; overflow-wrap: anywhere; } /* the query can be one long word */
  .none .glass-empty__text { font-size: 15px; color: var(--vt-text-2); }
  .none .glass-empty__action { margin-top: 14px; gap: 10px; }
  .none .glass-btn { padding: 0 18px; color: var(--gl-color-text); }
  .none + .glass-divider { margin: 0 -18px; }
  .hint { padding: 14px 8px 0; text-align: center; font-size: 13px; color: var(--vt-text-2); }

  /* Phone (mockup README "Phone layout"): full-width panel above the dock, 2 Go to columns, 3 recently added, Cancel; targets >= 44 px (R12). */
  @media (max-width: 600px) {
    .vt-field { width: auto; flex: 1; min-width: 0; }
    .vt-field .glass-input { padding-inline-end: 16px; }
    .vt-field:has(.clear) .glass-input { padding-inline-end: 50px; }
    .vt-field kbd { display: none; }
    .clear { inset-inline-end: 2px; width: 44px; height: 44px; background: radial-gradient(circle closest-side, var(--gl-surface-3) 72%, transparent 74%); }
    .cancel { display: flex; }
    .glass-popover.panel { left: 8px; right: 8px; bottom: calc(var(--vt-bot) + 72px); width: auto; transform: none; padding: 16px 0 4px; }
    .scroll { padding: 0 14px; }
    .panel.typed { padding-bottom: 16px; }
    .gh { --gl-btn-height-sm: 44px; }
    .recent .glass-badge { height: 44px; }
    .gotos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .added { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .added :global(.cell:nth-child(n + 4)) { display: none; }
    .showall { margin: 0 -14px; }
    .res { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .none + .glass-divider { margin: 0 -14px; }
    .none .glass-empty__action { flex-direction: column; align-items: stretch; width: 100%; max-width: 280px; }
    .none .glass-btn { height: 46px; }
    .none .glass-empty__title { font-size: 18px; }
  }
</style>
