<!-- ═══════════════════════════════════════════════════════
     Toast — Notification popup (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { toastMessage } from '$lib/modules/studio/studioconfig';
</script>

{#if $toastMessage}
  <div class="toast" role="status" aria-live="polite">
    {$toastMessage}
  </div>
{/if}

<style lang="sass">
  .toast
    position: fixed
    bottom: 20px
    right: 20px
    padding: 10px 16px
    background: var(--bg-raised)
    color: var(--text-primary)
    border: 1px solid var(--border)
    border-radius: var(--radius-md)
    font-size: 12px
    font-weight: 500
    box-shadow: var(--shadow-lg)
    z-index: 1000
    animation: slideIn 200ms ease forwards

  @keyframes slideIn
    from
      transform: translateY(8px)
      opacity: 0
    to
      transform: translateY(0)
      opacity: 1
</style>
