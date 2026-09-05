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

{#if $tocEntries.length > 0}
  <div class="toc wfull">
    <div class="toc-title pad-top-xs">
      On this page
    </div>
    <nav class="toc-list pad-x-2xs pad-bottom-sm">
      {#each $tocEntries as entry (entry.id)}
        <button
          onclick={() => scrollToHeading(entry.id)}
          class="toc-link truncate ta-l cursor-pointer"
          class:active={$activeHeadingId === entry.id}
          style="--toc-indent: {(entry.level - 1) * 12}px"
        >
          {entry.text}
        </button>
      {/each}
    </nav>
  </div>
{/if}
