// Color Math & Utilities for Color Palette Generator

export type HarmonyType =
	| 'Monochromatic'
	| 'Analogous'
	| 'Complementary'
	| 'Split-Comp'
	| 'Triadic'
	| 'Tetradic'
	| 'Shades'
	| 'Tints';

export interface RgbColor {
	r: number;
	g: number;
	b: number;
}

export interface HslColor {
	h: number; // 0 - 360
	s: number; // 0 - 100
	l: number; // 0 - 100
}

export interface SwatchItem {
	id: string;
	hex: string;
	hsl: HslColor;
	isBase?: boolean;
	contrastWhite: number;
	contrastBlack: number;
}

// Clean and normalize hex
export function cleanHex(input: string): string {
	let hex = (input || '').trim().replace(/^#/, '');
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map((c) => c + c)
			.join('');
	}
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
		return '6366f1';
	}
	return hex.toLowerCase();
}

export function hexToRgb(hex: string): RgbColor {
	const clean = cleanHex(hex);
	const num = parseInt(clean, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
	const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
	const rNorm = r / 255;
	const gNorm = g / 255;
	const bNorm = b / 255;

	const max = Math.max(rNorm, gNorm, bNorm);
	const min = Math.min(rNorm, gNorm, bNorm);
	const delta = max - min;

	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (delta !== 0) {
		s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

		if (max === rNorm) {
			h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
		} else if (max === gNorm) {
			h = ((bNorm - rNorm) / delta + 2) * 60;
		} else {
			h = ((rNorm - gNorm) / delta + 4) * 60;
		}
	}

	return {
		h: Math.round((h + 360) % 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100)
	};
}

export function hslToRgb(h: number, s: number, l: number): RgbColor {
	const hNorm = ((h % 360) + 360) % 360 / 360;
	const sNorm = Math.max(0, Math.min(100, s)) / 100;
	const lNorm = Math.max(0, Math.min(100, l)) / 100;

	if (sNorm === 0) {
		const val = Math.round(lNorm * 255);
		return { r: val, g: val, b: val };
	}

	const hue2rgb = (p: number, q: number, t: number) => {
		let tNorm = t;
		if (tNorm < 0) tNorm += 1;
		if (tNorm > 1) tNorm -= 1;
		if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
		if (tNorm < 1 / 2) return q;
		if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
		return p;
	};

	const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
	const p = 2 * lNorm - q;

	return {
		r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
		g: Math.round(hue2rgb(p, q, hNorm) * 255),
		b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255)
	};
}

export function hslToHex(h: number, s: number, l: number): string {
	const { r, g, b } = hslToRgb(h, s, l);
	return rgbToHex(r, g, b);
}

