<script lang="ts">
  import { document } from "../stores/document";
  import { settings } from "../stores/settings";
  import { tocVisible, tocEntries, toggleToc, activeHeadingId } from "../stores/toc";
  import { copyAsRichText, copyAsMarkdown } from "../utils/clipboard";
  import ReaderControls from "./ReaderControls.svelte";
  import { Icon } from "fractalicons";
  import { luBookOpen } from "fractalicons/lucide";

  let {
    onPaste = () => {},
    onOpen = () => {},
    onUrl = () => {},
    rawMode = false,
    onRawToggle = () => {},
    isEditing = false,
    dirty = false,
    canEdit = false,
    editMode = "view",
    onSetMode = (_m: "view" | "split" | "edit") => {},
    onSave = () => {},
    onOpenSettings = () => {},
    canPresent = false,
    presenting = false,
    onTogglePresent = () => {},
  }: {
    onPaste?: () => void;
    onOpen?: () => void;
    onUrl?: () => void;
    rawMode?: boolean;
    onRawToggle?: () => void;
    isEditing?: boolean;
    dirty?: boolean;
    canEdit?: boolean;
    editMode?: "view" | "split" | "edit";
    onSetMode?: (m: "view" | "split" | "edit") => void;
    onSave?: () => void;
    onOpenSettings?: () => void;
    canPresent?: boolean;
    presenting?: boolean;
    onTogglePresent?: () => void;
  } = $props();

  let currentHeading = $derived(
    $activeHeadingId && $tocEntries.length > 0
      ? $tocEntries.find((e) => e.id === $activeHeadingId)?.text ?? null
      : null
  );

  let showReaderControls = $state(false);
  let showCopyMenu = $state(false);
  let copyFeedback = $state("");

  function closeAll() {
    showReaderControls = false;
    showCopyMenu = false;
  }

  function toggleReaderControls() {
    const next = !showReaderControls;
    closeAll();
    showReaderControls = next;
  }

  function toggleCopyMenu() {
    const next = !showCopyMenu;
    closeAll();
    showCopyMenu = next;
  }

  function toggleWidthMode() {
    closeAll();
    settings.update((s) => ({
      ...s,
      widthMode: s.widthMode === "wide" ? "comfortable" : "wide",
    }));
  }

  async function handleExportPdf() {
    window.print();
  }

  async function handleCopyRichText() {
    const article = globalThis.document?.querySelector("article.md-content");
    if (!article || !$document.content) return;
    const success = await copyAsRichText(article.innerHTML, $document.content);
    copyFeedback = success ? "Copied!" : "Failed";
    showCopyMenu = false;
    setTimeout(() => (copyFeedback = ""), 1500);
  }

  async function handleCopyMarkdown() {
    if (!$document.content) return;
    const success = await copyAsMarkdown($document.content);
    copyFeedback = success ? "Copied!" : "Failed";
    showCopyMenu = false;
    setTimeout(() => (copyFeedback = ""), 1500);
  }
</script>

