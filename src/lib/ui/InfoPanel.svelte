<script lang="ts">
  // The viewer's Info panel: a side panel in wide landscape windows, otherwise a bottom sheet. Content comes from the pure info.ts.
  import { NEW_TAB } from '../app';
  import { infoRows, kicker, maskId, needsTierHint, pixellabLink, PLAYBACK_NOTE, tagsOf, technicalRows, textBlock, UI_NOTE } from '../info';
  import type { Card, Detail, FamilyId } from '../types';

  let { card, familyId, detail, detailState, checkedAt, onClose }: {
    card: Card;
    familyId: FamilyId;
    detail: Detail | null;
    detailState: 'none' | 'loading' | 'ok' | 'error' | 'offline';
    checkedAt: number | null;
    onClose: () => void;
  } = $props();

  const rows = $derived.by(() => {
    const r = infoRows(familyId, card, detail);
    // While the one detail request runs, say so where the animations will appear (objects have no count in their list row).
    if (detailState === 'loading' && !detail && (familyId === 'characters' || familyId === 'objects')) {
      const loading = { label: 'Animations', value: 'Loading animations…' };
      const at = r.findIndex((x) => x.label === 'Animations');
      if (at >= 0) r[at] = loading;
      else r.splice(r.findIndex((x) => x.label === 'View') + 1, 0, loading);
    }
    return r;
  });
  const block = $derived(textBlock(familyId, card));
  const tech = $derived(technicalRows(card, detail, checkedAt));
  const tags = $derived(tagsOf(card));

  let copied = $state<'text' | 'id' | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function copy(what: 'text' | 'id') {
    try {
      await navigator.clipboard.writeText(what === 'id' ? card.id : (block?.text ?? ''));
    } catch {
      return; // clipboard blocked: nothing to confirm
    }
    copied = what;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = null), 2000);
  }
  $effect(() => () => clearTimeout(timer));

  // Focus moves into the panel when it opens and returns to the opener on close.
  let root = $state<HTMLElement>();
  $effect(() => {
    const back = document.activeElement as HTMLElement | null;
    root?.focus();
    return () => back?.focus?.();
  });
</script>

