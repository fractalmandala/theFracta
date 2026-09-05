<script lang="ts">
  import { splitSlides } from "$lib/renderer/slides";
  import { renderFull, stripFrontmatter } from "$lib/renderer/pipeline";
  import MarkdownRenderer from "./MarkdownRenderer.svelte";

  let {
    content,
    baseDir = "",
    paginate = false,
    onExit = () => {},
    onLocalLink,
  }: {
    content: string;
    baseDir?: string;
    paginate?: boolean;
    onExit?: () => void;
    onLocalLink?: (href: string) => void;
  } = $props();

  // Split once per content change, then render each slide's HTML up front so
  // navigation is instant (decks are small; assets were already whitelisted when
  // the file opened, so no per-slide allow_assets call is needed).
  let slideHtmls = $derived(
    splitSlides(stripFrontmatter(content)).map((s) => renderFull(s, baseDir).html)
  );

  let current = $state(0);

  // Keep the index valid if the deck shrinks (e.g. after an edit).
  $effect(() => {
    if (current > slideHtmls.length - 1) current = Math.max(0, slideHtmls.length - 1);
  });

  const total = $derived(slideHtmls.length);

  function go(delta: number) {
    current = Math.min(total - 1, Math.max(0, current + delta));
  }

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault();
        go(1);
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        go(-1);
        break;
      case "Home":
        e.preventDefault();
        current = 0;
        break;
      case "End":
        e.preventDefault();
        current = total - 1;
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        onExit();
        break;
    }
  }
</script>
<svelte:window onkeydown={handleKeydown} />

<div class="present-root fixed inset-0 box ycenter xcenter gap-2xs pad-md z-modal" role="presentation">
  <button class="is-ghost absolute is-icon text-muted cursor-pointer" onclick={onExit} title="Exit presentation (Esc)" aria-label="Exit presentation">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
  </button>

  <button class="is-ghost absolute is-icon text-muted cursor-pointer shrink-0" onclick={() => go(-1)} disabled={current === 0} aria-label="Previous slide">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,4 7,12 15,20"/></svg>
  </button>

  <div class="min0 row ycenter xcenter pad-xl frame-16-9 bg overflow-hidden box grow">
    {#key current}
      <div class="present-slide grow min0 scroll-y">
        <MarkdownRenderer html={slideHtmls[current] ?? ""} {onLocalLink} />
      </div>
    {/key}
    {#if paginate && total > 0}
      <div class="present-counter absolute text-sm tabular-nums text-muted">{current + 1} / {total}</div>
    {/if}
  </div>

  <button class="is-ghost absolute is-icon text-muted cursor-pointer shrink-0" onclick={() => go(1)} disabled={current >= total - 1} aria-label="Next slide">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,4 17,12 9,20"/></svg>
  </button>
</div>
