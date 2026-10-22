<script lang="ts">
  // A card's menu (R9) and Add to folder (R10) as one native modal <dialog>: the page behind is inert, Esc closes it.
  // With `rect`: a lifted copy of the cell's picture and the panel beside it (mockups 04-context-menu, g4-add-to-folder).
  // Without: under the viewer capsule. Phone: a bottom sheet with a grip. Changes are read by App's one live region (no status here).
  import { tick } from 'svelte';
  import { library } from '../data/library.svelte';
  import { isIn, org, setFavorite, setInFolder } from '../data/org.svelte';
  import PixelArt from '../render/PixelArt.svelte';
  import type { Item } from '../types';
  import FolderDialog from './FolderDialog.svelte';
  import { moveFocus } from './keys';

  let { item, rect, href, start, onClose }: { item: Item | null; rect: DOMRect | null; href: string; start: 'menu' | 'folders'; onClose: () => void } = $props();

  let dlg = $state<HTMLDialogElement>();
  let panel = $state<HTMLDivElement>();
  let view = $state<'menu' | 'folders'>('menu');
  let naming = $state<{ kind: 'new'; add: Item } | null>(null);
  let pw = $state(0);
  let ph = $state(0);
  let vw = $state(0);
  let vh = $state(0);
  let opened = ''; // the key the menu opened for, kept for the focus return after `item` is gone
  let shown = false; // closed() runs once per opening

  const name = $derived(item ? item.card.name || 'Untitled' : '');
  const keys = $derived(item ? library.groupKeys(item.card, item.familyId) : []); // R7, as the viewer's ♡ and the cell's heart
  const fav = $derived(isIn(org.favorites, keys));
  // side() in frames-g4.js: right of the cell, else left of it; kept inside the window.
  const at = $derived.by(() => {
    if (!rect) return undefined;
    const x = rect.right + 16 + pw > vw - 16 ? rect.left - 16 - pw : rect.right + 16;
    return `--x: ${Math.max(16, x)}px; --y: ${Math.max(16, Math.min(rect.top, vh - ph - 16))}px`;
  });
  const assets = (n: number) => `${n} asset${n === 1 ? '' : 's'}`;

  const first = () => panel?.querySelector<HTMLElement>('[data-nav]')?.focus();

  $effect(() => {
    if (item && dlg && !dlg.open) {
      opened = item.card.key;
      down = false;
      view = start;
      shown = true;
      dlg.showModal();
      tick().then(first);
    } else if (!item && dlg?.open) dlg.close();
  });

  // Focus goes back to the cell, else the screen's heading. Opened without a cell (the viewer), the dialog's own return stands.
  // Run at once by every close this menu makes (shut): the dialog's own close event comes a task later, and a Shift+F10 pressed
  // in between must open the menu again, not reach the browser's own menu. That late event is ignored once it has reopened.
  function closed() {
    if (!shown) return;
    shown = false;
    naming = null;
    if (rect)
      // The first copy that is not inert: a grid under the open search or a folder overlay holds an inert one earlier in the page.
      for (const el of [[...document.querySelectorAll<HTMLElement>(`a[data-key="${opened}"]`)].find((a) => !a.closest('[inert]')), document.querySelector<HTMLElement>('h1')]) {
        el?.focus();
        if (el && document.activeElement === el) break;
      }
    onClose();
  }

  function shut() {
    dlg?.close();
    closed();
  }
  // Esc: closed here, at once (the native close's event comes later).
  function oncancel(e: Event) {
    e.preventDefault();
    shut();
  }

  // Keys stay in the dialog (Esc must not also close the search or the viewer); ↑/↓/Home/End move between the items.
  function onkeydown(e: KeyboardEvent) {
    e.stopPropagation();
    moveFocus(e, [...(panel?.querySelectorAll<HTMLElement>('[data-nav]') ?? [])]);
  }

  // The dialog covers the window and is see-through: a click on it is a click outside the panel. It must also start there, so the
  // release that ends a long press, or a drag out of the panel, does not close the menu it just opened.
  let down = false;
  const outside = (e: MouseEvent) => down && e.target === dlg && shut();

  // Closes at once (a following Esc belongs to the screen). Unfavoriting in Favorites removes the focused cell once the write
  // lands: focus then goes to the heading, not <body>.
  // ponytail: a failed device write here and in toggle() says nothing (the heart and the box show what was saved); add an error
  // line if writes ever fail in practice, as the viewer's ♡.
  function favorite() {
    const write = item && setFavorite(item, keys, !fav).catch(() => {});
    shut();
    write?.then(tick).then(() => document.activeElement === document.body && document.querySelector<HTMLElement>('h1')?.focus());
  }

  async function folders() {
    view = 'folders';
    await tick();
    first();
  }

  // Applies at once (UX-10); the box then shows what was really saved.
  async function toggle(id: string, box: HTMLInputElement) {
    if (!item) return;
    await setInFolder(id, item, keys, box.checked).catch(() => {});
    box.checked = isIn(org.folders.find((f) => f.id === id)?.items ?? [], keys);
  }
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

