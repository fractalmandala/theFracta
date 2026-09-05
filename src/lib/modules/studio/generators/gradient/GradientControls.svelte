<script lang="ts">
	import { gradientStore } from '$lib/modules/studio/states/gradient.svelte';
	import {
		type GradientType,
		type PreviewMode,
		type AnimationType,
		GRADIENT_PRESETS
	} from '$lib/modules/studio/gradient-math';
	import SliderControl from '../shared/SliderControl.svelte';

	const TYPES: GradientType[] = ['linear', 'radial', 'conic'];
	const PREVIEWS: PreviewMode[] = ['background', 'text', 'border'];
	const ANIMATIONS: Array<{ id: AnimationType; label: string }> = [
		{ id: 'off', label: 'Off' },
		{ id: 'slide', label: 'Slide' },
		{ id: 'diagonal', label: 'Diagonal' },
		{ id: 'hueShift', label: 'Hue Shift' },
		{ id: 'breathe', label: 'Breathe' },
		{ id: 'pulse', label: 'Pulse' },
		{ id: 'spin', label: 'Spin ✦' }
	];
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Preview</span>
		</div>
		<div class="gen-pill-group">
			{#each PREVIEWS as p}
				<button
					class="gen-pill-btn tt-c"
					data-state={gradientStore.previewMode === p ? 'active' : undefined}
					onclick={() => gradientStore.setPreviewMode(p)}
				>
					{p}
				</button>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Type</span>
		</div>
		<div class="gen-pill-group">
			{#each TYPES as t}
				<button
					class="gen-pill-btn tt-c grow"
					data-state={gradientStore.type === t ? 'active' : undefined}
					onclick={() => gradientStore.setType(t)}
				>
					{t}
				</button>
			{/each}
		</div>
	</div>

	{#if gradientStore.type !== 'radial'}
		<div class="gen-section">
			<div class="gen-section-header">
				<span class="gen-label">Angle</span>
			</div>
			<SliderControl
				label=""
				bind:value={gradientStore.angle}
				min={0}
				max={360}
				unit="°"
			/>
		</div>
	{/if}

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Color Stops</span>
			<button
				class="gen-btn gen-btn-sm"
				onclick={() => gradientStore.addStop('#ffffff', 50)}
			>
				+ Add
			</button>
		</div>
		<div class="box gap8">
			{#each gradientStore.stops as stop (stop.id)}
				<div class="row gap6">
					<label class="gen-color-swatch-btn gen-color-swatch-btn-sm" style="--swatch: {stop.color}">
						<input
							type="color"
							value={stop.color}
							oninput={(e) => gradientStore.updateStopColor(stop.id, (e.target as HTMLInputElement).value)}
						/>
					</label>
					<input
						type="text"
						class="gen-text-input gen-input-sm"
						value={stop.color}
						oninput={(e) => gradientStore.updateStopColor(stop.id, (e.target as HTMLInputElement).value)}
					/>
					<input
						type="range"
						class="gen-range-input"
						min={0}
						max={100}
						value={stop.stop}
						oninput={(e) => gradientStore.updateStopPosition(stop.id, Number((e.target as HTMLInputElement).value))}
					/>
					<span class="gen-mono-value">{stop.stop}%</span>
					{#if gradientStore.stops.length > 2}
						<button
							class="gen-btn gen-btn-sm gen-danger"
							onclick={() => gradientStore.removeStop(stop.id)}
							title="Remove stop"
						>
							✕
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Animate</span>
		</div>
		<div class="gen-pill-group">
			{#each ANIMATIONS as a}
				<button
					class="gen-pill-btn"
					data-state={gradientStore.animation === a.id ? 'active' : undefined}
					onclick={() => gradientStore.setAnimation(a.id)}
				>
					{a.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Presets</span>
		</div>
		<div class="gen-preset-swatches">
			{#each GRADIENT_PRESETS as preset, idx}
				{@const pGrad = preset.stops.map((s) => `${s.color} ${s.stop}%`).join(', ')}
				<button
					class="gen-preset-swatch"
					style="--grad: linear-gradient(135deg, {pGrad});"
					onclick={() => gradientStore.loadPreset(idx)}
					title={preset.label}
				></button>
			{/each}
		</div>
	</div>

	<div class="row xbetween">
		<button class="gen-btn" onclick={() => gradientStore.randomize()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
			</svg>
			<span>Randomize</span>
		</button>
		<button class="gen-btn" onclick={() => gradientStore.reset()}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
				<path d="M3 3v5h5"/>
			</svg>
			<span>Reset</span>
		</button>
	</div>
</div>
