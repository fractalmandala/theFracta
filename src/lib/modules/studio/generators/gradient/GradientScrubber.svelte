<script lang="ts">
	import { gradientStore } from '$lib/modules/studio/states/gradient.svelte';

	let trackEl: HTMLDivElement | null = null;
	let draggingStopId = $state<string | null>(null);

	const scrubberLinearCss = $derived.by(() => {
		const sorted = [...gradientStore.stops].sort((a, b) => a.stop - b.stop);
		const stopsStr = sorted.map((s) => `${s.color} ${s.stop}%`).join(', ');
		return `linear-gradient(90deg, ${stopsStr})`;
	});

	function handleTrackClick(e: MouseEvent) {
		if (!trackEl || draggingStopId) return;
		const rect = trackEl.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const percent = Math.round((clickX / rect.width) * 100);
		// Pick color from middle or white
		gradientStore.addStop('#ffffff', percent);
	}

	function handleHandleMouseDown(id: string, e: MouseEvent) {
		e.stopPropagation();
		draggingStopId = id;
		gradientStore.activeStopId = id;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!draggingStopId || !trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const currentX = e.clientX - rect.left;
		const percent = Math.max(0, Math.min(100, Math.round((currentX / rect.width) * 100)));
		gradientStore.updateStopPosition(draggingStopId, percent);
	}

	function handleMouseUp() {
		draggingStopId = null;
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="box w100 gap4">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={trackEl}
		class="gradient-scrubber-track"
		data-interactive
		style="--scrub: {scrubberLinearCss};"
		onclick={handleTrackClick}
	>
		{#each gradientStore.stops as stop (stop.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="gradient-scrubber-handle"
				data-state={gradientStore.activeStopId === stop.id ? 'active' : undefined}
				style="--handle-left: {stop.stop}%; --handle-color: {stop.color};"
				onmousedown={(e) => handleHandleMouseDown(stop.id, e)}
				title="Stop at {stop.stop}% ({stop.color})"
			></div>
		{/each}
	</div>
	<div class="row xbetween text-xs text-muted fw500">
		<span>Click bar to add stop · Drag handles</span>
		<span>{gradientStore.stops.length} stops</span>
	</div>
</div>
