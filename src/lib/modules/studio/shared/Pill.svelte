<!-- ═══════════════════════════════════════════════════════
     Pill — Removable class tag (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  interface Props {
    text?: string;
    onremove?: () => void;
  }

  let { text = '', onremove }: Props = $props();
</script>

<span class="pill">
  {text}
  <button type="button" class="pill-remove" onclick={() => onremove?.()} aria-label="Remove {text}">×</button>
</span>

<style lang="sass">
  .pill
    display: inline-flex
    align-items: center
    gap: 4px
    padding: 3px 8px
    border-radius: 999px
    font-size: 11px
    font-weight: 500
    font-family: var(--font-mono)
    background: var(--accent-bg)
    color: var(--accent)
    border: 1px solid var(--accent-border)
    white-space: nowrap
    letter-spacing: 0.01em

  .pill-remove
    width: 14px
    height: 14px
    display: flex
    align-items: center
    justify-content: center
    border-radius: 50%
    border: none
    background: transparent
    color: var(--accent)
    cursor: pointer
    font-size: 10px
    line-height: 1
    transition: all var(--duration-normal) var(--ease)

    &:hover
      background: var(--accent)
      color: oklch(0.15 0.02 27)
</style>
