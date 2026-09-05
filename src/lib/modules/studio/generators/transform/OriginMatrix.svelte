<script lang="ts">
	import { transformStore } from '$lib/modules/studio/states/transform.svelte';
	import type { TransformOriginType } from '$lib/modules/studio/transform-math';

	const MATRIX: TransformOriginType[][] = [
		['top left', 'top center', 'top right'],
		['center left', 'center', 'center right'],
		['bottom left', 'bottom center', 'bottom right']
	];
</script>

<div class="gen-section">
	<div class="gen-section-header">
		<span class="gen-label">Transform Origin</span>
		<span class="text-xs tt-c text-theme">
			{transformStore.origin}
		</span>
	</div>

	<div class="transform-origin-grid">
		{#each MATRIX as row}
			{#each row as cell}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="transform-origin-cell"
					data-state={transformStore.origin === cell ? 'active' : undefined}
					onclick={() => transformStore.setOrigin(cell)}
					title={cell}
				></div>
			{/each}
		{/each}
	</div>
</div>
