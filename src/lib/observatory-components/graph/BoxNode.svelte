<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	let { data, id }: { data: any; id: string } = $props();

	const ICON: Record<string, string> = {
		stylesheet: '{}',
		entry: '▶',
		cron: '◷',
		service: '◆',
		state: '◈',
		command: '⌘',
		ipc: '⇄',
		store: '▤',
		external: '↗',
		tool: '⚙',
		integration: '⧉',
		model: '✳',
		agent: '◉',
		function: 'ƒ',
		shared: '◇',
		layout: '▢',
		component: '□',
		style: '#',
		layer: '≡',
	};

	const kindClass = $derived(data.kind ? `boxnode-kind-${data.kind}` : '');
</script>

<div
	class="boxnode {kindClass}"
	class:boxnode-collapsed={data.collapsed}
	class:boxnode-leaf={!data.hasChildren}
	class:boxnode-lane={data.lane}
	class:boxnode-dim={data.dim}
	class:boxnode-match={data.match}
	class:boxnode-step={data.step > 0}
	class:boxnode-selected={data.selected}
	style="--hue: {data.hue ?? 210}"
	role="button"
	tabindex="0"
	onclick={() => data.onSelect?.(data.rawNode ?? { id, ...data })}
	onkeydown={(e) => e.key === 'Enter' && data.onSelect?.(data.rawNode ?? { id, ...data })}
>
	<Handle type="target" position={Position.Left} />
	<Handle type="source" position={Position.Right} />

	{#if data.step > 0}<span class="boxnode-stepno">{data.step}</span>{/if}

	<header class="boxnode-header row ycenter gap-2xs">
		{#if data.hasChildren}
			<button
				class="boxnode-chev"
				aria-label={data.collapsed ? 'Expand' : 'Collapse'}
				onclick={(e) => {
					e.stopPropagation();
					data.onToggle?.(id);
				}}>{data.collapsed ? '▸' : '▾'}</button>
		{:else if ICON[data.kind]}
			<span class="boxnode-ic">{ICON[data.kind]}</span>
		{:else}
			<span class="boxnode-dot"></span>
		{/if}
		<span class="boxnode-label" title={id}>{data.label}</span>
		{#if data.kind === 'stylesheet'}
			<span class="boxnode-badge">{data.defines?.classes ?? 0}<span class="boxnode-u">cls</span></span>
		{:else if data.files}
			<span class="boxnode-badge">{data.files}<span class="boxnode-u">f</span></span>
		{/if}
	</header>

	{#if data.sub && !data.collapsed}
		<div class="boxnode-rolled">{data.sub}</div>
	{:else if data.collapsed && data.hiddenCount}
		<div class="boxnode-rolled">
			+{data.hiddenCount} nested{#if data.loc} · {(data.loc / 1000).toFixed(1)}k LOC{/if}
		</div>
	{/if}
</div>
