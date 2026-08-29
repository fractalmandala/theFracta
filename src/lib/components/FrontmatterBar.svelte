<script lang="ts">
  import { document as docStore } from "$lib/stores/document";

  function formatValue(val: unknown): string {
    if (Array.isArray(val)) return val.join(", ");
    if (val instanceof Date) return val.toLocaleDateString();
    return String(val);
  }

  function getDisplayEntries(fm: Record<string, unknown>): [string, string][] {
    return Object.entries(fm)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .slice(0, 6)
      .map(([k, v]) => [k, formatValue(v)]);
  }
</script>

{#if $docStore.frontmatter}
  {@const entries = getDisplayEntries($docStore.frontmatter)}
  {#if entries.length > 0}
    <div class="fm-bar row wrap gap-2xs gap-x-md max-w-measure mx-auto pad-x-md pad-y-2xs border-bottom">
      {#each entries as [key, value]}
        <div class="row ycenter gap-3xs">
          <span class="fm-key text-xs weight-600 tt-u text-muted">{key}</span>
          <span class="text-sm text-secondary">{value}</span>
        </div>
      {/each}
    </div>
  {/if}
{/if}
