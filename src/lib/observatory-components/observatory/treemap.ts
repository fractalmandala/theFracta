/**
 * Squarified treemap layout (Bruls, Huizing and van Wijk, 2000).
 *
 * Values are filtered to positives, sorted descending, and scaled so they sum
 * to the available area; rows are then laid along the shorter edge, extended
 * while doing so improves the worst aspect ratio in the row. The result is
 * tiles close to square, which is what makes areas comparable by eye — a naive
 * slice-and-dice layout produces slivers whose relative sizes cannot be read.
 */

export type TreemapInput = { id: string; value: number };
export type TreemapTile = TreemapInput & { x: number; y: number; width: number; height: number };

type Scaled = { id: string; value: number; area: number };

function worstRatio(row: Scaled[], side: number): number {
	const rowArea = row.reduce((sum, item) => sum + item.area, 0);
	if (rowArea === 0 || side === 0) return Infinity;
	let worst = 0;
	for (const item of row) {
		const width = rowArea / side;
		const height = item.area / width;
		const ratio = height === 0 ? Infinity : Math.max(width / height, height / width);
		if (ratio > worst) worst = ratio;
	}
	return worst;
}

function layout(items: Scaled[], x: number, y: number, w: number, h: number, out: TreemapTile[]): void {
	if (items.length === 0) return;
	if (items.length === 1) {
		out.push({ id: items[0].id, value: items[0].value, x, y, width: w, height: h });
		return;
	}

	const side = Math.min(w, h);
	const row: Scaled[] = [items[0]];
	let index = 1;
	while (index < items.length && worstRatio([...row, items[index]], side) <= worstRatio(row, side)) {
		row.push(items[index]);
		index += 1;
	}

	const horizontal = w >= h;
	const rowArea = row.reduce((sum, item) => sum + item.area, 0);
	const span = rowArea / (horizontal ? h : w);
	let offset = 0;
	for (const item of row) {
		const extent = span === 0 ? 0 : item.area / span;
		out.push(
			horizontal
				? { id: item.id, value: item.value, x, y: y + offset, width: span, height: extent }
				: { id: item.id, value: item.value, x: x + offset, y, width: extent, height: span }
		);
		offset += extent;
	}

	const rest = items.slice(index);
	if (rest.length === 0) return;
	if (horizontal) layout(rest, x + span, y, w - span, h, out);
	else layout(rest, x, y + span, w, h - span, out);
}

export function squarify(input: readonly TreemapInput[], width: number, height: number): TreemapTile[] {
	const items = input.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
	if (items.length === 0 || width <= 0 || height <= 0) return [];
	const total = items.reduce((sum, item) => sum + item.value, 0);
	const area = width * height;
	const scaled: Scaled[] = items.map((item) => ({ id: item.id, value: item.value, area: (item.value / total) * area }));
	const tiles: TreemapTile[] = [];
	layout(scaled, 0, 0, width, height, tiles);
	return tiles;
}