{#snippet art(it: Item, trim: boolean)}
  {#await library.art(it.card, it.familyId) then blob}<PixelArt {blob} alt="" {trim} fill />{/await}
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dlg} class="cm" aria-label={view === 'menu' ? name : 'Add to folder'} onclose={() => !dlg?.open && closed()} {oncancel} onpointerdown={(e) => (down = e.target === dlg)} onclick={outside} {onkeydown}>
  {#if item}
    {#if rect}
      <div class="lifted" aria-hidden="true" style="left: {rect.left}px; top: {rect.top}px; width: {rect.width}px">
        <div class="sq"><div class="art">{@render art(item, false)}</div></div>
        <span class="nm">{name}</span>
      </div>
    {/if}
    <div class="glass-popover is-open vt-scrim panel vt-grip" class:at={rect} class:atf={view === 'folders'} style={at} bind:this={panel} bind:offsetWidth={pw} bind:offsetHeight={ph}>
      {#if view === 'menu'}
        <div class="glass-list glass-list--bare" role="menu">
          <a class="glass-list__item glass-list__item--interactive" role="menuitem" data-nav {href} onclick={shut}>
            <span class="glass-list__content"><span class="glass-list__title">Open</span></span>
            <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M10 14l4-4M10.5 10H14v3.5" /></svg></span>
          </a>
          <button type="button" class="glass-list__item glass-list__item--interactive" role="menuitem" data-nav onclick={favorite}>
            <span class="glass-list__content"><span class="glass-list__title">{fav ? 'Unfavorite' : 'Favorite'}</span></span>
            <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true" class:on={fav}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" /></svg></span>
          </button>
          <button type="button" class="glass-list__item glass-list__item--interactive" role="menuitem" data-nav onclick={folders}>
            <span class="glass-list__content"><span class="glass-list__title">Add to folder…</span></span>
            <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /><path d="M12 10.5v5M9.5 13h5" /></svg></span>
          </button>
        </div>
      {:else}
        <div class="ph">
          <div><b>Add to folder</b><span>{name}</span></div>
          <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={shut}>Done</button>
        </div>
        <div class="glass-list glass-list--bare fl" role="group" aria-label="Folders">
          <button type="button" class="glass-list__item glass-list__item--interactive" data-nav onclick={() => item && (naming = { kind: 'new', add: item })}>
            <span class="glass-list__leading glass-list__leading--lg th new" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span>
            <span class="glass-list__content"><span class="glass-list__title">New folder</span></span>
          </button>
          {#each org.folders as f (f.id)}
            {@const rows = library.pick(f.items).items}<!-- as the overlay: gone items left out, one per character group (R3, R7) -->
            <label class="glass-list__item glass-list__item--interactive">
              <span class="glass-list__leading glass-list__leading--lg th" aria-hidden="true">
                {#if rows[0]}<i>{@render art(rows[0], true)}</i>{:else}<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>{/if}
              </span>
              <span class="glass-list__content"><span class="glass-list__title">{f.name}</span><span class="glass-list__subtitle">{assets(rows.length)}</span></span>
              <span class="glass-list__trailing glass-checkbox cb">
                <input class="glass-checkbox__input" type="checkbox" data-nav checked={isIn(f.items, keys)} onchange={(e) => toggle(f.id, e.currentTarget)} />
                <span class="glass-checkbox__box"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg></span>
              </span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</dialog>

<FolderDialog mode={naming} onDone={() => {}} onClose={() => (naming = null)} />

<style>
  .cm { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; overflow: hidden;
    background: none; color: var(--gl-color-text); }
  /* As .glass-modal-overlay (--gl-surface-overlay, --gl-blur-soft), written out: older engines give ::backdrop no custom properties. */
  .cm::backdrop { background: rgba(0, 0, 0, .5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

  .lifted { position: fixed; pointer-events: none; }
  .sq { position: relative; aspect-ratio: 1; border-radius: 24px; background: rgba(255, 255, 255, .12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 26px 60px rgba(0, 0, 0, .55); }
  .art { position: absolute; inset: 9%; }
  .nm { display: block; text-align: center; padding-top: 9px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .panel { position: fixed; top: 92px; right: calc(24px + var(--side, 0px)); left: auto; bottom: auto; width: 270px; min-width: 0; box-sizing: border-box; padding: 6px 0;
    border-radius: 20px; transform: none; background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim);
    overflow: hidden; /* a highlighted last row stays inside the rounded corners */
    --gl-list-item-min-height: 44px; --gl-list-item-padding-y: 9px; }
  .panel.at { left: var(--x); top: var(--y); right: auto; }
  .panel.atf { width: 340px; padding: 0 0 6px; --gl-list-item-min-height: 56px; --gl-list-item-padding-y: 8px; }
  .glass-list__item { cursor: pointer; }
  .glass-list__trailing svg { width: 19px; height: 19px; }
  svg.on { fill: currentColor; }
  .glass-list__content { display: block; flex: 1; min-width: 0; }
  .glass-list__title, .glass-list__subtitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .glass-list__subtitle { font-size: 12.5px; color: var(--gl-color-text-muted); }

  .ph { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 12px 10px 20px; --gl-btn-height-sm: 32px; }
  .ph div { min-width: 0; }
  .ph b { display: block; font-size: 16px; font-weight: 600; }
  .ph span { display: block; margin-top: 1px; font-size: 13px; color: var(--vt-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ph .glass-btn { flex: none; padding: 0 14px; color: var(--gl-color-text); }
  /* The inner scroller: the rounded panel itself never scrolls (Phase 3 L1). */
  .fl { max-height: min(488px, calc(100dvh - 140px)); overflow-y: auto; overscroll-behavior: contain; }
  .panel:not(.at) .fl { max-height: min(488px, calc(100dvh - 190px)); } /* under the capsule: starts 92 px down */
  .th { background: rgba(0, 0, 0, .28); border-radius: 11px; color: var(--vt-text-2); }
  .th i { position: relative; display: block; width: 100%; height: 100%; }
  .th svg { width: 22px; height: 22px; stroke-width: 1.8; }
  .th.new { background: linear-gradient(135deg, var(--gl-color-primary), var(--gl-color-primary-dark)); color: #fff; }
  .cb { position: relative; display: flex; }
  .cb .glass-checkbox__input { top: 0; left: 0; margin: 0; }
  .glass-list__item:focus-visible, .ph .glass-btn:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }

  @media (max-width: 600px) {
    .sq { border-radius: 18px; }
    .nm { font-size: 12.5px; padding-top: 6px; }
    .panel, .panel.at, .panel.atf { left: 8px; right: 8px; top: auto; bottom: var(--vt-bot, 12px); width: auto; padding: 18px 0 8px; border-radius: 30px;
      --gl-list-item-min-height: 50px; }
    .panel.atf { padding-top: 14px; --gl-list-item-min-height: 56px; }
    .glass-list__subtitle { font-size: 13px; }
    .ph { padding: 8px 12px 8px 22px; --gl-btn-height-sm: 44px; }
    .fl, .panel:not(.at) .fl { max-height: min(380px, calc(100dvh - 180px)); }
  }
</style>
