<!-- ═══════════════════════════════════════════════════════
     GenCard — Clickable card for generators/presets (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    title?: string;
    description?: string;
    active?: boolean;
    onselect?: () => void;
    children?: Snippet;
  }
  let { title = '', description = '', active = false, onselect, children }: Props = $props();
</script>

<button
  type="button"
  class="gen-card"
  class:active
  onclick={() => onselect?.()}
>
  {#if children}
    {@render children()}
  {/if}
  <div class="gen-card-title">{title}</div>
  {#if description}
    <div class="gen-card-desc">{description}</div>
  {/if}
</button>

<style lang="sass">
  .gen-card
    padding: 12px
    border: 1px solid var(--border)
    border-radius: var(--radius-md)
    background: var(--bg)
    cursor: pointer
    transition: all var(--duration-normal) var(--ease)
    text-align: left

    &:hover
      border-color: var(--accent-dim)
      background: var(--bg-surface)

    &.active
      border-color: var(--accent)
      background: var(--accent-bg)

  .gen-card-title
    font-size: 12px
    font-weight: 600
    color: var(--text-primary)
    margin-bottom: 2px

  .gen-card-desc
    font-size: 10px
    color: var(--text-muted)
</style>
