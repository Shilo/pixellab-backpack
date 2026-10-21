<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { APP_NAME } from './lib/app';
  import { familiesOf, scopeLabel } from './lib/categories';
  import { library } from './lib/data/library.svelte';
  import { closeActivity, go, parseRoute, router, scopeOf, screenOf } from './lib/router.svelte';
  import type { FamilyId, Item } from './lib/types';
  import Activity from './lib/ui/Activity.svelte';
  import CategoryGrid from './lib/ui/CategoryGrid.svelte';
  import Dock from './lib/ui/Dock.svelte';
  import KeyScreen from './lib/ui/KeyScreen.svelte';
  import LibraryHome from './lib/ui/LibraryHome.svelte';
  import MoreMenu from './lib/ui/MoreMenu.svelte';
  import Notice from './lib/ui/Notice.svelte';
  import Search, { clearRecent } from './lib/ui/Search.svelte';
  import Settings from './lib/ui/Settings.svelte';
  import Viewer from './lib/ui/Viewer.svelte';

  // Saved copy first (the key screen's "Welcome back" reads it); with a key this is also the one open check.
  onMount(() => void library.openCheck());

  const route = $derived(router.route);
  const screen = $derived(screenOf(route));
  const scope = $derived(scopeOf(route));
  const grid = $derived(route.name !== 'home'); // a category or All assets
  const viewing = $derived(route.key ?? null);
  let h1 = $state<HTMLElement>();

  let searching = $state(false);
  let results = $state<Item[]>([]);
  // The id of the same-URL history entry this search pushed (R3), 0 when none: closing steps Back over it. An id, not a
  // flag: an entry left by an earlier search (Go to, a reload) must not keep a later search open on Back.
  let searchEntry = 0;

  // The card last shown in the viewer: after closing, the grid (or the search it was opened from) brings it back and focuses it.
  let lastShown = $state<string | null>(null);
  $effect(() => {
    if (viewing) lastShown = viewing;
    else if (route.name === 'home' && !searching) lastShown = null;
  });

  function openSearch() {
    if (searching) return;
    lastShown = null;
    searching = true;
    searchEntry = Date.now();
    history.pushState({ search: searchEntry }, '', location.hash);
  }
  /** Esc, Cancel, the leading button, the dim and Back: off the search entry; focus returns to the dock's Search. */
  function closeSearch() {
    if (!searching) return;
    searching = false; // at once: a second Esc before the browser reports Back must not step back twice
    lastShown = null;
    if (searchEntry) history.back();
    searchEntry = 0;
    tick().then(() => document.querySelector<HTMLElement>('[data-search]')?.focus());
  }
  /** Go to and Show all: close, go, and focus the new screen's heading.
   * ponytail: the search's history entry stays under the new screen, one extra Back step (R3). */
  function goFromSearch(path: string) {
    searching = false;
    searchEntry = 0;
    lastShown = null;
    go(path);
    tick().then(() => h1?.focus());
  }
  // Back (phone or browser) onto an entry without the search closes it. Opening a result (an entry with a key) does not.
  function onpopstate() {
    if (!searching || history.state?.search === searchEntry || parseRoute(location.hash).key) return;
    searchEntry = 0; // the browser already stepped Back
    closeSearch();
  }
  $effect(() => {
    if (library.hasKey) return;
    searching = false;
    clearRecent();
  });

  let menu = $state(false);
  let activity = $state(false);
  let settings = $state(false);
  const closeAct = () => {
    activity = false;
    closeActivity();
  };

  // "/" opens the search, unless typing in a field or something else is open on top. Esc closes it, wherever focus is.
  function onkeydown(e: KeyboardEvent) {
    const top = viewing || menu || settings || activity || router.activity;
    if (e.key === 'Escape' && searching && !top && !e.defaultPrevented && !e.isComposing) { // an IME's Esc cancels its text
      e.preventDefault(); // a search field would clear itself first
      return closeSearch();
    }
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (!library.hasKey || searching || top) return;
    e.preventDefault(); // else the "/" lands in the field that just took focus
    openSearch();
  }

  const failed = $derived(Object.keys(library.errors) as FamilyId[]);
  const failedHere = $derived(failed.filter((id) => familiesOf(scope).includes(id)));
  // Every family of the screen failed and nothing is saved: an error card instead of a blank screen.
  const errorCard = $derived(failedHere.length > 0 && library.status !== 'checking' && familiesOf(scope).every((id) => !library.families[id]));
  // A grid whose families are fully loaded and hold no finished asset.
  const emptyGrid = $derived(
    grid &&
      familiesOf(scope).every((id) => {
        const s = library.families[id];
        return s && s.cards.length >= s.total && !s.cards.some((c) => c.done);
      }),
  );

  /** Re-asks what failed: first pages through the open check (failed families are not fresh), then failed next pages, once. */
  async function recheck() {
    await library.openCheck();
    for (const id of Object.keys(library.errors) as FamilyId[]) {
      const s = library.families[id];
      if (s && s.cards.length < s.total) void library.loadMore(id);
    }
  }
  // Every Try again lifts a stop first, so a halted network module always recovers without a reload.
  const tryAgain = () => {
    library.recover();
    void recheck();
  };
  const keepLoading = () => {
    library.keepLoading();
    void recheck();
  };

  type Note = { text: string; action?: string; on?: () => void; tone?: 'warn' };
  const notice = $derived.by((): Note | null => {
    switch (library.status) {
      case 'slowed':
        return { text: 'PixelLab asked us to slow down. Continuing shortly…' };
      case 'paused':
        return { text: "Paused to go easy on PixelLab's servers.", action: 'Keep loading', on: keepLoading };
      case 'stopped':
        return { text: "PixelLab isn't answering right now.", action: 'Try again', on: tryAgain, tone: 'warn' };
      case 'offline':
        return { text: "You're offline. Showing your saved library." };
    }
    if (!failedHere.length) return null;
    return { text: grid ? "Couldn't load more" : "Some assets didn't load", action: 'Try again', on: tryAgain, tone: 'warn' };
  });
