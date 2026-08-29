<script lang="ts">
  import { tocEntries, activeHeadingId, tocVisible, setActiveHeading } from "$lib/stores/toc";

  function scrollToHeading(id: string) {
    setActiveHeading(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = 70;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }
</script>

{#if $tocVisible && $tocEntries.length > 0}
  <aside class="toc-sidebar fixed bg border-right overflow-y-auto">
    <div class="toc-header pad-x-sm pad-top-xs text-xs weight-600 tt-u text-muted">
      On this page
    </div>
    <nav class="toc-nav box pad-x-2xs pad-bottom-sm gap-3xs">
      {#each $tocEntries as entry (entry.id)}
        <button
          onclick={() => scrollToHeading(entry.id)}
          class="toc-item text-sm text-secondary truncate text-left cursor-pointer"
          class:toc-active={$activeHeadingId === entry.id}
          style="--toc-indent: {(entry.level - 1) * 12}px"
        >
          {entry.text}
        </button>
      {/each}
    </nav>
  </aside>
{/if}
