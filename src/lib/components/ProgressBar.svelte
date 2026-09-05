<script lang="ts">
  import { onMount } from "svelte";
  import { document as docStore } from "$lib/stores/document";

  let progress = $state(0);

  onMount(() => {
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? Math.min((window.scrollY / max) * 100, 100) : 0;
    }
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  });
</script>

{#if $docStore.renderedHtml}
  <div class="h-2 bg-theme relative" style="--progress: {progress}%"></div>
{/if}
