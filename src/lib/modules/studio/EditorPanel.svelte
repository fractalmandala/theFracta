<!-- ═══════════════════════════════════════════════════════
     EditorPanel — Left panel with tab switching (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script>
  import { activePanel } from '$lib/modules/studio/studioconfig'
  import PropertiesTab from '$lib/modules/studio/panels/PropertiesTab.svelte'
  import ClassesTab from '$lib/modules/studio/panels/ClassesTab.svelte'
  
  // Import fractalsvelte generators
  import AnimationControls from '$lib/modules/studio/generators/animation/AnimationControls.svelte'
  import ShadowControls from '$lib/modules/studio/generators/shadow/ShadowControls.svelte'
  import GridControls from '$lib/modules/studio/generators/grid/GridControls.svelte'
  import GradientControls from '$lib/modules/studio/generators/gradient/GradientControls.svelte'
  import PaletteControls from '$lib/modules/studio/generators/palette/PaletteControls.svelte'
  import TransformControls from '$lib/modules/studio/generators/transform/TransformControls.svelte'

  let panelTitle = $derived({
    'properties': 'CSS Properties',
    'classes': 'Classes',
    'animation': 'Animation',
    'shadow': 'Shadow',
    'grid': 'Grid',
    'gradient': 'Gradient',
    'palette': 'Palette',
    'transform': 'Transform'
  }[$activePanel] || 'Editor')
</script>

<div class="editor-panel">
  <div class="panel-header">
    <span class="panel-title">{panelTitle}</span>
  </div>
  <div class="panel-body">
    {#if $activePanel === 'properties'}
      <PropertiesTab />
    {:else if $activePanel === 'classes'}
      <ClassesTab />
    {:else if $activePanel === 'animation'}
      <AnimationControls />
    {:else if $activePanel === 'shadow'}
      <ShadowControls />
    {:else if $activePanel === 'grid'}
      <GridControls />
    {:else if $activePanel === 'gradient'}
      <GradientControls />
    {:else if $activePanel === 'palette'}
      <PaletteControls />
    {:else if $activePanel === 'transform'}
      <TransformControls />
    {/if}
  </div>
</div>

<style lang="sass">
  .editor-panel
    display: flex
    flex-direction: column
    overflow: hidden
    border-right: 1px solid var(--border-subtle)
    min-width: 0

  .panel-header
    padding: 12px 16px
    border-bottom: 1px solid var(--border-subtle)
    display: flex
    align-items: center
    justify-content: space-between
    flex-shrink: 0

  .panel-title
    font-size: 11px
    font-weight: 600
    text-transform: uppercase
    letter-spacing: 0.06em
    color: var(--text-muted)

  .panel-body
    flex: 1
    overflow-y: auto
    padding: 12px 16px

    &::-webkit-scrollbar
      width: 6px

    &::-webkit-scrollbar-track
      background: transparent

    &::-webkit-scrollbar-thumb
      background: var(--border)
      border-radius: 3px

    &::-webkit-scrollbar-thumb:hover
      background: var(--text-muted)
</style>
