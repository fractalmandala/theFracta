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
    <div class="text-xs row wrap gap-2xs gap-md pad-x-md pad-y-2xs border-bottom content-shell">
      {#each entries as [key, value]}
        <div class="row ycenter gap-3xs">
          <span class="mono text-xs weight-600 tt-u text-muted">{key}</span>
          <span class="text-sm text-secondary">{value}</span>
        </div>
      {/each}
    </div>
  {/if}
{/if}