</script>

<svelte:window {onkeydown} {onpopstate} />

<h1 class="vt-sr" tabindex="-1" bind:this={h1}>{grid ? scopeLabel(scope) : APP_NAME}</h1>

{#snippet retryButton()}
  <div class="glass-empty__action">
    <button type="button" class="glass-btn glass-btn--primary glass-btn--auto" onclick={tryAgain}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" /></svg>Try again
    </button>
  </div>
{/snippet}

{#if !library.hasKey}
  <KeyScreen />
{:else}
  <!-- The viewer is a modal over the screen: what is under it stays mounted (the grid keeps its scroll) but inert.
       The search is a layer too: the screen under it is inert while it is open. -->
  <div inert={!!viewing}>
  <div inert={searching}>
  {#if library.status === 'blocked'}
    <main class="vt-state">
      <div class="glass-empty vt-scrim">
        <span class="glass-empty__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></svg></span>
        <h2 class="glass-empty__title">Can't reach PixelLab right now.</h2>
        <p class="glass-empty__text">Check your connection and try again.</p>
        {@render retryButton()}
      </div>
    </main>
  {:else if errorCard}
    <main class="vt-state">
      <div class="glass-empty vt-scrim">
        {#if library.status === 'offline'}
          <h2 class="glass-empty__title">You're offline.</h2>
          <p class="glass-empty__text">Connect to the internet to load your PixelLab library.</p>
        {:else}
          <h2 class="glass-empty__title">Couldn't reach PixelLab.</h2>
          <p class="glass-empty__text">Check your connection and try again.</p>
        {/if}
        {@render retryButton()}
      </div>
    </main>
  {:else if emptyGrid}
    <main class="vt-state">
      <div class="glass-empty vt-scrim">
        <h2 class="glass-empty__title">Nothing here yet.</h2>
        <p class="glass-empty__text">Create something in PixelLab and it'll show up here.</p>
      </div>
    </main>
  {:else if grid}
    <CategoryGrid {scope} reveal={viewing || searching ? null : lastShown} />
  {:else}
    <LibraryHome />
  {/if}
  </div>

  {#if notice && !errorCard && !searching && library.status !== 'blocked'}
    <Notice text={notice.text} actionLabel={notice.action} onAction={notice.on} tone={notice.tone} />
  {/if}
  {#if searching}
    <Search {screen} reveal={viewing ? null : lastShown} onClose={closeSearch} onGo={goFromSearch} bind:results />
  {:else if grid}
    <Dock mode="category" title={scopeLabel(scope)} count={library.count(scope)} onBack={() => go('#/')} onSearch={openSearch} onMore={() => (menu = true)} />
  {:else}
    <Dock mode="home" onSearch={openSearch} onMore={() => (menu = true)} />
  {/if}
  <MoreMenu open={menu} onClose={() => (menu = false)} onActivity={() => (activity = true)} onSettings={() => (settings = true)} />
  </div>
  {#if viewing}
    <Viewer {scope} assetKey={viewing} results={searching && results.length ? results : null} />
  {/if}
{/if}

<!-- Outside the key check: Forget key signs out while its confirm is still on screen. -->
<Settings open={settings} onClose={() => (settings = false)} />
<Activity open={activity || router.activity} onClose={closeAct} />
