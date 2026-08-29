<script lang="ts">
	import { themeState, THEME_PRESETS } from '$lib/observatory-state/theme.svelte';

	const ACCENT_COLORS = [
		{ name: 'Blue', val: '#58a6ff' },
		{ name: 'Emerald', val: '#3fb950' },
		{ name: 'Purple', val: '#bc8cff' },
		{ name: 'Solar', val: '#d29922' },
		{ name: 'Pink', val: '#f778ba' },
		{ name: 'Cyan', val: '#39d2c0' },
		{ name: 'Sky', val: '#38bdf8' }
	];
</script>

{#if themeState.isCustomizerOpen}
	<div
		class="customizer-backdrop"
		role="dialog"
		aria-modal="true"
		aria-label="Theme and token customizer"
		onclick={(e) => e.target === e.currentTarget && themeState.toggleCustomizer()}
		onkeydown={(e) => e.key === 'Escape' && themeState.toggleCustomizer()}
		tabindex="-1"
	>
		<div class="customizer-panel" role="document">
			<div class="panel-header">
				<div class="header-title">
					<span class="ico">🎨</span>
					<h3>Theme & Token Customizer</h3>
				</div>
				<button class="btn-close" onclick={() => themeState.toggleCustomizer()}>✕</button>
			</div>

			<div class="panel-body">
				<!-- Presets -->
				<div class="control-group">
					<span class="group-title">Background Presets</span>
					<div class="presets-grid">
						<button
							class="preset-btn"
							class:active={themeState.config.preset === 'obsidian'}
							onclick={() => themeState.setPreset('obsidian')}
						>
							<div class="swatch" style="background: #0d1117; border: 1px solid #30363d;"></div>
							<span>Obsidian</span>
						</button>

						<button
							class="preset-btn"
							class:active={themeState.config.preset === 'pitch'}
							onclick={() => themeState.setPreset('pitch')}
						>
							<div class="swatch" style="background: #000000; border: 1px solid #262626;"></div>
							<span>Pitch Black</span>
						</button>

						<button
							class="preset-btn"
							class:active={themeState.config.preset === 'slate'}
							onclick={() => themeState.setPreset('slate')}
						>
							<div class="swatch" style="background: #0f172a; border: 1px solid #475569;"></div>
							<span>Slate Dark</span>
						</button>

						<button
							class="preset-btn"
							class:active={themeState.config.preset === 'paper'}
							onclick={() => themeState.setPreset('paper')}
						>
							<div class="swatch" style="background: #faf8f5; border: 1px solid #e2dcd4;"></div>
							<span>Warm Paper</span>
						</button>
					</div>
				</div>

				<!-- Accent Color Swatches -->
				<div class="control-group">
					<span class="group-title">Accent Color</span>
					<div class="accents-row">
						{#each ACCENT_COLORS as color}
							<button
								class="color-circle"
								class:active={themeState.config.accent === color.val}
								style="background: {color.val};"
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
				</div>

				<!-- Typography Engine -->
				<div class="control-group">
					<span class="group-title">Typography</span>
					<div class="btn-group">
						<button
							class="btn opt-btn"
							class:active={themeState.config.fontFamily === 'mono'}
							onclick={() => themeState.setFont('mono')}
						>
							Monospace
						</button>
						<button
							class="btn opt-btn"
							class:active={themeState.config.fontFamily === 'sans'}
							onclick={() => themeState.setFont('sans')}
						>
							Inter / Sans
						</button>
						<button
							class="btn opt-btn"
							class:active={themeState.config.fontFamily === 'serif'}
							onclick={() => themeState.setFont('serif')}
						>
							Editorial Serif
						</button>
					</div>
				</div>

				<!-- Border Radius -->
				<div class="control-group">
					<span class="group-title">Border Radius</span>
					<div class="btn-group">
						<button
							class="btn opt-btn"
							class:active={themeState.config.borderRadius === 0}
							onclick={() => themeState.setRadius(0)}>0px</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.borderRadius === 4}
							onclick={() => themeState.setRadius(4)}>4px</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.borderRadius === 8}
							onclick={() => themeState.setRadius(8)}>8px</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.borderRadius === 12}
							onclick={() => themeState.setRadius(12)}>12px</button
						>
					</div>
				</div>

				<!-- Shadow Elevation -->
				<div class="control-group">
					<span class="group-title">Card Shadow & Glow</span>
					<div class="btn-group">
						<button
							class="btn opt-btn"
							class:active={themeState.config.shadowLevel === 'none'}
							onclick={() => themeState.setShadow('none')}>Flat</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.shadowLevel === 'subtle'}
							onclick={() => themeState.setShadow('subtle')}>Subtle</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.shadowLevel === 'card'}
							onclick={() => themeState.setShadow('card')}>Card</button
						>
						<button
							class="btn opt-btn"
							class:active={themeState.config.shadowLevel === 'glow'}
							onclick={() => themeState.setShadow('glow')}>Glow ✨</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.customizer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 60;
		display: flex;
		justify-content: flex-end;
	}
	.customizer-panel {
		background: var(--bg-panel);
		border-left: 1px solid var(--border);
		width: 320px;
		height: 100%;
		box-shadow: var(--shadow-float);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}
	.panel-header {
		padding: 16px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.header-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.header-title h3 {
		font-size: 13px;
		color: var(--text-primary);
	}
	.btn-close {
		all: unset;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		&:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}
	}
	.panel-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.group-title {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.presets-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.preset-btn {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-subtle);
		background: var(--bg-surface);
		font-size: 11px;
		color: var(--text-primary);
		transition: all 0.15s;
		&:hover {
			background: var(--bg-hover);
			border-color: var(--border);
		}
		&.active {
			border-color: var(--accent);
			background: var(--accent-glow);
		}
	}
	.swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		flex: none;
	}
	.accents-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.color-circle {
		all: unset;
		cursor: pointer;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid transparent;
		transition: transform 0.15s;
		&:hover {
			transform: scale(1.15);
		}
		&.active {
			border-color: var(--text-primary);
			transform: scale(1.15);
		}
	}
	.custom-color-picker {
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		background: transparent;
	}
	.btn-group {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
		gap: 4px;
	}
	.opt-btn {
		font-size: 11px;
		padding: 6px 4px;
		text-align: center;
	}
</style>
