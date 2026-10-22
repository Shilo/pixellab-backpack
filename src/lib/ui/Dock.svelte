<script lang="ts">
  // The floating glass dock. Search opens the search (onSearch); its controls carry data-search so focus can return to them.
  // No Select until Select mode ships (P-20). "…" opens the library menu (B14).
  let {
    mode,
    title,
    count,
    onBack,
    onSearch,
    onMore,
  }: { mode: 'home' | 'category'; title?: string; count?: number; onBack?: () => void; onSearch: () => void; onMore: () => void } = $props();
</script>

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
      <span class="crumb"><span class="t">{title}</span>{#if count !== undefined}<span>{count.toLocaleString()}</span>{/if}</span>
      <button type="button" class="glass-tab-bar__item vt-icon" data-search aria-label="Search" onclick={onSearch}>
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></span>
      </button>
    {/if}
    <button type="button" class="glass-tab-bar__item vt-icon" aria-haspopup="menu" onclick={onMore}>
      <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" class="dots" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18.5" cy="12" r="1.7" /></svg></span>
      <span class="vt-sr">More</span>
    </button>
  </nav>
</div>