// WCAG Contrast
function sRgbToLinear(c: number): number {
	const v = c / 255;
	return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function getLuminance(r: number, g: number, b: number): number {
	return (
		0.2126 * sRgbToLinear(r) +
		0.7152 * sRgbToLinear(g) +
		0.0722 * sRgbToLinear(b)
	);
}

export function getContrastRatio(hex1: string, hex2: string): number {
	const rgb1 = hexToRgb(hex1);
	const rgb2 = hexToRgb(hex2);
	const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
	const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
	const brighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (brighter + 0.05) / (darker + 0.05);
}

// Color Harmonies Generator
export function generatePalette(
	baseHex: string,
	harmony: HarmonyType,
	count: number = 7
): SwatchItem[] {
	const clean = cleanHex(baseHex);
	const baseRgb = hexToRgb(clean);
	const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

	const baseIndex = Math.floor(count / 2);
	const swatches: SwatchItem[] = [];

	for (let i = 0; i < count; i++) {
		const isBase = i === baseIndex;
		let h = baseHsl.h;
		let s = baseHsl.s;
		let l = baseHsl.l;

		const ratio = count > 1 ? i / (count - 1) : 0.5;

		switch (harmony) {
			case 'Monochromatic': {
				// Lightness spreads from 92% down to 18%
				l = Math.round(92 - ratio * 74);
				s = Math.min(100, Math.round(baseHsl.s * (0.6 + 0.4 * (1 - Math.abs(ratio - 0.5) * 2))));
				break;
			}
			case 'Analogous': {
				// Spread hue +/- 40 degrees
				const offset = (ratio - 0.5) * 80;
				h = (baseHsl.h + offset + 360) % 360;
				l = Math.round(85 - ratio * 60);
				break;
			}
			case 'Complementary': {
				if (i < baseIndex) {
					// Base tints
					const tRatio = i / Math.max(1, baseIndex);
					l = Math.round(90 - tRatio * 35);
					s = baseHsl.s;
				} else if (i === baseIndex) {
					l = baseHsl.l;
					s = baseHsl.s;
				} else {
					// Complementary hue (180 deg)
					h = (baseHsl.h + 180) % 360;
					const cRatio = (i - baseIndex) / (count - 1 - baseIndex);
					l = Math.round(baseHsl.l - cRatio * 35);
					s = baseHsl.s;
				}
				break;
			}
			case 'Split-Comp': {
				const splitHues = [(baseHsl.h + 150) % 360, baseHsl.h, (baseHsl.h + 210) % 360];
				const targetHue = splitHues[Math.min(2, Math.floor(ratio * 3))];
				h = targetHue;
				l = Math.round(88 - ratio * 65);
				break;
			}
			case 'Triadic': {
				const triadicHues = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
				h = triadicHues[i % 3];
				l = Math.round(85 - ratio * 58);
				break;
			}
			case 'Tetradic': {
				const tetradicHues = [
					baseHsl.h,
					(baseHsl.h + 90) % 360,
					(baseHsl.h + 180) % 360,
					(baseHsl.h + 270) % 360
				];
				h = tetradicHues[i % 4];
				l = Math.round(88 - ratio * 62);
				break;
			}
			case 'Shades': {
				// Base color stepping down to black
				l = Math.round(baseHsl.l * (1 - ratio * 0.85));
				break;
			}
			case 'Tints': {
				// Base color stepping up to white
				l = Math.round(baseHsl.l + (100 - baseHsl.l) * (1 - ratio));
				break;
			}
		}

		if (isBase) {
			h = baseHsl.h;
			s = baseHsl.s;
			l = baseHsl.l;
		}

		const hex = hslToHex(h, s, l);
		swatches.push({
			id: `swatch-${i}`,
			hex,
			hsl: { h, s, l },
			isBase,
			contrastWhite: Number(getContrastRatio(hex, '#ffffff').toFixed(2)),
			contrastBlack: Number(getContrastRatio(hex, '#000000').toFixed(2))
		});
	}

	return swatches;
}

// Code Exporters
export function exportPaletteCssVars(swatches: SwatchItem[]): string {
	const vars = swatches
		.map((s, idx) => `  --palette-${idx + 1}: ${s.hex};`)
		.join('\n');
	return `:root {\n${vars}\n}`;
}

export function exportPaletteTailwind(swatches: SwatchItem[]): string {
	const keys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
	const colorObj = swatches
		.map((s, idx) => {
			const step = keys[idx] ?? (idx + 1) * 100;
			return `      ${step}: '${s.hex}',`;
		})
		.join('\n');

	return `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n${colorObj}\n        }\n      }\n    }\n  }\n};`;
}

export function exportPaletteHex(swatches: SwatchItem[]): string {
	return swatches.map((s) => s.hex).join(', ');
}

export function exportPaletteHsl(swatches: SwatchItem[]): string {
	return swatches
		.map((s) => `hsl(${s.hsl.h}, ${s.hsl.s}%, ${s.hsl.l}%)`)
		.join(',\n');
}

export function exportPaletteSass(swatches: SwatchItem[]): string {
	const vars = swatches
		.map((s, idx) => `\t--palette-${idx + 1}: ${s.hex}`)
		.join('\n');
	const lines = swatches
		.map((s, idx) => `\t"${(idx + 1) * 100}": ${s.hex},`)
		.join('\n');
	return `$palette: (\n${lines}\n)\n\n:root\n${vars}`;
}

export function exportPaletteScss(swatches: SwatchItem[]): string {
	const lines = swatches
		.map((s, idx) => `  "${(idx + 1) * 100}": ${s.hex},`)
		.join('\n');
	return `$palette: (\n${lines}\n);`;
}
