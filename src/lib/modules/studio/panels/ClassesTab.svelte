<!-- ═══════════════════════════════════════════════════════
     ClassesTab — Pill-based class management (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { classes } from '$lib/modules/studio/studioconfig';
  import { SVELTEKIT_CLASSES, TAILWIND_CLASSES } from '$lib/modules/studio/data';
  import Section from '$lib/modules/studio/shared/Section.svelte';
  import PillInput from '$lib/modules/studio/shared/PillInput.svelte';

  function handleAdd(newClasses: string[]) {
    classes.update((c) => {
      const updated = [...c];
      newClasses.forEach((cls) => {
        if (!updated.includes(cls)) updated.push(cls);
      });
      return updated;
    });
  }

  function handleRemove(index: number) {
    classes.update((c) => c.filter((_, i) => i !== index));
  }

  function handleClear() {
    classes.set([]);
  }

  function addPreset(cls: string) {
    classes.update((c) => {
      if (!c.includes(cls)) return [...c, cls];
      return c;
    });
  }
</script>

<Section label="Active Classes">
  {#snippet action()}
    <button type="button" class="section-action" onclick={handleClear}>Clear all</button>
  {/snippet}
  <PillInput
    pills={$classes}
    placeholder="Type a class and press Enter…"
    onadd={handleAdd}
    onremove={handleRemove}
    onclear={handleClear}
  />
</Section>

<Section label="SvelteKit Utilities">
  <div class="preset-list">
    {#each SVELTEKIT_CLASSES as cls}
      <button type="button" class="preset-btn" onclick={() => addPreset(cls)}>{cls}</button>
    {/each}
  </div>
</Section>

<Section label="Tailwind Utilities">
  <div class="preset-list">
    {#each TAILWIND_CLASSES as cls}
      <button type="button" class="preset-btn" onclick={() => addPreset(cls)}>{cls}</button>
    {/each}
  </div>
</Section>

<style lang="sass">
  .section-action
    font-size: 11px
    color: var(--accent)
    cursor: pointer
    background: none
    border: none
    font-weight: 500
    transition: color var(--duration-normal) var(--ease)

    &:hover
      color: oklch(0.80 0.19 27)

  .preset-list
    display: flex
    flex-wrap: wrap
    gap: 4px

  .preset-btn
    padding: 4px 8px
    font-size: 10px
    font-family: var(--font-mono)
    border-radius: var(--radius-sm)
    border: 1px solid var(--border)
    background: var(--bg)
    color: var(--text-secondary)
    cursor: pointer
    transition: all var(--duration-normal) var(--ease)

    &:hover
      background: var(--accent-bg)
      color: var(--accent)
      border-color: var(--accent-border)
</style>
