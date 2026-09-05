<!-- ═══════════════════════════════════════════════════════
     SliderRow — Label + range input + value display (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  interface Props {
    label?: string;
    min?: number;
    max?: number;
    value?: number;
    unit?: string;
    onchange?: (val: number) => void;
  }

  let { label = '', min = 0, max = 100, value = 0, unit = 'px', onchange }: Props = $props();

  let displayValue = $derived(unit === '' ? value : `${value}${unit}`);
  let sliderId = $derived(`slider-${label.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'input'}`);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      value = Number(target.value);
      onchange?.(value);
    }
  }
</script>

<div class="slider-row">
  <label for={sliderId}>{label}</label>
  <input
    id={sliderId}
    type="range"
    {min}
    {max}
    {value}
    oninput={handleInput}
  />
  <span class="slider-val">{displayValue}</span>
</div>

<style lang="sass">
  .slider-row
    display: flex
    align-items: center
    gap: 10px
    margin-bottom: 10px

    label
      font-size: 11px
      font-weight: 500
      color: var(--text-secondary)
      min-width: 80px
      letter-spacing: 0.01em

  input[type="range"]
    flex: 1
    height: 4px
    -webkit-appearance: none
    appearance: none
    background: var(--bg-raised)
    border-radius: 2px
    outline: none

    &::-webkit-slider-thumb
      -webkit-appearance: none
      width: 14px
      height: 14px
      border-radius: 50%
      background: var(--accent)
      cursor: pointer
      border: 2px solid var(--bg)
      box-shadow: 0 0 0 1px var(--accent-dim)

  .slider-val
    font-size: 11px
    font-family: var(--font-mono)
    color: var(--text-muted)
    min-width: 40px
    text-align: right
</style>
