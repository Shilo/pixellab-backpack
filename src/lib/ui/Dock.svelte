<script lang="ts">
  // The floating glass dock. Search opens the search (onSearch); its controls carry data-search so focus can return to them.
  // Select stays visible but inert (a real button, aria-disabled, "Coming soon" for screen readers, no handler); `select` false
  // leaves it out (empty Favorites: nothing to select, mockup g2-favorites-empty).
  // "…" calls onMore when given (B14), else it is inert too.
  let {
    mode,
    title,
    count,
    select = true,
    onBack,
    onSearch,
    onMore,
  }: { mode: 'home' | 'category'; title?: string; count?: number; select?: boolean; onBack?: () => void; onSearch: () => void; onMore?: () => void } = $props();
</script>

{#snippet soon(name: string)}<span class="vt-sr">{name}, coming soon</span>{/snippet}

<div class="glass-tab-bar-dock">
  <nav class="glass-tab-bar glass-tab-bar--floating vt-dock vt-scrim" aria-label="Library">
    {#if mode === 'home'}
      <button type="button" class="glass-tab-bar__item is-active" aria-current="page">
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg></span>
        <span class="glass-tab-bar__label">Library</span>
      </button>
      <button type="button" class="vt-search" data-search onclick={onSearch}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
        <span>Search your library</span>
        <kbd aria-hidden="true">/</kbd>
      </button>
    {:else}
      <button type="button" class="glass-tab-bar__item vt-back" onclick={onBack}>
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" /></svg></span>
        <span class="glass-tab-bar__label">Library</span>
      </button>
      <span class="vr"></span>
      <span class="crumb">{title}{#if count !== undefined}<span>{count.toLocaleString()}</span>{/if}</span>
      <button type="button" class="glass-tab-bar__item vt-icon" data-search aria-label="Search" onclick={onSearch}>
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></span>
      </button>
      {#if select}
        <button type="button" class="glass-tab-bar__item" aria-disabled="true">
          <span class="glass-tab-bar__label" aria-hidden="true">Select</span>
          {@render soon('Select')}
        </button>
      {/if}
    {/if}
    <button type="button" class="glass-tab-bar__item vt-icon" aria-disabled={onMore ? undefined : 'true'} aria-haspopup={onMore ? 'menu' : undefined} onclick={onMore}>
      <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" class="dots" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18.5" cy="12" r="1.7" /></svg></span>
      {#if onMore}<span class="vt-sr">More</span>{:else}{@render soon('More')}{/if}
    </button>
  </nav>
</div>