{#snippet copyIcon(done: boolean)}
  {#if done}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  {:else}<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="3" /><path d="M5 15V7a3 3 0 0 1 3-3h8" /></svg>{/if}
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside class="info vt-scrim" aria-label="Info" tabindex="-1" bind:this={root} onkeydown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
  <button type="button" class="grip" aria-label="Close info" onclick={onClose}><span></span></button>
  <div class="body">
    <header>
      <h2>{card.name || 'Untitled'}</h2>
      <p class="vt-text-2">{kicker(familyId, card)}</p>
    </header>

    {#if rows.length}
      <dl class="facts">
        {#each rows as r}
          <div class="fact">
            <dt>{r.label}</dt>
            {#if r.label === 'Tags'}
              <dd class="chips">{#each tags as t}<span class="chip">{t}</span>{/each}</dd>
            {:else}
              <dd>{r.value}</dd>
            {/if}
          </div>
        {/each}
      </dl>
    {/if}
    {#if rows.some((r) => r.label === 'Playback')}<p class="note vt-text-2">{PLAYBACK_NOTE}</p>{/if}

    {#if block}
      <div class="blockhead">
        <h3>{block.label}</h3>
        <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={() => copy('text')}>
          {@render copyIcon(copied === 'text')}<span>Copy</span><span class="vt-sr"> {block.label.toLowerCase()}</span>
        </button>
      </div>
      <p class="block">{block.text}</p>
    {/if}
    {#if familyId === 'ui'}<p class="note vt-text-2">{UI_NOTE}</p>{/if}

    <details class="tech">
      <summary>Technical details</summary>
      <dl class="facts plain">
        <div class="fact"><dt>Asset ID</dt><dd class="mono">{maskId(card.id)}</dd></div>
        {#each tech as r}<div class="fact"><dt>{r.label}</dt><dd>{r.value}</dd></div>{/each}
      </dl>
      <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={() => copy('id')}>
        {@render copyIcon(copied === 'id')}<span>Copy asset ID</span>
      </button>
      <p class="warn vt-text-2">Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</p>
    </details>
  </div>

  <footer>
    {#if needsTierHint(familyId)}<p class="vt-text-2">Opening in PixelLab may need a paid plan.</p>{/if}
    <a class="glass-btn glass-btn--tertiary glass-btn--sm" href={pixellabLink(familyId, card)} target="_blank" rel="noopener noreferrer">
      Open in PixelLab ↗<span class="vt-sr">{NEW_TAB}</span>
    </a>
  </footer>
  <span class="vt-sr" role="status">{copied === 'id' ? 'Asset ID copied' : copied ? `${block?.label} copied` : ''}</span>
</aside>

<style>
  /* Bottom sheet by default: 58% of the window, content scrolls, grip on top. */
  .info { position: fixed; z-index: 700; left: 0; right: 0; bottom: 0; height: 58%; display: flex; flex-direction: column; box-sizing: border-box; outline: none;
    border-radius: 28px 28px 0 0; border: 1px solid var(--gl-border-subtle); border-bottom: 0;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); backdrop-filter: blur(var(--gl-blur)); -webkit-backdrop-filter: blur(var(--gl-blur));
    box-shadow: 0 -10px 40px rgba(0, 0, 0, .35); }
  .grip { flex: none; display: grid; place-items: center; height: 44px; margin: 0 auto; width: 120px; border: 0; padding: 0; background: none; cursor: pointer; }
  .grip span { width: 42px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, .35); }
  .grip:focus-visible { outline: 2px solid #fff; outline-offset: -4px; border-radius: 14px; }
  .body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 25px 12px; scrollbar-gutter: stable; }
  header h2 { font-size: 26px; line-height: 1.2; font-weight: 600; letter-spacing: -.01em; overflow-wrap: anywhere; }
  header p { font-size: 15px; margin-top: 4px; }

  .facts { margin: 18px 0 0; border-radius: 24px; padding: 2px 18px; background: rgba(255, 255, 255, .06); border: 1px solid var(--gl-border-subtle); }
  .facts.plain { margin: 10px 0 12px; padding: 0; background: none; border: 0; }
  .fact { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; padding: 14px 0; font-size: 15px; }
  .fact + .fact { border-top: 1px solid var(--gl-border-subtle); }
  .plain .fact { padding: 7px 0; border: 0; font-size: 14px; }
  dt { color: var(--vt-text-2); flex: none; }
  dd { margin: 0; text-align: end; white-space: pre-line; overflow-wrap: anywhere; min-width: 0; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .93em; }
  .chips { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
  .chip { padding: 3px 10px; border-radius: 12px; background: rgba(255, 255, 255, .1); font-size: 13.5px; }
  /* Narrow panel or large text: label above value. */
  @media (max-width: 360px) { .fact { flex-direction: column; gap: 2px; } dd, .chips { text-align: start; justify-content: flex-start; } }

  .note { font-size: 13.5px; margin: 10px 8px 0; }
  .blockhead { display: flex; justify-content: space-between; align-items: center; margin: 22px 0 8px 8px; }
  .blockhead h3 { font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--vt-text-2); }
  .info :global(.glass-btn) { min-height: 44px; gap: 8px; }
  .block { padding: 14px 18px; border-radius: 22px; background: rgba(255, 255, 255, .06); border: 1px solid var(--gl-border-subtle); font-size: 15px; line-height: 1.45; overflow-wrap: anywhere; user-select: text; }

  .tech { margin-top: 22px; padding: 0 18px 16px; border-radius: 24px; background: rgba(255, 255, 255, .06); border: 1px solid var(--gl-border-subtle); }
  .tech summary { display: flex; align-items: center; justify-content: space-between; min-height: 52px; font-size: 15px; font-weight: 600; cursor: pointer; list-style: none; }
  .tech summary::-webkit-details-marker { display: none; }
  .tech summary::after { content: ''; width: 9px; height: 9px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg); margin-right: 4px; transition: transform .15s; }
  .tech[open] summary::after { transform: rotate(-135deg); }
  .tech summary:focus-visible { outline: 2px solid #fff; outline-offset: 2px; border-radius: 12px; }
  .warn { font-size: 13.5px; margin-top: 12px; }

  /* The footer reserves the same scrollbar gutter as the body, so its button lines up with the cards above. */
  footer { flex: none; padding: 12px 25px max(16px, env(safe-area-inset-bottom)); overflow: hidden; scrollbar-gutter: stable; }
  footer p { font-size: 13.5px; text-align: center; margin-bottom: 8px; }
  footer .glass-btn { display: flex; width: 100%; justify-content: center; text-decoration: none; box-sizing: border-box; color: var(--gl-color-text); }

  /* Wide landscape windows: a floating side panel instead of the sheet. */
  @media (orientation: landscape) and (min-width: 840px) {
    .info { left: auto; top: 16px; right: 16px; bottom: 16px; width: 400px; height: auto; border-radius: 28px; border-bottom: 1px solid var(--gl-border-subtle); box-shadow: var(--gl-shadow-modal); }
    .grip { display: none; }
    .body { margin-top: 26px; } /* margin, not padding: the scrollbar starts below the rounded corner */
  }
</style>
