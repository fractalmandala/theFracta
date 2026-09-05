// Reactive state for CSS Keyframe Animation Engine
import { browser } from '$lib/modules/studio/env';
import {
	type IterationValue,
	type FillMode,
	type DirectionMode,
	type ElementShape,
	type SpeedMultiplier,
	type AnimationSettings,
	type AnimationPreset,
	ANIMATION_PRESETS,
	getPresetById,
	exportAnimationSass,
	exportAnimationCss,
	exportAnimationTailwind,
	exportAnimationReact,
	getRawKeyframesText
} from '$lib/modules/studio/animation-math';

export type AnimationExportTab = 'sass' | 'css' | 'tailwind' | 'react' | 'edit';

class AnimationStore {
	activePresetId = $state<string>('fade-in');
	duration = $state<number>(0.6);
	delay = $state<number>(0);
	iterations = $state<IterationValue>('1');
	easing = $state<string>('ease');
	fill = $state<FillMode>('forwards');
	direction = $state<DirectionMode>('normal');
	element = $state<ElementShape>('box');
	speed = $state<SpeedMultiplier>(1);
	darkBg = $state<boolean>(false);
	stagger3 = $state<boolean>(false);
	replayKey = $state<number>(0);
	activeExportTab = $state<AnimationExportTab>('sass');
	customKeyframes = $state<string>('');

	preset = $derived<AnimationPreset>(getPresetById(this.activePresetId));

	settings = $derived<AnimationSettings>({
		activePresetId: this.activePresetId,
		duration: this.duration,
		delay: this.delay,
		iterations: this.iterations,
		easing: this.easing,
		fill: this.fill,
		direction: this.direction,
		element: this.element,
		speed: this.speed,
		darkBg: this.darkBg,
		stagger3: this.stagger3,
		customKeyframes: this.customKeyframes
	});

	effectiveDuration = $derived<number>(
		Number((this.duration / (this.speed || 1)).toFixed(2))
	);

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('fm:animation_state');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (parsed.activePresetId) this.activePresetId = parsed.activePresetId;
					if (parsed.duration) this.duration = parsed.duration;
					if (parsed.delay !== undefined) this.delay = parsed.delay;
					if (parsed.iterations) this.iterations = parsed.iterations;
					if (parsed.easing) this.easing = parsed.easing;
					if (parsed.fill) this.fill = parsed.fill;
					if (parsed.direction) this.direction = parsed.direction;
					if (parsed.element) this.element = parsed.element;
					if (parsed.darkBg !== undefined) this.darkBg = parsed.darkBg;
				} catch (e) {
					console.error('Failed to parse saved animation state', e);
				}
			}
		}
		this.customKeyframes = getRawKeyframesText(this.preset);
	}

	save() {
		if (browser) {
			localStorage.setItem('fm:animation_state', JSON.stringify(this.settings));
		}
	}

	setPreset(id: string) {
		this.activePresetId = id;
		this.customKeyframes = getRawKeyframesText(getPresetById(id));
		this.replay();
		this.save();
	}

	replay() {
		this.replayKey += 1;
	}

	setSpeed(spd: SpeedMultiplier) {
		this.speed = spd;
		this.replay();
	}

	setElement(shape: ElementShape) {
		this.element = shape;
		this.save();
	}

	reset() {
		this.activePresetId = 'fade-in';
		this.duration = 0.6;
		this.delay = 0;
		this.iterations = '1';
		this.easing = 'ease';
		this.fill = 'forwards';
		this.direction = 'normal';
		this.element = 'box';
		this.speed = 1;
		this.darkBg = false;
		this.stagger3 = false;
		this.customKeyframes = getRawKeyframesText(getPresetById('fade-in'));
		this.replay();
		this.save();
	}

	getCode(tab: AnimationExportTab): string {
		switch (tab) {
			case 'sass':
				return exportAnimationSass(this.settings);
			case 'css':
				return exportAnimationCss(this.settings);
			case 'tailwind':
				return exportAnimationTailwind(this.settings);
			case 'react':
				return exportAnimationReact(this.settings);
			case 'edit':
				return this.customKeyframes;
		}
	}
}

export const animationStore = new AnimationStore();
