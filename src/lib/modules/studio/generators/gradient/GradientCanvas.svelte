<script lang="ts">
	import { gradientStore } from '$lib/modules/studio/states/gradient.svelte';

	const gradCss = $derived(gradientStore.gradientCssString);
	const anim = $derived(gradientStore.animation);
	const dur = $derived(gradientStore.animationDuration || 6);

	const animProps = $derived.by(() => {
		if (anim === 'off') return { size: 'auto', anim: 'none' };
		switch (anim) {
			case 'slide':
				return { size: '200% 200%', anim: `gradSlide ${dur}s ease infinite` };
			case 'diagonal':
				return { size: '250% 250%', anim: `gradDiagonal ${dur}s ease infinite` };
			case 'hueShift':
				return { size: 'auto', anim: `gradHue ${dur}s linear infinite` };
			case 'breathe':
				return { size: 'auto', anim: `gradBreathe ${dur}s ease-in-out infinite` };
			case 'pulse':
				return { size: 'auto', anim: `gradPulse ${dur}s ease-in-out infinite` };
			case 'spin':
				return { size: 'auto', anim: `gradSpin ${dur}s linear infinite` };
		}
		return { size: 'auto', anim: 'none' };
	});
</script>

<!-- Embedded dynamic keyframes for canvas animations -->
<svelte:head>
	<style>
		@keyframes gradSlide {
			0% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
			100% { background-position: 0% 50%; }
		}
		@keyframes gradDiagonal {
			0% { background-position: 0% 0%; }
			50% { background-position: 100% 100%; }
			100% { background-position: 0% 0%; }
		}
		@keyframes gradHue {
			0% { filter: hue-rotate(0deg); }
			100% { filter: hue-rotate(360deg); }
		}
		@keyframes gradBreathe {
			0%, 100% { transform: scale(1); filter: brightness(1); }
			50% { transform: scale(1.02); filter: brightness(1.15); }
		}
		@keyframes gradPulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.75; }
		}
		@keyframes gradSpin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}
	</style>
</svelte:head>

<div class="row centered w100 h100 minh340">
	{#if gradientStore.previewMode === 'background'}
		<div
			class="gradient-preview-target"
			style="--grad: {gradCss}; --grad-size: {animProps.size}; --grad-anim: {animProps.anim};"
		></div>
	{:else if gradientStore.previewMode === 'text'}
		<div
			class="gradient-preview-target border"
		>
			<h1
				class="gen-grad-heading"
				style="--grad: {gradCss}; --grad-size: {animProps.size}; --grad-anim: {animProps.anim};"
			>
				GRADIENT ART
			</h1>
			<p class="text-lg fw600 text-secondary">
				Dynamic typography styling
			</p>
		</div>
	{:else if gradientStore.previewMode === 'border'}
		<div
			class="gradient-preview-target"
			style="--grad: {gradCss}; --grad-size: {animProps.size}; --grad-anim: {animProps.anim}; --preview-pad: 4px;"
		>
			<div class="gen-grad-border-card">
				<span class="text-lg fw700">Gradient Border Card</span>
				<span class="text-sm text-muted">High-contrast border framing</span>
			</div>
		</div>
	{/if}
</div>
