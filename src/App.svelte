<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import { APP_NAME } from './lib/app';
  import { familiesOf, scopeLabel } from './lib/categories';
  import { library } from './lib/data/library.svelte';
  import { org } from './lib/data/org.svelte';
  import PixelArt from './lib/render/PixelArt.svelte';
  import { closeActivity, closeFolder, go, parseRoute, pathOf, router, scopeOf, screenOf } from './lib/router.svelte';
  import type { FamilyId, Item } from './lib/types';
  import Activity from './lib/ui/Activity.svelte';
  import CardMenu from './lib/ui/CardMenu.svelte';
  import CategoryGrid from './lib/ui/CategoryGrid.svelte';
  import Dock from './lib/ui/Dock.svelte';
  import FolderOverlay from './lib/ui/FolderOverlay.svelte';
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
  const fav = $derived(route.name === 'fav');
  const grid = $derived(route.name === 'category' || route.name === 'all' || fav);
  // Favorites from this device only (R2, R3, R7): no request, gone items left out.
  const favs = $derived(fav ? library.pick(org.favorites).items : []);
  const title = $derived(fav ? 'Favorites' : scopeLabel(scope));
  // A folder: an overlay over home (R5), drawn from this device only.
  const folder = $derived(route.name === 'folder' ? org.folders.find((f) => f.id === route.id) : undefined);
  const inFolder = $derived(route.name === 'folder');
  const folderItems = $derived(folder ? library.pick(folder.items).items : []);
  // closeFolder() may step Back, and a delete closes twice (the dialog, then this check): once per visit.
  let leaving = false;
  function leaveFolder() {
    if (leaving || router.route.name !== 'folder') return;
    leaving = true;
    closeFolder();
  }
  $effect(() => {
    if (!inFolder) leaving = false;
    // An unknown or deleted folder; under an open viewer only once it closes (closeFolder: close any viewer first).
    else if (org.ready && !folder && !viewing) leaveFolder();
  });
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
    if (location.hash === path) h1?.focus(); // the same screen: no route change to focus it
    go(path);
  }
  // Back (phone or browser) onto an entry without the search closes it. Opening a result (an entry with a key) does not.
  function onpopstate() {
    if (!searching || history.state?.search === searchEntry || parseRoute(location.hash).key) return;
    searchEntry = 0; // the browser already stepped Back
    closeSearch();
  }
  // Signed out (Forget here or in another tab, a 401): nothing of the library stays on screen over the key screen.
  $effect(() => {
    if (library.hasKey) return;
    searching = false;
    card = null; // the card menu lives at App root, outside the key check
    clearRecent();
  });

  let menu = $state(false);
  let activity = $state(false);
  let settings = $state(false);
  const closeAct = () => {
    activity = false;
    closeActivity();
  };

  // A card's menu (R9) on every cell (grids, the folder overlay, search results), from these window listeners only: right-click
  // (and Android's long press), ContextMenu or Shift+F10 on a focused cell, and a 500 ms touch press (iOS fires no contextmenu).
  let card = $state<{ item: Item; rect: DOMRect; href: string } | null>(null);
  const cellOf = (t: EventTarget | null) => (t as Element | null)?.closest?.<HTMLAnchorElement>('a.cell[data-key]') ?? null;
  /** Not while it or anything else is open on top, nor before the device's folders are read (a folder made then would be lost). */
  function openMenu(cell: HTMLAnchorElement): boolean {
    if (card || viewing || menu || settings || activity || router.activity || !org.ready) return false;
    if (document.querySelector('dialog[open], [role="menu"]')) return false; // a dialog, or a popover such as the folder's "…"
    const item = library.find(cell.dataset.key!);
    if (item) card = { item, rect: cell.getBoundingClientRect(), href: cell.getAttribute('href') ?? '' };
    return !!item;
  }
  // Back or Forward while it is open: the screen under it changed, so it closes (Android Back already cancels the dialog).
  // The search closing on Back is such a change too (its entry has the same address, so the path stays).
  const path = $derived(pathOf(route));
  $effect(() => {
    void path;
    void searching;
    untrack(() => (card = null));
  });
  // After any route change (a tile, the dock, Back, Go to, closing the viewer or a folder): focus the new screen's heading, so
  // a screen reader reads it and Tab starts there, never <body>. Only when nothing took focus by then: the viewer's title, the
  // grid's, the search's or the overlay's reveal, and the folder overlay's heading or tile all run within these two ticks.
  // Never while a viewer is open: it keeps focus itself (←/→ swap the key; the page heading sits behind it).
  let focusedPath = untrack(() => path);
  $effect(() => {
    if (path === focusedPath) return;
    focusedPath = path;
    tick().then(tick).then(() => !router.route.key && document.activeElement === document.body && h1?.focus());
  });
  // A second trigger while it is open is ignored, the browser's own menu too: also the one Windows sends on the key's release,
  // aimed at the menu's focused item.
  function oncontextmenu(e: MouseEvent) {
    const cell = cellOf(e.target);
    if ((cell && (card || openMenu(cell))) || (card && (e.target as Element).closest?.('dialog.cm'))) e.preventDefault();
  }
  // Long press: 10 px of slop; lifting, a cancel (the browser took over to scroll) or a scroll ends it. The click that may follow
  // on that cell is swallowed, so the press never also opens the viewer.
  let press: { x: number; y: number; t: ReturnType<typeof setTimeout> } | null = null;
  let swallow: HTMLAnchorElement | null = null;
  function endPress() {
    if (press) clearTimeout(press.t);
    press = null;
  }
  function onpointerdown(e: PointerEvent) {
    endPress();
    swallow = null;
    const cell = e.pointerType === 'touch' ? cellOf(e.target) : null;
    if (cell) press = { x: e.clientX, y: e.clientY, t: setTimeout(() => ((press = null), openMenu(cell) && (swallow = cell)), 500) };
  }
  const onpointermove = (e: PointerEvent) => press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10 && endPress();
  function onclickcapture(e: MouseEvent) {
    if (swallow && cellOf(e.target) === swallow) {
      e.preventDefault();
      e.stopPropagation();
    }
    swallow = null;
  }

  // "/" opens the search, unless typing in a field or something else is open on top. Esc closes it, wherever focus is.
  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      const cell = cellOf(e.target);
      if (cell && openMenu(cell)) e.preventDefault();
      return;
    }
    const top = viewing || menu || settings || activity || router.activity;
    if (e.key === 'Escape' && searching && !top && !e.defaultPrevented && !e.isComposing) { // an IME's Esc cancels its text
      e.preventDefault(); // a search field would clear itself first
      return closeSearch();
    }
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (!library.hasKey || searching || top || inFolder) return;
    e.preventDefault(); // else the "/" lands in the field that just took focus
    openSearch();
  }

  const failed = $derived(Object.keys(library.errors) as FamilyId[]);
  const failedHere = $derived(failed.filter((id) => familiesOf(scope).includes(id)));
  // Every family of the screen failed and nothing is saved: an error card instead of a blank screen.
  const errorCard = $derived(!fav && !inFolder && failedHere.length > 0 && library.status !== 'checking' && familiesOf(scope).every((id) => !library.families[id]));
  // A grid whose families are fully loaded and hold no finished asset.
  const emptyGrid = $derived(
    grid &&
      !fav &&
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
    if (!failedHere.length || fav) return null;
    return { text: grid ? "Couldn't load more" : "Some assets didn't load", action: 'Try again', on: tryAgain, tone: 'warn' };
  });
