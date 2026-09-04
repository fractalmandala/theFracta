<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A collapsible, drag-resizable side rail.
	 *
	 * Every standing sidebar in Fracta — the notes library, the wiki nav and
	 * inspector, the observatory session list and filter panel — is one of these,
	 * so the resize and collapse behaviour is written once and behaves the same
	 * on every surface.
	 *
	 * Width and collapsed state persist per `id`, because a rail width is a
	 * working preference: having to re-drag it on every launch is the kind of
	 * small tax that makes a tool feel disposable.
	 */
	let {
		id,
		side = 'left',
		min = 180,
		max = 520,
		initial = 260,
		label,
		children
	}: {
		id: string;
		side?: 'left' | 'right';
		min?: number;
		max?: number;
		initial?: number;
		label: string;
		children: Snippet;
	} = $props();

	// `id` and `initial` are read once on purpose: a rail's identity and its
	// default width are fixed for the life of the instance, and re-deriving them
	// would discard a width the user has already dragged.
	// svelte-ignore state_referenced_locally
	const KEY = `fracta.rail.${id}`;
	const STEP = 16;

	const clamp = (n: number) => Math.min(max, Math.max(min, n));

	// svelte-ignore state_referenced_locally
	let width = $state(initial);
	let collapsed = $state(false);
	let dragging = $state(false);

	// Restore before first paint of this rail. Storage can throw (private mode,
	// blocked site data), and a rail that cannot remember is still a usable rail.
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
		if (saved && typeof saved.width === 'number') width = clamp(saved.width);
		if (saved && typeof saved.collapsed === 'boolean') collapsed = saved.collapsed;
	} catch {
		/* storage unavailable — defaults apply */
	}

	function persist() {
		try {
			localStorage.setItem(KEY, JSON.stringify({ width, collapsed }));
		} catch {
			/* storage unavailable — the choice stays session-local */
		}
	}

	/**
	 * AGENTS.md forbids inline `style` attributes, and the width is a runtime
	 * value rather than authored styling, so it is written as a custom property
	 * from an effect instead of into the markup.
	 *
	 * This is an effect rather than an action parameter: Svelte 5 actions do not
	 * re-run on parameter change, so `use:fn={width}` would have applied the
	 * initial width and then never updated during a drag.
	 */
	let el = $state<HTMLElement | null>(null);
	$effect(() => {
		el?.style.setProperty('--rail-w', `${width}px`);
	});

	function onPointerDown(event: PointerEvent) {
		if (collapsed) return;
		const grip = event.currentTarget as HTMLElement;
		grip.setPointerCapture(event.pointerId);
		dragging = true;

		const startX = event.clientX;
		const startWidth = width;

		const move = (e: PointerEvent) => {
			const delta = e.clientX - startX;
			width = clamp(startWidth + (side === 'left' ? delta : -delta));
		};
		const up = (e: PointerEvent) => {
			dragging = false;
			grip.releasePointerCapture(e.pointerId);
			grip.removeEventListener('pointermove', move);
			grip.removeEventListener('pointerup', up);
			grip.removeEventListener('pointercancel', up);
			persist();
		};

		grip.addEventListener('pointermove', move);
		grip.addEventListener('pointerup', up);
		grip.addEventListener('pointercancel', up);
	}

	// The separator is a real control: arrow keys resize it, Home/End jump to the
	// bounds, Enter collapses. Dragging must not be the only way to reach a width.
	function onKeyDown(event: KeyboardEvent) {
		const grow = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
		const shrink = side === 'left' ? 'ArrowLeft' : 'ArrowRight';
		if (event.key === grow) width = clamp(width + STEP);
		else if (event.key === shrink) width = clamp(width - STEP);
		else if (event.key === 'Home') width = min;
		else if (event.key === 'End') width = max;
		else if (event.key === 'Enter' || event.key === ' ') toggle();
		else return;
		event.preventDefault();
		persist();
	}

	function toggle() {
		collapsed = !collapsed;
		persist();
	}
</script>

<aside
	class="rail rail-{side}"
	class:rail-collapsed={collapsed}
	class:rail-dragging={dragging}
	aria-label={label}
	bind:this={el}
>
	{#if !collapsed}
		<div class="rail-body">
			{@render children()}
		</div>
	{/if}

	<button
		type="button"
		class="rail-toggle"
		onclick={toggle}
		aria-expanded={!collapsed}
		aria-label={collapsed ? `Show ${label}` : `Hide ${label}`}
		title={collapsed ? `Show ${label}` : `Hide ${label}`}
	>
		<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
			<path
				d={(side === 'left') === collapsed ? 'M3.5 1L7 5l-3.5 4' : 'M6.5 1L3 5l3.5 4'}
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if !collapsed}
		<!--
		  A focusable separator carrying aria-valuenow is the ARIA window-splitter
		  pattern: it is interactive by definition, which the generic
		  non-interactive-element rules do not model.
		-->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="rail-grip"
			role="separator"
			tabindex="0"
			aria-orientation="vertical"
			aria-label="{label} width"
			aria-valuenow={width}
			aria-valuemin={min}
			aria-valuemax={max}
			onpointerdown={onPointerDown}
			onkeydown={onKeyDown}
			ondblclick={toggle}
		></div>
	{/if}
</aside>
