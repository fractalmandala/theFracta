<!-- ═══════════════════════════════════════════════════════
     DetailsPanel — Applied properties, code output & custom CSS (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { properties, classes, customCss } from '$lib/modules/studio/studioconfig';
  import Section from '$lib/modules/studio/shared/Section.svelte';
  import CodeOutput from '$lib/modules/studio/panels/CodeOutput.svelte';
  import { resetAll, showToast } from '$lib/modules/studio/studioconfig';

  let activeProps = $derived(Object.entries($properties).filter(([, v]) => v));
  let classStr = $derived($classes.length ? $classes.join(' ') : 'none');

  function handleCustomCss(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    if (target) customCss.set(target.value);
  }

  function copyCss() {
    const el = document.getElementById('previewEl');
    if (!el) return;
    const css = `.element {\n  ${el.style.cssText.split(';').filter(Boolean).map(s => s.trim() + ';').join('\n  ')}\n}`;
    navigator.clipboard.writeText(css).then(() => showToast('CSS copied to clipboard'));
  }
</script>

<div class="details-panel">
  <div class="panel-header">
    <span class="panel-title">Details</span>
    <div class="panel-actions">
      <button type="button" class="hdr-btn" onclick={resetAll}>Reset</button>
      <button type="button" class="hdr-btn hdr-btn-primary" onclick={copyCss}>Copy CSS</button>
    </div>
  </div>
  <div class="panel-body">
    <Section label="Applied Properties">
      <div class="props-list">
        {#if activeProps.length > 0}
          {#each activeProps as [prop, val]}
            <div class="prop-item">
              <span class="prop-name">{prop}</span>: <span class="prop-val">{val}</span>
            </div>
          {/each}
        {:else}
          <div class="empty-text">No properties applied yet</div>
        {/if}
      </div>
    </Section>

    <Section label="Element Info">
      <div class="info-block">
        <div><span class="info-label">Tag:</span> div</div>
        <div><span class="info-label">Classes:</span> {classStr}</div>
      </div>
    </Section>

    <Section label="Custom CSS">
      <textarea
        class="code-textarea"
        value={$customCss}
        oninput={handleCustomCss}
        placeholder="/* Add raw CSS here */"
      ></textarea>
    </Section>

    <CodeOutput />
  </div>
</div>

<style lang="sass">
  .details-panel
    display: flex
    flex-direction: column
    overflow: hidden

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

  .panel-actions
    display: flex
    gap: 4px

  .hdr-btn
    padding: 3px 8px
    font-size: 10px
    font-weight: 600
    border-radius: 4px
    border: 1px solid var(--border)
    background: var(--bg-surface)
    color: var(--text-secondary)
    cursor: pointer
    transition: all var(--duration-normal) var(--ease)

    &:hover
      background: var(--bg-raised)
      color: var(--text-primary)

  .hdr-btn-primary
    background: var(--accent)
    color: oklch(0.15 0.02 27)
    border-color: var(--accent)

    &:hover
      background: oklch(0.66 0.19 27)

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

  .props-list
    font-size: 11px
    font-family: var(--font-mono)
    line-height: 1.7

  .prop-item
    margin-bottom: 4px
    color: var(--text-secondary)

  .prop-name
    color: var(--accent)

  .prop-val
    color: var(--text-muted)

  .empty-text
    font-size: 11px
    color: var(--text-muted)

  .info-block
    font-size: 11px
    color: var(--text-secondary)
    line-height: 1.7

  .info-label
    color: var(--text-muted)

  .code-textarea
    width: 100%
    min-height: 80px
    padding: 10px 12px
    border: 1px solid var(--border)
    border-radius: var(--radius-md)
    background: var(--bg)
    color: var(--text-primary)
    font-size: 12px
    font-family: var(--font-mono)
    line-height: 1.7
    resize: vertical
    outline: none
    transition: border-color var(--duration-normal) var(--ease)
    letter-spacing: 0.01em

    &:focus
      border-color: var(--accent-dim)
</style>
