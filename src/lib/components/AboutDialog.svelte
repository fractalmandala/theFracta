<script lang="ts">
  import { Icon } from "fractalicons";
  import { luBookOpen, luX } from "fractalicons/lucide";

  let { visible = $bindable(false) }: { visible: boolean } = $props();

  /**
   * A native <dialog>, opened with showModal().
   *
   * The browser then owns the top layer, the focus trap, inert background and
   * Escape — behaviour that was previously hand-rolled per dialog, or missing.
   * ::backdrop replaces the scrim element entirely.
   */
  let el = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!el) return;
    if (visible && !el.open) el.showModal();
    else if (!visible && el.open) el.close();
  });

  // Clicking the backdrop hits the dialog element itself, since the content
  // sits in a child box.
  function onBackdropClick(e: MouseEvent) {
    if (e.target === el) visible = false;
  }
</script>

<dialog
  bind:this={el}
  class="dialog dialog-sm"
  onclose={() => (visible = false)}
  onclick={onBackdropClick}
>
  <div class="box hfull">
      <header class="row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 class="text-md weight-600">About Fracta Knowledge</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close">
          <Icon icon={luX} size={16} decorative />
        </button>
      </header>

      <div class="pad-sm scroll-y min0 pad-x-sm pad-y-md box ycenter xcenter gap-2xs">
        <span class="box ycenter xcenter w-24 h-24">
          <Icon icon={luBookOpen} size={48} title="Fracta Knowledge" />
        </span>
        <h3 class="text-lg weight-700">Fracta Knowledge</h3>
        <p class="text-sm text-secondary pad-top-2xs">A local-first Markdown reader and editor.</p>
      </div>
  </div>
</dialog>
