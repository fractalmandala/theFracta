<!-- ═══════════════════════════════════════════════════════
     Sidebar — Icon navigation rail (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { activePanel } from '$lib/modules/studio/studioconfig'

  const navItems = [
    { id: 'properties', title: 'Properties', icon: 'settings' },
    { id: 'classes', title: 'Classes', icon: 'code' },
    { id: 'animation', title: 'Animation', icon: 'play' },
    { id: 'shadow', title: 'Shadow', icon: 'shadow' },
    { id: 'grid', title: 'Grid', icon: 'grid' },
    { id: 'gradient', title: 'Gradient', icon: 'gradient' },
    { id: 'palette', title: 'Palette', icon: 'palette' },
    { id: 'transform', title: 'Transform', icon: 'motion' }
  ]

  function selectPanel(id: string) {
    activePanel.set(id)
  }
</script>

<nav class="sidebar box hfull shrink-0">
  {#each navItems as item, i}
    {#if i === 2}
      <div class="nav-sep"></div>
    {/if}
    <button
      class="nav-btn"
      class:active={$activePanel === item.id}
      title={item.title}
      onclick={() => selectPanel(item.id)}
    >
      {#if item.icon === 'settings'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      {:else if item.icon === 'code'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      {:else if item.icon === 'play'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      {:else if item.icon === 'shadow'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="14" height="14" rx="1" opacity="0.4"/></svg>
      {:else if item.icon === 'grid'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      {:else if item.icon === 'gradient'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93L4.93 19.07"/></svg>
      {:else if item.icon === 'palette'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20 2 2 0 0 1 0 4 11 11 0 0 0 0-24z"/></svg>
      {:else if item.icon === 'motion'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      {/if}
    </button>
  {/each}
</nav>

<style lang="sass">
  .sidebar
    background: var(--bg)
    border-right: 1px solid var(--border-subtle)
    display: flex
    flex-direction: column
    align-items: center
    padding: 8px 0
    gap: 4px
    overflow-y: auto
    width: 52px

  .nav-btn
    width: 36px
    height: 36px
    display: flex
    align-items: center
    justify-content: center
    border-radius: var(--radius-sm)
    border: none
    background: none
    color: var(--text-muted)
    cursor: pointer
    transition: all var(--duration-normal) var(--ease)
    position: relative

    &:hover
      background: var(--bg-surface)
      color: var(--text-secondary)

    &.active
      background: var(--accent-bg)
      color: var(--accent)

    &.active::before
      content: ''
      position: absolute
      left: 0
      top: 8px
      bottom: 8px
      width: 2px
      border-radius: 0 2px 2px 0
      background: var(--accent)

    svg
      width: 18px
      height: 18px

  .nav-sep
    width: 24px
    height: 1px
    background: var(--border-subtle)
    margin: 4px 0
</style>
