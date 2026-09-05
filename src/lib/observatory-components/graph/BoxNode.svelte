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
	class:italic={data.collapsed}
	class:border-dashed={!data.hasChildren}
	class:box={data.lane}
	class:opacity-half={data.dim}
	class:border-warning={data.match}
	class:row={data.step > 0}
	class:border-theme={data.selected}
	style="--hue: {data.hue ?? 210}"
	role="button"
	tabindex="0"
	onclick={() => data.onSelect?.(data.rawNode ?? { id, ...data })}
	onkeydown={(e) => e.key === 'Enter' && data.onSelect?.(data.rawNode ?? { id, ...data })}
>
	<Handle type="target" position={Position.Left} />
	<Handle type="source" position={Position.Right} />

	{#if data.step > 0}<span class="mono tabular-nums text-muted">{data.step}</span>{/if}

	<header class="gap-3xs text-xs row ycenter gap-2xs">
		{#if data.hasChildren}
			<button
				class="w-12 shrink-0 text-muted"
				aria-label={data.collapsed ? 'Expand' : 'Collapse'}
				onclick={(e) => {
					e.stopPropagation();
					data.onToggle?.(id);
				}}>{data.collapsed ? '▸' : '▾'}</button>
		{:else if ICON[data.kind]}
			<span class="w-12 shrink-0 text-muted">{ICON[data.kind]}</span>
		{:else}
			<span class="w-6 h-6 radius-32 shrink-0 bg-theme"></span>
		{/if}
		<span class="truncate" title={id}>{data.label}</span>
		{#if data.kind === 'stylesheet'}
			<span class="mono text-2xs text-muted">{data.defines?.classes ?? 0}<span class="boxnode-u">cls</span></span>
		{:else if data.files}
			<span class="mono text-2xs text-muted">{data.files}<span class="boxnode-u">f</span></span>
		{/if}
	</header>

	{#if data.sub && !data.collapsed}
		<div class="italic text-muted">{data.sub}</div>
	{:else if data.collapsed && data.hiddenCount}
		<div class="italic text-muted">
			+{data.hiddenCount} nested{#if data.loc} · {(data.loc / 1000).toFixed(1)}k LOC{/if}
		</div>
	{/if}
</div>
