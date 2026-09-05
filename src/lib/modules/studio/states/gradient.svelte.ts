// Reactive state for Gradient Generator
import { browser } from '$lib/modules/studio/env';
import {
	type GradientType,
	type PreviewMode,
	type AnimationType,
	type ColorStop,
	type GradientSettings,
	GRADIENT_PRESETS,
	buildGradientString,
	exportGradientSass,
	exportGradientCss,
	exportGradientTailwind,
	exportGradientScss
} from '$lib/modules/studio/gradient-math';

export type GradientExportTab = 'sass' | 'css' | 'tailwind' | 'scss';

class GradientStore {
	type = $state<GradientType>('linear');
	angle = $state<number>(135);
	radialShape = $state<'circle' | 'ellipse'>('circle');
	radialPosition = $state<string>('center');
	stops = $state<ColorStop[]>([
		{ id: 's1', color: '#7c6dfa', stop: 0 },
		{ id: 's2', color: '#c47fff', stop: 50 },
		{ id: 's3', color: '#4dd9c0', stop: 100 }
	]);
	animation = $state<AnimationType>('off');
	animationDuration = $state<number>(6);
	previewMode = $state<PreviewMode>('background');
	activeStopId = $state<string>('s1');
	activeExportTab = $state<GradientExportTab>('sass');

	settings = $derived<GradientSettings>({
		type: this.type,
		angle: this.angle,
		radialShape: this.radialShape,
		radialPosition: this.radialPosition,
		stops: this.stops,
		animation: this.animation,
		animationDuration: this.animationDuration,
		previewMode: this.previewMode
	});

	gradientCssString = $derived<string>(buildGradientString(this.settings));

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:gradient_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.type) this.type = parsed.type;
					if (parsed.angle !== undefined) this.angle = parsed.angle;
					if (parsed.stops) this.stops = parsed.stops;
					if (parsed.animation) this.animation = parsed.animation;
					if (parsed.previewMode) this.previewMode = parsed.previewMode;
				} catch (e) {
					console.error('Failed to parse saved gradient state', e);
				}
			}
		}
	}

	save() {
		if (browser) {
			localStorage.setItem('fm:gradient_state', JSON.stringify(this.settings));
		}
	}

	setType(type: GradientType) {
		this.type = type;
		this.save();
	}

	setAngle(angle: number) {
		this.angle = ((Math.round(angle) % 360) + 360) % 360;
		this.save();
	}

	setPreviewMode(mode: PreviewMode) {
		this.previewMode = mode;
		this.save();
	}

	setAnimation(anim: AnimationType) {
		this.animation = anim;
		this.save();
	}

	addStop(color = '#ffffff', stopPercent = 50) {
		const newStop: ColorStop = {
			id: `s${Date.now()}`,
			color,
			stop: Math.max(0, Math.min(100, Math.round(stopPercent)))
		};
		this.stops = [...this.stops, newStop].sort((a, b) => a.stop - b.stop);
		this.activeStopId = newStop.id;
		this.save();
	}

	updateStopColor(id: string, color: string) {
		const stop = this.stops.find((s) => s.id === id);
		if (stop) {
			stop.color = color;
			this.save();
		}
	}

	updateStopPosition(id: string, stopPercent: number) {
		const stop = this.stops.find((s) => s.id === id);
		if (stop) {
			stop.stop = Math.max(0, Math.min(100, Math.round(stopPercent)));
			this.stops = [...this.stops].sort((a, b) => a.stop - b.stop);
			this.save();
		}
	}

	removeStop(id: string) {
		if (this.stops.length <= 2) return; // Keep minimum 2 stops
		this.stops = this.stops.filter((s) => s.id !== id);
		if (this.activeStopId === id) {
			this.activeStopId = this.stops[0]?.id || '';
		}
		this.save();
	}

	loadPreset(presetIndex: number) {
		const preset = GRADIENT_PRESETS[presetIndex];
		if (!preset) return;
		this.type = preset.type;
		this.angle = preset.angle;
		this.stops = JSON.parse(JSON.stringify(preset.stops));
		this.activeStopId = this.stops[0]?.id || 's1';
		this.save();
	}

	randomize() {
		const randomColors = [
			'#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0',
			'#ff7b00', '#ff006e', '#8338ec', '#3a86ff', '#06d6a0'
		];
		const c1 = randomColors[Math.floor(Math.random() * randomColors.length)];
		const c2 = randomColors[Math.floor(Math.random() * randomColors.length)];
		const c3 = randomColors[Math.floor(Math.random() * randomColors.length)];
		this.angle = Math.floor(Math.random() * 360);
		this.stops = [
			{ id: 's1', color: c1, stop: 0 },
			{ id: 's2', color: c2, stop: 50 },
			{ id: 's3', color: c3, stop: 100 }
		];
		this.save();
	}

	reset() {
		this.type = 'linear';
		this.angle = 135;
		this.stops = [
			{ id: 's1', color: '#7c6dfa', stop: 0 },
			{ id: 's2', color: '#c47fff', stop: 50 },
			{ id: 's3', color: '#4dd9c0', stop: 100 }
		];
		this.animation = 'off';
		this.previewMode = 'background';
		this.save();
	}

	getCode(tab: GradientExportTab): string {
		switch (tab) {
			case 'sass':
				return exportGradientSass(this.settings);
			case 'css':
				return exportGradientCss(this.settings);
			case 'tailwind':
				return exportGradientTailwind(this.settings);
			case 'scss':
				return exportGradientScss(this.settings);
		}
	}
}

export const gradientStore = new GradientStore();
