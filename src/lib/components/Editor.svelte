<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { searchQuery, searchActiveIndex, searchTotal } from "$lib/stores/search";
  import { findMatches, buildHighlightHtml } from "$lib/utils/text-search";

  let {
    value,
    onChange,
    fontSize = 14,
    lineHeight = 1.6,
    maxWidth = "720px",
    showLineNumbers = false,
    split = false,
  }: {
    value: string;
    onChange: (newValue: string) => void;
    fontSize?: number;
    lineHeight?: number;
    maxWidth?: string;
    showLineNumbers?: boolean;
    split?: boolean;
  } = $props();

  let textareaEl: HTMLTextAreaElement | undefined = $state();
  let backdropEl: HTMLDivElement | undefined = $state();
  let gutterEl: HTMLDivElement | undefined = $state();

  // Local mirror so cursor doesn't jump on parent state updates
  // svelte-ignore state_referenced_locally
  let localValue = $state(value);

  // Keep local in sync if parent value changes from a different source
  // (e.g. external file reload while not editing — though unlikely while editor is mounted)
  $effect(() => {
    if (value !== localValue && document.activeElement !== textareaEl) {
      localValue = value;
    }
  });

  // Line-number gutter. Rendered as a third transparent mirror that wraps
  // identically to the textarea (same font, width, padding), so each logical
  // line's block has the same height as in the textarea and its number — a CSS
  // counter on the block — lines up with the block's top, even when the line
  // soft-wraps to several rows (continuation rows get no number, like a
  // wrapping code editor). No JS height measuring needed.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lineCount = $derived(localValue.split("\n").length);
  // Width the digits need; monospace so `ch` is exact. Min 2 digits + a gap.
  const gutterWidth = $derived(`calc(${Math.max(2, String(lineCount).length)}ch + 16px)`);
  // ponytail: rebuilds all line blocks on each caret move (for the active-line
  // class). O(lines) per keystroke — fine for typical docs; switch to a single
  // positioned highlight bar if it ever lags on very large files.
  const gutterHtml = $derived(
    showLineNumbers
      ? localValue
          // Empty lines would collapse to zero height and desync the count, so
          // give them a zero-width space to reserve exactly one line box.
          .split("\n")
          .map(
            (l, i) =>
              `<div class="gl${i === activeLine ? " active" : ""}">${escapeHtml(l) || "​"}</div>`
          )
          .join("")
      : ""
  );

  // --- Find-in-editor highlight backdrop --------------------------------------
  // mark.js can't highlight a <textarea> (its contents aren't markable DOM text),
  // so the find overlay's edit-mode path mirrors the text into an aria-hidden
  // backdrop sitting exactly behind the transparent textarea and paints <mark>s
  // there. The textarea's opaque text renders on top of the (transparent)
  // backdrop text, so only the match backgrounds show through.
  const matches = $derived(findMatches(localValue, $searchQuery));
  // Mirror the text with an appended trailing newline so the pre-wrap backdrop
  // reserves the same final line a <textarea> always keeps. Without it the
  // backdrop is ~1 line shorter, so near the document bottom its scrollTop
  // clamps to a smaller max and the highlights drift ~1 line below the text.
  // `matches` are computed on the un-suffixed `localValue`, so the extra newline
  // sits past every match and can't shift any offset.
  const highlightHtml = $derived(
    $searchQuery ? buildHighlightHtml(localValue + "\n", matches, $searchActiveIndex) : ""
  );

  // Publish the match count so the overlay's "n/total" counter and its
  // Enter / prev / next navigation work while editing.
  $effect(() => {
    searchTotal.set($searchQuery ? matches.length : 0);
  });

  function syncBackdropScroll() {
    if (backdropEl && textareaEl) {
      backdropEl.scrollTop = textareaEl.scrollTop;
      backdropEl.scrollLeft = textareaEl.scrollLeft;
    }
    if (gutterEl && textareaEl) {
      gutterEl.scrollTop = textareaEl.scrollTop;
    }
  }

  // Scroll the active match into view whenever it changes (next/prev/new search).
  $effect(() => {
    const idx = $searchActiveIndex;
    if (!$searchQuery || matches.length === 0) return;
    // Defer until the backdrop has rendered the new active <mark>.
    requestAnimationFrame(() => {
      const ta = textareaEl;
      const mark = backdropEl?.querySelector<HTMLElement>(`mark[data-match-index="${idx}"]`);
      if (!ta || !mark) return;
      const target = mark.offsetTop - ta.clientHeight / 2;
      ta.scrollTop = Math.max(0, target);
      syncBackdropScroll();
    });
  });

  onMount(() => {
    tick().then(() => {
      try {
        textareaEl?.focus({ preventScroll: true });
      } catch {
        textareaEl?.focus();
      }
    });
  });

  onDestroy(() => {
    // Don't leave a stale match count behind when leaving edit mode.
    searchTotal.set(0);
  });

  // Which logical line the caret is on, for the current-line highlight. Read
  // from selectionStart on every caret move (input, click, arrow keys, focus).
  let activeLine = $state(0);
  function updateActiveLine() {
    if (!textareaEl) return;
    activeLine = localValue.slice(0, textareaEl.selectionStart).split("\n").length - 1;
  }

  function handleInput() {
    onChange(localValue);
    updateActiveLine();
    syncBackdropScroll();
  }

  function handleKeydown(e: KeyboardEvent) {
    // Tab inserts 2 spaces instead of moving focus
    if (e.key === "Tab" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const t = e.target as HTMLTextAreaElement;
      const start = t.selectionStart;
      const end = t.selectionEnd;
      const indent = "  ";
      const newValue = t.value.slice(0, start) + indent + t.value.slice(end);
      localValue = newValue;
      onChange(newValue);
      // Restore cursor after the inserted indent
      tick().then(() => {
        t.selectionStart = t.selectionEnd = start + indent.length;
      });
    }
  }
</script>
<div class="editor-wrap fixed box ycenter bg" class:editor-split={split}>
  <div class="editor-stack relative wfull hfull" class:with-gutter={showLineNumbers} style="--editor-max-width: {maxWidth}; --gutter-w: {gutterWidth};">
    {#if showLineNumbers}
      <!-- Line-number gutter: a transparent mirror wrapping identically to the
           textarea; CSS counters on each line block render the numbers. -->
      <div bind:this={gutterEl} class="editor-gutter absolute" aria-hidden="true"
        style="--editor-font-size: {fontSize}px; --editor-line-height: {lineHeight};"
      >{@html gutterHtml}</div>
    {/if}
    <!-- Highlight layer: mirrors the textarea text so search matches can be
         painted behind the transparent textarea. -->
    <div bind:this={backdropEl} class="editor-backdrop absolute" class:with-gutter={showLineNumbers} aria-hidden="true"
      style="--editor-font-size: {fontSize}px; --editor-line-height: {lineHeight};"
    >{@html highlightHtml}</div>
    <textarea
      bind:this={textareaEl}
      bind:value={localValue}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onkeyup={updateActiveLine}
      onclick={updateActiveLine}
      onfocus={updateActiveLine}
      onscroll={syncBackdropScroll}
      class="editor absolute"
      class:with-gutter={showLineNumbers}
      style="--editor-font-size: {fontSize}px; --editor-line-height: {lineHeight};"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
    ></textarea>
  </div>
</div>
