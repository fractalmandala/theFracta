// The two fonts the whole app is set in.
//
// These drive --font-sans and --font-mono, the tokens every surface reads, so a
// change here is visible everywhere at once with no reload. An unset value is
// not a default written here — it removes the override, and the stylesheet's own
// declaration in _08_own.sass takes back over.

import { invoke } from '@tauri-apps/api/core';

export const FONT_KEY = 'fracta.appFonts';

type Stored = { sans?: string | null; mono?: string | null };

/** CSS needs the family quoted; a fallback keeps text rendering if it vanishes. */
function cssValue(family: string, generic: 'sans-serif' | 'monospace'): string {
	return `"${family.replace(/"/g, '')}", ${generic}`;
}

function apply(kind: 'sans' | 'mono', family: string | null): void {
	if (typeof document === 'undefined') return;
	const property = kind === 'sans' ? '--font-sans' : '--font-mono';
	if (family) {
		document.documentElement.style.setProperty(
			property,
			cssValue(family, kind === 'sans' ? 'sans-serif' : 'monospace')
		);
	} else {
		// Not "set it back to the old value" — remove the inline override so the
		// stylesheet's own declaration wins again. Anything else would freeze a
		// copy of whatever the stylesheet said at the time.
		document.documentElement.style.removeProperty(property);
	}
}

/**
 * Is this family actually monospaced, as the webview would render it?
 *
 * Measured rather than declared: a font the webview cannot use falls back, and
 * the measurement then describes the fallback — which is the honest answer,
 * because that is what the user would see.
 */
function isMonospaced(family: string): boolean {
	if (typeof document === 'undefined') return false;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) return false;
	ctx.font = `16px ${cssValue(family, 'monospace')}`;
	const narrow = ctx.measureText('i'.repeat(20)).width;
	const wide = ctx.measureText('W'.repeat(20)).width;
	return Math.abs(narrow - wide) < 0.5;
}

class AppFonts {
	/** null means "no override" — the stylesheet decides. */
	sans = $state<string | null>(null);
	mono = $state<string | null>(null);
	/** Every family installed, from the native side. Empty until loaded. */
	available = $state<string[]>([]);
	/** Why the list is empty, when it is. */
	unavailable = $state<string | null>(null);
	loaded = $state(false);

	/** Families that actually render monospaced. */
	monospaced = $derived(this.available.filter(isMonospaced));

	async load(): Promise<void> {
		if (this.loaded) return;
		const stored = read();
		this.sans = stored.sans ?? null;
		this.mono = stored.mono ?? null;
		apply('sans', this.sans);
		apply('mono', this.mono);

		try {
			// queryLocalFonts() is Chromium-only and WebKit does not implement it,
			// so the app's own webview cannot enumerate these itself.
			this.available = await invoke<string[]>('list_system_fonts');
			this.unavailable = this.available.length === 0 ? 'No fonts were reported by the system.' : null;
		} catch {
			this.available = [];
			this.unavailable = 'Installed fonts are listed by the desktop app, so they are unavailable in browser mode.';
		}
		this.loaded = true;
	}

	set(kind: 'sans' | 'mono', family: string | null): void {
		if (kind === 'sans') this.sans = family;
		else this.mono = family;
		apply(kind, family);
		write({ sans: this.sans, mono: this.mono });
	}
}

function read(): Stored {
	try {
		return JSON.parse(localStorage.getItem(FONT_KEY) || '{}');
	} catch {
		return {};
	}
}

function write(value: Stored): void {
	try {
		localStorage.setItem(FONT_KEY, JSON.stringify(value));
	} catch {
		/* storage unavailable — the choice stays for this session only */
	}
}

export const appFonts = new AppFonts();
