<script lang="ts">
  // The API key screen (S1): paste or "Test key", every state of the key test. On success App switches on library.hasKey.
  import { onMount, tick } from 'svelte';
  import { APP_NAME, APP_SHORT } from '../app';
  import { library } from '../data/library.svelte';

  type Phase = 'idle' | 'testing' | 'empty' | 'invalid' | 'offline' | 'blocked';

  let key = $state(''); // only ever in this component, the field and library.connect; never logged
  let show = $state(false);
  let phase = $state<Phase>('idle');
  let input: HTMLInputElement | undefined = $state();

  // A saved list without a key means a new tab (the key lives in one tab only): no storage read needed.
  const welcomeBack = $derived(Object.keys(library.families).length > 0);
  const testing = $derived(phase === 'testing');

  async function test() {
    if (testing) return;
    const k = key.trim();
    if (!k) {
      phase = 'empty';
      input?.focus();
      return;
    }
    phase = 'testing';
    const result = await library.connect(k);
    if (result === 'ok') return; // App swaps this screen out
    phase = result === 'wrong-key' ? 'invalid' : result;
    if (phase === 'invalid') {
      await tick();
      input?.focus();
    }
  }

  // Paste tests at once (the field helper promises it). The pasted text lands in the field first.
  const onpaste = () => setTimeout(test); // after the browser has inserted the text

  onMount(() => {
    if (matchMedia('(pointer: fine)').matches) input?.focus(); // coarse pointers: no autofocus, the keyboard would cover the form
  });

  const hint = $derived(
    {
      empty: 'Paste your API key first.',
      invalid: "That API key didn't work. Copy it again from your PixelLab account page and paste it here.",
      offline: "You're offline. Connect to the internet and try again.",
    }[phase as 'empty' | 'invalid' | 'offline'] ?? null,
  );
</script>

