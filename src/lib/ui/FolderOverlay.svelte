<script lang="ts">
  // A folder over home (mockups 09-folder-open, g4-folder-menu, g4-folder-empty, g4-folder-unavailable): a fixed layer, not a
  // modal <dialog>, so the viewer opens on top of it. Drawn from this device only (R2, R3): 0 requests once pictures were seen.
  import { tick } from 'svelte';
  import { library } from '../data/library.svelte';
  import { org, removeKeys, type Folder } from '../data/org.svelte';
  import PixelArt from '../render/PixelArt.svelte';
  import { pathOf, router } from '../router.svelte';
  import AssetCell from './AssetCell.svelte';
  import FolderDialog from './FolderDialog.svelte';

  let { folderId, reveal = null, onClose }: { folderId: string; reveal?: string | null; onClose: () => void } = $props();

  const folder = $derived(org.folders.find((f) => f.id === folderId));
  // ponytail: every cell is rendered (no virtual rows, R8); pictures load only on screen. Add virtual rows if folders get huge.
  const picked = $derived(folder ? library.pick(folder.items) : { items: [], gone: [] });
  const n = $derived(picked.items.length);
  const idle = $derived(library.categories.find((c) => c.mosaic.length)?.mosaic[0]);

  let heading = $state<HTMLElement>();
  let more = $state<HTMLButtonElement>();
  let first = $state<HTMLButtonElement>();
  let scroller = $state<HTMLElement>();
  let menu = $state(false);
  let removeFailed = $state(false);
  let dialog = $state<{ kind: 'rename'; folder: Folder } | { kind: 'delete'; folder: Folder } | null>(null);

  // Focus moves in on open; on close it returns to the folder's tile on home (or the page heading when the tile is gone).
  $effect(() => {
    heading?.focus();
    const id = folderId;
    // Only when nothing else took focus (the key screen after another tab's Forget, the viewer over a deleted folder).
    return () =>
      void tick().then(() => document.activeElement === document.body && (document.querySelector<HTMLElement>(`a.tile[href="#/f/${id}"]`) ?? document.querySelector<HTMLElement>('h1'))?.focus());
  });
  $effect(() => {
    if (menu) first?.focus();
  });

  // Back from the viewer: the card last shown comes into view and takes focus (a grouped state is shown by its group's cell).
  let revealed: string | null = null;
  $effect(() => {
    const key = reveal;
    if (key === revealed || !scroller) return;
    revealed = key;
    if (!key) return;
    const hit = library.find(key);
    const shown = hit && library.states(hit.card, hit.familyId)[0].key;
    tick().then(() => {
      const a = scroller?.querySelector<HTMLElement>(`a[data-key="${shown}"]`);
      a?.scrollIntoView({ block: 'nearest' });
      a?.focus({ preventScroll: true });
    });
  });

  /** Remove them (R3): a failed write keeps the items and says so, in the note and in the one live region (R10). */
  async function removeGone() {
    if (!folder) return;
    removeFailed = false;
    try {
      await removeKeys(folder.id, picked.gone);
    } catch {
      removeFailed = true;
      org.said = "Couldn't save. Try again.";
    }
  }

  function closeMenu() {
    menu = false;
    more?.focus();
  }
  function pick(kind: 'rename' | 'delete') {
    closeMenu(); // the dialog's native close returns focus to "…"
    if (folder) dialog = { kind, folder };
  }

  // Esc: the menu first; the overlay only when nothing above it handled it (the viewer, a menu or a dialog).
  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return;
    if (menu) return closeMenu();
    if (router.route.key || router.activity || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    onClose();
  }
  // A click on the dim outside the card and the title row closes it.
  function ondim(e: MouseEvent) {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('fopen')) onClose();
  }
</script>

<svelte:window {onkeydown} />

