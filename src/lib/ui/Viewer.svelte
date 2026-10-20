<script lang="ts" module>
  // R8: speed, backdrop and the Info panel's open state last for the session only.
  const session = $state({ fps: 8, backdrop: 0, info: false });
</script>

<script lang="ts">
  import { tick, untrack } from 'svelte';
  import type { CategoryId } from '../categories';
  import { library } from '../data/library.svelte';
  import { kicker, pixellabLink } from '../info';
  import PixelArt from '../render/PixelArt.svelte';
  import { zoomLabel, zoomScale, zoomStep } from '../render/fit';
  import { createPlayer } from '../render/player.svelte';
  import { closeViewer, replaceViewer, router } from '../router.svelte';
  import type { Detail, Dir } from '../types';
  import { chipLabel, chipVisible, defaultAnim, dirsFor, pickDir } from '../viewer';
  import AnimPicker from './AnimPicker.svelte';
  import { COSTLY_WAIT_MS } from './AssetCell.svelte';
  import InfoPanel from './InfoPanel.svelte';
  import ViewerMenu, { BACKDROPS } from './ViewerMenu.svelte';

  // One asset, full window, over the grid (which stays mounted underneath). Keys: ←/→, Esc, Space only (R9).
  let { categoryId, assetKey }: { categoryId: CategoryId; assetKey: string } = $props();

  const hit = $derived(library.find(categoryId, assetKey));
  const cur = $derived(hit?.card.key ?? null); // a string: effects keyed on it re-run only when the asset changes
  // ponytail: 'slowed' counts as still checking (retries in flight); a key still unknown after the check closes the viewer.
  const waiting = $derived(library.status === 'idle' || library.status === 'checking' || library.status === 'slowed');
  const hasDetail = $derived(!!hit && !!library.family(hit.familyId).detail);

  const player = createPlayer();
  player.fps = session.fps;

  let art = $state<Blob | null>(null);
  let detail = $state.raw<Detail | null>(null);
  let detailState = $state<'none' | 'loading' | 'ok' | 'error' | 'offline'>('none');
  let anim = $state(-1);
  let dir = $state<Dir>('south');
  let frames = $state.raw<Blob[]>([]);
  let loaded = $state(0);
  let total = $state(0);
  let framesFailed = $state(false);
  let attempt = $state(0);
  let framesTry = $state(0);
  let zoom = $state<number | null>(null);
  let fit = $state<{ k: number; smooth: boolean; artW: number; artH: number } | null>(null);
  let titleOn = $state(true);
  let menu = $state(false);
  let closing = false;
  /** F-14: the animation type and direction carry over to the next asset when it has them. */
  const want: { type: string | null; dir?: Dir } = { type: null };

  let title = $state<HTMLElement>();
  let infoBtn = $state<HTMLButtonElement>();
  let moreBtn = $state<HTMLButtonElement>();
  let scroller = $state<HTMLDivElement>();

  // A new asset: static picture at once, name shown again, detail after 0.3 s on screen (R7), cancelled when the viewer moves on.
  $effect(() => {
    const key = cur;
    void attempt;
    if (!key) return;
    return untrack(() => {
      const { card, familyId } = hit!;
      const ctrl = new AbortController();
      art = null;
      detail = null;
      frames = [];
      total = loaded = 0;
      framesFailed = false;
      zoom = null;
      menu = false;
      player.load(0);
      titleOn = true;
      const fade = setTimeout(() => (titleOn = false), 2000);
      // ponytail: costly art (tilesets...) never resolved yet waits 0.3 s like the grid, so flipping past sends nothing.
      // No abort signal: a cancelled costly picture would be dropped from the cache and asked a second time.
      const costly = library.family(familyId).artCostsApi && !card.thumb;
      const artT = setTimeout(() => library.art(card, familyId).then((b) => cur === key && (art = b)), costly ? COSTLY_WAIT_MS : 0);
      let detT: ReturnType<typeof setTimeout> | undefined;
      if (hasDetail) {
        detailState = 'loading';
        // ponytail: a saved detail also waits the 0.3 s (library.detail reads the saved copy itself); worth it to keep one path.
        detT = setTimeout(() => {
          library
            .detail(card, familyId, ctrl.signal)
            .then((d) => {
              if (ctrl.signal.aborted || !d) return;
              detail = d;
              detailState = 'ok';
              anim = defaultAnim(d.animations, want.type);
              dir = pickDir(dirsFor(d, anim), want.dir);
            })
            .catch(() => {
              if (!ctrl.signal.aborted) detailState = library.status === 'offline' ? 'offline' : 'error';
            });
        }, COSTLY_WAIT_MS);
      } else detailState = 'none';
      return () => {
        clearTimeout(fade);
        clearTimeout(artT);
        clearTimeout(detT);
        ctrl.abort();
      };
    });
  });

  // Frames of exactly the shown animation × direction (or the one rotation), image host only. The old set stays on screen until the new one is in.
  $effect(() => {
    const d = detail;
    void framesTry;
    if (!d) return;
    const urls = anim < 0 ? [d.rotations[dir]].filter((u): u is string => !!u) : (d.animations[anim]?.frames[dir] ?? []);
    const fam = untrack(() => hit!.familyId);
    const ctrl = new AbortController();
    const sig = ctrl.signal;
    total = urls.length;
    loaded = 0;
    framesFailed = false;
    // ponytail: a null can be an earlier run's cancelled fetch still in the shared cache; ask once more (a real 404 stays cached, no request).
    const get = (u: string) => library.picture(u, fam, sig).then((b) => b ?? (sig.aborted ? null : library.picture(u, fam, sig)));
    Promise.all(urls.map((u) => get(u).then((b) => (sig.aborted || loaded++, b)))).then((bs) => {
      if (sig.aborted || !bs.length) return;
      if (bs.some((b) => !b)) return void (framesFailed = true);
      frames = bs as Blob[];
      player.load(bs.length);
    });
    return () => ctrl.abort();
  });

  $effect(() => () => {
    session.fps = player.fps;
    player.destroy();
  });

  // Focus moves to the title (the Info panel takes it instead when it opens with the viewer).
  $effect(() => {
    if (title && !untrack(() => session.info)) title.focus();
  });

  // A key unknown after the open check: back to the grid.
  $effect(() => {
    if (!hit && !waiting) close();
  });

  function close() {
    if (closing) return; // one Back step, even for a double tap
    closing = true;
    closeViewer();
  }

  const states = $derived(hit ? library.states(hit.card, hit.familyId) : []);
  const stateLabel = (c: { meta: Record<string, unknown> }) => (typeof c.meta.state_name === 'string' && c.meta.state_name.trim()) || 'Base';
  const allDirs = $derived(detail ? [...new Set([-1, ...detail.animations.keys()].flatMap((a) => dirsFor(detail!, a)))] : []);
  const showChip = $derived(detail ? chipVisible(detail, states.length) : detailState === 'loading');
  const fitLabel = $derived(fit ? zoomLabel(zoom, fit.k, fit.smooth, devicePixelRatio) : 'Fit');
  // Zoomed: the art box takes the zoomed size so the stage scrolls natively over all of it (nothing clipped, nothing above 0).
  const zoomed = $derived(zoom !== null && fit ? zoomScale(fit.artW, fit.artH, zoom, devicePixelRatio) : null);
  const onmeasure = (m: { k: number; smooth: boolean; artW: number; artH: number }) => {
    if (zoom === null) fit = m; // zoomed boxes report the zoomed size, not Fit
  };

  function setAnim(i: number) {
    if (!detail) return;
    anim = i;
    want.type = i < 0 ? null : detail.animations[i].type;
    dir = pickDir(dirsFor(detail, i), dir);
  }
  function setDir(d: Dir) {
    dir = want.dir = d;
  }
  function setState(key: string) {
    if (key !== assetKey) replaceViewer(key);
  }

  function setZoom(z: number | null) {
    zoom = z;
    tick().then(() => {
      if (!scroller) return;
      scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
      scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
    });
  }

  /** Prev/next in grid order (one card per character group). Next at the last loaded card asks for the family's next page first. */
  async function nav(d: 1 | -1) {
    if (!hit) return;
    const { card, familyId } = hit;
    const g = card.meta.group_id;
    const at = (l: ReturnType<typeof library.items>) =>
      l.findIndex((it) => it.card.key === card.key || (typeof g === 'string' && !!g && it.familyId === familyId && it.card.meta.group_id === g));
    let list = library.items(categoryId);
    let i = at(list) + d;
    if (d === 1 && i === list.length && list.length) {
      const last = list[list.length - 1].familyId;
      const s = library.families[last];
      if (!s || s.cards.length >= s.total) return;
      await library.loadMore(last);
      if (router.route.name !== 'category' || router.route.key !== card.key) return; // moved on or closed meanwhile
      list = library.items(categoryId);
      i = at(list) + 1;
    }
    if (i >= 0 && i < list.length) {
      titleOn = true;
      replaceViewer(list[i].card.key);
    }
  }

  function toggleInfo() {
    session.info = !session.info;
    if (!session.info) tick().then(() => infoBtn?.focus());
  }

  // Bubble phase: the picker and the "…" menu stop Esc in the capture phase, the Info panel on itself, so Esc closes only the topmost layer.
  function onkeydown(e: KeyboardEvent) {
    if (router.activity || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.closest?.('[role="dialog"]:not(.viewer)')) return;
    if (e.key === 'Escape') session.info ? toggleInfo() : close();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      void nav(e.key === 'ArrowRight' ? 1 : -1);
    } else if (e.key === ' ' && !t.closest?.('button, a, input, summary, aside')) {
      e.preventDefault();
      player.toggle();
    }
  }

  // A horizontal swipe at Fit (> 50 px, mostly horizontal) goes to prev/next; a tap toggles play.
  let start: { x: number; y: number } | null = null;
  let swiped = false;
  function onpointerdown(e: PointerEvent) {
    swiped = false;
    start = zoom === null ? { x: e.clientX, y: e.clientY } : null;
  }
  function onpointerup(e: PointerEvent) {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      void nav(dx < 0 ? 1 : -1);
    }
  }
  function onclick() {
    if (swiped) swiped = false;
    else player.toggle();
  }

  const failText = $derived(
    detailState === 'offline' || (framesFailed && library.status === 'offline')
      ? "This animation isn't saved on this device. Connect to the internet to see it."
      : detailState === 'error' || framesFailed
        ? "Couldn't load this asset's animations."
        : null,
  );
  const retry = () => (detail ? framesTry++ : attempt++);
