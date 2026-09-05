<script lang="ts">
	let {
		value = $bindable('#6366f1'),
		label = ''
	}: {
		value: string;
		label?: string;
	} = $props();

	function handleColorChange(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
	}
</script>

<div class="gen-color-input-container">
	{#if label}
		<span class="text-sm fw600 text-secondary">{label}</span>
	{/if}
	<div class="gen-color-input-row">
		<label class="gen-color-swatch-btn" style="--swatch: {value}">
			<input
				type="color"
				{value}
				oninput={handleColorChange}
			/>
		</label>
		<input
			type="text"
			class="gen-text-input"
			bind:value
			placeholder="#6366f1"
		/>
	</div>
</div>
