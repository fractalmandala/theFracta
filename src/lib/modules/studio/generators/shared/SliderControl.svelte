<script lang="ts">
	let {
		label = '',
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		unit = '',
		showRangeLabels = false
	}: {
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		showRangeLabels?: boolean;
	} = $props();
</script>

<div class="gen-slider-control">
	<div class="gen-slider-row">
		{#if label}
			<span class="gen-slider-label">{label}</span>
		{/if}
		<input
			type="range"
			class="gen-range-input"
			{min}
			{max}
			{step}
			bind:value
		/>
		<div class="row gap2">
			<input
				type="number"
				class="gen-number-input"
				{min}
				{max}
				{step}
				bind:value
			/>
			{#if unit}
				<span class="gen-unit">{unit}</span>
			{/if}
		</div>
	</div>
	{#if showRangeLabels}
		<div class="gen-range-labels">
			<span>{min}{unit}</span>
			<span>{max}{unit}</span>
		</div>
	{/if}
</div>