{#if folder}
  <!-- The dim's click is a mouse shortcut; ✕ and Esc are the keyboard paths. Focus goes to the heading, not the layer. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
  <div class="glass-modal-overlay is-active ov" role="dialog" aria-labelledby="fo-title" onclick={ondim}>
    <div class="fopen">
      <div class="ftitle">
        <h2 id="fo-title" tabindex="-1" bind:this={heading}>{folder.name}</h2>
        <span class="anchor">
          <button type="button" class="glass-pill" aria-label="Folder actions" aria-haspopup="menu" aria-expanded={menu} bind:this={more} onclick={() => (menu = true)}>
            <svg viewBox="0 0 24 24" class="dots" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18.5" cy="12" r="1.7" /></svg>
          </button>
          {#if menu}
            <button type="button" class="backdrop" tabindex="-1" aria-label="Close menu" onclick={closeMenu}></button>
            <div class="glass-popover is-open vt-scrim menu" role="menu" aria-label="Folder actions">
              <button type="button" role="menuitem" class="glass-list__item glass-list__item--interactive" bind:this={first} onclick={() => pick('rename')}>
                <span class="glass-list__content"><span class="glass-list__title">Rename…</span></span>
                <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z" /><path d="M13.8 7.2l3 3" /></svg></span>
              </button>
              <hr class="glass-divider" />
              <button type="button" role="menuitem" class="glass-list__item glass-list__item--interactive glass-list__item--danger" onclick={() => pick('delete')}>
                <span class="glass-list__content"><span class="glass-list__title">Delete folder…</span></span>
                <span class="glass-list__trailing"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5M10.2 10.5v6M13.8 10.5v6" /></svg></span>
              </button>
            </div>
          {/if}
        </span>
      </div>

      {#if n || picked.gone.length}
        <div class="glass-card glass-card--glow fpanel">
          <div class="scroll" bind:this={scroller}>
            {#if picked.gone.length}
              <div class="note">
                <span class="ni"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.1" /></svg></span>
                <span>
                  {picked.gone.length === 1 ? "1 item in this folder isn't in your PixelLab library anymore." : `${picked.gone.length} items in this folder aren't in your PixelLab library anymore.`}
                  {#if removeFailed}<b>Couldn't save. Try again.</b>{/if}
                </span>
                <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={removeGone}>Remove them</button>
              </div>
            {/if}
            {#each picked.items as it (it.card.key)}
              <AssetCell card={it.card} familyId={it.familyId} href={pathOf({ name: 'folder', id: folder.id, key: it.card.key })} costly={library.family(it.familyId).artCostsApi} />
            {/each}
          </div>
        </div>
        <div class="fmeta">{n === 1 ? '1 asset' : `${n.toLocaleString()} assets`}</div>
      {:else}
        <div class="glass-card glass-card--glow fpanel emptyp">
          <div class="glass-empty">
            <span class="idle" aria-hidden="true">
              {#if idle}{#await library.art(idle.card, idle.familyId) then blob}<PixelArt {blob} alt="" trim fill />{/await}{/if}
            </span>
            <p class="glass-empty__title">This folder is empty.</p>
            <p class="glass-empty__text">Open an asset's menu in your library and choose Add to folder.</p>
            <div class="glass-empty__action">
              <button type="button" class="glass-btn glass-btn--primary glass-btn--auto" onclick={onClose}>
                <svg viewBox="0 0 24 24" class="solid" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>Go to Library
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
    <button type="button" class="glass-pill vt-scrim fclose" aria-label="Close folder" onclick={onClose}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
    </button>
    <FolderDialog mode={dialog} onDone={() => dialog?.kind === 'delete' && onClose()} onClose={() => (dialog = null)} />
  </div>
{/if}

<style>
  /* Between the dock (910) and the viewer (950); the mockup's layout (app.css .fopen, .ftitle, .fpanel, .fmeta, .fclose). */
  .ov { z-index: 930; }
  .fopen { display: flex; flex-direction: column; align-items: center; gap: 20px; width: min(1160px, 100%); max-height: 100%; } /* the card shrinks, its cells scroll */
  .ftitle { flex: none; display: flex; align-items: center; gap: 12px; max-width: 100%; }
  h2 { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 30px; font-weight: 600; letter-spacing: -.015em; outline: none; }
  .anchor { position: relative; flex: none; }
  .fpanel { box-sizing: border-box; width: 100%; min-height: 0; flex: 0 1 auto; display: flex; flex-direction: column; padding: 12px 8px 10px; }
  /* Inner scroller, inset from the card's rounded corners (Phase 3 L1); with the card's padding: the mockup's 32/36/28. */
  .scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px 28px 18px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 22px 26px; align-content: start; }
  .fpanel :global(.sq) { background: rgba(0, 0, 0, .24); }
  .fpanel :global(.nm) { color: rgba(244, 245, 249, .86); }
  .fmeta { flex: none; color: var(--vt-text-2); font-size: 13px; }
  .glass-pill.fclose { position: fixed; z-index: 2; top: 24px; right: 24px; }
  .glass-pill:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  /* Empty (frames-g4.css .g4-emptyp, .g4-idle). */
  .fpanel.emptyp { display: block; width: min(640px, 100%); padding: 40px 36px 36px; }
  .idle { position: relative; display: block; width: 96px; height: 96px; margin-bottom: 6px; }
  .emptyp .glass-empty__title { font-size: 19px; }
  .emptyp .glass-empty__text { max-width: 60ch; font-size: 14px; color: rgba(244, 245, 249, .74); text-wrap: balance; }
  .emptyp .glass-empty__action { margin-top: 14px; }
  .emptyp .glass-btn { height: 46px; font-size: 15px; }
  .emptyp .glass-btn svg { width: 18px; height: 18px; }

  /* Gone items (frames-g4.css .g4-note). */
  .note { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 16px; background: rgba(0, 0, 0, .26);
    font-size: 14px; color: rgba(244, 245, 249, .9); --gl-btn-height-sm: 36px; }
  .note > span:nth-child(2) { flex: 1; }
  .note b { display: block; font-weight: 600; color: var(--gl-color-error-on-surface, var(--gl-color-error)); }
  .ni svg { display: block; width: 20px; height: 20px; color: var(--vt-text-2); }
  .note .glass-btn { padding: 0 16px; color: var(--gl-color-text); }

  /* The "…" popover (MoreMenu's look), under the pill; a bottom sheet on phones. */
  .backdrop { position: fixed; inset: 0; z-index: 3; border: 0; padding: 0; background: rgba(8, 10, 16, .25); cursor: default; }
  .menu { position: absolute; z-index: 4; top: calc(100% + 10px); left: calc(50% - 135px); bottom: auto; width: 270px; padding: 6px 0; border-radius: 20px; transform: none;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); --gl-list-item-min-height: 44px; --gl-list-item-padding-y: 9px; }
  .menu .glass-list__item { cursor: pointer; }
  .glass-list__content { display: block; flex: 1; min-width: 0; }
  .glass-list__trailing svg { width: 19px; height: 19px; }
  .glass-divider { margin: 6px 0; }
  .menu .glass-list__item:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }

  @media (max-width: 600px) {
    .ov { padding: calc(var(--vt-top) + 60px) 8px var(--vt-bot); align-items: flex-start; }
    .fopen { width: 100%; gap: 14px; }
    h2 { font-size: 24px; }
    .fpanel { padding: 6px 4px; }
    .scroll { padding: 10px 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 10px; }
    .glass-pill.fclose { top: var(--vt-top); right: var(--vt-m); width: 48px; height: 48px; }
    .fpanel.emptyp { width: 100%; padding: 28px 16px 26px; }
    .note { flex-wrap: wrap; padding: 12px 12px 12px 14px; font-size: 13.5px; }
    .note > span:nth-child(2) { flex: 1 1 calc(100% - 40px); }
    .note .glass-btn { margin-left: 32px; height: 40px; }
    .backdrop { background: rgba(8, 10, 16, .45); }
    .menu { position: fixed; left: 8px; right: 8px; top: auto; bottom: var(--vt-bot, 12px); width: auto; padding: 18px 0 8px; border-radius: 30px; --gl-list-item-min-height: 50px; }
    .menu::before { content: ''; position: absolute; top: 7px; left: 50%; width: 36px; height: 5px; margin-left: -18px; border-radius: 3px; background: var(--gl-border-strong); }
  }
</style>
