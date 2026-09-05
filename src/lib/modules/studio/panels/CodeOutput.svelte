<!-- ═══════════════════════════════════════════════════════
     CodeOutput — Generated code with Svelte/CSS/SASS tabs (Svelte 5)
     ═══════════════════════════════════════════════════════ -->
<script lang="ts">
  import { properties, classes, customCss, activeCodeTab } from '$lib/modules/studio/studioconfig';

  let activeProps = $derived(Object.entries($properties).filter(([, v]) => v));

  function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  let codeHtml = $derived((() => {
    const props = activeProps;
    const cls = $classes as string[];
    const custom = $customCss;

    if ($activeCodeTab === 'css') {
      let css = '';
      if (cls.length || props.length || custom) {
        css += '<span class="cm">/* Generated CSS */</span>\n';
        css += '.element {\n';
        if (cls.length) css += `  <span class="cm">/* Classes: ${cls.join(' ')} */</span>\n`;
        props.forEach(([prop, val]) => {
          css += `  ${prop}: <span class="str">${val}</span>;\n`;
        });
        css += '}\n';
        if (custom) {
          css += '\n<span class="cm">/* Custom CSS */</span>\n';
          css += '.element {\n';
          custom.split('\n').forEach((line: string) => {
            if (line.trim()) css += `  ${escapeHtml(line.trim())}\n`;
          });
          css += '}\n';
        }
      } else {
        css = '<span class="cm">/* No properties set yet */</span>';
      }
      return css;
    }

    if ($activeCodeTab === 'svelte') {
      let svelte = '<span class="cm">&lt;!-- Svelte Component --&gt;</span>\n';
      svelte += '<span class="kw">&lt;script&gt;</span>\n';
      if (cls.length) svelte += `  <span class="kw">let</span> className = <span class="str">\'' + cls.join(' ') + '\'</span>;\n`;
      svelte += '<span class="kw">&lt;/script&gt;</span>\n\n';
      svelte += '<span class="kw">&lt;div</span>';
      if (cls.length) svelte += ` <span class="fn">class</span>=<span class="str">"${cls.join(' ')}"</span>`;
      svelte += '<span class="kw">&gt;</span>\n';
      svelte += '  <span class="cm">&lt;!-- content --&gt;</span>\n';
      svelte += '<span class="kw">&lt;/div&gt;</span>\n\n';
      if (props.length || custom) {
        svelte += '<span class="kw">&lt;style&gt;</span>\n';
        svelte += '  .element {\n';
        props.forEach(([prop, val]) => {
          svelte += `    ${prop}: <span class="str">${val}</span>;\n`;
        });
        if (custom) {
          custom.split('\n').forEach((line: string) => {
            if (line.trim()) svelte += `    ${escapeHtml(line.trim())}\n`;
          });
        }
        svelte += '  }\n';
        svelte += '<span class="kw">&lt;/style&gt;</span>\n';
      }
      return svelte;
    }

    if ($activeCodeTab === 'sass') {
      let sass = '';
      if (cls.length || props.length || custom) {
        sass += '<span class="cm">// Generated SASS</span>\n';
        sass += '.element\n';
        if (cls.length) sass += `  <span class="cm">// Classes: ${cls.join(' ')}</span>\n`;
        props.forEach(([prop, val]) => {
          sass += `  ${prop}: <span class="str">${val}</span>\n`;
        });
        if (custom) {
          sass += '\n  <span class="cm">// Custom CSS</span>\n';
          custom.split('\n').forEach((line: string) => {
            if (line.trim()) sass += `  ${escapeHtml(line.trim())}\n`;
          });
        }
      } else {
        sass = '<span class="cm">// No properties set yet</span>';
      }
      return sass;
    }

    return '';
  })());

  function setTab(tab: string) {
    activeCodeTab.set(tab);
  }
</script>

<div class="code-output">
  <div class="code-header">
    <span class="panel-title">Generated Code</span>
    <div class="code-tabs">
      <button type="button" class="code-tab" class:active={$activeCodeTab === 'svelte'} onclick={() => setTab('svelte')}>Svelte</button>
      <button type="button" class="code-tab" class:active={$activeCodeTab === 'css'} onclick={() => setTab('css')}>CSS</button>
      <button type="button" class="code-tab" class:active={$activeCodeTab === 'sass'} onclick={() => setTab('sass')}>SASS</button>
    </div>
  </div>
  <div class="code-body">
    {@html codeHtml}
  </div>
</div>

<style lang="sass">
  .code-output
    background: var(--bg)
    border-top: 1px solid var(--border-subtle)
    flex-shrink: 0

  .code-header
    display: flex
    align-items: center
    padding: 8px 12px
    border-bottom: 1px solid var(--border-subtle)
    position: sticky
    top: 0
    background: var(--bg)
    z-index: 5

  .panel-title
    flex: 1
    font-size: 11px
    font-weight: 600
    text-transform: uppercase
    letter-spacing: 0.06em
    color: var(--text-muted)

  .code-tabs
    display: flex
    gap: 2px

  .code-tab
    padding: 3px 8px
    font-size: 10px
    font-weight: 600
    border-radius: 4px
    border: none
    background: none
    color: var(--text-muted)
    cursor: pointer
    letter-spacing: 0.04em
    text-transform: uppercase
    transition: all var(--duration-normal) var(--ease)

    &:hover
      color: var(--text-secondary)

    &.active
      background: var(--accent-bg)
      color: var(--accent)

  .code-body
    padding: 12px 16px
    font-family: var(--font-mono)
    font-size: 12px
    line-height: 1.7
    color: var(--text-secondary)
    white-space: pre-wrap
    word-break: break-all
    letter-spacing: 0.01em
    max-height: 300px
    overflow: auto

    :global(.kw)
      color: var(--accent)

    :global(.str)
      color: var(--success)

    :global(.cm)
      color: var(--text-muted)

    :global(.fn)
      color: var(--warn)
</style>
