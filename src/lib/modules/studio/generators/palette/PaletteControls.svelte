<script lang="ts">
	import { paletteStore } from '$lib/modules/studio/states/palette.svelte';
	import type { HarmonyType } from '$lib/modules/studio/color-math';
	import ColorPickerInput from '$lib/modules/studio/generators/shared/ColorPickerInput.svelte';

	const HARMONIES: HarmonyType[] = [
		'Monochromatic',
		'Analogous',
		'Complementary',
		'Split-Comp',
		'Triadic',
		'Tetradic',
		'Shades',
		'Tints'
	];
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Base Color</span>
		</div>
		<ColorPickerInput bind:value={paletteStore.baseColor} />
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Harmony</span>
		</div>
		<div class="gen-pill-group">
			{#each HARMONIES as h}
				<button
					class="gen-pill-btn"
					data-state={paletteStore.harmony === h ? 'active' : undefined}
					onclick={() => paletteStore.setHarmony(h)}
				>
					{h}
				</button>
			{/each}
		</div>
	</div>

	<div class="row gap8">
		<button class="gen-btn grow" onclick={() => paletteStore.randomize()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
			</svg>
			<span>Randomize</span>
		</button>
		<button class="gen-btn grow" onclick={() => paletteStore.reset()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
				<path d="M3 3v5h5"/>
			</svg>
			<span>Reset</span>
		</button>
	</div>
</div>
