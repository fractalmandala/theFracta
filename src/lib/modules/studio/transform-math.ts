// 2D & 3D Transform Math & Serialization Utilities

export type TransformOriginType =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'center left'
	| 'center'
	| 'center right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export interface TransformSettings {
	translateX: number; // px
	translateY: number; // px
	translateZ: number; // px
	rotateX: number; // deg
	rotateY: number; // deg
	rotateZ: number; // deg
	scaleX: number; // multiplier
	scaleY: number; // multiplier
	skewX: number; // deg
	skewY: number; // deg
	perspective: number; // px, 0 for none
	origin: TransformOriginType;
	showGrid: boolean;
	elementColor: string;
	elementText: string;
}

export const DEFAULT_TRANSFORM: TransformSettings = {
	translateX: 0,
	translateY: 0,
	translateZ: 0,
	rotateX: 0,
	rotateY: 0,
	rotateZ: 0,
	scaleX: 1.5,
	scaleY: 1.5,
	skewX: 0,
	skewY: 0,
	perspective: 800,
	origin: 'top right',
	showGrid: true,
	elementColor: '#6366f1',
	elementText: 'Element'
};

export const TRANSFORM_PRESETS: Record<string, { label: string; settings: Partial<TransformSettings> }> = {
	none: {
		label: 'None',
		settings: {
			translateX: 0,
			translateY: 0,
			translateZ: 0,
			rotateX: 0,
			rotateY: 0,
			rotateZ: 0,
			scaleX: 1,
			scaleY: 1,
			skewX: 0,
			skewY: 0,
			perspective: 0,
			origin: 'center'
		}
	},
	flipH: {
		label: 'Flip H',
		settings: {
			scaleX: -1,
			scaleY: 1,
			rotateZ: 0,
			origin: 'center'
		}
	},
	flipV: {
		label: 'Flip V',
		settings: {
			scaleX: 1,
			scaleY: -1,
			rotateZ: 0,
			origin: 'center'
		}
	},
	rotate45: {
		label: 'Rotate 45°',
		settings: {
			rotateZ: 45,
			origin: 'center'
		}
	},
	rotate90: {
		label: 'Rotate 90°',
		settings: {
			rotateZ: 90,
			origin: 'center'
		}
	},
	scaleUp: {
		label: 'Scale Up',
		settings: {
			scaleX: 1.5,
			scaleY: 1.5,
			origin: 'top right'
		}
	},
	scaleDown: {
		label: 'Scale Down',
		settings: {
			scaleX: 0.7,
			scaleY: 0.7,
			origin: 'center'
		}
	},
	skew: {
		label: 'Skew',
		settings: {
			skewX: 20,
			skewY: 10,
			origin: 'center'
		}
	},
	tilt3d: {
		label: 'Tilt 3D',
		settings: {
			perspective: 600,
			rotateX: 30,
			rotateY: -25,
			translateZ: 50,
			origin: 'center'
		}
	},
	slideRight: {
		label: 'Slide Right',
		settings: {
			translateX: 80,
			origin: 'center'
		}
	}
};

export function buildTransformCss(settings: TransformSettings): string {
	const transforms: string[] = [];

	if (settings.perspective > 0 && (settings.rotateX !== 0 || settings.rotateY !== 0 || settings.translateZ !== 0)) {
		transforms.push(`perspective(${settings.perspective}px)`);
	}

	if (settings.translateX !== 0 || settings.translateY !== 0 || settings.translateZ !== 0) {
		if (settings.translateZ !== 0) {
			transforms.push(`translate3d(${settings.translateX}px, ${settings.translateY}px, ${settings.translateZ}px)`);
		} else {
			transforms.push(`translate(${settings.translateX}px, ${settings.translateY}px)`);
		}
	}

	if (settings.rotateX !== 0) transforms.push(`rotateX(${settings.rotateX}deg)`);
	if (settings.rotateY !== 0) transforms.push(`rotateY(${settings.rotateY}deg)`);
	if (settings.rotateZ !== 0) transforms.push(`rotate(${settings.rotateZ}deg)`);

	if (settings.scaleX !== 1 || settings.scaleY !== 1) {
		if (settings.scaleX === settings.scaleY) {
			transforms.push(`scale(${settings.scaleX})`);
		} else {
			transforms.push(`scale(${settings.scaleX}, ${settings.scaleY})`);
		}
	}

	if (settings.skewX !== 0 || settings.skewY !== 0) {
		transforms.push(`skew(${settings.skewX}deg, ${settings.skewY}deg)`);
	}

	return transforms.length > 0 ? transforms.join(' ') : 'none';
}

// Exporters
export function exportTransformSass(settings: TransformSettings): string {
	const transform = buildTransformCss(settings);
	const originStr = settings.origin !== 'center' ? `\n\ttransform-origin: ${settings.origin}` : '';
	return `.element\n\ttransform: ${transform}${originStr}\n\ttransition: transform 0.2s ease`;
}

export function exportTransformCss(settings: TransformSettings): string {
	const transform = buildTransformCss(settings);
	const originStr = settings.origin !== 'center' ? `\n  transform-origin: ${settings.origin};` : '';
	return `.element {\n  transform: ${transform};${originStr}\n}`;
}

export function exportTransformTailwind(settings: TransformSettings): string {
	const classes: string[] = [];

	if (settings.scaleX === settings.scaleY && settings.scaleX !== 1) {
		classes.push(`scale-[${settings.scaleX}]`);
	}
	if (settings.rotateZ !== 0) {
		classes.push(`rotate-[${settings.rotateZ}deg]`);
	}
	if (settings.translateX !== 0) {
		classes.push(`translate-x-[${settings.translateX}px]`);
	}
	if (settings.translateY !== 0) {
		classes.push(`translate-y-[${settings.translateY}px]`);
	}
	if (settings.skewX !== 0) {
		classes.push(`skew-x-[${settings.skewX}deg]`);
	}

	const originMap: Record<TransformOriginType, string> = {
		'top left': 'origin-top-left',
		'top center': 'origin-top',
		'top right': 'origin-top-right',
		'center left': 'origin-left',
		'center': 'origin-center',
		'center right': 'origin-right',
		'bottom left': 'origin-bottom-left',
		'bottom center': 'origin-bottom',
		'bottom right': 'origin-bottom-right'
	};

	if (settings.origin !== 'center') {
		classes.push(originMap[settings.origin]);
	}

	return classes.length > 0 ? classes.join(' ') : 'transform-none';
}

export function exportTransformReact(settings: TransformSettings): string {
	const transform = buildTransformCss(settings);
	return `const elementStyle = {\n  transform: '${transform}',\n  transformOrigin: '${settings.origin}',\n  transition: 'transform 0.2s ease'\n};`;
}
