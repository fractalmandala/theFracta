<script lang="ts">
  import { onMount } from "svelte";
  import { document as docStore } from "$lib/stores/document";

  let visible = $state(false);

  onMount(() => {
    function update() {
      visible = window.scrollY > 300;
    }
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

{#if visible && $docStore.renderedHtml}
  <button class="scroll-top absolute bg border text-secondary cursor-pointer"
    onclick={scrollToTop} title="Scroll to top (gg)" aria-label="Scroll to top">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <polyline points="4,10 8,6 12,10" />
    </svg>
  </button>
{/if}
