<script lang="ts">
  import { document as docStore } from "$lib/stores/document";

  function readingTime(words: number): string {
    const mins = Math.ceil(words / 230);
    return mins <= 1 ? "1 min read" : `${mins} min read`;
  }

  function tokenEstimate(words: number): string {
    const tokens = Math.round(words * 1.33);
    return tokens >= 1000 ? `~${(tokens / 1000).toFixed(1)}k tokens` : `~${tokens} tokens`;
  }
</script>

{#if $docStore.renderedHtml && $docStore.wordCount > 0}
  <footer class="shrink-0 gap-md pad-y-3xs border-top mono footer row ycenter xcenter gap-3xs pad-x-sm pad-y-2xs text-xs text-muted">
    <span>{$docStore.wordCount.toLocaleString()} words</span>
    <span aria-hidden="true" class="text-muted">&middot;</span>
    <span>{readingTime($docStore.wordCount)}</span>
    <span aria-hidden="true" class="text-muted">&middot;</span>
    <span>{tokenEstimate($docStore.wordCount)}</span>
  </footer>
{/if}
