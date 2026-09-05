<script lang="ts">
	import type { GridTrack, TrackUnit } from '$lib/modules/studio/grid-math';

	let {
		title = 'Columns',
		tracks = $bindable([]),
		onAdd,
		onRemove
	}: {
		title: string;
		tracks: GridTrack[];
		onAdd: () => void;
		onRemove: (idx: number) => void;
	} = $props();

	const UNITS: TrackUnit[] = ['px', 'fr', '%', 'auto', 'em', 'rem'];
</script>

<div class="gen-section">
	<div class="gen-section-header">
		<span class="gen-label">{title}</span>
		<button class="gen-btn gen-btn-sm" onclick={onAdd}>
			+ Add
		</button>
	</div>

	<div class="grid-track-list">
		{#each tracks as track, idx (track.id)}
			<div class="grid-track-row">
				<span class="grid-track-index">{idx + 1}</span>
				{#if track.unit !== 'auto'}
					<input
						type="text"
						class="grid-track-input"
						bind:value={track.value}
						placeholder="1"
					/>
				{/if}
				<select class="grid-unit-select" bind:value={track.unit}>
					{#each UNITS as u}
						<option value={u}>{u}</option>
					{/each}
				</select>
				{#if tracks.length > 1}
					<button
						class="gen-btn gen-btn-sm gen-danger"
						onclick={() => onRemove(idx)}
						title="Delete track"
					>
						✕
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>
