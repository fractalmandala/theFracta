<script lang="ts">
	import { graphState, type FlowDef } from '$lib/observatory-state/graph.svelte';

	let { flows }: { flows: FlowDef[] } = $props();

	const activeFlow = $derived(flows.find((f) => f.id === graphState.activeFlowId));
	const totalSteps = $derived(activeFlow?.steps?.length ?? 0);
	const currentStep = $derived(activeFlow?.steps[graphState.activeFlowStepIndex]);
</script>

{#if activeFlow}
	<aside class="flow-player card border pad-sm box gap-3xs" aria-label="Flow player">
		<header class="row ycenter xbetween gap-2xs border-bottom pad-bottom-2xs">
			<div class="row ycenter gap-2xs">
				<span class="badge">Flow</span>
				<strong class="text-sm weight-600">{activeFlow.name}</strong>
			</div>
			<button class="button is-icon text-muted" onclick={() => graphState.pickFlow(null)} aria-label="Close flow player">✕</button>
		</header>

		{#if activeFlow.trigger}
			<div class="row ycenter gap-2xs text-xs text-muted pad-y-2xs">
				<span class="tt-u weight-600">Trigger</span>
				<code class="trigger-code">{activeFlow.trigger}</code>
			</div>
		{/if}

		<div class="row ycenter xbetween gap-2xs pad-y-2xs">
			<button
				class="button ghost text-xs"
				disabled={graphState.activeFlowStepIndex === 0}
				onclick={() => graphState.prevFlowStep()}
			>◀ Prev</button>
			<div class="box gap-3xs text-center grow min0">
				<span class="text-xs text-muted">Step {graphState.activeFlowStepIndex + 1} of {totalSteps}</span>
				<span class="text-sm weight-500 truncate">{currentStep}</span>
			</div>
			<button
				class="button ghost text-xs"
				disabled={graphState.activeFlowStepIndex >= totalSteps - 1}
				onclick={() => graphState.nextFlowStep(totalSteps)}
			>Next ▶</button>
		</div>

		{#if activeFlow.summary}
			<p class="text-sm text-secondary m-0">{activeFlow.summary}</p>
		{/if}
	</aside>
{/if}
