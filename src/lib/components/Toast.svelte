<script lang="ts">
  import { toasts } from "$lib/stores/toast";
</script>

{#if $toasts.length > 0}
  <div class="toast-stack box gap-2xs">
    {#each $toasts as t (t.id)}
      <div class="toast row ycenter gap-2xs bg border   text-sm text-primary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="text-danger shrink-0">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 5v3.5M8 11h.01" />
        </svg>
        <span class="grow min0 truncate">{t.message}</span>
      </div>
    {/each}
  </div>
{/if}
