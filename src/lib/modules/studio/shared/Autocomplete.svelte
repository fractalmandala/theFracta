<!-- ═══════════════════════════════════════════════════════
     Autocomplete — Suggestion dropdown (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  interface Props {
    items?: string[];
    open?: boolean;
    onselect?: (item: string) => void;
    onclose?: () => void;
  }

  let { items = [], open = false, onselect, onclose }: Props = $props();

  let activeIndex = $state(0);

  export function handleKeydown(key: string) {
    if (key === 'ArrowDown') {
      activeIndex = (activeIndex + 1) % items.length;
    } else if (key === 'ArrowUp') {
      activeIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (key === 'Enter') {
      if (items[activeIndex]) {
        onselect?.(items[activeIndex]);
      }
    } else if (key === 'Escape') {
      onclose?.();
    }
  }
</script>

{#if open && items.length > 0}
  <div class="ac-dropdown" role="listbox">
    {#each items as item, i}
      <button
        type="button"
        class="ac-item"
        class:active={i === activeIndex}
        onclick={() => onselect?.(item)}
      >
        {item}
      </button>
    {/each}
  </div>
{/if}

<style lang="sass">
  .ac-dropdown
    position: absolute
    top: 100%
    left: 0
    right: 0
    margin-top: 4px
    background: var(--bg-surface)
    border: 1px solid var(--border)
    border-radius: var(--radius-sm)
    max-height: 160px
    overflow-y: auto
    z-index: 100
    box-shadow: var(--shadow-md)

  .ac-item
    width: 100%
    padding: 6px 10px
    font-size: 11px
    font-family: var(--font-mono)
    color: var(--text-secondary)
    background: none
    border: none
    text-align: left
    cursor: pointer
    transition: all var(--duration-fast) var(--ease)

    &:hover, &.active
      background: var(--accent-bg)
      color: var(--accent)
</style>