{#if phase === 'blocked'}
  <main class="g1-state">
    <div class="glass-empty g1-empty vt-scrim">
      <span class="glass-empty__icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></svg>
      </span>
      <h2 class="glass-empty__title">PixelLab is blocking this browser</h2>
      <p class="glass-empty__text">PixelLab may have changed how its API works with websites. Nothing is wrong with your account.</p>
      <div class="glass-empty__action">
        <button type="button" class="glass-btn glass-btn--primary glass-btn--auto" onclick={test}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" /></svg>Try again
        </button>
      </div>
    </div>
  </main>
{:else}
  <main class="g1-connect">
    <section class="g1-intro">
      <div class="g1-mark">
        <span class="g1-logo"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" /></svg></span>
        <b>{APP_NAME}</b>
      </div>
      <h2 class="g1-h">Your PixelLab art, all in one place</h2>
      <p class="g1-value">{APP_SHORT} shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything.</p>
    </section>

    <section class="glass-card glass-card--glow g1-form">
      {#if welcomeBack}
        <div class="g1-note g1-welcome">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 7.9v.1" /></svg>
          <p>Welcome back! Your API key was kept for one tab only, so paste it again here.</p>
        </div>
      {/if}
      <h2>Get your API key</h2>
      <ol class="g1-steps">
        <li>
          <span class="glass-steps__num">1</span>
          <p><a class="g1-link" href="https://www.pixellab.ai/account" target="_blank" rel="noopener noreferrer">Open your PixelLab account page&nbsp;↗<span class="vt-sr"> (opens PixelLab in a new tab)</span></a> (sign in if PixelLab asks).</p>
        </li>
        <li>
          <span class="glass-steps__num">2</span>
          <p>Tap <b>Copy API key</b>. It's a secret token, so keep it private, like a password.</p>
        </li>
        <li>
          <span class="glass-steps__num">3</span>
          <p>Come back to this tab and paste it below.</p>
        </li>
      </ol>

      <form class="glass-input-group g1-field" onsubmit={(e) => { e.preventDefault(); test(); }}>
        <input type="text" name="username" value="PixelLab API key" autocomplete="username" hidden />
        <label class="glass-label" for="g1-key">PixelLab API key</label>
        <div class="glass-input-wrap">
          <input
            id="g1-key"
            bind:this={input}
            bind:value={key}
            {onpaste}
            class="glass-input"
            class:glass-input--error={phase === 'invalid'}
            type={show ? 'text' : 'password'}
            placeholder="Paste your API key"
            autocomplete="current-password"
            autocapitalize="off"
            spellcheck="false"
            readonly={testing}
            aria-invalid={phase === 'invalid' || phase === 'empty' ? 'true' : undefined}
            aria-describedby="g1-help"
          />
          <span class="glass-input-wrap__suffix">
            <button type="button" class="g1-reveal" aria-pressed={show} onclick={() => (show = !show)}>{show ? 'Hide' : 'Show'}</button>
          </span>
        </div>
        <p
          id="g1-help"
          class="glass-hint"
          class:glass-hint--error={phase === 'invalid' || phase === 'empty'}
          class:g1-warnhint={phase === 'offline'}
          role={hint ? 'alert' : 'note'}
        >
          {#if hint}
            {#if phase === 'offline'}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.9a13.5 13.5 0 0 1 3.9-2.6M10.4 5.1A13.5 13.5 0 0 1 21 8.9M6 12.3a8.5 8.5 0 0 1 3.3-2M14.9 10.4a8.5 8.5 0 0 1 3.1 1.9M9 15.6a4.3 4.3 0 0 1 6 0M12 19.2v.1M4 4l16 16" /></svg>
            {:else}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.6 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z" /><path d="M12 9.5v4M12 16.6v.1" /></svg>
            {/if}
            <span>{hint}</span>
          {:else}
            We test it as soon as you paste it.
          {/if}
        </p>
        <button type="submit" class="glass-btn glass-btn--primary g1-test" aria-disabled={testing ? 'true' : undefined}>
          {#if testing}<svg class="g1-spin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" opacity=".3" /><path d="M12 4a8 8 0 0 1 8 8" /></svg>Testing…{:else}Test key{/if}
        </button>
      </form>

      <div class="g1-note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 5.5 6v5.2c0 4.1 2.8 7.6 6.5 9.3 3.7-1.7 6.5-5.2 6.5-9.3V6z" /><path d="M12 8.5v4.2M12 15.6v.1" /></svg>
        <p>Heads up: PixelLab API keys give full access to your account, including spending credits. {APP_SHORT} only reads.</p>
      </div>
    </section>

    <footer class="g1-fine">
      <p>
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>Your API key goes only to PixelLab's API. {APP_SHORT} has no servers and no analytics.
      </p>
      <p>Unofficial. Not affiliated with or endorsed by PixelLab.</p>
    </footer>
  </main>
{/if}

<style>
  /* Ported from mockups/full/base/frames-g1.css (Connect + full state). */
  .g1-link { color: var(--gl-color-primary-on-surface); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, var(--gl-color-primary-on-surface) 45%, transparent); }
  .g1-spin { stroke-width: 2.4; width: 18px; height: 18px; animation: g1-rot 0.9s linear infinite; }
  @keyframes g1-rot { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .g1-spin { animation: none; } }
  .g1-note { display: flex; gap: 12px; align-items: flex-start; padding: 13px 16px; border-radius: 16px; background: var(--gl-surface-1); border: 1px solid var(--gl-border-subtle); }
  .g1-note svg { width: 20px; height: 20px; color: var(--gl-icon-muted); margin-top: 1px; }
  .g1-note p { font-size: 13.5px; line-height: 1.5; color: var(--vt-text-2); }

  .g1-connect { position: fixed; inset: 0; overflow: auto; display: grid; grid-template-columns: minmax(0, 540px) 460px; grid-template-areas: 'intro form' 'fine form';
    column-gap: 96px; row-gap: 40px; justify-content: center; align-content: center; padding: 40px; }
  .g1-intro { grid-area: intro; align-self: end; }
  .g1-form { grid-area: form; align-self: center; padding: 32px 32px 28px; display: flex; flex-direction: column; gap: 20px;
    --gl-card-glow-top: rgba(255, 255, 255, .14); --gl-card-glow-mid: rgba(255, 255, 255, .09); --gl-card-glow-low: rgba(255, 255, 255, .06); --gl-card-glow-bottom: rgba(255, 255, 255, .05);
    background: linear-gradient(to bottom, var(--gl-card-glow-top), var(--gl-card-glow-mid) 25%, var(--gl-card-glow-low) 55%, var(--gl-card-glow-bottom)), rgba(20, 22, 30, .62); }
  .g1-fine { grid-area: fine; align-self: start; display: flex; flex-direction: column; gap: 8px; color: var(--vt-text-3); font-size: 13px; }
  .g1-fine p { display: flex; gap: 8px; align-items: center; }
  .g1-fine svg { width: 16px; height: 16px; }
  .g1-mark { display: flex; align-items: center; gap: 11px; margin-bottom: 28px; }
  .g1-mark b { font-size: 19px; font-weight: 600; letter-spacing: -.01em; }
  .g1-logo { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; color: #fff;
    background: linear-gradient(135deg, var(--gl-color-primary), var(--gl-color-primary-dark)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .3), 0 6px 18px rgba(10, 108, 220, .35); }
  .g1-logo svg { width: 18px; height: 18px; stroke-width: 2; }
  .g1-h { font-size: 46px; line-height: 1.08; font-weight: 600; letter-spacing: -.025em; color: var(--gl-color-text-heading); max-width: 11em; }
  .g1-value { margin-top: 16px; font-size: 17px; line-height: 1.5; color: var(--vt-text-2); max-width: 30em; }
  .g1-form h2 { font-size: 18px; font-weight: 600; }
  .g1-steps { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; margin-top: -6px; }
  .g1-steps li { display: flex; gap: 12px; align-items: flex-start; }
  .g1-steps .glass-steps__num { width: 26px; height: 26px; font-size: 12.5px; color: var(--gl-color-text); background: var(--gl-surface-2); }
  .g1-steps p { font-size: 15px; line-height: 1.45; padding-top: 2px; }
  .g1-steps b { font-weight: 600; }
  .g1-field { gap: 8px; }
  .g1-field .glass-label { font-size: 14px; }
  .g1-field .glass-input { font-size: 16px; }
  .g1-field .glass-input-wrap { --gl-input-suffix-size: 58px; }
  .g1-field input[type='password']:not(:placeholder-shown) { letter-spacing: .14em; }
  .g1-reveal { pointer-events: auto; height: 34px; padding: 0 12px; margin-inline-end: -6px; border: 0; border-radius: 10px; background: var(--gl-surface-2); color: var(--gl-color-text); font-size: 13.5px; font-weight: 600; cursor: pointer; }
  .g1-field .glass-hint { display: flex; gap: 7px; align-items: flex-start; font-size: 13px; line-height: 1.45; color: var(--vt-text-2); }
  .g1-field .glass-hint--error { color: color-mix(in srgb, var(--gl-color-error) 55%, #fff); }
  .g1-field .g1-warnhint { color: var(--gl-color-text); }
  .g1-warnhint svg { color: var(--gl-color-warning-on-surface); }
  .g1-field .glass-hint svg { width: 16px; height: 16px; margin-top: 1px; }
  .g1-test { margin-top: 6px; height: 50px; font-size: 15.5px; gap: 9px; }
  .g1-test[aria-disabled='true'] { filter: saturate(.55) brightness(.85); cursor: default; }
  .g1-welcome { background: color-mix(in srgb, var(--gl-color-primary) 20%, transparent); border-color: color-mix(in srgb, var(--gl-color-primary-on-surface) 40%, transparent); }
  .g1-welcome svg { color: var(--gl-color-primary-on-surface); }
  .g1-welcome p { color: var(--gl-color-text); font-size: 14px; }
  :is(.g1-link, .g1-reveal, .g1-test):focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  /* Blocked: a full-width state, no form */
  .g1-state { position: fixed; inset: 0; display: grid; place-items: center; padding: 24px; }
  .glass-empty.g1-empty { max-width: 460px; box-sizing: border-box; padding: 40px 40px 34px; gap: 10px; border-radius: 28px; border: 1px solid var(--gl-border-subtle);
    background: linear-gradient(var(--gl-surface-2), var(--gl-surface-2)), var(--vt-scrim); backdrop-filter: blur(var(--gl-blur)); -webkit-backdrop-filter: blur(var(--gl-blur)); box-shadow: var(--gl-shadow-modal); }
  .g1-empty .glass-empty__icon { width: 60px; height: 60px; margin-bottom: 6px; background: var(--gl-surface-3); border: 1px solid var(--gl-border-subtle); color: var(--gl-color-text); }
  .g1-empty .glass-empty__icon svg { width: 26px; height: 26px; }
  .g1-empty .glass-empty__title { font-size: 22px; letter-spacing: -.01em; }
  .g1-empty .glass-empty__text { font-size: 15px; max-width: 34ch; color: var(--vt-text-2); }
  .g1-empty .glass-empty__action { margin-top: 18px; gap: 10px; }
  .g1-empty .glass-btn { height: 44px; padding: 0 20px; gap: 8px; }
  .g1-empty .glass-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.9; }

  @media (max-width: 600px) {
    .g1-connect { display: flex; flex-direction: column; justify-content: flex-start; gap: 22px; padding: var(--vt-top) 16px calc(var(--vt-bot) + 12px); }
    .g1-mark { margin-bottom: 16px; }
    .g1-mark b { font-size: 17px; }
    .g1-logo { width: 30px; height: 30px; border-radius: 10px; }
    .g1-h { font-size: 29px; }
    .g1-value { margin-top: 10px; font-size: 15px; line-height: 1.45; }
    .g1-form { padding: 22px 18px 18px; gap: 16px; border-radius: 26px; }
    .g1-form h2 { font-size: 17px; }
    .g1-steps { gap: 10px; }
    .g1-steps p { font-size: 14px; }
    .g1-reveal { height: 36px; }
    .g1-note { padding: 12px 14px; }
    .g1-note p { font-size: 13px; }
    .g1-fine { padding: 0 4px; font-size: 12.5px; }
    .g1-fine p { align-items: flex-start; }
    .g1-fine svg { margin-top: 1px; }
    .g1-state { padding: var(--vt-top) 16px calc(var(--vt-bot) + 12px); }
    .glass-empty.g1-empty { padding: 32px 22px 24px; }
    .g1-empty .glass-empty__action { width: 100%; flex-direction: column-reverse; }
    .g1-empty .glass-btn { height: auto; min-height: 48px; width: 100%; padding: 12px 18px; line-height: 1.3; }
  }
</style>
