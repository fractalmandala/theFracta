<script lang="ts">
	import { transformStore } from '$lib/modules/studio/states/transform.svelte';
	import { TRANSFORM_PRESETS } from '$lib/modules/studio/transform-math';
	import OriginMatrix from './OriginMatrix.svelte';
	import SliderControl from '../shared/SliderControl.svelte';
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Presets</span>
		</div>
		<div class="gen-pill-group">
			{#each Object.entries(TRANSFORM_PRESETS) as [key, preset]}
				<button
					class="gen-pill-btn"
					data-state={transformStore.activePresetKey === key ? 'active' : undefined}
					onclick={() => transformStore.loadPreset(key)}
				>
					{preset.label}
				</button>
			{/each}
		</div>
		<button class="gen-btn" onclick={() => transformStore.reset()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
				<path d="M3 3v5h5"/>
			</svg>
			<span>Reset</span>
		</button>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">↔ Translate</span>
		</div>
		<SliderControl
			label="X-axis"
			bind:value={transformStore.translateX}
			min={-200}
			max={200}
			unit="px"
			showRangeLabels
		/>
		<SliderControl
			label="Y-axis"
			bind:value={transformStore.translateY}
			min={-200}
			max={200}
			unit="px"
			showRangeLabels
		/>
		<SliderControl
			label="Z-axis"
			bind:value={transformStore.translateZ}
			min={-200}
			max={200}
			unit="px"
			showRangeLabels
		/>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">↻ Rotate</span>
		</div>
		<SliderControl
			label="Z-axis"
			bind:value={transformStore.rotateZ}
			min={-360}
			max={360}
			unit="deg"
			showRangeLabels
		/>
		<SliderControl
			label="X-axis"
			bind:value={transformStore.rotateX}
			min={-180}
			max={180}
			unit="deg"
			showRangeLabels
		/>
		<SliderControl
			label="Y-axis"
			bind:value={transformStore.rotateY}
			min={-180}
			max={180}
			unit="deg"
			showRangeLabels
		/>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">↗ Scale</span>
		</div>
		<SliderControl
			label="X-axis"
			bind:value={transformStore.scaleX}
			min={-3}
			max={3}
			step={0.1}
			unit="×"
			showRangeLabels
		/>
		<SliderControl
			label="Y-axis"
			bind:value={transformStore.scaleY}
			min={-3}
			max={3}
			step={0.1}
			unit="×"
			showRangeLabels
		/>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">／ Skew</span>
		</div>
		<SliderControl
			label="X-axis"
			bind:value={transformStore.skewX}
			min={-60}
			max={60}
			unit="deg"
			showRangeLabels
		/>
		<SliderControl
			label="Y-axis"
			bind:value={transformStore.skewY}
			min={-60}
			max={60}
			unit="deg"
			showRangeLabels
		/>
	</div>

	<OriginMatrix />
</div>
