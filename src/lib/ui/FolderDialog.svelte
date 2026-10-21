<script lang="ts">
  // Folder name (new, rename) and the delete confirm (mockups g4-folder-name, g4-confirm-delete-folder): a native modal <dialog>
  // with a GlassKit alert modal, as in Settings. Focus returns to the opener when it closes.
  import { tick } from 'svelte';
  import { library } from '../data/library.svelte';
  import { createFolder, deleteFolder, nameError, renameFolder, type Folder } from '../data/org.svelte';
  import type { Item } from '../types';

  let { mode, onDone, onClose }: {
    mode: { kind: 'new'; add?: Item } | { kind: 'rename'; folder: Folder } | { kind: 'delete'; folder: Folder } | null;
    onDone: (id?: string) => void; onClose: () => void;
  } = $props();

  let dlg = $state<HTMLDialogElement>();
  let field = $state<HTMLInputElement>();
  let name = $state('');
  let busy = false;
  const uid = $props.id(); // several instances may be mounted

  const err = $derived(!mode || mode.kind === 'delete' ? null : nameError(name, mode.kind === 'rename' ? mode.folder.id : undefined));
  const dup = $derived(err !== nameError('') ? err : null); // R8: only the duplicate is shown; a bad length just disables the button
  const n = $derived(mode?.kind === 'delete' ? library.pick(mode.folder.items).items.length : 0); // as the overlay counts (R3, R7)
  let failed = $state(false); // the write itself failed: nothing was saved, the dialog stays

  $effect(() => {
    if (mode && dlg && !dlg.open) {
      failed = false;
      if (mode.kind !== 'delete') name = mode.kind === 'rename' ? mode.folder.name : 'New folder';
      dlg.showModal(); // focuses the field, or Cancel in the confirm
      tick().then(() => field?.select());
    } else if (!mode && dlg?.open) dlg.close();
  });

  async function submit() {
    if (!mode || busy || err) return;
    busy = true;
    failed = false;
    try {
      if (mode.kind === 'delete') {
        await deleteFolder(mode.folder.id);
        onDone();
      } else if (mode.kind === 'rename') {
        await renameFolder(mode.folder.id, name);
        if (nameError(name, mode.folder.id)) return; // another tab took the name meanwhile: the error shows and the dialog stays
        onDone();
      } else {
        const add = mode.add && { it: mode.add, keys: library.states(mode.add.card, mode.add.familyId).map((c) => c.key) };
        const id = await createFolder(name, add);
        if (!id) return; // refused (the name was taken meanwhile): the error shows and the dialog stays
        onDone(id);
      }
      dlg?.close();
    } catch {
      failed = true;
    } finally {
      busy = false;
    }
  }

  function onkeydown(e: KeyboardEvent) {
    e.stopPropagation(); // Esc closes only this dialog, not the search, viewer or menu under it
    if (e.key === 'Enter' && e.target === field && !e.isComposing) {
      e.preventDefault();
      void submit();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dlg}
  class="glass-modal-overlay is-active"
  role={mode?.kind === 'delete' ? 'alertdialog' : undefined}
  aria-labelledby="{uid}-title"
  aria-describedby={mode?.kind === 'delete' ? `${uid}-body` : undefined}
  onclose={onClose}
  {onkeydown}
>
  {#if mode}
    <div class="glass-modal">
      <div class="glass-modal__header">
        <h2 class="glass-modal__title" id="{uid}-title">
          {mode.kind === 'new' ? 'New folder' : mode.kind === 'rename' ? 'Rename folder' : `Delete "${mode.folder.name}"?`}
        </h2>
      </div>
      <div class="glass-modal__body">
        {#if mode.kind === 'delete'}
          <p id="{uid}-body">{n === 1 ? 'The asset in it stays in your library.' : `The ${n} assets in it stay in your library.`} Only the folder goes away.</p>
        {:else}
          <input
            bind:this={field}
            bind:value={name}
            class="glass-input"
            class:glass-input--error={dup}
            aria-label="Folder name"
            autocomplete="off"
            aria-invalid={!!dup}
            aria-describedby={dup ? `${uid}-err` : undefined}
          />
          {#if dup}<p class="glass-hint glass-hint--error err" id="{uid}-err">{dup}</p>{/if}
        {/if}
        {#if failed}<p class="glass-hint glass-hint--error err" role="alert">Couldn't save. Try again.</p>{/if}
      </div>
      <div class="glass-modal__footer">
        <button type="button" class="glass-modal__action" onclick={() => dlg?.close()}>Cancel</button>
        {#if mode.kind === 'delete'}
          <button type="button" class="glass-modal__action glass-modal__action--danger" onclick={submit}>Delete folder</button>
        {:else}
          <button type="button" class="glass-modal__action glass-modal__action--primary" disabled={!!err} onclick={submit}>{mode.kind === 'new' ? 'Create' : 'Save'}</button>
        {/if}
      </div>
    </div>
  {/if}
</dialog>

<style>
  dialog.glass-modal-overlay { background: rgba(8, 10, 16, .6); }
  .glass-modal { background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), #14161e; }
  .glass-input { box-sizing: border-box; width: 100%; margin-top: 4px; }
  .glass-modal__body p.err { margin-top: 8px; padding: 0; text-align: start; font-size: 13px; color: var(--gl-color-error-on-surface); }
  .glass-modal__action:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
</style>
