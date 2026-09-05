<!-- ═══════════════════════════════════════════════════════
     PillInput — Container for pills + text input (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import Pill from './Pill.svelte';

  interface Props {
    pills?: string[];
    placeholder?: string;
    onadd?: (newClasses: string[]) => void;
    onremove?: (index: number) => void;
    onclear?: () => void;
  }

  let {
    pills = [],
    placeholder = 'Type and press Enter…',
    onadd,
    onremove,
    onclear
  }: Props = $props();

  let inputValue = $state('');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newClasses = inputValue.trim().split(/\s+/).filter(Boolean);
      onadd?.(newClasses);
      inputValue = '';
    }
  }
</script>

<div class="pill-container">
  {#each pills as cls, i}
    <Pill text={cls} onremove={() => onremove?.(i)} />
  {/each}
  <input
    class="pill-input"
    bind:value={inputValue}
    onkeydown={handleKeydown}
    {placeholder}
    autocomplete="off"
    aria-label="Add class name"
  />
</div>

<style lang="sass">
  .pill-container
    display: flex
    flex-wrap: wrap
    gap: 6px
    min-height: 32px
    padding: 8px
    border: 1px solid var(--border)
    border-radius: var(--radius-md)
    background: var(--bg)
    cursor: text
    transition: border-color var(--duration-normal) var(--ease)

    &:focus-within
      border-color: var(--accent-dim)

  .pill-input
    flex: 1
    min-width: 80px
    border: none
    background: none
    color: var(--text-primary)
    font-size: 12px
    font-family: var(--font-mono)
    outline: none
    letter-spacing: 0.01em

    &::placeholder
      color: var(--text-muted)
</style>
