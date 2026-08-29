<script lang="ts">
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import { Icon } from 'fractalicons'
	import { icCubeHole, icIrisScan, icMicroscope, icPost, icSunLight, icMoonSat, icComponent } from 'fractalicons/iconoir'
	import { ThemePicker, themeState } from 'fractalthemer'
	import { page } from '$app/state';

	const isLogsMode = $derived(page.url.pathname.startsWith('/observatory/logs'));
	const isObsMode = $derived(page.url.pathname === '/observatory');
	const isScansMode =
		$derived(page.url.pathname.startsWith('/observatory/') && !isLogsMode && !isObsMode);
</script>

<header class="appheader">
		{#if !isLogsMode && !isObsMode && projectsState.projects.length > 0}
			<!-- Project Switcher Dropdown -->
			<div class="project-switcher">
				<span class="switch-lbl">Project:</span>
				<select
					class="project-select"
					value={projectsState.activeProjectSlug}
					onchange={(e) => {
						const slug = (e.target as HTMLSelectElement).value;
						window.location.href = `/observatory/${slug}`;
					}}
				>
					{#each projectsState.projects as p}
						<option value={p.slug}>{p.name}</option>
					{/each}
				</select>
			</div>
		{/if}
		<div class="row in-header">
		<a href="/observatory/projects" class="is-icon">
			<Icon icon={icCubeHole} size={16}/>
		</a>
			<a
				href="/observatory/{projectsState.activeProjectSlug || 'fractalmandala'}"
				class="is-icon"
				class:active={isScansMode}
			>
				<Icon icon={icIrisScan} size={16}/>
			</a>
			<a href="/observatory" class="is-icon" class:active={isObsMode}>
				<Icon icon={icMicroscope} size={16}/>
			</a>
			<a href="/observatory/logs" class="is-icon" class:active={isLogsMode}>
				<Icon icon={icPost} size={16}/>
			</a>
	<button
		type="button"
		class="is-icon"
		aria-label={themeState.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
		onclick={() => themeState.toggleMode()}
	>
		{#if themeState.isDark}
			<Icon icon={icSunLight} size={16}/>
		{:else}
			<Icon icon={icMoonSat} size={16}/>
		{/if}
	</button>
	<ThemePicker showModeToggle={false}>
		{#snippet triggerButton()}
			<button
				type="button"
				class="is-icon"
				aria-haspopup="dialog"
				aria-expanded={themeState.isOpen}
				title="Choose theme and background"
				onclick={(e) => {
					e.stopPropagation();
					themeState.togglePicker();
				}}
			>
				<Icon icon={icComponent} size={16}/>
			</button>
		{/snippet}
	</ThemePicker>
		</div>
</header>

<style>
	.project-switcher {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
	}
	.switch-lbl {
		color: var(--text-muted);
	}
	.project-select {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		outline: none;
		font-size: 11px;
		cursor: pointer;
		&:focus {
			border-color: var(--accent);
		}
	}
</style>
