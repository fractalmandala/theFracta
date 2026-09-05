<!-- ═══════════════════════════════════════════════════════
     Section — Wrapper with label header (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    label?: string;
    action?: Snippet;
    children?: Snippet;
  }
  let { label = '', children, action }: Props = $props();
</script>

<div class="section">
  {#if label}
    <div class="section-header">
      <span class="section-label">{label}</span>
      {#if action}
        {@render action()}
      {/if}
    </div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</div>

<style lang="sass">
  .section
    margin-bottom: 16px

  .section-header
    display: flex
    align-items: center
    justify-content: space-between
    margin-bottom: 8px

  .section-label
    font-size: 11px
    font-weight: 600
    color: var(--text-muted)
    letter-spacing: 0.04em
    text-transform: uppercase
</style>
