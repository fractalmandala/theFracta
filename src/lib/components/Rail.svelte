<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { railState, readRail, writeRail } from '$lib/states/railState.svelte';
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
	 *
	 * The collapse control is NOT here — it lives in the title bar, so the same
	 * pair of buttons drives whichever surface is open. This component only
	 * announces which side it occupies and reads its collapsed state back.
	 */
	let {
		id,
		side = 'left',
		min = 180,
		max = 520,
		initial = 260,
		defaultCollapsed = false,
		label,
		children
	}: {
		id: string;
		side?: 'left' | 'right';
		min?: number;
		max?: number;
		initial?: number;
		/** What this rail does the first time it is ever shown. A width or
		 *  collapsed state the user has already chosen takes precedence. */
		defaultCollapsed?: boolean;
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
	let width = $state(clamp(readRail(id).width ?? initial));
	let dragging = $state(false);

	// Collapsed lives in railState so the header can read and write it.
	const collapsed = $derived(railState.isCollapsed(id));

	// Claim this side for as long as the rail is on screen.
	$effect(() => railState.register(side, { id, label, defaultCollapsed }));

	function persist() {
		writeRail(id, { width });
	}

	/**
	 * The rail's on-screen width, as a spring rather than a CSS transition.
	 *
	 * A cubic-bezier only imitates a spring: it is a fixed curve, so it cannot
	 * carry velocity into the next change. Interrupt a CSS transition halfway
	 * and it restarts from wherever it happened to be, with no momentum. A real
	 * spring keeps its velocity, so a rail toggled twice in quick succession
	 * turns around smoothly instead of stuttering.
	 *
	 * This is deliberately not Svelte's `transition:` directive. That animates
	 * elements entering and leaving the DOM, so the rail's contents would
	 * unmount on every collapse — losing its scroll position, and making
	 * KnowledgeLibrary re-fetch every pinned folder on each expand. The spring
	 * drives a value instead, so the panel animates while staying mounted.
	 *
	 * Opening and closing are tuned independently: arriving is softer than
	 * dismissing.
	 */
	const OPENING = { stiffness: 0.13, damping: 0.78 };
	const CLOSING = { stiffness: 0.22, damping: 0.92 };

	// svelte-ignore state_referenced_locally
	const rendered = new Spring(collapsed ? 0 : width, OPENING);

	// Springs are physics, not CSS, so the contract's global reduced-motion rule
	// cannot reach them. Honour the preference here instead.
	const still =
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		const target = collapsed ? 0 : width;
		// A drag must land exactly under the pointer; springing toward it would
		// lag the cursor.
		if (dragging || still) {
			rendered.set(target, { instant: true });
			return;
		}
		const tuning = collapsed ? CLOSING : OPENING;
		rendered.stiffness = tuning.stiffness;
		rendered.damping = tuning.damping;
		rendered.set(target);
	});

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
		if (!el) return;
		// The width the panel is laid out at, which the body holds even while the
		// rail is collapsing so its content is swiped rather than reflowed.
		el.style.setProperty('--rail-w', `${width}px`);
		// The animated box, driven by the spring.
		el.style.setProperty('--rail-rendered', `${rendered.current}px`);
		// 1 open, 0 collapsed. The body's slide is derived from this rather than
		// timed separately, so the content cannot drift out of step with its own
		// panel edge.
		el.style.setProperty('--rail-progress', String(width > 0 ? rendered.current / width : 0));
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
		else return;
		event.preventDefault();
		persist();
	}

	function toggle() {
		railState.setCollapsed(id, !collapsed);
	}
</script>

<aside
	class="rail rail-{side} wfull"
	class:rail-collapsed={collapsed}
	class:rail-dragging={dragging}
	aria-label={label}
	bind:this={el}
>
	<!--
	  The body stays mounted while collapsed so the width can animate with real
	  content in it — unmounting would make the panel vanish and only an empty
	  box would slide. `inert` is what keeps a hidden rail out of the tab order
	  and off the accessibility tree, which `{#if}` used to do structurally.
	-->
	<div class="rail-clip">
		<div class="rail-body" inert={collapsed || undefined}>
			{@render children()}
		</div>
	</div>
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
