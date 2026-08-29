import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export const PRESETS: Record<string, any> = {
	layout: {
		'elk.algorithm': 'layered',
		'elk.direction': 'RIGHT',
		'elk.hierarchyHandling': 'SEPARATE_CHILDREN',
		'elk.layered.spacing.nodeNodeBetweenLayers': '80',
		'elk.spacing.nodeNode': '34',
		'elk.spacing.componentComponent': '48',
		'elk.padding': '[top=20,left=20,bottom=20,right=20]'
	},
	lanes: {
		'elk.algorithm': 'layered',
		'elk.direction': 'DOWN',
		'elk.hierarchyHandling': 'SEPARATE_CHILDREN',
		'elk.layered.spacing.nodeNodeBetweenLayers': '40',
		'elk.spacing.nodeNode': '30',
		'elk.padding': '[top=20,left=20,bottom=20,right=20]'
	}
};

const CONTAINER_OPTS: Record<string, any> = {
	layout: {
		'elk.algorithm': 'rectpacking',
		'elk.aspectRatio': '1.7',
		'elk.spacing.nodeNode': '14',
		'elk.padding': '[top=42,left=14,bottom=14,right=14]'
	},
	lanes: {
		'elk.algorithm': 'layered',
		'elk.direction': 'RIGHT',
		'elk.layered.spacing.nodeNodeBetweenLayers': '54',
		'elk.spacing.nodeNode': '16',
		'elk.padding': '[top=40,left=16,bottom=16,right=16]'
	}
};

const LEAF_W = 190;
const LEAF_H = 52;

function leafSize(n: any, isCollapsedContainer: boolean) {
	const chars = (n.label ?? '').length;
	const w = Math.max(LEAF_W, Math.min(340, 46 + chars * 8.2 + (isCollapsedContainer ? 60 : 24)));
	return { width: Math.round(w), height: isCollapsedContainer ? 62 : LEAF_H };
}

export async function layoutGraph(graph: any, { collapsed = new Set<string>(), preset = 'layout' } = {}) {
	const byId = new Map<string, any>(graph.nodes.map((n: any) => [n.id, n]));
	const childrenOf = new Map<string, any[]>();
	for (const n of graph.nodes) {
		const k = n.parentId ?? '__root__';
		if (!childrenOf.has(k)) childrenOf.set(k, []);
		childrenOf.get(k)!.push(n);
	}

	const visible = new Set<string>();
	const walkVisible = (id: string) => {
		visible.add(id);
		if (collapsed.has(id)) return;
		for (const c of childrenOf.get(id) ?? []) walkVisible(c.id);
	};
	for (const r of childrenOf.get('__root__') ?? []) walkVisible(r.id);

	const toElk = (n: any): any => {
		const kids = collapsed.has(n.id) ? [] : (childrenOf.get(n.id) ?? []);
		if (kids.length === 0) {
			const hasHidden = (childrenOf.get(n.id) ?? []).length > 0;
			return { id: n.id, ...leafSize(n, hasHidden) };
		}
		return {
			id: n.id,
			children: kids.map(toElk),
			layoutOptions: CONTAINER_OPTS[preset] ?? CONTAINER_OPTS.layout
		};
	};

	const liftTo = (id: string): string | null => {
		let cur: string | null = id;
		while (cur && !visible.has(cur)) cur = byId.get(cur)?.parentId ?? null;
		return cur;
	};

	const lifted = new Map<string, any>();
	for (const e of graph.edges) {
		const s = liftTo(e.source);
		const t = liftTo(e.target);
		if (!s || !t || s === t) continue;
		const key = `${s}→${t}→${e.layer}`;
		const cur = lifted.get(key) ?? { id: key, source: s, target: t, layer: e.layer, weight: 0 };
		cur.weight += e.weight ?? 1;
		lifted.set(key, cur);
	}

	const elkGraph = {
		id: 'root',
		layoutOptions: PRESETS[preset] ?? PRESETS.layout,
		children: (childrenOf.get('__root__') ?? []).map(toElk),
		edges: [...lifted.values()].map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }))
	};

	const res = await elk.layout(elkGraph);

	const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
	const collect = (node: any) => {
		for (const c of node.children ?? []) {
			positions.set(c.id, { x: c.x ?? 0, y: c.y ?? 0, width: c.width ?? LEAF_W, height: c.height ?? LEAF_H });
			collect(c);
		}
	};
	collect(res);

	return { positions, visible, edges: [...lifted.values()], childrenOf };
}
