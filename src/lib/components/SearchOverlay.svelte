<script lang="ts">
  import Mark from "mark.js";
  import {
    searchQuery,
    searchActiveIndex,
    searchTotal,
    resetSearch,
  } from "$lib/stores/search";
  import { cycleIndex } from "$lib/utils/text-search";

  let { visible = $bindable(false) }: { visible: boolean } = $props();

  let inputEl: HTMLInputElement | undefined = $state();
  let markInstance: Mark | null = null;
  let markTarget: HTMLElement | null = null;

  /**
   * The DOM element to highlight in non-edit modes: the rendered Markdown
   * (`article.md-content`) or the raw-source `<pre>`. In edit mode neither exists —
   * the document is a `<textarea>` whose contents aren't markable DOM text, so
   * the Editor component renders its own highlight backdrop instead.
   */
  function getViewTarget(): HTMLElement | null {
    return document.querySelector<HTMLElement>("article.md-content, pre.raw-source");
  }

  function clearMarks() {
    markInstance?.unmark();
    markInstance = null;
    markTarget = null;
  }

  function doSearch() {
    const target = getViewTarget();
    if (!target) return; // edit mode: the Editor backdrop owns highlighting

    if (markTarget !== target) {
      markInstance?.unmark();
      markInstance = new Mark(target);
      markTarget = target;
    }
    const instance = markInstance!;

    instance.unmark({
      done: () => {
        if (!$searchQuery.trim()) {
          searchTotal.set(0);
          searchActiveIndex.set(0);
          return;
        }
        instance.mark($searchQuery, {
          separateWordSearch: false,
          className: "mdv-search-highlight",
          done: (count) => {
            searchTotal.set(count);
            searchActiveIndex.set(0);
            if (count > 0) scrollToViewMatch(0);
          },
        });
      },
    });
  }

  function scrollToViewMatch(index: number) {
    const marks = document.querySelectorAll("mark.mdv-search-highlight");
    if (marks.length === 0) return;
    marks.forEach((m) => m.classList.remove("mdv-search-active"));
    const target = marks[index];
    if (target) {
      target.classList.add("mdv-search-active");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function nextMatch() {
    if ($searchTotal === 0) return;
    searchActiveIndex.set(cycleIndex($searchActiveIndex, $searchTotal, 1));
  }

  function prevMatch() {
    if ($searchTotal === 0) return;
    searchActiveIndex.set(cycleIndex($searchActiveIndex, $searchTotal, -1));
  }

  function close() {
    visible = false;
    clearMarks();
    resetSearch();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        prevMatch();
      } else {
        nextMatch();
      }
    }
  }

  // Focus the input when shown; clear marks + reset state when hidden (covers
  // close button, Esc, the Find menu toggle, and view-mode switches).
  $effect(() => {
    if (visible) {
      inputEl?.focus();
      inputEl?.select();
    } else {
      clearMarks();
      resetSearch();
    }
  });

  // Reset to the first match and re-run view-mode highlighting whenever the
  // query changes while visible. Edit mode is handled reactively by the Editor
  // backdrop, which reads the same query/active-index store.
  $effect(() => {
    $searchQuery; // track
    if (!visible) return;
    searchActiveIndex.set(0);
    doSearch();
  });

  // Move the highlighted/scrolled match when the active index changes (view
  // mode only; the Editor handles scrolling its own active match).
  $effect(() => {
    const idx = $searchActiveIndex;
    if (visible && getViewTarget()) scrollToViewMatch(idx);
  });
</script>
{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="search-bar fixed row ycenter gap-2xs bg border   pad-x-2xs pad-y-3xs" onkeydown={handleKeydown}>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-muted shrink-0">
			<circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" />
		</svg>

		<input
			bind:this={inputEl}
			bind:value={$searchQuery}
			type="text"
			placeholder="Find in document…"
			class="search-input bg-transparent border-0 text-sm text-primary"
		/>

		<span class="search-count text-xs text-muted shrink-0 tabular-nums">
			{#if $searchTotal > 0}
				{$searchActiveIndex + 1}/{$searchTotal}
			{:else if $searchQuery.trim()}
				0
			{/if}
		</span>

		<div class="search-nav row gap-3xs">
			<button onclick={prevMatch} disabled={$searchTotal === 0} class="search-nav-btn is-icon text-secondary" title="Previous (Shift+Enter)" aria-label="Previous match">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="2,8 6,4 10,8"/></svg>
			</button>
			<button onclick={nextMatch} disabled={$searchTotal === 0} class="search-nav-btn is-icon text-secondary" title="Next (Enter)" aria-label="Next match">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><polyline points="2,4 6,8 10,4"/></svg>
			</button>
		</div>

		<button onclick={close} class="search-close is-icon text-muted" title="Close (Esc)" aria-label="Close search">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
		</button>
	</div>
{/if}
