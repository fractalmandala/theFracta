<script lang="ts">
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import BoxNode from './BoxNode.svelte';
	import { layoutGraph } from './layout';
	import { graphState } from '$lib/observatory-state/graph.svelte';

	let { scan }: { scan: any } = $props();

	const nodeTypes = {
		box: BoxNode
	};

	let flowNodes = $state.raw<any[]>([]);
	let flowEdges = $state.raw<any[]>([]);
	let isComputing = $state(false);

	const rawNodes = $derived(scan?.nodes ?? []);
	const rawEdges = $derived(scan?.edges ?? []);
	const flows = $derived(scan?.flows ?? []);
	const groups = $derived(scan?.groups ?? []);

	// Active flow path calculation
	const activeFlow = $derived(flows.find((f: any) => f.id === graphState.activeFlowId));
	const flowSteps = $derived(activeFlow?.steps ?? []);
	const onPath = $derived(new Set(flowSteps));

	// Normalize nodes & lanes
	const normalizedGraph = $derived.by(() => {
		const used = new Set(rawNodes.map((n: any) => n.group).filter(Boolean));
		const nodesIn: any[] = [];
		for (const g of groups) {
			if (!used.has(g.id)) continue;
			nodesIn.push({
				id: `group:${g.id}`,
				kind: 'dir',
				label: g.label ?? g.id,
				parentId: null,
				data: { files: 0, loc: 0, lane: true }
			});
		}
		for (const n of rawNodes) {
			nodesIn.push({
				...n,
				parentId: n.parentId ?? (n.group && used.has(n.group) ? `group:${n.group}` : null),
				data: { files: 0, loc: 0, ...(n.data ?? {}) }
			});
		}
		return {
			nodes: nodesIn,
			edges: rawEdges.map((e: any, i: number) => ({
				...e,
				id: e.id ?? `e${i}`,
				layer: e.layer ?? e.kind ?? 'import:internal',
				weight: e.weight ?? 1
			}))
		};
	});

	// Compute ELK layout
	$effect(() => {
		const graph = normalizedGraph;
		const collapsed = graphState.collapsed;
		const preset = scan?.scan === 'system' ? 'lanes' : 'layout';

		isComputing = true;
		layoutGraph(graph, { collapsed, preset })
			.then(({ positions, visible, edges, childrenOf }) => {
				const HUES = [212, 158, 32, 280, 8, 190, 96, 330];
				const roots = childrenOf.get('__root__') ?? [];
				const hueOf = new Map<string, number>();
				roots.forEach((r: any, i: number) => {
					const h = HUES[i % HUES.length];
					const paint = (id: string) => {
						hueOf.set(id, h);
						(childrenOf.get(id) ?? []).forEach((c: any) => paint(c.id));
					};
					paint(r.id);
				});

				const byId = new Map(graph.nodes.map((n: any) => [n.id, n]));

				const nodesOut = [...visible].map((id) => {
					const orig = byId.get(id) ?? { id };
					const pos = positions.get(id) ?? { x: 0, y: 0, width: 190, height: 52 };
					const kids = childrenOf.get(id) ?? [];
					const isColl = collapsed.has(id);
					const stepIdx = flowSteps.indexOf(id);

					const query = graphState.searchQuery.toLowerCase().trim();
					const isMatch = query
						? (orig.label ?? '').toLowerCase().includes(query) || (orig.id ?? '').toLowerCase().includes(query)
						: false;
					const isDim = activeFlow && !onPath.has(id);

					return {
						id,
						type: 'box',
						position: { x: pos.x, y: pos.y },
						parentId: orig.parentId && visible.has(orig.parentId) ? orig.parentId : undefined,
						extent: orig.parentId && visible.has(orig.parentId) ? 'parent' : undefined,
						style: `width: ${pos.width}px; height: ${pos.height}px;`,
						data: {
							label: orig.label ?? id,
							sub: orig.sub,
							kind: orig.kind ?? 'file',
							files: orig.data?.files,
							loc: orig.data?.loc,
							defines: orig.data?.defines,
							collapsed: isColl,
							hasChildren: kids.length > 0,
							hiddenCount: isColl ? kids.length : 0,
							lane: orig.data?.lane,
							hue: hueOf.get(id) ?? 210,
							dim: isDim,
							match: isMatch,
							step: stepIdx >= 0 ? stepIdx + 1 : 0,
							selected: graphState.selectedNode?.id === id,
							rawNode: orig,
							onToggle: (nodeId: string) => graphState.toggleCollapse(nodeId),
							onSelect: (nodeObj: any) => graphState.selectNode(nodeObj)
						}
					};
				});

				const LAYER_COLORS: Record<string, string> = {
					'import:internal': '#5c7cfa',
					'import:cross-package': '#f4a261',
					'style:class': '#c084fc',
					'style:token': '#2dd4bf',
					'style:mixin': '#f472b6',
					renders: '#5c7cfa',
					reads: '#2dd4bf',
					writes: '#f4a261',
					calls: '#a78bfa',
					commands: '#fbbf24',
					ipc: '#f472b6',
					navigates: '#4ade80',
					violation: '#ef4444'
				};

				const edgesOut = edges
					.filter((e) => {
						if (graphState.activeLayers.size > 0 && !graphState.activeLayers.has(e.layer)) return false;
						return (e.weight ?? 1) >= graphState.minWeight;
					})
					.map((e) => {
						const color = LAYER_COLORS[e.layer] ?? '#8b93a7';
						const isOnFlow = activeFlow && onPath.has(e.source) && onPath.has(e.target);
						return {
							id: e.id,
							source: e.source,
							target: e.target,
							label: e.label,
							animated: isOnFlow,
							style: `stroke: ${isOnFlow ? '#ffd166' : color}; stroke-width: ${isOnFlow ? 3 : Math.min(4, 1 + Math.log2(e.weight || 1))}px; opacity: ${activeFlow && !isOnFlow ? 0.1 : 0.8};`
						};
					});

				flowNodes = nodesOut;
				flowEdges = edgesOut;
				isComputing = false;
			})
			.catch((err) => {
				console.error('Layout computation error:', err);
				isComputing = false;
			});
	});
</script>

<div class="flow-container">
	<SvelteFlow nodes={flowNodes} edges={flowEdges} {nodeTypes} fitView minZoom={0.1} maxZoom={2.5}>
		<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
		<Controls />
		<MiniMap nodeColor="#30363d" maskColor="rgba(13, 17, 23, 0.7)" />
	</SvelteFlow>

	{#if isComputing}
		<div class="computing-badge">
			<div class="spinner"></div>
			<span>Computing layout...</span>
		</div>
	{/if}
</div>

<style>
	.flow-container {
		width: 100%;
		height: 100%;
		position: relative;
		background: var(--bg);
	}
	.computing-badge {
		position: absolute;
		top: 16px;
		right: 16px;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-panel);
		border: 1px solid var(--border);
		font-size: 11px;
		color: var(--text-muted);
	}
	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
