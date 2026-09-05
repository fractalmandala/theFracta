<script lang="ts">
	import { animationStore } from '$lib/modules/studio/states/animation.svelte';
	import { ANIMATION_PRESETS } from '$lib/modules/studio/animation-math';

	let searchQuery = $state('');

	const filteredPresets = $derived.by(() => {
		if (!searchQuery.trim()) return ANIMATION_PRESETS;
		const q = searchQuery.toLowerCase();
		return ANIMATION_PRESETS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
	});

	function handleSelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		if (target.value) {
			animationStore.setPreset(target.value);
		}
	}
</script>

<div class="box gap12 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Preset</span>
		</div>
		<select
			class="grid-unit-select w100"
			value={animationStore.activePresetId}
			onchange={handleSelect}
		>
			{#each filteredPresets as preset (preset.id)}
				<option value={preset.id}>
					{preset.name}{preset.isStar ? ' ★' : ''}
				</option>
			{/each}
		</select>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Animations ({filteredPresets.length})</span>
		</div>
		<input
			type="text"
			class="gen-text-input"
			placeholder="Filter animations..."
			bind:value={searchQuery}
		/>
		<div class="gen-preset-grid">
			{#each filteredPresets as preset (preset.id)}
				<button
					class="gen-pill-btn gen-preset-btn truncate"
					data-state={animationStore.activePresetId === preset.id ? 'active' : undefined}
					onclick={() => animationStore.setPreset(preset.id)}
					title={preset.name}
				>
					<span class="truncate">{preset.name}</span>
					{#if preset.isStar}
						<span class="text-warning text-xs">★</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>