</script>

<svelte:window {onkeydown} />

<div class="viewer" class:info={session.info && !!hit} role="dialog" aria-modal="true" aria-labelledby={hit ? 'vw-title' : undefined} aria-label={hit ? undefined : 'Loading'}>
  <div class="stage" style:background={session.backdrop ? BACKDROPS[session.backdrop].css : null}></div>
  <button type="button" class="glass-pill vt-scrim close" aria-label="Close" onclick={close}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
  </button>

  {#if !hit}
    <span class="vt-sr" role="status">Loading…</span>
  {:else}
    {@const { card, familyId } = hit}
    <!-- Space is the keyboard path for play/pause (window listener). -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="art" class:zoomed={zoom !== null} bind:this={scroller} {onclick} {onpointerdown} {onpointerup} onpointercancel={() => (start = null)}>
      <div class="box" style:width={zoomed ? `${zoomed.cssW}px` : null} style:height={zoomed ? `${zoomed.cssH}px` : null}>
        <PixelArt blob={frames.length ? null : art} frames={frames.length ? frames : undefined} frame={player.index} alt={card.name || 'Untitled'} fill {zoom} {onmeasure} />
      </div>
    </div>

    <div class="vtitle" class:off={!titleOn}>
      <h2 id="vw-title" tabindex="-1" bind:this={title}>{card.name || 'Untitled'}</h2>
      <p>{kicker(familyId, card)}</p>
    </div>

    <nav class="glass-tab-bar glass-tab-bar--floating vt-caps vt-scrim caps" aria-label="Asset actions">
      <button type="button" class="glass-tab-bar__item vt-icon" class:is-active={session.info} aria-label="Info" aria-pressed={session.info} bind:this={infoBtn} onclick={toggleInfo}>
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.6v.1" /></svg></span>
      </button>
      <button type="button" class="glass-tab-bar__item vt-icon" class:is-active={menu} aria-label="More" aria-haspopup="dialog" aria-expanded={menu} bind:this={moreBtn} onclick={() => (menu = !menu)}>
        <span class="glass-tab-bar__icon"><svg viewBox="0 0 24 24" class="dots" aria-hidden="true"><circle cx="5.5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18.5" cy="12" r="1.7" /></svg></span>
      </button>
    </nav>

    {#if detail && total && loaded < total && !framesFailed}
      <div class="glass-popover is-open vt-scrim card hud" role="status">
        <svg class="ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="8.5" pathLength="8" stroke-dasharray="3 8" /></svg>
        <span>Loading frames {loaded}/{total}</span>
      </div>
    {:else if failText}
      <div class="glass-popover is-open vt-scrim card msg" role="status">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.6v5.2M12 16.3v.1" /></svg>
        <span>{failText}</span>
        {#if detailState !== 'offline' && library.status !== 'offline'}
          <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={retry}>Try again</button>
        {/if}
      </div>
    {/if}

    {#if showChip}
      <div class="vdock">
        <div class="glass-tab-bar glass-tab-bar--floating vt-dock vt-scrim">
          <AnimPicker
            label={detail ? chipLabel(detail, anim, dir, stateLabel(card), states.length) : ''}
            loading={!detail}
            anims={detail?.animations ?? []}
            {anim}
            dirs={detail ? dirsFor(detail, anim) : []}
            {allDirs}
            {dir}
            states={states.map((s) => ({ key: s.key, label: stateLabel(s) }))}
            stateKey={card.key}
            onAnim={setAnim}
            onDir={setDir}
            onState={setState}
          />
        </div>
      </div>
    {/if}

    <ViewerMenu
      open={menu}
      onClose={() => (menu = false)}
      opener={moreBtn}
      player={hasDetail ? player : null}
      zoomLabel={fitLabel}
      onZoom={(d) => fit && setZoom(zoomStep(zoom, fit.k, d, devicePixelRatio))}
      onZoomToggle={() => setZoom(zoom === null ? 1 : null)}
      backdrop={session.backdrop}
      onBackdrop={(i) => (session.backdrop = i)}
      link={pixellabLink(familyId, card)}
    />

    {#if session.info}
      <InfoPanel {card} {familyId} {detail} {detailState} checkedAt={library.families[familyId]?.checkedAt ?? null} onClose={toggleInfo} />
    {/if}
  {/if}
</div>

<style>
  /* Above the grid, dock and notices (z 900); Activity (1000+) still opens over it. Layers inside: chrome 750, dock 800 (its picker's backdrop
     must cover the Info panel at 700), the "…" menu 1000+. Nothing here has a transform or filter, so the menus' fixed boxes use the window. */
  .viewer { position: fixed; inset: 0; z-index: 950; --cx: 50%; --side: 0px; }
  .stage { position: fixed; inset: 0; background: radial-gradient(760px 560px at var(--cx) 48%, #2a2c34, #16171c 58%, #0c0c0f); }
  .art { position: absolute; inset: 104px 72px 116px; overflow: hidden; touch-action: pan-y pinch-zoom; } /* horizontal swipes reach us; pinch stays */
  .art.zoomed { inset: 0 var(--side) 0 0; overflow: auto; touch-action: auto; }
  .box { position: relative; width: 100%; height: 100%; min-width: 100%; min-height: 100%; }

  .close { position: fixed; z-index: 750; top: 24px; left: 24px; }
  .close:focus-visible, .caps :global(.glass-tab-bar__item:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; }
  .vtitle { position: fixed; z-index: 740; top: 28px; left: calc(var(--cx) - 25vw); width: 50vw; text-align: center; line-height: 1.3; pointer-events: none; transition: opacity .5s; }
  .vtitle.off, .info .vtitle { opacity: 0; }
  .vtitle h2 { font-size: 15px; font-weight: 600; outline: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vtitle p { color: var(--vt-text-2); font-size: 13px; }
  .caps { position: fixed; z-index: 750; top: 24px; right: calc(24px + var(--side)); padding: 4px; gap: 2px; --gl-tab-bar-active-bg: rgba(255, 255, 255, .92); --gl-tab-bar-active-color: #111319; }
  .caps .vt-icon { width: 44px; height: 44px; padding: 0; justify-content: center; color: var(--gl-color-text); }
  .caps .vt-icon.is-active { background: rgba(255, 255, 255, .92); color: #111319; }
  .caps .vt-icon.is-active svg { stroke: #111319; }

  .vdock { position: fixed; z-index: 800; left: 0; right: var(--side); bottom: var(--gl-tab-bar-floating-bottom); display: flex; justify-content: center; pointer-events: none; }
  .vdock > .glass-tab-bar { pointer-events: auto; backdrop-filter: none; -webkit-backdrop-filter: none; background-color: var(--vt-scrim); }

  .card { position: fixed; z-index: 760; top: auto; bottom: 112px; left: 0; right: var(--side); margin-inline: auto; width: max-content; max-width: min(460px, calc(100vw - 24px));
    transform: none; display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 20px; font-size: 14px; box-sizing: border-box; }
  .card svg { width: 20px; height: 20px; flex: none; }
  .hud { padding: 8px 16px; border-radius: 999px; gap: 8px; }
  .msg { padding: 12px 12px 12px 16px; }
  .msg span { flex: 1; line-height: 1.4; }
  .msg .glass-btn { min-height: 44px; padding: 0 14px; margin-left: 4px; flex: none; }
  .ring circle { stroke: rgba(255, 255, 255, .22); stroke-width: 2.4; }
  .ring circle + circle { stroke: #fff; transform: rotate(-90deg); transform-origin: center; }

  @media (prefers-reduced-motion: reduce) { .vtitle { transition: none; } }

  /* Info as a side panel (same query as InfoPanel's): the stage, title, capsule and dock make room for it. */
  @media (orientation: landscape) and (min-width: 840px) {
    .viewer.info { --cx: calc((100% - 420px) / 2); --side: 420px; }
    .info .art:not(.zoomed) { right: 492px; }
  }
  /* Info as a bottom sheet: the art moves up and the dock hides. */
  @media not all and (orientation: landscape) and (min-width: 840px) {
    .info .art:not(.zoomed) { top: 80px; bottom: 58%; left: 12px; right: 12px; }
    .info .vdock, .info .card { display: none; }
  }

  /* Phone portrait: art between the top controls and the dock, 12 px margins, safe areas. */
  @media (max-width: 600px) {
    .art { inset: 116px 12px 104px; }
    .close { top: var(--vt-top); left: var(--vt-m); width: 48px; height: 48px; }
    .caps { top: var(--vt-top); right: var(--vt-m); }
    .vtitle { top: calc(var(--vt-top) + 60px); left: var(--vt-m); width: auto; right: var(--vt-m); }
    .vdock { left: var(--vt-m); right: var(--vt-m); bottom: var(--vt-bot); }
    .vdock > .glass-tab-bar { width: 100%; padding: 6px; }
    .vdock :global(.vt-chip) { flex: 1; justify-content: center; }
    .card { bottom: calc(var(--vt-bot) + 80px); }
    /* A bottom sheet (picker or "…") replaces the dock; its glass would show the chip through. */
    .vdock:has(:global(.pick)) > .glass-tab-bar, .viewer:has(:global(.menu)) .vdock > .glass-tab-bar { background: none; border-color: transparent; box-shadow: none; }
    .vdock:has(:global(.pick)) :global(.vt-chip), .viewer:has(:global(.menu)) .vdock :global(.vt-chip) { visibility: hidden; }
  }
</style>
