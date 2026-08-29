<script lang="ts">
	import { themeState } from '$lib/observatory-state/theme.svelte';

	const ACCENT_COLORS = [
		{ name: 'Blue', val: '#58a6ff' },
		{ name: 'Emerald', val: '#3fb950' },
		{ name: 'Purple', val: '#bc8cff' },
		{ name: 'Solar', val: '#d29922' },
		{ name: 'Pink', val: '#f778ba' },
		{ name: 'Cyan', val: '#39d2c0' },
		{ name: 'Sky', val: '#38bdf8' },
	];

	type PresetId = 'obsidian' | 'pitch' | 'slate' | 'paper';
	type FontId = 'mono' | 'sans' | 'serif';
	type ShadowId = 'none' | 'subtle' | 'card' | 'glow';

	const PRESETS: Array<{ id: PresetId; name: string; bg: string; border: string }> = [
		{ id: 'obsidian', name: 'Obsidian', bg: '#0d1117', border: '#30363d' },
		{ id: 'pitch', name: 'Pitch Black', bg: '#000000', border: '#262626' },
		{ id: 'slate', name: 'Slate Dark', bg: '#0f172a', border: '#475569' },
		{ id: 'paper', name: 'Warm Paper', bg: '#faf8f5', border: '#e2dcd4' },
	];

	const FONTS: Array<{ id: FontId; label: string }> = [
		{ id: 'mono', label: 'Monospace' },
		{ id: 'sans', label: 'Inter / Sans' },
		{ id: 'serif', label: 'Editorial Serif' },
	];

	const RADII = [0, 4, 8, 12];
	const SHADOWS: Array<{ id: ShadowId; label: string }> = [
		{ id: 'none', label: 'Flat' },
		{ id: 'subtle', label: 'Subtle' },
		{ id: 'card', label: 'Card' },
		{ id: 'glow', label: 'Glow ✨' },
	];
</script>

{#if themeState.isCustomizerOpen}
	<div
		class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-top-2xl z-modal"
		role="dialog"
		aria-modal="true"
		aria-label="Theme and token customizer"
		onclick={(e) => e.target === e.currentTarget && themeState.toggleCustomizer()}
		onkeydown={(e) => e.key === 'Escape' && themeState.toggleCustomizer()}
		tabindex="-1"
	>
		<div class="dialog-card card radius-lg bg-dialog border shadow-lg box dialog-md dialog-theme-customizer">
			<header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
				<div class="row ycenter gap-2xs">
					<span>🎨</span>
					<h3 class="text-md weight-600 m-0">Theme & Token Customizer</h3>
				</div>
				<button class="button is-icon text-muted" onclick={() => themeState.toggleCustomizer()} aria-label="Close theme customizer">✕</button>
			</header>

			<div class="dialog-body box gap-md pad-x-sm pad-y-sm overflow-y-auto">
				<!-- Presets -->
				<section class="box gap-2xs">
					<span class="text-xs tt-u weight-600 text-muted">Background Presets</span>
					<div class="grid-2 gap-2xs">
						{#each PRESETS as p}
							<button
								class="preset-btn box gap-2xs pad-2xs text-sm cursor-pointer"
								class:preset-btn-active={themeState.config.preset === p.id}
								onclick={() => themeState.setPreset(p.id)}
							>
								<div class="preset-swatch border shrink-0" style="background: {p.bg}; --swatch-border: {p.border};"></div>
								<span class="grow min0 text-left">{p.name}</span>
							</button>
						{/each}
					</div>
				</section>

				<!-- Accent -->
				<section class="box gap-2xs">
					<span class="text-xs tt-u weight-600 text-muted">Accent Color</span>
					<div class="row wrap gap-2xs">
						{#each ACCENT_COLORS as color}
							<button
								class="accent-swatch"
								class:accent-swatch-active={themeState.config.accent === color.val}
								style="--swatch-color: {color.val};"
								title={color.name}
								onclick={() => themeState.setAccent(color.val)}
							></button>
						{/each}
						<input
							type="color"
							bind:value={themeState.config.accent}
							oninput={() => themeState.saveAndApply()}
							class="custom-color-picker"
							title="Custom Color"
						/>
					</div>
				</section>

				<!-- Typography -->
				<section class="box gap-2xs">
					<span class="text-xs tt-u weight-600 text-muted">Typography</span>
					<div class="row gap-2xs">
						{#each FONTS as font}
							<button
								class="button small ghost text-xs grow min0"
								class:button-primary={themeState.config.fontFamily === font.id}
								onclick={() => themeState.setFont(font.id)}
							>{font.label}</button>
						{/each}
					</div>
				</section>

				<!-- Border radius -->
				<section class="box gap-2xs">
					<span class="text-xs tt-u weight-600 text-muted">Border Radius</span>
					<div class="row gap-2xs">
						{#each RADII as r}
							<button
								class="button small ghost text-xs grow min0"
								class:button-primary={themeState.config.borderRadius === r}
								onclick={() => themeState.setRadius(r)}
							>{r}px</button>
						{/each}
					</div>
				</section>

				<!-- Shadow -->
				<section class="box gap-2xs">
					<span class="text-xs tt-u weight-600 text-muted">Card Shadow & Glow</span>
					<div class="row gap-2xs">
						{#each SHADOWS as s}
							<button
								class="button small ghost text-xs grow min0"
								class:button-primary={themeState.config.shadowLevel === s.id}
								onclick={() => themeState.setShadow(s.id)}
							>{s.label}</button>
						{/each}
					</div>
				</section>
			</div>
		</div>
	</div>
{/if}
