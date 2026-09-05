<script lang="ts">
	import {
		suiteState,
		TOOLS_CATALOG,
		type GeneratorToolId
	} from '$lib/modules/studio/states/suite.svelte';
	import { animationStore, type AnimationExportTab } from '$lib/modules/studio/states/animation.svelte';
	import { paletteStore, type PaletteExportTab } from '$lib/modules/studio/states/palette.svelte';
	import { gridStore, type GridExportTab } from '$lib/modules/studio/states/grid.svelte';
	import { gradientStore, type GradientExportTab } from '$lib/modules/studio/states/gradient.svelte';
	import { shadowStore, type ShadowExportTab } from '$lib/modules/studio/states/shadow.svelte';
	import { transformStore, type TransformExportTab } from '$lib/modules/studio/states/transform.svelte';

	import AnimationControls from './animation/AnimationControls.svelte';
	import AnimationCanvas from './animation/AnimationCanvas.svelte';
	import PaletteControls from './palette/PaletteControls.svelte';
	import PaletteCanvas from './palette/PaletteCanvas.svelte';
	import GridControls from './grid/GridControls.svelte';
	import InteractiveGridCanvas from './grid/InteractiveGridCanvas.svelte';
	import GradientControls from './gradient/GradientControls.svelte';
	import GradientScrubber from './gradient/GradientScrubber.svelte';
	import GradientCanvas from './gradient/GradientCanvas.svelte';
	import ShadowControls from './shadow/ShadowControls.svelte';
	import ShadowCanvas from './shadow/ShadowCanvas.svelte';
	import TransformControls from './transform/TransformControls.svelte';
	import TransformCanvas from './transform/TransformCanvas.svelte';
	import CodeExportBar from './shared/CodeExportBar.svelte';
	import CanvasStage from './shared/CanvasStage.svelte';

	let { initialTool }: { initialTool?: GeneratorToolId } = $props();

	$effect(() => {
		if (initialTool) {
			suiteState.setTool(initialTool);
		}
	});

	// ---- per-tool code export configuration ----
	const EXPORT_TABS: Record<GeneratorToolId, Array<{ id: string; label: string }>> = {
		animation: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'react', label: 'React' },
			{ id: 'edit', label: 'Edit KF' }
		],
		palette: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS Vars' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'hex', label: 'Hex' },
			{ id: 'hsl', label: 'HSL' },
			{ id: 'scss', label: 'SCSS' }
		],
		grid: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS' },
			{ id: 'scss', label: 'SCSS' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'react', label: 'React' },
			{ id: 'html', label: 'HTML' }
		],
		gradient: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'scss', label: 'SCSS' }
		],
		shadow: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'js', label: 'JS Object' },
			{ id: 'scss', label: 'SCSS Var' }
		],
		transform: [
			{ id: 'sass', label: 'SASS' },
			{ id: 'css', label: 'CSS' },
			{ id: 'tailwind', label: 'Tailwind' },
			{ id: 'react', label: 'React' }
		]
	};

	const COPY_LABELS: Record<GeneratorToolId, string> = {
		animation: 'COPY',
		palette: 'Copy All',
		grid: 'Copy',
		gradient: 'Copy',
		shadow: 'COPY',
		transform: 'Copy'
	};

	let animationCode = $derived(animationStore.getCode(animationStore.activeExportTab));
	let paletteCode = $derived(paletteStore.getCode(paletteStore.activeExportTab));
	let gridCode = $derived(gridStore.getCode(gridStore.activeExportTab));
	let gradientCode = $derived(gradientStore.getCode(gradientStore.activeExportTab));
	let shadowCode = $derived(shadowStore.getCode(shadowStore.activeExportTab));
	let transformCode = $derived(transformStore.getCode(transformStore.activeExportTab));
</script>

