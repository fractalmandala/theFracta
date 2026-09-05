<!-- ═══════════════════════════════════════════════════════
     SelectInput — Custom styled select dropdown (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options?: Option[];
    value?: string;
    onchange?: (val: string) => void;
    'aria-label'?: string;
  }

  let { options = [], value = '', onchange, 'aria-label': ariaLabel = 'Select option' }: Props = $props();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    if (target) {
      value = target.value;
      onchange?.(value);
    }
  }
</script>

<div class="select-wrap">
  <select class="select-input" {value} onchange={handleChange} aria-label={ariaLabel}>
    {#each options as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>

<style lang="sass">
  .select-wrap
    position: relative

  .select-input
    width: 100%
    padding: 6px 28px 6px 10px
    border: 1px solid var(--border)
    border-radius: var(--radius-sm)
    background: var(--bg)
    color: var(--text-primary)
    font-size: 12px
    font-family: var(--font-mono)
    outline: none
    appearance: none
    cursor: pointer
    transition: border-color var(--duration-normal) var(--ease)
    letter-spacing: 0.01em

    &:focus
      border-color: var(--accent-dim)

  .select-wrap::after
    content: ''
    position: absolute
    right: 10px
    top: 50%
    transform: translateY(-50%)
    width: 0
    height: 0
    border-left: 4px solid transparent
    border-right: 4px solid transparent
    border-top: 5px solid var(--text-muted)
    pointer-events: none
</style>
