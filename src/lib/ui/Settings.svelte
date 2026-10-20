<script lang="ts">
  // Settings: PixelLab connection + About, as a native modal <dialog> (R3: Esc and Android Back close it, no route).
  // The two confirms are GlassKit alert modals in a second dialog stacked above it.
  import { APP_NAME, APP_SHORT } from '../app';
  import { library } from '../data/library.svelte';

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();

  const PIXELLAB = 'https://www.pixellab.ai';
  // Every library page per R4. ponytail: no Source-code row until a public repo exists.
  const OTHER = [
    ['Fonts', '/create'],
    ['Effects', '/create-vfx'],
    ['Portraits', '/create-character'],
    ['Talking animations', '/create-character'],
  ] as const;

  let sheet = $state<HTMLDialogElement>();
  let alert = $state<HTMLDialogElement>();
  let confirm = $state<'stop' | 'forget' | null>(null);
  let failed = $state(false); // Forget key: the key is gone but the saved library could not be cleared

  // Native close restores focus to whatever held it at showModal(): the dock's "…" button.
  $effect(() => {
    if (open && sheet && !sheet.open) sheet.showModal();
    else if (!open && sheet?.open) sheet.close();
  });
  $effect(() => {
    if (confirm && alert && !alert.open) alert.showModal();
    else if (!confirm && alert?.open) alert.close();
  });

  function keep(e: Event & { currentTarget: HTMLInputElement }) {
    const box = e.currentTarget;
    if (box.checked) {
      library.setKeepSignedIn(true);
      box.checked = library.keepSignedIn; // stays off if the browser refused the write
    } else {
      box.checked = true; // off waits for the confirm; Cancel leaves it on
      confirm = 'stop';
    }
  }

  async function accept() {
    if (confirm === 'stop') {
      confirm = null;
      return library.setKeepSignedIn(false);
    }
    failed = false;
    try {
      await library.forget(); // the key screen takes over behind us (R12: no toast)
      confirm = null;
      onClose();
    } catch {
      failed = true; // stays open; Forget key again retries the clearing
    }
  }

  // The dialog IS the sheet, so its padding is also the click target: close only for a click outside its box.
  // (A keyboard click targets the focused control, never the sheet.)
  function backdrop(e: MouseEvent) {
    const r = sheet?.getBoundingClientRect();
    if (e.target !== sheet || !r) return;
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) sheet?.close();
  }

  const hint = $derived(library.hasKey ? library.keyHint() : null); // keyHint() is not reactive: hasKey re-reads it after a connect
</script>

