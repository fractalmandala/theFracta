<script lang="ts">
	import { document as docStore } from "$lib/stores/document";
	import { tabStore, type Tab } from "$lib/stores/tabs";
	import { settings } from "$lib/stores/settings";
	import { tocVisible, tocEntries, toggleToc } from "$lib/stores/toc";
	import { notesState, type NotesMode } from "$lib/states/notesState.svelte";
	import { isMarpDoc } from "$lib/renderer/pipeline";
	import ReaderControls from "./ReaderControls.svelte";
	import { Icon } from "fractalicons";
	import { cuSave } from "fractalicons/coreui";
	import {
		phExport,
		phCopy,
		phCodeBlock,
		phTextAa,
		phListStar,
		phResize,
	} from "fractalicons/phosphor";

	const tabs = tabStore.tabs;
	const activeTabId = tabStore.activeTabId;

	let activeTab = $derived.by(() => {
		const id = $activeTabId;
		if (!id) return null;
		return $tabs.find((t: Tab) => t.id === id) ?? null;
	});

	let dirty = $derived(activeTab?.dirty ?? false);
	let canEdit = $derived.by(() => {
		if (!activeTab || !activeTab.filePath) return false;
		return (
			!activeTab.filePath.startsWith("paste://") &&
			!activeTab.filePath.startsWith("url://")
		);
	});

	// Raw covers both the editable source and, for a document with no file to
	// write back to, the read-only source view.
	let activeMode = $derived.by<NotesMode>(() => {
		if (activeTab?.isEditing) return notesState.richMode ? "rich" : "raw";
		return notesState.rawMode ? "raw" : "read";
	});

	let tocUnavailable = $derived(
		$tocEntries.length === 0 || !!activeTab?.isEditing,
	);

	let activeIsMarp = $derived(isMarpDoc($docStore.frontmatter));
</script>

<div class="row ycenter gap-sm">
	<!-- Read · Rich Text · Raw -->
	<div
		class="segmented"
		role="group"
		aria-label="Document mode"
		data-tip={canEdit
			? undefined
			: "This document has no file to save to, so it can be read but not edited"}
		class:tip={!canEdit}
	>
		<button
			class="segmented-item"
			class:active={activeMode === "read"}
			onclick={() => notesState.setMode("read")}
		>
			Read
		</button>
		<button
			class="segmented-item"
			class:active={activeMode === "rich"}
			onclick={() => notesState.setMode("rich")}
			aria-disabled={!canEdit}
		>
			Rich Text
		</button>
		<button
			class="segmented-item"
			class:active={activeMode === "raw"}
			onclick={() => notesState.setMode("raw")}
		>
			Raw
		</button>
	</div>

	<!-- Table of Contents Toggle -->
	<button
		onclick={() => {
			if (tocUnavailable) return;
			toggleToc();
		}}
		class="button is-icon solid"
		class:text-theme={$tocVisible}
		aria-disabled={tocUnavailable}
		data-tip={activeTab?.isEditing
			? "Table of Contents (exit edit mode to use)"
			: $tocEntries.length === 0
				? "Table of Contents (no headings in this document)"
				: "Table of Contents"}
		aria-label="Toggle Table of Contents"
	>
		<Icon icon={phListStar} size={16} />
	</button>

	<!-- Reading Preferences (Aa) -->
	<button
		onclick={() => notesState.toggleReaderControls()}
		class="button is-icon solid"
		class:text-theme={notesState.showReaderControls}
		data-tip="Reading preferences (Aa)"
		aria-label="Reading preferences"
	>
		<Icon icon={phTextAa} size={16} />
	</button>

	<!-- Width Mode Toggle -->
	<button
		onclick={() => notesState.toggleWidthMode()}
		class="button is-icon solid"
		class:text-theme={$settings.widthMode === "wide"}
		data-tip={$settings.widthMode === "wide"
			? "Use comfortable width"
			: "Use wide viewport"}
		aria-label={$settings.widthMode === "wide"
			? "Use comfortable width"
			: "Use wide viewport"}
	>
		<Icon icon={phResize} size={16} />
	</button>

	<!-- Presentation Slideshow Toggle -->
	{#if activeIsMarp}
		<button
			onclick={() => notesState.togglePresent()}
			class="button is-icon solid"
			class:text-theme={notesState.presenting}
			data-tip={notesState.presenting
				? "Exit presentation (Esc)"
				: "Present slideshow"}
			aria-label={notesState.presenting
				? "Exit presentation"
				: "Present slideshow"}
		>
			<svg
				width="18"
				height="18"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="1.5" y="2.5" width="13" height="9" rx="1" /><line
					x1="6"
					y1="14"
					x2="10"
					y2="14"
				/><line x1="8" y1="11.5" x2="8" y2="14" />
			</svg>
		</button>
	{/if}

	<!-- Save Button -->
	<button
		onclick={() => {
			if (dirty) notesState.save();
		}}
		class="button is-icon is-ghost row ycenter gap-3xs tip"
		class:text-warning={dirty}
		aria-disabled={!dirty}
		data-tip={dirty
			? "Save unsaved changes (Cmd+S)"
			: "Save (no changes to save)"}
		aria-label="Save"
	>
		<Icon icon={cuSave} size={16} />
		{#if dirty}<span
				class="w-6 h-6 radius-32 shrink-0 absolute bg-warning"
				aria-hidden="true"
			></span>{/if}
	</button>

	<!-- Copy Dropdown -->
	<div class="relative">
		<button
			onclick={() => notesState.toggleCopyMenu()}
			class="button is-icon solid"
			data-tip="Copy content"
			aria-label="Copy content"
		>
			{#if notesState.copyFeedback}
				<span class="text-xs weight-500 text-primary"
					>{notesState.copyFeedback}</span
				>
			{:else}
				<Icon icon={phCopy} size={16} />
			{/if}
		</button>

		{#if notesState.showCopyMenu}
			<div
				class="popover open fixed pad-3xs"
				style="top: calc(var(--header-height) + 4px); right: 64px; z-index: var(--z-modal);"
			>
				<button
					onclick={() => notesState.copyRichText()}
					class="navtree-link xbetween gap-2xs wfull"
				>
					<span>Rich Text</span>
					<span class="text-xs text-muted">for Docs / Notion</span>
				</button>
				<button
					onclick={() => notesState.copyMarkdown()}
					class="navtree-link xbetween gap-2xs wfull"
				>
					<span>Markdown</span>
					<span class="text-xs text-muted">raw source</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- Export PDF -->
	<button
		onclick={() => notesState.exportPdf()}
		class="button is-icon solid"
		data-tip="Export PDF"
		aria-label="Export PDF"
	>
		<Icon icon={phExport} size={16} />
	</button>
</div>

{#if notesState.showCopyMenu || notesState.showReaderControls}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="scrim fixed inset-0 scrim-raised"
		onclick={() => notesState.closeOverlays()}
		onkeydown={() => {}}
	></div>
{/if}

<ReaderControls visible={notesState.showReaderControls} />

<style lang="sass">

.segmented
	display: inline-flex
	overflow: hidden
	border: 1px solid var(--border-strong)
	border-radius: 4px

.segmented-item
	background: none
	border: none
	border-right: 1px solid var(--border-strong)
	padding: 2px calc(var(--space-2xs) * var(--pad-scale, 1))
	font-size: var(--text-xs)
	color: var(--text-secondary)
	&:last-child
		border-right: none
	&:hover
		color: var(--text-primary)
	&.active
		background: var(--theme-color)
		color: var(--text-inverse)

</style>
