// Reactive state for 2D & 3D Transform Studio
import { browser } from '$lib/modules/studio/env';
import {
	type TransformSettings,
	type TransformOriginType,
	DEFAULT_TRANSFORM,
	TRANSFORM_PRESETS,
	buildTransformCss,
	exportTransformSass,
	exportTransformCss,
	exportTransformTailwind,
	exportTransformReact
} from '$lib/modules/studio/transform-math';

export type TransformExportTab = 'sass' | 'css' | 'tailwind' | 'react';

class TransformStore {
	translateX = $state<number>(DEFAULT_TRANSFORM.translateX);
	translateY = $state<number>(DEFAULT_TRANSFORM.translateY);
	translateZ = $state<number>(DEFAULT_TRANSFORM.translateZ);
	rotateX = $state<number>(DEFAULT_TRANSFORM.rotateX);
	rotateY = $state<number>(DEFAULT_TRANSFORM.rotateY);
	rotateZ = $state<number>(DEFAULT_TRANSFORM.rotateZ);
	scaleX = $state<number>(DEFAULT_TRANSFORM.scaleX);
	scaleY = $state<number>(DEFAULT_TRANSFORM.scaleY);
	skewX = $state<number>(DEFAULT_TRANSFORM.skewX);
	skewY = $state<number>(DEFAULT_TRANSFORM.skewY);
	perspective = $state<number>(DEFAULT_TRANSFORM.perspective);
	origin = $state<TransformOriginType>(DEFAULT_TRANSFORM.origin);
	showGrid = $state<boolean>(DEFAULT_TRANSFORM.showGrid);
	elementColor = $state<string>(DEFAULT_TRANSFORM.elementColor);
	elementText = $state<string>(DEFAULT_TRANSFORM.elementText);
	activePresetKey = $state<string>('scaleUp');
	activeExportTab = $state<TransformExportTab>('sass');

	settings = $derived<TransformSettings>({
		translateX: this.translateX,
		translateY: this.translateY,
		translateZ: this.translateZ,
		rotateX: this.rotateX,
		rotateY: this.rotateY,
		rotateZ: this.rotateZ,
		scaleX: this.scaleX,
		scaleY: this.scaleY,
		skewX: this.skewX,
		skewY: this.skewY,
		perspective: this.perspective,
		origin: this.origin,
		showGrid: this.showGrid,
		elementColor: this.elementColor,
		elementText: this.elementText
	});

	transformCss = $derived<string>(buildTransformCss(this.settings));

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:transform_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.translateX !== undefined) this.translateX = parsed.translateX;
					if (parsed.translateY !== undefined) this.translateY = parsed.translateY;
					if (parsed.translateZ !== undefined) this.translateZ = parsed.translateZ;
					if (parsed.rotateX !== undefined) this.rotateX = parsed.rotateX;
					if (parsed.rotateY !== undefined) this.rotateY = parsed.rotateY;
					if (parsed.rotateZ !== undefined) this.rotateZ = parsed.rotateZ;
					if (parsed.scaleX !== undefined) this.scaleX = parsed.scaleX;
					if (parsed.scaleY !== undefined) this.scaleY = parsed.scaleY;
					if (parsed.skewX !== undefined) this.skewX = parsed.skewX;
					if (parsed.skewY !== undefined) this.skewY = parsed.skewY;
					if (parsed.perspective !== undefined) this.perspective = parsed.perspective;
					if (parsed.origin) this.origin = parsed.origin;
					if (parsed.elementColor) this.elementColor = parsed.elementColor;
				} catch (e) {
					console.error('Failed to parse saved transform state', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem('fm:transform_state', JSON.stringify(this.settings));
		}
	}

	loadPreset(key: string) {
		const preset = TRANSFORM_PRESETS[key];
		if (!preset) return;
		this.activePresetKey = key;
		const s = preset.settings;
		if (s.translateX !== undefined) this.translateX = s.translateX;
		if (s.translateY !== undefined) this.translateY = s.translateY;
		if (s.translateZ !== undefined) this.translateZ = s.translateZ;
		if (s.rotateX !== undefined) this.rotateX = s.rotateX;
		if (s.rotateY !== undefined) this.rotateY = s.rotateY;
		if (s.rotateZ !== undefined) this.rotateZ = s.rotateZ;
		if (s.scaleX !== undefined) this.scaleX = s.scaleX;
		if (s.scaleY !== undefined) this.scaleY = s.scaleY;
		if (s.skewX !== undefined) this.skewX = s.skewX;
		if (s.skewY !== undefined) this.skewY = s.skewY;
		if (s.perspective !== undefined) this.perspective = s.perspective;
		if (s.origin) this.origin = s.origin;
		this.save();
	}

	setOrigin(origin: TransformOriginType) {
		this.origin = origin;
		this.save();
	}

	setElementColor(color: string) {
		this.elementColor = color;
		this.save();
	}

	reset() {
		this.loadPreset('none');
		this.scaleX = 1.5;
		this.scaleY = 1.5;
		this.origin = 'top right';
		this.activePresetKey = 'scaleUp';
		this.save();
	}

	getCode(tab: TransformExportTab): string {
		switch (tab) {
			case 'sass':
				return exportTransformSass(this.settings);
			case 'css':
				return exportTransformCss(this.settings);
			case 'tailwind':
				return exportTransformTailwind(this.settings);
			case 'react':
				return exportTransformReact(this.settings);
		}
	}
}

export const transformStore = new TransformStore();
