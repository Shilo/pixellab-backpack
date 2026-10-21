<script lang="ts" module>
  import { getCounters, onActivity, type ActivityEntry } from '../api/http';

  type Counters = ReturnType<typeof getCounters>;

  const KEEP = 200; // ponytail: newest 200 only, memory-only log; raise or page it if a longer history is ever needed
  const STATUS: Record<string, string> = {
    ok: 'OK', slowed: 'Slowed down', paused: 'Paused (daily cap)', stopped: 'Stopped', offline: 'Offline', blocked: "Can't reach", 'key-lost': 'Key lost',
  };

  // Subscribed when this module loads, so requests made while the panel is closed are listed too. Newest first.
  let entries = $state.raw<ActivityEntry[]>([]);
  onActivity((e) => (entries = [e, ...entries].slice(0, KEEP)));

  const pad = (n: number) => String(n).padStart(2, '0');
  export const clock = (t: number) => {
    const d = new Date(t);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  export const sourceName = (e: ActivityEntry) => (e.source === 'api' ? 'PixelLab API' : 'Image host');
  export const size = (b?: number) => (b == null ? '-' : b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);
  export function resultName(e: ActivityEntry): string {
    if (e.result === 'ok') return 'OK';
    if (e.result === 'cap') return 'Blocked by daily cap';
    if (e.result === 'cancelled') return 'Cancelled';
    if (e.status === 401) return 'Wrong key (401)';
    if (e.status === 429) return 'Too many requests (429)';
    return e.status ? `Error (${e.status})` : 'Network error';
  }
  export const statusName = (s: string) => STATUS[s] ?? s;

  /** Browsers send PixelLab a hidden "may this site talk to you?" check the app cannot see, before keyed requests only, about once
   * per link per 10 minutes. Only a keyed first attempt that got an answer surely had one (`auth` marks first attempts).
   * A list page repeats its link; each asset's details or keyed picture has its own, so counts one each. */
  export function estimatePreflights(list: ActivityEntry[]): number {
    const sent = list.filter((e) => e.auth && e.status !== undefined);
    return new Set(sent.map((e, i) => (/page( \d+)?$/.test(e.label) ? `${e.label}|${Math.floor(e.time / 600_000)}` : i))).size;
  }

  /** Plain text for a bug report: labels and numbers only, never keys, ids or links. */
  export function formatLog(list: ActivityEntry[], c: Counters): string {
    const head = [
      `API requests this session: ${c.sessionApi}`,
      `API requests today: ${c.todayApi} of ${c.dailyCap}`,
      `Image-host loads: ${c.imageHost}`,
      `Hidden browser permission checks (estimate): about ${estimatePreflights(list)}`,
      `Status: ${statusName(c.status)}`,
      '',
    ];
    return [...head, ...list.map((e) => [clock(e.time), e.label, sourceName(e), resultName(e), size(e.bytes), `${e.ms} ms`].join(' | '))].join('\n');
  }

  /** Puts the plain-text log on the clipboard. */
  export async function copyLog(): Promise<'done' | 'failed'> {
    try {
      await navigator.clipboard.writeText(formatLog(entries, getCounters()));
      return 'done';
    } catch {
      return 'failed';
    }
  }
</script>

<script lang="ts">
  // The Activity panel: every request this tab sent to PixelLab, live. Reads the network module's counters and log,
  // plus the library's count of requests the saved copy made unnecessary.
  import { library } from '../data/library.svelte';

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();

  let counters = $state(getCounters());
  let copied = $state<'' | 'done' | 'failed'>('');
  let panel = $state<HTMLElement>();

  // Counters refresh when a request is logged and once a second while the panel is open.
  $effect(() => {
    if (!open) return;
    void entries; // re-read after every logged request
    counters = getCounters();
    const t = setInterval(() => (counters = getCounters()), 1000);
    return () => clearInterval(t);
  });

  // Focus moves into the panel and returns to the dock button on close; Esc closes only this layer (capture phase keeps it from the rest).
  $effect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    panel?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      back?.focus?.();
    };
  });

  async function copy() {
    copied = await copyLog();
    setTimeout(() => (copied = ''), 2000);
  }
</script>