<header class="toolbar sticky row ycenter xbetween gap-xs pad-x-sm pad-y-2xs surface-blur border-bottom min-h-lg">
	<!-- Left: quick entry + current heading -->
	<div class="row ycenter gap-xs grow min0">
		<div class="row ycenter gap-2xs">
			<button onclick={onOpen} class="button small ghost text-xs" title="Open File">Open</button>
			<button onclick={onPaste} class="button small ghost text-xs" title="Paste">Paste</button>
			<button onclick={onUrl} class="button is-icon" title="Open URL" aria-label="Open URL">
				<svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5.5"/><ellipse cx="7" cy="7" rx="2.5" ry="5.5"/><line x1="1.5" y1="7" x2="12.5" y2="7"/></svg>
			</button>
		</div>
		{#if $document.fileName && currentHeading}
			<span class="current-heading text-sm text-muted truncate grow min0">{currentHeading}</span>
		{/if}
	</div>

	<!-- Center: View · Split · Edit segmented control -->
	<div class="row ycenter shrink-0">
		<div class="mode-segmented" role="group" aria-label="View mode"
			title={!$document.filePath
				? 'View · Split · Edit (open a file first)'
				: !canEdit
				? 'Split and Edit are only available for local files'
				: 'View · Split · Edit'}>
			<button class="mode-seg" class:mode-active={editMode === 'view'} onclick={() => onSetMode('view')} disabled={!$document.filePath}>View</button>
			<button class="mode-seg" class:mode-active={editMode === 'split'} onclick={() => onSetMode('split')} disabled={!canEdit}>Split</button>
			<button class="mode-seg" class:mode-active={editMode === 'edit'} onclick={() => onSetMode('edit')} disabled={!canEdit}>Edit</button>
		</div>
	</div>

	<!-- Right: reading controls, raw, present, save, copy, export, settings -->
	<div class="row ycenter gap-3xs shrink-0">
		<button onclick={toggleToc} class="button is-icon" class:tool-active={$tocVisible}
			disabled={!$document.renderedHtml || $tocEntries.length === 0 || isEditing}
			title={!$document.renderedHtml ? 'Table of Contents (open a file first)' : isEditing ? 'Table of Contents (exit edit mode to use)' : $tocEntries.length === 0 ? 'Table of Contents (no headings in this document)' : 'Table of Contents'}
			aria-label="Toggle Table of Contents">
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="10" y2="8"/><line x1="2" y1="12" x2="12" y2="12"/></svg>
		</button>

		<button onclick={toggleReaderControls} class="button is-icon" class:tool-active={showReaderControls}
			disabled={!$document.renderedHtml}
			title={$document.renderedHtml ? 'Reading preferences (Aa)' : 'Reading preferences (open a file first)'}
			aria-label="Reading preferences">
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><text x="1" y="12" font-size="12" font-weight="700" stroke="none" fill="currentColor" font-family="-apple-system, BlinkMacSystemFont, sans-serif">Aa</text></svg>
		</button>

		<button onclick={toggleWidthMode} class="button is-icon" class:tool-active={$settings.widthMode === "wide"}
			disabled={!$document.renderedHtml}
			title={!$document.renderedHtml ? 'Toggle wide view (open a file first)' : $settings.widthMode === "wide" ? 'Use comfortable width' : 'Use wide viewport'}
			aria-label={$settings.widthMode === "wide" ? 'Use comfortable width' : 'Use wide viewport'}>
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2.5 5.5V3.5h2" /><path d="M13.5 5.5V3.5h-2" /><path d="M2.5 10.5v2h2" /><path d="M13.5 10.5v2h-2" /><path d="M5.5 8h5" />
				<path d="M4 8l1.5-1.5" /><path d="M4 8l1.5 1.5" /><path d="M12 8l-1.5-1.5" /><path d="M12 8l-1.5 1.5" />
			</svg>
		</button>

		<button onclick={onRawToggle} class="button is-icon" class:tool-active={rawMode}
			disabled={!$document.renderedHtml || isEditing}
			title={!$document.renderedHtml ? 'View raw markdown (open a file first)' : isEditing ? 'View raw markdown (exit edit mode to use)' : 'View raw markdown (Cmd+U)'}
			aria-label="View raw markdown">
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,5 2,8 6,11"/><polyline points="10,5 14,8 10,11"/><line x1="9" y1="3" x2="7" y2="13"/></svg>
		</button>

		{#if canPresent}
			<button onclick={onTogglePresent} class="button is-icon" class:tool-active={presenting}
				title={presenting ? 'Exit presentation (Esc)' : 'Present slideshow'}
				aria-label={presenting ? 'Exit presentation' : 'Present slideshow'}>
				<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2.5" width="13" height="9" rx="1"/><line x1="6" y1="14" x2="10" y2="14"/><line x1="8" y1="11.5" x2="8" y2="14"/></svg>
			</button>
		{/if}

		<button onclick={onSave} class="button is-icon save-btn" class:save-dirty={dirty}
			disabled={!dirty}
			title={dirty ? 'Save unsaved changes (Cmd+S)' : 'Save (no changes to save)'}
			aria-label="Save">
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h8l2 2v8H3z"/><path d="M5 3v4h6V3"/><rect x="5" y="9" width="6" height="4"/></svg>
			{#if dirty}<span class="dirty-dot absolute" aria-hidden="true"></span>{/if}
		</button>

		<div class="relative">
			<button onclick={toggleCopyMenu} class="button is-icon"
				disabled={!$document.renderedHtml || isEditing}
				title={!$document.renderedHtml ? 'Copy content (open a file first)' : isEditing ? 'Copy content (exit edit mode to use)' : 'Copy content'}
				aria-label="Copy content">
				{#if copyFeedback}
					<span class="copy-feedback text-xs weight-500 text-primary">{copyFeedback}</span>
				{:else}
					<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="8" height="8" rx="1.5"/><path d="M3 11V3h8"/></svg>
				{/if}
			</button>

			{#if showCopyMenu}
				<div class="dropdown popover-shadow fixed bg border pad-3xs">
					<button onclick={handleCopyRichText} class="dropdown-item row ycenter xbetween gap-2xs wfull text-sm">
						<span>Rich Text</span>
						<span class="text-xs text-muted">for Docs / Notion</span>
					</button>
					<button onclick={handleCopyMarkdown} class="dropdown-item row ycenter xbetween gap-2xs wfull text-sm">
						<span>Markdown</span>
						<span class="text-xs text-muted">raw source</span>
					</button>
				</div>
			{/if}
		</div>

		<button onclick={handleExportPdf} class="button is-icon"
			disabled={!$document.renderedHtml || isEditing}
			title={!$document.renderedHtml ? 'Export PDF (open a file first)' : isEditing ? 'Export PDF (exit edit mode to use)' : 'Export PDF'}
			aria-label="Export PDF">
			<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2h6l3 3v9H4z"/><path d="M10 2v3h3"/><polyline points="6,9 8,11 10,9"/><line x1="8" y1="7" x2="8" y2="11"/></svg>
		</button>

		<span aria-hidden="true" class="separator" ></span>

		<button onclick={() => { closeAll(); onOpenSettings(); }} class="button is-icon"
			title="Settings (Cmd+,)" aria-label="Settings">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
				<circle cx="12" cy="12" r="3"/>
			</svg>
		</button>
	</div>
</header>

{#if showCopyMenu || showReaderControls}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="scrim fixed inset-0 scrim-raised" onclick={closeAll} onkeydown={() => {}}></div>
{/if}

<ReaderControls visible={showReaderControls} />
