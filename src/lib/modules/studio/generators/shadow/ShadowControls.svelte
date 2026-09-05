<script lang="ts">
	import { shadowStore } from '$lib/modules/studio/states/shadow.svelte';
	import SliderControl from '$lib/modules/studio/shared/SliderControl.svelte';
	import ColorPickerInput from '$lib/modules/studio/generators/shared/ColorPickerInput.svelte';

	const BG_SWATCHES = ['#ffffff', '#0f172a', '#1e293b', '#064e3b', '#f8fafc'];

	let activeL = $derived(shadowStore.activeLayer);
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Background</span>
		</div>
		<div class="row gap6">
			{#each BG_SWATCHES as bg}
				<button
					type="button"
					class="gen-swatch"
					data-state={shadowStore.bgColor === bg ? 'active' : undefined}
					style="--swatch: {bg}"
					onclick={() => shadowStore.setBgColor(bg)}
					title="Background {bg}"
					aria-label="Background {bg}"
				></button>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Box Color</span>
		</div>
		<div class="row gap6">
			<label class="gen-color-swatch-btn" style="--swatch: {shadowStore.boxColor}">
				<input
					type="color"
					value={shadowStore.boxColor}
					oninput={(e) => shadowStore.setBoxColor((e.target as HTMLInputElement).value)}
				/>
			</label>
			<input
				type="text"
				class="gen-text-input gen-input-sm"
				value={shadowStore.boxColor}
				oninput={(e) => shadowStore.setBoxColor((e.target as HTMLInputElement).value)}
			/>
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Shape</span>
		</div>
		<div class="gen-pill-group">
			<button
				class="gen-pill-btn"
				data-state={shadowStore.shape === 'rect' ? 'active' : undefined}
				onclick={() => shadowStore.setShape('rect')}
			>
				■ Rect
			</button>
			<button
				class="gen-pill-btn"
				data-state={shadowStore.shape === 'circle' ? 'active' : undefined}
				onclick={() => shadowStore.setShape('circle')}
			>
				● Circle
			</button>
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Shadow Layers</span>
			<button class="gen-btn gen-btn-sm" onclick={() => shadowStore.addLayer()}>
				+ Add Layer
			</button>
		</div>

		<div class="box gap6">
			{#each shadowStore.layers as layer (layer.id)}
				{@const isActive = shadowStore.activeLayerId === layer.id}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="shadow-layer-item"
					data-state={isActive ? 'active' : undefined}
					onclick={() => (shadowStore.activeLayerId = layer.id)}
				>
					<span data-state={layer.visible ? 'on' : 'off'}>
						{layer.x}px {layer.y}px {layer.blur}px {layer.spread}px
					</span>
					<div class="row gap6">
						<button
							class="gen-btn gen-btn-icon-sm"
							onclick={(e) => {
								e.stopPropagation();
								shadowStore.toggleLayerVisibility(layer.id);
							}}
							title="Toggle visibility"
						>
							{layer.visible ? '👁' : '🚫'}
						</button>
						{#if shadowStore.layers.length > 1}
							<button
								class="gen-btn gen-btn-icon-sm gen-danger"
								onclick={(e) => {
									e.stopPropagation();
									shadowStore.removeLayer(layer.id);
								}}
								title="Delete layer"
							>
								✕
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	{#if activeL}
		<div class="gen-section">
			<div class="gen-section-header">
				<span class="gen-label">Layer Properties</span>
			</div>
			<SliderControl
				label="Offset X"
				bind:value={activeL.x}
				min={-100}
				max={100}
			/>
			<SliderControl
				label="Offset Y"
				bind:value={activeL.y}
				min={-100}
				max={100}
			/>
			<SliderControl
				label="Blur"
				bind:value={activeL.blur}
				min={0}
				max={100}
			/>
			<SliderControl
				label="Spread"
				bind:value={activeL.spread}
				min={-50}
				max={50}
			/>
			<ColorPickerInput
				label="Color"
				bind:value={activeL.color}
			/>
			<div class="row xbetween">
				<span class="gen-slider-label">Opacity</span>
				<div class="row grow gap8 marginleft16">
					<input
						type="range"
						class="gen-range-input"
						min={0}
						max={1}
						step={0.01}
						bind:value={activeL.opacity}
					/>
					<span class="gen-mono-value">
						{Math.round(activeL.opacity * 100)}%
					</span>
				</div>
			</div>
			<label class="gen-check margintop4">
				<input
					type="checkbox"
					class="gen-checkbox"
					bind:checked={activeL.inset}
				/>
				<span>Inset shadow</span>
			</label>
		</div>
	{/if}

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Box Options</span>
		</div>
		<SliderControl
			label="Width"
			bind:value={shadowStore.boxWidth}
			min={60}
			max={360}
		/>
		<SliderControl
			label="Height"
			bind:value={shadowStore.boxHeight}
			min={60}
			max={360}
		/>
		{#if shadowStore.shape === 'rect'}
			<SliderControl
				label="Border Radius"
				bind:value={shadowStore.borderRadius}
				min={0}
				max={100}
				unit="px"
			/>
		{/if}
	</div>

	<div class="row xbetween">
		<div class="gen-status-badge">Auto-saved</div>
		<button class="gen-btn" onclick={() => shadowStore.reset()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
				<path d="M3 3v5h5"/>
			</svg>
			<span>Reset</span>
		</button>
	</div>
</div>