</script>

<svelte:window {onkeydown} {onpopstate} {oncontextmenu} {onpointerdown} {onpointermove} onpointerup={endPress} onpointercancel={endPress} onscrollcapture={endPress} {onclickcapture} />

<h1 class="vt-sr" tabindex="-1" bind:this={h1}>{grid ? title : inFolder ? (folder?.name ?? APP_NAME) : APP_NAME}</h1>

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
  <div inert={searching || inFolder}>
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
  {:else if fav && !org.ready}
    <!-- A direct load: nothing until the device's favorites are read (no empty grid or "0" flash). -->
  {:else if fav && !favs.length}
    {@const idle = library.categories.find((c) => c.mosaic.length)?.mosaic[0]}
    <main class="vt-page">
      <div class="glass-empty">
        <span class="idle" aria-hidden="true">
          {#if idle}{#await library.art(idle.card, idle.familyId) then blob}<PixelArt {blob} alt="" trim fill />{/await}{/if}
        </span>
        <h2 class="glass-empty__title">No favorites yet.</h2>
        <p class="glass-empty__text">Use the heart on any asset to keep it here.</p>
      </div>
    </main>
  {:else if grid}
    <!-- Keyed: each screen mounts a fresh grid (as from home), so no scroll position or asked pages carry over (Go to). -->
    {#key pathOf(screen)}<CategoryGrid {screen} items={fav ? favs : library.items(scope)} reveal={viewing || searching ? null : lastShown} />{/key}
  {:else}
    <LibraryHome />
  {/if}
  </div>
  {#if folder}
    <FolderOverlay folderId={folder.id} reveal={viewing ? null : lastShown} onClose={leaveFolder} />
  {/if}

  {#if notice && !errorCard && !searching && !inFolder && library.status !== 'blocked'}
    <Notice text={notice.text} actionLabel={notice.action} onAction={notice.on} tone={notice.tone} />
  {/if}
  {#if searching}
    <Search {screen} note={['slowed', 'paused', 'stopped', 'offline'].includes(library.status) ? (notice?.text ?? null) : null} reveal={viewing ? null : lastShown} onClose={closeSearch} onGo={goFromSearch} bind:results />
  {:else if inFolder}
    <!-- No dock under a folder: its overlay has its own controls. -->
  {:else if grid}
    <Dock mode="category" {title} count={fav ? (org.ready ? favs.length : undefined) : library.count(scope)} onBack={() => go('#/')} onSearch={openSearch} onMore={() => (menu = true)} />
  {:else}
    <Dock mode="home" onSearch={openSearch} onMore={() => (menu = true)} />
  {/if}
  <MoreMenu open={menu} onClose={() => (menu = false)} onActivity={() => (activity = true)} onSettings={() => (settings = true)} />
  </div>
  {#if viewing}
    <Viewer {scope} assetKey={viewing} results={searching && results.length ? results : fav ? favs : inFolder ? folderItems : null} />
  {/if}
{/if}

<!-- Outside the key check: Forget key signs out while its confirm is still on screen. -->
<Settings open={settings} onClose={() => (settings = false)} />
<Activity open={activity || router.activity} onClose={closeAct} />
<!-- Never under an inert wrapper; focus returns to the cell. -->
<CardMenu item={card?.item ?? null} rect={card?.rect ?? null} href={card?.href ?? ''} start="menu" onClose={() => ((card = null), (swallow = null))} />
<!-- The one live region (R10): outside every inert layer and closing dialog, so each change is read. -->
<span class="vt-sr" role="status">{org.said}</span>

<style>
  /* Favorites' empty screen (mockup frames-g2.css .g2-page, .g2-empty, .g2-idle): no card, a crisp idle sprite. */
  .vt-page { position: fixed; inset: 0; display: grid; place-items: center; padding-bottom: 110px; }
  .idle { position: relative; display: block; width: 128px; height: 128px; margin-bottom: 4px; }
  .vt-page .glass-empty__title { font-size: 20px; letter-spacing: -.01em; }
  .vt-page .glass-empty__text { font-size: 15px; color: var(--vt-text-2); }
  @media (max-width: 600px) {
    .vt-page { padding: var(--vt-top) 20px 100px; }
    .idle { width: 96px; height: 96px; }
    .vt-page .glass-empty__title { font-size: 18px; }
  }
</style>
