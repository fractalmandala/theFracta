// Global State for CSS & SASS Generators Suite
import { browser } from '$lib/modules/studio/env';

export type GeneratorToolId =
	| 'animation'
	| 'palette'
	| 'grid'
	| 'gradient'
	| 'shadow'
	| 'transform';

export interface ToolMeta {
	id: GeneratorToolId;
	title: string;
	shortTitle: string;
	icon: string;
	description: string;
}

export const TOOLS_CATALOG: ToolMeta[] = [
	{
		id: 'animation',
		title: 'Keyframe Animation Generator',
		shortTitle: 'Animations',
		icon: 'animation',
		description: '48+ CSS keyframe animations with speed, stagger, and live SASS exporter'
	},
	{
		id: 'palette',
		title: 'Color Palette Generator',
		shortTitle: 'Palette',
		icon: 'palette',
		description: 'Harmonic color palette synthesis with WCAG contrast inspection'
	},
	{
		id: 'grid',
		title: 'CSS Grid Builder',
		shortTitle: 'Grid',
		icon: 'grid',
		description: 'Visual drag-to-create area CSS grid layout painter'
	},
	{
		id: 'gradient',
		title: 'Gradient Generator',
		shortTitle: 'Gradient',
		icon: 'gradient',
		description: 'Multi-stop linear, radial, conic gradients with live animation'
	},
	{
		id: 'shadow',
		title: 'Box Shadow Generator',
		shortTitle: 'Shadow',
		icon: 'shadow',
		description: 'Multi-layer elevation compositor and clean shadow stack builder'
	},
	{
		id: 'transform',
		title: 'Transform Generator',
		shortTitle: 'Transform',
		icon: 'transform',
		description: '2D & 3D spatial transformations with interactive 3x3 origin matrix'
	}
];

class SuiteState {
	activeTool = $state<GeneratorToolId>('animation');
	copiedToast = $state<string | null>(null);
	toastTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:active_tool');
			if (
				saved &&
				['animation', 'palette', 'grid', 'gradient', 'shadow', 'transform'].includes(
					saved
				)
			) {
				this.activeTool = saved as GeneratorToolId;
			}
		}
	}

	setTool(id: GeneratorToolId) {
		this.activeTool = id;
		if (browser) {
			localStorage.setItem('fm:active_tool', id);
		}
	}

	showCopied(message = 'Copied to clipboard!') {
		if (this.toastTimer) clearTimeout(this.toastTimer);
		this.copiedToast = message;
		this.toastTimer = setTimeout(() => {
			this.copiedToast = null;
		}, 2000);
	}
}

export const suiteState = new SuiteState();
