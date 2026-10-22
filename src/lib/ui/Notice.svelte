<script lang="ts">
  // One-line glass pill above the dock. Not a live region: App's always-mounted status reads the text (U5).
  let { text, actionLabel, onAction, tone = 'info' }: { text: string; actionLabel?: string; onAction?: () => void; tone?: 'info' | 'warn' } = $props();
</script>

<div class="vt-notice vt-scrim" class:warn={tone === 'warn'}>
  <span>{text}</span>
  {#if actionLabel && onAction}
    <button type="button" class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" onclick={onAction}>{actionLabel}</button>
  {/if}
</div>
