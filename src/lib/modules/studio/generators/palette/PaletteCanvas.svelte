<script lang="ts">
	import { paletteStore } from'$lib/modules/studio/states/palette.svelte';
	import { suiteState } from '$lib/modules/studio/states/suite.svelte';

	async function copyHex(hex: string) {
		await navigator.clipboard.writeText(hex);
		suiteState.showCopied(`Copied ${hex} to clipboard!`);
	}
</script>

<div class="palette-canvas-container">
	{#each paletteStore.swatches as swatch (swatch.id)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="palette-swatch-column"
			style="--swatch: {swatch.hex}"
			data-dark={swatch.contrastWhite > swatch.contrastBlack ? undefined : 'true'}
			onclick={() => copyHex(swatch.hex)}
			title="Click to copy {swatch.hex}"
		>
			<div class="box xcenter gap4">
				{#if swatch.isBase}
					<div class="palette-base-badge">BASE</div>
				{/if}
			</div>

			<div class="palette-swatch-info">
				<span class="palette-swatch-hex">{swatch.hex}</span>
				<span class="palette-swatch-sub">
					hsl({swatch.hsl.h}, {swatch.hsl.s}%, {swatch.hsl.l}%)
				</span>
				<div class="palette-swatch-meta">
					<span title="WCAG contrast vs White">W: {swatch.contrastWhite}</span>
					<span>·</span>
					<span title="WCAG contrast vs Black">B: {swatch.contrastBlack}</span>
				</div>
			</div>
		</div>
	{/each}
</div>
