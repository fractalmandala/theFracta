<!-- ═══════════════════════════════════════════════════════
     PreviewPanel — Live preview with generator canvases (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { properties, classes, customCss, previewBg, activePanel } from '$lib/modules/studio/studioconfig';
  import AnimationCanvas from '$lib/modules/studio/generators/animation/AnimationCanvas.svelte';
  import GradientCanvas from '$lib/modules/studio/generators/gradient/GradientCanvas.svelte';
  import InteractiveGridCanvas from '$lib/modules/studio/generators/grid/InteractiveGridCanvas.svelte';
  import PaletteCanvas from '$lib/modules/studio/generators/palette/PaletteCanvas.svelte';
  import ShadowCanvas from '$lib/modules/studio/generators/shadow/ShadowCanvas.svelte';
  import TransformCanvas from '$lib/modules/studio/generators/transform/TransformCanvas.svelte';

  const generatorPanels = ['animation', 'gradient', 'grid', 'palette', 'shadow', 'transform'];
  let isGenerator = $derived(generatorPanels.includes($activePanel));

  function setBackground(bg: string) {
    previewBg.set(bg);
  }

  let bgStyle = $derived(
    $previewBg === 'dark'
      ? 'background: #111118; --stage-bg: #111118; --stage-fg: #e2e8f0;'
      : $previewBg === 'checker'
        ? 'background: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 16px 16px; --stage-bg: transparent;'
        : 'background: #ffffff; --stage-bg: #ffffff; --stage-fg: #181818;'
  );

  $effect(() => {
    if (isGenerator) return;
    const preview = document.getElementById('previewEl');
    if (preview) {
      preview.className = 'preview-element ' + ($classes as string[]).join(' ');
      Object.entries($properties).forEach(([prop, val]) => {
        if (val) preview.style.setProperty(prop, val as string);
      });
      if ($customCss) {
        $customCss.split(';').forEach((rule: string) => {
          const [prop, ...valParts] = rule.split(':');
          if (prop && valParts.length) {
            preview.style.setProperty(prop.trim(), valParts.join(':').trim());
          }
        });
      }
    }
  });
</script>

<div class="preview-container">
  <div class="preview-toolbar">
    <span class="panel-title">Live Preview</span>
    <div class="preview-bg-toggle">
      <button
        type="button"
        class="bg-btn light"
        class:active={$previewBg === 'light'}
        onclick={() => setBackground('light')}
        title="Light background"
        aria-label="Light background"
      ></button>
      <button
        type="button"
        class="bg-btn dark"
        class:active={$previewBg === 'dark'}
        onclick={() => setBackground('dark')}
        title="Dark background"
        aria-label="Dark background"
      ></button>
      <button
        type="button"
        class="bg-btn checker"
        class:active={$previewBg === 'checker'}
        onclick={() => setBackground('checker')}
        title="Transparent"
        aria-label="Transparent background"
      ></button>
    </div>
  </div>
  <div class="preview-canvas" style={bgStyle}>
    {#if $activePanel === 'animation'}
      <AnimationCanvas />
    {:else if $activePanel === 'gradient'}
      <GradientCanvas />
    {:else if $activePanel === 'grid'}
      <InteractiveGridCanvas />
    {:else if $activePanel === 'palette'}
      <PaletteCanvas />
    {:else if $activePanel === 'shadow'}
      <ShadowCanvas />
    {:else if $activePanel === 'transform'}
      <TransformCanvas />
    {:else}
      <div class="preview-element" id="previewEl">
        <span class="preview-label">Preview Element</span>
      </div>
    {/if}
  </div>
</div>

<style lang="sass">
  .preview-container
    position: relative
    background: var(--bg)
    display: flex
    flex-direction: column
    flex: 1
    border-bottom: 1px solid var(--border-subtle)

  .preview-toolbar
    padding: 8px 12px
    border-bottom: 1px solid var(--border-subtle)
    display: flex
    align-items: center
    gap: 8px
    flex-shrink: 0

  .panel-title
    flex: 1
    font-size: 11px
    font-weight: 600
    text-transform: uppercase
    letter-spacing: 0.06em
    color: var(--text-muted)

  .preview-bg-toggle
    display: flex
    gap: 2px
    background: var(--bg-surface)
    border-radius: var(--radius-sm)
    padding: 2px

  .bg-btn
    width: 24px
    height: 24px
    border-radius: 4px
    border: none
    cursor: pointer
    transition: all var(--duration-normal) var(--ease)

    &.light
      background: #fafafa

    &.dark
      background: #1a1a1a

    &.checker
      background: repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 10px 10px

    &.active
      outline: 2px solid var(--accent)
      outline-offset: 1px

  .preview-canvas
    flex: 1
    display: flex
    align-items: center
    justify-content: center
    padding: 32px
    overflow: auto

  .preview-element
    min-width: 120px
    min-height: 80px
    padding: 24px
    border-radius: var(--radius-md)
    background: var(--bg-raised)
    transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)
    display: flex
    align-items: center
    justify-content: center
    font-family: var(--font-sans)
    color: var(--text-primary)
    position: relative

  .preview-label
    font-size: 13px
    color: var(--text-muted)
    pointer-events: none
</style>
