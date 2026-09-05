<script lang="ts">
	/**
	 * The open document's name, above its content.
	 *
	 * The tab bar carries the name too, but it is in the window's title bar and
	 * competes with every other open tab; while you are editing, the thing you
	 * are editing should say what it is. Shown in the two editing modes and in
	 * the raw source view — not in Read, where the rendered document leads with
	 * its own H1 and this would be a duplicate title.
	 *
	 * Display only. Renaming a file is a filesystem operation with its own
	 * failure modes (collisions, permissions, open handles); an editable-looking
	 * heading that silently does nothing would be worse than no heading.
	 */
	let {
		fileName,
		dirty = false,
		saveState = 'idle',
		saveError = null,
		maxWidth
	}: {
		fileName: string;
		dirty?: boolean;
		/** What autosave is doing with this document right now. */
		saveState?: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
		saveError?: string | null;
		maxWidth: string;
	} = $props();

	/**
	 * What the dot says.
	 *
	 * A failed write is the one state that must not read as a passing phase: it
	 * stays, in the danger colour, and carries the reason. "Saved" is shown only
	 * while the document is actually clean — a save that failed leaves the tab
	 * dirty, and the dot must agree with that rather than with the attempt.
	 */
	let mark = $derived.by(() => {
		if (saveState === 'error') return { glyph: '!', cls: 'text-danger', label: saveError ?? 'Could not save' };
		if (dirty) return { glyph: '•', cls: 'text-warning', label: saveState === 'saving' ? 'Saving…' : 'Unsaved changes' };
		if (saveState === 'saved') return { glyph: '', cls: 'text-muted', label: 'Saved' };
		return null;
	});

	// The extension is a filesystem detail, not part of the document's name.
	let title = $derived(fileName.replace(/\.(md|markdown|mdown|mkd)$/i, ''));

	// The measure is a runtime setting, so it arrives as a length string rather
	// than a token. Written as a custom property rather than a style attribute,
	// which the styling contract does not allow in markup.
	let el = $state<HTMLElement | undefined>();
	$effect(() => {
		el?.style.setProperty('--doc-title-max', maxWidth);
	});
</script>

<header bind:this={el} class="doc-title shrink-0">
	<h1 class="row ycenter gap-2xs text-lg weight-600 text-primary min0">
		<span class="truncate">{title}</span>
		{#if mark}
			<span class="{mark.cls} shrink-0 text-xs weight-500" title={mark.label} aria-label={mark.label}>
				{mark.glyph || mark.label}
			</span>
		{/if}
	</h1>
</header>
