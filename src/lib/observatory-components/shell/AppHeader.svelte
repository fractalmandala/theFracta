<script lang="ts">
	import { projectsState } from '$lib/observatory-state/projects.svelte';
	import { Icon } from 'fractalicons';
	import { icCubeHole, icIrisScan, icMicroscope, icPost, icSunLight, icMoonSat, icComponent } from 'fractalicons/iconoir';
	import { ThemePicker, themeState } from 'fractalthemer';
	import { page } from '$app/state';

	const isLogsMode = $derived(page.url.pathname.startsWith('/observatory/logs'));
	const isObsMode = $derived(page.url.pathname === '/observatory');
	const isScansMode = $derived(page.url.pathname.startsWith('/observatory/') && !isLogsMode && !isObsMode);
</script>

<header class="appheader row ycenter xbetween gap-2xs pad-x-sm pad-y-2xs border-bottom">
	{#if !isLogsMode && !isObsMode && projectsState.projects.length > 0}
		<div class="row ycenter gap-2xs text-sm text-secondary">
			<span>Project</span>
			<select
				class="select text-sm"
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

	<nav class="row ycenter gap-2xs" aria-label="Observatory">
		<a href="/observatory/projects" class="button is-icon text-muted" title="Projects">
			<Icon icon={icCubeHole} size={16} />
		</a>
		<a
			href="/observatory/{projectsState.activeProjectSlug || 'fractalmandala'}"
			class="button is-icon text-muted"
			class:appheader-active={isScansMode}
			title="Scans"
		>
			<Icon icon={icIrisScan} size={16} />
		</a>
		<a href="/observatory" class="button is-icon text-muted" class:appheader-active={isObsMode} title="Observatory">
			<Icon icon={icMicroscope} size={16} />
		</a>
		<a href="/observatory/logs" class="button is-icon text-muted" class:appheader-active={isLogsMode} title="Logs">
			<Icon icon={icPost} size={16} />
		</a>
	</nav>

	<div class="row ycenter gap-2xs">
		<button
			type="button"
			class="button is-icon text-muted"
			aria-label={themeState.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
			onclick={() => themeState.toggleMode()}
		>
			{#if themeState.isDark}
				<Icon icon={icSunLight} size={16} />
			{:else}
				<Icon icon={icMoonSat} size={16} />
			{/if}
		</button>
		<ThemePicker showModeToggle={false}>
			{#snippet triggerButton()}
				<button
					type="button"
					class="button is-icon text-muted"
					aria-haspopup="dialog"
					aria-expanded={themeState.isOpen}
					title="Choose theme and background"
					onclick={(e) => {
						e.stopPropagation();
						themeState.togglePicker();
					}}
				>
					<Icon icon={icComponent} size={16} />
				</button>
			{/snippet}
		</ThemePicker>
	</div>
</header>
