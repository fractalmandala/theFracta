<script lang="ts">
	import { graphState, type FlowDef } from '$lib/observatory-state/graph.svelte';

	let { flows }: { flows: FlowDef[] } = $props();

	const activeFlow = $derived(flows.find((f) => f.id === graphState.activeFlowId));
	const totalSteps = $derived(activeFlow?.steps?.length ?? 0);
	const currentStep = $derived(activeFlow?.steps[graphState.activeFlowStepIndex]);
</script>

{#if activeFlow}
	<div class="flow-player-card">
		<div class="flow-header">
			<div class="flow-title-row">
				<span class="badge accent">Flow</span>
				<strong class="flow-name">{activeFlow.name}</strong>
			</div>
			<button class="btn-close" onclick={() => graphState.pickFlow(null)}>✕</button>
		</div>

		{#if activeFlow.trigger}
			<div class="trigger-row">
				<span class="trigger-lbl">Trigger:</span>
				<code class="trigger-code">{activeFlow.trigger}</code>
			</div>
		{/if}

		<div class="stepper-row">
			<button
				class="btn step-btn"
				disabled={graphState.activeFlowStepIndex === 0}
				onclick={() => graphState.prevFlowStep()}
			>
				◀ Prev
			</button>

			<div class="step-indicator">
				<span class="step-count">Step {graphState.activeFlowStepIndex + 1} of {totalSteps}</span>
				<span class="step-node" title={currentStep}>{currentStep}</span>
			</div>

			<button
				class="btn step-btn"
				disabled={graphState.activeFlowStepIndex >= totalSteps - 1}
				onclick={() => graphState.nextFlowStep(totalSteps)}
			>
				Next ▶
			</button>
		</div>

		{#if activeFlow.summary}
			<p class="flow-summary">{activeFlow.summary}</p>
		{/if}
	</div>
{/if}

<style>
	.flow-player-card {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		width: 480px;
		max-width: calc(100vw - 48px);
		padding: 14px 18px;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.flow-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.flow-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.flow-name {
		font-size: 13px;
		color: var(--text-primary);
	}
	.btn-close {
		all: unset;
		cursor: pointer;
		color: var(--text-muted);
		font-size: 12px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
	}
	.trigger-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
	}
	.trigger-lbl {
		color: var(--text-muted);
	}
	.trigger-code {
		background: var(--bg-surface);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--accent);
		font-size: 11px;
	}
	.stepper-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: var(--bg-surface);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
	}
	.step-btn {
		font-size: 11px;
		padding: 4px 8px;
	}
	.step-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
	}
	.step-count {
		font-size: 10px;
		color: var(--text-muted);
	}
	.step-node {
		font-size: 11px;
		font-weight: 600;
		color: #ffd166;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 240px;
	}
	.flow-summary {
		font-size: 11px;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>
