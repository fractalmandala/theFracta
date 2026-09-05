// CSS Keyframe Animation Engine - Mathematics, Presets & Exporters

export type IterationValue = '1' | '2' | '3' | '5' | 'infinite';
export type FillMode = 'forwards' | 'backwards' | 'both' | 'none';
export type DirectionMode = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
export type ElementShape = 'box' | 'button' | 'text' | 'card';
export type SpeedMultiplier = 0.25 | 0.5 | 1 | 2;

export interface KeyframeStop {
	offset: string; // e.g. '0%', '50%', '100%' or 'from', 'to'
	properties: Record<string, string>;
}

export interface AnimationPreset {
	id: string;
	name: string;
	category: string;
	isStar?: boolean;
	keyframes: KeyframeStop[];
}

export interface AnimationSettings {
	activePresetId: string;
	duration: number; // in seconds
	delay: number; // in seconds
	iterations: IterationValue;
	easing: string;
	fill: FillMode;
	direction: DirectionMode;
	element: ElementShape;
	speed: SpeedMultiplier;
	darkBg: boolean;
	stagger3: boolean;
	customKeyframes?: string;
}

export const EASING_OPTIONS = [
	{ label: 'ease', value: 'ease' },
	{ label: 'linear', value: 'linear' },
	{ label: 'ease-in', value: 'ease-in' },
	{ label: 'ease-out', value: 'ease-out' },
	{ label: 'ease-in-out', value: 'ease-in-out' },
	{ label: 'cubic-bezier (Back)', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
	{ label: 'cubic-bezier (Smooth)', value: 'cubic-bezier(0.25, 1, 0.5, 1)' },
	{ label: 'steps(4)', value: 'steps(4, jump-end)' }
];

export const ANIMATION_PRESETS: AnimationPreset[] = [
	{
		id: 'fade-in',
		name: 'Fade In',
		category: 'Fades',
		keyframes: [
			{ offset: 'from', properties: { opacity: '0' } },
			{ offset: 'to', properties: { opacity: '1' } }
		]
	},
	{
		id: 'fade-out',
		name: 'Fade Out',
		category: 'Fades',
		keyframes: [
			{ offset: 'from', properties: { opacity: '1' } },
			{ offset: 'to', properties: { opacity: '0' } }
		]
	},
	{
		id: 'slide-up',
		name: 'Slide Up',
		category: 'Slides',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translateY(100%)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'translateY(0)', opacity: '1' } }
		]
	},
	{
		id: 'slide-down',
		name: 'Slide Down',
		category: 'Slides',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translateY(-100%)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'translateY(0)', opacity: '1' } }
		]
	},
	{
		id: 'slide-left',
		name: 'Slide Left',
		category: 'Slides',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translateX(100%)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'translateX(0)', opacity: '1' } }
		]
	},
	{
		id: 'slide-right',
		name: 'Slide Right',
		category: 'Slides',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translateX(-100%)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'translateX(0)', opacity: '1' } }
		]
	},
	{
		id: 'bounce',
		name: 'Bounce',
		category: 'Bounces',
		keyframes: [
			{ offset: '0%, 20%, 53%, 80%, 100%', properties: { transform: 'translate3d(0,0,0)' } },
			{ offset: '40%, 43%', properties: { transform: 'translate3d(0, -30px, 0)' } },
			{ offset: '70%', properties: { transform: 'translate3d(0, -15px, 0)' } },
			{ offset: '90%', properties: { transform: 'translate3d(0, -4px, 0)' } }
		]
	},
	{
		id: 'scale-up',
		name: 'Scale Up',
		category: 'Scales',
		keyframes: [
			{ offset: 'from', properties: { transform: 'scale(0.5)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'scale(1)', opacity: '1' } }
		]
	},
	{
		id: 'scale-down',
		name: 'Scale Down',
		category: 'Scales',
		keyframes: [
			{ offset: 'from', properties: { transform: 'scale(1.5)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'scale(1)', opacity: '1' } }
		]
	},
	{
		id: 'rotate',
		name: 'Rotate',
		category: 'Rotates',
		keyframes: [
			{ offset: 'from', properties: { transform: 'rotate(0deg)' } },
			{ offset: 'to', properties: { transform: 'rotate(360deg)' } }
		]
	},
	{
		id: 'spin-in',
		name: 'Spin In',
		category: 'Rotates',
		keyframes: [
			{ offset: 'from', properties: { transform: 'rotate(-540deg) scale(0)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'rotate(0) scale(1)', opacity: '1' } }
		]
	},
	{
		id: 'shake',
		name: 'Shake',
		category: 'Vibrations',
		keyframes: [
			{ offset: '0%, 100%', properties: { transform: 'translateX(0)' } },
			{ offset: '10%, 30%, 50%, 70%, 90%', properties: { transform: 'translateX(-10px)' } },
			{ offset: '20%, 40%, 60%, 80%', properties: { transform: 'translateX(10px)' } }
		]
	},
	{
		id: 'pulse',
		name: 'Pulse',
		category: 'Vibrations',
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale(1)' } },
			{ offset: '50%', properties: { transform: 'scale(1.1)' } },
			{ offset: '100%', properties: { transform: 'scale(1)' } }
		]
	},
	{
		id: 'flip-x',
		name: 'Flip X',
		category: 'Flips',
		keyframes: [
			{ offset: 'from', properties: { transform: 'perspective(400px) rotateX(90deg)', opacity: '0' } },
			{ offset: '40%', properties: { transform: 'perspective(400px) rotateX(-10deg)' } },
			{ offset: '70%', properties: { transform: 'perspective(400px) rotateX(10deg)' } },
			{ offset: 'to', properties: { transform: 'perspective(400px) rotateX(0deg)', opacity: '1' } }
		]
	},
	{
		id: 'flip-y',
		name: 'Flip Y',
		category: 'Flips',
		keyframes: [
			{ offset: 'from', properties: { transform: 'perspective(400px) rotateY(90deg)', opacity: '0' } },
			{ offset: '40%', properties: { transform: 'perspective(400px) rotateY(-10deg)' } },
			{ offset: '70%', properties: { transform: 'perspective(400px) rotateY(10deg)' } },
			{ offset: 'to', properties: { transform: 'perspective(400px) rotateY(0deg)', opacity: '1' } }
		]
	},
	{
		id: 'rubber-band',
		name: 'Rubber Band',
		category: 'Effects',
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale3d(1, 1, 1)' } },
			{ offset: '30%', properties: { transform: 'scale3d(1.25, 0.75, 1)' } },
			{ offset: '40%', properties: { transform: 'scale3d(0.75, 1.25, 1)' } },
			{ offset: '50%', properties: { transform: 'scale3d(1.15, 0.85, 1)' } },
			{ offset: '65%', properties: { transform: 'scale3d(0.95, 1.05, 1)' } },
			{ offset: '75%', properties: { transform: 'scale3d(1.05, 0.95, 1)' } },
			{ offset: '100%', properties: { transform: 'scale3d(1, 1, 1)' } }
		]
	},
	{
		id: 'jello',
		name: 'Jello',
		category: 'Effects',
		keyframes: [
			{ offset: '0%, 100%', properties: { transform: 'scale3d(1, 1, 1)' } },
			{ offset: '11.1%', properties: { transform: 'skewX(-12.5deg) skewY(-12.5deg)' } },
			{ offset: '22.2%', properties: { transform: 'skewX(6.25deg) skewY(6.25deg)' } },
			{ offset: '33.3%', properties: { transform: 'skewX(-3.125deg) skewY(-3.125deg)' } },
			{ offset: '44.4%', properties: { transform: 'skewX(1.5625deg) skewY(1.5625deg)' } },
			{ offset: '55.5%', properties: { transform: 'skewX(-0.78125deg) skewY(-0.78125deg)' } }
		]
	},
	{
		id: 'tada',
		name: 'Tada',
		category: 'Effects',
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale3d(1, 1, 1)' } },
			{ offset: '10%, 20%', properties: { transform: 'scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)' } },
			{ offset: '30%, 50%, 70%, 90%', properties: { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)' } },
			{ offset: '40%, 60%, 80%', properties: { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)' } },
			{ offset: '100%', properties: { transform: 'scale3d(1, 1, 1)' } }
		]
	},
	{
		id: 'heartbeat',
		name: 'Heartbeat',
		category: 'Effects',
		isStar: true,
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale(1)' } },
			{ offset: '14%', properties: { transform: 'scale(1.3)' } },
			{ offset: '28%', properties: { transform: 'scale(1)' } },
			{ offset: '42%', properties: { transform: 'scale(1.3)' } },
			{ offset: '70%', properties: { transform: 'scale(1)' } }
		]
	},
	{
		id: 'wobble',
		name: 'Wobble',
		category: 'Effects',
		keyframes: [
			{ offset: '0%', properties: { transform: 'translate3d(0, 0, 0)' } },
			{ offset: '15%', properties: { transform: 'translate3d(-25%, 0, 0) rotate3d(0, 0, 1, -5deg)' } },
			{ offset: '30%', properties: { transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)' } },
			{ offset: '45%', properties: { transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)' } },
			{ offset: '60%', properties: { transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)' } },
			{ offset: '75%', properties: { transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)' } },
			{ offset: '100%', properties: { transform: 'translate3d(0, 0, 0)' } }
		]
	},
	{
		id: 'swing',
		name: 'Swing',
		category: 'Effects',
		keyframes: [
			{ offset: '20%', properties: { transform: 'rotate3d(0, 0, 1, 15deg)' } },
			{ offset: '40%', properties: { transform: 'rotate3d(0, 0, 1, -10deg)' } },
			{ offset: '60%', properties: { transform: 'rotate3d(0, 0, 1, 5deg)' } },
			{ offset: '80%', properties: { transform: 'rotate3d(0, 0, 1, -5deg)' } },
			{ offset: '100%', properties: { transform: 'rotate3d(0, 0, 1, 0deg)' } }
		]
	},
	{
		id: 'flash',
		name: 'Flash',
		category: 'Effects',
		keyframes: [
			{ offset: '0%, 50%, 100%', properties: { opacity: '1' } },
			{ offset: '25%, 75%', properties: { opacity: '0' } }
		]
	},
	{
		id: 'float',
		name: 'Float',
		category: 'Effects',
		keyframes: [
			{ offset: '0%, 100%', properties: { transform: 'translateY(0)' } },
			{ offset: '50%', properties: { transform: 'translateY(-18px)' } }
		]
	},
	{
		id: 'blur-in',
		name: 'Blur In',
		category: 'Fades',
		keyframes: [
			{ offset: 'from', properties: { filter: 'blur(20px)', opacity: '0' } },
			{ offset: 'to', properties: { filter: 'blur(0)', opacity: '1' } }
		]
	},
	{
		id: 'glitch',
		name: 'Glitch',
		category: 'Effects',
		keyframes: [
			{ offset: '0%, 100%', properties: { transform: 'translate(0)' } },
			{ offset: '20%', properties: { transform: 'translate(-4px, 4px) skew(2deg)' } },
			{ offset: '40%', properties: { transform: 'translate(-4px, -4px) skew(-2deg)' } },
			{ offset: '60%', properties: { transform: 'translate(4px, 4px) skew(1deg)' } },
			{ offset: '80%', properties: { transform: 'translate(4px, -4px) skew(-1deg)' } }
		]
	},
	{
		id: 'roll-in',
		name: 'Roll In',
		category: 'Rotates',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translateX(-100%) rotate3d(0, 0, 1, -120deg)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'translateX(0) rotate3d(0, 0, 1, 0deg)', opacity: '1' } }
		]
	},
	{
		id: 'light-speed-in',
		name: 'Light Speed In',
		category: 'Slides',
		keyframes: [
			{ offset: 'from', properties: { transform: 'translate3d(100%, 0, 0) skewX(-30deg)', opacity: '0' } },
			{ offset: '60%', properties: { transform: 'skewX(20deg)', opacity: '1' } },
			{ offset: '80%', properties: { transform: 'skewX(-5deg)' } },
			{ offset: 'to', properties: { transform: 'translate3d(0, 0, 0)' } }
		]
	},
	{
		id: 'pop',
		name: 'Pop',
		category: 'Scales',
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale(0.8)', opacity: '0' } },
			{ offset: '70%', properties: { transform: 'scale(1.15)', opacity: '1' } },
			{ offset: '100%', properties: { transform: 'scale(1)' } }
		]
	},
	{
		id: 'drop-bounce',
		name: 'Drop Bounce',
		category: 'Bounces',
		keyframes: [
			{ offset: '0%', properties: { transform: 'translateY(-300px)', opacity: '0' } },
			{ offset: '60%', properties: { transform: 'translateY(25px)', opacity: '1' } },
			{ offset: '75%', properties: { transform: 'translateY(-10px)' } },
			{ offset: '90%', properties: { transform: 'translateY(5px)' } },
			{ offset: '100%', properties: { transform: 'translateY(0)' } }
		]
	},
	{
		id: 'skew-in',
		name: 'Skew In',
		category: 'Effects',
		keyframes: [
			{ offset: 'from', properties: { transform: 'skewX(45deg)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'skewX(0deg)', opacity: '1' } }
		]
	},
	{
		id: 'neon-pulse',
		name: 'Neon Pulse',
		category: 'Effects',
		keyframes: [
			{ offset: '0%, 100%', properties: { filter: 'drop-shadow(0 0 5px #6366f1) drop-shadow(0 0 15px #6366f1)', transform: 'scale(1)' } },
			{ offset: '50%', properties: { filter: 'drop-shadow(0 0 20px #8b5cf6) drop-shadow(0 0 35px #a855f7)', transform: 'scale(1.04)' } }
		]
	},
	{
		id: 'zoom-in',
		name: 'Zoom In',
		category: 'Scales',
		keyframes: [
			{ offset: 'from', properties: { transform: 'scale3d(0.3, 0.3, 0.3)', opacity: '0' } },
			{ offset: '50%', properties: { opacity: '1' } },
			{ offset: 'to', properties: { transform: 'scale3d(1, 1, 1)' } }
		]
	},
	{
		id: 'tilt-3d',
		name: 'Tilt 3D',
		category: '3D',
		keyframes: [
			{ offset: '0%, 100%', properties: { transform: 'perspective(600px) rotateX(0deg) rotateY(0deg)' } },
			{ offset: '25%', properties: { transform: 'perspective(600px) rotateX(20deg) rotateY(15deg)' } },
			{ offset: '75%', properties: { transform: 'perspective(600px) rotateX(-20deg) rotateY(-15deg)' } }
		]
	},
	{
		id: 'vortex',
		name: 'Vortex',
		category: '3D',
		keyframes: [
			{ offset: 'from', properties: { transform: 'perspective(600px) rotateZ(0deg) scale(0)', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'perspective(600px) rotateZ(720deg) scale(1)', opacity: '1' } }
		]
	},
	{
		id: 'elastic',
		name: 'Elastic',
		category: 'Bounces',
		keyframes: [
			{ offset: '0%', properties: { transform: 'scale(0)' } },
			{ offset: '55%', properties: { transform: 'scale(1.25)' } },
			{ offset: '75%', properties: { transform: 'scale(0.9)' } },
			{ offset: '90%', properties: { transform: 'scale(1.05)' } },
			{ offset: '100%', properties: { transform: 'scale(1)' } }
		]
	},
	{
		id: 'door-open',
		name: 'Door Open',
		category: '3D',
		keyframes: [
			{ offset: 'from', properties: { transform: 'perspective(800px) rotateY(-90deg)', transformOrigin: 'left', opacity: '0' } },
			{ offset: 'to', properties: { transform: 'perspective(800px) rotateY(0deg)', transformOrigin: 'left', opacity: '1' } }
		]
	}
];

export function getPresetById(id: string): AnimationPreset {
	return ANIMATION_PRESETS.find((p) => p.id === id) || ANIMATION_PRESETS[0];
}

// Single-Tab Indented SASS Exporter
export function exportAnimationSass(settings: AnimationSettings): string {
	const preset = getPresetById(settings.activePresetId);
	const dur = settings.duration || 0.6;
	const delay = settings.delay || 0;
	const animName = preset.id;

	const animProp = `animation: ${animName} ${dur}s ${settings.easing} ${delay}s ${settings.iterations} ${settings.direction} ${settings.fill}`;

	let kfLines = `@keyframes ${animName}\n`;
	for (const stop of preset.keyframes) {
		kfLines += `\t${stop.offset}\n`;
		for (const [prop, val] of Object.entries(stop.properties)) {
			// Convert camelCase to kebab-case
			const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
			kfLines += `\t\t${kebab}: ${val}\n`;
		}
	}

	return `.element\n\t${animProp}\n\n${kfLines}`;
}

// Standard CSS Exporter
export function exportAnimationCss(settings: AnimationSettings): string {
	const preset = getPresetById(settings.activePresetId);
	const dur = settings.duration || 0.6;
	const delay = settings.delay || 0;
	const animName = preset.id;

	const animProp = `animation: ${animName} ${dur}s ${settings.easing} ${delay}s ${settings.iterations} ${settings.direction} ${settings.fill};`;

	let kfLines = `@keyframes ${animName} {\n`;
	for (const stop of preset.keyframes) {
		kfLines += `  ${stop.offset} {\n`;
		for (const [prop, val] of Object.entries(stop.properties)) {
			const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
			kfLines += `    ${kebab}: ${val};\n`;
		}
		kfLines += `  }\n`;
	}
	kfLines += `}`;

	return `.element {\n  ${animProp}\n}\n\n${kfLines}`;
}

// Tailwind Exporter
export function exportAnimationTailwind(settings: AnimationSettings): string {
	const preset = getPresetById(settings.activePresetId);
	const dur = settings.duration || 0.6;
	return `<!-- Tailwind v3 / v4 class -->\n<div class="animate-[${preset.id}_${dur}s_${settings.easing}_${settings.fill}]">\n  Animated Content\n</div>\n\n// In tailwind.config.js\n// Add keyframes for '${preset.id}'`;
}

// React JSX Exporter
export function exportAnimationReact(settings: AnimationSettings): string {
	const preset = getPresetById(settings.activePresetId);
	const dur = settings.duration || 0.6;
	return `import React from 'react';\nimport './${preset.id}.sass';\n\nexport const AnimatedElement = () => {\n  return (\n    <div className="element">\n      Preview\n    </div>\n  );\n};`;
}

// Raw Keyframes for EDIT KF Tab
export function getRawKeyframesText(preset: AnimationPreset): string {
	let kfLines = `@keyframes ${preset.id} {\n`;
	for (const stop of preset.keyframes) {
		kfLines += `  ${stop.offset} {\n`;
		for (const [prop, val] of Object.entries(stop.properties)) {
			const kebab = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
			kfLines += `    ${kebab}: ${val};\n`;
		}
		kfLines += `  }\n`;
	}
	kfLines += `}`;
	return kfLines;
}