<div class="gen-suite">
	<!-- Left: tool switcher + all controls -->
	<aside class="sidebar" data-side="left">
		<nav class="gen-tool-nav">
			{#each TOOLS_CATALOG as tool}
				<button
					class="gen-nav-btn"
					data-state={suiteState.activeTool === tool.id ? 'active' : undefined}
					onclick={() => suiteState.setTool(tool.id)}
				>
					{#if tool.id === 'animation'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="5 3 19 12 5 21 5 3"></polygon>
						</svg>
					{:else if tool.id === 'palette'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
							<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
							<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
							<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
							<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
						</svg>
					{:else if tool.id === 'grid'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
					{:else if tool.id === 'gradient'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path>
							<path d="m14 7 3 3"></path>
							<path d="M5 6v4"></path>
							<path d="M19 14v4"></path>
							<path d="M10 2v2"></path>
							<path d="M7 8H3"></path>
							<path d="M21 16h-4"></path>
							<path d="M11 3H9"></path>
						</svg>
					{:else if tool.id === 'shadow'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="3" y1="9" x2="21" y2="9"></line>
							<line x1="9" y1="21" x2="9" y2="9"></line>
						</svg>
					{:else if tool.id === 'transform'}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"></path>
							<path d="m15 15 6-6"></path>
							<path d="M21 14V9h-5"></path>
						</svg>
					{/if}
					<span>{tool.shortTitle}</span>
				</button>
			{/each}
		</nav>

		<div class="gen-controls-panel">
			{#if suiteState.activeTool === 'animation'}
				<AnimationControls />
			{:else if suiteState.activeTool === 'palette'}
				<PaletteControls />
			{:else if suiteState.activeTool === 'grid'}
				<GridControls />
			{:else if suiteState.activeTool === 'gradient'}
				<GradientControls />
			{:else if suiteState.activeTool === 'shadow'}
				<ShadowControls />
			{:else if suiteState.activeTool === 'transform'}
				<TransformControls />
			{/if}
		</div>
	</aside>

	<!-- Center: pan/zoom canvas with live previews -->
	<main class="body-center">
		<CanvasStage>
			{#if suiteState.activeTool === 'animation'}
				<AnimationCanvas />
			{:else if suiteState.activeTool === 'palette'}
				<PaletteCanvas />
			{:else if suiteState.activeTool === 'grid'}
				<InteractiveGridCanvas />
			{:else if suiteState.activeTool === 'gradient'}
				<div class="gen-center-stack">
					<GradientScrubber />
					<div class="grow min-h-0">
						<GradientCanvas />
					</div>
				</div>
			{:else if suiteState.activeTool === 'shadow'}
				<ShadowCanvas />
			{:else if suiteState.activeTool === 'transform'}
				<TransformCanvas />
			{/if}
		</CanvasStage>
	</main>

	<!-- Right: code export -->
	<aside class="sidebar" data-side="right">
		{#if suiteState.activeTool === 'animation'}
			<CodeExportBar
				tabs={EXPORT_TABS.animation}
				bind:activeTab={animationStore.activeExportTab}
				code={animationCode}
				copyLabel={COPY_LABELS.animation}
			/>
		{:else if suiteState.activeTool === 'palette'}
			<CodeExportBar
				tabs={EXPORT_TABS.palette}
				bind:activeTab={paletteStore.activeExportTab}
				code={paletteCode}
				copyLabel={COPY_LABELS.palette}
			/>
		{:else if suiteState.activeTool === 'grid'}
			<CodeExportBar
				tabs={EXPORT_TABS.grid}
				bind:activeTab={gridStore.activeExportTab}
				code={gridCode}
				copyLabel={COPY_LABELS.grid}
			/>
		{:else if suiteState.activeTool === 'gradient'}
			<CodeExportBar
				tabs={EXPORT_TABS.gradient}
				bind:activeTab={gradientStore.activeExportTab}
				code={gradientCode}
				copyLabel={COPY_LABELS.gradient}
			/>
		{:else if suiteState.activeTool === 'shadow'}
			<CodeExportBar
				tabs={EXPORT_TABS.shadow}
				bind:activeTab={shadowStore.activeExportTab}
				code={shadowCode}
				copyLabel={COPY_LABELS.shadow}
			/>
		{:else if suiteState.activeTool === 'transform'}
			<CodeExportBar
				tabs={EXPORT_TABS.transform}
				bind:activeTab={transformStore.activeExportTab}
				code={transformCode}
				copyLabel={COPY_LABELS.transform}
			/>
		{/if}

		{#if suiteState.copiedToast}
			<div class="gen-toast">
				{suiteState.copiedToast}
			</div>
		{/if}
	</aside>
</div>
