<script lang="ts">
	import { animationStore } from '$lib/modules/studio/states/animation.svelte';
	import { ANIMATION_PRESETS } from '$lib/modules/studio/animation-math';

	const preset = $derived(animationStore.preset);
	const dur = $derived(animationStore.effectiveDuration);
	const delay = $derived(animationStore.delay);
	const iter = $derived(animationStore.iterations);
	const easing = $derived(animationStore.easing);
	const fill = $derived(animationStore.fill);
	const dir = $derived(animationStore.direction);

	function getAnimStyle(delayOffset = 0) {
		const totalDelay = Math.max(0, delay + delayOffset);
		return `${preset.id} ${dur}s ${easing} ${totalDelay}s ${iter} ${dir} ${fill}`;
	}

	// Generate all @keyframes rules for all presets
	const allKeyframesCss = $derived.by(() => {
		return ANIMATION_PRESETS.map((p) => {
			let lines = `@keyframes ${p.id} {\n`;
			for (const stop of p.keyframes) {
				lines += `  ${stop.offset} {\n`;
				for (const [prop, val] of Object.entries(stop.properties)) {
					const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
					lines += `    ${kebab}: ${val};\n`;
				}
				lines += `  }\n`;
			}
			lines += `}`;
			return lines;
		}).join('\n\n');
	});
</script>

<svelte:head>
	<!-- Dynamically register CSS keyframes -->
	{@html `<style>${allKeyframesCss}</style>`}
</svelte:head>

<div
	class="gen-canvas-stage gen-dot-grid"
	class:gen-stage-dark={animationStore.darkBg}
>
	<!-- Animation Stage Container keyed by replayKey -->
	{#key animationStore.replayKey}
		<div class="row centered gap24">
			{#if animationStore.stagger3}
				{#each [0, 1, 2] as idx}
					{#if animationStore.element === 'box'}
						<div
							class="gen-anim-box"
							style="--elt-anim: {getAnimStyle(idx * 0.15)}"
						>
							Item {idx + 1}
						</div>
					{:else if animationStore.element === 'button'}
						<button
							class="gen-anim-button"
							data-size="sm"
							style="--elt-anim: {getAnimStyle(idx * 0.15)}"
						>
							Button {idx + 1}
						</button>
					{:else if animationStore.element === 'text'}
						<span
							class="gen-anim-text"
							style="--elt-anim: {getAnimStyle(idx * 0.15)}"
						>
							Item {idx + 1}
						</span>
					{:else if animationStore.element === 'card'}
						<div
							class="gen-anim-card"
							style="--elt-anim: {getAnimStyle(idx * 0.15)}"
						>
							<div class="gen-anim-avatar"></div>
							<div class="gen-skel" style="--skel-w: 80%"></div>
							<div class="gen-skel" style="--skel-w: 50%"></div>
						</div>
					{/if}
				{/each}
			{:else}
				{#if animationStore.element === 'box'}
					<div
						class="gen-anim-box"
						data-size="lg"
						style="--elt-anim: {getAnimStyle(0)}"
					>
						Preview
					</div>
				{:else if animationStore.element === 'button'}
					<button
						class="gen-anim-button"
						style="--elt-anim: {getAnimStyle(0)}"
					>
						Preview Button
					</button>
				{:else if animationStore.element === 'text'}
					<h1
						class="gen-anim-text"
						data-size="lg"
						style="--elt-anim: {getAnimStyle(0)}"
					>
						PREVIEW
					</h1>
				{:else if animationStore.element === 'card'}
					<div
						class="gen-anim-card"
						data-size="lg"
						style="--elt-anim: {getAnimStyle(0)}"
					>
						<div class="row gap12">
							<div class="gen-anim-avatar" data-size="lg"></div>
							<div class="box gap4 grow">
								<div class="gen-skel" style="--skel-w: 70%"></div>
								<div class="gen-skel" style="--skel-w: 40%"></div>
							</div>
						</div>
						<div class="gen-skel" style="--skel-w: 100%"></div>
						<div class="gen-skel" style="--skel-w: 85%"></div>
					</div>
				{/if}
			{/if}
		</div>
	{/key}

	<!-- Replay Action Button -->
	<button
		class="gen-btn"
		onclick={() => animationStore.replay()}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
		</svg>
		<span>Replay</span>
	</button>
</div>
