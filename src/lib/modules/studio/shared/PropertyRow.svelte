<!-- ═══════════════════════════════════════════════════════
     PropertyRow — Label + input with autocomplete (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import Autocomplete from './Autocomplete.svelte';

  interface Props {
    label?: string;
    prop?: string;
    value?: string;
    placeholder?: string;
    suggestions?: string[];
    onchange?: (e: { prop: string; value: string }) => void;
  }

  let {
    label = '',
    prop = '',
    value = '',
    placeholder = '',
    suggestions = [],
    onchange
  }: Props = $props();

  let acOpen = $state(false);
  let acComponent: Autocomplete | undefined = $state();
  let inputId = $derived(`prop-${prop || 'field'}`);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target) return;
    value = target.value;
    onchange?.({ prop, value });

    if (suggestions.length) {
      const matches = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()));
      acOpen = matches.length > 0 && value.length > 0;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (acComponent) {
      acComponent.handleKeydown(e.key);
    }
  }

  function handleSelect(item: string) {
    value = item;
    acOpen = false;
    onchange?.({ prop, value });
  }

  function handleBlur() {
    setTimeout(() => {
      acOpen = false;
    }, 150);
  }
</script>

<div class="prop-row">
  <label for={inputId}>{label}</label>
  <div class="prop-input-wrap">
    <input
      id={inputId}
      class="prop-input"
      bind:value
      oninput={handleInput}
      onkeydown={handleKeydown}
      onblur={handleBlur}
      {placeholder}
      autocomplete="off"
    />
    <Autocomplete
      bind:this={acComponent}
      items={suggestions}
      open={acOpen}
      onselect={handleSelect}
      onclose={() => {
        acOpen = false;
      }}
    />
  </div>
</div>

<style lang="sass">
  .prop-row
    display: grid
    grid-template-columns: 1fr 1fr auto
    gap: 8px
    align-items: center
    margin-bottom: 8px

    label
      font-size: 11px
      font-weight: 500
      color: var(--text-secondary)
      letter-spacing: 0.01em

  .prop-input-wrap
    position: relative

  .prop-input
    width: 100%
    padding: 6px 10px
    border: 1px solid var(--border)
    border-radius: var(--radius-sm)
    background: var(--bg)
    color: var(--text-primary)
    font-size: 12px
    font-family: var(--font-mono)
    outline: none
    transition: border-color var(--duration-normal) var(--ease)
    letter-spacing: 0.01em

    &:focus
      border-color: var(--accent-dim)

    &::placeholder
      color: var(--text-muted)
</style>
