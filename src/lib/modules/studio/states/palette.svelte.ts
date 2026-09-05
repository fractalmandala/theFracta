// Reactive state for Color Palette Generator
import { browser } from '$lib/modules/studio/env';
import {
	type HarmonyType,
	type SwatchItem,
	generatePalette,
	exportPaletteSass,
	exportPaletteCssVars,
	exportPaletteTailwind,
	exportPaletteHex,
	exportPaletteHsl,
	exportPaletteScss
} from '$lib/modules/studio/color-math';

export type PaletteExportTab = 'sass' | 'css' | 'tailwind' | 'hex' | 'hsl' | 'scss';

class PaletteStore {
	baseColor = $state<string>('#6366f1');
	harmony = $state<HarmonyType>('Monochromatic');
	count = $state<number>(7);
	activeExportTab = $state<PaletteExportTab>('sass');
	selectedSwatchId = $state<string | null>(null);

	swatches = $derived<SwatchItem[]>(
		generatePalette(this.baseColor, this.harmony, this.count)
	);

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:palette_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.baseColor) this.baseColor = parsed.baseColor;
					if (parsed.harmony) this.harmony = parsed.harmony;
					if (parsed.count) this.count = parsed.count;
				} catch (e) {
					console.error('Failed to parse saved palette state', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem(
				'fm:palette_state',
				JSON.stringify({
					baseColor: this.baseColor,
					harmony: this.harmony,
					count: this.count
				})
			);
		}
	}

	setBaseColor(hex: string) {
		this.baseColor = hex;
		this.save();
	}

	setHarmony(harmony: HarmonyType) {
		this.harmony = harmony;
		this.save();
	}

	setCount(count: number) {
		this.count = Math.max(3, Math.min(11, count));
		this.save();
	}

	randomize() {
		const randomH = Math.floor(Math.random() * 360);
		const randomS = 60 + Math.floor(Math.random() * 35);
		const randomL = 45 + Math.floor(Math.random() * 20);
		// Simple HSL to Hex
		const toHex = (c: number) => Math.round(c).toString(16).padStart(2, '0');
		const f = (n: number) => {
			const k = (n + randomH / 30) % 12;
			const a = (randomS / 100) * Math.min(randomL / 100, 1 - randomL / 100);
			return (
				(randomL / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255
			);
		};
		const hex = `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
		this.setBaseColor(hex);
	}

	reset() {
		this.baseColor = '#6366f1';
		this.harmony = 'Monochromatic';
		this.count = 7;
		this.save();
	}

	getCode(tab: PaletteExportTab): string {
		switch (tab) {
			case 'sass':
				return exportPaletteSass(this.swatches);
			case 'css':
				return exportPaletteCssVars(this.swatches);
			case 'tailwind':
				return exportPaletteTailwind(this.swatches);
			case 'hex':
				return exportPaletteHex(this.swatches);
			case 'hsl':
				return exportPaletteHsl(this.swatches);
			case 'scss':
				return exportPaletteScss(this.swatches);
		}
	}
}

export const paletteStore = new PaletteStore();
