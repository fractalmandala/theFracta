<script lang="ts">
	/**
	 * A squarified treemap.
	 *
	 * Layout needs a pixel width, which only the browser knows, so the container
	 * is measured with a ResizeObserver and the SVG re-laid out when it changes.
	 * The alternative — a fixed viewBox scaled by `preserveAspectRatio` — would
	 * stretch the tiles and with them the areas the reader is comparing.
	 */
	import { squarify } from './treemap';

	export type Tile = { id: string; label: string; value: number; cls: string; note?: string };

	let {
		items,
		height = 260,
		onSelect = undefined,
		formatValue = (value: number) => value.toLocaleString()
	}: {
		items: Tile[];
		height?: number;
		onSelect?: (id: string) => void;
		formatValue?: (value: number) => string;
	} = $props();

	let host = $state<HTMLElement | undefined>();
	let width = $state(600);

	$effect(() => {
		const element = host;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) width = Math.max(1, Math.floor(entry.contentRect.width));
		});
		observer.observe(element);
		return () => observer.disconnect();
	});

	const byId = $derived(new Map(items.map((item) => [item.id, item])));
	const tiles = $derived(
		squarify(items.map((item) => ({ id: item.id, value: item.value })), width, height).flatMap((tile) => {
			const source = byId.get(tile.id);
			return source ? [{ ...tile, ...source }] : [];
		})
	);
</script>

<div bind:this={host}>
	<svg class="treemap" viewBox="0 0 {width} {height}" preserveAspectRatio="none" role="group">
		{#each tiles as tile (tile.id)}
			{@const roomForLabel = tile.width > 62 && tile.height > 34}
			{@const roomForValue = tile.width > 62 && tile.height > 48}
			<g
				class="treemap-tile {tile.cls}"
				role="button"
				tabindex="0"
				aria-label="{tile.label}: {formatValue(tile.value)}. Activate to hide."
				onclick={() => onSelect?.(tile.id)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						onSelect?.(tile.id);
					}
				}}
			>
				<title>{tile.label}: {formatValue(tile.value)}{tile.note ? ` · ${tile.note}` : ''} — click to hide</title>
				<rect class="series-fill" x={tile.x} y={tile.y} width={tile.width} height={tile.height} rx="2" />
				{#if roomForLabel}
					<!--
					  Clipped to its own tile so a long label cannot bleed across
					  a neighbour and be read as belonging to it.
					-->
					<clipPath id="treemap-clip-{tile.id}">
						<rect x={tile.x} y={tile.y} width={tile.width} height={tile.height} />
					</clipPath>
					<g clip-path="url(#treemap-clip-{tile.id})">
						<text class="treemap-text" x={tile.x + 5} y={tile.y + 15}>{tile.label}</text>
						{#if roomForValue}
							<text class="treemap-sub" x={tile.x + 5} y={tile.y + 29}>{formatValue(tile.value)}</text>
						{/if}
					</g>
				{/if}
			</g>
		{/each}
	</svg>
</div>
