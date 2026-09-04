<script lang="ts">
  import { Icon } from "fractalicons";
  import { luX } from "fractalicons/lucide";
  import { settings } from "$lib/stores/settings";
  import AILookupSettings from "./AILookupSettings.svelte";

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
    <div class="dialog-card card bg-dialog border box dialog-md" role="dialog" aria-modal="true" aria-labelledby="knowledge-settings-title">
      <header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 id="knowledge-settings-title" class="text-md weight-600 m-0">Settings</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close settings">
          <Icon icon={luX} size={16} decorative />
        </button>
      </header>

      <div class="dialog-body box gap-sm pad-x-sm pad-y-md scroll-y dialog-h-fit">
        <section class="settings-section box gap-2xs pad-y-xs">
          <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Behavior</h3>

          <label class="settings-row row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
            <span class="settings-row-text box gap-3xs grow min0">
              <span class="text-sm weight-500 text-primary">Close on Escape</span>
              <span class="text-xs text-muted">Press ESC to close the current tab. App quits after the last tab.</span>
            </span>
            <input type="checkbox"
              checked={$settings.closeOnEscape}
              onchange={(e) => settings.update((s) => ({ ...s, closeOnEscape: e.currentTarget.checked }))}
              class="settings-switch shrink-0" />
          </label>

          <label class="settings-row row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
            <span class="settings-row-text box gap-3xs grow min0">
              <span class="text-sm weight-500 text-primary">Auto-present Marp decks</span>
              <span class="text-xs text-muted">Open documents with <code class="kbd text-3xs">marp: true</code> frontmatter as a slideshow.</span>
            </span>
            <input type="checkbox"
              checked={$settings.autoPresentMarp}
              onchange={(e) => settings.update((s) => ({ ...s, autoPresentMarp: e.currentTarget.checked }))}
              class="settings-switch shrink-0" />
          </label>
        </section>

        <section class="settings-section box gap-2xs pad-y-xs">
          <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Editor</h3>

          <label class="settings-row row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
            <span class="settings-row-text box gap-3xs grow min0">
              <span class="text-sm weight-500 text-primary">Line numbers</span>
              <span class="text-xs text-muted">Show a line-number gutter in the editor.</span>
            </span>
            <input type="checkbox"
              checked={$settings.showLineNumbers}
              onchange={(e) => settings.update((s) => ({ ...s, showLineNumbers: e.currentTarget.checked }))}
              class="settings-switch shrink-0" />
          </label>
        </section>

        <section class="settings-section box gap-2xs pad-y-xs">
          <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">AI Lookup</h3>
          <p class="text-xs text-muted m-0">Right-click selected text in the viewer to send it to an AI tool. Manage providers and saved prompts below.</p>
          <AILookupSettings />
        </section>
      </div>
    </div>
  </div>
{/if}
