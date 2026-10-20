<script lang="ts">
  import { onMount } from 'svelte';
  import { APP_NAME } from './lib/app';
  import { CATEGORIES } from './lib/categories';
  import { library } from './lib/data/library.svelte';
  import { closeActivity, go, router } from './lib/router.svelte';
  import type { FamilyId } from './lib/types';
  import Activity from './lib/ui/Activity.svelte';
  import CategoryGrid from './lib/ui/CategoryGrid.svelte';
  import Dock from './lib/ui/Dock.svelte';
  import KeyScreen from './lib/ui/KeyScreen.svelte';
  import LibraryHome from './lib/ui/LibraryHome.svelte';
  import MoreMenu from './lib/ui/MoreMenu.svelte';
  import Notice from './lib/ui/Notice.svelte';

  // Saved copy first (the key screen's "Welcome back" reads it); with a key this is also the one open check.
  onMount(() => void library.openCheck());

  const route = $derived(router.route);
  const category = $derived(route.name === 'category' ? library.categories.find((c) => c.id === route.id)! : null);

  let menu = $state(false);
  let activity = $state(false);
  const closeAct = () => {
    activity = false;
    closeActivity();
  };

  const failed = $derived(Object.keys(library.errors) as FamilyId[]);
  const failedHere = $derived(category ? failed.filter((id) => (category.families as readonly FamilyId[]).includes(id)) : failed);
  // Home with every family failed and nothing saved: an error card instead of a blank screen.
  const errorCard = $derived(
    !category && failed.length > 0 && library.status !== 'checking' && CATEGORIES.every((c) => c.families.every((id) => !library.families[id])),
  );
  // A category whose families are fully loaded and hold no finished asset.
  const emptyCategory = $derived(
    !!category &&
      category.families.every((id) => {
        const s = library.families[id];
        return s && s.cards.length >= s.total && !s.cards.some((c) => c.done);
      }),
  );

  /** Re-asks what failed: first pages through the open check (failed families are not fresh), then failed next pages, once. */
  async function tryAgain() {
    await library.openCheck();
    for (const id of Object.keys(library.errors) as FamilyId[]) {
      const s = library.families[id];
      if (s && s.cards.length < s.total) void library.loadMore(id);
    }
  }
  const resume = () => {
    library.retry();
    void tryAgain();
  };
  const keepLoading = () => {
    library.keepLoading();
    void tryAgain();
  };

  type Note = { text: string; action?: string; on?: () => void; tone?: 'warn' };
  const notice = $derived.by((): Note | null => {
    switch (library.status) {
      case 'slowed':
        return { text: 'PixelLab asked us to slow down. Continuing shortly…' };
      case 'paused':
        return { text: "Paused to go easy on PixelLab's servers.", action: 'Keep loading', on: keepLoading };
      case 'stopped':
        return { text: "PixelLab isn't answering right now.", action: 'Try again', on: resume, tone: 'warn' };
      case 'offline':
        return { text: "You're offline. Showing your saved library." };
    }
    if (!failedHere.length) return null;
    return { text: category ? "Couldn't load more" : "Some assets didn't load", action: 'Try again', on: tryAgain, tone: 'warn' };
  });
</script>

<h1 class="vt-sr">{category?.label ?? APP_NAME}</h1>

{#snippet retryButton()}
  <div class="glass-empty__action">
    <button type="button" class="glass-btn glass-btn--primary glass-btn--auto" onclick={resume}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" /></svg>Try again
    </button>
  </div>
{/snippet}

{#if !library.hasKey}
  <KeyScreen />
{:else}
  {#if library.status === 'blocked'}
    <main class="vt-state">
      <div class="glass-empty vt-scrim">
        <span class="glass-empty__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></svg></span>
        <h2 class="glass-empty__title">PixelLab is blocking this browser</h2>
        <p class="glass-empty__text">PixelLab may have changed how its API works with websites. Nothing is wrong with your account.</p>
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
  {:else if category && emptyCategory}
    <main class="vt-state">
      <div class="glass-empty vt-scrim">
        <h2 class="glass-empty__title">Nothing here yet.</h2>
        <p class="glass-empty__text">Create something in PixelLab and it'll show up here.</p>
      </div>
    </main>
  {:else if category}
    <CategoryGrid categoryId={category.id} />
  {:else}
    <LibraryHome />
  {/if}

  {#if notice && !errorCard && library.status !== 'blocked'}
    <Notice text={notice.text} actionLabel={notice.action} onAction={notice.on} tone={notice.tone} />
  {/if}
  {#if category}
    <Dock mode="category" title={category.label} count={category.count} onBack={() => go('#/')} onMore={() => (menu = true)} />
  {:else}
    <Dock mode="home" onMore={() => (menu = true)} />
  {/if}
  <MoreMenu open={menu} onClose={() => (menu = false)} onActivity={() => (activity = true)} />
{/if}

<Activity open={activity || router.activity} onClose={closeAct} />
