// Reactive state for Box Shadow Compositor
import { browser } from '$lib/modules/studio/env';
import {
	type BoxShape,
	type ShadowLayer,
	type ShadowStudioSettings,
	INITIAL_SHADOW_LAYERS,
	buildCompositeShadow,
	exportShadowSass,
	exportShadowCss,
	exportShadowTailwind,
	exportShadowJsObject,
	exportShadowScssVar
} from '$lib/modules/studio/shadow-math';

export type ShadowExportTab = 'sass' | 'css' | 'tailwind' | 'js' | 'scss';

class ShadowStore {
	bgColor = $state<string>('#f8fafc');
	boxColor = $state<string>('#cecece');
	shape = $state<BoxShape>('rect');
	boxWidth = $state<number>(180);
	boxHeight = $state<number>(180);
	borderRadius = $state<number>(16);
	layers = $state<ShadowLayer[]>(JSON.parse(JSON.stringify(INITIAL_SHADOW_LAYERS)));
	activeLayerId = $state<string>('l1');
	activeExportTab = $state<ShadowExportTab>('sass');

	settings = $derived<ShadowStudioSettings>({
		bgColor: this.bgColor,
		boxColor: this.boxColor,
		shape: this.shape,
		boxWidth: this.boxWidth,
		boxHeight: this.boxHeight,
		borderRadius: this.borderRadius,
		layers: this.layers,
		activeLayerId: this.activeLayerId
	});

	activeLayer = $derived<ShadowLayer | undefined>(
		this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0]
	);

	shadowCss = $derived<string>(buildCompositeShadow(this.settings));

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:shadow_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.bgColor) this.bgColor = parsed.bgColor;
					if (parsed.boxColor) this.boxColor = parsed.boxColor;
					if (parsed.layers) this.layers = parsed.layers;
				} catch (e) {
					console.error('Failed to parse saved shadow state', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem('fm:shadow_state', JSON.stringify(this.settings));
		}
	}

	setBgColor(hex: string) {
		this.bgColor = hex;
		this.save();
	}

	setBoxColor(hex: string) {
		this.boxColor = hex;
		this.save();
	}

	setShape(shape: BoxShape) {
		this.shape = shape;
		this.save();
	}

	addLayer() {
		const newLayer: ShadowLayer = {
			id: `l${Date.now()}`,
			x: 0,
			y: 12,
			blur: 24,
			spread: -4,
			color: '#000000',
			opacity: 0.15,
			inset: false,
			visible: true
		};
		this.layers = [...this.layers, newLayer];
		this.activeLayerId = newLayer.id;
		this.save();
	}

	removeLayer(id: string) {
		if (this.layers.length <= 1) return;
		this.layers = this.layers.filter((l) => l.id !== id);
		if (this.activeLayerId === id) {
			this.activeLayerId = this.layers[0]?.id || '';
		}
		this.save();
	}

	toggleLayerVisibility(id: string) {
		const layer = this.layers.find((l) => l.id === id);
		if (layer) {
			layer.visible = !layer.visible;
			this.save();
		}
	}

	updateActiveLayer(patch: Partial<ShadowLayer>) {
		const layer = this.layers.find((l) => l.id === this.activeLayerId);
		if (layer) {
			Object.assign(layer, patch);
			this.save();
		}
	}

	reset() {
		this.bgColor = '#f8fafc';
		this.boxColor = '#cecece';
		this.shape = 'rect';
		this.boxWidth = 180;
		this.boxHeight = 180;
		this.borderRadius = 16;
		this.layers = JSON.parse(JSON.stringify(INITIAL_SHADOW_LAYERS));
		this.activeLayerId = 'l1';
		this.save();
	}

	getCode(tab: ShadowExportTab): string {
		switch (tab) {
			case 'sass':
				return exportShadowSass(this.settings);
			case 'css':
				return exportShadowCss(this.settings);
			case 'tailwind':
				return exportShadowTailwind(this.settings);
			case 'js':
				return exportShadowJsObject(this.settings);
			case 'scss':
				return exportShadowScssVar(this.settings);
		}
	}
}

export const shadowStore = new ShadowStore();
