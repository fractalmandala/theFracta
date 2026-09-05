// CSS Grid Builder Math & Serialization Utilities

export type TrackUnit = 'px' | 'fr' | '%' | 'auto' | 'em' | 'rem';

export interface GridTrack {
	id: string;
	value: number | string;
	unit: TrackUnit;
}

export interface GridArea {
	id: string;
	name: string;
	color: string;
	startRow: number; // 1-indexed
	startCol: number; // 1-indexed
	endRow: number; // 1-indexed inclusive
	endCol: number; // 1-indexed inclusive
}

export interface GridSettings {
	columns: GridTrack[];
	rows: GridTrack[];
	colGap: number;
	rowGap: number;
	justifyItems: 'start' | 'end' | 'center' | 'stretch';
	alignItems: 'start' | 'end' | 'center' | 'stretch';
	areas: GridArea[];
}

export const AREA_PALETTE = [
	'#6366f1', // Indigo
	'#10b981', // Emerald
	'#f59e0b', // Amber
	'#ef4444', // Red
	'#8b5cf6', // Purple
	'#06b6d4', // Cyan
	'#ec4899', // Pink
	'#84cc16', // Lime
	'#3b82f6', // Blue
	'#f97316' // Orange
];

export const GRID_PRESETS: Record<string, { label: string; settings: GridSettings }> = {
	holyGrail: {
		label: 'Holy Grail',
		settings: {
			columns: [
				{ id: 'c1', value: 200, unit: 'px' },
				{ id: 'c2', value: 1, unit: 'fr' },
				{ id: 'c3', value: 200, unit: 'px' }
			],
			rows: [
				{ id: 'r1', value: 64, unit: 'px' },
				{ id: 'r2', value: 1, unit: 'fr' },
				{ id: 'r3', value: 48, unit: 'px' }
			],
			colGap: 12,
			rowGap: 12,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'header', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 3 },
				{ id: 'a2', name: 'sidebar', color: '#10b981', startRow: 2, startCol: 1, endRow: 2, endCol: 1 },
				{ id: 'a3', name: 'main', color: '#f59e0b', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
				{ id: 'a4', name: 'aside', color: '#ef4444', startRow: 2, startCol: 3, endRow: 2, endCol: 3 },
				{ id: 'a5', name: 'footer', color: '#8b5cf6', startRow: 3, startCol: 1, endRow: 3, endCol: 3 }
			]
		}
	},
	sidebar: {
		label: 'Sidebar',
		settings: {
			columns: [
				{ id: 'c1', value: 240, unit: 'px' },
				{ id: 'c2', value: 1, unit: 'fr' }
			],
			rows: [
				{ id: 'r1', value: 60, unit: 'px' },
				{ id: 'r2', value: 1, unit: 'fr' }
			],
			colGap: 16,
			rowGap: 16,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'header', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 2 },
				{ id: 'a2', name: 'sidebar', color: '#10b981', startRow: 2, startCol: 1, endRow: 2, endCol: 1 },
				{ id: 'a3', name: 'content', color: '#f59e0b', startRow: 2, startCol: 2, endRow: 2, endCol: 2 }
			]
		}
	},
	threeColumn: {
		label: '3 Column',
		settings: {
			columns: [
				{ id: 'c1', value: 1, unit: 'fr' },
				{ id: 'c2', value: 1, unit: 'fr' },
				{ id: 'c3', value: 1, unit: 'fr' }
			],
			rows: [
				{ id: 'r1', value: 1, unit: 'fr' }
			],
			colGap: 16,
			rowGap: 16,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'col1', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
				{ id: 'a2', name: 'col2', color: '#10b981', startRow: 1, startCol: 2, endRow: 1, endCol: 2 },
				{ id: 'a3', name: 'col3', color: '#f59e0b', startRow: 1, startCol: 3, endRow: 1, endCol: 3 }
			]
		}
	},
	dashboard: {
		label: 'Dashboard',
		settings: {
			columns: [
				{ id: 'c1', value: 220, unit: 'px' },
				{ id: 'c2', value: 1, unit: 'fr' },
				{ id: 'c3', value: 1, unit: 'fr' }
			],
			rows: [
				{ id: 'r1', value: 60, unit: 'px' },
				{ id: 'r2', value: 140, unit: 'px' },
				{ id: 'r3', value: 1, unit: 'fr' }
			],
			colGap: 16,
			rowGap: 16,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'nav', color: '#6366f1', startRow: 1, startCol: 1, endRow: 3, endCol: 1 },
				{ id: 'a2', name: 'topbar', color: '#06b6d4', startRow: 1, startCol: 2, endRow: 1, endCol: 3 },
				{ id: 'a3', name: 'stats1', color: '#10b981', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
				{ id: 'a4', name: 'stats2', color: '#f59e0b', startRow: 2, startCol: 3, endRow: 2, endCol: 3 },
				{ id: 'a5', name: 'chart', color: '#8b5cf6', startRow: 3, startCol: 2, endRow: 3, endCol: 3 }
			]
		}
	},
	blog: {
		label: 'Blog',
		settings: {
			columns: [
				{ id: 'c1', value: 1, unit: 'fr' },
				{ id: 'c2', value: 300, unit: 'px' }
			],
			rows: [
				{ id: 'r1', value: 70, unit: 'px' },
				{ id: 'r2', value: 260, unit: 'px' },
				{ id: 'r3', value: 1, unit: 'fr' },
				{ id: 'r4', value: 60, unit: 'px' }
			],
			colGap: 20,
			rowGap: 20,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'header', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 2 },
				{ id: 'a2', name: 'hero', color: '#ec4899', startRow: 2, startCol: 1, endRow: 2, endCol: 2 },
				{ id: 'a3', name: 'article', color: '#10b981', startRow: 3, startCol: 1, endRow: 3, endCol: 1 },
				{ id: 'a4', name: 'sidebar', color: '#f59e0b', startRow: 3, startCol: 2, endRow: 3, endCol: 2 },
				{ id: 'a5', name: 'footer', color: '#8b5cf6', startRow: 4, startCol: 1, endRow: 4, endCol: 2 }
			]
		}
	},
	cardGrid: {
		label: 'Card Grid',
		settings: {
			columns: [
				{ id: 'c1', value: 1, unit: 'fr' },
				{ id: 'c2', value: 1, unit: 'fr' },
				{ id: 'c3', value: 1, unit: 'fr' }
			],
			rows: [
				{ id: 'r1', value: 180, unit: 'px' },
				{ id: 'r2', value: 180, unit: 'px' }
			],
			colGap: 16,
			rowGap: 16,
			justifyItems: 'stretch',
			alignItems: 'stretch',
			areas: [
				{ id: 'a1', name: 'card1', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
				{ id: 'a2', name: 'card2', color: '#10b981', startRow: 1, startCol: 2, endRow: 1, endCol: 2 },
				{ id: 'a3', name: 'card3', color: '#f59e0b', startRow: 1, startCol: 3, endRow: 1, endCol: 3 },
				{ id: 'a4', name: 'card4', color: '#ef4444', startRow: 2, startCol: 1, endRow: 2, endCol: 1 },
				{ id: 'a5', name: 'card5', color: '#8b5cf6', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
				{ id: 'a6', name: 'card6', color: '#06b6d4', startRow: 2, startCol: 3, endRow: 2, endCol: 3 }
			]
		}
	}
};

export function formatTrack(track: GridTrack): string {
	if (track.unit === 'auto') return 'auto';
	return `${track.value}${track.unit}`;
}

export function formatTracksList(tracks: GridTrack[]): string {
	return tracks.map(formatTrack).join(' ');
}

// Build 2D ASCII Grid Template Areas Matrix
export function generateGridTemplateAreasMatrix(
	rowCount: number,
	colCount: number,
	areas: GridArea[]
): string[][] {
	const matrix: string[][] = Array.from({ length: rowCount }, () =>
		Array.from({ length: colCount }, () => '.')
	);

	for (const area of areas) {
		const rStart = Math.max(1, Math.min(rowCount, area.startRow)) - 1;
		const rEnd = Math.max(1, Math.min(rowCount, area.endRow)) - 1;
		const cStart = Math.max(1, Math.min(colCount, area.startCol)) - 1;
		const cEnd = Math.max(1, Math.min(colCount, area.endCol)) - 1;

		const minR = Math.min(rStart, rEnd);
		const maxR = Math.max(rStart, rEnd);
		const minC = Math.min(cStart, cEnd);
		const maxC = Math.max(cStart, cEnd);

		for (let r = minR; r <= maxR; r++) {
			for (let c = minC; c <= maxC; c++) {
				matrix[r][c] = area.name.trim() || '.';
			}
		}
	}

	return matrix;
}

export function formatGridTemplateAreas(matrix: string[][]): string {
	if (matrix.length === 0) return 'none';
	return matrix.map((row) => `"${row.join(' ')}"`).join('\n    ');
}

// Exporters
export function exportGridCss(settings: GridSettings): string {
	const cols = formatTracksList(settings.columns);
	const rows = formatTracksList(settings.rows);
	const matrix = generateGridTemplateAreasMatrix(
		settings.rows.length,
		settings.columns.length,
		settings.areas
	);
	const areasFormatted = formatGridTemplateAreas(matrix);

	const areaStyles = settings.areas
		.map((a) => `.${a.name} {\n  grid-area: ${a.name};\n}`)
		.join('\n\n');

	return `.grid-container {\n  display: grid;\n  grid-template-columns: ${cols};\n  grid-template-rows: ${rows};\n  grid-template-areas:\n    ${areasFormatted};\n  gap: ${settings.rowGap}px ${settings.colGap}px;\n  justify-items: ${settings.justifyItems};\n  align-items: ${settings.alignItems};\n}\n\n${areaStyles}`;
}

export function exportGridSass(settings: GridSettings): string {
	const cols = formatTracksList(settings.columns);
	const rows = formatTracksList(settings.rows);
	const matrix = generateGridTemplateAreasMatrix(
		settings.rows.length,
		settings.columns.length,
		settings.areas
	);
	const areasFormatted = matrix.map((row) => `"${row.join(' ')}"`).join(' ');

	const areaLines = settings.areas
		.map((a) => `\t.${a.name}\n\t\tgrid-area: ${a.name}`)
		.join('\n\n');

	return `.grid-container\n\tdisplay: grid\n\tgrid-template-columns: ${cols}\n\tgrid-template-rows: ${rows}\n\tgrid-template-areas: ${areasFormatted}\n\tgap: ${settings.rowGap}px ${settings.colGap}px\n\tjustify-items: ${settings.justifyItems}\n\talign-items: ${settings.alignItems}\n\n${areaLines}`;
}

export function exportGridScss(settings: GridSettings): string {
	const cols = formatTracksList(settings.columns);
	const rows = formatTracksList(settings.rows);
	const matrix = generateGridTemplateAreasMatrix(
		settings.rows.length,
		settings.columns.length,
		settings.areas
	);
	const areasFormatted = formatGridTemplateAreas(matrix);

	const areaLines = settings.areas
		.map((a) => `  .${a.name} {\n    grid-area: ${a.name};\n  }`)
		.join('\n');

	return `.grid-container {\n  display: grid;\n  grid-template-columns: ${cols};\n  grid-template-rows: ${rows};\n  grid-template-areas:\n    ${areasFormatted};\n  gap: ${settings.rowGap}px ${settings.colGap}px;\n  justify-items: ${settings.justifyItems};\n  align-items: ${settings.alignItems};\n\n${areaLines}\n}`;
}

export function exportGridTailwind(settings: GridSettings): string {
	const cols = settings.columns.map((c) => formatTrack(c)).join('_');
	const rows = settings.rows.map((r) => formatTrack(r)).join('_');
	return `<!-- Grid Container -->\n<div class="grid grid-cols-[${cols}] grid-rows-[${rows}] gap-x-[${settings.colGap}px] gap-y-[${settings.rowGap}px] justify-items-${settings.justifyItems} items-${settings.alignItems}">\n${settings.areas
		.map(
			(a) =>
				`  <div class="[grid-area:${a.name}] col-start-${a.startCol} col-end-${a.endCol + 1} row-start-${a.startRow} row-end-${a.endRow + 1}">${a.name}</div>`
		)
		.join('\n')}\n</div>`;
}

export function exportGridReact(settings: GridSettings): string {
	const areas = settings.areas
		.map((a) => `      <div className="${a.name}">{/* ${a.name} content */}</div>`)
		.join('\n');

	return `import React from 'react';\nimport './Grid.css';\n\nexport const GridLayout = () => {\n  return (\n    <div className="grid-container">\n${areas}\n    </div>\n  );\n};`;
}

export function exportGridHtml(settings: GridSettings): string {
	const areas = settings.areas
		.map((a) => `  <div class="${a.name}">${a.name}</div>`)
		.join('\n');

	return `<div class="grid-container">\n${areas}\n</div>`;
}