{#snippet ext(href: string, label: string)}
  <a {href} target="_blank" rel="noopener noreferrer">{label}<span aria-hidden="true"> ↗</span><span class="vt-sr"> (opens in a new tab)</span></a>
{/snippet}

<dialog
  bind:this={sheet}
  class="sheet vt-scrim"
  aria-labelledby="st-title"
  onclose={onClose}
  onclick={backdrop}
>
  <header>
    <h2 id="st-title">Settings</h2>
    <button type="button" class="x" aria-label="Close settings" onclick={() => sheet?.close()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
  </header>

  <h3>PixelLab connection</h3>
  <div class="card">
    <div class="row">
      <span class="txt">
        <b class="status"><i aria-hidden="true"></i>{library.hasKey ? 'Connected' : 'Disconnected'}</b>
        {#if hint}<span class="sub">API key ending ••••{hint}</span>{/if}
      </span>
    </div>
    <label class="row">
      <span class="txt">
        <b>Keep me signed in</b>
        <span class="sub" id="st-keep-help">
          {library.keepSignedIn
            ? "Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers."
            : "Kept in this tab only. You'll paste it again in a new tab."}
        </span>
      </span>
      <span class="sw">
        <input type="checkbox" role="switch" class="glass-toggle__input" checked={library.keepSignedIn} aria-describedby="st-keep-help" onchange={keep} />
        <span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span>
      </span>
    </label>
    <button type="button" class="row danger" onclick={() => ((failed = false), (confirm = 'forget'))}>Forget key</button>
  </div>
  <p class="foot">Need to revoke this key? {@render ext(`${PIXELLAB}/account`, 'Generate a new API key in your PixelLab account')}</p>

  <h3>About</h3>
  <div class="card">
    <div class="row">
      <span class="txt"><b>{APP_NAME}</b><span class="sub">Version {__APP_VERSION__}</span></span>
    </div>
    <div class="row prose">
      <p>{APP_NAME} is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p>
      <p>No analytics, no tracking, no servers. {APP_NAME} talks only to PixelLab's API and image host.</p>
    </div>
    <div class="row prose">
      <p><b>Other PixelLab content isn't in the public API yet.</b> Fonts, effects, portraits and talking animations can't be read through PixelLab's public API, so {APP_NAME} can't show them. Find them in PixelLab:</p>
      <ul class="links">
        {#each OTHER as [label, path] (label)}<li>{@render ext(PIXELLAB + path, label)}</li>{/each}
      </ul>
    </div>
    <div class="row prose">{@render ext('/licenses.txt', 'Licences')}</div>
  </div>
</dialog>

<dialog bind:this={alert} class="glass-modal-overlay is-active" aria-labelledby="st-confirm-title" onclose={() => (confirm = null)}>
  <div class="glass-modal">
    {#if confirm === 'stop'}
      <div class="glass-modal__header"><h2 class="glass-modal__title" id="st-confirm-title">Stop keeping you signed in?</h2></div>
      <div class="glass-modal__body"><p>{APP_SHORT} will delete your saved API key from this browser. You'll stay connected in this tab.</p></div>
    {:else if confirm === 'forget'}
      <div class="glass-modal__header"><h2 class="glass-modal__title" id="st-confirm-title">Forget your API key?</h2></div>
      <div class="glass-modal__body">
        <p>{APP_SHORT} will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.</p>
        <p class="cache"><em>Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</em></p>
        {#if failed}<p class="err" role="alert">Your key was removed, but the saved library couldn't be cleared. Try again or clear this site's data in your browser.</p>{/if}
      </div>
    {/if}
    <div class="glass-modal__footer">
      <button type="button" class="glass-modal__action" onclick={() => (confirm = null)}>Cancel</button>
      <button type="button" class="glass-modal__action glass-modal__action--danger" onclick={accept}>{confirm === 'stop' ? 'Stop' : 'Forget key'}</button>
    </div>
  </div>
</dialog>

<style>
  .sheet { position: fixed; inset: 0; box-sizing: border-box; width: 520px; max-width: calc(100vw - 16px); max-height: min(88vh, 760px); margin: auto; padding: 22px 18px 18px;
    overflow-y: auto; overscroll-behavior: contain; border-radius: 28px; color: var(--gl-color-text); border: 1.5px solid var(--gl-border-medium);
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), #14161e; box-shadow: var(--gl-shadow-modal); }
  .sheet::backdrop { background: rgba(8, 10, 16, .45); backdrop-filter: blur(6px); }
  header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; padding-inline: 4px; }
  h2 { font-size: 22px; font-weight: 600; }
  h3 { margin: 18px 6px 8px; font-size: 13px; font-weight: 600; letter-spacing: .3px; text-transform: uppercase; color: var(--gl-color-text-muted); }
  .x { flex: none; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--gl-border-medium); background: var(--gl-surface-2); cursor: pointer; }
  .card { border-radius: 20px; border: 1px solid var(--gl-border-subtle); background: var(--gl-surface-1); overflow: hidden; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 14px; box-sizing: border-box; width: 100%; min-height: 56px; padding: 10px 18px; border: 0; background: none; text-align: start; font-size: 15px; }
  .row + .row { border-top: 1px solid var(--gl-border-subtle); }
  button.row, label.row { cursor: pointer; }
  .txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .txt b { font-weight: 600; }
  .sub { font-size: 13.5px; color: var(--gl-color-text-muted); overflow-wrap: anywhere; }
  .status { display: flex; align-items: center; gap: 8px; }
  .status i { width: 10px; height: 10px; border-radius: 50%; background: var(--gl-color-success, #34c759); }
  .danger { color: var(--gl-color-error); font-weight: 600; }
  .sw { position: relative; flex: none; display: flex; }
  .sw .glass-toggle__input { top: 0; left: 0; margin: 0; }
  .prose { display: block; font-size: 14px; line-height: 1.5; color: var(--gl-color-text-muted); }
  .prose p + p { margin-top: 8px; }
  .prose b { color: var(--gl-color-text); }
  .links { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 8px 0 0; padding: 0; list-style: none; }
  .links a, .prose > a { display: inline-block; padding: 12px 0; } /* 44 px tall targets */
  .foot { margin: 10px 6px 0; font-size: 13.5px; line-height: 1.5; color: var(--gl-color-text-muted); }
  a { color: #8dbbff; text-decoration: underline; text-underline-offset: 2px; }
  dialog.glass-modal-overlay { background: rgba(8, 10, 16, .6); }
  .glass-modal { background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), #14161e; }
  .cache { margin-top: 10px; font-size: 13px; }
  .err { margin-top: 10px; color: var(--gl-color-error); }
  :is(.x, .row, a):focus-visible, .sw :focus-visible + .glass-toggle__track { outline: 2px solid #fff; outline-offset: -2px; }
  a:focus-visible { outline-offset: 2px; }

  @media (max-width: 600px) {
    .sheet { inset: auto 8px var(--vt-bot, 12px) 8px; width: auto; max-width: none; max-height: 90vh; margin: 0; padding: 26px 14px 14px; border-radius: 30px; }
    .sheet::before { content: ''; position: absolute; top: 7px; left: 50%; width: 36px; height: 5px; margin-left: -18px; border-radius: 3px; background: var(--gl-border-strong); }
  }
</style>
