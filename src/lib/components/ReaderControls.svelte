<script lang="ts">
  import { settings } from "$lib/stores/settings";

  let { visible = false }: { visible: boolean } = $props();
</script>
{#if visible}
  <div class="box gap-2xs fixed bg border pad-xs">
    <h3 class="text-xs weight-600 tt-u text-muted pad-bottom-xs">Reading preferences</h3>

    <div class="box gap-2xs pad-bottom-xs">
      <span class="text-sm text-secondary">Font</span>
      <div class="segmented row gap-3xs raised pad-3xs">
        {#each ["sans", "serif", "mono"] as font}
          <button onclick={() => settings.update((s) => ({ ...s, fontFamily: font as "sans" | "serif" | "mono" }))}
            class="segmented-item grow min0" class:active={$settings.fontFamily === font}>
            {font.charAt(0).toUpperCase() + font.slice(1)}
          </button>
        {/each}
      </div>
    </div>

    <div class="box gap-2xs pad-bottom-xs">
      <div class="row ycenter xbetween">
        <span class="text-sm text-secondary">Text size</span>
        <span class="text-xs mono text-muted">{$settings.fontSize}px</span>
      </div>
      <input type="range" min="14" max="24" step="1" value={$settings.fontSize}
        oninput={(e) => settings.update((s) => ({ ...s, fontSize: parseInt(e.currentTarget.value) }))}
        class="wfull" />
    </div>

    <div class="box gap-2xs pad-bottom-xs">
      <div class="row ycenter xbetween">
        <span class="text-sm text-secondary">Line spacing</span>
        <span class="text-xs mono text-muted">{$settings.lineHeight.toFixed(1)}</span>
      </div>
      <input type="range" min="1.4" max="2.0" step="0.1" value={$settings.lineHeight}
        oninput={(e) => settings.update((s) => ({ ...s, lineHeight: parseFloat(e.currentTarget.value) }))}
        class="wfull" />
    </div>

    <div class="box gap-2xs pad-bottom-xs">
      <span class="text-sm text-secondary">Width mode</span>
      <div class="segmented row gap-3xs raised pad-3xs">
        <button onclick={() => settings.update((s) => ({ ...s, widthMode: "comfortable" }))}
          class="segmented-item grow min0" class:active={$settings.widthMode === "comfortable"}>Comfortable</button>
        <button onclick={() => settings.update((s) => ({ ...s, widthMode: "wide" }))}
          class="segmented-item grow min0" class:active={$settings.widthMode === "wide"}>Wide</button>
      </div>
    </div>

    <div class="box gap-2xs" class:opacity-half={$settings.widthMode === "wide"}>
      <div class="row ycenter xbetween">
        <span class="text-sm text-secondary">Content width</span>
        <span class="text-xs mono text-muted">{$settings.widthMode === "wide" ? "Wide" : `${$settings.maxWidth}px`}</span>
      </div>
      <input type="range" min="560" max="3840" step="80" value={$settings.maxWidth}
        disabled={$settings.widthMode === "wide"}
        oninput={(e) => settings.update((s) => ({ ...s, maxWidth: parseInt(e.currentTarget.value) }))}
        class="wfull" />
    </div>
  </div>
{/if}
