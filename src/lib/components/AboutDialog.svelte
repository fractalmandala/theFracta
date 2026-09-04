<script lang="ts">
  import { Icon } from "fractalicons";
  import { luBookOpen, luX } from "fractalicons/lucide";

  let { visible = $bindable(false) }: { visible: boolean } = $props();

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) visible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      visible = false;
    }
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-top-2xl" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="dialog-card card bg-dialog border box dialog-sm">
      <header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 class="text-md weight-600 m-0">About Fracta Knowledge</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close">
          <Icon icon={luX} size={16} decorative />
        </button>
      </header>

      <div class="dialog-body pad-x-sm pad-y-md box ycenter xcenter gap-2xs tt-c">
        <span class="app-icon box ycenter xcenter">
          <Icon icon={luBookOpen} size={48} title="Fracta Knowledge" />
        </span>
        <h3 class="text-lg weight-700 m-0">Fracta Knowledge</h3>
        <p class="text-sm text-secondary m-0 pad-top-2xs">A local-first Markdown reader and editor.</p>
      </div>
    </div>
  </div>
{/if}
