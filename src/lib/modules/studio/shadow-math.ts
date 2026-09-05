// Box Shadow Compositor Math & Serialization Utilities
import { hexToRgb } from '$lib/modules/studio/color-math';

export type BoxShape = 'rect' | 'circle';

export interface ShadowLayer {
	id: string;
	x: number;
	y: number;
	blur: number;
	spread: number;
	color: string;
	opacity: number; // 0 - 1
	inset: boolean;
	visible: boolean;
}

export interface ShadowStudioSettings {
	bgColor: string;
	boxColor: string;
	shape: BoxShape;
	boxWidth: number;
	boxHeight: number;
	borderRadius: number;
	layers: ShadowLayer[];
	activeLayerId: string;
}

export const INITIAL_SHADOW_LAYERS: ShadowLayer[] = [
	{
		id: 'l1',
		x: 8,
		y: 4,
		blur: 6,
		spread: -1,
		color: '#000000',
		opacity: 0.2,
		inset: false,
		visible: true
	},
	{
		id: 'l2',
		x: 0,
		y: 10,
		blur: 15,
		spread: -3,
		color: '#000000',
		opacity: 0.15,
		inset: false,
		visible: true
	}
];

export function layerToCss(layer: ShadowLayer): string {
	if (!layer.visible) return '';
	const rgb = hexToRgb(layer.color);
	const insetStr = layer.inset ? 'inset ' : '';
	const colorStr = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(layer.opacity.toFixed(2))})`;
	return `${insetStr}${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${colorStr}`;
}

export function buildCompositeShadow(settings: ShadowStudioSettings): string {
	const visibleLayers = settings.layers.filter((l) => l.visible);
	if (visibleLayers.length === 0) return 'none';
	return visibleLayers.map(layerToCss).join(',\n            ');
}

// Single-Tab Indented SASS Exporter
export function exportShadowSass(settings: ShadowStudioSettings): string {
	const shadow = buildCompositeShadow(settings);
	const rad = settings.shape === 'circle' ? '9999px' : `${settings.borderRadius}px`;
	return `$box-shadow-elevated: ${shadow}\n\n.shadow-element\n\tbox-shadow: $box-shadow-elevated\n\tborder-radius: ${rad}`;
}

// Standard CSS Exporter
export function exportShadowCss(settings: ShadowStudioSettings): string {
	const shadow = buildCompositeShadow(settings);
	return `box-shadow: ${shadow};`;
}

// Tailwind Exporter
export function exportShadowTailwind(settings: ShadowStudioSettings): string {
	const shadow = buildCompositeShadow(settings)
		.replace(/\n\s*/g, ' ')
		.replace(/\s+/g, '_');
	return `shadow-[${shadow}]`;
}

// JS Object Exporter
export function exportShadowJsObject(settings: ShadowStudioSettings): string {
	const shadow = buildCompositeShadow(settings).replace(/\n\s*/g, ' ');
	return `const shadowStyle = {\n  boxShadow: '${shadow}',\n  borderRadius: '${settings.shape === 'circle' ? '9999px' : `${settings.borderRadius}px`}'\n};`;
}

// SCSS Variable Exporter
export function exportShadowScssVar(settings: ShadowStudioSettings): string {
	const shadow = buildCompositeShadow(settings);
	return `$box-shadow-custom: ${shadow};`;
}
