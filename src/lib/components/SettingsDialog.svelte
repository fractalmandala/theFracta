<script lang="ts">
  import { Icon } from "fractalicons";
  import { luX } from "fractalicons/lucide";
  import { settings } from "$lib/stores/settings";
  import PalettePicker from "./PalettePicker.svelte";
  import { appFonts } from "$lib/states/appFonts.svelte";
  import {
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
  /**
   * A native <dialog>, opened with showModal(). The browser owns the top layer,
   * the focus trap, the inert background and Escape — all of which were either
   * hand-rolled per dialog or simply missing. ::backdrop replaces the scrim.
   */
  let el = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!el) return;
    if (visible && !el.open) el.showModal();
    else if (!visible && el.open) el.close();
  });

  // A backdrop click lands on the dialog element itself; content is in a child.
  function onBackdropClick(e: MouseEvent) {
    if (e.target === el) visible = false;
  }

</script>

<dialog
  bind:this={el}
  class="dialog dialog-xl box"
  onclose={() => (visible = false)}
  onclick={onBackdropClick} aria-modal="true" aria-labelledby="app-settings-title"
>
  <div class="box hfull in-dialog">
      <header class="row ycenter xbetween pad-x-sm border-bottom">
        <h2 class="text-sm weight-600">Settings</h2>
        <button onclick={() => (visible = false)} class="button is-icon" aria-label="Close settings">
          <Icon icon={luX} size={16} decorative />
        </button>
      </header>
      <div class="row grow min0">
        <nav class="scroll-y navtree pad-y-xs pad-x-md border-right pad-top-lg" aria-label="Settings sections">
          <div class="box gap-xs">
          <span class="text-2xs weight-600 tt-u text-muted">Application</span>
          {#each sections.filter((s) => s.scope === "app") as section}
            <button
              class="navtree-link ta-l radius-4"
              class:active={active === section.id}
              aria-current={active === section.id ? "true" : undefined}
              onclick={() => (active = section.id)}
            >{section.label}</button>
          {/each}
          </div>
          <div class="navtree-sub">
          <span class="text-2xs weight-600 tt-u text-muted pad-y-2xs">Notes</span>
          {#each sections.filter((s) => s.scope === "notes") as section}
            <button
              class="navtree-link ta-l"
              class:active={active === section.id}
              aria-current={active === section.id ? "true" : undefined}
              onclick={() => (active = section.id)}
            >{section.label}</button>
          {/each}
          </div>
        </nav>
        <div class="pad-sm box gap-sm pad-x-md pad-y-md scroll-y grow min0">
          {#if active === "appearance"}
            <section class="border-bottom box gap-2xs pad-y-xs">
              <div class="row ycenter xbetween gap-sm">
                <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Palette</h3>
                <span class="text-xs text-muted truncate">
                  {presets.theme
                    ? presets.theme.replace(/^theme-/, "").replace(/-/g, " ")
                    : "No palette — plain light or dark"}
                </span>
              </div>
              <!--
                Inline rather than the contract's ThemePicker popover: a popover
                opened inside a dialog is clipped by it, which left most of the
                76 palettes off the edge of this panel and unreachable.
              -->
              <PalettePicker />
            </section>

            <!--
              The app's two fonts, bound to --font-sans and --font-mono. The
              families are enumerated natively: queryLocalFonts() is
              Chromium-only and this app runs in WebKit, so the webview cannot
              ask for them itself.
            -->
            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Typography</h3>
              {#if appFonts.unavailable}
                <p class="text-xs text-muted">{appFonts.unavailable}</p>
              {:else}
                <div class="row ycenter xbetween gap-sm pad-y-2xs">
                  <span class="box gap-3xs grow min0">
                    <span class="text-sm weight-500 text-primary">Interface font</span>
                    <span class="text-xs text-muted">Everything the app draws, via --font-sans.</span>
                  </span>
                  <select
                    class="select select-compact text-xs shrink-0"
                    aria-label="Interface font"
                    value={appFonts.sans ?? ""}
                    onchange={(e) => appFonts.set("sans", e.currentTarget.value || null)}
                  >
                    <option value="">Stylesheet default</option>
                    {#each appFonts.available as family}
                      <option value={family}>{family}</option>
                    {/each}
                  </select>
                </div>
                <div class="row ycenter xbetween gap-sm pad-y-2xs">
                  <span class="box gap-3xs grow min0">
                    <span class="text-sm weight-500 text-primary">Monospace font</span>
                    <span class="text-xs text-muted">
                      Code, the raw editor and its line numbers, via --font-mono.
                      Only monospaced families are offered: the editor's gutter
                      aligns with character widths, so a proportional font would
                      pull the numbers out of line.
                    </span>
                  </span>
                  <select
                    class="select select-compact text-xs shrink-0"
                    aria-label="Monospace font"
                    value={appFonts.mono ?? ""}
                    onchange={(e) => appFonts.set("mono", e.currentTarget.value || null)}
                  >
                    <option value="">Stylesheet default</option>
                    {#each appFonts.monospaced as family}
                      <option value={family}>{family}</option>
                    {/each}
                  </select>
                </div>
                <p class="text-2xs text-muted">
                  {appFonts.available.length} families installed, {appFonts.monospaced.length} monospaced.
                </p>
              {/if}
            </section>

            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Presets</h3>
              <p class="text-xs text-muted">Four independent axes from fractalstyler2. Each one persists on its own.</p>
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Layout density</span>
                <LayoutPicker />
              </div>
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Corner shape</span>
                <ShapePicker />
              </div>
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Colour intensity</span>
                <ColorPicker />
              </div>
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="text-sm text-primary">Motion</span>
                <MotionPicker />
              </div>
            </section>

            <section class="border-bottom box gap-2xs pad-y-xs">
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Reset appearance</span>
                  <span class="text-xs text-muted">Drop the palette and return to light mode.</span>
                </span>
                <button class="button small ghost shrink-0" onclick={resetAppearance}>Reset</button>
              </div>
            </section>

          {:else if active === "workspace"}
            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Sidebars</h3>
              <div class="row ycenter xbetween gap-sm pad-y-2xs">
                <span class="box gap-3xs grow min0">
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

            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Window</h3>
              <label class="row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Close on Escape</span>
                  <span class="text-xs text-muted">Press ESC to close the current tab. The app quits after the last one.</span>
                </span>
                <input type="checkbox"
                  checked={$settings.closeOnEscape}
                  onchange={(e) => settings.update((s) => ({ ...s, closeOnEscape: e.currentTarget.checked }))}
                  class="shrink-0" />
              </label>
            </section>

          {:else if active === "reading"}
            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Documents</h3>
              <label class="row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Autosave</span>
                  <span class="text-xs text-muted">
                    Write edits to disk as you make them. Only applies to documents that already
                    have a location — a new, pasted or fetched one still saves with
                    <code class="kbd text-2xs">Cmd+S</code>. Pauses on a file that changed
                    underneath your edit, and asks which version to keep.
                  </span>
                </span>
                <input type="checkbox"
                  checked={$settings.autosave}
                  onchange={(e) => settings.update((s) => ({ ...s, autosave: e.currentTarget.checked }))}
                  class="shrink-0" />
              </label>
              <label class="row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Auto-present Marp decks</span>
                  <span class="text-xs text-muted">Open documents with <code class="kbd text-2xs">marp: true</code> frontmatter as a slideshow.</span>
                </span>
                <input type="checkbox"
                  checked={$settings.autoPresentMarp}
                  onchange={(e) => settings.update((s) => ({ ...s, autoPresentMarp: e.currentTarget.checked }))}
                  class="shrink-0" />
              </label>
            </section>

            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">Editor</h3>
              <label class="row ycenter xbetween gap-sm pad-y-2xs cursor-pointer">
                <span class="box gap-3xs grow min0">
                  <span class="text-sm weight-500 text-primary">Line numbers</span>
                  <span class="text-xs text-muted">Show a line-number gutter in the editor.</span>
                </span>
                <input type="checkbox"
                  checked={$settings.showLineNumbers}
                  onchange={(e) => settings.update((s) => ({ ...s, showLineNumbers: e.currentTarget.checked }))}
                  class="shrink-0" />
              </label>
            </section>

          {:else if active === "ai"}
            <section class="border-bottom box gap-2xs pad-y-xs">
              <h3 class="text-xs weight-600 tt-u text-muted pad-y-2xs">AI lookup</h3>
              <p class="text-xs text-muted">Right-click selected text in the viewer to send it to an AI tool. Manage providers and saved prompts below.</p>
              <AILookupSettings />
            </section>
          {/if}
        </div>
      </div>
  </div>
</dialog>
