<script lang="ts">
	import { graphState } from '$lib/observatory-state/graph.svelte';

	let { scan, selected, query, onselect }: {
		scan: any;
		selected?: any;
		query?: string;
		onselect?: (item: any) => void;
	} = $props();

	const files: any[] = $derived(scan?.files ?? []);

	const maxCommits = $derived(Math.max(1, ...files.map((f) => f.commits ?? 0)));
	const risk = (f: any) => {
		const churn = Math.log1p(f.commits ?? 0) / Math.log1p(maxCommits);
		const cx = (f.complexity ?? 0) / 100;
		return Math.round((0.55 * churn + 0.45 * cx) * 100);
	};

	const ranked = $derived.by(() => {
		const scored = files.map((f) => ({ ...f, raw: risk(f) })).sort((a, b) => a.raw - b.raw);
		const n = Math.max(1, scored.length - 1);
		scored.forEach((f, i) => {
			f.risk = Math.round((i / n) * 100);
		});
		return new Map<string, any>(scored.map((f) => [f.path, f]));
	});

	const groups = $derived.by(() => {
		const g = new Map<string, { key: string; files: any[]; loc: number }>();
		for (const f of files) {
			const parts = f.path.split('/');
			const key = parts.slice(0, Math.min(2, parts.length - 1)).join('/') || '.';
			if (!g.has(key)) g.set(key, { key, files: [], loc: 0 });
			const b = g.get(key)!;
			b.files.push(ranked.get(f.path) ?? { ...f, risk: 0, raw: 0 });
			b.loc += f.loc ?? 0;
		}
		return [...g.values()].sort((a, b) => b.loc - a.loc);
	});

	function selectFile(b: any) {
		onselect?.(b);
		graphState.selectNode({
			id: b.path,
			label: b.path.split('/').pop(),
			kind: 'file',
			sourceRef: `${b.path}:1`,
			detail: `${b.loc} LOC · ${b.commits} commits · ${b.authors ?? 1} authors · Complexity ${b.complexity ?? 0}`,
			data: { loc: b.loc, commits: b.commits, linesChanged: b.linesChanged, authors: b.authors },
		});
	}

	function handleFileKeydown(e: KeyboardEvent, b: any) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectFile(b);
		}
	}

	function squarify(items: any[], x: number, y: number, w: number, h: number) {
		const out: any[] = [];
		const total = items.reduce((a, i) => a + i.value, 0) || 1;
		const scaleArea = (w * h) / total;
		let rest = items.map((i) => ({ ...i, area: i.value * scaleArea }));
		let cx = x, cy = y, cw = w, ch = h;

		const worst = (row: any[], len: number) => {
			const s = row.reduce((a, r) => a + r.area, 0);
			const mx = Math.max(...row.map((r) => r.area));
			const mn = Math.min(...row.map((r) => r.area));
			return Math.max((len * len * mx) / (s * s), (s * s) / (len * len * mn));
		};

		while (rest.length) {
			const horizontal = cw >= ch;
			const len = horizontal ? ch : cw;
			const row = [rest[0]];
			let i = 1;
			while (i < rest.length && worst([...row, rest[i]], len) <= worst(row, len)) row.push(rest[i++]);
			const rowArea = row.reduce((a, r) => a + r.area, 0);
			const thick = rowArea / len;
			let off = 0;
			for (const r of row) {
				const side = r.area / thick;
				out.push(
					horizontal
						? { ...r, x: cx, y: cy + off, w: thick, h: side }
						: { ...r, x: cx + off, y: cy, w: side, h: thick }
				);
				off += side;
			}
			if (horizontal) {
				cx += thick;
				cw -= thick;
			} else {
				cy += thick;
				ch -= thick;
			}
			rest = rest.slice(row.length);
			if (cw <= 0.5 || ch <= 0.5) break;
		}
		return out;
	}

	const W = 1000, H = 640, PAD = 3, HEAD = 18;

	const boxes = $derived.by(() => {
		const outer = squarify(groups.map((g) => ({ ...g, value: g.loc })), 0, 0, W, H);
		const all: any[] = [];
		for (const g of outer) {
			all.push({ type: 'group', ...g });
			const iw = Math.max(1, g.w - PAD * 2), ih = Math.max(1, g.h - PAD - HEAD);
			if (iw < 12 || ih < 12) continue;
			const inner = squarify(
				g.files.map((f: any) => ({ ...f, value: Math.max(f.loc, 1) })).sort((a: any, b: any) => b.value - a.value),
				g.x + PAD, g.y + HEAD, iw, ih
			);
			for (const f of inner) all.push({ type: 'file', ...f });
		}
		return all;
	});

	// Token-routed heatmap: each color reads from a CSS variable the consumer
	// has declared via a class hook (.treemap-tier-low etc.). The fill comes
	// from a per-file CSS variable so the SVG can read it.
	function tierClass(r: number): string {
		if (r < 30) return 'treemap-tier-low';
		if (r < 60) return 'treemap-tier-mid';
		if (r < 85) return 'treemap-tier-high';
		return 'treemap-tier-peak';
	}
</script>

<div class="treemap-canvas box gap-3xs pad-sm">
	<!-- Legend -->
	<header class="row ycenter xbetween pad-y-2xs text-xs text-secondary">
		<span class="weight-600">Churn × Complexity Heatmap</span>
		<div class="row ycenter gap-2xs text-3xs">
			<span class="treemap-legend-label">Low Risk</span>
			<div class="treemap-legend-bar"></div>
			<span class="treemap-legend-label">High Risk</span>
		</div>
	</header>

	<svg viewBox="0 0 {W} {H}" class="treemap-svg wfull grow min0">
		{#each boxes as b}
			{#if b.type === 'group'}
				<g class="treemap-group">
					<rect x={b.x} y={b.y} width={b.w} height={b.h} class="treemap-group-box" />
					<text x={b.x + 4} y={b.y + 12} class="treemap-group-label">{b.key}</text>
				</g>
			{:else}
				{@const isMatch = query && b.path.toLowerCase().includes(query.toLowerCase())}
				{@const isSel = selected?.path === b.path}
				<g
					class="treemap-file {tierClass(b.risk ?? 0)}"
					class:treemap-match={isMatch}
					class:treemap-selected={isSel}
					role="button"
					tabindex="0"
					aria-label="{b.path}: {b.loc} lines of code, {b.commits} commits"
					onclick={() => selectFile(b)}
					onkeydown={(e) => handleFileKeydown(e, b)}
				>
					<rect x={b.x} y={b.y} width={b.w} height={b.h} class="treemap-file-box" />
					{#if b.w > 40 && b.h > 18}
						<text x={b.x + 4} y={b.y + 12} class="treemap-file-label">{b.path.split('/').pop()}</text>
					{/if}
				</g>
			{/if}
		{/each}
	</svg>
</div>
