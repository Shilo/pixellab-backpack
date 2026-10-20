<script lang="ts">
  import { APP_NAME } from './lib/app';
  import { CATEGORIES, go, router } from './lib/router.svelte';
  import Dock from './lib/ui/Dock.svelte';

  const route = $derived(router.route);
</script>

<h1 class="vt-sr">{APP_NAME}</h1>

<!-- PLACEHOLDERS: B8 (KeyScreen), B9 (LibraryHome) and B10 (CategoryGrid) replace these two blocks. -->
{#if route.name === 'category'}
  <main class="grid"><p class="vt-text-2">{CATEGORIES[route.id]} grid goes here.</p></main>
  <Dock mode="category" title={CATEGORIES[route.id]} onBack={() => go('#/')} />
{:else}
  <main class="library">
    {#each Object.entries(CATEGORIES) as [id, title] (id)}
      <a class="tile" href="#/c/{id}"><span class="tlabel"><b>{title}</b></span></a>
    {/each}
  </main>
  <Dock mode="home" />
{/if}
