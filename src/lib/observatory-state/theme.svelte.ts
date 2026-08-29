// Reactive Theme & Design Token Customizer for Repograph Viewer
import { browser } from '$app/environment';

export interface ThemeConfig {
	preset: 'obsidian' | 'pitch' | 'slate' | 'paper' | 'custom';
	accent: string;
	bg: string;
	bgCard: string;
	bgSurface: string;
	border: string;
	text: string;
	textDim: string;
	fontFamily: 'mono' | 'sans' | 'serif';
	borderRadius: number; // 0, 4, 8, 12
	shadowLevel: 'none' | 'subtle' | 'card' | 'glow';
}

export const THEME_PRESETS: Record<string, Partial<ThemeConfig>> = {
	obsidian: {
		preset: 'obsidian',
		bg: '#0d1117',
		bgCard: '#161b22',
		bgSurface: '#1c2128',
		border: '#30363d',
		text: '#e6edf3',
		textDim: '#8b949e',
		accent: '#58a6ff'
	},
	pitch: {
		preset: 'pitch',
		bg: '#000000',
		bgCard: '#0a0a0a',
		bgSurface: '#121212',
		border: '#262626',
		text: '#f5f5f5',
		textDim: '#a3a3a3',
		accent: '#38bdf8'
	},
	slate: {
		preset: 'slate',
		bg: '#0f172a',
		bgCard: '#1e293b',
		bgSurface: '#334155',
		border: '#475569',
		text: '#f8fafc',
		textDim: '#94a3b8',
		accent: '#818cf8'
	},
	paper: {
		preset: 'paper',
		bg: '#faf8f5',
		bgCard: '#ffffff',
		bgSurface: '#f4f0ea',
		border: '#e2dcd4',
		text: '#1a1816',
		textDim: '#70685e',
		accent: '#2563eb'
	}
};

class ThemeState {
	config = $state<ThemeConfig>({
		preset: 'obsidian',
		accent: '#10b223',
		bg: '#161616',
		bgCard: '#161b22',
		bgSurface: '#1f2020',
		border: '#313232',
		text: '#eff1f3',
		textDim: '#9c9e9f',
		fontFamily: 'sans',
		borderRadius: 6,
		shadowLevel: 'card'
	});

	isCustomizerOpen = $state(false);

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('repograph:theme');
			if (saved) {
				try {
					this.config = { ...this.config, ...JSON.parse(saved) };
				} catch {}
			}
			this.apply();
		}
	}

	setPreset(preset: 'obsidian' | 'pitch' | 'slate' | 'paper') {
		const p = THEME_PRESETS[preset];
		if (p) {
			this.config = { ...this.config, ...p };
			this.saveAndApply();
		}
	}

	setAccent(color: string) {
		this.config.accent = color;
		this.saveAndApply();
	}

	setFont(font: 'mono' | 'sans' | 'serif') {
		this.config.fontFamily = font;
		this.saveAndApply();
	}

	setRadius(radius: number) {
		this.config.borderRadius = radius;
		this.saveAndApply();
	}

	setShadow(level: 'none' | 'subtle' | 'card' | 'glow') {
		this.config.shadowLevel = level;
		this.saveAndApply();
	}

	toggleCustomizer() {
		this.isCustomizerOpen = !this.isCustomizerOpen;
	}

	saveAndApply() {
		if (browser) {
			localStorage.setItem('repograph:theme', JSON.stringify(this.config));
			this.apply();
		}
	}

	apply() {
		if (!browser) return;
		const root = document.documentElement;
		root.style.setProperty('--bg', this.config.bg);
		root.style.setProperty('--bg-panel', this.config.bgCard);
		root.style.setProperty('--bg-surface', this.config.bgSurface);
		root.style.setProperty('--border', this.config.border);
		root.style.setProperty('--text', this.config.text);
		root.style.setProperty('--text-dim', this.config.textDim);
		root.style.setProperty('--accent', this.config.accent);
		root.style.setProperty('--accent-glow', `${this.config.accent}26`);
		root.style.setProperty('--radius-sm', `${this.config.borderRadius}px`);
		root.style.setProperty('--radius-md', `${this.config.borderRadius + 4}px`);

		const fonts = {
			mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
			sans: "'Inter', system-ui, -apple-system, sans-serif",
			serif: "'Newsreader', Charter, Georgia, serif"
		};
		root.style.setProperty('--font', fonts[this.config.fontFamily] ?? fonts.mono);

		const shadows = {
			none: 'none',
			subtle: '0 2px 8px rgba(0,0,0,0.15)',
			card: '0 4px 16px rgba(0,0,0,0.3)',
			glow: `0 0 24px ${this.config.accent}33, 0 8px 32px rgba(0,0,0,0.5)`
		};
		root.style.setProperty('--shadow-card', shadows[this.config.shadowLevel]);
	}
}

export const themeState = new ThemeState();
