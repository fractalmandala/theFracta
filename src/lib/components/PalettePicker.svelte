<script lang="ts">
	/**
	 * The full palette set, laid out inline.
	 *
	 * The contract's ThemePicker is a popover, and a popover inside a dialog is
	 * clipped by it — the list ran off the right edge of Settings with most of
	 * the 76 palettes unreachable. Settings has the room, so the grid goes in
	 * the page rather than in a layer over it.
	 *
	 * Each swatch wears its own palette's class, so the colours shown are the
	 * palette's real tokens rather than a hand-kept copy that could drift from
	 * the contract.
	 */
	import { themes, presets, setTheme, setMode } from 'fractalstyler2';

	let query = $state('');
	let mode = $state<'all' | 'light' | 'dark'>('all');

	const readable = (id: string) => id.replace(/^theme-/, '').replace(/-/g, ' ');

	const shown = $derived(
		themes.filter(
			(theme) =>
				(mode === 'all' || theme.mode === mode) &&
				readable(theme.id).includes(query.trim().toLowerCase())
		)
	);

	function choose(id: string, themeMode: 'light' | 'dark') {
		setTheme(id);
		// A palette class outranks [data-mode] at equal specificity and later
		// source order, so leaving the mode attribute behind would leave the two
		// disagreeing about whether the app is dark.
		setMode(themeMode);
	}
</script>

<div class="box gap-2xs">
	<div class="row ycenter gap-2xs">
		<input
			class="input text-xs grow min0"
			type="search"
			placeholder="Search palettes"
			aria-label="Search palettes"
			bind:value={query}
		/>
		<div class="segmented shrink-0" role="group" aria-label="Palette mode">
			{#each ['all', 'light', 'dark'] as option}
				<button
					class="segmented-item"
					class:active={mode === option}
					onclick={() => (mode = option as typeof mode)}
				>{option}</button>
			{/each}
		</div>
	</div>

	<div class="palette-grid">
		{#each shown as theme (theme.id)}
			<button
				class="palette-option {theme.id}"
				class:active={presets.theme === theme.id}
				aria-pressed={presets.theme === theme.id}
				onclick={() => choose(theme.id, theme.mode)}
			>
				<!-- Four tokens is enough to tell palettes apart: page, panel,
				     text and the accent everything interactive is tinted with. -->
				<span class="palette-swatch" aria-hidden="true">
					<i></i><i></i><i></i><i></i>
				</span>
				<span class="text-2xs truncate wfull ta-l">{readable(theme.id)}</span>
			</button>
		{:else}
			<p class="text-xs text-muted">No palette matches “{query}”.</p>
		{/each}
	</div>

	<p class="text-2xs text-muted">
		{shown.length} of {themes.length} palettes{mode === 'all' ? '' : ` · ${mode} only`}
	</p>
</div>
