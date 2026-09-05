<script lang="ts">
	import { shadowStore } from '$lib/modules/studio/states/shadow.svelte';

	const shapeRadius = $derived(
		shadowStore.shape === 'circle' ? '9999px' : `${shadowStore.borderRadius}px`
	);
</script>

<div
	class="gen-canvas-stage gen-dot-grid"
	style="--stage-bg: {shadowStore.bgColor};"
>
	<div
		class="shadow-preview-element"
		style="--box-w: {shadowStore.boxWidth}px; --box-h: {shadowStore.boxHeight}px; --box-r: {shapeRadius}; --box-bg: {shadowStore.boxColor}; --box-shadow: {shadowStore.shadowCss};"
	></div>
</div>
