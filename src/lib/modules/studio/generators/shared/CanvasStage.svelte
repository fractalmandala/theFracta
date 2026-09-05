<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children
	}: {
		children: Snippet;
	} = $props();

	let stageEl: HTMLDivElement;

	let scale = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let isPanning = $state(false);

	const MIN_SCALE = 0.25;
	const MAX_SCALE = 4;

	const pointers = new Map<number, { x: number; y: number }>();
	let panStart: { x: number; y: number; panX: number; panY: number } | null = null;
	let pinchStart: {
		dist: number;
		cx: number;
		cy: number;
		scale: number;
		panX: number;
		panY: number;
	} | null = null;

	// Real controls (buttons, inputs, selects, links, labels, role=button, contenteditable
	// and any element opted in with data-interactive) must never start a pan gesture.
	function isInteractive(target: EventTarget | null): boolean {
		let node = target instanceof Element ? target : null;
		while (node && node !== stageEl) {
			if (
				node.matches(
					'button, input, select, textarea, a, label, [role="button"], [contenteditable], [data-interactive]'
				)
			) {
				return true;
			}
			node = node.parentElement;
		}
		return false;
	}

	function clamp(v: number): number {
		return Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));
	}

	function zoomAt(clientX: number, clientY: number, factor: number) {
		const rect = stageEl.getBoundingClientRect();
		const cx = clientX - rect.left;
		const cy = clientY - rect.top;
		const next = clamp(scale * factor);
		const k = next / scale;
		panX = cx - (cx - panX) * k;
		panY = cy - (cy - panY) * k;
		scale = next;
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if (isInteractive(e.target)) return;
		stageEl.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 1) {
			panStart = { x: e.clientX, y: e.clientY, panX, panY };
			pinchStart = null;
			isPanning = true;
		} else if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchStart = {
				dist: Math.hypot(a.x - b.x, a.y - b.y),
				cx: (a.x + b.x) / 2,
				cy: (a.y + b.y) / 2,
				scale,
				panX,
				panY
			};
			panStart = null;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 1 && panStart) {
			panX = panStart.panX + (e.clientX - panStart.x);
			panY = panStart.panY + (e.clientY - panStart.y);
		} else if (pointers.size === 2 && pinchStart) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y);
			const cx = (a.x + b.x) / 2;
			const cy = (a.y + b.y) / 2;
			const next = clamp(pinchStart.scale * (dist / pinchStart.dist));
			const k = next / pinchStart.scale;
			panX = cx - (cx - pinchStart.panX) * k;
			panY = cy - (cy - pinchStart.panY) * k;
			scale = next;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId);
		if (pointers.size < 2) pinchStart = null;
		if (pointers.size === 0) {
			panStart = null;
			isPanning = false;
		}
	}

	function handleWheel(e: WheelEvent) {
		if (e.ctrlKey || e.metaKey) {
			e.preventDefault();
			zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.1 : 1 / 1.1);
		} else {
			panX -= e.deltaX;
			panY -= e.deltaY;
		}
	}

	function zoomCenter(factor: number) {
		const rect = stageEl.getBoundingClientRect();
		zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
	}

	function resetView() {
		scale = 1;
		panX = 0;
		panY = 0;
	}
</script>

<div
	class="canvas-stage"
	class:is-panning={isPanning}
	bind:this={stageEl}
	role="application"
	aria-label="Preview canvas — drag to pan, ctrl/⌘ + scroll to zoom"
	style="--stage-transform: translate({panX}px, {panY}px) scale({scale});"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onwheel={handleWheel}
>
	<div class="canvas-viewport">
		<div class="canvas-content">
			{@render children()}
		</div>
	</div>

	<div class="canvas-zoombar">
		<button class="gen-btn gen-btn-sm canvas-zoom-btn" onclick={() => zoomCenter(1 / 1.25)} title="Zoom out">−</button>
		<span class="canvas-zoom-label">{Math.round(scale * 100)}%</span>
		<button class="gen-btn gen-btn-sm canvas-zoom-btn" onclick={() => zoomCenter(1.25)} title="Zoom in">+</button>
		<button class="gen-btn gen-btn-sm" onclick={resetView} title="Reset view">⤢</button>
	</div>
</div>
