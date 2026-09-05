<!-- ═══════════════════════════════════════════════════════
     ColorRow — Label + color picker + hex display (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  interface Props {
    label?: string;
    value?: string;
    onchange?: (val: string) => void;
  }

  let { label = '', value = '#000000', onchange }: Props = $props();
  let colorId = $derived(`color-${label.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'swatch'}`);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target) {
      value = target.value;
      onchange?.(value);
    }
  }
</script>

<div class="color-row">
  <label for={colorId}>{label}</label>
  <input id={colorId} type="color" class="color-swatch" {value} oninput={handleInput} />
  <span class="color-hex">{value}</span>
</div>

<style lang="sass">
  .color-row
    display: flex
    align-items: center
    gap: 10px
    margin-bottom: 10px

    label
      font-size: 11px
      font-weight: 500
      color: var(--text-secondary)
      min-width: 80px

  .color-swatch
    width: 28px
    height: 28px
    border-radius: var(--radius-sm)
    border: 1px solid var(--border)
    cursor: pointer
    padding: 0
    overflow: hidden

    &::-webkit-color-swatch-wrapper
      padding: 0

    &::-webkit-color-swatch
      border: none
      border-radius: 4px

  .color-hex
    font-family: var(--font-mono)
    font-size: 11px
    color: var(--text-muted)
</style>
