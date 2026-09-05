<script lang="ts">
	import { transformStore } from '$lib/modules/studio/states/transform.svelte';

	const COLOR_SWATCHES = ['#6366f1', '#06b6d4', '#10b981', '#f97316', '#ec4899'];
</script>

<div
	class="gen-canvas-stage gen-stage-clip"
	class:gen-dot-grid={transformStore.showGrid}
	style="--stage-perspective: {transformStore.perspective > 0 ? `${transformStore.perspective}px` : 'none'};"
>
	<!-- Coordinate Crosshair Reference Lines -->
	{#if transformStore.showGrid}
		<div class="gen-crosshair-h"></div>
		<div class="gen-crosshair-v"></div>
	{/if}

	<!-- Central Transforming Element -->
	<div
		class="transform-target-box"
		style="--tx-bg: {transformStore.elementColor}; --tx-transform: {transformStore.transformCss}; --tx-origin: {transformStore.origin};"
	>
		{transformStore.elementText || 'Element'}
	</div>

	<!-- Bottom Canvas Options Overlay -->
	<div class="gen-canvas-toolbar">
		<label class="gen-check">
			<input
				type="checkbox"
				class="gen-checkbox"
				bind:checked={transformStore.showGrid}
			/>
			<span>Grid</span>
		</label>

		<div class="row gap4">
			{#each COLOR_SWATCHES as c}
				<button
					type="button"
					class="gen-swatch gen-swatch-sm"
					data-state={transformStore.elementColor === c ? 'active' : undefined}
					style="--swatch: {c}"
					onclick={() => transformStore.setElementColor(c)}
					title="Element color {c}"
					aria-label="Element color {c}"
				></button>
			{/each}
		</div>
	</div>
</div>
