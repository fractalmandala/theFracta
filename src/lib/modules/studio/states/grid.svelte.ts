// Reactive state for CSS Grid Builder
import { browser } from '$lib/modules/studio/env';
import {
	type GridSettings,
	type GridTrack,
	type GridArea,
	type TrackUnit,
	AREA_PALETTE,
	GRID_PRESETS,
	exportGridSass,
	exportGridCss,
	exportGridScss,
	exportGridTailwind,
	exportGridReact,
	exportGridHtml
} from '$lib/modules/studio/grid-math';

export type GridExportTab = 'sass' | 'css' | 'scss' | 'tailwind' | 'react' | 'html';

class GridStore {
	columns = $state<GridTrack[]>([
		{ id: 'c1', value: 200, unit: 'px' },
		{ id: 'c2', value: 1, unit: 'fr' },
		{ id: 'c3', value: 200, unit: 'px' }
	]);
	rows = $state<GridTrack[]>([
		{ id: 'r1', value: 64, unit: 'px' },
		{ id: 'r2', value: 1, unit: 'fr' },
		{ id: 'r3', value: 48, unit: 'px' }
	]);
	colGap = $state<number>(12);
	rowGap = $state<number>(12);
	justifyItems = $state<'start' | 'end' | 'center' | 'stretch'>('stretch');
	alignItems = $state<'start' | 'end' | 'center' | 'stretch'>('stretch');
	areas = $state<GridArea[]>([
		{ id: 'a1', name: 'header', color: '#6366f1', startRow: 1, startCol: 1, endRow: 1, endCol: 3 },
		{ id: 'a2', name: 'sidebar', color: '#10b981', startRow: 2, startCol: 1, endRow: 2, endCol: 1 },
		{ id: 'a3', name: 'main', color: '#f59e0b', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
		{ id: 'a4', name: 'aside', color: '#ef4444', startRow: 2, startCol: 3, endRow: 2, endCol: 3 },
		{ id: 'a5', name: 'footer', color: '#8b5cf6', startRow: 3, startCol: 1, endRow: 3, endCol: 3 }
	]);
	activeAreaId = $state<string | null>(null);
	activeExportTab = $state<GridExportTab>('sass');
	selectedPresetKey = $state<string>('holyGrail');

	settings = $derived<GridSettings>({
		columns: this.columns,
		rows: this.rows,
		colGap: this.colGap,
		rowGap: this.rowGap,
		justifyItems: this.justifyItems,
		alignItems: this.alignItems,
		areas: this.areas
	});

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:grid_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.columns) this.columns = parsed.columns;
					if (parsed.rows) this.rows = parsed.rows;
					if (parsed.colGap !== undefined) this.colGap = parsed.colGap;
					if (parsed.rowGap !== undefined) this.rowGap = parsed.rowGap;
					if (parsed.justifyItems) this.justifyItems = parsed.justifyItems;
					if (parsed.alignItems) this.alignItems = parsed.alignItems;
					if (parsed.areas) this.areas = parsed.areas;
				} catch (e) {
					console.error('Failed to parse saved grid state', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem('fm:grid_state', JSON.stringify(this.settings));
		}
	}

	loadPreset(key: string) {
		const preset = GRID_PRESETS[key];
		if (!preset) return;
		this.selectedPresetKey = key;
		this.columns = JSON.parse(JSON.stringify(preset.settings.columns));
		this.rows = JSON.parse(JSON.stringify(preset.settings.rows));
		this.colGap = preset.settings.colGap;
		this.rowGap = preset.settings.rowGap;
		this.justifyItems = preset.settings.justifyItems;
		this.alignItems = preset.settings.alignItems;
		this.areas = JSON.parse(JSON.stringify(preset.settings.areas));
		this.activeAreaId = null;
		this.save();
	}

	addColumn(value: number | string = 1, unit: TrackUnit = 'fr') {
		const id = `c${Date.now()}`;
		this.columns = [...this.columns, { id, value, unit }];
		this.save();
	}

	removeColumn(index: number) {
		if (this.columns.length <= 1) return;
		this.columns = this.columns.filter((_, i) => i !== index);
		// Clean up areas outside bounds
		this.clampAreas();
		this.save();
	}

	updateColumn(index: number, value: number | string, unit: TrackUnit) {
		if (!this.columns[index]) return;
		this.columns[index].value = value;
		this.columns[index].unit = unit;
		this.save();
	}

	addRow(value: number | string = 1, unit: TrackUnit = 'fr') {
		const id = `r${Date.now()}`;
		this.rows = [...this.rows, { id, value, unit }];
		this.save();
	}

	removeRow(index: number) {
		if (this.rows.length <= 1) return;
		this.rows = this.rows.filter((_, i) => i !== index);
		this.clampAreas();
		this.save();
	}

	updateRow(index: number, value: number | string, unit: TrackUnit) {
		if (!this.rows[index]) return;
		this.rows[index].value = value;
		this.rows[index].unit = unit;
		this.save();
	}

	setGaps(col: number, row: number) {
		this.colGap = col;
		this.rowGap = row;
		this.save();
	}

	setJustifyItems(val: 'start' | 'end' | 'center' | 'stretch') {
		this.justifyItems = val;
		this.save();
	}

	setAlignItems(val: 'start' | 'end' | 'center' | 'stretch') {
		this.alignItems = val;
		this.save();
	}

	addAreaFromSelection(r1: number, c1: number, r2: number, c2: number, defaultName?: string) {
		const startRow = Math.min(r1, r2);
		const endRow = Math.max(r1, r2);
		const startCol = Math.min(c1, c2);
		const endCol = Math.max(c1, c2);

		const name = defaultName || `area${this.areas.length + 1}`;
		const color = AREA_PALETTE[this.areas.length % AREA_PALETTE.length];
		const newArea: GridArea = {
			id: `a${Date.now()}`,
			name,
			color,
			startRow,
			startCol,
			endRow,
			endCol
		};

		// Remove any existing area that overlaps completely or slice it
		this.areas = [...this.areas, newArea];
		this.activeAreaId = newArea.id;
		this.save();
	}

	updateAreaName(id: string, newName: string) {
		const area = this.areas.find((a) => a.id === id);
		if (area) {
			area.name = newName.replace(/[^a-zA-Z0-9_-]/g, '') || 'area';
			this.save();
		}
	}

	removeArea(id: string) {
		this.areas = this.areas.filter((a) => a.id !== id);
		if (this.activeAreaId === id) this.activeAreaId = null;
		this.save();
	}

	private clampAreas() {
		const maxR = this.rows.length;
		const maxC = this.columns.length;
		this.areas = this.areas
			.filter((a) => a.startRow <= maxR && a.startCol <= maxC)
			.map((a) => ({
				...a,
				endRow: Math.min(maxR, a.endRow),
				endCol: Math.min(maxC, a.endCol)
			}));
	}

	reset() {
		this.loadPreset('holyGrail');
	}

	getCode(tab: GridExportTab): string {
		switch (tab) {
			case 'sass':
				return exportGridSass(this.settings);
			case 'css':
				return exportGridCss(this.settings);
			case 'scss':
				return exportGridScss(this.settings);
			case 'tailwind':
				return exportGridTailwind(this.settings);
			case 'react':
				return exportGridReact(this.settings);
			case 'html':
				return exportGridHtml(this.settings);
		}
	}
}

export const gridStore = new GridStore();
