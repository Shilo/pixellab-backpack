<script lang="ts">
  import { APP_NAME } from './lib/app';
  import { CATEGORIES } from './lib/categories';
  import { go, router } from './lib/router.svelte';
  import Dock from './lib/ui/Dock.svelte';

  const route = $derived(router.route);
  const title = $derived(route.name === 'category' ? CATEGORIES.find((c) => c.id === route.id)!.label : '');
</script>

<h1 class="vt-sr">{APP_NAME}</h1>

<!-- PLACEHOLDERS: B8 (KeyScreen), B9 (LibraryHome) and B10 (CategoryGrid) replace these two blocks. -->
{#if route.name === 'category'}
  <main class="grid"><p class="vt-text-2">{title} grid goes here.</p></main>
  <Dock mode="category" {title} onBack={() => go('#/')} />
{:else}
  <main class="library">
    {#each CATEGORIES as c (c.id)}
      <a class="tile" href="#/c/{c.id}"><span class="tlabel"><b>{c.label}</b></span></a>
    {/each}
  </main>
  <Dock mode="home" />
{/if}