{#if open}
  <button type="button" class="backdrop" tabindex="-1" aria-label="Close activity" onclick={onClose}></button>
  <div class="glass-popover is-open vt-scrim panel vt-grip" role="dialog" aria-label="Activity" tabindex="-1" bind:this={panel}>
    <header>
      <div>
        <h2>Activity</h2>
        <p class="sub">Every request this tab sends to PixelLab. Never your key, ids or links.</p>
      </div>
      <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={onClose}>Close</button>
    </header>

    <dl class="counters">
      <div><dt>API requests this session</dt><dd>{counters.sessionApi}</dd></div>
      <div><dt>API requests today</dt><dd>{counters.todayApi} of {counters.dailyCap}</dd></div>
      <div><dt>Image-host loads</dt><dd>{counters.imageHost}</dd></div>
      <div><dt>Status</dt><dd>{statusName(counters.status)}</dd></div>
      <div class="wide"><dt>Requests avoided by the saved copy</dt><dd>{library.avoided}</dd></div>
    </dl>
    <p class="note">Browsers also send PixelLab a small hidden permission check before key requests, which this list cannot show. Estimate: about {estimatePreflights(entries)}.</p>

    <div class="bar">
      <span class="vt-text-2">{entries.length} {entries.length === 1 ? 'request' : 'requests'}, newest first</span>
      <button type="button" class="glass-btn glass-btn--secondary glass-btn--sm glass-btn--auto" onclick={copy}>
        {copied === 'done' ? 'Copied' : copied === 'failed' ? "Couldn't copy" : 'Copy log'}
      </button>
    </div>

    {#if entries.length}
      <ul class="log">
        {#each entries as e (e)}
          <li class:bad={e.result === 'error' || e.result === 'cap'}>
            <span class="what">{e.label}</span>
            <span class="res">{resultName(e)}</span>
            <span class="meta">{clock(e.time)} · {sourceName(e)} · {size(e.bytes)} · {e.ms} ms</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty vt-text-2">Nothing yet. Requests show up here as they happen.</p>
    {/if}
  </div>
{/if}

<style>
  .backdrop { position: fixed; inset: 0; z-index: 1000; border: 0; padding: 0; background: rgba(8, 10, 16, .25); cursor: default; }
  .panel { position: fixed; z-index: 1010; top: auto; bottom: 100px; left: 50%; width: 460px; max-height: min(70vh, 600px); display: flex; flex-direction: column; gap: 12px;
    box-sizing: border-box; padding: 20px 18px 10px; border-radius: 28px; transform: translateX(-50%); outline: none;
    background: linear-gradient(var(--gl-surface-3), var(--gl-surface-3)), var(--vt-scrim); }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  h2 { font-size: 22px; font-weight: 600; }
  .sub { margin-top: 4px; font-size: 13px; color: var(--gl-color-text-muted); }
  .counters { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .counters .wide { grid-column: 1 / -1; }
  .counters div { padding: 8px 12px; border-radius: 14px; background: var(--gl-surface-1); border: 1px solid var(--gl-border-subtle); }
  dt { font-size: 12px; color: var(--gl-color-text-muted); }
  dd { margin-top: 2px; font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .note { font-size: 12.5px; color: var(--gl-color-text-muted); }
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
  .log { list-style: none; padding: 0; overflow-y: auto; overscroll-behavior: contain; min-height: 80px; }
  .log li { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 9px 4px; border-top: 1px solid var(--gl-border-subtle); }
  .what { font-weight: 500; overflow-wrap: anywhere; }
  .res { text-align: end; font-size: 13px; }
  .bad .res { color: var(--gl-color-warning); }
  .meta { grid-column: 1 / -1; font-size: 12.5px; color: var(--gl-color-text-muted); font-variant-numeric: tabular-nums; }
  .empty { padding: 18px 4px; text-align: center; }
  .panel :global(.glass-btn:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; }

  @media (max-width: 600px) {
    .backdrop { background: rgba(8, 10, 16, .45); }
    .panel { left: 8px; right: 8px; bottom: var(--vt-bot, 12px); width: auto; max-height: 80vh; padding: 22px 14px 10px; border-radius: 30px; transform: none; }
    h2 { font-size: 20px; }
  }
</style>
