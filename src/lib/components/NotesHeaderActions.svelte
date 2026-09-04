<script lang="ts">
	import { document as docStore } from '$lib/stores/document';
	import { tabStore, type Tab } from '$lib/stores/tabs';
	import { settings } from '$lib/stores/settings';
	import { tocVisible, tocEntries, toggleToc } from '$lib/stores/toc';
	import { notesState } from '$lib/states/notesState.svelte';
	import { isMarpDoc } from '$lib/renderer/pipeline';
	import ReaderControls from './ReaderControls.svelte';
	import { Icon } from 'fractalicons';
	import { luFilePlus } from 'fractalicons/lucide';

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
			!activeTab.filePath.startsWith('paste://') &&
			!activeTab.filePath.startsWith('url://')
		);
	});

	let activeEditMode = $derived.by(() => {
		if (activeTab?.isEditing) {
			return notesState.splitMode ? 'split' : 'edit';
		}
		return 'view';
	});

	let activeIsMarp = $derived(isMarpDoc($docStore.frontmatter));
</script>

<div class="box gap-2xs">
	<!-- New Document -->
	<button
		class="button is-icon"
		onclick={() => notesState.newDoc()}
		title="New document"
		aria-label="New document"
	>
		<Icon icon={luFilePlus} size={16} />
	</button>

	<!-- View · Split · Edit Segmented Control -->
	<div
		class="mode-segmented"
		role="group"
		aria-label="View mode"
		title={!$docStore.filePath
			? 'View · Split · Edit (open a file first)'
			: !canEdit
			? 'Split and Edit are only available for local files'
			: 'View · Split · Edit'}
	>
		<button
			class="mode-seg"
			class:mode-active={activeEditMode === 'view'}
			onclick={() => notesState.setMode('view')}
			disabled={!$docStore.filePath}
		>
			View
		</button>
		<button
			class="mode-seg"
			class:mode-active={activeEditMode === 'split'}
			onclick={() => notesState.setMode('split')}
			disabled={!canEdit}
		>
			Split
		</button>
		<button
			class="mode-seg"
			class:mode-active={activeEditMode === 'edit'}
			onclick={() => notesState.setMode('edit')}
			disabled={!canEdit}
		>
			Edit
		</button>
	</div>

	<!-- Table of Contents Toggle -->
	<button
		onclick={toggleToc}
		class="button is-icon"
		class:tool-active={$tocVisible}
		disabled={!$docStore.renderedHtml || $tocEntries.length === 0 || activeTab?.isEditing}
		title={!$docStore.renderedHtml
			? 'Table of Contents (open a file first)'
			: activeTab?.isEditing
			? 'Table of Contents (exit edit mode to use)'
			: $tocEntries.length === 0
			? 'Table of Contents (no headings in this document)'
			: 'Table of Contents'}
		aria-label="Toggle Table of Contents"
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
			<line x1="2" y1="4" x2="14" y2="4" />
			<line x1="2" y1="8" x2="10" y2="8" />
			<line x1="2" y1="12" x2="12" y2="12" />
		</svg>
	</button>

	<!-- Reading Preferences (Aa) -->
	<button
		onclick={() => notesState.toggleReaderControls()}
		class="button is-icon"
		class:tool-active={notesState.showReaderControls}
		disabled={!$docStore.renderedHtml}
		title={$docStore.renderedHtml ? 'Reading preferences (Aa)' : 'Reading preferences (open a file first)'}
		aria-label="Reading preferences"
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
			<text x="1" y="12" font-size="12" font-weight="700" stroke="none" fill="currentColor" font-family="-apple-system, BlinkMacSystemFont, sans-serif">Aa</text>
		</svg>
	</button>

	<!-- Width Mode Toggle -->
	<button
		onclick={() => notesState.toggleWidthMode()}
		class="button is-icon"
		class:tool-active={$settings.widthMode === 'wide'}
		disabled={!$docStore.renderedHtml}
		title={!$docStore.renderedHtml
			? 'Toggle wide view (open a file first)'
			: $settings.widthMode === 'wide'
			? 'Use comfortable width'
			: 'Use wide viewport'}
		aria-label={$settings.widthMode === 'wide' ? 'Use comfortable width' : 'Use wide viewport'}
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2.5 5.5V3.5h2" /><path d="M13.5 5.5V3.5h-2" /><path d="M2.5 10.5v2h2" /><path d="M13.5 10.5v2h-2" /><path d="M5.5 8h5" />
			<path d="M4 8l1.5-1.5" /><path d="M4 8l1.5 1.5" /><path d="M12 8l-1.5-1.5" /><path d="M12 8l-1.5 1.5" />
		</svg>
	</button>

	<!-- Raw Markdown Toggle -->
	<button
		onclick={() => notesState.toggleRaw()}
		class="button is-icon"
		class:tool-active={notesState.rawMode}
		disabled={!$docStore.renderedHtml || activeTab?.isEditing}
		title={!$docStore.renderedHtml
			? 'View raw markdown (open a file first)'
			: activeTab?.isEditing
			? 'View raw markdown (exit edit mode to use)'
			: 'View raw markdown (Cmd+U)'}
		aria-label="View raw markdown"
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="6,5 2,8 6,11" /><polyline points="10,5 14,8 10,11" /><line x1="9" y1="3" x2="7" y2="13" />
		</svg>
	</button>

	<!-- Presentation Slideshow Toggle -->
	{#if activeIsMarp}
		<button
			onclick={() => notesState.togglePresent()}
			class="button is-icon"
			class:tool-active={notesState.presenting}
			title={notesState.presenting ? 'Exit presentation (Esc)' : 'Present slideshow'}
			aria-label={notesState.presenting ? 'Exit presentation' : 'Present slideshow'}
		>
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="1.5" y="2.5" width="13" height="9" rx="1" /><line x1="6" y1="14" x2="10" y2="14" /><line x1="8" y1="11.5" x2="8" y2="14" />
			</svg>
		</button>
	{/if}

	<!-- Save Button -->
	<button
		onclick={() => notesState.save()}
		class="button is-icon save-btn"
		class:save-dirty={dirty}
		disabled={!dirty}
		title={dirty ? 'Save unsaved changes (Cmd+S)' : 'Save (no changes to save)'}
		aria-label="Save"
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3 3h8l2 2v8H3z" /><path d="M5 3v4h6V3" /><rect x="5" y="9" width="6" height="4" />
		</svg>
		{#if dirty}<span class="dirty-dot absolute" aria-hidden="true"></span>{/if}
	</button>

	<!-- Copy Dropdown -->
	<div class="relative">
		<button
			onclick={() => notesState.toggleCopyMenu()}
			class="button is-icon"
			disabled={!$docStore.renderedHtml || activeTab?.isEditing}
			title={!$docStore.renderedHtml
				? 'Copy content (open a file first)'
				: activeTab?.isEditing
				? 'Copy content (exit edit mode to use)'
				: 'Copy content'}
			aria-label="Copy content"
		>
			{#if notesState.copyFeedback}
				<span class="copy-feedback text-xs weight-500 text-primary">{notesState.copyFeedback}</span>
			{:else}
				<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="5" y="5" width="8" height="8" rx="1.5" /><path d="M3 11V3h8" />
				</svg>
			{/if}
		</button>

		{#if notesState.showCopyMenu}
			<div
				class="dropdown popover-shadow fixed bg border pad-3xs"
				style="top: calc(var(--header-height) + 4px); right: 64px; z-index: var(--z-modal);"
			>
				<button
					onclick={() => notesState.copyRichText()}
					class="dropdown-item row ycenter xbetween gap-2xs wfull text-sm"
				>
					<span>Rich Text</span>
					<span class="text-xs text-muted">for Docs / Notion</span>
				</button>
				<button
					onclick={() => notesState.copyMarkdown()}
					class="dropdown-item row ycenter xbetween gap-2xs wfull text-sm"
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
		class="button is-icon"
		disabled={!$docStore.renderedHtml || activeTab?.isEditing}
		title={!$docStore.renderedHtml
			? 'Export PDF (open a file first)'
			: activeTab?.isEditing
			? 'Export PDF (exit edit mode to use)'
			: 'Export PDF'}
		aria-label="Export PDF"
	>
		<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<path d="M4 2h6l3 3v9H4z" /><path d="M10 2v3h3" /><polyline points="6,9 8,11 10,9" /><line x1="8" y1="7" x2="8" y2="11" />
		</svg>
	</button>

	<span aria-hidden="true" class="separator"></span>

	<!-- Settings -->
	<button
		onclick={() => notesState.openSettings()}
		class="button is-icon"
		title="Settings (Cmd+,)"
		aria-label="Settings"
	>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
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
