<script lang="ts">
	import { animationStore } from '$lib/modules/studio/states/animation.svelte';
	import {
		EASING_OPTIONS,
		type IterationValue,
		type FillMode,
		type DirectionMode,
		type ElementShape,
		type SpeedMultiplier
	} from '$lib/modules/studio/animation-math';
	import AnimationCatalog from './AnimationCatalog.svelte';
	import SliderControl from '../shared/SliderControl.svelte';

	const ITERATIONS: IterationValue[] = ['1', '2', '3', '5', 'infinite'];
	const FILLS: FillMode[] = ['forwards', 'backwards', 'both', 'none'];
	const DIRECTIONS: DirectionMode[] = ['normal', 'reverse', 'alternate', 'alternate-reverse'];
	const ELEMENTS: ElementShape[] = ['box', 'button', 'text', 'card'];
	const SPEEDS: SpeedMultiplier[] = [0.25, 0.5, 1, 2];
</script>

<div class="box gap16 w100">
	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Timing</span>
		</div>
		<SliderControl
			label="Duration"
			bind:value={animationStore.duration}
			min={0.1}
			max={10}
			step={0.1}
			unit="s"
		/>
		<SliderControl
			label="Delay"
			bind:value={animationStore.delay}
			min={0}
			max={5}
			step={0.1}
			unit="s"
		/>
		<div class="gen-field-grid">
			<div class="gen-field">
				<span class="gen-label">Iterations</span>
				<select class="grid-unit-select w100" bind:value={animationStore.iterations}>
					{#each ITERATIONS as it}
						<option value={it}>{it}</option>
					{/each}
				</select>
			</div>
			<div class="gen-field">
				<span class="gen-label">Easing</span>
				<select class="grid-unit-select w100" bind:value={animationStore.easing}>
					{#each EASING_OPTIONS as e}
						<option value={e.value}>{e.label}</option>
					{/each}
				</select>
			</div>
			<div class="gen-field">
				<span class="gen-label">Fill</span>
				<select class="grid-unit-select w100" bind:value={animationStore.fill}>
					{#each FILLS as f}
						<option value={f}>{f}</option>
					{/each}
				</select>
			</div>
			<div class="gen-field">
				<span class="gen-label">Direction</span>
				<select class="grid-unit-select w100" bind:value={animationStore.direction}>
					{#each DIRECTIONS as d}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Element</span>
		</div>
		<div class="gen-pill-group">
			{#each ELEMENTS as el}
				<button
					class="gen-pill-btn tt-c"
					data-state={animationStore.element === el ? 'active' : undefined}
					onclick={() => animationStore.setElement(el)}
				>
					{el}
				</button>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Speed</span>
		</div>
		<div class="gen-pill-group">
			{#each SPEEDS as spd}
				<button
					class="gen-pill-btn"
					data-state={animationStore.speed === spd ? 'active' : undefined}
					onclick={() => animationStore.setSpeed(spd)}
				>
					{spd === 0.25 ? '¼×' : spd === 0.5 ? '½×' : spd === 1 ? '1×' : '2×'}
				</button>
			{/each}
		</div>
	</div>

	<div class="gen-section">
		<div class="gen-section-header">
			<span class="gen-label">Canvas</span>
		</div>
		<div class="row gap16">
			<label class="gen-check">
				<input
					type="checkbox"
					class="gen-checkbox"
					bind:checked={animationStore.darkBg}
				/>
				<span>Dark BG</span>
			</label>
			<label class="gen-check">
				<input
					type="checkbox"
					class="gen-checkbox"
					bind:checked={animationStore.stagger3}
				/>
				<span>Stagger ×3</span>
			</label>
		</div>
		<div class="row xbetween">
			<div class="gen-status-badge">Auto-saved</div>
			<button class="gen-btn" onclick={() => animationStore.reset()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
					<path d="M3 3v5h5"/>
				</svg>
				<span>Reset</span>
			</button>
		</div>
	</div>

	<div class="gen-section">
		<AnimationCatalog />
	</div>
</div>
