// Gradient Generator Math & Serialization Utilities

export type GradientType = 'linear' | 'radial' | 'conic';
export type PreviewMode = 'background' | 'text' | 'border';
export type AnimationType = 'off' | 'slide' | 'diagonal' | 'hueShift' | 'breathe' | 'pulse' | 'spin';

export interface ColorStop {
	id: string;
	color: string;
	stop: number; // 0 - 100
}

export interface GradientSettings {
	type: GradientType;
	angle: number; // 0 - 360
	radialShape: 'circle' | 'ellipse';
	radialPosition: string; // e.g. 'center'
	stops: ColorStop[];
	animation: AnimationType;
	animationDuration: number; // in seconds
	previewMode: PreviewMode;
}

export const GRADIENT_PRESETS: Array<{ label: string; stops: ColorStop[]; angle: number; type: GradientType }> = [
	{
		label: 'Purple Wave',
		angle: 135,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#7c6dfa', stop: 0 },
			{ id: 's2', color: '#c47fff', stop: 50 },
			{ id: 's3', color: '#4dd9c0', stop: 100 }
		]
	},
	{
		label: 'Sunset Peach',
		angle: 90,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#ff6b6b', stop: 0 },
			{ id: 's2', color: '#feca57', stop: 100 }
		]
	},
	{
		label: 'Deep Ocean',
		angle: 180,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#130cb7', stop: 0 },
			{ id: 's2', color: '#52e5e7', stop: 100 }
		]
	},
	{
		label: 'Cyberpunk Neon',
		angle: 45,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#f72585', stop: 0 },
			{ id: 's2', color: '#7209b7', stop: 50 },
			{ id: 's3', color: '#4cc9f0', stop: 100 }
		]
	},
	{
		label: 'Aurora Glow',
		angle: 120,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#00f2fe', stop: 0 },
			{ id: 's2', color: '#4facfe', stop: 50 },
			{ id: 's3', color: '#000', stop: 100 }
		]
	},
	{
		label: 'Rose Gold',
		angle: 135,
		type: 'linear',
		stops: [
			{ id: 's1', color: '#f857a6', stop: 0 },
			{ id: 's2', color: '#ff5858', stop: 100 }
		]
	},
	{
		label: 'Conic Prism',
		angle: 0,
		type: 'conic',
		stops: [
			{ id: 's1', color: '#ff0000', stop: 0 },
			{ id: 's2', color: '#ffff00', stop: 25 },
			{ id: 's3', color: '#00ff00', stop: 50 },
			{ id: 's4', color: '#00ffff', stop: 75 },
			{ id: 's5', color: '#ff0000', stop: 100 }
		]
	},
	{
		label: 'Emerald Aura',
		angle: 160,
		type: 'radial',
		stops: [
			{ id: 's1', color: '#10b981', stop: 0 },
			{ id: 's2', color: '#064e3b', stop: 100 }
		]
	}
];

export function buildGradientString(settings: GradientSettings): string {
	const sortedStops = [...settings.stops].sort((a, b) => a.stop - b.stop);
	const stopStr = sortedStops.map((s) => `${s.color} ${s.stop}%`).join(', ');

	switch (settings.type) {
		case 'linear':
			return `linear-gradient(${settings.angle}deg, ${stopStr})`;
		case 'radial':
			return `radial-gradient(${settings.radialShape || 'circle'} at ${settings.radialPosition || 'center'}, ${stopStr})`;
		case 'conic':
			return `conic-gradient(from ${settings.angle}deg at 50% 50%, ${stopStr})`;
	}
}

// Generate CSS Output including animation keyframes
export function exportGradientCss(settings: GradientSettings): string {
	const gradStr = buildGradientString(settings);
	const dur = settings.animationDuration || 6;

	let css = '';

	if (settings.previewMode === 'text') {
		css += `background: ${gradStr};\n-webkit-background-clip: text;\n-webkit-text-fill-color: transparent;`;
	} else if (settings.previewMode === 'border') {
		css += `border: 4px solid transparent;\nborder-image: ${gradStr} 1;`;
	} else {
		css += `background: ${gradStr};`;
	}

	if (settings.animation !== 'off') {
		switch (settings.animation) {
			case 'slide':
				css += `\nbackground-size: 200% 200%;\nanimation: gradientSlide ${dur}s ease infinite;\n\n@keyframes gradientSlide {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}`;
				break;
			case 'diagonal':
				css += `\nbackground-size: 250% 250%;\nanimation: gradientDiagonal ${dur}s ease infinite;\n\n@keyframes gradientDiagonal {\n  0% { background-position: 0% 0%; }\n  50% { background-position: 100% 100%; }\n  100% { background-position: 0% 0%; }\n}`;
				break;
			case 'hueShift':
				css += `\nanimation: gradientHueShift ${dur}s linear infinite;\n\n@keyframes gradientHueShift {\n  0% { filter: hue-rotate(0deg); }\n  100% { filter: hue-rotate(360deg); }\n}`;
				break;
			case 'breathe':
				css += `\nanimation: gradientBreathe ${dur}s ease-in-out infinite;\n\n@keyframes gradientBreathe {\n  0%, 100% { transform: scale(1); filter: brightness(1); }\n  50% { transform: scale(1.03); filter: brightness(1.15); }\n}`;
				break;
			case 'pulse':
				css += `\nanimation: gradientPulse ${dur}s ease-in-out infinite;\n\n@keyframes gradientPulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.75; }\n}`;
				break;
			case 'spin':
				css += `\nanimation: gradientSpin ${dur}s linear infinite;\n\n@keyframes gradientSpin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}`;
				break;
		}
	}

	return css;
}

export function exportGradientTailwind(settings: GradientSettings): string {
	const sorted = [...settings.stops].sort((a, b) => a.stop - b.stop);
	if (settings.type === 'linear' && sorted.length >= 2) {
		const from = `from-[${sorted[0].color}]`;
		const to = `to-[${sorted[sorted.length - 1].color}]`;
		const via =
			sorted.length > 2 ? ` via-[${sorted[Math.floor(sorted.length / 2)].color}]` : '';

		let dir = 'bg-gradient-to-r';
		if (settings.angle >= 45 && settings.angle < 135) dir = 'bg-gradient-to-br';
		else if (settings.angle >= 135 && settings.angle < 225) dir = 'bg-gradient-to-b';
		else if (settings.angle >= 225 && settings.angle < 315) dir = 'bg-gradient-to-bl';

		return `${dir} ${from}${via} ${to}`;
	}

	const gradStr = buildGradientString(settings).replace(/\s+/g, '_');
	return `bg-[${gradStr}]`;
}

export function exportGradientSass(settings: GradientSettings): string {
	const gradStr = buildGradientString(settings);
	return `$gradient-surface: ${gradStr}\n\n.gradient-element\n\tbackground: $gradient-surface`;
}

export function exportGradientScss(settings: GradientSettings): string {
	const gradStr = buildGradientString(settings);
	return `$gradient: ${gradStr};\n\n@mixin dynamic-gradient {\n  background: $gradient;\n}`;
}
