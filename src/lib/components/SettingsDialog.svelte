<script lang="ts">
  import { Icon } from "fractalicons";
  import { luX } from "fractalicons/lucide";
  import { settings } from "$lib/stores/settings";
  import {
    ThemePicker,
    LayoutPicker,
    ShapePicker,
    ColorPicker,
    MotionPicker,
    setMode,
    setTheme,
    presets,
  } from "fractalstyler2";
  import AILookupSettings from "./AILookupSettings.svelte";

  let { visible = $bindable(false) }: { visible: boolean } = $props();

  /**
   * Settings is app-scoped, so it is sectioned by what each setting governs
   * rather than presented as one list: the whole application first, then a
   * single surface. Only settings that actually persist somewhere appear here —
   * the Observatory keeps no preferences of its own, so it has no section.
   */
  type Scope = "app" | "notes";
  const sections: Array<{ id: string; label: string; scope: Scope }> = [
    { id: "appearance", label: "Appearance", scope: "app" },
    { id: "workspace", label: "Workspace", scope: "app" },
    { id: "reading", label: "Reading & editing", scope: "notes" },
    { id: "ai", label: "AI lookup", scope: "notes" },
  ];

  let active = $state("appearance");

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) visible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      visible = false;
    }
  }

  // --- Workspace resets -------------------------------------------------------
  // Each reset clears its own keys and reports what it cleared, rather than
  // offering one opaque "reset everything" button.
  let railsCleared = $state(-1);

  function resetRails() {
    let n = 0;
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("fracta.rail.")) {
          localStorage.removeItem(key);
          n += 1;
        }
      }
    } catch {
      /* storage unavailable */
    }
    railsCleared = n;
  }

  function resetAppearance() {
    setTheme(null);
    setMode("light");
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-top-2xl" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="dialog-card card bg-dialog border box dialog-lg" role="dialog" aria-modal="true" aria-labelledby="app-settings-title">
      <header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 id="app-settings-title" class="text-md weight-600 m-0">Settings</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close settings">
          <Icon icon={luX} size={16} decorative />
        </button>
      </header>

      <div class="dialog-content-flex">
        <nav class="settings-nav box gap-3xs pad-sm border-right shrink-0" aria-label="Settings sections">
          <span class="text-3xs weight-600 tt-u text-muted pad-y-2xs">Application</span>
          {#each sections.filter((s) => s.scope === "app") as section}
            <button
              class="dialog-tab text-left"
              class:dialog-tab-active={active === section.id}
              aria-current={active === section.id ? "true" : undefined}
              onclick={() => (active = section.id)}
            >{section.label}</button>
          {/each}

          <span class="text-3xs weight-600 tt-u text-muted pad-y-2xs m-top-2xs">Notes</span>
          {#each sections.filter((s) => s.scope === "notes") as section}
            <button
              class="dialog-tab text-left"
              class:dialog-tab-active={active === section.id}
              aria-current={active === section.id ? "true" : undefined}
              onclick={() => (active = section.id)}
            >{section.label}</button>
          {/each}
        </nav>

        <div class="dialog-body box gap-sm pad-x-md pad-y-md scroll-y grow min0">
          {#if active === "appearance"}
            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Palette</h3>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="settings-row-text box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Theme</span>
                  <span class="text-xs text-muted">
                    {presets.theme
                      ? presets.theme.replace(/^theme-/, "").replace(/-/g, " ")
                      : "No palette — plain light or dark"}
                  </span>
                </span>
                <ThemePicker />
              </div>
            </section>

            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Presets</h3>
              <p class="text-xs text-muted m-0">Four independent axes from fractalstyler2. Each one persists on its own.</p>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Layout density</span>
                <LayoutPicker />
              </div>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Corner shape</span>
                <ShapePicker />
              </div>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Colour intensity</span>
                <ColorPicker />
              </div>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Motion</span>
                <MotionPicker />
              </div>
            </section>

            <section class="settings-section box gap-2xs pad-y-xs">
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="settings-row-text box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Reset appearance</span>
                  <span class="text-xs text-muted">Drop the palette and return to light mode.</span>
                </span>
                <button class="button small ghost shrink-0" onclick={resetAppearance}>Reset</button>
              </div>
            </section>

          {:else if active === "workspace"}
            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Sidebars</h3>
              <div class="settings-row row ycenter xbetween gap-sm pad-y-2xs">
                <span class="settings-row-text box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Reset sidebar widths</span>
                  <span class="text-xs text-muted">
                    {#if railsCleared >= 0}
                      Cleared {railsCleared} remembered {railsCleared === 1 ? "sidebar" : "sidebars"}. They return to their defaults on next load.
                    {:else}
                      Every sidebar remembers the width you dragged it to, and whether you collapsed it.
                    {/if}
                  </span>
                </span>
                <button class="button small ghost shrink-0" onclick={resetRails}>Reset</button>
              </div>
            </section>

            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Window</h3>
              <label class="settings-row row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
                <span class="settings-row-text box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Close on Escape</span>
                  <span class="text-xs text-muted">Press ESC to close the current tab. The app quits after the last one.</span>
                </span>
                <input type="checkbox"
                  checked={$settings.closeOnEscape}
                  onchange={(e) => settings.update((s) => ({ ...s, closeOnEscape: e.currentTarget.checked }))}
                  class="settings-switch shrink-0" />
              </label>
            </section>

          {:else if active === "reading"}
            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">Documents</h3>
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

          {:else if active === "ai"}
            <section class="settings-section box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted m-0 pad-y-2xs">AI lookup</h3>
              <p class="text-xs text-muted m-0">Right-click selected text in the viewer to send it to an AI tool. Manage providers and saved prompts below.</p>
              <AILookupSettings />
            </section>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
