<script lang="ts">
	import { gridStore } from '$lib/modules/studio/states/grid.svelte';
	import { GRID_PRESETS } from '$lib/modules/studio/grid-math';
	import TrackManager from '$lib/modules/studio/generators/grid/TrackManager.svelte';
	import SliderControl from '$lib/modules/studio/shared/SliderControl.svelte';

	const ALIGN_OPTIONS: Array<'start' | 'end' | 'center' | 'stretch'> = [
		'start',
		'end',
		'center',
		'stretch'
	];
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Presets</span>
		</div>
		<div class="gen-pill-group">
			{#each Object.entries(GRID_PRESETS) as [key, preset]}
				<button
					class="gen-pill-btn"
					data-state={gridStore.selectedPresetKey === key ? 'active' : undefined}
					onclick={() => gridStore.loadPreset(key)}
				>
					{preset.label}
				</button>
			{/each}
		</div>
		<button class="gen-btn" onclick={() => gridStore.reset()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
				<path d="M3 3v5h5"/>
			</svg>
			<span>Reset</span>
		</button>
	</div>

	<TrackManager
		title="Columns"
		tracks={gridStore.columns}
		onAdd={() => gridStore.addColumn(1, 'fr')}
		onRemove={(idx) => gridStore.removeColumn(idx)}
	/>

	<TrackManager
		title="Rows"
		tracks={gridStore.rows}
		onAdd={() => gridStore.addRow(1, 'fr')}
		onRemove={(idx) => gridStore.removeRow(idx)}
	/>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Gap</span>
		</div>
		<SliderControl
			label="Column"
			bind:value={gridStore.colGap}
			min={0}
			max={64}
			unit="px"
		/>
		<SliderControl
			label="Row"
			bind:value={gridStore.rowGap}
			min={0}
			max={64}
			unit="px"
		/>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Alignment</span>
		</div>
		<div class="box gap8">
			<span class="text-sm fw600 text-secondary">justify-items</span>
			<div class="gen-pill-group">
				{#each ALIGN_OPTIONS as opt}
					<button
						class="gen-pill-btn"
						data-state={gridStore.justifyItems === opt ? 'active' : undefined}
						onclick={() => gridStore.setJustifyItems(opt)}
					>
						{opt}
					</button>
				{/each}
			</div>

			<span class="text-sm fw600 text-secondary margintop4">align-items</span>
			<div class="gen-pill-group">
				{#each ALIGN_OPTIONS as opt}
					<button
						class="gen-pill-btn"
						data-state={gridStore.alignItems === opt ? 'active' : undefined}
						onclick={() => gridStore.setAlignItems(opt)}
					>
						{opt}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Areas</span>
			<span class="text-xs text-muted">drag canvas to add</span>
		</div>
		<div class="box gap6">
			{#each gridStore.areas as area (area.id)}
				<div class="gen-area-row">
					<div class="row gap8">
						<span class="gen-area-dot" style="--area-color: {area.color}"></span>
						<span>{area.name}</span>
					</div>
					<span class="text-xs text-muted">
						{area.endCol - area.startCol + 1}×{area.endRow - area.startRow + 1}
					</span>
				</div>
			{/each}
		</div>
	</div>
</div>
